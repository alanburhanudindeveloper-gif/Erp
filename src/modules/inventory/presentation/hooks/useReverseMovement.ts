import { useState, useCallback } from 'react';
import type { StockMovement } from '../../../../types';
import type { ReverseMovementCommand } from '../../application/commands/reverseMovementCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useReverseMovement() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockMovement | null>(null);

  const reverseMovement = useCallback(async (command: ReverseMovementCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const data = await erpApiClient.inventory.reverseMovement(command.movementId, {
        reason: command.reason,
        actor: command.actor,
        role: command.role,
      });
      setResult(data);
      return { success: true, data };
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
