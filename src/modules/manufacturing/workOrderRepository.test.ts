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
