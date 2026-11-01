import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useCompleteOperation() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const completeOp = useCallback(
    async (
      orderId: string,
      operationSequence: number,
      actor: { actorName?: string; actorRole?: string } = {}
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const updated = await erpApiClient.manufacturing.completeOperation(
          orderId,
          operationSequence,
          actor
        );
        setResult(updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to complete operation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    completeOp,
    isPending,
    error,
    result,
  };
}
