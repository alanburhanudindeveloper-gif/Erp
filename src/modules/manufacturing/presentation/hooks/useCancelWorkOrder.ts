import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import type { CancelWorkOrderCommand } from '../../application/commands/cancelWorkOrderCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useCancelWorkOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const cancelOrder = useCallback(async (command: CancelWorkOrderCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const updated = await erpApiClient.manufacturing.cancelWorkOrder(command.orderId, {
        reason: command.reason,
        actor: command.actor,
        role: command.role,
      });
      setResult(updated);
      return { success: true, data: updated };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown cancellation error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    cancelOrder,
    isPending,
    error,
    result,
  };
}
