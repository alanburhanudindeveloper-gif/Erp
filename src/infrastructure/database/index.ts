export type { ErpRepository, RepositoryListOptions } from './repositories/erpRepository';
export type { ErpCollectionRepository } from './repositories/erpCollectionRepository';
export { createErpCollectionRepository } from './repositories/erpCollectionRepository';
export { createInMemoryErpRepository, type InMemoryRecord } from './repositories/inMemoryErpRepository';
export { createErpServerRepository } from './erpServerRepository';
export {
  ERP_AUTHORITATIVE_COLLECTIONS,
  assertErpSourceOfTruth,
  classifyStorageIntent,
  isUiOnlyStorageKey,
  type ErpPersistenceScope,
} from './persistencePolicy';
