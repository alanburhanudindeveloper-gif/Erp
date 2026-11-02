import type { Product, StockMovement } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import { INITIAL_PRODUCTS, INITIAL_STOCK_MOVEMENTS } from '../../lib/mockData';

export interface IInventoryRepository extends ITransactionalParticipant {
  listMovements(): StockMovement[];
  findMovementById(id: string): StockMovement | undefined;
  findMovementsBySku(sku: string): StockMovement[];
  recordMovement(movement: StockMovement): StockMovement;
  listProducts(): Product[];
  findProductBySku(sku: string): Product | undefined;
  saveProduct(product: Product): Product;
  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

export function createInventoryRepository(
  initialMovements: StockMovement[] = INITIAL_STOCK_MOVEMENTS,
  initialProducts: Product[] = INITIAL_PRODUCTS
): IInventoryRepository {
  const movementCollection: ErpCollectionRepository<StockMovement> = createErpCollectionRepository<StockMovement>(
    'stockmovements',
    initialMovements
  );

  const productCollection: ErpCollectionRepository<Product> = createErpCollectionRepository<Product>(
    'products',
    initialProducts
  );

  return {
    listMovements: () => movementCollection.list(),
    findMovementById: (id: string) => movementCollection.get(id),
    findMovementsBySku: (sku: string) => movementCollection.list().filter((m) => m.sku === sku),
    recordMovement: (movement: StockMovement) => movementCollection.upsert(movement, 'id'),
    listProducts: () => productCollection.list(),
    findProductBySku: (sku: string) => productCollection.list().find((p) => p.sku === sku || p.id === sku),
    saveProduct: (product: Product) => productCollection.upsert(product, 'id'),
    createSnapshot: () => ({
      movements: movementCollection.createSnapshot(),
      products: productCollection.createSnapshot(),
    }),
    restoreSnapshot: (snapshot: unknown) => {
      if (snapshot && typeof snapshot === 'object') {
        const s = snapshot as { movements?: unknown; products?: unknown };
        if (s.movements) movementCollection.restoreSnapshot(s.movements);
        if (s.products) productCollection.restoreSnapshot(s.products);
      }
    },
  };
}

