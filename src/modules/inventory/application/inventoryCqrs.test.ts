import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryRepository } from '../inventoryRepository';
import { createWorkOrderRepository } from '../../manufacturing/workOrderRepository';
import { InMemoryUnitOfWork } from '../../../shared/kernel/unitOfWork';
import { TransferStockHandler } from './commands/transferStockCommand';
import { ReverseMovementHandler } from './commands/reverseMovementCommand';
import { IssueMaterialHandler } from './commands/issueMaterialCommand';
import { Get5BucketBalanceHandler } from './queries/get5BucketBalanceQuery';
import { ListStockMovementsHandler } from './queries/listStockMovementsQuery';
import { GetStockMovementByIdHandler } from './queries/getStockMovementByIdQuery';
import { ListInventoryBalancesHandler } from './queries/listInventoryBalancesQuery';
import type { Product, ProductionOrder, StockMovement } from '../../../types';
import { INITIAL_PRODUCTION_ORDERS } from '../../../lib/mockData';

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

  const initialProduct: Product = {
    id: 'raw-1',
    sku: 'Material X',
    name: 'Material X Raw Spec',
    type: 'RAW_MATERIAL',
    baseUom: 'KG',
    category: 'Polymers',
    makeOrBuy: 'BUY',
    lotSerialPolicy: 'LOT',
    standardCost: 25,
    leadTimeDays: 5,
    safetyStock: 50,
    reorderPoint: 100,
    currentStock: 100,
    allocatedStock: 0,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'Raw Polymer Grade X',
  };

  const initialOrder: ProductionOrder = {
    ...INITIAL_PRODUCTION_ORDERS[0],
    id: 'mo-101',
    orderNumber: 'MO-2026-101',
    productId: 'fg-1',
    productSku: 'FG-WIDGET-01',
    productName: 'Finished Widget',
    targetQuantity: 10,
    status: 'RELEASED',
  };

  it('Get5BucketBalanceHandler returns calculated 5-bucket balance', () => {
    const repo = createInventoryRepository([initialMovement], [initialProduct]);
    const handler = new Get5BucketBalanceHandler(repo);

    const result = handler.execute({ sku: 'Material X' });
    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.hold, 100);
      assert.strictEqual(result.value.available, 0);
    }
  });

  it('TransferStockHandler transfers stock between buckets and records movement', () => {
    const repo = createInventoryRepository([initialMovement], [initialProduct]);
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
    const repo = createInventoryRepository([initialMovement], [initialProduct]);
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

  it('ListStockMovementsHandler filters and paginates movements', () => {
    const repo = createInventoryRepository([initialMovement], [initialProduct]);
    const handler = new ListStockMovementsHandler(repo);

    // List all
    const all = handler.execute({ page: 1, limit: 10 });
    assert.strictEqual(all.total, 1);
    assert.strictEqual(all.items.length, 1);

    // Filter by SKU
    const bySku = handler.execute({ sku: 'Material X', page: 1, limit: 10 });
    assert.strictEqual(bySku.total, 1);

    const notFound = handler.execute({ sku: 'NON-EXISTENT', page: 1, limit: 10 });
    assert.strictEqual(notFound.total, 0);

    // Filter by bucket
    const byBucket = handler.execute({ stockBucket: 'HOLD', page: 1, limit: 10 });
    assert.strictEqual(byBucket.total, 1);
  });

  it('GetStockMovementByIdHandler retrieves single movement or fails', () => {
    const repo = createInventoryRepository([initialMovement], [initialProduct]);
    const handler = new GetStockMovementByIdHandler(repo);

    const found = handler.execute({ id: 'mov-1' });
    assert.strictEqual(found.isSuccess, true);
    if (found.isSuccess) {
      assert.strictEqual(found.value.sku, 'Material X');
    }

    const missing = handler.execute({ id: 'mov-missing' });
    assert.strictEqual(missing.isFailure, true);
  });

  it('ListInventoryBalancesHandler aggregates 5-bucket balance with ATP across products', () => {
    const repo = createInventoryRepository([initialMovement], [initialProduct]);
    const handler = new ListInventoryBalancesHandler(repo);

    const result = handler.execute({ page: 1, limit: 10 });
    assert.strictEqual(result.total, 1);
    const balance = result.items[0];
    assert.strictEqual(balance.sku, 'Material X');
    assert.strictEqual(balance.buckets.hold, 100);
    assert.strictEqual(balance.buckets.available, 0);
    assert.strictEqual(balance.buckets.totalPhysicalOnHand, 100);
  });

  it('IssueMaterialHandler updates inventory movement and enforces hold rules within Unit of Work', () => {
    const inventoryRepo = createInventoryRepository([initialMovement], [initialProduct]);
    const workOrderRepo = createWorkOrderRepository([initialOrder]);
    const uow = new InMemoryUnitOfWork([inventoryRepo, workOrderRepo]);
    const handler = new IssueMaterialHandler(inventoryRepo, workOrderRepo, uow);

    // Case 1: Lot on HOLD without override is blocked by domain rule
    const blockedResult = handler.execute({
      orderId: 'mo-101',
      componentSku: 'Material X',
      lotNumber: 'LOT-001',
      quantity: 25,
      actor: 'Operator Tono',
      role: 'Warehouse Staff',
      isHoldOverride: false,
    });
    assert.strictEqual(blockedResult.isFailure, true);

    // Case 2: Issue with QC override succeeds and records movement atomically
    const issueResult = handler.execute({
      orderId: 'mo-101',
      componentSku: 'Material X',
      lotNumber: 'LOT-001',
      quantity: 25,
      actor: 'Operator Tono',
      role: 'Warehouse Staff',
      isHoldOverride: true,
    });

    assert.strictEqual(issueResult.isSuccess, true);
    if (issueResult.isSuccess) {
      assert.strictEqual(issueResult.value.movement.movementType, 'GI_PRODUCTION');
      assert.strictEqual(issueResult.value.movement.quantity, 25);
      assert.strictEqual(inventoryRepo.listMovements().length, 2);
    }
  });
});
