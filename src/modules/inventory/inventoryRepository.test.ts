import test from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryRepository } from './inventoryRepository';
import { createWorkOrderRepository } from '../manufacturing/workOrderRepository';
import { InMemoryUnitOfWork } from '../../shared/kernel/unitOfWork';
import { ok, fail } from '../../shared/kernel/result';
import type { Product, ProductionOrder, StockMovement } from '../../types';

const testMovement: StockMovement = {
  id: 'mov-test-1',
  movementNo: 'MOV-TEST-001',
  timestamp: '2026-10-26 10:00',
  productId: 'prod-1',
  sku: 'RM-STEEL-TEST',
  quantity: 250,
  uom: 'KG',
  fromLocation: 'DOCK',
  toLocation: 'WAREHOUSE',
  lotNumber: 'LOT-TEST-01',
  sourceDocument: 'GRN-01',
  movementType: 'GR_PURCHASE',
  stockBucket: 'AVAILABLE',
};

const testProduct: Product = {
  id: 'prod-1',
  sku: 'RM-STEEL-TEST',
  name: 'Test Raw Steel',
  type: 'RAW_MATERIAL',
  baseUom: 'KG',
  category: 'Metals',
  makeOrBuy: 'BUY',
  lotSerialPolicy: 'LOT',
  standardCost: 50,
  leadTimeDays: 7,
  safetyStock: 100,
  reorderPoint: 200,
  currentStock: 250,
  allocatedStock: 0,
  onOrderStock: 0,
  status: 'ACTIVE',
  description: 'Test Steel',
};

import { INITIAL_PRODUCTION_ORDERS } from '../../lib/mockData';

const testOrder: ProductionOrder = {
  ...INITIAL_PRODUCTION_ORDERS[0],
  id: 'mo-uow-test-1',
  orderNumber: 'MO-2026-UOW-01',
  productId: 'prod-1',
  productSku: 'RM-STEEL-TEST',
  productName: 'Test Steel Component',
  targetQuantity: 100,
  status: 'PLANNED',
};

test('InventoryRepository records movements and tracks product balances', () => {
  const repo = createInventoryRepository([testMovement], [testProduct]);

  // List movements
  const movements = repo.listMovements();
  assert.equal(movements.length, 1);
  assert.equal(movements[0].sku, 'RM-STEEL-TEST');

  // Filter movements by SKU
  const skuMovements = repo.findMovementsBySku('RM-STEEL-TEST');
  assert.equal(skuMovements.length, 1);
  assert.equal(repo.findMovementsBySku('NON-EXISTENT').length, 0);

  // Record new movement
  const newMovement: StockMovement = {
    ...testMovement,
    id: 'mov-test-2',
    movementNo: 'MOV-TEST-002',
    quantity: 50,
    movementType: 'GI_PRODUCTION',
    stockBucket: 'WIP',
  };
  repo.recordMovement(newMovement);
  assert.equal(repo.listMovements().length, 2);

  // Product lookup and update
  const prod = repo.findProductBySku('RM-STEEL-TEST');
  assert.ok(prod);
  assert.equal(prod?.currentStock, 250);

  repo.saveProduct({ ...prod!, currentStock: 200, allocatedStock: 50 });
  const updatedProd = repo.findProductBySku('RM-STEEL-TEST');
  assert.equal(updatedProd?.currentStock, 200);
  assert.equal(updatedProd?.allocatedStock, 50);
});

test('InventoryRepository supports snapshot capture and restoration', () => {
  const repo = createInventoryRepository([testMovement], [testProduct]);
  const snapshot = repo.createSnapshot();

  // Mutate state
  repo.recordMovement({
    ...testMovement,
    id: 'mov-temp-1',
    movementNo: 'MOV-TEMP-001',
    quantity: 99,
  });
  repo.saveProduct({ ...testProduct, currentStock: 999 });

  assert.equal(repo.listMovements().length, 2);
  assert.equal(repo.findProductBySku('RM-STEEL-TEST')?.currentStock, 999);

  // Restore snapshot
  repo.restoreSnapshot(snapshot);

  assert.equal(repo.listMovements().length, 1);
  assert.equal(repo.findProductBySku('RM-STEEL-TEST')?.currentStock, 250);
});

