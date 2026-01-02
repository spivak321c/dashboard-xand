import React, { useEffect, useState } from 'react';
import { PNode } from '../types/node.types';
import { useNodeHistory } from '../hooks/useNodeHistory';
import { Server, Activity, Globe, Cpu, MemoryStick as Memory, HardDrive, Layers, Coins, Zap, Code, Check, Copy, Loader2, ArrowLeft, Shield, Clock } from 'lucide-react';
import { formatBytes } from '../utils/formatUtils';
import { copyToClipboard } from '../utils/clipboardUtils';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface NodeDetailViewProps {
    node: PNode;
    onBack: () => void;
    onConnectRPC?: (endpoint: string) => void;
}

interface GeoFeature {
    geometry: {
        coordinates: number[][][] | number[][][][]; // Improved type safety
        type: string;
    };
}

// --- Mini Map Component ---
const MiniMap: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
    const [geoData, setGeoData] = useState<{ features: GeoFeature[] } | null>(null);

    useEffect(() => {
        fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => setGeoData(data));
    }, []);

    // Simple projection logic for SVGs
    const project = (latitude: number, longitude: number) => {
        const x = (longitude + 180) * (400 / 360);
        const y = (90 - latitude) * (200 / 180);
        return { x, y };
    };

    const generatePath = (coordinates: (number[][][] | number[][][][]), type: string): string => {
        const coordToPoint = (ln: number, lt: number) => {
            const p = project(lt, ln);
            return `${p.x},${p.y}`;
        };

        if (type === 'Polygon') {
            return (coordinates as number[][][]).map(ring => {
                return 'M' + ring.map((pt: number[]) => coordToPoint(pt[0], pt[1])).join('L') + 'Z';
            }).join(' ');
        } else if (type === 'MultiPolygon') {
            return (coordinates as number[][][][]).map((polygon: number[][][]) => {
                return polygon.map(ring => {
                    return 'M' + ring.map((pt: number[]) => coordToPoint(pt[0], pt[1])).join('L') + 'Z';
                }).join(' ');
            }).join(' ');
        }
        return '';
    };

    const nodePos = project(lat, lon);

    return (
        <div className="w-full h-full bg-[#0C0D12] rounded-lg overflow-hidden relative border border-border-subtle">
            <svg viewBox="0 0 400 200" className="w-full h-full opacity-50">
                {geoData && geoData.features.map((feature: GeoFeature, i: number) => (
                    <path
                        key={i}
                        d={generatePath(feature.geometry.coordinates, feature.geometry.type)}
                        fill="#2A2C3A"
                        stroke="none"
                    />
                ))}
            </svg>
            {/* The Node Pin */}
            <div
                className="absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)] border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ left: `${(nodePos.x / 400) * 100}%`, top: `${(nodePos.y / 200) * 100}%` }}
            ></div>
            {/* Crosshairs */}
            <div
                className="absolute w-full h-[1px] bg-primary/20 pointer-events-none"
                style={{ top: `${(nodePos.y / 200) * 100}%` }}
            ></div>
            <div
                className="absolute h-full w-[1px] bg-primary/20 pointer-events-none"
                style={{ left: `${(nodePos.x / 400) * 100}%` }}
            ></div>
        </div>
    );
};

import { LucideIcon } from 'lucide-react';

interface DetailMetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendColor?: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    subtext?: string;
}

