import { useState, useCallback } from 'react';
import type { PurchaseRequisition } from '../../../../types';
import type { CreatePurchaseRequisitionCommand } from '../../application/commands/createPurchaseRequisitionCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useCreatePurchaseRequisition() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseRequisition | null>(null);

  const createPR = useCallback(async (command: CreatePurchaseRequisitionCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const created = await erpApiClient.procurement.createPurchaseRequisition(command);
      setResult(created);
      return { success: true, data: created };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown creation error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    createPR,
    isPending,
    error,
    result,
  };
}
