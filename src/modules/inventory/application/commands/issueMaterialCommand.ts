import type { StockMovement } from '../../../../types';
import type { IInventoryRepository } from '../../inventoryRepository';
import type { IWorkOrderRepository } from '../../../manufacturing/workOrderRepository';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { issueMaterialToProduction } from '../../inventoryService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface IssueMaterialCommand {
  orderId: string;
  componentSku: string;
  lotNumber: string;
  quantity: number;
  actor: string;
  role: string;
  isHoldOverride?: boolean;
}

export interface IssueMaterialResult {
  movement: StockMovement;
  message: string;
}

export class IssueMaterialHandler {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly workOrderRepo: IWorkOrderRepository,
    private readonly uow: IUnitOfWork
  ) {}

  execute(command: IssueMaterialCommand): Result<IssueMaterialResult, DomainError> {
    const order = this.workOrderRepo.findById(command.orderId);
    if (!order) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const currentMovements = this.inventoryRepo.listMovements();
    const decision = issueMaterialToProduction(
      order,
      command.componentSku,
      command.lotNumber,
      command.quantity,
      currentMovements,
      command.actor,
      command.role,
      command.isHoldOverride ?? false
    );

    if (!decision.allowed || !decision.movement) {
      return fail(new ValidationError(decision.reason || 'Material issue rejected by inventory rules.'));
    }

    // Execute atomic recording
    const recordedMovement = this.inventoryRepo.recordMovement(decision.movement);

    return ok({
      movement: recordedMovement,
      message: decision.reason || `Successfully issued ${command.quantity} ${command.componentSku}`,
    });
  }
}
