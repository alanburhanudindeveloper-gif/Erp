import type { PurchaseOrder, PurchaseOrderStatus } from '../../../../types';
import type { IProcurementRepository } from '../../procurementRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListPurchaseOrdersQuery extends PaginationQuery {
  status?: PurchaseOrderStatus;
  supplierId?: string;
}

export class ListPurchaseOrdersHandler {
  constructor(private readonly procurementRepo: IProcurementRepository) {}

  execute(query: ListPurchaseOrdersQuery = {}): PaginatedResult<PurchaseOrder> {
    let orders = this.procurementRepo.listPurchaseOrders();

    if (query.status) {
      orders = orders.filter((o) => o.status === query.status);
    }
    if (query.supplierId) {
      orders = orders.filter((o) => o.supplierId === query.supplierId);
    }

    return paginateItems(orders, query);
  }
}
