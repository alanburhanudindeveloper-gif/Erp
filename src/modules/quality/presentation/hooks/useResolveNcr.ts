import { useState, useCallback } from 'react';
import type { ResolveNcrCommand } from '../../application/commands/resolveNcrCommand';
import type { NcrResolutionResult } from '../../qualityService';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useResolveNcr() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NcrResolutionResult | null>(null);

  const resolveNcr = useCallback(async (command: ResolveNcrCommand) => {
    setIsPending(true);
    setError(null);
    try {
      const outcome = await erpApiClient.quality.resolveNcr(command.ncrId, {
        disposition: command.disposition,
        rootCause: command.rootCause,
        resolver: command.resolver,
        notes: command.notes,
      });
      setResult(outcome);
      return { success: true, data: outcome };
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
