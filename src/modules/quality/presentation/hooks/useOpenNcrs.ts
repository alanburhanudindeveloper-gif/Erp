import { useState, useCallback, useEffect } from 'react';
import type { NonConformanceReport } from '../../../../types';
import { erpApplication } from '../../../../app/composition/dependencies';

export interface UseOpenNcrsOptions {
  page?: number;
  limit?: number;
  sku?: string;
  orderNumber?: string;
  autoFetch?: boolean;
}

export function useOpenNcrs(options: UseOpenNcrsOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 20);
  const [sku, setSku] = useState<string | undefined>(options.sku);
  const [orderNumber, setOrderNumber] = useState<string | undefined>(options.orderNumber);

  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNcrs = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const result = erpApplication.quality.listOpenNcrs.execute({
        page,
        limit,
        sku,
        orderNumber,
      });
      setNcrs(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch open NCRs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sku, orderNumber]);

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
    setSku,
    setOrderNumber,
  };
}
