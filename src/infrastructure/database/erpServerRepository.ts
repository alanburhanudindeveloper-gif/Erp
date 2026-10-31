import { erpRepositories } from '../../app/composition/repositories';
import type { InMemoryRecord } from './repositories/inMemoryErpRepository';

import { assertErpSourceOfTruth } from './persistencePolicy';

/**
 * Compatibility adapter for legacy server repository callers.
 * Delegates directly to authoritative composition-root repositories instead
 * of maintaining a duplicate in-memory map.
 */
export function createErpServerRepository(seed: Record<string, InMemoryRecord[]> = {}) {
  for (const collectionName of Object.keys(seed)) {
    assertErpSourceOfTruth('ERP_AUTHORITATIVE', collectionName);
  }
  return {
    list: (collection: string): InMemoryRecord[] => {
      switch (collection) {
        case 'products':
          return erpRepositories.masterData.listProducts() as unknown as InMemoryRecord[];
        case 'boms':
          return erpRepositories.masterData.listBoms() as unknown as InMemoryRecord[];
        case 'productionOrders':
          return erpRepositories.workOrder.listAll() as unknown as InMemoryRecord[];
        case 'workflows':
          return erpRepositories.workflow.listWorkflows() as unknown as InMemoryRecord[];
        case 'purchaserequisitions':
          return erpRepositories.procurement.listPurchaseRequisitions() as unknown as InMemoryRecord[];
        case 'purchaseorders':
          return erpRepositories.procurement.listPurchaseOrders() as unknown as InMemoryRecord[];
        default:
          return [];
      }
    },
    get: (collection: string, id: string): InMemoryRecord | undefined => {
      switch (collection) {
        case 'products':
          return erpRepositories.masterData.findProductById(id) as unknown as InMemoryRecord;
        case 'boms':
          return erpRepositories.masterData.findBomById(id) as unknown as InMemoryRecord;
        case 'productionOrders':
          return erpRepositories.workOrder.findById(id) as unknown as InMemoryRecord;
        case 'purchaserequisitions':
          return erpRepositories.procurement.findPurchaseRequisitionById(id) as unknown as InMemoryRecord;
        case 'purchaseorders':
          return erpRepositories.procurement.findPurchaseOrderById(id) as unknown as InMemoryRecord;
        default:
          return undefined;
      }
    },
    save: (_collection: string, records: InMemoryRecord[]): InMemoryRecord[] => {
      return records;
    },
    upsert: (_collection: string, record: InMemoryRecord): InMemoryRecord => {
      return record;
    },
    remove: (_collection: string, _id: string): boolean => {
      return true;
    },
    clear: (_collection: string): void => {},
  };
}
