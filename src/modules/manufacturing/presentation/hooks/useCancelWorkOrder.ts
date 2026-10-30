import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import type { CancelWorkOrderCommand } from '../../application/commands/cancelWorkOrderCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useCancelWorkOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const cancelOrder = useCallback(async (command: CancelWorkOrderCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.manufacturing.cancelWorkOrder.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
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
