import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createProcurementRepository } from './procurementRepository';
import type { PurchaseRequisition, PurchaseOrder, GoodsReceiptNote } from '../../types';

describe('Procurement Repository Operations', () => {
  it('manages Purchase Requisitions through authoritative persistence', () => {
    const repo = createProcurementRepository([], [], []);

    const pr: PurchaseRequisition = {
      id: 'pr-test-1',
      prNumber: 'PR-2026-TEST',
      requesterId: 'usr-1',
      requesterName: 'Alice',
      department: 'Assembly',
      requiredDate: '2026-11-01',
      reason: 'Urgent stock needed',
      plantId: 'PLANT-01',
      status: 'PENDING_APPROVAL',
      totalAmount: 5000000,
      approvalLevelRequired: 1,
      items: [],
      createdAt: '2026-10-29 10:00',
    };

    repo.savePurchaseRequisition(pr);
    assert.strictEqual(repo.listPurchaseRequisitions().length, 1);
    const fetched = repo.findPurchaseRequisitionById('pr-test-1');
    assert.strictEqual(fetched?.prNumber, 'PR-2026-TEST');
  });

  it('manages Purchase Orders and Goods Receipts', () => {
    const repo = createProcurementRepository([], [], []);

    const po: PurchaseOrder = {
      id: 'po-test-1',
      poNumber: 'PO-2026-TEST',
      supplierId: 'sup-1',
      supplierName: 'PT Steel',
      orderDate: '2026-10-29',
      expectedDeliveryDate: '2026-11-05',
      paymentTerms: 'NET 30',
      destinationWarehouse: 'WH-01',
      status: 'APPROVED',
      items: [],
      totalAmount: 12000000,
      createdBy: 'Bob',
      createdAt: '2026-10-29 10:00',
    };

    repo.savePurchaseOrder(po);
    assert.strictEqual(repo.listPurchaseOrders().length, 1);
    assert.strictEqual(repo.findPurchaseOrderById('po-test-1')?.poNumber, 'PO-2026-TEST');

    const grn: GoodsReceiptNote = {
      id: 'grn-test-1',
      grnNumber: 'GRN-2026-TEST',
      poId: 'po-test-1',
      poNumber: 'PO-2026-TEST',
      supplierName: 'PT Steel',
      receivedDate: '2026-10-29 14:00',
      receivedBy: 'Charlie',
      items: [],
      stockBucketSummary: 'Received into AVAILABLE',
    };

    repo.recordGoodsReceipt(grn);
    assert.strictEqual(repo.listGoodsReceipts().length, 1);
    assert.strictEqual(repo.findGoodsReceiptById('grn-test-1')?.grnNumber, 'GRN-2026-TEST');
  });
});
