import { createInMemoryErpRepository, type InMemoryRecord } from './inMemoryErpRepository';
import { assertErpSourceOfTruth } from '../persistencePolicy';

export interface ErpCollectionRepository<T extends object = object> {
  list(): T[];
  get(id: string): T | undefined;
  save(records: T[]): T[];
  upsert(record: T, idKey?: keyof T): T;
  remove(id: string): boolean;
  clear(): void;
}

export function createErpCollectionRepository<T extends object>(
  collectionName: string,
  initialRecords: T[] = []
): ErpCollectionRepository<T> {
  assertErpSourceOfTruth('ERP_AUTHORITATIVE', collectionName);

  const repository = createInMemoryErpRepository<T>({
    [collectionName]: initialRecords,
  });

  return {
    list: () => repository.list(collectionName),
    get: (id) => repository.get(collectionName, id),
    save: (records) => repository.save(collectionName, records),
    upsert: (record, idKey = 'id' as keyof T) => repository.upsert(collectionName, record, idKey),
    remove: (id) => repository.remove(collectionName, id),
    clear: () => repository.clear(collectionName),
  };
}
