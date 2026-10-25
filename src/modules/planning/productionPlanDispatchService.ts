import { ProductionOrder, ProductionPlanItem, Routing } from '../../types';

export interface DispatchProductionPlanRequest {
  plan: ProductionPlanItem;
  routing?: Routing | null;
  createProductionOrder: (input: {
    productId: string;
    quantity: number;
    dueDate: string;
  }) => ProductionOrder | null;
}

export interface ProductionPlanDispatchResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export function dispatchProductionPlan({
  plan,
  routing,
  createProductionOrder,
}: DispatchProductionPlanRequest): ProductionPlanDispatchResult {
  if (!routing || routing.status !== 'ACTIVE') {
    const error = `Rule 1 Violation: Cannot generate Work Order for ${plan.productSku} without an ACTIVE routing.`;
    return {
      success: false,
      error,
    };
  }

  const createdOrder = createProductionOrder({
    productId: plan.productId,
    quantity: plan.plannedQty,
    dueDate: plan.targetEndDate,
  });

  if (!createdOrder) {
    return {
      success: false,
      error: 'Failed to create production order.',
    };
  }

  return {
    success: true,
    orderId: createdOrder.id,
  };
}
