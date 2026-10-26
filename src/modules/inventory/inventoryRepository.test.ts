import test from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryRepository } from './inventoryRepository';
import type { Product, StockMovement } from '../../types';

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
