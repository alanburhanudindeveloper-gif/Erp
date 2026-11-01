import { useState, useCallback } from 'react';
import type { ProductionOrder } from '../../../../types';
import type { PlanWorkOrderCommand } from '../../application/commands/planWorkOrderCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function usePlanWorkOrder() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionOrder | null>(null);

  const planOrder = useCallback(async (command: PlanWorkOrderCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const updated = await erpApiClient.manufacturing.planWorkOrder(command.orderId, {
        bom: command.bom,
        routing: command.routing,
        actor: command.actor,
        role: command.role,
      });
      setResult(updated);
      return { success: true, data: updated };
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
