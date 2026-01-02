import React, { useState, useEffect } from 'react';
import { Play, Wifi, ChevronDown, CheckCircle, Code, Copy, AlertTriangle, Loader2, Database, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';
import { PublicKey } from '@solana/web3.js';
import { copyToClipboard } from '../utils/clipboardUtils';

// RPC Method Definitions
interface RpcMethod {
  name: string;
  description: string;
  endpoint: string;
  requestExample: object;
  responseExample: object;
  params?: { name: string; type: string; description: string; required: boolean }[];
}

const RPC_METHODS: RpcMethod[] = [
  {
    name: 'get-version',
    description: 'Returns the current pNode version information',
    endpoint: 'http://127.0.0.1:6000/rpc',
    requestExample: { jsonrpc: '2.0', method: 'get-version', params: [], id: 1 },
    responseExample: { jsonrpc: '2.0', result: { version: '1.0.0' }, id: 1 },
    params: []
  },
  {
    name: 'get-stats',
    description: 'Returns network statistics for the pNode',
    endpoint: 'http://127.0.0.1:6000/rpc',
    requestExample: { jsonrpc: '2.0', method: 'get-stats', params: [], id: 1 },
    responseExample: {
      jsonrpc: '2.0',
      result: {
        metadata: {
          total_bytes: 1048576000,
          total_pages: 1000,
          last_updated: 1672531200
        },
        stats: {
          cpu_percent: 15.5,
          ram_used: 536870912,
          ram_total: 8589934592,
          uptime: 86400,
          packets_received: 1250,
          packets_sent: 980,
          active_streams: 5
        },
        file_size: 1048576000
      },
      id: 1
    },
    params: []
  },
  {
    name: 'get-pods',
    description: 'Returns a list of all pods managed by this pNode',
    endpoint: 'http://127.0.0.1:6000/rpc',
    requestExample: { jsonrpc: '2.0', method: 'get-pods', params: [], id: 1 },
    responseExample: {
      jsonrpc: '2.0',
      result: {
        pods: [
          {
            address: '192.168.1.100:9001',
            version: '1.0.0',
            last_seen: '2023-12-01 14:30:00 UTC',
            last_seen_timestamp: 1672574200
          },
          {
            address: '10.0.0.5:9001',
            version: '1.0.1',
            last_seen: '2023-12-01 14:25:00 UTC',
            last_seen_timestamp: 1672573900
          }
        ],
        total_count: 2
      },
      id: 1
    },
    params: []
  },
  {
    name: 'get-pods-with-stats',
    description: 'Returns pods with detailed statistics including usage metrics',
    endpoint: 'http://127.0.0.1:6000/rpc',
    requestExample: { jsonrpc: '2.0', method: 'get-pods-with-stats', params: [], id: 1 },
    responseExample: {
      error: null,
      id: 1,
      jsonrpc: '2.0',
      result: {
        pods: [
          {
            address: '173.212.207.32:9001',
            is_public: true,
            last_seen_timestamp: 1767091603,
            pubkey: 'EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL',
            rpc_port: 6000,
            storage_committed: 340000000000,
            storage_usage_percent: 0.00001487970588235294,
            storage_used: 50591,
            uptime: 1321782,
            version: '0.8.0'
          },
          {
            address: '194.164.163.83:9001',
            is_public: false,
            last_seen_timestamp: 1767091604,
            pubkey: '5guf8siNWFiS2jY2FKTLWQH6vhMUABe55kLxubCP9BjY',
            rpc_port: 6000,
            storage_committed: 200000000000,
            storage_usage_percent: 0.000047065,
            storage_used: 94130,
            uptime: 1355814,
            version: '0.8.0'
          }
        ],
        total_count: 2
      }
    },
    params: []
  }
];

// Code generation helpers
const generateCurl = (method: string, endpoint: string) => `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "${method}",
    "params": [],
    "id": 1
  }'`;

const generatePython = (method: string, endpoint: string) => `import requests
import json

url = "${endpoint}"
payload = {
    "jsonrpc": "2.0",
    "method": "${method}",
    "params": [],
    "id": 1
}

response = requests.post(url, json=payload)
print(json.dumps(response.json(), indent=2))`;

const generateJavaScript = (method: string, endpoint: string) => `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: '${method}',
    params: [],
    id: 1
  })
});

const data = await response.json();
console.log(data);`;

const generateBash = (method: string, endpoint: string) => `#!/bin/bash

ENDPOINT="${endpoint}"
METHOD="${method}"

curl -X POST "$ENDPOINT" \\
  -H "Content-Type: application/json" \\
  -d "{\\"jsonrpc\\":\\"2.0\\",\\"method\\":\\"$METHOD\\",\\"params\\":[],\\"id\\":1}"`;

type Tab = 'methods' | 'registered-nodes' | 'custom';
type CodeLang = 'curl' | 'python' | 'javascript' | 'bash';

interface ApiResponse {
  data: unknown;
  error?: unknown;
  status: 'success' | 'error' | 'idle';
  statusCode?: number;
  duration?: number;
}

interface RegisteredNode {
  pubkey: string;
  owner: string;
  manager: string;
  version: string;
  major: number;
  minor: number;
  timestamp: number;
  registered_at_utc: string;
  registered_at_local: string;
}

interface PlaygroundViewProps {
  initialEndpoint?: string;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ initialEndpoint }) => {
  const [activeTab, setActiveTab] = useState<Tab>('methods');
  const [selectedMethod, setSelectedMethod] = useState<RpcMethod>(RPC_METHODS[0]);
  const [customEndpoint, setCustomEndpoint] = useState('http://127.0.0.1:6000/rpc');
  const [customParams, setCustomParams] = useState('[]');
  const [selectedLang, setSelectedLang] = useState<CodeLang>('curl');

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse>({ status: 'idle', data: null });

  // Registered nodes state
  const [nodesLoading, setNodesLoading] = useState(false);
  const [registeredNodes, setRegisteredNodes] = useState<RegisteredNode[]>([]);
  const [nodesError, setNodesError] = useState<string | null>(null);

  // Custom endpoint state
  useEffect(() => {
    if (initialEndpoint) {
      setCustomEndpoint(initialEndpoint);
      // Automatically switch to methods tab if an endpoint is provided
      setActiveTab('methods');
    }
  }, [initialEndpoint]);
  const [customUrl, setCustomUrl] = useState('https://podcredits.xandeum.network/api/pods-credits');
  const [customResponse, setCustomResponse] = useState<unknown>(null);
  const [customLoading, setCustomLoading] = useState(false);

  const handleMethodSelect = (method: RpcMethod) => {
    setSelectedMethod(method);
    setCustomEndpoint(method.endpoint);
    setCustomParams('[]');
    setResponse({ status: 'idle', data: null });
  };

  const sendRpcRequest = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      let parsedParams: unknown[] = [];
      try {
        parsedParams = JSON.parse(customParams);
      } catch (_e) {
        setResponse({
          status: 'error',
          data: { error: { code: -32700, message: "Parse error: Invalid JSON params" } },
          duration: 0,
          statusCode: 400
        });
        setLoading(false);
        return;
      }

      // Make direct fetch call to custom endpoint
      const res = await fetch(customEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: selectedMethod.name,
          params: parsedParams,
          id: 1
        })
      });

      const data = await res.json();

      if (data.error) {
        setResponse({
          status: 'error',
          data: data,
          duration: Date.now() - startTime,
          statusCode: res.status
        });
      } else {
        setResponse({
          status: 'success',
          data: data,
          duration: Date.now() - startTime,
          statusCode: res.status
        });
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network Error";
      setResponse({
        status: 'error',
        data: { error: message },
        duration: Date.now() - startTime,
        statusCode: 500
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Decoding Logic ---
  const decodeNodeAccount = (base64Data: string) => {
    // Ported from Python/JS logic provided
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    if (bytes.length !== 1040) throw new Error('Invalid length');

    const ownerBytes = bytes.slice(0, 32);
    const major = bytes[32];
    const minor = bytes[33];
    const timestampBytes = bytes.slice(34, 38);
    const timestamp = new DataView(timestampBytes.buffer).getUint32(0, true); // LE
    const managerBytes = bytes.slice(42, 74);

    // Use PublicKey to encode to base58 (safest way to avoid bs58 undefined)
    const owner = new PublicKey(ownerBytes).toBase58();
    const manager = new PublicKey(managerBytes).toBase58();

    const registeredAt = new Date(timestamp * 1000);
    return {
      owner,
      manager,
      major,
      minor,
      version: `${major}.${minor}`,
      timestamp,
      registered_at_utc: registeredAt.toUTCString(),
      registered_at_local: registeredAt.toLocaleString(),
    };
  };

  const fetchRegisteredNodes = async () => {
    setNodesLoading(true);
    setNodesError(null);
    const payload = {
      method: 'getProgramAccounts',
      jsonrpc: '2.0',
      params: ['6Bzz3KPvzQruqBg2vtsvkuitd6Qb4iCcr5DViifCwLsL', { encoding: 'jsonParsed', commitment: 'confirmed', filters: [{ dataSize: 1040 }] }],
      id: 'becd787d-534a-4465-9fd3-68a836ab38b3',
    };
    try {
      const res = await fetch('https://api.devnet.xandeum.com:8899/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.result) {
        const decodedNodes = data.result.map((item: { pubkey: string; account: { data: string[] } }) => ({
          pubkey: item.pubkey,
          ...decodeNodeAccount(item.account.data[0]),
        }));
        setRegisteredNodes(decodedNodes);
      } else {
        setNodesError('Failed to fetch registered nodes');
      }
    } catch (err) {
      console.error(err);
      setNodesError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setNodesLoading(false);
    }
  };

  const fetchCustomEndpoint = async () => {
    setCustomLoading(true);
    try {
      const res = await fetch(customUrl);
      const data = await res.json();
      setCustomResponse(data);
    } catch (err) {
      setCustomResponse({ error: err instanceof Error ? err.message : 'Failed to fetch' });
    } finally {
      setCustomLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    await copyToClipboard(text);
  };

  const renderCodeExample = () => {
    let code = '';
    switch (selectedLang) {
      case 'curl':
        code = generateCurl(selectedMethod.name, customEndpoint);
        break;
      case 'python':
        code = generatePython(selectedMethod.name, customEndpoint);
        break;
      case 'javascript':
        code = generateJavaScript(selectedMethod.name, customEndpoint);
        break;
      case 'bash':
        code = generateBash(selectedMethod.name, customEndpoint);
        break;
    }

    return (
      <div className="relative bg-root border border-border-subtle rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-surface border-b border-border-subtle">
          <div className="flex gap-2">
            {(['curl', 'python', 'javascript', 'bash'] as CodeLang[]).map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${selectedLang === lang
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text-primary'
                  }`}
              >
                {lang === 'javascript' ? 'JS' : lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleCopyToClipboard(code)}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-text-primary overflow-x-auto custom-scrollbar">
          {code}
        </pre>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-root">

      {/* Tab Navigation */}
      <div className="border-b border-border-subtle bg-surface px-6">
        <div className="flex gap-1">
          {[
            { id: 'methods' as Tab, label: 'RPC Methods', icon: Code },
            { id: 'registered-nodes' as Tab, label: 'Registered Nodes', icon: Database },
            { id: 'custom' as Tab, label: 'Custom Endpoints', icon: ExternalLink }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Security Warning */}
      <div className="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <strong>Security Notice:</strong> Be cautious when exposing pNode RPC endpoints on public IPs.
            These endpoints have no built-in rate limiting. Consider using a reverse proxy with authentication.
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'methods' && (
          <div className="h-full flex">
            {/* Left: Method List & Docs */}
            <div className="w-1/3 border-r border-border-subtle overflow-y-auto custom-scrollbar p-6 space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Available Methods</h3>
              {RPC_METHODS.map(method => (
                <button
                  key={method.name}
                  onClick={() => handleMethodSelect(method)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selectedMethod.name === method.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border-subtle hover:border-primary/50 bg-surface'
                    }`}
                >
                  <div className="font-mono text-sm font-bold text-text-primary mb-1">{method.name}</div>
                  <div className="text-xs text-text-muted">{method.description}</div>
                </button>
              ))}
            </div>

            {/* Right: Method Details & Testing */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary mb-2">{selectedMethod.name}</h2>
                <p className="text-text-muted">{selectedMethod.description}</p>
              </div>

              {/* Code Examples */}
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Code Examples</h3>
                {renderCodeExample()}
              </div>

              {/* Request Example */}
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Request Example</h3>
                <pre className="bg-root border border-border-subtle rounded-lg p-4 text-xs font-mono text-text-primary overflow-x-auto">
                  {JSON.stringify(selectedMethod.requestExample, null, 2)}
                </pre>
              </div>

              {/* Response Example */}
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Response Example</h3>
                <pre className="bg-root border border-border-subtle rounded-lg p-4 text-xs font-mono text-text-primary overflow-x-auto">
                  {JSON.stringify(selectedMethod.responseExample, null, 2)}
                </pre>
              </div>

              {/* Live Testing */}
              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Test Live</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-primary focus:border-primary outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Parameters (JSON Array)
                    </label>
                    <textarea
                      value={customParams}
                      onChange={(e) => setCustomParams(e.target.value)}
                      className="w-full h-24 bg-surface border border-border-subtle rounded-lg p-4 text-sm font-mono text-text-primary outline-none resize-none focus:border-primary"
                      spellCheck={false}
                    />
                  </div>

                  <button
                    onClick={sendRpcRequest}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 ${loading
                      ? 'bg-sheet text-text-muted cursor-not-allowed'
                      : 'bg-[#0f172a] hover:bg-black text-white shadow-xl shadow-black/20'
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Play size={24} className="fill-current" />
                        Execute Method
                      </>
                    )}
                  </button>

                  {response.status !== 'idle' && (
                    <div className="bg-root border border-border-subtle rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-text-muted uppercase">Response</span>
                        {response.status === 'success' && (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle size={12} />
                            Success ({response.duration}ms)
                          </span>
                        )}
                      </div>
                      <pre className="text-xs font-mono text-text-primary overflow-x-auto custom-scrollbar">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registered-nodes' && (
          <div className="h-full overflow-y-auto custom-scrollbar p-8 space-y-8 bg-sheet">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-text-primary mb-3">Registered Nodes</h2>
                <p className="text-text-muted max-w-2xl leading-relaxed">
                  Direct query to Solana mainnet-beta / devnet program accounts.
                  Decodes binary data from <code className="mx-1 px-2 py-0.5 bg-primary/10 text-primary rounded font-bold">6Bzz3KPvzQruqBg2vtsvkuitd6Qb4iCcr5DViifCwLsL</code>.
                </p>
              </div>

              <button
                onClick={fetchRegisteredNodes}
                disabled={nodesLoading}
                className={`px-8 py-4 rounded-xl font-black text-lg flex items-center gap-3 transition-all transform active:scale-95 shadow-2xl ${nodesLoading
                  ? 'bg-sheet text-text-muted cursor-not-allowed'
                  : 'bg-[#0f172a] hover:bg-black text-white shadow-black/30 hover:-translate-y-1'
                  }`}
              >
                {nodesLoading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Database size={24} />
                    Fetch Registered Nodes
                  </>
                )}
              </button>
            </div>

            {nodesError && (
              <div className="bg-red-500/10 border-2 border-red-500/20 rounded-xl p-6 text-red-500 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <AlertTriangle size={24} />
                <span className="font-bold">{nodesError}</span>
              </div>
            )}

            {registeredNodes.length > 0 && (
              <div className="bg-surface border-2 border-border-strong rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0f172a] text-white">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-[0.2em] border-r border-white/5">Account Pubkey</th>
                        <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-[0.2em] border-r border-white/5">Owner</th>
                        <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-[0.2em] border-r border-white/5">Manager</th>
                        <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-[0.2em] border-r border-white/5">Version</th>
                        <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-[0.2em]">Registered At (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-white">
                      {registeredNodes.map((n, idx) => (
                        <tr key={n.pubkey} className="hover:bg-primary/[0.03] transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs text-text-primary font-bold border-r border-border-subtle group-hover:text-primary transition-colors">{n.pubkey}</td>
                          <td className="px-6 py-4 font-mono text-xs text-text-primary border-r border-border-subtle">{n.owner}</td>
                          <td className="px-6 py-4 font-mono text-xs text-text-primary border-r border-border-subtle">{n.manager}</td>
                          <td className="px-6 py-4 font-mono text-sm font-black text-secondary border-r border-border-subtle">
                            <span className="bg-secondary/10 px-2 py-1 rounded">{n.version}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-text-primary">{n.registered_at_utc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!nodesLoading && registeredNodes.length === 0 && !nodesError && (
              <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed border-border-subtle rounded-3xl opacity-50">
                <Database size={48} className="text-text-muted mb-4" />
                <p className="font-bold text-text-muted">Click the button above to load node data</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-primary mb-2">Custom Endpoints</h2>
              <p className="text-text-muted mb-4">
                Test custom GET endpoints that return JSON data
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://podcredits.xandeum.network/api/pods-credits"
                    className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-primary focus:border-primary outline-none font-mono"
                  />
                </div>

                <button
                  onClick={fetchCustomEndpoint}
                  disabled={customLoading}
                  className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all transform active:scale-95 ${customLoading
                    ? 'bg-sheet text-text-muted cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/30'
                    }`}
                >
                  {customLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Fetch Data
                    </>
                  )}
                </button>

                {!!customResponse && (
                  <div className="bg-root border border-border-subtle rounded-lg p-4">
                    <div className="text-xs font-bold text-text-muted uppercase mb-2">Response</div>
                    <pre className="text-xs font-mono text-text-primary overflow-x-auto custom-scrollbar">
                      {JSON.stringify(customResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};