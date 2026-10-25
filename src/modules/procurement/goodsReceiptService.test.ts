import test from 'node:test';
import assert from 'node:assert/strict';

import type { PurchaseOrder } from '../../types';
import { evaluateGoodsReceipt } from './goodsReceiptService.ts';

const purchaseOrder: PurchaseOrder = {
  id: 'po-1',
  poNumber: 'PO-2026-000001',
  supplierId: 'sup-1',
  supplierName: 'PT Material Prima',
  orderDate: '2026-10-20',
  expectedDeliveryDate: '2026-10-30',
  paymentTerms: 'NET30',
  destinationWarehouse: 'WH-01',
  status: 'APPROVED',
  items: [
    {
      id: 'poi-1',
      productId: 'p-1',
      sku: 'MAT-001',
      name: 'Raw Material A',
      orderedQty: 100,
      receivedQty: 0,
      unitPrice: 2500,
      totalAmount: 250000,
      uom: 'KG',
      qcRequired: true,
    },
  ],
  totalAmount: 250000,
  createdBy: 'Dewi',
  createdAt: '2026-10-20 08:30',
};

test('goods receipt routes incoming QC material to HOLD and creates inspection', () => {
  const result = evaluateGoodsReceipt({
    po: purchaseOrder,
    grnNumber: 'GRN-2026-000001',
    receivedBy: 'Receiving Clerk',
    receiptLines: [
      {
        poItemId: 'poi-1',
        receivedQty: 25,
        supplierLot: 'LOT-2026-001',
        warehouseLoc: 'PLANT01-RM-WH-HOLD',
        incomingQcRequired: true,
      },
    ],
    notes: 'Initial inbound receipt',
    generatedAt: '2026-10-26 09:00',
  });

  assert.equal(result.allowed, true);
  assert.equal(result.anyQcRequired, true);
  assert.equal(result.grn.stockBucketSummary.includes('HOLD'), true);
  assert.equal(result.newInspections.length, 1);
  assert.equal(result.updatedPoItems[0].receivedQty, 25);
  assert.equal(result.newMovements[0].stockBucket, 'HOLD');
});

test('goods receipt rejects receipt lines with no valid quantity', () => {
  const result = evaluateGoodsReceipt({
    po: purchaseOrder,
    grnNumber: 'GRN-2026-000002',
    receivedBy: 'Receiving Clerk',
    receiptLines: [
      {
        poItemId: 'poi-1',
        receivedQty: 0,
        supplierLot: 'LOT-2026-002',
        warehouseLoc: 'PLANT01-RM-WH-A01',
        incomingQcRequired: false,
      },
    ],
    generatedAt: '2026-10-26 09:05',
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /valid receipt|greater than zero/i);
});
