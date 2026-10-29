import { calculate5BucketBalance, type BucketBalance } from '../../inventoryLedgerService';
import type { IInventoryRepository } from '../../inventoryRepository';
import { ok, type Result } from '../../../../shared/kernel/result';
import type { NotFoundError } from '../../../../shared/kernel/errors';

export interface Get5BucketBalanceQuery {
  sku: string;
}

export class Get5BucketBalanceHandler {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  execute(query: Get5BucketBalanceQuery): Result<BucketBalance, NotFoundError> {
    const movements = this.inventoryRepo.listMovements();
    const balance = calculate5BucketBalance(query.sku, movements);
    return ok(balance);
  }
}
