import { useState, useCallback, useEffect } from 'react';
import type { QualityInspection } from '../../../../types';
import { erpApiClient } from '../../../../infrastructure/api/erpApiClient';

export interface UseInspectionsOptions {
  page?: number;
  limit?: number;
  sourceType?: string;
  sourceRef?: string;
  sku?: string;
  lotNumber?: string;
  result?: 'PASS' | 'FAIL' | 'CONCESSION';
  disposition?: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
  autoFetch?: boolean;
}

export function useInspections(options: UseInspectionsOptions = {}) {
  const [page, setPage] = useState(options.page ?? 1);
  const [limit, setLimit] = useState(options.limit ?? 50);
  const [sourceType, setSourceType] = useState<string | undefined>(options.sourceType);
  const [sourceRef, setSourceRef] = useState<string | undefined>(options.sourceRef);
  const [sku, setSku] = useState<string | undefined>(options.sku);
  const [lotNumber, setLotNumber] = useState<string | undefined>(options.lotNumber);
  const [resultFilter, setResultFilter] = useState<'PASS' | 'FAIL' | 'CONCESSION' | undefined>(options.result);
  const [dispositionFilter, setDispositionFilter] = useState<'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK' | undefined>(options.disposition);

  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await erpApiClient.quality.listInspections({
        page,
        limit,
        sourceType,
        sourceRef,
        sku,
        lotNumber,
        result: resultFilter,
        disposition: dispositionFilter,
      });
      setInspections(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quality inspections');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sourceType, sourceRef, sku, lotNumber, resultFilter, dispositionFilter]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchInspections();
    }
  }, [fetchInspections, options.autoFetch]);

  return {
    inspections,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    refresh: fetchInspections,
    setPage,
    setLimit,
    setSourceType,
    setSourceRef,
    setSku,
    setLotNumber,
    setResultFilter,
    setDispositionFilter,
  };
}
