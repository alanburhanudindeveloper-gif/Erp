import type { BucketTransferInput } from '../../inventoryLedgerService';
import { transferStockBetweenBuckets } from '../../inventoryLedgerService';
import type { IInventoryRepository } from '../../inventoryRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { ValidationError, type DomainError } from '../../../../shared/kernel/errors';
import type { StockMovement } from '../../../../types';

export interface TransferStockCommand extends BucketTransferInput {}

export class TransferStockHandler {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  execute(command: TransferStockCommand): Result<StockMovement, DomainError> {
    const allMovements = this.inventoryRepo.listMovements();
    const result = transferStockBetweenBuckets(command, allMovements);

    if (!result.success || !result.movement) {
      return fail(new ValidationError(result.reason ?? 'Failed to execute stock transfer between buckets.'));
    }

    const saved = this.inventoryRepo.recordMovement(result.movement);
    return ok(saved);
  }
}
