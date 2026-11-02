import type { MaterialRequest } from '../../../../types';
import type { IMaterialRequestRepository } from '../../materialRequestRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, type DomainError } from '../../../../shared/kernel/errors';

export interface GetMaterialRequestByIdParams {
  id: string;
}

export class GetMaterialRequestByIdHandler {
  constructor(private readonly materialRequestRepo: IMaterialRequestRepository) {}

  execute(params: GetMaterialRequestByIdParams): Result<MaterialRequest, DomainError> {
    const request = this.materialRequestRepo.findById(params.id);
    if (!request) {
      return fail(new NotFoundError('MaterialRequest', params.id));
    }
    return ok(request);
  }
}
