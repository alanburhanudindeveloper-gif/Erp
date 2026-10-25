import { createInMemoryErpRepository, type InMemoryRecord } from './repositories/inMemoryErpRepository';
import { assertErpSourceOfTruth } from './persistencePolicy';
import {
  INITIAL_BOMS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_WORKFLOWS,
} from '../../lib/mockData';

export function createErpServerRepository(
  seed: Record<string, InMemoryRecord[]> = {}
): ReturnType<typeof createInMemoryErpRepository<InMemoryRecord>> {
  const authoritativeSeed: Record<string, InMemoryRecord[]> = {
    products: INITIAL_PRODUCTS as unknown as InMemoryRecord[],
    boms: INITIAL_BOMS as unknown as InMemoryRecord[],
    productionOrders: INITIAL_PRODUCTION_ORDERS as unknown as InMemoryRecord[],
    workflows: INITIAL_WORKFLOWS as unknown as InMemoryRecord[],
    ...seed,
  };

  for (const [collectionName, records] of Object.entries(authoritativeSeed)) {
    if (!records) {
      continue;
    }
    assertErpSourceOfTruth('ERP_AUTHORITATIVE', collectionName);
  }

  return createInMemoryErpRepository<InMemoryRecord>(authoritativeSeed);
}
