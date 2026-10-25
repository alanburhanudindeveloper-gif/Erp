import type { AuditLogEntry, MaterialReservation, Product, ProductionOrder, StockMovement } from '../../types';

export type InventoryHealthStatus = 'HEALTHY' | 'BELOW_BUFFER' | 'CRITICAL';

export interface InventoryHealthItem {
  sku: string;
  name: string;
  availableToPromise: number;
  safetyStock: number;
  status: InventoryHealthStatus;
  shortageAmount: number;
}

export interface ProductionReadinessResult {
  risk: 'READY' | 'PARTIAL' | 'BLOCKED';
  shortageSkus: string[];
  shortages: Array<{
    sku: string;
    required: number;
    available: number;
  }>;
}

export function getInventoryHealth(products: Product[]): InventoryHealthItem[] {
  return products.map((product) => {
    const availableToPromise = Math.max(0, product.currentStock - product.allocatedStock);
    const shortageAmount = Math.max(0, product.safetyStock - availableToPromise);

    let status: InventoryHealthStatus = 'HEALTHY';
    if (availableToPromise < product.safetyStock) {
      status = availableToPromise <= product.safetyStock * 0.5 ? 'CRITICAL' : 'BELOW_BUFFER';
    }

    return {
      sku: product.sku,
      name: product.name,
      availableToPromise,
      safetyStock: product.safetyStock,
      status,
      shortageAmount,
    };
  });
}

export function assessProductionOrderReadiness(order: ProductionOrder): ProductionReadinessResult {
  const shortages = order.materials
    .filter((material) => material.status !== 'SUFFICIENT')
    .map((material) => ({
      sku: material.sku,
      required: material.requiredQty,
      available: material.availableStock,
    }));

  const shortageSkus = shortages.map((item) => item.sku);

  if (shortages.length === 0) {
    return { risk: 'READY', shortageSkus: [], shortages: [] };
  }

  if (order.materials.every((material) => material.status === 'SHORTAGE')) {
    return { risk: 'BLOCKED', shortageSkus, shortages };
  }

  return { risk: 'PARTIAL', shortageSkus, shortages };
}

export interface MaterialIssueDecision {
  allowed: boolean;
  reason?: string;
  movement?: StockMovement;
  auditLog?: AuditLogEntry;
}

export interface MaterialReservationDecision {
  allowed: boolean;
  reason?: string;
  reservation?: MaterialReservation;
  auditLog?: AuditLogEntry;
}

export interface MaterialConsumptionDecision {
  allowed: boolean;
  reason?: string;
  reservation?: MaterialReservation;
  updatedOrder?: ProductionOrder;
  auditLog?: AuditLogEntry;
}

export interface ScrapDecision {
  allowed: boolean;
  reason?: string;
  movement?: StockMovement;
  auditLog?: AuditLogEntry;
}

export interface ReversalDecision {
  allowed: boolean;
  reason?: string;
  movement?: StockMovement;
  auditLog?: AuditLogEntry;
}

