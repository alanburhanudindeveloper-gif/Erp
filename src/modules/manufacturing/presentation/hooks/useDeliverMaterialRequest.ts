import { useState, useCallback } from 'react';
import type { MaterialRequest } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useDeliverMaterialRequest() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaterialRequest | null>(null);

  const deliverRequest = useCallback(
    async (
      id: string,
      payload: { deliveredBy?: string; destinationLine?: string; deliveredAt?: string } = {}
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const updated = await erpApiClient.manufacturing.deliverMaterialRequest(id, payload);
        setResult(updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to deliver material request';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    deliverRequest,
    isPending,
    error,
    result,
  };
}
