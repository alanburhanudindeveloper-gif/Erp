import type {
  Product,
  BillOfMaterials,
  Routing,
  WorkCenter,
  Supplier,
} from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import {
  INITIAL_PRODUCTS,
  INITIAL_BOMS,
  INITIAL_ROUTINGS,
  INITIAL_WORK_CENTERS,
  INITIAL_SUPPLIERS,
} from '../../lib/mockData';

export interface IMasterDataRepository {
  listProducts(): Product[];
  findProductById(id: string): Product | undefined;
  saveProduct(product: Product): Product;

  listBoms(): BillOfMaterials[];
  findBomById(id: string): BillOfMaterials | undefined;
  saveBom(bom: BillOfMaterials): BillOfMaterials;

  listRoutings(): Routing[];
  findRoutingById(id: string): Routing | undefined;
  saveRouting(routing: Routing): Routing;

  listWorkCenters(): WorkCenter[];
  findWorkCenterById(id: string): WorkCenter | undefined;
  saveWorkCenter(wc: WorkCenter): WorkCenter;

  listSuppliers(): Supplier[];
  findSupplierById(id: string): Supplier | undefined;
  saveSupplier(supplier: Supplier): Supplier;
}

export function createMasterDataRepository(
  initialProducts: Product[] = INITIAL_PRODUCTS,
  initialBoms: BillOfMaterials[] = INITIAL_BOMS,
  initialRoutings: Routing[] = INITIAL_ROUTINGS,
  initialWorkCenters: WorkCenter[] = INITIAL_WORK_CENTERS,
  initialSuppliers: Supplier[] = INITIAL_SUPPLIERS
): IMasterDataRepository {
  const productCollection: ErpCollectionRepository<Product> = createErpCollectionRepository<Product>(
    'products',
    initialProducts
  );

  const bomCollection: ErpCollectionRepository<BillOfMaterials> = createErpCollectionRepository<BillOfMaterials>(
    'billofmaterials',
    initialBoms
  );

  const routingCollection: ErpCollectionRepository<Routing> = createErpCollectionRepository<Routing>(
    'routings',
    initialRoutings
  );

  const workCenterCollection: ErpCollectionRepository<WorkCenter> = createErpCollectionRepository<WorkCenter>(
    'workcenters',
    initialWorkCenters
  );

  const supplierCollection: ErpCollectionRepository<Supplier> = createErpCollectionRepository<Supplier>(
    'suppliers',
    initialSuppliers
  );

  return {
    listProducts: () => productCollection.list(),
    findProductById: (id: string) => productCollection.get(id),
    saveProduct: (product: Product) => productCollection.upsert(product, 'id'),

    listBoms: () => bomCollection.list(),
    findBomById: (id: string) => bomCollection.get(id),
    saveBom: (bom: BillOfMaterials) => bomCollection.upsert(bom, 'id'),

    listRoutings: () => routingCollection.list(),
    findRoutingById: (id: string) => routingCollection.get(id),
    saveRouting: (routing: Routing) => routingCollection.upsert(routing, 'id'),

    listWorkCenters: () => workCenterCollection.list(),
    findWorkCenterById: (id: string) => workCenterCollection.get(id),
    saveWorkCenter: (wc: WorkCenter) => workCenterCollection.upsert(wc, 'id'),

    listSuppliers: () => supplierCollection.list(),
    findSupplierById: (id: string) => supplierCollection.get(id),
    saveSupplier: (supplier: Supplier) => supplierCollection.upsert(supplier, 'id'),
  };
}
