import type { MaterialRequest } from '../../../../types';
import type { IMaterialRequestRepository } from '../../materialRequestRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface DeliverMaterialRequestCommand {
  id: string;
  deliveredBy: string;
  destinationLine: string;
  deliveredAt?: string;
}

export class DeliverMaterialRequestHandler {
  constructor(private readonly materialRequestRepo: IMaterialRequestRepository) {}

  execute(command: DeliverMaterialRequestCommand): Result<MaterialRequest, DomainError> {
    const existing = this.materialRequestRepo.findById(command.id);
    if (!existing) {
      return fail(new NotFoundError('MaterialRequest', command.id));
    }

    if (existing.status !== 'READY') {
      return fail(
        new ValidationError(
          `Material request ${existing.requestNumber} must be in READY (picked) status before delivery. Current status: ${existing.status}.`
        )
      );
    }

    if (!command.deliveredBy || !command.deliveredBy.trim()) {
      return fail(new ValidationError('deliveredBy is required to confirm line delivery'));
    }

    const timestamp = command.deliveredAt || new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updated: MaterialRequest = {
      ...existing,
      status: 'DELIVERED',
      deliveredBy: command.deliveredBy,
      deliveredAt: timestamp,
      destinationLine: command.destinationLine || existing.destinationLine,
      items: existing.items.map((it) => ({
        ...it,
        deliveredQuantity: it.pickedQuantity || it.requestedQuantity,
        status: 'DELIVERED',
      })),
    };

    const saved = this.materialRequestRepo.save(updated);
    return ok(saved);
  }
}
