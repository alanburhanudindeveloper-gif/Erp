import type { AuditLogEntry, MaterialRequest, StockMovement } from '../../types';

export interface MaterialRequestDeliveryInput {
  request: MaterialRequest;
  deliveredBy: string;
  receivedBy?: string;
  lineLocation: string;
  timestamp?: string;
}

export interface MaterialRequestDeliveryResult {
  allowed: boolean;
  reason?: string;
  request: MaterialRequest;
  stockMovements: StockMovement[];
  auditLog?: AuditLogEntry;
}

export function evaluateMaterialRequestDelivery(input: MaterialRequestDeliveryInput): MaterialRequestDeliveryResult {
  const { request, deliveredBy, receivedBy, lineLocation, timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16) } = input;

  if (!request) {
    return {
      allowed: false,
      reason: 'Material request is required before delivery can be posted.',
      request: {
        id: 'mr-missing',
        requestNumber: 'MR-UNKNOWN',
        sourceType: 'PRODUCTION_ORDER',
        sourceReferenceId: 'UNKNOWN',
        requester: 'UNKNOWN',
        department: 'UNKNOWN',
        requiredDate: new Date().toISOString().split('T')[0],
        destinationLine: lineLocation || 'UNKNOWN',
        priority: 'HIGH',
        status: 'DRAFT',
        items: [],
      },
      stockMovements: [],
    };
  }

  if (!Array.isArray(request.items) || request.items.length === 0) {
    return {
      allowed: false,
      reason: 'Material request delivery is invalid: at least one line item is required.',
      request,
      stockMovements: [],
    };
  }

  if (!deliveredBy || !deliveredBy.trim()) {
    return {
      allowed: false,
      reason: 'A delivery actor is required before the line request can be posted.',
      request,
      stockMovements: [],
    };
  }

  const updatedRequest: MaterialRequest = {
    ...request,
    status: 'DELIVERED',
    deliveredBy,
    deliveredAt: timestamp,
    receivedBy: receivedBy || request.receivedBy || 'Line Supervisor',
    receivedAt: timestamp,
    destinationLine: lineLocation || request.destinationLine,
    items: request.items.map((item) => ({
      ...item,
      deliveredQuantity: item.requestedQuantity,
      status: 'DELIVERED',
    })),
  };

  const stockMovements: StockMovement[] = request.items.map((item, index) => ({
    id: `mov-${Date.now()}-${index}-line`,
    movementNo: `MATDOC-LINE-${Date.now().toString().slice(-5)}-${index}`,
    timestamp,
    productId: item.productId,
    sku: item.sku,
    quantity: item.requestedQuantity,
    uom: item.uom,
    fromLocation: item.fromWarehouse || 'MAIN-WH-STAGING',
    toLocation: lineLocation || item.toLocation || request.destinationLine,
    lotNumber: `LOT-LINE-${Date.now().toString().slice(-4)}`,
    sourceDocument: request.requestNumber,
    movementType: 'GI_PRODUCTION',
    stockBucket: 'WIP',
  }));

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: request.requestNumber,
    documentType: 'MATERIAL_REQUEST',
    action: 'LINE_DELIVERY',
    actor: deliveredBy,
    role: 'Material Logistics Handler',
    timestamp,
    oldStatus: request.status,
    newStatus: 'DELIVERED',
    decision: 'EXECUTED',
    reason: `Delivered ${request.items.length} line items to ${lineLocation || request.destinationLine}. Inventory posted to WIP ledger.`,
  };

  return {
    allowed: true,
    reason: `Material Request ${request.requestNumber} delivered to line. Ledger updated.`,
    request: updatedRequest,
    stockMovements,
    auditLog,
  };
}
