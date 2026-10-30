import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import type { DispatchProductionPlanCommand } from '../../application/commands/dispatchProductionPlanCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useDispatchProductionPlan() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const dispatchPlan = useCallback(async (command: DispatchProductionPlanCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.planning.dispatchProductionPlan.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown dispatch error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    dispatchPlan,
    isPending,
    error,
    result,
  };
}
