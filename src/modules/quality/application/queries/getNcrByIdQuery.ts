import type { NonConformanceReport } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, type DomainError } from '../../../../shared/kernel/errors';

export interface GetNcrByIdQueryParams {
  id: string;
}

export class GetNcrByIdHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(params: GetNcrByIdQueryParams | string): Result<NonConformanceReport, DomainError> {
    const id = typeof params === 'string' ? params : params?.id;
    const ncr = this.qualityRepo.findNcrById(id);
    if (!ncr) {
      return fail(new NotFoundError('NonConformanceReport', id));
    }
    return ok(ncr);
  }
}
