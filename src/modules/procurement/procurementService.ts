import type { PurchaseRequisition } from '../../types';

export interface PurchaseRequisitionDecisionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  nextStatus?: 'APPROVED' | 'REJECTED';
}

export interface PurchaseOrderDraftItemInput {
  productId: string;
  orderedQty: number;
  unitPrice: number;
  qcRequired: boolean;
}

export interface PurchaseOrderDraftInput {
  prId?: string;
  supplierId: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  destinationWarehouse: string;
  items: PurchaseOrderDraftItemInput[];
}

export interface PurchaseOrderDraftEvaluation {
  allowed: boolean;
  reason?: string;
  totalAmount: number;
  lineItems: Array<{
    productId: string;
    orderedQty: number;
    unitPrice: number;
    lineTotal: number;
    qcRequired: boolean;
  }>;
}

export function evaluatePurchaseRequisitionApproval(
  purchaseRequisition: Pick<PurchaseRequisition, 'requesterName' | 'approvalLevelRequired'>,
  actorName: string,
  actorRole: string,
  requiredRole: string = 'Manager'
): PurchaseRequisitionDecisionResult {
  const requesterName = purchaseRequisition.requesterName?.trim();
  const actor = actorName?.trim();

  if (requesterName && actor && requesterName.toLowerCase() === actor.toLowerCase()) {
    return {
      allowed: false,
      reason: `Segregation of Duties Violation: Requester (${requesterName}) is not permitted to self-approve their own Purchase Requisition. Approval must be performed by an independent authorized manager.`,
      requiredRole,
    };
  }

  if (actorRole && actorRole.trim().toLowerCase() !== requiredRole.trim().toLowerCase()) {
    return {
      allowed: false,
      reason: `Role '${actorRole}' is not permitted to perform this approval. Required role: '${requiredRole}'.`,
      requiredRole,
    };
  }

  return {
    allowed: true,
    reason: 'Approval gate satisfied.',
    requiredRole,
  };
}

export function evaluatePurchaseOrderDraft(input: PurchaseOrderDraftInput): PurchaseOrderDraftEvaluation {
  const { supplierId, expectedDeliveryDate, destinationWarehouse, items } = input;

  if (!supplierId || !supplierId.trim()) {
    return {
      allowed: false,
      reason: 'A supplier must be selected before creating a purchase order.',
      totalAmount: 0,
      lineItems: [],
    };
  }

  if (!expectedDeliveryDate || !expectedDeliveryDate.trim()) {
    return {
      allowed: false,
      reason: 'Expected delivery date is required before creating a purchase order.',
      totalAmount: 0,
      lineItems: [],
    };
  }

  if (!destinationWarehouse || !destinationWarehouse.trim()) {
    return {
      allowed: false,
      reason: 'Destination warehouse is required before creating a purchase order.',
      totalAmount: 0,
      lineItems: [],
    };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      allowed: false,
      reason: 'A purchase order must contain at least one item.',
      totalAmount: 0,
      lineItems: [],
    };
  }

  const lineItems = items.map((item) => ({
    productId: item.productId,
    orderedQty: item.orderedQty,
    unitPrice: item.unitPrice,
    qcRequired: item.qcRequired,
    lineTotal: item.orderedQty * item.unitPrice,
  }));

  const invalidLine = lineItems.find((item) => item.productId.trim().length === 0 || item.orderedQty <= 0 || item.unitPrice < 0);
  if (invalidLine) {
    return {
      allowed: false,
      reason: 'Each purchase order item must have a valid product, positive quantity, and non-negative unit price.',
      totalAmount: 0,
      lineItems: [],
    };
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    allowed: true,
    reason: 'Purchase order draft is valid.',
    totalAmount,
    lineItems: lineItems.map(({ productId, orderedQty, unitPrice, qcRequired, lineTotal }) => ({
      productId,
      orderedQty,
      unitPrice,
      lineTotal,
      qcRequired,
    })),
  };
}

export function rejectPurchaseRequisitionDecision(
  purchaseRequisition: Pick<PurchaseRequisition, 'requesterName'>,
  actorName: string,
  actorRole: string,
  reason?: string,
  requiredRole: string = 'Manager'
): PurchaseRequisitionDecisionResult {
  const requesterName = purchaseRequisition.requesterName?.trim();
  const actor = actorName?.trim();

  if (requesterName && actor && requesterName.toLowerCase() === actor.toLowerCase()) {
    return {
      allowed: false,
      reason: `Segregation of Duties Violation: Requester (${requesterName}) is not permitted to reject their own Purchase Requisition. Rejection must be performed by an independent authorized manager.`,
      requiredRole,
    };
  }

  if (actorRole && actorRole.trim().toLowerCase() !== requiredRole.trim().toLowerCase()) {
    return {
      allowed: false,
      reason: `Role '${actorRole}' is not permitted to reject this request. Required role: '${requiredRole}'.`,
      requiredRole,
    };
  }

  if (!reason || !reason.trim()) {
    return {
      allowed: false,
      reason: 'Rejection rejected: An explicit explanation is required before rejecting a Purchase Requisition.',
      requiredRole,
    };
  }

  return {
    allowed: true,
    reason: 'Purchase Requisition rejection is valid.',
    requiredRole,
    nextStatus: 'REJECTED',
  };
}
