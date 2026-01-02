"use client";

import React, { useState, useEffect } from 'react';
import { useNodes } from '../hooks/useNodes';
import { apiService } from '../services/api';
import { NetworkStats } from '../types/api.types';
import { EarthView } from './EarthView';
import { NodeDetailPanel } from './NodeDetailPanel';
import { NodeDetailView } from './NodeDetailView'; // Import the new View
import { PlaygroundView } from './PlaygroundView';
import { Dashboard } from './Dashboard';
import { NodesListView } from './NodesListView';
import { HistoricalAnalysis } from './HistoricalAnalysis';
import { PurchaseView } from './PurchaseView'; // Import PurchaseView
import { AlertsView } from './AlertsView'; // Import AlertsView
import { StoragePlannerView } from './StoragePlannerView'; // Import StoragePlannerView
import { Layout } from './ui/Layout';
import { SettingsModal } from './ui/SettingsModal';
import { Network, RefreshCw, Loader2 } from 'lucide-react';
import { groupNodesByPubKey } from '../utils/nodeUtils';
import { PNode } from '../types/node.types';
import { ViewMode, AppSettings } from '../types';

function App() {
  // Global Settings
  const [settings, setSettings] = useState<AppSettings>({
    rpcEndpoint: 'https://api.xandeum.network',
    autoRefresh: true,
    refreshInterval: 7000,
    show3DOnMobile: false,
    theme: 'light', // Default theme
    network: 'mainnet' // Default network
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Data Fetching - Paginated for list view
  const {
    nodes,
    loading,
    error,
    refetch,
    lastUpdated,
    pagination,
    setPage,
    page,
    setStatus,
    setSort,
    setOrder,
    setIncludeOffline
  } = useNodes(settings);
  // ...


  // Fetch ALL nodes for Dashboard and EarthView (not paginated)
  const [allNodes, setAllNodes] = React.useState<PNode[]>([]);
  const [stats, setStats] = React.useState<NetworkStats | null>(null);
  const [allNodesLoading, setAllNodesLoading] = React.useState(true);

  const fetchAllNodes = React.useCallback(async () => {
    try {
      setAllNodesLoading(true);
      const [nodesResponse, statsResponse] = await Promise.all([
        apiService.getNodes({ page: 1, limit: 1000 }),
        apiService.getStats()
      ]);

      const processedNodes = groupNodesByPubKey(nodesResponse.nodes);
      setAllNodes(processedNodes);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setAllNodesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllNodes();
    let intervalId: NodeJS.Timeout;
    if (settings?.autoRefresh) {
      intervalId = setInterval(fetchAllNodes, settings.refreshInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchAllNodes, settings?.autoRefresh, settings?.refreshInterval]);

  // UI State
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isRefetching, setIsRefetching] = useState(false);
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState<string | undefined>(undefined);

  // Handle Manual Refresh with animation state
  const handleRefresh = async () => {
    setIsRefetching(true);
    await refetch();
    setTimeout(() => setIsRefetching(false), 500);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case 'Escape':
          setSelectedNode(null);
          setIsSettingsOpen(false);
          break;
        case 'r':
        case 'R':
          handleRefresh();
          break;
        case '1':
          setCurrentView(ViewMode.DASHBOARD);
          break;
        case '2':
          setCurrentView(ViewMode.NODES_LIST);
          break;
        case '3':
          setCurrentView(ViewMode.EXPLORER_3D);
          break;
        case '4':
          setCurrentView(ViewMode.ALERTS);
          break;
        case '5':
          setCurrentView(ViewMode.HISTORICAL_ANALYSIS);
          break;
        case '6':
          setCurrentView(ViewMode.PLAYGROUND);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refetch]);

  const handleNodeClick = (node: PNode) => {
    setSelectedNode(node);
  };

  const renderContent = () => {
    // If a node is selected, show the Detail Page immediately (acting as a sub-route overlay)
    // Note: NodeDetailView is typically an overlay, but here it replaces content. 
    // If we want persistence, we should probably keep the underlying view mounted but hidden? 
    // For now, let's allow NodeDetailView to take over, but for the main tabs, we persist them.
    if (selectedNode) {
      // Exception: If in Earth View, we keep context in the Earth View component itself usually, 
      // but here NodeDetailView is a full screen component. 
      // If we want to return to exact state, simply unsetting selectedNode works.
      // However, checking if we are in EarthView to show Panel vs View:
      if (currentView === ViewMode.EXPLORER_3D) {
        // In 3D mode, the DetailView is usually a side panel, not replacing the screen. 
        // The current code structure had logic: calling <NodeDetailView> if NOT 3D.
        // Let's preserve that logic but inside the persistence wrapper if possible, or just standard return.
        // Actually, for 3D view specifically, the original code returned the <EarthView> with a <NodeDetailPanel>.
        // So we don't return NodeDetailView here if 3D.
      } else {
        return (
          <NodeDetailView
            node={selectedNode}
            onBack={() => setSelectedNode(null)}
            onConnectRPC={(endpoint: string) => {
              setPlaygroundEndpoint(endpoint);
              setCurrentView(ViewMode.PLAYGROUND);
              setSelectedNode(null);
            }}
          />
        );
      }
    }

    // Helper for persistence. 
    // We render ALL heavy views, but hide them with CSS if not active.
    // Lighter views can be conditional if needed, but persistence is requested for "going back".

    return (
      <div className="w-full h-full relative">
        {/* DASHBOARD */}
        <div style={{ display: currentView === ViewMode.DASHBOARD && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <Dashboard
            nodes={allNodes}
            onNodeClick={handleNodeClick}
            onNavigateToNodes={() => setCurrentView(ViewMode.NODES_LIST)}
            autoRefresh={settings.autoRefresh}
          />
        </div>

        {/* NODES LIST */}
        <div style={{ display: currentView === ViewMode.NODES_LIST && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <NodesListView
            nodes={nodes}
            onNodeClick={handleNodeClick}
            pagination={pagination}
            currentPage={page}
            onPageChange={setPage}
            onStatusChange={setStatus}
            onSortChange={setSort}
            onOrderChange={setOrder}
            onIncludeOfflineChange={setIncludeOffline}
          />
        </div>

        {/* EARTH VIEW */}
        <div style={{ display: currentView === ViewMode.EXPLORER_3D ? 'block' : 'none', height: '100%' }}>
          {/* Loading State for Earth View specifically if needed, or stick to global loading? 
               Original code had specific loading return. Let's keep it simple. */}
          {loading && nodes.length === 0 && currentView === ViewMode.EXPLORER_3D ? (
            <div className="h-full w-full bg-root flex flex-col items-center justify-center text-text-primary">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-primary font-mono text-sm tracking-widest animate-pulse">INITIALIZING EARTH VIEW...</p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <EarthView
                nodes={allNodes}
                stats={stats}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNode?.pubkey}
                lastUpdated={lastUpdated}
                refetch={fetchAllNodes}
                isRefetching={allNodesLoading}
              />
              {/* Panel provided for 3D view context */}
              <NodeDetailPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                allNodes={nodes}
              />
            </div>
          )}
        </div>

        {/* OTHER VIEWS (Conditional is okay if they don't have complex state, but user asked for state maintenance. 
            Playground has text input state likely. Alerts might have scroll. 
            Let's persist Playground, Alerts, Historical, StoragePlanner, Purchase too.) 
        */}

        <div style={{ display: currentView === ViewMode.PLAYGROUND && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <PlaygroundView initialEndpoint={playgroundEndpoint} />
        </div>

        <div style={{ display: currentView === ViewMode.HISTORICAL_ANALYSIS && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <HistoricalAnalysis />
        </div>

        <div style={{ display: currentView === ViewMode.PURCHASE && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <PurchaseView />
        </div>

        <div style={{ display: currentView === ViewMode.ALERTS && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <AlertsView />
        </div>

        <div style={{ display: currentView === ViewMode.STORAGE_PLANNER && !selectedNode ? 'block' : 'none', height: '100%' }}>
          <StoragePlannerView />
        </div>

        {/* Error State Overlay if needed? 
            Original code returned Error State globally. 
            If error exists, we might want to show it. 
            But pure persistence means avoiding unmounts. 
            We can overlay the error.
        */}
        {error && (
          <div className="absolute inset-0 z-50 bg-root/90 backdrop-blur-sm flex items-center justify-center">
            <div className="max-w-md w-full bg-surface border border-red-500/30 rounded-xl p-8 text-center shadow-2xl">
              <div className="inline-flex p-3 rounded-full bg-red-500/10 mb-4 text-red-500">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Connection Failed</h3>
              <p className="text-red-600 dark:text-red-400/80 text-sm mb-6">{error}</p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-red-500/20 flex items-center justify-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
              </button>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onOpenSettings={() => setIsSettingsOpen(true)}
      network={settings.network}
      lastUpdated={lastUpdated}
    >
      {renderContent()}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </Layout>
  );
}

export default App;
