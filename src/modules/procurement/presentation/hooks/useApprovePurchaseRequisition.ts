import { useState, useCallback } from 'react';
import type { PurchaseRequisition } from '../../../../types';
import type { ApprovePurchaseRequisitionCommand } from '../../application/commands/approvePurchaseRequisitionCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useApprovePurchaseRequisition() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseRequisition | null>(null);

  const approvePR = useCallback(async (command: ApprovePurchaseRequisitionCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const approved = await erpApiClient.procurement.approvePurchaseRequisition(command.prId, {
        actorName: command.actorName,
        actorRole: command.actorRole,
      });
      setResult(approved);
      return { success: true, data: approved };
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
