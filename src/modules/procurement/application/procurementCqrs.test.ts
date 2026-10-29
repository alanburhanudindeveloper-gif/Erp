import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createProcurementRepository } from '../procurementRepository';
import { CreatePurchaseRequisitionHandler } from './commands/createPurchaseRequisitionCommand';
import { ApprovePurchaseRequisitionHandler } from './commands/approvePurchaseRequisitionCommand';
import { ListPurchaseOrdersHandler } from './queries/listPurchaseOrdersQuery';
import type { PurchaseRequisition, PurchaseOrder } from '../../../types';

describe('Procurement Application CQRS Handlers', () => {
  it('CreatePurchaseRequisitionHandler creates PR with calculated tiered approval', () => {
    const repo = createProcurementRepository([], [], []);
    const handler = new CreatePurchaseRequisitionHandler(repo);

    const result = handler.execute({
      requesterId: 'emp-01',
      requesterName: 'Budi Santoso',
      department: 'Machining',
      requiredDate: '2026-11-10',
      reason: 'Safety stock replenishment',
      plantId: 'PLANT-01',
      items: [
        {
          id: 'item-1',
          productId: 'raw-1',
          sku: 'Material X',
          name: 'Material X',
          quantity: 100,
          uom: 'KG',
          estimatedPrice: 15000,
          totalCost: 1500000,
        },
      ],
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.totalAmount, 1500000);
      assert.strictEqual(result.value.approvalLevelRequired, 1);
      assert.strictEqual(repo.listPurchaseRequisitions().length, 1);
    }
  });

  it('ApprovePurchaseRequisitionHandler enforces segregation of duties', () => {
    const samplePr: PurchaseRequisition = {
      id: 'pr-sod-1',
      prNumber: 'PR-SOD-001',
      requesterId: 'emp-01',
      requesterName: 'Budi Santoso',
      department: 'Machining',
      requiredDate: '2026-11-10',
      reason: 'Need tooling',
      plantId: 'PLANT-01',
      status: 'PENDING_APPROVAL',
      totalAmount: 1500000,
      approvalLevelRequired: 1,
      items: [],
      createdAt: '2026-10-29 10:00',
    };

    const repo = createProcurementRepository([samplePr], [], []);
    const handler = new ApprovePurchaseRequisitionHandler(repo);

    // Self approval should fail
    const selfApproval = handler.execute({
      prId: 'pr-sod-1',
      actorName: 'Budi Santoso',
      actorRole: 'Manager',
    });
    assert.strictEqual(selfApproval.isFailure, true);

    // Independent manager approval should succeed
    const validApproval = handler.execute({
      prId: 'pr-sod-1',
      actorName: 'Agus Wijaya',
      actorRole: 'Manager',
    });
    assert.strictEqual(validApproval.isSuccess, true);
    if (validApproval.isSuccess) {
      assert.strictEqual(validApproval.value.status, 'APPROVED');
      assert.strictEqual(validApproval.value.approvedBy, 'Agus Wijaya');
    }
  });

  it('ListPurchaseOrdersHandler paginates orders', () => {
    const samplePo: PurchaseOrder = {
      id: 'po-1',
      poNumber: 'PO-001',
      supplierId: 'sup-1',
      supplierName: 'PT Steel',
      orderDate: '2026-10-29',
      expectedDeliveryDate: '2026-11-05',
      paymentTerms: 'NET 30',
      destinationWarehouse: 'WH-01',
      status: 'APPROVED',
      items: [],
      totalAmount: 10000000,
      createdBy: 'Dewi',
      createdAt: '2026-10-29 10:00',
    };

    const repo = createProcurementRepository([], [samplePo], []);
    const handler = new ListPurchaseOrdersHandler(repo);

    const list = handler.execute({ page: 1, limit: 10 });
    assert.strictEqual(list.total, 1);
    assert.strictEqual(list.items[0].poNumber, 'PO-001');
  });
});
