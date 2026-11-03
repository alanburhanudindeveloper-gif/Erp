import { useState, useCallback, useEffect } from 'react';
import type { StockMovement } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export interface UseStockMovementsOptions {
  page?: number;
  limit?: number;
  sku?: string;
  movementType?: string;
  stockBucket?: string;
  lotNumber?: string;
  autoFetch?: boolean;
}

export function useStockMovements(options: UseStockMovementsOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 50);
  const [sku, setSku] = useState<string | undefined>(options.sku);
  const [movementType, setMovementType] = useState<string | undefined>(options.movementType);
  const [stockBucket, setStockBucket] = useState<string | undefined>(options.stockBucket);
  const [lotNumber, setLotNumber] = useState<string | undefined>(options.lotNumber);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await erpApiClient.inventory.listMovements({
        page,
        limit,
        sku,
        movementType,
        stockBucket,
        lotNumber,
      });
      setMovements(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock movements');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sku, movementType, stockBucket, lotNumber]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchMovements();
    }
  }, [fetchMovements, options.autoFetch]);

  return {
    movements,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchMovements,
    setPage,
    setLimit,
    setSku,
    setMovementType,
    setStockBucket,
    setLotNumber,
  };
}
