import { useState, useCallback } from 'react';
import type { MaterialRequest } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export function useCreateMaterialRequest() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaterialRequest | null>(null);

  const createRequest = useCallback(
    async (payload: {
      sourceType: MaterialRequest['sourceType'];
      sourceReferenceId: string;
      productSku?: string;
      requester?: string;
      department?: string;
      requiredDate?: string;
      destinationLine: string;
      priority?: MaterialRequest['priority'];
      items: Array<{
        productId?: string;
        sku: string;
        name: string;
        requestedQuantity: number;
        pickedQuantity?: number;
        deliveredQuantity?: number;
        uom: string;
        fromWarehouse?: string;
        toLocation?: string;
        status?: string;
      }>;
      notes?: string;
    }) => {
      setIsPending(true);
      setError(null);
      try {
        const created = await erpApiClient.manufacturing.createMaterialRequest(payload);
        setResult(created);
        return { success: true, data: created };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create material request';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    createRequest,
    isPending,
    error,
    result,
  };
}
