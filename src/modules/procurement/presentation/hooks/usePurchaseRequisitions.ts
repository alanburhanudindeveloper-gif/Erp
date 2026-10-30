import { useState, useCallback, useEffect } from 'react';
import type { PurchaseRequisition, PurchaseRequisitionStatus } from '../../../../types';
import { erpApplication } from '../../../../app/composition/dependencies';

export interface UsePurchaseRequisitionsOptions {
  page?: number;
  limit?: number;
  status?: PurchaseRequisitionStatus;
  department?: string;
  autoFetch?: boolean;
}

export function usePurchaseRequisitions(options: UsePurchaseRequisitionsOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 20);
  const [status, setStatus] = useState<PurchaseRequisitionStatus | undefined>(options.status);
  const [department, setDepartment] = useState<string | undefined>(options.department);

  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const result = erpApplication.procurement.listPurchaseRequisitions.execute({
        page,
        limit,
        status,
        department,
      });
      setRequisitions(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase requisitions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, department]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchRequisitions();
    }
  }, [fetchRequisitions, options.autoFetch]);

  return {
    requisitions,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchRequisitions,
    setPage,
    setLimit,
    setStatus,
    setDepartment,
  };
}
