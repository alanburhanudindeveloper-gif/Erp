import type { NonConformanceReport } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListOpenNcrsQuery extends PaginationQuery {
  sku?: string;
  orderNumber?: string;
}

export class ListOpenNcrsHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(query: ListOpenNcrsQuery = {}): PaginatedResult<NonConformanceReport> {
    let ncrs = this.qualityRepo.listOpenNcrs();

    if (query.sku) {
      ncrs = ncrs.filter((n) => n.productSku === query.sku);
    }
    if (query.orderNumber) {
      ncrs = ncrs.filter((n) => n.orderNumber === query.orderNumber);
    }

    return paginateItems(ncrs, query);
  }
}
