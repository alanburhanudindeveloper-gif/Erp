import type { PurchaseRequisition, PurchaseRequisitionStatus } from '../../../../types';
import type { IProcurementRepository } from '../../procurementRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListPurchaseRequisitionsQuery extends PaginationQuery {
  status?: PurchaseRequisitionStatus;
  department?: string;
}

export class ListPurchaseRequisitionsHandler {
  constructor(private readonly procurementRepo: IProcurementRepository) {}

  execute(query: ListPurchaseRequisitionsQuery = {}): PaginatedResult<PurchaseRequisition> {
    let prs = this.procurementRepo.listPurchaseRequisitions();

    if (query.status) {
      prs = prs.filter((p) => p.status === query.status);
    }
    if (query.department) {
      prs = prs.filter((p) => p.department === query.department);
    }

    return paginateItems(prs, query);
  }
}
