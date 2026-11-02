import type { StockMovement } from '../../../../types';
import type { IInventoryRepository } from '../../inventoryRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, type DomainError } from '../../../../shared/kernel/errors';

export interface GetStockMovementByIdQuery {
  id: string;
}

export class GetStockMovementByIdHandler {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  execute(query: GetStockMovementByIdQuery): Result<StockMovement, DomainError> {
    const movement = this.inventoryRepo.findMovementById(query.id);
    if (!movement) {
      return fail(new NotFoundError('StockMovement', query.id));
    }
    return ok(movement);
  }
}
