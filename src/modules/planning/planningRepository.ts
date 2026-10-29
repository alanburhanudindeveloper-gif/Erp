import type { ProductionPlanItem, DemandRecord, MpsRecord } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import {
  INITIAL_PRODUCTION_PLANS,
  INITIAL_DEMANDS,
  INITIAL_MPS,
} from '../../lib/mockData';

export interface IPlanningRepository {
  listProductionPlans(): ProductionPlanItem[];
  findProductionPlanById(id: string): ProductionPlanItem | undefined;
  saveProductionPlan(plan: ProductionPlanItem): ProductionPlanItem;

  listDemands(): DemandRecord[];
  findDemandById(id: string): DemandRecord | undefined;
  saveDemand(demand: DemandRecord): DemandRecord;

  listMpsRecords(): MpsRecord[];
  findMpsRecordById(id: string): MpsRecord | undefined;
  saveMpsRecord(record: MpsRecord): MpsRecord;
}

export function createPlanningRepository(
  initialPlans: ProductionPlanItem[] = INITIAL_PRODUCTION_PLANS,
  initialDemands: DemandRecord[] = INITIAL_DEMANDS,
  initialMps: MpsRecord[] = INITIAL_MPS
): IPlanningRepository {
  const planCollection: ErpCollectionRepository<ProductionPlanItem> = createErpCollectionRepository<ProductionPlanItem>(
    'productionplans',
    initialPlans
  );

  const demandCollection: ErpCollectionRepository<DemandRecord> = createErpCollectionRepository<DemandRecord>(
    'demands',
    initialDemands
  );

  const mpsCollection: ErpCollectionRepository<MpsRecord> = createErpCollectionRepository<MpsRecord>(
    'mpsrecords',
    initialMps
  );

  return {
    listProductionPlans: () => planCollection.list(),
    findProductionPlanById: (id: string) => planCollection.get(id),
    saveProductionPlan: (plan: ProductionPlanItem) => planCollection.upsert(plan, 'id'),

    listDemands: () => demandCollection.list(),
    findDemandById: (id: string) => demandCollection.get(id),
    saveDemand: (demand: DemandRecord) => demandCollection.upsert(demand, 'id'),

    listMpsRecords: () => mpsCollection.list(),
    findMpsRecordById: (id: string) => mpsCollection.get(id),
    saveMpsRecord: (record: MpsRecord) => mpsCollection.upsert(record, 'id'),
  };
}
