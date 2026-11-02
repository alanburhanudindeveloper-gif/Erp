import type { MaterialRequest } from '../../../../types';
import type { IMaterialRequestRepository } from '../../materialRequestRepository';
import { pickMaterialRequest } from '../../materialRequestLifecycleService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface PickMaterialRequestCommand {
  id: string;
  pickedBy: string;
  pickedAt?: string;
}

export class PickMaterialRequestHandler {
  constructor(private readonly materialRequestRepo: IMaterialRequestRepository) {}

  execute(command: PickMaterialRequestCommand): Result<MaterialRequest, DomainError> {
    const existing = this.materialRequestRepo.findById(command.id);
    if (!existing) {
      return fail(new NotFoundError('MaterialRequest', command.id));
    }

    if (existing.status === 'DELIVERED') {
      return fail(new ValidationError(`Material request ${existing.requestNumber} is already DELIVERED.`));
    }

    const updated = pickMaterialRequest(
      existing,
      command.pickedBy || 'Warehouse Operator',
      command.pickedAt
    );

    const saved = this.materialRequestRepo.save(updated);
    return ok(saved);
  }
}
