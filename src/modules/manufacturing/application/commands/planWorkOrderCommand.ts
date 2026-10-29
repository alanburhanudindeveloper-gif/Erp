import type { BillOfMaterials, Routing, ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { planWorkOrder } from '../../workOrderService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface PlanWorkOrderCommand {
  orderId: string;
  bom: BillOfMaterials;
  routing: Routing;
  actor: string;
  role?: string;
}

export class PlanWorkOrderHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(command: PlanWorkOrderCommand): Result<ProductionOrder, DomainError> {
    const existing = this.workOrderRepo.findById(command.orderId);
    if (!existing) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const result = planWorkOrder(
      existing,
      command.bom,
      command.routing,
      command.actor,
      command.role
    );

    if (!result.allowed || !result.updatedOrder) {
      return fail(new ValidationError(result.reason ?? 'Failed to plan work order'));
    }

    const saved = this.workOrderRepo.save(result.updatedOrder);
    return ok(saved);
  }
}
