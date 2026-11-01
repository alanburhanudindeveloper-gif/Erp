import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useStartOperation() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const startOp = useCallback(
    async (orderId: string, operationSequence: number, operatorName: string) => {
      setIsPending(true);
      setError(null);
      try {
        const updated = await erpApiClient.manufacturing.startOperation(
          orderId,
          operationSequence,
          operatorName
        );
        setResult(updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start operation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    startOp,
    isPending,
    error,
    result,
  };
}
