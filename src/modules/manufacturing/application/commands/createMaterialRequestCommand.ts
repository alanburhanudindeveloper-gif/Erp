import type { MaterialRequest } from '../../../../types';
import type { IMaterialRequestRepository } from '../../materialRequestRepository';
import { createMaterialRequest, type MaterialRequestDraftInput } from '../../materialRequestLifecycleService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export type CreateMaterialRequestCommand = MaterialRequestDraftInput;

export class CreateMaterialRequestHandler {
  constructor(private readonly materialRequestRepo: IMaterialRequestRepository) {}

  execute(command: CreateMaterialRequestCommand): Result<MaterialRequest, DomainError> {
    if (!command.sourceType) {
      return fail(new ValidationError('sourceType is required to create a material request'));
    }
    if (!command.destinationLine || !command.destinationLine.trim()) {
      return fail(new ValidationError('destinationLine is required'));
    }
    if (!Array.isArray(command.items) || command.items.length === 0) {
      return fail(new ValidationError('At least one item is required in a material request'));
    }

    const newRequest = createMaterialRequest(command);
    const saved = this.materialRequestRepo.save(newRequest);
    return ok(saved);
  }
}
