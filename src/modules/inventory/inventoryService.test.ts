import test from 'node:test';
import assert from 'node:assert/strict';

import type { Product, ProductionOrder, StockMovement } from '../../types';
import {
  getInventoryHealth,
  assessProductionOrderReadiness,
  issueMaterialToProduction,
  reserveMaterialsForProduction,
  consumeMaterialsForProduction,
  recordScrapTransaction,
  reverseStockMovement,
} from './inventoryService';

const products: Product[] = [
  {
    id: 'p-1',
    sku: 'MAT-001',
    name: 'Material A',
    type: 'RAW_MATERIAL',
    baseUom: 'KG',
    category: 'Raw Metals',
    makeOrBuy: 'BUY',
    lotSerialPolicy: 'LOT',
    standardCost: 10,
    leadTimeDays: 5,
    safetyStock: 200,
    reorderPoint: 100,
    currentStock: 150,
    allocatedStock: 50,
    onOrderStock: 20,
    status: 'ACTIVE',
    description: 'Material A',
  },
  {
    id: 'p-2',
    sku: 'FG-001',
    name: 'Finished Item A',
    type: 'FINISHED_GOOD',
    baseUom: 'PCS',
    category: 'Finished Goods',
    makeOrBuy: 'MAKE',
    lotSerialPolicy: 'LOT',
    standardCost: 50,
    leadTimeDays: 7,
    safetyStock: 30,
    reorderPoint: 50,
    currentStock: 500,
    allocatedStock: 100,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'Finished Item A',
  },
];

const order: ProductionOrder = {
  id: 'mo-1',
  orderNumber: 'MO-2026-001',
  productId: 'p-2',
  productSku: 'FG-001',
  productName: 'Finished Item A',
  targetQuantity: 100,
  goodQuantity: 0,
  scrapQuantity: 0,
  bomId: 'bom-1',
  bomCode: 'BOM-01',
  bomRevision: 'Rev 1',
  routingId: 'route-1',
  routingCode: 'RTE-01',
  routingRevision: 'Rev 1',
  plantId: 'Plant-01',
  plantName: 'Main Plant',
  plannedStartDate: '2026-10-25',
  dueDate: '2026-10-28',
  demandLink: 'SO-1001',
  priority: 'NORMAL',
  status: 'PLANNED',
  materialAvailabilityPct: 80,
  operations: [],
  materials: [
    {
      productId: 'p-1',
      sku: 'MAT-001',
      name: 'Material A',
      requiredQty: 120,
      allocatedQty: 0,
      consumedQty: 0,
      availableStock: 100,
      uom: 'KG',
      unitCost: 10,
      status: 'SHORTAGE',
    },
  ],
  outputLogs: [],
  totalCostPlanned: 2000,
  totalCostActual: 0,
  createdAt: '2026-10-25',
};

test('inventory health flags material below safety stock', () => {
  const result = getInventoryHealth(products);

  assert.equal(result[0].status, 'CRITICAL');
  assert.equal(result[0].availableToPromise, 100);
  assert.equal(result[1].status, 'HEALTHY');
});

test('production order readiness flags shortages before release', () => {
  const result = assessProductionOrderReadiness(order);

  assert.equal(result.risk, 'BLOCKED');
  assert.deepEqual(result.shortageSkus, ['MAT-001']);
});

test('issueMaterialToProduction blocks held lots without override', () => {
  const stockMovements: StockMovement[] = [
    {
      id: 'mov-1',
      movementNo: 'MATDOC-1',
      timestamp: '2026-10-26 07:00',
      productId: 'p-1',
      sku: 'MAT-001',
      quantity: 50,
      uom: 'KG',
      fromLocation: 'PLANT01-RM-WH-AVAILABLE',
      toLocation: 'QC-HOLD',
      lotNumber: 'LOT-100',
      sourceDocument: 'PO-1001',
      movementType: 'TRANSFER',
      stockBucket: 'HOLD',
    },
  ];

  const result = issueMaterialToProduction(order, 'MAT-001', 'LOT-100', 25, stockMovements, 'Joko', 'Supervisor');

  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /HOLD|QUARANTINE/i);
});

test('issueMaterialToProduction records a valid material issue to WIP', () => {
  const result = issueMaterialToProduction(order, 'MAT-001', 'LOT-200', 25, [], 'Joko', 'Supervisor');

  assert.equal(result.allowed, true);
  assert.equal(result.movement?.movementType, 'GI_PRODUCTION');
  assert.equal(result.auditLog?.action, 'ISSUE_MATERIAL');
  assert.equal(result.movement?.toLocation, 'WIP-WC-CUT-01');
});

test('reserveMaterialsForProduction creates a hard reservation for released work', () => {
  const result = reserveMaterialsForProduction(order, 'MAT-001', 40, 'LOT-200', 'RM-WH-01', 'Joko');

  assert.equal(result.allowed, true);
  assert.equal(result.reservation?.status, 'ACTIVE');
  assert.equal(result.reservation?.reservedQty, 40);
  assert.equal(result.auditLog?.action, 'RESERVE_MATERIAL');
});

test('consumeMaterialsForProduction reconciles reserved material against issued quantity', () => {
  const reservationResult = reserveMaterialsForProduction(order, 'MAT-001', 40, 'LOT-200', 'RM-WH-01', 'Joko');
  const result = consumeMaterialsForProduction(order, 'MAT-001', 25, reservationResult.reservation, 'Joko');

  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.materials[0].consumedQty, 25);
  assert.equal(result.reservation?.status, 'ACTIVE');
  assert.equal(result.reservation?.reservedQty, 15);
  assert.equal(result.auditLog?.action, 'CONSUME_MATERIAL');
});

test('recordScrapTransaction posts rejected stock movement and audit log', () => {
  const result = recordScrapTransaction(
    order,
    'MAT-001',
    12,
    'LOT-200',
    'OPERATION-ERROR',
    'Joko',
    'RM-WH-01'
  );

  assert.equal(result.allowed, true);
  assert.equal(result.movement?.movementType, 'SCRAP');
  assert.equal(result.movement?.stockBucket, 'REJECTED');
  assert.equal(result.auditLog?.action, 'SCRAP_MATERIAL');
});

test('reverseStockMovement creates a compensating reversal entry', () => {
  const baseMovement: StockMovement = {
    id: 'mov-999',
    movementNo: 'MATDOC-999',
    timestamp: '2026-10-26 08:00',
    productId: 'p-1',
    sku: 'MAT-001',
    quantity: 12,
    uom: 'KG',
    fromLocation: 'RM-WH-01',
    toLocation: 'SCRAP-YARD',
    lotNumber: 'LOT-200',
    sourceDocument: 'MO-2026-001',
    movementType: 'SCRAP',
    stockBucket: 'REJECTED',
  };

  const result = reverseStockMovement(baseMovement, 'Joko');

  assert.equal(result.allowed, true);
  assert.equal(result.movement?.movementType, 'REVERSAL');
  assert.equal(result.movement?.isReversed, true);
  assert.equal(result.auditLog?.action, 'REVERSE_MOVEMENT');
});
