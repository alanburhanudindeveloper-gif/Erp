import { useState, useCallback, useEffect } from 'react';
import type { BucketBalance } from '../../inventoryLedgerService';
import { erpApplication } from '../../../../app/composition/dependencies';

export interface UseInventoryBalanceOptions {
  sku: string;
  autoFetch?: boolean;
}

export function useInventoryBalance(options: UseInventoryBalanceOptions) {
  const [balance, setBalance] = useState<BucketBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(() => {
    if (!options.sku) return;
    setLoading(true);
    setError(null);
    try {
      const outcome = erpApplication.inventory.get5BucketBalance.execute({
        sku: options.sku,
      });
      if (outcome.isSuccess) {
        setBalance(outcome.value);
      } else {
        setError(outcome.error.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory balance');
    } finally {
      setLoading(false);
    }
  }, [options.sku]);

  useEffect(() => {
    if (options.autoFetch !== false && options.sku) {
      fetchBalance();
    }
  }, [fetchBalance, options.autoFetch, options.sku]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}
