import { useState, useCallback } from 'react';
import type { ResolveNcrCommand } from '../../application/commands/resolveNcrCommand';
import type { NcrResolutionResult } from '../../qualityService';
import { erpApplication } from '../../../../app/composition/dependencies';

export function useResolveNcr() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NcrResolutionResult | null>(null);

  const resolveNcr = useCallback(async (command: ResolveNcrCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = erpApplication.quality.resolveNcr.execute(command);
      if (outcome.isSuccess) {
        setResult(outcome.value);
        return { success: true, data: outcome.value };
      } else {
        const errorMsg = outcome.error.message;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown resolution error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    resolveNcr,
    isPending,
    error,
    result,
  };
}
