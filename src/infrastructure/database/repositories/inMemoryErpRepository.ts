import type { ErpRepository, RepositoryListOptions } from './erpRepository';

export type InMemoryRecord = { id?: string; [key: string]: unknown };

export function createInMemoryErpRepository<TRecord extends object = InMemoryRecord>(
  initialState: Record<string, TRecord[]> = {}
): ErpRepository<TRecord> {
  const store = new Map<string, TRecord[]>();

  for (const [collection, records] of Object.entries(initialState)) {
    store.set(collection, Array.isArray(records) ? records.map((record) => ({ ...record })) : []);
  }

  const list = (collection: string, options: RepositoryListOptions<TRecord> = {}): TRecord[] => {
    const base = store.get(collection) ?? [];
    const filtered = options.filter ? base.filter(options.filter) : base;
    const sorted = options.sort ? [...filtered].sort(options.sort) : filtered;
    return options.limit !== undefined ? sorted.slice(0, options.limit) : sorted;
  };

  const get = (collection: string, id: string): TRecord | undefined => {
    const recordMap = store.get(collection) ?? [];
    const item = recordMap.find((record) => String((record as Record<string, unknown>).id ?? (record as Record<string, unknown>)['id']) === id);
    return item ? { ...(item as object) } as TRecord : undefined;
  };

  const save = (collection: string, records: TRecord[]): TRecord[] => {
    const normalized = records.map((record) => ({ ...(record as object) }) as TRecord);
    store.set(collection, normalized);
    return normalized;
  };

  const upsert = (collection: string, record: TRecord, idKey: keyof TRecord): TRecord => {
    const collectionRecords = store.get(collection) ?? [];
    const nextRecord = { ...(record as object) } as TRecord;
    const keyValue = String((nextRecord as Record<string, unknown>)[String(idKey)] ?? (nextRecord as Record<string, unknown>).id ?? '');
    const existingIndex = collectionRecords.findIndex((current) => {
      const currentValue = String((current as Record<string, unknown>)[String(idKey)] ?? (current as Record<string, unknown>).id ?? '');
      return currentValue === keyValue;
    });

    if (existingIndex >= 0) {
      collectionRecords[existingIndex] = nextRecord;
      store.set(collection, collectionRecords);
      return { ...(nextRecord as object) } as TRecord;
    }

    const updated = [...collectionRecords, nextRecord];
    store.set(collection, updated);
    return { ...(nextRecord as object) } as TRecord;
  };

  const remove = (collection: string, id: string): boolean => {
    const current = store.get(collection) ?? [];
    const next = current.filter((record) => String((record as Record<string, unknown>).id ?? (record as Record<string, unknown>)['id']) !== id);
    const changed = next.length !== current.length;
    store.set(collection, next);
    return changed;
  };

  const clear = (collection: string): void => {
    store.set(collection, []);
  };

  const snapshot = (): Record<string, TRecord[]> => {
    return Object.fromEntries(
      Array.from(store.entries()).map(([collection, records]) => [collection, records.map((record) => ({ ...(record as object) }) as TRecord)])
    );
  };

  return {
    list,
    get,
    save,
    upsert,
    remove,
    clear,
    snapshot,
  };
}
