import type { ProductionOrder, Routing } from '../../../../types';
import type { IPlanningRepository } from '../../planningRepository';
import type { IWorkOrderRepository } from '../../../manufacturing';
import { dispatchProductionPlan } from '../../productionPlanDispatchService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface DispatchProductionPlanCommand {
  planId: string;
  routing?: Routing | null;
}

export class DispatchProductionPlanHandler {
  constructor(
    private readonly planningRepo: IPlanningRepository,
    private readonly workOrderRepo: IWorkOrderRepository
  ) {}

  execute(command: DispatchProductionPlanCommand): Result<ProductionOrder, DomainError> {
    const plan = this.planningRepo.findProductionPlanById(command.planId);
    if (!plan) {
      return fail(new NotFoundError('ProductionPlanItem', command.planId));
    }

    const dispatchResult = dispatchProductionPlan({
      plan,
      routing: command.routing,
      createProductionOrder: (input) => {
        const orderNumber = `MO-2026-${Date.now().toString().slice(-6)}`;
        const newOrder: ProductionOrder = {
          id: `mo-${Date.now()}`,
          orderNumber,
          productId: input.productId,
          productSku: plan.productSku,
          productName: plan.productName,
          targetQuantity: input.quantity,
          goodQuantity: 0,
          scrapQuantity: 0,
          bomId: command.routing?.productId ?? '',
          bomCode: '',
          bomRevision: '',
          routingId: command.routing?.id ?? '',
          routingCode: command.routing?.code ?? '',
          routingRevision: command.routing?.revision ?? '',
          plantId: 'PLANT-01',
          plantName: 'Main Plant',
          plannedStartDate: plan.targetStartDate,
          dueDate: input.dueDate,
          status: 'PLANNED',
          priority: 'NORMAL',
          operations: [],
        } as unknown as ProductionOrder;
        return this.workOrderRepo.save(newOrder);
      },
    });

    if (!dispatchResult.success || !dispatchResult.orderId) {
      return fail(new ValidationError(dispatchResult.error ?? 'Failed to dispatch production plan.'));
    }

    const updatedPlan = {
      ...plan,
      status: 'CONFIRMED' as const,
      generatedWorkOrderId: dispatchResult.orderId,
    };
    this.planningRepo.saveProductionPlan(updatedPlan);

    const createdOrder = this.workOrderRepo.findById(dispatchResult.orderId);
    if (!createdOrder) {
      return fail(new NotFoundError('ProductionOrder', dispatchResult.orderId));
    }

    return ok(createdOrder);
  }
}
