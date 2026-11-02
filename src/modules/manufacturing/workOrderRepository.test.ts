import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkOrderRepository } from './workOrderRepository';
import type { ProductionOrder } from '../../types';

const testOrder: ProductionOrder = {
  id: 'mo-repo-test-1',
  orderNumber: 'MO-2026-REPO-01',
  productId: 'prod-fg-1',
  productSku: 'FG-001',
  productName: 'Flow Sensor V2',
  targetQuantity: 200,
  goodQuantity: 0,
  scrapQuantity: 0,
  bomId: 'bom-1',
  bomCode: 'BOM-01',
  bomRevision: 'REV-A',
  routingId: 'rtg-1',
  routingCode: 'RTG-01',
  routingRevision: 'REV-A',
  plantId: 'plant-1',
  plantName: 'Batam Plant',
  plannedStartDate: '2026-11-01',
  dueDate: '2026-11-10',
  demandLink: 'DEM-01',
  priority: 'NORMAL',
  status: 'PLANNED',
  materialAvailabilityPct: 100,
  operations: [],
  materials: [],
  outputLogs: [],
  totalCostPlanned: 10000,
  totalCostActual: 0,
  createdAt: '2026-10-26 08:00',
};

test('WorkOrderRepository performs CRUD operations through authoritative collection', () => {
  const repo = createWorkOrderRepository([testOrder]);

  // List all
  const orders = repo.listAll();
  assert.equal(orders.length, 1);
  assert.equal(orders[0].orderNumber, 'MO-2026-REPO-01');

  // Find by ID and orderNumber
  const foundById = repo.findById('mo-repo-test-1');
  assert.ok(foundById);
  assert.equal(foundById?.productSku, 'FG-001');

  const foundByNo = repo.findByOrderNumber('MO-2026-REPO-01');
  assert.ok(foundByNo);
  assert.equal(foundByNo?.id, 'mo-repo-test-1');

  // Upsert update
  const updatedOrder = { ...testOrder, status: 'RELEASED' as const, goodQuantity: 50 };
  repo.save(updatedOrder);

  const reloaded = repo.findById('mo-repo-test-1');
  assert.equal(reloaded?.status, 'RELEASED');
  assert.equal(reloaded?.goodQuantity, 50);

  // Remove
  const removed = repo.remove('mo-repo-test-1');
  assert.equal(removed, true);
  assert.equal(repo.listAll().length, 0);
});

test('WorkOrderRepository implements ITransactionalParticipant: snapshot and restore', () => {
  const repo = createWorkOrderRepository([testOrder]);

  // Capture snapshot
  const snapshot = repo.createSnapshot();
  assert.ok(snapshot, 'Snapshot must be non-null');

  // Mutate repository state
  repo.save({ ...testOrder, targetQuantity: 9999, status: 'CLOSED' });
  assert.equal(repo.findById(testOrder.id)?.targetQuantity, 9999);
  assert.equal(repo.findById(testOrder.id)?.status, 'CLOSED');

  // Restore snapshot
  repo.restoreSnapshot(snapshot);
  const restored = repo.findById(testOrder.id);
  assert.equal(restored?.targetQuantity, 200, 'targetQuantity must be restored to original state');
  assert.equal(restored?.status, 'PLANNED', 'status must be restored to original state');
});

test('WorkOrderRepository transaction execution: successful commit retains mutations', async () => {
  const { InMemoryUnitOfWork } = await import('../../shared/kernel/unitOfWork');
  const repo = createWorkOrderRepository([testOrder]);
  const uow = new InMemoryUnitOfWork([repo]);

  await uow.execute(async () => {
    repo.save({ ...testOrder, status: 'RELEASED', goodQuantity: 120 });
  });

  const committed = repo.findById(testOrder.id);
  assert.equal(committed?.status, 'RELEASED', 'Committed transaction state must persist');
  assert.equal(committed?.goodQuantity, 120, 'Committed goodQuantity must persist');
});

test('WorkOrderRepository transaction execution: failed transaction rolls back all work order mutations', async () => {
  const { InMemoryUnitOfWork } = await import('../../shared/kernel/unitOfWork');
  const repo = createWorkOrderRepository([testOrder]);
  const uow = new InMemoryUnitOfWork([repo]);

  await assert.rejects(
    async () => {
      await uow.execute(async () => {
        repo.save({ ...testOrder, status: 'IN_PROGRESS', goodQuantity: 50 });
        repo.save({ ...testOrder, id: 'mo-new-transient', orderNumber: 'MO-TRANSIENT' });

        throw new Error('Simulated shop floor hardware failure midway through execution');
      });
    },
    /Simulated shop floor hardware failure/
  );

  // Verify actual state restoration
  const original = repo.findById(testOrder.id);
  assert.equal(original?.status, 'PLANNED', 'Status must roll back to PLANNED');
  assert.equal(original?.goodQuantity, 0, 'goodQuantity must roll back to 0');
  assert.equal(repo.findById('mo-new-transient'), undefined, 'Transient order must be rolled back');
  assert.equal(repo.listAll().length, 1, 'Total orders count must roll back');
});

test('Multi-repository atomic transaction rollback: WorkOrder and Procurement roll back together', async () => {
  const { InMemoryUnitOfWork } = await import('../../shared/kernel/unitOfWork');
  const { createProcurementRepository } = await import('../procurement/procurementRepository');
  const workOrderRepo = createWorkOrderRepository([testOrder]);
  const procurementRepo = createProcurementRepository();

  const initialPrCount = procurementRepo.listPurchaseRequisitions().length;
  const uow = new InMemoryUnitOfWork([workOrderRepo, procurementRepo]);

  await assert.rejects(
    async () => {
      await uow.execute(async () => {
        // Mutate work orders
        workOrderRepo.save({ ...testOrder, status: 'RELEASED' });

        // Mutate procurement
        procurementRepo.savePurchaseRequisition({
          id: 'pr-rollback-test-99',
          prNumber: 'PR-TEST-ROLLBACK',
          requesterId: 'usr-1',
          requesterName: 'Requester',
          department: 'Assembly',
          requiredDate: '2026-12-01',
          reason: 'Emergency parts',
          plantId: 'PLANT-01',
          status: 'PENDING_APPROVAL',
          items: [],
          totalAmount: 50000,
          approvalLevelRequired: 1,
          createdAt: '2026-11-01',
        });

        // Fail transaction
        throw new Error('Cross-module invariant violation: insufficient budget');
      });
    },
    /Cross-module invariant violation/
  );

  // Both repositories must have rolled back cleanly
  assert.equal(workOrderRepo.findById(testOrder.id)?.status, 'PLANNED', 'WorkOrder status must roll back');
  assert.equal(procurementRepo.findPurchaseRequisitionById('pr-rollback-test-99'), undefined, 'PR must roll back');
  assert.equal(procurementRepo.listPurchaseRequisitions().length, initialPrCount, 'Procurement count must be unchanged');
});
