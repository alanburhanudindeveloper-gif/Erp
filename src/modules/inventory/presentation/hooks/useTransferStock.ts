import { useState, useCallback } from 'react';
import type { StockMovement } from '../../../../types';
import type { TransferStockCommand } from '../../application/commands/transferStockCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useTransferStock() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockMovement | null>(null);

  const transferStock = useCallback(async (command: TransferStockCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const data = await erpApiClient.inventory.transferStock(command);
      setResult(data);
      return { success: true, data };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown transfer error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    transferStock,
    isPending,
    error,
    result,
  };
}
