import type { ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { startProductionOperation } from '../../productionExecutionService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface StartProductionOperationCommand {
  orderId: string;
  operationSequence: number;
  operatorName: string;
}

export class StartProductionOperationHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(command: StartProductionOperationCommand): Result<ProductionOrder, DomainError> {
    const order = this.workOrderRepo.findById(command.orderId);
    if (!order) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const decision = startProductionOperation(
      order,
      command.operationSequence,
      command.operatorName
    );

    if (!decision.allowed || !decision.updatedOrder) {
      return fail(new ValidationError(decision.reason ?? 'Failed to start operation'));
    }

    const saved = this.workOrderRepo.save(decision.updatedOrder);
    return ok(saved);
  }
}
