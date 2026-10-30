import test from 'node:test';
import assert from 'node:assert/strict';
import { erpApplication } from '../../../../app/composition/dependencies';

test('Procurement CQRS presentation integration: listPurchaseOrders query handler executes cleanly', () => {
  const result = erpApplication.procurement.listPurchaseOrders.execute({ page: 1, limit: 10 });
  assert.ok(Array.isArray(result.items));
  assert.equal(typeof result.total, 'number');
  assert.equal(result.page, 1);
});

test('Procurement CQRS presentation integration: create and approve PR handlers execute and enforce authorization', () => {
  const createResult = erpApplication.procurement.createPurchaseRequisition.execute({
    requesterId: 'usr-buyer-1',
    requesterName: 'Jane Buyer',
    department: 'Procurement',
    requiredDate: '2026-11-15',
    reason: 'Restocking high-yield steel sheet stock',
    plantId: 'PLANT-01',
    items: [
      {
        id: 'item-1',
        productId: 'raw-stl-01',
        sku: 'RAW-STL-01',
        name: 'Steel Sheet 2.0mm',
        quantity: 100,
        uom: 'KG',
        estimatedPrice: 15000,
        totalCost: 1500000,
      },
    ],
  });

  assert.equal(createResult.isSuccess, true);
  if (createResult.isSuccess) {
    const pr = createResult.value;
    assert.equal(pr.status, 'PENDING_APPROVAL');

    // Attempt approval with independent manager
    const approveResult = erpApplication.procurement.approvePurchaseRequisition.execute({
      prId: pr.id,
      actorName: 'Bob Manager',
      actorRole: 'Manager',
    });

    assert.equal(approveResult.isSuccess, true);
    if (approveResult.isSuccess) {
      assert.equal(approveResult.value.status, 'APPROVED');
      assert.equal(approveResult.value.approvedBy, 'Bob Manager');
    }
  }
});
