import type { StockMovement } from '../../../../types';
import type { IInventoryRepository } from '../../inventoryRepository';
import { paginateItems, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListStockMovementsQueryParams {
  page?: number;
  limit?: number;
  sku?: string;
  movementType?: string;
  stockBucket?: string;
  lotNumber?: string;
}

export class ListStockMovementsHandler {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  execute(params: ListStockMovementsQueryParams = {}): PaginatedResult<StockMovement> {
    let movements = this.inventoryRepo.listMovements();

    if (params.sku && params.sku.trim()) {
      const searchSku = params.sku.trim().toLowerCase();
      movements = movements.filter((m) => m.sku.toLowerCase().includes(searchSku));
    }

    if (params.movementType && params.movementType !== 'ALL') {
      movements = movements.filter((m) => m.movementType === params.movementType);
    }

    if (params.stockBucket && params.stockBucket !== 'ALL') {
      movements = movements.filter((m) => m.stockBucket === params.stockBucket);
    }

    if (params.lotNumber && params.lotNumber.trim()) {
      const searchLot = params.lotNumber.trim().toLowerCase();
      movements = movements.filter((m) => (m.lotNumber || '').toLowerCase().includes(searchLot));
    }

    // Sort descending by timestamp / id
    movements = [...movements].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return paginateItems(movements, { page: params.page ?? 1, limit: params.limit ?? 50 });
  }
}
