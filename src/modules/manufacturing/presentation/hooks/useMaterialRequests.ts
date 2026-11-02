import { useState, useCallback, useEffect } from 'react';
import type { MaterialRequest } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export interface UseMaterialRequestsOptions {
  page?: number;
  limit?: number;
  sourceType?: string;
  status?: string;
  destinationLine?: string;
  autoFetch?: boolean;
}

export function useMaterialRequests(options: UseMaterialRequestsOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 50);
  const [sourceType, setSourceType] = useState<string | undefined>(options.sourceType);
  const [status, setStatus] = useState<string | undefined>(options.status);
  const [destinationLine, setDestinationLine] = useState<string | undefined>(options.destinationLine);

  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await erpApiClient.manufacturing.listMaterialRequests({
        page,
        limit,
        sourceType,
        status,
        destinationLine,
      });
      setRequests(result.requests);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch material requests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sourceType, status, destinationLine]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchRequests();
    }
  }, [fetchRequests, options.autoFetch]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchRequests,
    setPage,
    setLimit,
    setSourceType,
    setStatus,
    setDestinationLine,
  };
}
