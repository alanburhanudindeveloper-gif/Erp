import test from 'node:test';
import assert from 'node:assert/strict';

import type { PurchaseRequisition } from '../../types';
import {
  evaluatePurchaseOrderDraft,
  evaluatePurchaseRequisitionApproval,
  rejectPurchaseRequisitionDecision,
} from './procurementService.ts';

const pr: PurchaseRequisition = {
  id: 'pr-1',
  prNumber: 'PR-2026-000001',
  requesterId: 'usr-001',
  requesterName: 'Dewi Lestari',
  department: 'Production',
  requiredDate: '2026-11-10',
  reason: 'Raw material replenishment',
  plantId: 'PLANT-01',
  status: 'PENDING_APPROVAL',
  totalAmount: 12500000,
  approvalLevelRequired: 2,
  items: [],
  createdAt: '2026-10-26 09:00',
};

test('purchase requisition approval rejects self-approval and enforces role independence', () => {
  const blocked = evaluatePurchaseRequisitionApproval(pr, 'Dewi Lestari', 'Manager');
  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason || '', /Segregation of Duties|self-approve/i);

  const valid = evaluatePurchaseRequisitionApproval(pr, 'Agus Wijaya', 'Manager');
  assert.equal(valid.allowed, true);
  assert.equal(valid.requiredRole, 'Manager');
});

test('purchase requisition rejection requires explicit reason', () => {
  const invalid = rejectPurchaseRequisitionDecision(pr, 'Agus Wijaya', 'Manager', '   ');
  assert.equal(invalid.allowed, false);
  assert.match(invalid.reason || '', /explicit explanation|reason/i);

  const valid = rejectPurchaseRequisitionDecision(pr, 'Agus Wijaya', 'Manager', 'Budget review failed');
  assert.equal(valid.allowed, true);
  assert.equal(valid.nextStatus, 'REJECTED');
});

test('purchase order draft validation blocks empty orders and totals item lines correctly', () => {
  const invalid = evaluatePurchaseOrderDraft({
    supplierId: 'sup-1',
    expectedDeliveryDate: '2026-11-20',
    paymentTerms: 'NET30',
    destinationWarehouse: 'WH-01',
    items: [],
  });

  assert.equal(invalid.allowed, false);
  assert.match(invalid.reason || '', /at least one item|empty/i);

  const valid = evaluatePurchaseOrderDraft({
    supplierId: 'sup-1',
    expectedDeliveryDate: '2026-11-20',
    paymentTerms: 'NET30',
    destinationWarehouse: 'WH-01',
    items: [
      { productId: 'p-1', orderedQty: 10, unitPrice: 2500, qcRequired: true },
      { productId: 'p-2', orderedQty: 4, unitPrice: 1200, qcRequired: false },
    ],
  });

  assert.equal(valid.allowed, true);
  assert.equal(valid.totalAmount, 29800);
  assert.equal(valid.lineItems.length, 2);
});
