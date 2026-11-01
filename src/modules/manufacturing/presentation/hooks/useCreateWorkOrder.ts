import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useCreateWorkOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const createOrder = useCallback(
    async (data: {
      productId: string;
      quantity: number;
      dueDate: string;
      plantId?: string;
      actorName?: string;
    }) => {
      setIsPending(true);
      setError(null);
      try {
        const created = await erpApiClient.manufacturing.createProductionOrder(data);
        setResult(created);
        return { success: true, data: created };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create work order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    createOrder,
    isPending,
    error,
    result,
  };
}
