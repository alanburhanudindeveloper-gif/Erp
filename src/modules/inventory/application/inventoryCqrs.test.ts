import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createInventoryRepository } from '../inventoryRepository';
import { TransferStockHandler } from './commands/transferStockCommand';
import { ReverseMovementHandler } from './commands/reverseMovementCommand';
import { Get5BucketBalanceHandler } from './queries/get5BucketBalanceQuery';
import type { StockMovement } from '../../../types';

describe('Inventory Application CQRS Handlers', () => {
  const initialMovement: StockMovement = {
    id: 'mov-1',
    movementNo: 'MATDOC-001',
    timestamp: '2026-10-29 08:00',
    productId: 'raw-1',
    sku: 'Material X',
    quantity: 100,
    uom: 'KG',
    fromLocation: 'RECEIVING',
    toLocation: 'HOLD-AREA',
    lotNumber: 'LOT-001',
    sourceDocument: 'GRN-001',
    movementType: 'GR_PURCHASE',
    stockBucket: 'HOLD',
  };

  it('Get5BucketBalanceHandler returns calculated 5-bucket balance', () => {
    const repo = createInventoryRepository([initialMovement], []);
    const handler = new Get5BucketBalanceHandler(repo);

    const result = handler.execute({ sku: 'Material X' });
    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.hold, 100);
      assert.strictEqual(result.value.available, 0);
    }
  });

  it('TransferStockHandler transfers stock between buckets and records movement', () => {
    const repo = createInventoryRepository([initialMovement], []);
    const handler = new TransferStockHandler(repo);

    const result = handler.execute({
      productId: 'raw-1',
      sku: 'Material X',
      quantity: 50,
      uom: 'KG',
      fromBucket: 'HOLD',
      toBucket: 'AVAILABLE',
      fromLocation: 'HOLD-AREA',
      toLocation: 'MAIN-WAREHOUSE',
      lotNumber: 'LOT-001',
      sourceDocument: 'QC-RELEASE-001',
      actor: 'QC Inspector',
      role: 'Inspector',
      reason: 'Passed incoming QC inspection',
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(repo.listMovements().length, 2);
    }
  });

  it('ReverseMovementHandler posts compensating movement', () => {
    const repo = createInventoryRepository([initialMovement], []);
    const handler = new ReverseMovementHandler(repo);

    const result = handler.execute({
      movementId: 'mov-1',
      actor: 'Supervisor',
      role: 'Warehouse Supervisor',
      reason: 'Incorrect goods receipt entered by mistake',
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(repo.listMovements().length, 2);
      assert.strictEqual(result.value.movementType, 'REVERSAL');
    }
  });
});
