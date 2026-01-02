import React, { useEffect, useState, useCallback } from 'react';
import { PNode } from '../types/node.types';
import { NetworkStats, LatencyDistribution } from '../types/api.types';
import { apiService } from '../services/api';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, ReferenceLine } from 'recharts';
import { Server, Activity, Globe, Wifi, Zap, Cpu, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, LayoutDashboard, Eye, EyeOff, HardDrive, ChevronUp, ChevronDown, Loader2, Layers, Lock, Clock, Network, Container } from 'lucide-react';
import { StorageUsageChart } from './StorageUsageChart';
import { formatBytes, formatNumber, formatDuration } from '../utils/formatUtils';

interface DashboardProps {
  nodes: PNode[];
  onNodeClick?: (node: PNode) => void;
  onNavigateToNodes?: () => void;
  autoRefresh?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: number;
  trendText?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  loading?: boolean;
}

const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  trendText,
  variant = 'neutral',
  loading = false
}: MetricCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return 'border-primary/20 text-primary shadow-primary/5';
      case 'secondary': return 'border-secondary/20 text-secondary shadow-secondary/5';
      case 'accent': return 'border-accent/20 text-accent shadow-accent/5';
      case 'success': return 'border-emerald-500/20 text-emerald-500 shadow-emerald-500/5';
      case 'warning': return 'border-amber-500/20 text-amber-500 shadow-amber-500/5';
      case 'error': return 'border-red-500/20 text-red-500 shadow-red-500/5';
      default: return 'border-border-subtle text-text-muted';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'secondary': return 'bg-secondary/10 text-secondary';
      case 'accent': return 'bg-accent/10 text-accent';
      case 'success': return 'bg-emerald-500/10 text-emerald-500';
      case 'warning': return 'bg-amber-500/10 text-amber-500';
      case 'error': return 'bg-red-500/10 text-red-500';
      default: return 'bg-overlay-hover text-text-primary';
    }
  };

  return (
    <div className={`bg-surface border ${getVariantStyles()} rounded-2xl p-5 relative overflow-hidden shadow-lg transition-all duration-300 group hover:border-primary/40 flex flex-col justify-between min-h-[160px]`}>
      {/* Subtle Glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none
        ${variant === 'primary' ? 'bg-primary' : variant === 'secondary' ? 'bg-secondary' : variant === 'accent' ? 'bg-accent' : variant === 'success' ? 'bg-emerald-500' : 'bg-primary-soft'}
      `}></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl border border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-500 ${getIconBg()}`}>
            <Icon size={20} />
          </div>
          {trend !== undefined && (
            <div className={`text-[10px] font-mono font-black flex items-center px-1.5 py-0.5 rounded-md border ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              <Zap size={10} className="mr-1" />
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
          {trendText && (
            <div className="text-[9px] font-bold uppercase tracking-tight text-text-muted bg-overlay-hover px-2 py-0.5 rounded border border-border-subtle">
              {trendText}
            </div>
          )}
        </div>

        <div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5">{label}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-24 bg-overlay-hover animate-pulse rounded-md" />
            ) : (
              <h3 className="text-3xl font-black text-text-primary font-mono tracking-tighter leading-none">
                {value}
              </h3>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4">
        {subtext && (
          <p className="text-text-muted text-[11px] font-medium opacity-70 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary/40"></span>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

// New Component: Storage Capacity Forecast
const StorageForecast = ({ totalStorageBytes, usedStorageBytes }: { totalStorageBytes: number, usedStorageBytes: number }) => {
  const utilization = totalStorageBytes > 0 ? (usedStorageBytes / totalStorageBytes) * 100 : 0;

  // Simulation: Daily growth 0.5% of total or min 5TB (approx 5e12 bytes)
  const dailyGrowthBytes = Math.max(5 * 1024 * 1024 * 1024 * 1024, totalStorageBytes * 0.005);
  const daysToFull = dailyGrowthBytes > 0 ? (totalStorageBytes - usedStorageBytes) / dailyGrowthBytes : 999;

  // Status Logic
  const needsNodes = utilization > 75 || daysToFull < 60;

  // Calculate recommended nodes (assuming ~50TB per node average)
  const avgNodeStorageBytes = 50 * 1024 * 1024 * 1024 * 1024;
  const storageNeededBytes = dailyGrowthBytes * 30; // 30 days worth
  const recommendedNodes = Math.ceil(storageNeededBytes / avgNodeStorageBytes);

  // Milestone: Next Petabyte or next 1000TB (1PB = 1e15 bytes)
  const currentPB = Math.floor(usedStorageBytes / 1e15);
  const nextMilestoneBytes = (currentPB + 1) * 1e15;
  const daysToMilestone = dailyGrowthBytes > 0 ? (nextMilestoneBytes - usedStorageBytes) / dailyGrowthBytes : 0;

  // Chart Data
  const data = Array.from({ length: 30 }, (_, i) => ({
    name: `Day ${i + 1}`,
    used: usedStorageBytes + (dailyGrowthBytes * i),
    capacity: totalStorageBytes
  }));

  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-6 flex flex-col md:flex-row gap-6 lg:col-span-3 shadow-xl relative overflow-hidden group border-primary/10">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary-soft rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>

      <div className="flex-1 space-y-5 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-xl font-black text-text-primary tracking-tight">Capacity Forecast</h3>
          </div>
          <p className="text-sm text-text-muted">Predictive projections for network scaling.</p>
        </div>

        <div className={`p-4 rounded-2xl border flex items-start gap-4 ${needsNodes ? 'bg-accent/5 border-accent/20' : 'bg-secondary/5 border-secondary/20'}`}>
          <div className={`p-2 rounded-xl ${needsNodes ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
            {needsNodes ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider ${needsNodes ? 'text-accent' : 'text-secondary'}`}>
              {needsNodes ? 'Expansion Recommended' : 'Optimal Capacity'}
            </h4>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              {needsNodes ? (
                <>
                  Deploy <span className="font-bold text-accent">~{recommendedNodes} pNodes</span> within 30 days.
                  Growth: <span className="font-mono font-bold">{formatBytes(dailyGrowthBytes)}/day</span>.
                </>
              ) : (
                <>
                  Current growth <span className="font-mono font-bold">{formatBytes(dailyGrowthBytes)}/day</span> is healthy.
                  Next milestone in <span className="font-mono font-bold">{daysToMilestone.toFixed(0)} days</span>.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-root/50 backdrop-blur-sm p-4 rounded-2xl border border-border-subtle shadow-inner">
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2">Utilization</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black font-mono ${utilization > 80 ? 'text-accent' : 'text-primary'}`}>{utilization.toFixed(1)}</span>
              <span className="text-sm text-text-muted font-bold">%</span>
            </div>
            <div className="w-full h-1.5 bg-border-strong rounded-full mt-3 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${utilization > 80 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${utilization}%` }}></div>
            </div>
          </div>
          <div className="bg-root/50 backdrop-blur-sm p-4 rounded-2xl border border-border-subtle shadow-inner">
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2">Saturation</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono text-text-primary">{daysToFull < 999 ? daysToFull.toFixed(0) : '>999'}</span>
              <span className="text-sm text-text-muted font-bold">days</span>
            </div>
            <p className="text-[9px] text-text-muted mt-3 font-bold uppercase">Linear Projection</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] bg-root/40 backdrop-blur-sm rounded-2xl border border-border-subtle p-5 relative z-10 shadow-inner flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">30-Day Growth Model</span>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center text-primary"><span className="w-2 h-2 rounded-full bg-primary mr-1.5 shadow-[0_0_8px_var(--color-primary)]"></span> USED</span>
            <span className="flex items-center text-text-muted"><span className="w-2 h-2 rounded-full bg-text-muted mr-1.5"></span> CAPACITY</span>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 'bold' }}
                itemStyle={{ color: 'var(--color-primary)' }}
                labelStyle={{ display: 'none' }}
                formatter={(value: number) => [formatBytes(value), 'Projection']}
              />
              <ReferenceLine y={totalStorageBytes} stroke="var(--text-muted)" strokeDasharray="5 5" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="used" stroke="var(--color-primary)" fill="url(#colorUsed)" strokeWidth={3} animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};



export const Dashboard: React.FC<DashboardProps> = ({ nodes, onNodeClick, onNavigateToNodes, autoRefresh = true }) => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [latencyDist, setLatencyDist] = useState<LatencyDistribution | null>(null);
  const [sortMetric, setSortMetric] = useState<'rank' | 'latency' | 'score' | 'credit'>('latency');

  // New analytics metrics
  const { metrics, loading: metricsLoading, refresh: refreshMetrics } = useDashboardMetrics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLatencyChart, setShowLatencyChart] = useState(false);

  // Shared fetcher that returns data instead of setting state directly
  const loadStatsData = useCallback(async () => {
    return Promise.all([
      apiService.getStats(),
      apiService.getLatencyDistribution()
    ]);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [statsData, latencyData] = await loadStatsData();
      setStats(statsData);
      setLatencyDist(latencyData);
      await refreshMetrics();
    } catch (error) {
      console.error("Refresh failed:", error);
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    let ignore = false;

    const init = async () => {
      try {
        const [statsData, latencyData] = await loadStatsData();
        if (!ignore) {
          setStats(statsData);
          setLatencyDist(latencyData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    init();

    // Auto-refresh logic
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(async () => {
        // Silent refresh (no loading state overlay)
        try {
          const [statsData, latencyData] = await loadStatsData();
          if (!ignore) {
            setStats(statsData);
            setLatencyDist(latencyData);
            await refreshMetrics(); // Refresh analytics hooks too
          }
        } catch (err) {
          console.error("Auto-refresh failed", err);
        }
      }, 7000); // 7 seconds
    }

    return () => {
      ignore = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadStatsData, autoRefresh, refreshMetrics]);

  // Use props nodes as fallback or for side calculations
  const regionData = nodes.reduce((acc: Record<string, number>, node) => {
    // Try to get country from new API structure or fallback to geo_info
    const region = node.country || node.geo_info?.region || 'Unknown';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(regionData).map(key => ({ name: key, value: regionData[key] }));

  const COLORS = ['#933481', '#008E7C', '#FE8300', '#D1D1D6', '#6E6E7E'];

  // Convert API latency distribution to Chart format
  // Order keys numerically logic
  const latencyDistribution = latencyDist ? Object.entries(latencyDist).map(([range, count]) => ({
    range,
    count
  })).sort((a, b) => {
    // Custom sort to handle "0-50ms", "100-250ms" etc.
    // Extract first number
    const getNum = (str: string) => parseInt(str.match(/\d+/)?.[0] || '0');
    return getNum(a.range) - getNum(b.range);
  }) : [];

  // Derived values for display (prefer API stats, fallback to calculation if needed)
  const activeNodesCount = stats?.online_nodes ?? nodes.filter(n => n.status === 'active' || n.status === 'online').length;
  const totalNodesCount = stats?.total_nodes ?? nodes.length;
  const onlinePercent = totalNodesCount > 0 ? (activeNodesCount / totalNodesCount * 100) : 0;

  // Storage display values
  const totalStorageFormatted = stats?.total_storage_bytes
    ? formatBytes(stats.total_storage_bytes)
    : formatBytes(nodes.reduce((acc, n) => acc + (n.storage_capacity ?? 0), 0));

  const usedStorageFormatted = stats?.used_storage_bytes
    ? formatBytes(stats.used_storage_bytes)
    : formatBytes(nodes.reduce((acc, n) => acc + (n.storage_used ?? 0), 0));

  const totalStorageBytes = stats?.total_storage_bytes ?? (stats?.total_storage_pb ? stats.total_storage_pb * 1e15 : 0);
  const usedStorageBytes = stats?.used_storage_bytes ?? (stats?.used_storage_pb ? stats.used_storage_pb * 1e15 : 0);

  const avgPerformance = stats?.average_performance ?? 0;
  const networkHealth = stats?.network_health ?? 0;

  // Resource & Traffic Metrics
  const avgCpu = stats?.average_cpu_percent ?? 0;
  const avgRamUsed = stats?.average_ram_used_bytes ?? 0;
  const avgRamTotal = stats?.average_ram_total_bytes ?? 1; // Avoid div by zero
  const ramPercent = (avgRamUsed / avgRamTotal) * 100;
  const avgUptimeSeconds = stats?.average_uptime_seconds ?? 0;
  const totalTraffic = (stats?.total_packets_received ?? 0) + (stats?.total_packets_sent ?? 0);
  const rpcNodes = stats?.nodes_with_rpc_stats ?? 0;

  // Safe storage values for per-node display
  const getStorageCapacity = (n: PNode) => (n.storage_capacity ?? 0);
  const getStorageUsed = (n: PNode) => (n.storage_used ?? 0);

  const getHealthVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 bg-root">

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-primary/10 shadow-lg">
              <LayoutDashboard size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tighter">NETWORK VITALITY</h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-muted font-medium">Real-time infrastructure health monitoring.</p>
            {stats?.last_updated && (
              <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full flex items-center border border-secondary/20">
                <Clock size={10} className="mr-1" />
                Updated: {new Date(stats.last_updated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || metricsLoading}
            className="flex items-center px-5 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-black uppercase tracking-widest text-text-primary hover:text-primary hover:border-primary/50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw size={14} className={`mr-2.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-text-muted group-hover:text-primary transition-colors'}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </button>

          <button
            onClick={() => setShowLatencyChart(!showLatencyChart)}
            className={`flex items-center px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm group border ${showLatencyChart ? 'bg-primary/10 border-primary text-primary shadow-primary/10 shadow-lg' : 'bg-surface border-border-subtle text-text-muted hover:text-text-primary hover:border-primary/30'}`}
          >
            {showLatencyChart ? <EyeOff size={14} className="mr-2.5" /> : <Eye size={14} className="mr-2.5" />}
            Latency
          </button>
        </div>
      </div>

      {/* Vitality Metrics - Primary Hierarchy */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Health Indicators</span>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Overall System Health"
            value={`${networkHealth.toFixed(1)}%`}
            variant={getHealthVariant(networkHealth)}
            icon={Activity}
            subtext="Infrastructure Integrity Score"
          />
          <MetricCard
            label="Active Nodes"
            value={activeNodesCount}
            variant="primary"
            icon={Wifi}
            subtext={`${onlinePercent.toFixed(1)}% of fleet online`}
          />
          <MetricCard
            label="Network Capacity"
            value={totalStorageFormatted}
            variant="secondary"
            icon={HardDrive}
            subtext={`${usedStorageFormatted} currently utilized`}
          />
          <MetricCard
            label="Avg Performance"
            value={avgPerformance.toFixed(1)}
            variant="accent"
            icon={Zap}
            subtext="Global Response Consistency"
          />
        </div>
      </section>

      {/* Resource Consumption - New Section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Resource Consumption</span>
          <div className="h-px flex-1 bg-gradient-to-r from-accent/30 via-accent/5 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Avg CPU Load"
            value={`${avgCpu.toFixed(1)}%`}
            icon={Cpu}
            variant="neutral"
            subtext="Per-Node Processing"
          />
          <MetricCard
            label="Avg RAM Usage"
            value={formatBytes(avgRamUsed)}
            icon={Layers}
            variant="neutral"
            subtext={`${ramPercent.toFixed(1)}% of ${formatBytes(avgRamTotal)}`}
          />
          <MetricCard
            label="Avg Uptime"
            value={formatDuration(avgUptimeSeconds)}
            icon={Clock}
            variant="neutral"
            subtext="Continuous Availability"
          />
          <MetricCard
            label="Network Traffic"
            value={formatNumber(totalTraffic)}
            icon={Network}
            variant="neutral"
            subtext="Total Packets Processed"
          />
        </div>
      </section>

      {/* Operational Stats - Secondary Hierarchy */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Node Operations</span>
          <div className="h-px flex-1 bg-gradient-to-r from-border-subtle to-transparent"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Total Nodes"
            value={totalNodesCount}
            icon={Server}
          />


          <MetricCard
            label="Public Nodes"
            value={stats?.total_public_nodes ?? stats?.public_nodes ?? '-'}
            icon={Globe}
            trendText="External"
            subtext={`${stats?.online_public_nodes ?? '-'} Online`}
          />
          <MetricCard
            label="Online Public"
            value={stats?.online_public_nodes ?? '-'}
            icon={CheckCircle}
            variant="success"
            trendText="Healthy"
          />
          <MetricCard
            label="Private Nodes"
            value={stats?.total_private_nodes ?? stats?.private_nodes ?? '-'}
            icon={Lock}
            trendText="Internal"
            subtext={`${stats?.online_private_nodes ?? '-'} Online`}
          />
          <MetricCard
            label="Online Private"
            value={stats?.online_private_nodes ?? '-'}
            icon={CheckCircle}
            variant="success"
            trendText="Healthy"
          />
          <MetricCard
            label="Total Pods"
            value={stats?.total_pods ?? '-'}
            icon={Container}
          />
          <MetricCard
            label="Offline Nodes"
            value={stats?.offline_nodes ?? (totalNodesCount - activeNodesCount)}
            variant={(stats?.offline_nodes ?? 0) > 0 ? 'error' : 'neutral'}
            icon={EyeOff}
          />
          <MetricCard
            label="Regions"
            value={pieData.length}
            icon={Globe}
            trendText="Active"
          />
          <MetricCard
            label="RPC Active"
            value={rpcNodes}
            icon={Zap}
            trendText="Enabled"
            variant="accent"
          />
        </div>
      </section>

      {/* Storage Forecast Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <StorageForecast totalStorageBytes={totalStorageBytes} usedStorageBytes={usedStorageBytes} />
      </div>

      {/* Main Visuals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latency Chart - Optional */}
        {showLatencyChart && (
          <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-3xl p-8 flex flex-col h-[400px] lg:h-auto shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-text-primary flex items-center tracking-tight">
                  <Wifi className="w-5 h-5 mr-3 text-primary" />
                  Latency Distribution
                </h3>
                <p className="text-xs text-text-muted font-medium ml-8">Global request response times</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-root/50 backdrop-blur-sm rounded-xl p-1 flex text-[10px] font-black uppercase tracking-tighter border border-border-subtle shadow-inner">
                  <button className="px-4 py-1.5 bg-surface shadow-md rounded-lg text-primary border border-primary/20">Log</button>
                  <button className="px-4 py-1.5 text-text-muted hover:text-text-primary transition-colors">Linear</button>
                </div>
                <button
                  onClick={() => setShowLatencyChart(!showLatencyChart)}
                  className="p-2.5 hover:bg-overlay-hover rounded-xl transition-all text-text-muted hover:text-text-primary border border-transparent hover:border-border-subtle"
                >
                  <ChevronUp size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10">
              {latencyDist ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latencyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="range"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      dy={15}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--text-primary)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500}>
                      {latencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted font-bold animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin mr-3 text-primary" /> Synchronizing...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Usage Chart */}
        <div className={`${showLatencyChart ? 'lg:col-span-1' : 'lg:col-span-3'} min-h-[350px] lg:min-h-0`}>
          <StorageUsageChart
            totalBytes={totalStorageBytes}
            usedBytes={usedStorageBytes}
          />
        </div>
      </div>


      {/* Bottom Section - Tables and Geo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Regional Distribution */}
        <div className="bg-surface border border-border-subtle rounded-3xl p-8 lg:col-span-1 shadow-xl relative overflow-hidden flex flex-col">
          <div className="space-y-1 mb-8">
            <h3 className="text-xl font-black text-text-primary flex items-center tracking-tight">
              <Globe className="w-5 h-5 mr-3 text-primary" />
              Geo-Presence
            </h3>
            <p className="text-xs text-text-muted font-medium ml-8">Regional node dispersion</p>
          </div>

          <div className="flex-1 min-h-[220px] w-full flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none z-10">
              <span className="text-4xl font-black text-text-primary tracking-tighter">{totalNodesCount}</span>
              <span className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1">Total Nodes</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 mt-8 pt-6 border-t border-border-subtle/50">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-[10px] bg-root/30 px-2 py-1 rounded-lg border border-border-subtle/30 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full mr-2 shadow-inner" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-text-secondary font-black tracking-tight">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Nodes Table */}
        <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden lg:col-span-2 flex flex-col shadow-xl">
          <div className="px-8 py-6 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-overlay-hover/30 backdrop-blur-sm">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-text-primary flex items-center tracking-tight">
                <Layers className="w-5 h-5 mr-3 text-primary" />
                Performance Registry
              </h3>
              <p className="text-xs text-text-muted font-medium ml-8">Top performing infrastructure units</p>
            </div>

            <div className="flex items-center gap-4 self-stretch sm:self-auto">
              <div className="flex bg-root/50 backdrop-blur-sm rounded-xl p-1 border border-border-subtle shadow-inner">
                {(['credit', 'latency', 'score', 'rank'] as const).filter(m => m !== 'rank').map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSortMetric(metric)}
                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${sortMetric === metric ? 'bg-surface text-primary shadow-md border border-primary/10' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
              <button
                onClick={onNavigateToNodes}
                className="p-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all border border-primary/10 group"
                title="View Full Registry"
              >
                <Layers size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-overlay-hover/20 text-text-muted uppercase tracking-[0.2em] text-[9px] font-black border-b border-border-subtle/50">
                <tr>
                  <th className="px-8 py-4 text-center">{sortMetric === 'credit' ? 'Volume' : 'Rank'}</th>
                  <th className="px-8 py-4">Node Node Identity</th>
                  <th className="px-8 py-4 text-center">Efficiency</th>
                  <th className="px-8 py-4 text-center">Score</th>
                  <th className="px-8 py-4 text-right">Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/30 font-mono text-xs">
                {[...nodes]
                  .sort((a, b) => {
                    if (sortMetric === 'rank') {
                      return (a.credits_rank ?? Number.MAX_SAFE_INTEGER) - (b.credits_rank ?? Number.MAX_SAFE_INTEGER);
                    } else if (sortMetric === 'credit') {
                      return (b.credits ?? 0) - (a.credits ?? 0);
                    } else if (sortMetric === 'latency') {
                      return (a.response_time ?? Number.MAX_SAFE_INTEGER) - (b.response_time ?? Number.MAX_SAFE_INTEGER);
                    } else {
                      return (b.performance_score ?? b.uptime_score ?? 0) - (a.performance_score ?? a.uptime_score ?? 0);
                    }
                  })
                  .slice(0, 5)
                  .map((node, index) => {
                    const capacity = getStorageCapacity(node);
                    const used = getStorageUsed(node);
                    return (
                      <tr
                        key={node.pubkey}
                        className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                        onClick={() => onNodeClick?.(node)}
                      >
                        <td className="px-8 py-5 text-center">
                          {sortMetric === 'credit' ? (
                            <div className="flex flex-col items-center">
                              <span className="font-black text-primary text-sm tracking-tight text-glow-primary">
                                {(node.credits ?? 0).toLocaleString()}
                              </span>
                              <span className="text-[8px] text-text-muted font-black uppercase tracking-tighter">XAND</span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-black tracking-tighter
                            ${index < 3 ? 'bg-primary text-white shadow-lg shadow-primary/30 rotate-3' : 'bg-overlay-active text-text-muted'}
                          `}>
                              #{index + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-text-primary group-hover:text-primary transition-colors flex items-center gap-2 tracking-tight">
                              {node.pubkey.substring(0, 10)}...
                              <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${node.status === 'active' || node.status === 'online' ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`}></span>
                            </span>
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-60">
                              {node.city || 'DC'}, {node.country || 'GLOBAL'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-1.5 bg-overlay-active rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-all duration-1000" style={{ width: `${capacity > 0 ? (used / capacity) * 100 : 0}%` }}></div>
                            </div>
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">{formatBytes(capacity)} CAP</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex items-center justify-center px-3 py-1 bg-secondary/10 rounded-lg border border-secondary/20">
                            <span className="text-secondary font-black text-sm">{node.performance_score ?? node.uptime_score ?? 0}</span>
                            <span className="text-[9px] font-bold text-text-muted ml-1 opacity-50">/100</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`text-sm font-black tracking-tighter ${(node.response_time ?? 999) < 50 ? 'text-emerald-500' :
                            (node.response_time ?? 999) < 150 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {node.response_time ?? 0}
                            <span className="text-[9px] font-bold ml-1 uppercase opacity-60">ms</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};