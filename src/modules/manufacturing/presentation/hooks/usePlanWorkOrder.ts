import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import type { PlanWorkOrderCommand } from '../../application/commands/planWorkOrderCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function usePlanWorkOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const planOrder = useCallback(async (command: PlanWorkOrderCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.manufacturing.planWorkOrder.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown planning error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    planOrder,
    isPending,
    error,
    result,
  };
}
