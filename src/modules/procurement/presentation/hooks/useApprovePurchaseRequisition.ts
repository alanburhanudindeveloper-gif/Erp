import { useState, useCallback } from 'react';
import type { PurchaseRequisition } from '../../../../types';
import type { ApprovePurchaseRequisitionCommand } from '../../application/commands/approvePurchaseRequisitionCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useApprovePurchaseRequisition() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseRequisition | null>(null);

  const approvePR = useCallback(async (command: ApprovePurchaseRequisitionCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.procurement.approvePurchaseRequisition.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown approval error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    approvePR,
    isPending,
    error,
    result,
  };
}
