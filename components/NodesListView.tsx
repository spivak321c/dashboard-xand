import React, { useState, useMemo } from 'react';
import { PNode } from '../types/node.types';
import { PaginationMeta, SortField, SortOrder as SortDirection } from '../types/api.types';
import {
  Search,
  Filter,
  Terminal,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { NodeCard } from './NodeCard';
import { NodeHybridCard } from './NodeHybridCard';
import { copyToClipboard } from '../utils/clipboardUtils';

export interface NodesListViewProps {
  nodes: PNode[];
  onNodeClick?: (node: PNode) => void;
  pagination: PaginationMeta | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  // API Filter Callbacks
  onStatusChange?: (status: string | undefined) => void;
  onSortChange?: (sort: SortField | undefined) => void;
  onOrderChange?: (order: SortDirection | undefined) => void;
  onIncludeOfflineChange?: (include: boolean) => void;
}

// Internal component filter types
type StatusFilter = 'all' | 'active' | 'delinquent' | 'offline';
type RegisteredFilter = 'all' | 'registered' | 'unregistered';
type VisibilityFilter = 'all' | 'public' | 'private';
type ViewMode = 'grid' | 'list';
export { type SortField, type SortDirection };

export const NodesListView: React.FC<NodesListViewProps> = ({
  nodes,
  onNodeClick,
  pagination,
  currentPage,
  onPageChange,
  onStatusChange,
  onSortChange,
  onOrderChange,
  onIncludeOfflineChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [registeredFilter, setRegisteredFilter] = useState<RegisteredFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [includeOffline, setIncludeOffline] = useState(true);

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    if (onStatusChange) {
      // Convert 'all' to undefined for API
      onStatusChange(status === 'all' ? undefined : status);
    }
  };

  const handleIncludeOfflineChange = (include: boolean) => {
    setIncludeOffline(include);
    onIncludeOfflineChange?.(include);
  };

  // Compute unique versions available across all nodes
  const availableVersions = useMemo(() => {
    const versions = new Set<string>();
    nodes.forEach(n => { if (n.version) versions.add(n.version); });
    return Array.from(versions).sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
  }, [nodes]);

  // Sort States
  const [sortField, setSortField] = useState<SortField>('storage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const handleSortChange = (field: SortField) => {
    setSortField(field);
    onSortChange?.(field);
  };

  const handleOrderChange = (dir: SortDirection) => {
    setSortDirection(dir);
    onOrderChange?.(dir);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const success = await copyToClipboard(id);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      console.warn('Clipboard copy failed, using prompt as fallback');
      window.prompt('Copy to clipboard: Ctrl+C, Enter', id);
    }
  };

  const filteredAndSortedNodes = useMemo(() => {
    let result = [...nodes];

    // Text Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(n =>
        n.pubkey.toLowerCase().includes(term) ||
        n.address.toLowerCase().includes(term) ||
        (n.ip?.includes(term) ?? false) ||
        (n.country?.toLowerCase().includes(term)) ||
        (n.city?.toLowerCase().includes(term)) ||
        (n.version?.toLowerCase().includes(term)) ||
        (n.status?.toLowerCase().includes(term))
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(n => n.status === statusFilter);
    }

    // Registration Filter
    if (registeredFilter !== 'all') {
      const isReg = registeredFilter === 'registered';
      result = result.filter(n => n.is_registered === isReg);
    }

    // Visibility Filter
    if (visibilityFilter !== 'all') {
      const isPublic = visibilityFilter === 'public';
      result = result.filter(n => n.is_public === isPublic);
    }

    // Version Filter
    if (versionFilter !== 'all') {
      result = result.filter(n => n.version === versionFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case 'uptime':
          valA = a.uptime_score || 0;
          valB = b.uptime_score || 0;
          break;
        case 'performance':
          valA = a.performance_score || 0;
          valB = b.performance_score || 0;
          break;
        case 'credits':
          valA = a.credits || 0;
          valB = b.credits || 0;
          break;
        case 'storage':
          valA = a.storage_capacity || 0;
          valB = b.storage_capacity || 0;
          break;
        case 'latency':
          valA = a.response_time || 0;
          valB = b.response_time || 0;
          break;
        default:
          valA = 0;
          valB = 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [nodes, searchTerm, sortField, sortDirection, statusFilter, registeredFilter, visibilityFilter, versionFilter]);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (registeredFilter !== 'all' ? 1 : 0) + (visibilityFilter !== 'all' ? 1 : 0) + (versionFilter !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col h-full text-text-primary bg-root animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 border-b border-border-subtle bg-surface/50 backdrop-blur-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center font-mono">
              <Terminal className="mr-3 text-primary" />
              NODE_REGISTRY
              <span className="ml-3 text-xs bg-primary-soft text-primary px-2 py-0.5 rounded border border-primary/20 font-sans tracking-wide">
                {filteredAndSortedNodes.length} / {pagination?.total_items || nodes.length}
              </span>
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-surface border border-border-subtle rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                title="List View"
              >
                <ListIcon size={16} />
              </button>
            </div>

            <div className="relative group flex-1 md:flex-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface border border-border-strong text-text-primary text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 outline-none transition-all w-full md:w-64 font-mono shadow-inner placeholder:text-text-muted"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 border rounded-lg transition-colors flex items-center relative ${showFilters || activeFiltersCount > 0 ? 'bg-primary-soft border-primary text-primary' : 'bg-surface border-border-strong text-text-muted hover:text-text-primary'}`}
            >
              <Filter size={18} />
              {activeFiltersCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-elevated/50 p-4 rounded-xl border border-border-subtle flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'delinquent', 'offline'] as StatusFilter[]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${statusFilter === status
                        ? 'bg-surface border-primary text-primary shadow-sm'
                        : 'bg-transparent border-transparent text-text-secondary hover:bg-overlay-hover'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include Offline Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleIncludeOfflineChange(!includeOffline)}
                  className={`flex items-center justify-center w-5 h-5 rounded border ${includeOffline ? 'bg-primary border-primary text-white' : 'border-border-strong bg-surface'}`}
                >
                  {includeOffline && <Terminal size={12} />}
                </button>
                <label className="text-xs font-medium text-text-secondary cursor-pointer" onClick={() => handleIncludeOfflineChange(!includeOffline)}>
                  Include Offline Nodes
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Registration</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'registered', 'unregistered'] as RegisteredFilter[]).map(reg => (
                    <button
                      key={reg}
                      onClick={() => setRegisteredFilter(reg)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${registeredFilter === reg
                        ? 'bg-surface border-primary text-primary shadow-sm'
                        : 'bg-transparent border-transparent text-text-secondary hover:bg-overlay-hover'
                        }`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Visibility</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'public', 'private'] as VisibilityFilter[]).map(vis => (
                    <button
                      key={vis}
                      onClick={() => setVisibilityFilter(vis)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${visibilityFilter === vis
                        ? 'bg-surface border-primary text-primary shadow-sm'
                        : 'bg-transparent border-transparent text-text-secondary hover:bg-overlay-hover'
                        }`}
                    >
                      {vis}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Node Version</label>
                <select
                  value={versionFilter}
                  onChange={(e) => setVersionFilter(e.target.value)}
                  className="w-full bg-surface border border-border-strong text-text-primary text-xs rounded-md p-1.5 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  <option value="all">All Versions</option>
                  {availableVersions.map(v => (
                    <option key={v} value={v}>v{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => handleSortChange(e.target.value as SortField)}
                    className="flex-1 bg-surface border border-border-strong text-text-primary text-xs rounded-md p-1.5 outline-none focus:ring-1 focus:ring-primary shadow-sm capitalize"
                  >
                    <option value="uptime">Uptime</option>
                    <option value="performance">Performance</option>
                    <option value="credits">Credits</option>
                    <option value="storage">Storage</option>
                    <option value="latency">Latency</option>
                  </select>
                  <button
                    onClick={() => handleOrderChange(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1.5 bg-surface border border-border-strong rounded-md text-text-secondary hover:text-primary transition-colors"
                    title="Toggle Sort Order"
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle pt-3">
              <div className="text-[10px] text-text-muted italic flex items-center">
                Showing matches for {activeFiltersCount} active filters
              </div>
              <button
                onClick={() => {
                  handleStatusChange('all');
                  setRegisteredFilter('all');
                  setVisibilityFilter('all');
                  setVersionFilter('all');
                  handleSortChange('storage');
                  handleOrderChange('desc');
                  handleIncludeOfflineChange(true);
                  setSearchTerm('');
                }}
                className="text-xs text-text-muted hover:text-red-400 flex items-center px-3 py-1.5 transition-colors"
              >
                <XCircle size={14} className="mr-1" /> Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-root p-6">
        {viewMode === 'grid' ? (
          /* Grid View - Responsive 3/2/1 columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedNodes.map(node => (
              <NodeCard
                key={node.pubkey}
                node={node}
                onNodeClick={onNodeClick}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            ))}
            {filteredAndSortedNodes.length === 0 && (
              <div className="col-span-full p-12 text-center text-text-muted border border-dashed border-border-subtle rounded-xl">
                No nodes found matching your filters.
              </div>
            )}
          </div>
        ) : (
          /* List View - Expanded Hybrid Cards */
          <div className="flex flex-col gap-3">
            {filteredAndSortedNodes.map(node => (
              <NodeHybridCard
                key={node.pubkey}
                node={node}
                isExpanded={expandedNodeId === node.pubkey}
                onToggleExpand={() => setExpandedNodeId(expandedNodeId === node.pubkey ? null : node.pubkey)}
                onCopyProp={handleCopy}
                copiedId={copiedId}
                onNodeClick={onNodeClick}
              />
            ))}
            {filteredAndSortedNodes.length === 0 && (
              <div className="p-12 text-center text-text-muted border border-dashed border-border-subtle rounded-xl">
                No nodes found matching your filters.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle px-6 py-4 flex items-center justify-between bg-root">
        <div className="text-xs text-text-muted font-mono">
          DISPLAYING <span className="text-text-primary">{filteredAndSortedNodes.length}</span> / <span className="text-text-primary">{pagination?.total_items || nodes.length}</span> NODES
          {pagination?.total_pages && (
            <span className="ml-2 opacity-50">
              (Page {pagination.page} of {pagination.total_pages})
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center px-3 py-1 bg-surface border border-border-subtle rounded-md text-xs font-medium text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-overlay-hover hover:border-primary/30 transition-all"
          >
            <ChevronLeft size={14} className="mr-1" /> PREV
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination?.total_pages || 1) }, (_, i) => {
              let p = i + 1;
              if ((pagination?.total_pages || 0) > 5 && currentPage > 3) {
                p = currentPage - 3 + i;
              }
              if (p > (pagination?.total_pages || 1)) return null;

              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${currentPage === p
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface border border-border-subtle text-text-muted hover:border-primary/50 hover:text-primary'
                    }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= (pagination?.total_pages || 1)}
            className="flex items-center px-3 py-1 bg-surface border border-border-subtle rounded-md text-xs font-medium text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-overlay-hover hover:border-primary/30 transition-all"
          >
            NEXT <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};