test('InventoryRepository rolls back automatically in UnitOfWork on error', async () => {
  const inventoryRepo = createInventoryRepository([testMovement], [testProduct]);
  const uow = new InMemoryUnitOfWork([inventoryRepo]);

  // Case 1: Thrown exception causes complete rollback
  await assert.rejects(
    async () => {
      await uow.execute(async () => {
        inventoryRepo.recordMovement({
          ...testMovement,
          id: 'mov-fail-1',
          movementNo: 'MOV-FAIL-001',
          quantity: 100,
        });
        inventoryRepo.saveProduct({ ...testProduct, currentStock: 150 });
        throw new Error('Simulated database write failure');
      });
    },
    /Simulated database write failure/
  );

  assert.equal(inventoryRepo.listMovements().length, 1, 'Movements must be rolled back on error');
  assert.equal(inventoryRepo.findProductBySku('RM-STEEL-TEST')?.currentStock, 250, 'Product stock must be restored');

  // Case 2: fail() causes automatic rollback
  const failureOutcome = await uow.execute(async () => {
    inventoryRepo.recordMovement({
      ...testMovement,
      id: 'mov-fail-2',
      movementNo: 'MOV-FAIL-002',
      quantity: 50,
    });
    inventoryRepo.saveProduct({ ...testProduct, currentStock: 200 });
    return fail('Validation failed: negative inventory not allowed');
  });

  assert.ok(failureOutcome.isFailure);
  assert.equal(inventoryRepo.listMovements().length, 1, 'Movements must be rolled back on fail()');
  assert.equal(inventoryRepo.findProductBySku('RM-STEEL-TEST')?.currentStock, 250);

  // Case 3: Successful transaction commits changes
  const successOutcome = await uow.execute(async () => {
    inventoryRepo.recordMovement({
      ...testMovement,
      id: 'mov-success-1',
      movementNo: 'MOV-SUCC-001',
      quantity: 50,
    });
    inventoryRepo.saveProduct({ ...testProduct, currentStock: 300 });
    return ok({ committed: true });
  });

  assert.ok(successOutcome.isSuccess);
  assert.equal(inventoryRepo.listMovements().length, 2, 'Successful transaction must commit movement');
  assert.equal(inventoryRepo.findProductBySku('RM-STEEL-TEST')?.currentStock, 300, 'Successful transaction must commit product');
});

test('Multi-repository atomic rollback: InventoryRepository and WorkOrderRepository roll back together', async () => {
  const inventoryRepo = createInventoryRepository([testMovement], [testProduct]);
  const workOrderRepo = createWorkOrderRepository([testOrder]);
  const uow = new InMemoryUnitOfWork([inventoryRepo, workOrderRepo]);

  // Attempt multi-repo transaction where order is released and material is issued, but step 3 throws
  await assert.rejects(
    async () => {
      await uow.execute(async () => {
        // 1. Mutate work order
        const order = workOrderRepo.findById('mo-uow-test-1')!;
        workOrderRepo.save({ ...order, status: 'RELEASED' });

        // 2. Mutate inventory
        inventoryRepo.recordMovement({
          ...testMovement,
          id: 'mov-issue-atomic-1',
          movementNo: 'MOV-ISS-001',
          quantity: 20,
          movementType: 'GI_PRODUCTION',
          stockBucket: 'WIP',
        });
        inventoryRepo.saveProduct({ ...testProduct, currentStock: 230 });

        // 3. Simulated failure
        throw new Error('Downstream warehouse validation aborted the transaction');
      });
    },
    /Downstream warehouse validation aborted/
  );

  // Verify BOTH repositories rolled back cleanly to their initial state
  const revertedOrder = workOrderRepo.findById('mo-uow-test-1');
  assert.equal(revertedOrder?.status, 'PLANNED', 'WorkOrderRepository must roll back to PLANNED');
  assert.equal(inventoryRepo.listMovements().length, 1, 'InventoryRepository must roll back movements');
  assert.equal(inventoryRepo.findProductBySku('RM-STEEL-TEST')?.currentStock, 250, 'Product stock must roll back');
});
