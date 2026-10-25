import type { AuditLogEntry, ProductionOrder } from '../../types';
import { canReleaseProductionOrder } from './productionService';

export interface ProductionReleaseDecision {
  allowed: boolean;
  reason?: string;
  updatedOrder?: ProductionOrder;
  auditLog?: AuditLogEntry;
}

export function evaluateProductionRelease(
  order: ProductionOrder,
  actor: string,
  role: string,
  overrideReason?: string
): ProductionReleaseDecision {
  if (order.status !== 'PLANNED' && order.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Production order ${order.orderNumber} is not in a releasable state.`,
    };
  }

  const shortageExists = order.materials.some((item) => item.status === 'SHORTAGE');
  if (shortageExists && !overrideReason?.trim()) {
    return {
      allowed: false,
      reason: `Production order ${order.orderNumber} cannot be released because material shortage remains unresolved.`,
    };
  }

  if (!canReleaseProductionOrder(order, overrideReason)) {
    return {
      allowed: false,
      reason: `Production order ${order.orderNumber} failed release validation.`,
    };
  }

  const timestamp = new Date().toISOString();
  const updatedOperations = order.operations.map((operation, index) => ({
    ...operation,
    status: index === 0 ? ('READY' as const) : ('PENDING' as const),
  }));

  const updatedOrder: ProductionOrder = {
    ...order,
    status: 'RELEASED',
    operations: updatedOperations,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'PRODUCTION_ORDER',
    action: overrideReason ? 'RELEASE_WITH_OVERRIDE' : 'RELEASE_PRODUCTION_ORDER',
    actor,
    role,
    timestamp,
    oldStatus: order.status,
    newStatus: 'RELEASED',
    decision: 'APPROVED',
    reason: overrideReason || 'Standard production order release after availability check.',
  };

  return {
    allowed: true,
    reason: overrideReason ? 'Release approved with supervisor override.' : 'Release approved.',
    updatedOrder,
    auditLog,
  };
}
