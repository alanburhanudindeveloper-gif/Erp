import { useState, useCallback } from 'react';
import type { ReleaseQcInspectionResult } from '../../application/commands/releaseQcInspectionCommand';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useReleaseQcInspection() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReleaseQcInspectionResult | null>(null);

  const releaseInspection = useCallback(
    async (
      inspectionId: string,
      payload: {
        decision: 'PASS' | 'FAIL';
        disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
        notes?: string;
        actor?: string;
        role?: string;
      }
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const outcome = await erpApiClient.quality.releaseInspection(inspectionId, payload);
        setResult(outcome);
        return { success: true, data: outcome };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to release QC inspection';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    releaseInspection,
    isPending,
    error,
    result,
  };
}
