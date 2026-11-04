import type { QualityInspection } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, type DomainError } from '../../../../shared/kernel/errors';

export interface GetInspectionByIdQueryParams {
  id: string;
}

export class GetInspectionByIdHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(params: GetInspectionByIdQueryParams | string): Result<QualityInspection, DomainError> {
    const id = typeof params === 'string' ? params : params?.id;
    const inspection = this.qualityRepo.findInspectionById(id);
    if (!inspection) {
      return fail(new NotFoundError('QualityInspection', id));
    }
    return ok(inspection);
  }
}
