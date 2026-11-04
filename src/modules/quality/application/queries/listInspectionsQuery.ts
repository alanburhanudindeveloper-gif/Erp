import type { QualityInspection } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListInspectionsQueryParams extends PaginationQuery {
  sourceType?: string;
  sourceRef?: string;
  sku?: string;
  lotNumber?: string;
  result?: 'PASS' | 'FAIL' | 'CONCESSION';
  disposition?: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
}

export class ListInspectionsHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(params: ListInspectionsQueryParams = {}): PaginatedResult<QualityInspection> {
    let items = this.qualityRepo.listInspections();

    if (params.sourceType && params.sourceType !== 'ALL') {
      items = items.filter((i) => i.sourceType === params.sourceType);
    }

    if (params.sourceRef && params.sourceRef.trim()) {
      const q = params.sourceRef.trim().toLowerCase();
      items = items.filter((i) => i.sourceRef.toLowerCase().includes(q));
    }

    if (params.sku && params.sku.trim()) {
      const q = params.sku.trim().toLowerCase();
      items = items.filter((i) => i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q));
    }

    if (params.lotNumber && params.lotNumber.trim()) {
      const q = params.lotNumber.trim().toLowerCase();
      items = items.filter((i) => i.lotNumber.toLowerCase().includes(q));
    }

    if (params.result) {
      items = items.filter((i) => i.result === params.result);
    }

    if (params.disposition && (params.disposition as string) !== 'ALL') {
      items = items.filter((i) => i.disposition === params.disposition);
    }

    return paginateItems(items, { page: params.page ?? 1, limit: params.limit ?? 50 });
  }
}
