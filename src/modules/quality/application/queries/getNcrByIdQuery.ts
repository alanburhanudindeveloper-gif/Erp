import type { NonConformanceReport } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, type DomainError } from '../../../../shared/kernel/errors';

export interface GetNcrByIdQueryParams {
  id: string;
}

export class GetNcrByIdHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(params: GetNcrByIdQueryParams): Result<NonConformanceReport, DomainError> {
    const ncr = this.qualityRepo.findNcrById(params.id);
    if (!ncr) {
      return fail(new NotFoundError('NonConformanceReport', params.id));
    }
    return ok(ncr);
  }
}