export function issueMaterialToProduction(
  order: ProductionOrder,
  componentSku: string,
  lotNumber: string,
  quantity: number,
  stockMovements: StockMovement[],
  actor: string,
  role: string,
  isHoldOverride = false
): MaterialIssueDecision {
  const isLotOnHold = stockMovements.some((movement) => movement.lotNumber === lotNumber && movement.stockBucket === 'HOLD');

  if (isLotOnHold && !isHoldOverride) {
    const errorMsg = `Action Blocked (UC-INV-003 / BR-INV-003): Material ${componentSku} from Lot ${lotNumber} is currently in HOLD / QUARANTINE status. Material under QC hold is strictly prohibited from being issued to shop floor production. Complete QC release inspection first.`;
    return { allowed: false, reason: errorMsg };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const movement: StockMovement = {
    id: `mov-${Date.now()}-gi`,
    movementNo: `MATDOC-GI-${Date.now().toString().slice(-5)}`,
    timestamp: timeStr,
    productId: 'raw-001',
    sku: componentSku,
    quantity,
    uom: 'KG',
    fromLocation: 'PLANT01-RM-WH-AVAILABLE',
    toLocation: `WIP-${order.operations[0]?.workCenterCode || 'WC-CUT-01'}`,
    lotNumber,
    sourceDocument: order.orderNumber,
    movementType: 'GI_PRODUCTION',
    stockBucket: 'WIP',
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'MATERIAL_ISSUE',
    action: 'ISSUE_MATERIAL',
    actor,
    role,
    timestamp: timeStr,
    decision: 'EXECUTED',
    reason: `Issued ${quantity} of ${componentSku} (Lot: ${lotNumber}) to ${order.orderNumber}.`,
  };

  return {
    allowed: true,
    reason: `Issued ${quantity} of ${componentSku} (Lot: ${lotNumber}) to ${order.orderNumber}.`,
    movement,
    auditLog,
  };
}

export function reserveMaterialsForProduction(
  order: ProductionOrder,
  sku: string,
  quantity: number,
  lotNumber: string,
  location: string,
  actor: string,
  role: string = 'Planner'
): MaterialReservationDecision {
  if (quantity <= 0) {
    return {
      allowed: false,
      reason: 'Reservation quantity must be greater than zero.',
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const reservation: MaterialReservation = {
    id: `res-${Date.now()}`,
    reservationNo: `RES-${Date.now().toString().slice(-6)}`,
    productionOrderId: order.id,
    orderNumber: order.orderNumber,
    productId: order.productId,
    sku,
    productName: order.productName,
    requiredQty: quantity,
    reservedQty: quantity,
    location,
    lotNumber,
    reservedAt: timeStr,
    status: 'ACTIVE',
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'MATERIAL_RESERVATION',
    action: 'RESERVE_MATERIAL',
    actor,
    role,
    timestamp: timeStr,
    decision: 'EXECUTED',
    reason: `Hard reservation ${reservation.reservationNo} created for ${quantity} ${sku} at ${location}.`,
  };

  return {
    allowed: true,
    reason: `Reserved ${quantity} of ${sku} for ${order.orderNumber}.`,
    reservation,
    auditLog,
  };
}

export function consumeMaterialsForProduction(
  order: ProductionOrder,
  sku: string,
  quantity: number,
  reservation: MaterialReservation | undefined,
  actor: string,
  role: string = 'Operator'
): MaterialConsumptionDecision {
  if (quantity <= 0) {
    return {
      allowed: false,
      reason: 'Consumption quantity must be greater than zero.',
    };
  }

  if (!reservation || reservation.sku !== sku || reservation.productionOrderId !== order.id) {
    return {
      allowed: false,
      reason: `No active reservation found for ${sku} on order ${order.orderNumber}.`,
    };
  }

  if (quantity > reservation.reservedQty) {
    return {
      allowed: false,
      reason: `Consumption of ${quantity} exceeds reserved quantity ${reservation.reservedQty} for ${sku}.`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const materials = order.materials.map((item) => {
    if (item.sku !== sku) return item;

    const updatedConsumed = item.consumedQty + quantity;
    const nextStatus: 'SUFFICIENT' | 'PARTIAL' | 'SHORTAGE' =
      updatedConsumed >= item.requiredQty ? 'SUFFICIENT' : updatedConsumed > 0 ? 'PARTIAL' : 'SHORTAGE';

    return {
      ...item,
      consumedQty: updatedConsumed,
      status: nextStatus,
    };
  });

  const updatedOrder: ProductionOrder = {
    ...order,
    materials,
  };

  const updatedReservation: MaterialReservation = {
    ...reservation,
    reservedQty: Math.max(0, reservation.reservedQty - quantity),
    status: quantity >= reservation.reservedQty ? 'CONSUMED' : 'ACTIVE',
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'MATERIAL_CONSUMPTION',
    action: 'CONSUME_MATERIAL',
    actor,
    role,
    timestamp: timeStr,
    decision: 'EXECUTED',
    reason: `Consumed ${quantity} of ${sku} against reservation ${reservation.reservationNo}.`,
  };

  return {
    allowed: true,
    reason: `Consumed ${quantity} of ${sku} for ${order.orderNumber}.`,
    reservation: updatedReservation,
    updatedOrder,
    auditLog,
  };
}

export function recordScrapTransaction(
  order: ProductionOrder,
  sku: string,
  quantity: number,
  lotNumber: string,
  reasonCode: string,
  actor: string,
  fromLocation: string = 'RM-WH-01',
  role: string = 'Operator'
): ScrapDecision {
  if (quantity <= 0) {
    return {
      allowed: false,
      reason: 'Scrap quantity must be greater than zero.',
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const movement: StockMovement = {
    id: `mov-${Date.now()}-scrap`,
    movementNo: `MATDOC-SCRAP-${Date.now().toString().slice(-5)}`,
    timestamp: timeStr,
    productId: order.productId,
    sku,
    quantity,
    uom: 'KG',
    fromLocation,
    toLocation: 'SCRAP-YARD',
    lotNumber,
    sourceDocument: order.orderNumber,
    movementType: 'SCRAP',
    stockBucket: 'REJECTED',
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'SCRAP_TRANSACTION',
    action: 'SCRAP_MATERIAL',
    actor,
    role,
    timestamp: timeStr,
    decision: 'EXECUTED',
    reason: `Scrap reported for ${quantity} ${sku} from lot ${lotNumber} (${reasonCode}).`,
  };

  return {
    allowed: true,
    reason: `Scrap posted for ${quantity} ${sku}.`,
    movement,
    auditLog,
  };
}

export function reverseStockMovement(
  movement: StockMovement,
  actor: string,
  role: string = 'Controller'
): ReversalDecision {
  if (movement.movementType === 'REVERSAL') {
    return {
      allowed: false,
      reason: `Movement ${movement.movementNo} is already reversed.`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const reversal: StockMovement = {
    ...movement,
    id: `mov-${Date.now()}-rev`,
    movementNo: `MATDOC-REV-${Date.now().toString().slice(-5)}`,
    timestamp: timeStr,
    fromLocation: movement.toLocation,
    toLocation: movement.fromLocation,
    movementType: 'REVERSAL',
    stockBucket: movement.stockBucket,
    isReversed: true,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: movement.sourceDocument,
    documentType: 'STOCK_MOVEMENT',
    action: 'REVERSE_MOVEMENT',
    actor,
    role,
    timestamp: timeStr,
    decision: 'EXECUTED',
    reason: `Compensating reversal created for stock movement ${movement.movementNo}.`,
  };

  return {
    allowed: true,
    reason: `Reversal created for ${movement.movementNo}.`,
    movement: reversal,
    auditLog,
  };
}
