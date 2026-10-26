import type {
  AuditLogEntry,
  BillOfMaterials,
  MaterialReservation,
  OrderMaterialRequirement,
  Product,
  ProductionOrder,
  ProductionOrderOperation,
  ProductionOrderStatus,
  Routing,
  StockMovement,
} from '../../types';

export interface WorkOrderTransitionResult {
  allowed: boolean;
  reason?: string;
  updatedOrder?: ProductionOrder;
  reservations?: MaterialReservation[];
  stockMovements?: StockMovement[];
  auditLog?: AuditLogEntry;
}

/**
 * Validates and transitions a work order from DRAFT to PLANNED.
 * Attaches approved BOM components and routing operations.
 */
export function planWorkOrder(
  order: ProductionOrder,
  bom: BillOfMaterials,
  routing: Routing,
  actor: string,
  role: string = 'PPIC_PLANNER'
): WorkOrderTransitionResult {
  if (order.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Order ${order.orderNumber} must be in DRAFT status to be planned (current: ${order.status}).`,
    };
  }

  if (bom.status !== 'ACTIVE' && bom.status !== 'APPROVED') {
    return {
      allowed: false,
      reason: `BOM ${bom.code} is ${bom.status}. Only APPROVED or ACTIVE BOMs may be attached to a planned order.`,
    };
  }

  if (routing.status !== 'ACTIVE' && routing.status !== 'APPROVED') {
    return {
      allowed: false,
      reason: `Routing ${routing.code} is ${routing.status}. Only APPROVED or ACTIVE routings may be attached.`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const operations: ProductionOrderOperation[] = routing.operations.map((op, index) => ({
    id: `op-${order.id}-${op.sequence}`,
    workOrderNo: `${order.orderNumber}-${String(op.sequence).padStart(2, '0')}`,
    sequence: op.sequence,
    operationCode: op.operationCode,
    name: op.name,
    workCenterId: op.workCenterId,
    workCenterCode: op.workCenterCode,
    workCenterName: op.workCenterName,
    status: index === 0 ? 'PENDING' : 'PENDING',
    targetQty: order.targetQuantity,
    completedQty: 0,
    scrapQty: 0,
    plannedDurationMinutes: Math.round((op.setupTimeMinutes + (order.targetQuantity * op.runTimeSecondsPerUnit) / 60) * 10) / 10,
    actualDurationMinutes: 0,
    downtimeMinutes: 0,
    dependencySeq: op.dependencySeq,
    setupTimeMinutes: op.setupTimeMinutes,
    runTimeSecondsPerUnit: op.runTimeSecondsPerUnit,
  }));

  const materials: OrderMaterialRequirement[] = bom.components.map((comp) => {
    const scrapPct = comp.scrapPercentage || 0;
    const requiredQty = Math.round(order.targetQuantity * comp.quantityPerUnit * (1 + scrapPct / 100) * 100) / 100;
    return {
      productId: comp.componentProductId,
      sku: comp.componentSku,
      name: comp.componentName,
      requiredQty,
      allocatedQty: 0,
      consumedQty: 0,
      availableStock: 1000, // Available check default
      uom: comp.uom,
      unitCost: comp.unitCost,
      status: 'SUFFICIENT',
    };
  });

  const updatedOrder: ProductionOrder = {
    ...order,
    status: 'PLANNED',
    bomId: bom.id,
    bomCode: bom.code,
    bomRevision: bom.revision,
    routingId: routing.id,
    routingCode: routing.code,
    routingRevision: routing.revision,
    operations,
    materials,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'PRODUCTION_ORDER',
    action: 'PLAN_WORK_ORDER',
    actor,
    role,
    timestamp: timeStr,
    oldStatus: 'DRAFT',
    newStatus: 'PLANNED',
    decision: 'APPROVED',
    reason: `Attached BOM ${bom.code} (${bom.revision}) and Routing ${routing.code}. Generated ${operations.length} operations.`,
  };

  return {
    allowed: true,
    reason: `Order ${order.orderNumber} successfully planned.`,
    updatedOrder,
    auditLog,
  };
}

/**
 * Cancels a work order and un-reserves any allocated materials.
 */
export function cancelWorkOrder(
  order: ProductionOrder,
  actor: string,
  role: string,
  cancellationReason: string
): WorkOrderTransitionResult {
  if (order.status === 'COMPLETED' || order.status === 'CLOSED') {
    return {
      allowed: false,
      reason: `Cannot cancel order ${order.orderNumber} because it is already ${order.status}.`,
    };
  }

  if (!cancellationReason || cancellationReason.trim().length < 5) {
    return {
      allowed: false,
      reason: 'Mandatory cancellation reason (at least 5 characters) is required to cancel a work order.',
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const updatedOrder: ProductionOrder = {
    ...order,
    status: 'CANCELLED',
    operations: order.operations.map((op) => ({
      ...op,
      status: op.status === 'COMPLETED' ? op.status : 'BLOCKED',
    })),
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'PRODUCTION_ORDER',
    action: 'CANCEL_WORK_ORDER',
    actor,
    role,
    timestamp: timeStr,
    oldStatus: order.status,
    newStatus: 'CANCELLED',
    decision: 'APPROVED',
    reason: `Order cancelled. Justification: ${cancellationReason}`,
  };

  return {
    allowed: true,
    reason: `Work order ${order.orderNumber} cancelled.`,
    updatedOrder,
    auditLog,
  };
}
