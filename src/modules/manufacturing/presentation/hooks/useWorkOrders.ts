import { useState, useCallback, useEffect } from 'react';
import type { ProductionOrder, ProductionOrderStatus } from '../../../../types';
import { erpApplication } from '../../../../app/composition/dependencies';

export interface UseWorkOrdersOptions {
  page?: number;
  limit?: number;
  status?: ProductionOrderStatus;
  sku?: string;
  plantId?: string;
  autoFetch?: boolean;
}

export function useWorkOrders(options: UseWorkOrdersOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 20);
  const [status, setStatus] = useState<ProductionOrderStatus | undefined>(options.status);
  const [sku, setSku] = useState<string | undefined>(options.sku);
  const [plantId, setPlantId] = useState<string | undefined>(options.plantId);

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const result = erpApplication.manufacturing.listWorkOrders.execute({
        page,
        limit,
        status,
        sku,
        plantId,
      });
      setOrders(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, sku, plantId]);

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
    setSku,
    setPlantId,
  };
}
