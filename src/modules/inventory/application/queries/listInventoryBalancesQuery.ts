import type { Product } from '../../../../types';
import type { IInventoryRepository } from '../../inventoryRepository';
import { calculate5BucketBalance, type BucketBalance } from '../../inventoryLedgerService';
import { paginateItems, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface InventoryBalanceItem {
  id: string;
  sku: string;
  name: string;
  type: Product['type'];
  baseUom: string;
  category: string;
  currentStock: number;
  allocatedStock: number;
  safetyStock: number;
  availableToPromise: number;
  isBelowBuffer: boolean;
  buckets: BucketBalance;
}

export interface ListInventoryBalancesQueryParams {
  page?: number;
  limit?: number;
  sku?: string;
  type?: string;
  category?: string;
  belowBufferOnly?: boolean;
}

export class ListInventoryBalancesHandler {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  execute(params: ListInventoryBalancesQueryParams = {}): PaginatedResult<InventoryBalanceItem> {
    const products = this.inventoryRepo.listProducts();
    const allMovements = this.inventoryRepo.listMovements();

    let items: InventoryBalanceItem[] = products.map((product) => {
      const buckets = calculate5BucketBalance(product.sku, allMovements);
      const atp = Math.max(0, product.currentStock - product.allocatedStock);
      const isBelowBuffer = atp < product.safetyStock;

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        type: product.type,
        baseUom: product.baseUom,
        category: product.category,
        currentStock: product.currentStock,
        allocatedStock: product.allocatedStock,
        safetyStock: product.safetyStock,
        availableToPromise: atp,
        isBelowBuffer,
        buckets,
      };
    });

    if (params.sku && params.sku.trim()) {
      const query = params.sku.trim().toLowerCase();
      items = items.filter(
        (i) => i.sku.toLowerCase().includes(query) || i.name.toLowerCase().includes(query)
      );
    }

    if (params.type && params.type !== 'ALL') {
      items = items.filter((i) => i.type === params.type);
    }

    if (params.category && params.category !== 'ALL') {
      items = items.filter((i) => i.category === params.category);
    }

    if (params.belowBufferOnly) {
      items = items.filter((i) => i.isBelowBuffer);
    }

    return paginateItems(items, { page: params.page ?? 1, limit: params.limit ?? 50 });
  }
}
