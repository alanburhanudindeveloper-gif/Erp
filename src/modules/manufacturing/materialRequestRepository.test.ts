import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaterialRequestRepository } from './materialRequestRepository';
import { InMemoryUnitOfWork } from '../../shared/kernel/unitOfWork';
import type { MaterialRequest } from '../../types';

const testRequest: MaterialRequest = {
  id: 'mr-test-01',
  requestNumber: 'MR-2026-TEST-01',
  sourceType: 'PRODUCTION_ORDER',
  sourceReferenceId: 'MO-2026-00124',
  productId: 'prod-001',
  productSku: 'FG-001',
  requester: 'Supervisor Jane',
  department: 'Shop Floor Staging',
  requiredDate: '2026-11-10',
  destinationLine: 'Cell A - Line 1',
  priority: 'HIGH',
  status: 'SUBMITTED',
  items: [
    {
      id: 'mri-1',
      productId: 'raw-001',
      sku: 'Material X',
      name: 'Extruded Aluminum Billet',
      requestedQuantity: 50,
      pickedQuantity: 0,
      deliveredQuantity: 0,
      uom: 'KG',
      fromWarehouse: 'WH-01',
      toLocation: 'Cell A',
      status: 'PENDING',
    },
  ],
};

test('MaterialRequestRepository performs CRUD and query operations', () => {
  const repo = createMaterialRequestRepository([testRequest]);

  // List all
  const list = repo.listAll();
  assert.equal(list.length, 1);
  assert.equal(list[0].requestNumber, 'MR-2026-TEST-01');

  // Find by ID and requestNumber
  const found = repo.findById('mr-test-01');
  assert.ok(found);
  assert.equal(found?.productSku, 'FG-001');

  const foundByNumber = repo.findByRequestNumber('MR-2026-TEST-01');
  assert.ok(foundByNumber);
  assert.equal(foundByNumber?.id, 'mr-test-01');

  // Update
  const updated: MaterialRequest = { ...testRequest, status: 'READY' };
  repo.save(updated);
  assert.equal(repo.findById('mr-test-01')?.status, 'READY');

  // Remove
  const removed = repo.remove('mr-test-01');
  assert.equal(removed, true);
  assert.equal(repo.findById('mr-test-01'), undefined);
});

test('MaterialRequestRepository implements ITransactionalParticipant snapshot and restore', () => {
  const repo = createMaterialRequestRepository([testRequest]);

  const snap = repo.createSnapshot();
  assert.ok(snap);

  // Mutate repo
  repo.save({
    ...testRequest,
    status: 'DELIVERED',
    items: [{ ...testRequest.items[0], pickedQuantity: 50, deliveredQuantity: 50, status: 'DELIVERED' }],
  });
  assert.equal(repo.findById('mr-test-01')?.status, 'DELIVERED');

  // Restore snapshot
  repo.restoreSnapshot(snap);
  assert.equal(repo.findById('mr-test-01')?.status, 'SUBMITTED');
  assert.equal(repo.findById('mr-test-01')?.items[0].pickedQuantity, 0);
});

test('MaterialRequestRepository participates in InMemoryUnitOfWork rollback on failure', async () => {
  const repo = createMaterialRequestRepository([testRequest]);
  const uow = new InMemoryUnitOfWork([repo]);

  await assert.rejects(
    async () => {
      await uow.execute(async () => {
        repo.save({
          ...testRequest,
          status: 'READY',
        });
        assert.equal(repo.findById('mr-test-01')?.status, 'READY');
        throw new Error('Forced simulation failure');
      });
    },
    /Forced simulation failure/
  );

  // State must be rolled back to SUBMITTED
  const current = repo.findById('mr-test-01');
  assert.equal(current?.status, 'SUBMITTED');
});
