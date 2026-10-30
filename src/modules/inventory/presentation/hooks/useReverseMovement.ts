import { useState, useCallback } from 'react';
import type { StockMovement } from '../../../../types';
import type { ReverseMovementCommand } from '../../application/commands/reverseMovementCommand';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useReverseMovement() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockMovement | null>(null);

  const reverseMovement = useCallback(async (command: ReverseMovementCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.inventory.reverseMovement.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown reversal error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    reverseMovement,
    isPending,
    error,
    result,
  };
}
