import type { MaterialRequest } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import { INITIAL_MATERIAL_REQUESTS } from '../../lib/mockData';

export interface IMaterialRequestRepository extends ITransactionalParticipant {
  listAll(): MaterialRequest[];
  findById(id: string): MaterialRequest | undefined;
  findByRequestNumber(requestNumber: string): MaterialRequest | undefined;
  save(request: MaterialRequest): MaterialRequest;
  saveAll(requests: MaterialRequest[]): MaterialRequest[];
  remove(id: string): boolean;
  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

export function createMaterialRequestRepository(
  initialData: MaterialRequest[] = INITIAL_MATERIAL_REQUESTS
): IMaterialRequestRepository {
  const collection: ErpCollectionRepository<MaterialRequest> = createErpCollectionRepository<MaterialRequest>(
    'materialrequests',
    initialData
  );

  return {
    listAll: () => collection.list(),
    findById: (id: string) => collection.get(id),
    findByRequestNumber: (requestNumber: string) => collection.list().find((m) => m.requestNumber === requestNumber),
    save: (request: MaterialRequest) => collection.upsert(request, 'id'),
    saveAll: (requests: MaterialRequest[]) => collection.save(requests),
    remove: (id: string) => collection.remove(id),
    createSnapshot: () => collection.createSnapshot(),
    restoreSnapshot: (snapshot: unknown) => collection.restoreSnapshot(snapshot),
  };
}