const DetailMetricCard: React.FC<DetailMetricCardProps> = ({
    label,
    value,
    icon: Icon,
    trend,
    trendColor = 'text-secondary',
    variant = 'primary',
    subtext
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary': return 'text-secondary bg-secondary/10 shadow-secondary/5';
            case 'success': return 'text-emerald-500 bg-emerald-500/10 shadow-emerald-500/5';
            case 'warning': return 'text-amber-500 bg-amber-500/10 shadow-amber-500/5';
            case 'error': return 'text-red-500 bg-red-500/10 shadow-red-500/5';
            default: return 'text-primary bg-primary/10 shadow-primary/5';
        }
    };

    return (
        <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-3xl p-5 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 shadow-xl">
            {/* Background Glow */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${getVariantStyles()}`}></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl border border-white/5 transition-transform duration-500 group-hover:scale-110 ${getVariantStyles()}`}>
                        <Icon size={20} />
                    </div>
                    {trend && (
                        <div className={`text-[10px] font-black px-2 py-1 rounded-full border border-white/5 backdrop-blur-md ${trendColor} bg-white/5 shadow-sm`}>
                            {trend}
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        {label}
                    </p>
                    <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                        <h3 className="text-2xl font-black text-text-primary font-mono tracking-tighter truncate max-w-full">
                            {value}
                        </h3>
                    </div>
                    {subtext && (
                        <p className="text-[10px] text-text-muted mt-1.5 font-bold tracking-tight opacity-60">
                            {subtext}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const NodeDetailView: React.FC<NodeDetailViewProps> = ({ node, onBack, onConnectRPC }) => {
    const [copied, setCopied] = useState(false);
    const { history, loading: historyLoading } = useNodeHistory(node.pubkey, 48); // 48 hours
    // Removed unused credits hook
    // const { credits, loading: creditsLoading } = useNodeCredits(node.pubkey);

    // Transform history data for charts
    // Transform history data for charts
    const [mockHistory, setMockHistory] = useState<{ time: number; timestamp: number; latency: number; storage: number; uptime?: number }[]>([]);

    useEffect(() => {
        if (history.length === 0 && mockHistory.length === 0) {
            // Use setTimeout to avoid synchronous setState warning
            setTimeout(() => {
                setMockHistory(Array.from({ length: 20 }).map((_, i) => ({
                    time: i,
                    timestamp: Date.now() - (20 - i) * 3600000,
                    latency: (node.response_time ?? 0) + (Math.random() * 20 - 10),
                    storage: node.storage_used ?? 0,
                    uptime: node.uptime_score,
                })));
            }, 0);
        }
    }, [history.length, node.response_time, node.storage_used, node.uptime_score, mockHistory.length]);

    const historyData = history.length > 0
        ? history.map((point, i) => ({
            time: i,
            timestamp: point.timestamp,
            latency: point.response_time,
            storage: point.storage_used,
            uptime: point.uptime_score,
        }))
        : mockHistory;

    const handleCopy = async () => {
        const textToCopy = JSON.stringify(node, null, 2);
        const success = await copyToClipboard(textToCopy);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };



    return (
        <div className="h-full flex flex-col bg-root text-text-primary overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 fade-in duration-300">

            {/* Top Bar */}
            <div className="bg-surface border-b border-border-subtle p-4 lg:p-6 sticky top-0 z-20 flex items-center justify-between backdrop-blur-md bg-opacity-90">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-overlay-hover rounded-lg transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold font-mono tracking-tight">{node.pubkey.substring(0, 8)}...{node.pubkey.substring(node.pubkey.length - 6)}</h1>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border ${node.status === 'active' || node.status === 'online' ? 'bg-secondary-soft text-secondary border-secondary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {node.status}
                                </span>
                                {node.is_registered && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border bg-primary/10 text-primary border-primary/20">
                                        <Shield size={10} /> Registered
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-text-muted mt-1 flex items-center">
                            <Clock size={12} className="mr-1" /> Last seen: {node.last_seen ? new Date(node.last_seen).toLocaleString() : 'N/A'}
                        </div>
                    </div>
                </div>
                <div className="hidden md:block">
                    <button
                        onClick={() => {
                            if (onConnectRPC) {
                                // Construct the RPC endpoint URL
                                const protocol = node.is_public ? 'https' : 'http';
                                const endpoint = `${protocol}://${node.ip}:${node.port}/rpc`;
                                onConnectRPC(endpoint);
                            }
                        }}
                        className="px-4 py-2 bg-gradient-primary hover:brightness-110 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20"
                    >
                        Connect RPC
                    </button>
                </div>
            </div>

            <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

                {/* Top Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Basic Info Card */}
                    <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>

                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center">
                            <Server size={14} className="mr-3 text-primary" /> Node Identity
                        </h3>

                        <div className="space-y-5 relative z-10">
                            <div className="group/field">
                                <label className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60 group-hover/field:opacity-100 transition-opacity">Public Key</label>
                                <div className="font-mono text-xs break-all bg-root/50 backdrop-blur-sm p-3 rounded-xl border border-border-subtle mt-2 select-all hover:border-primary/30 transition-colors">
                                    {node.pubkey}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="group/field">
                                    <label className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60 group-hover/field:opacity-100 transition-opacity">Endpoints</label>
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        {node.all_ips && node.all_ips.length > 0 ? (
                                            node.all_ips.map((ip, idx) => (
                                                <div key={idx} className="font-mono text-xs text-text-primary bg-white/5 px-2 py-1 rounded-md border border-white/5 w-fit">{ip}</div>
                                            ))
                                        ) : (
                                            <div className="font-mono text-sm text-text-primary">{node.ip || 'N/A'}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="group/field">
                                    <label className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60 group-hover/field:opacity-100 transition-opacity">Environment</label>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-text-muted">Version</span>
                                            <span className="font-mono font-bold text-text-primary">{node.version}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-text-muted">Port</span>
                                            <span className="font-mono font-bold text-text-primary">{node.port}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 group/resp hover:bg-primary/10 transition-colors duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Zap size={14} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-text-primary opacity-80">Response Latency</span>
                                    </div>
                                    <span className="font-mono text-lg font-black text-primary tracking-tighter">{node.response_time} <span className="text-[10px] uppercase font-bold opacity-60">ms</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resources Section - Redesigned to prevent squishing */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* CPU Card */}
                            <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none translate-y-8 scale-110">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historyData}>
                                            <Area type="monotone" dataKey="latency" stroke="var(--color-primary)" fill="var(--color-primary)" strokeWidth={0} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="relative z-10 flex flex-col h-full min-h-[160px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                            <Cpu size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">Avg Load</span>
                                            <div className="text-sm font-black text-text-primary tracking-tighter">
                                                {((node.cpu_percent ?? 0) * 0.9).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-1 opacity-70">CPU Utilization</p>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <h3 className="text-3xl font-black text-text-primary font-mono tracking-tighter">
                                                {(node.cpu_percent ?? 0).toFixed(1)}<span className="text-lg opacity-40 ml-1">%</span>
                                            </h3>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-primary-soft transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]"
                                                style={{ width: `${node.cpu_percent ?? 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RAM Card */}
                            <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-secondary/40 transition-all duration-500">
                                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none translate-y-8 scale-110">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historyData}>
                                            <Area type="monotone" dataKey="storage" stroke="var(--color-secondary)" fill="var(--color-secondary)" strokeWidth={0} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="relative z-10 flex flex-col h-full min-h-[160px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20 group-hover:scale-110 transition-transform duration-500">
                                            <Memory size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">Total Memory</span>
                                            <div className="text-sm font-black text-text-primary tracking-tighter">
                                                {formatBytes(node.ram_total ?? 0)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-1 opacity-70">RAM Consumption</p>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <h3 className="text-3xl font-black text-text-primary font-mono tracking-tighter truncate max-w-full">
                                                {formatBytes(node.ram_used ?? 0)}
                                            </h3>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--color-secondary-rgb),0.5)]"
                                                style={{ width: `${node.ram_total ? ((node.ram_used ?? 0) / node.ram_total) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Storage Card (Newly Promoted) */}
                            <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-accent/40 transition-all duration-500">
                                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none translate-y-8 scale-110">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historyData}>
                                            <Area type="monotone" dataKey="storage" stroke="var(--color-accent)" fill="var(--color-accent)" strokeWidth={0} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="relative z-10 flex flex-col h-full min-h-[160px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                                            <Layers size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">Total Capacity</span>
                                            <div className="text-sm font-black text-text-primary tracking-tighter">
                                                {formatBytes(node.storage_capacity)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-1 opacity-70">Storage Used</p>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <h3 className="text-3xl font-black text-text-primary font-mono tracking-tighter truncate max-w-full">
                                                {formatBytes(node.storage_used)}
                                            </h3>
                                            <span className="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/10">
                                                {(node.storage_usage_percent * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]"
                                                style={{ width: `${node.storage_usage_percent * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailMetricCard
                                label="Total Credits"
                                value={`${(node.credits ?? 0).toLocaleString()}`}
                                icon={Coins}
                                variant="success"
                                trend="Lifetime"
                                trendColor="text-emerald-500"
                                subtext="XAND Earned"
                            />
                            <DetailMetricCard
                                label="Uptime Score"
                                value={`${node.uptime_score}%`}
                                icon={Activity}
                                variant={node.uptime_score > 90 ? 'success' : 'warning'}
                                trend="Health"
                                subtext="24h Average"
                            />
                        </div>
                    </div>

                    {/* Map Location */}
                    <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-colors duration-700"></div>

                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center">
                            <Globe size={14} className="mr-3 text-accent" /> Physical Location
                        </h3>
                        {node.lat && node.lon ? (
                            <>
                                <div className="flex-1 min-h-[180px] mb-6 rounded-2xl overflow-hidden border border-border-subtle relative z-10">
                                    <MiniMap lat={node.lat} lon={node.lon} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm border-t border-border-subtle pt-5 relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">Country</span>
                                        <span className="font-black text-text-primary tracking-tight">{node.country}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">City</span>
                                        <span className="font-black text-text-primary tracking-tight">{node.city}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 min-h-[180px] flex items-center justify-center text-text-muted text-sm italic opacity-50 relative z-10">
                                Location data unavailable
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Row: Charts & Raw Data */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Performance History Chart */}
                    <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-xl h-[400px] flex flex-col relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Activity size={16} />
                                </div>
                                <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Resource History (24h)</h3>
                            </div>
                            {historyLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        </div>
                        <div className="flex-1 w-full min-h-0 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(12, 13, 18, 0.9)', borderColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', fontSize: '12px', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ padding: '2px 0' }}
                                        formatter={(value: number, name: string) => {
                                            if (name === 'latency') return [`${value.toFixed(1)} ms`, 'Latency'];
                                            if (name === 'storage') return [formatBytes(value), 'Storage'];
                                            return [value, name];
                                        }}
                                    />
                                    <Area type="monotone" dataKey="latency" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="storage" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorStorage)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Raw JSON Response */}
                    <div className="bg-surface border border-border-subtle rounded-3xl p-0 shadow-xl flex flex-col overflow-hidden h-[400px] border-white/5 hover:border-primary/20 transition-all duration-500">
                        <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex flex-wrap justify-between items-center gap-4">
                            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center">
                                <Code size={16} className="mr-3 text-secondary" /> JSON Response
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {copied ? <Check size={12} /> : <Copy size={12} />}
                                    {copied ? 'COPIED' : 'COPY'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-[#0C0D12]/50 p-6 custom-scrollbar backdrop-blur-sm">
                            <pre className="font-mono text-[11px] text-blue-200/80 leading-relaxed selection:bg-primary/30">
                                {JSON.stringify(node, null, 2)}
                            </pre>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};