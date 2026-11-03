import { useState, useCallback } from 'react';
import type { EvaluateInspectionCommand } from '../../application/commands/evaluateInspectionCommand';
import type { InspectionEvaluationResult } from '../../qualityService';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useEvaluateInspection() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectionEvaluationResult | null>(null);

  const evaluateInspection = useCallback(async (command: EvaluateInspectionCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = await erpApiClient.quality.evaluateInspection(command);
      setResult(outcome);
      return { success: true, data: outcome };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown evaluation error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    evaluateInspection,
    isPending,
    error,
    result,
  };
}
