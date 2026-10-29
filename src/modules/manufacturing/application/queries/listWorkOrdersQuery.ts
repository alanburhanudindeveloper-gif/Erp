import type { ProductionOrder, ProductionOrderStatus } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListWorkOrdersQuery extends PaginationQuery {
  status?: ProductionOrderStatus;
  sku?: string;
  plantId?: string;
}

export class ListWorkOrdersHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(query: ListWorkOrdersQuery = {}): PaginatedResult<ProductionOrder> {
    let orders = this.workOrderRepo.listAll();

    if (query.status) {
      orders = orders.filter((o) => o.status === query.status);
    }
    if (query.sku) {
      orders = orders.filter((o) => o.productSku === query.sku);
    }
    if (query.plantId) {
      orders = orders.filter((o) => o.plantId === query.plantId);
    }

    return paginateItems(orders, query);
  }
}
