import { useState, useCallback, useEffect } from 'react';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../../../types';
import { erpApplication } from '../../../../app/composition/dependencies';

export interface UsePurchaseOrdersOptions {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  autoFetch?: boolean;
}

export function usePurchaseOrders(options: UsePurchaseOrdersOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 20);
  const [status, setStatus] = useState<PurchaseOrderStatus | undefined>(options.status);
  const [supplierId, setSupplierId] = useState<string | undefined>(options.supplierId);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const result = erpApplication.procurement.listPurchaseOrders.execute({
        page,
        limit,
        status,
        supplierId,
      });
      setOrders(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, supplierId]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchOrders();
    }
  }, [fetchOrders, options.autoFetch]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchOrders,
    setPage,
    setLimit,
    setStatus,
    setSupplierId,
  };
}
