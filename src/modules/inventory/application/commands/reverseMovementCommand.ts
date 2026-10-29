import { reverseStockMovement } from '../../inventoryLedgerService';
import type { IInventoryRepository } from '../../inventoryRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';
import type { StockMovement } from '../../../../types';

export interface ReverseMovementCommand {
  movementId: string;
  actor: string;
  role: string;
  reason: string;
}

export class ReverseMovementHandler {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  execute(command: ReverseMovementCommand): Result<StockMovement, DomainError> {
    const original = this.inventoryRepo.findMovementById(command.movementId);
    if (!original) {
      return fail(new NotFoundError('StockMovement', command.movementId));
    }

    const result = reverseStockMovement(
      original,
      command.actor,
      command.role,
      command.reason
    );

    if (!result.success || !result.reversalMovement) {
      return fail(new ValidationError(result.reason ?? 'Failed to execute movement reversal.'));
    }

    const saved = this.inventoryRepo.recordMovement(result.reversalMovement);
    return ok(saved);
  }
}
