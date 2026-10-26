import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate5BucketBalance,
  transferStockBetweenBuckets,
  reverseStockMovement,
} from './inventoryLedgerService';
import type { StockMovement } from '../../types';

const mockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    movementNo: 'MOV-001',
    timestamp: '2026-10-26 08:00',
    productId: 'raw-001',
    sku: 'RM-STEEL-COIL',
    quantity: 500,
    uom: 'KG',
    fromLocation: 'RECEIVING-DOCK',
    toLocation: 'RM-WAREHOUSE',
    lotNumber: 'LOT-STEEL-01',
    sourceDocument: 'GRN-001',
    movementType: 'GR_PURCHASE',
    stockBucket: 'AVAILABLE',
  },
  {
    id: 'mov-2',
    movementNo: 'MOV-002',
    timestamp: '2026-10-26 09:00',
    productId: 'raw-001',
    sku: 'RM-STEEL-COIL',
    quantity: 100,
    uom: 'KG',
    fromLocation: 'RM-WAREHOUSE',
    toLocation: 'QUARANTINE-AREA',
    lotNumber: 'LOT-STEEL-01',
    sourceDocument: 'QC-INS-001',
    movementType: 'TRANSFER',
    stockBucket: 'HOLD',
  },
  {
    id: 'mov-3',
    movementNo: 'MOV-003',
    timestamp: '2026-10-26 10:00',
    productId: 'raw-001',
    sku: 'RM-STEEL-COIL',
    quantity: 150,
    uom: 'KG',
    fromLocation: 'RM-WAREHOUSE',
    toLocation: 'WIP-LINE-1',
    lotNumber: 'LOT-STEEL-01',
    sourceDocument: 'WO-101',
    movementType: 'GI_PRODUCTION',
    stockBucket: 'WIP',
  },
];

test('calculate5BucketBalance computes correct physical on-hand and bucket segmentation', () => {
  const balance = calculate5BucketBalance('RM-STEEL-COIL', mockMovements);

  // 500 GR_PURCHASE - 100 HOLD - 150 GI_PRODUCTION = 250 AVAILABLE
  // 100 HOLD
  // 150 WIP
  // Total physical on-hand = AVAILABLE (250) + RESERVED (0) + HOLD (100) = 350
  assert.equal(balance.available, 250);
  assert.equal(balance.hold, 100);
  assert.equal(balance.wip, 150);
  assert.equal(balance.totalPhysicalOnHand, 350);
});

test('transferStockBetweenBuckets prevents transferring more than available in source bucket', () => {
  const result = transferStockBetweenBuckets(
    {
      productId: 'raw-001',
      sku: 'RM-STEEL-COIL',
      quantity: 300, // More than 250 available!
      uom: 'KG',
      fromBucket: 'AVAILABLE',
      toBucket: 'RESERVED',
      fromLocation: 'RM-WAREHOUSE',
      toLocation: 'RESERVED-RACK',
      lotNumber: 'LOT-STEEL-01',
      sourceDocument: 'MO-2026-0099',
      actor: 'Budi Santoso',
      role: 'Planner',
      reason: 'Reserve for high priority work order',
    },
    mockMovements
  );

  assert.equal(result.success, false);
  assert.match(result.reason || '', /Insufficient quantity/);
});

test('transferStockBetweenBuckets creates valid stock movement when balance is sufficient', () => {
  const result = transferStockBetweenBuckets(
    {
      productId: 'raw-001',
      sku: 'RM-STEEL-COIL',
      quantity: 50,
      uom: 'KG',
      fromBucket: 'AVAILABLE',
      toBucket: 'RESERVED',
      fromLocation: 'RM-WAREHOUSE',
      toLocation: 'RESERVED-RACK',
      lotNumber: 'LOT-STEEL-01',
      sourceDocument: 'MO-2026-0099',
      actor: 'Budi Santoso',
      role: 'Planner',
      reason: 'Reserve for work order',
    },
    mockMovements
  );

  assert.equal(result.success, true);
  assert.ok(result.movement);
  assert.equal(result.movement?.stockBucket, 'RESERVED');
  assert.equal(result.movement?.quantity, 50);
  assert.equal(result.auditLog?.action, 'TRANSFER_STOCK_BUCKET');
});

test('reverseStockMovement creates compensating reversal movement with mandatory audit justification', () => {
  const originalMovement = mockMovements[1]; // The HOLD movement

  const result = reverseStockMovement(
    originalMovement,
    'Handoko (QA)',
    'Quality Manager',
    'False positive metallurgical reading. Lot cleared.'
  );

  assert.equal(result.success, true);
  assert.ok(result.reversalMovement);
  assert.equal(result.reversalMovement?.movementType, 'REVERSAL');
  assert.equal(result.reversalMovement?.fromLocation, originalMovement.toLocation);
  assert.equal(result.reversalMovement?.toLocation, originalMovement.fromLocation);
  assert.equal(result.reversalMovement?.sourceDocument, originalMovement.movementNo);

  // Missing justification fails
  const failedResult = reverseStockMovement(originalMovement, 'Handoko', 'Quality Manager', 'err');
  assert.equal(failedResult.success, false);
});
