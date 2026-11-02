import type { ProductionOrder } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import { INITIAL_PRODUCTION_ORDERS } from '../../lib/mockData';

export interface IWorkOrderRepository extends ITransactionalParticipant {
  listAll(): ProductionOrder[];
  findById(id: string): ProductionOrder | undefined;
  findByOrderNumber(orderNumber: string): ProductionOrder | undefined;
  save(order: ProductionOrder): ProductionOrder;
  saveAll(orders: ProductionOrder[]): ProductionOrder[];
  remove(id: string): boolean;
  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

export function createWorkOrderRepository(
  initialData: ProductionOrder[] = INITIAL_PRODUCTION_ORDERS
): IWorkOrderRepository {
  const collection: ErpCollectionRepository<ProductionOrder> = createErpCollectionRepository<ProductionOrder>(
    'productionorders',
    initialData
  );

  return {
    listAll: () => collection.list(),
    findById: (id: string) => collection.get(id),
    findByOrderNumber: (orderNumber: string) => collection.list().find((o) => o.orderNumber === orderNumber),
    save: (order: ProductionOrder) => collection.upsert(order, 'id'),
    saveAll: (orders: ProductionOrder[]) => collection.save(orders),
    remove: (id: string) => collection.remove(id),
    createSnapshot: () => collection.createSnapshot(),
    restoreSnapshot: (snapshot: unknown) => collection.restoreSnapshot(snapshot),
  };
}
