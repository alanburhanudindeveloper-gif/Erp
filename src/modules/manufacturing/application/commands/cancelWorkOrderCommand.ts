import type { ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { cancelWorkOrder } from '../../workOrderService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface CancelWorkOrderCommand {
  orderId: string;
  reason: string;
  actor: string;
  role?: string;
}

export class CancelWorkOrderHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(command: CancelWorkOrderCommand): Result<ProductionOrder, DomainError> {
    const existing = this.workOrderRepo.findById(command.orderId);
    if (!existing) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const result = cancelWorkOrder(
      existing,
      command.actor,
      command.role ?? 'PRODUCTION_MANAGER',
      command.reason
    );

    if (!result.allowed || !result.updatedOrder) {
      return fail(new ValidationError(result.reason ?? 'Failed to cancel work order'));
    }

    const saved = this.workOrderRepo.save(result.updatedOrder);
    return ok(saved);
  }
}
