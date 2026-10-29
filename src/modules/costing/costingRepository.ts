import type { CostVarianceRecord } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import { INITIAL_COST_VARIANCES } from '../../lib/mockData';

export interface ICostingRepository {
  listCostVariances(): CostVarianceRecord[];
  findCostVarianceByOrderNumber(orderNumber: string): CostVarianceRecord | undefined;
  saveCostVariance(variance: CostVarianceRecord): CostVarianceRecord;
}

export function createCostingRepository(
  initialVariances: CostVarianceRecord[] = INITIAL_COST_VARIANCES
): ICostingRepository {
  const collection: ErpCollectionRepository<CostVarianceRecord> = createErpCollectionRepository<CostVarianceRecord>(
    'costvariances',
    initialVariances
  );

  return {
    listCostVariances: () => collection.list(),
    findCostVarianceByOrderNumber: (orderNumber: string) =>
      collection.list().find((v) => v.orderNumber === orderNumber),
    saveCostVariance: (variance: CostVarianceRecord) =>
      collection.upsert(variance, 'orderNumber'),
  };
}
