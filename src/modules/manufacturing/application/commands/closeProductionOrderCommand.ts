import type { ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { closeProductionOrderExecution } from '../../productionExecutionService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface CloseProductionOrderCommand {
  orderId: string;
  actorName: string;
  actorRole?: string;
}

export class CloseProductionOrderHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(command: CloseProductionOrderCommand): Result<ProductionOrder, DomainError> {
    const order = this.workOrderRepo.findById(command.orderId);
    if (!order) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const decision = closeProductionOrderExecution(
      order,
      command.actorName,
      command.actorRole || 'Controller'
    );

    if (!decision.allowed || !decision.updatedOrder) {
      return fail(new ValidationError(decision.reason ?? 'Failed to close production order'));
    }

    const saved = this.workOrderRepo.save(decision.updatedOrder);
    return ok(saved);
  }
}
