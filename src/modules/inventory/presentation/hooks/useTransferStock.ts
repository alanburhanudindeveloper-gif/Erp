import { useState, useCallback } from 'react';
import type { StockMovement } from '../../../../types';
import type { TransferStockCommand } from '../../application/commands/transferStockCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useTransferStock() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockMovement | null>(null);

  const transferStock = useCallback(async (command: TransferStockCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.inventory.transferStock.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
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
