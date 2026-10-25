export interface RepositoryListOptions<TRecord extends object> {
  filter?: (record: TRecord) => boolean;
  sort?: (left: TRecord, right: TRecord) => number;
  limit?: number;
}

export interface ErpRepository<TRecord extends object = object> {
  list(collection: string, options?: RepositoryListOptions<TRecord>): TRecord[];
  get(collection: string, id: string): TRecord | undefined;
  save(collection: string, records: TRecord[]): TRecord[];
  upsert(collection: string, record: TRecord, idKey: keyof TRecord): TRecord;
  remove(collection: string, id: string): boolean;
  clear(collection: string): void;
  snapshot(): Record<string, TRecord[]>;
}
