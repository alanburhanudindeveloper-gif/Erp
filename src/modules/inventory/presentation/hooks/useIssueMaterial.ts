import { useState, useCallback } from 'react';
import type { StockMovement } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useIssueMaterial() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ movement: StockMovement; message: string } | null>(null);

  const issueMaterial = useCallback(
    async (payload: {
      orderId: string;
      componentSku: string;
      lotNumber: string;
      quantity: number;
      isHoldOverride?: boolean;
      actor?: string;
      role?: string;
    }) => {
      setIsPending(true);
      setError(null);
      try {
        const response = await erpApiClient.inventory.issueMaterial(payload);
        setResult(response);
        return { success: true, data: response.movement, message: response.message };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown material issue error';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    issueMaterial,
    isPending,
    error,
    result,
  };
}
