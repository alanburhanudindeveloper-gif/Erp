import { useState, useCallback, useEffect } from 'react';
import type { NonConformanceReport } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export interface UseNcrsOptions {
  page?: number;
  limit?: number;
  status?: string;
  disposition?: string;
  sku?: string;
  orderNumber?: string;
  lotNumber?: string;
  autoFetch?: boolean;
}

export function useNcrs(options: UseNcrsOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 50);
  const [status, setStatus] = useState<string | undefined>(options.status);
  const [disposition, setDisposition] = useState<string | undefined>(options.disposition);
  const [sku, setSku] = useState<string | undefined>(options.sku);
  const [orderNumber, setOrderNumber] = useState<string | undefined>(options.orderNumber);
  const [lotNumber, setLotNumber] = useState<string | undefined>(options.lotNumber);

  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNcrs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await erpApiClient.quality.listNcrs({
        page,
        limit,
        status,
        disposition,
        sku,
        orderNumber,
        lotNumber,
      });
      setNcrs(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NCRs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, disposition, sku, orderNumber, lotNumber]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchNcrs();
    }
  }, [fetchNcrs, options.autoFetch]);

  return {
    ncrs,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchNcrs,
    setPage,
    setLimit,
    setStatus,
    setDisposition,
    setSku,
    setOrderNumber,
    setLotNumber,
  };
}
