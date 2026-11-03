import type { NonConformanceReport } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListNcrsQueryParams extends PaginationQuery {
  status?: NonConformanceReport['status'] | 'ALL';
  disposition?: NonConformanceReport['disposition'] | 'ALL';
  sku?: string;
  orderNumber?: string;
  lotNumber?: string;
}

export class ListNcrsHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(params: ListNcrsQueryParams = {}): PaginatedResult<NonConformanceReport> {
    let items = this.qualityRepo.listNcrs();

    if (params.status && params.status !== 'ALL') {
      items = items.filter((n) => n.status === params.status);
    }

    if (params.disposition && params.disposition !== 'ALL') {
      items = items.filter((n) => n.disposition === params.disposition);
    }

    if (params.sku && params.sku.trim()) {
      const q = params.sku.trim().toLowerCase();
      items = items.filter((n) => n.productSku.toLowerCase().includes(q));
    }

    if (params.orderNumber && params.orderNumber.trim()) {
      const q = params.orderNumber.trim().toLowerCase();
      items = items.filter((n) => n.orderNumber.toLowerCase().includes(q));
    }

    if (params.lotNumber && params.lotNumber.trim()) {
      const q = params.lotNumber.trim().toLowerCase();
      items = items.filter((n) => n.lotNumber.toLowerCase().includes(q));
    }

    return paginateItems(items, { page: params.page ?? 1, limit: params.limit ?? 50 });
  }
}
