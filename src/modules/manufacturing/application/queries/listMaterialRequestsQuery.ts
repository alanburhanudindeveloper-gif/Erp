import type { MaterialRequest, MaterialRequestStatus } from '../../../../types';
import type { IMaterialRequestRepository } from '../../materialRequestRepository';
import { paginateItems, type PaginatedResult } from '../../../../shared/kernel/pagination';

export interface ListMaterialRequestsQueryParams {
  page?: number;
  limit?: number;
  sourceType?: 'NPI_TRIAL' | 'NPI_PILOT' | 'PRODUCTION_ORDER' | string;
  status?: MaterialRequestStatus | string;
  destinationLine?: string;
}

export class ListMaterialRequestsHandler {
  constructor(private readonly materialRequestRepo: IMaterialRequestRepository) {}

  execute(params: ListMaterialRequestsQueryParams = {}): PaginatedResult<MaterialRequest> {
    let requests = this.materialRequestRepo.listAll();

    if (params.sourceType && params.sourceType !== 'ALL') {
      if (params.sourceType === 'NPI') {
        requests = requests.filter((r) => r.sourceType === 'NPI_TRIAL' || r.sourceType === 'NPI_PILOT');
      } else if (params.sourceType === 'PRODUCTION') {
        requests = requests.filter((r) => r.sourceType === 'PRODUCTION_ORDER');
      } else {
        requests = requests.filter((r) => r.sourceType === params.sourceType);
      }
    }

    if (params.status && params.status !== 'ALL') {
      requests = requests.filter((r) => r.status === params.status);
    }

    if (params.destinationLine) {
      requests = requests.filter((r) =>
        r.destinationLine.toLowerCase().includes(params.destinationLine!.toLowerCase())
      );
    }

    return paginateItems(requests, { page: params.page ?? 1, limit: params.limit ?? 50 });
  }
}
