import { useState, useEffect, useCallback } from 'react';
import { PNode } from '../types/node.types';
import { apiService } from '../services/api';
import { AppSettings } from '../types';
import { PaginationMeta, SortField, SortOrder } from '../types/api.types';
import { groupNodesByPubKey } from '../utils/nodeUtils';

export function useNodes(settings?: AppSettings) {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Default limit - 50 nodes per page

  const [status, setStatus] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortField | undefined>(undefined);
  const [order, setOrder] = useState<SortOrder | undefined>(undefined);
  const [includeOffline, setIncludeOffline] = useState<boolean>(true); // Default true based on requirements

  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch nodes from backend API with pagination and filtering support
      const response = await apiService.getNodes({
        page,
        limit,
        status,
        sort,
        order,
        include_offline: includeOffline
      });

      // Deduplicate nodes based on pubkey and group IPs
      // Note: Grouping might hide some nodes if backend returns them separately, 
      // but usually API returns unique nodes or we handle it here.
      const processedNodes = groupNodesByPubKey(response.nodes);

      setNodes(processedNodes);
      setPagination(response.pagination);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Error fetching nodes:', err);
      setError(err.message || 'Failed to fetch node data from backend');
      setNodes([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, sort, order, includeOffline]);

  useEffect(() => {
    fetchNodes();
    let intervalId: any;
    if (settings?.autoRefresh) {
      intervalId = setInterval(fetchNodes, settings.refreshInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchNodes, settings?.autoRefresh, settings?.refreshInterval]);

  return {
    nodes,
    loading,
    error,
    refetch: fetchNodes,
    lastUpdated,
    pagination,
    setPage,
    page,
    // Filter controls
    setStatus,
    setSort,
    setOrder,
    setIncludeOffline
  };
}