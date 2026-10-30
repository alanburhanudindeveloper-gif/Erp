import { useState, useCallback, useEffect } from 'react';
import type { ProductionPlanItem } from '../../../../types';
import { erpApplication } from '../../../../app/composition/dependencies';

export interface UseProductionPlansOptions {
  page?: number;
  limit?: number;
  status?: string;
  sku?: string;
  autoFetch?: boolean;
}

export function useProductionPlans(options: UseProductionPlansOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 20);
  const [status, setStatus] = useState<string | undefined>(options.status);
  const [sku, setSku] = useState<string | undefined>(options.sku);

  const [plans, setPlans] = useState<ProductionPlanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const result = erpApplication.planning.getProductionPlan.list({
        page,
        limit,
        status,
        sku,
      });
      setPlans(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch production plans');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, sku]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchPlans();
    }
  }, [fetchPlans, options.autoFetch]);

  return {
    plans,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchPlans,
    setPage,
    setLimit,
    setStatus,
    setSku,
  };
}
