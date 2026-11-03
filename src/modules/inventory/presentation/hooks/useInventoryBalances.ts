import { useState, useCallback, useEffect } from 'react';
import type { InventoryBalanceItem } from '../../application/queries/listInventoryBalancesQuery';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export interface UseInventoryBalancesOptions {
  page?: number;
  limit?: number;
  sku?: string;
  type?: string;
  category?: string;
  belowBufferOnly?: boolean;
  autoFetch?: boolean;
}

export function useInventoryBalances(options: UseInventoryBalancesOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 50);
  const [sku, setSku] = useState<string | undefined>(options.sku);
  const [type, setType] = useState<string | undefined>(options.type);
  const [category, setCategory] = useState<string | undefined>(options.category);
  const [belowBufferOnly, setBelowBufferOnly] = useState<boolean | undefined>(options.belowBufferOnly);

  const [items, setItems] = useState<InventoryBalanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await erpApiClient.inventory.listBalances({
        page,
        limit,
        sku,
        type,
        category,
        belowBufferOnly,
      });
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory balances');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sku, type, category, belowBufferOnly]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchBalances();
    }
  }, [fetchBalances, options.autoFetch]);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchBalances,
    setPage,
    setLimit,
    setSku,
    setType,
    setCategory,
    setBelowBufferOnly,
  };
}
