import { useState, useCallback } from 'react';
import type { MaterialRequest } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function usePickMaterialRequest() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaterialRequest | null>(null);

  const pickRequest = useCallback(
    async (id: string, payload: { pickedBy?: string; pickedAt?: string } = {}) => {
      setIsPending(true);
      setError(null);
      try {
        const updated = await erpApiClient.manufacturing.pickMaterialRequest(id, payload);
        setResult(updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to pick material request';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    pickRequest,
    isPending,
    error,
    result,
  };
}
