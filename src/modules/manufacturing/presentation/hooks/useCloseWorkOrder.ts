import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useCloseWorkOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const closeOrder = useCallback(
    async (orderId: string, actor: { actorName?: string; actorRole?: string } = {}) => {
      setIsPending(true);
      setError(null);
      try {
        const updated = await erpApiClient.manufacturing.closeWorkOrder(orderId, actor);
        setResult(updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to close work order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    closeOrder,
    isPending,
    error,
    result,
  };
}
