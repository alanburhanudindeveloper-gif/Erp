import { useState, useCallback } from 'react';
import type { PurchaseRequisition } from '../../../../types';
import type { CreatePurchaseRequisitionCommand } from '../../application/commands/createPurchaseRequisitionCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useCreatePurchaseRequisition() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseRequisition | null>(null);

  const createPR = useCallback(async (command: CreatePurchaseRequisitionCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.procurement.createPurchaseRequisition.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
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
