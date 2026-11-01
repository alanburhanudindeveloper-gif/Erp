import type { ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { completeProductionOperation } from '../../productionExecutionService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface CompleteProductionOperationCommand {
  orderId: string;
  operationSequence: number;
  actorName: string;
  actorRole?: string;
}

export class CompleteProductionOperationHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(command: CompleteProductionOperationCommand): Result<ProductionOrder, DomainError> {
    const order = this.workOrderRepo.findById(command.orderId);
    if (!order) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const decision = completeProductionOperation(
      order,
      command.operationSequence,
      command.actorName,
      command.actorRole || 'Operator'
    );

    if (!decision.allowed || !decision.updatedOrder) {
      return fail(new ValidationError(decision.reason ?? 'Failed to complete operation'));
    }

    const saved = this.workOrderRepo.save(decision.updatedOrder);
    return ok(saved);
  }
}
