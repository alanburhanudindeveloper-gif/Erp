import type { QualityInspection } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, type DomainError } from '../../../../shared/kernel/errors';

export interface GetInspectionByIdQueryParams {
  id: string;
}

export class GetInspectionByIdHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(params: GetInspectionByIdQueryParams): Result<QualityInspection, DomainError> {
    const inspection = this.qualityRepo.findInspectionById(params.id);
    if (!inspection) {
      return fail(new NotFoundError('QualityInspection', params.id));
    }
    return ok(inspection);
  }
}
