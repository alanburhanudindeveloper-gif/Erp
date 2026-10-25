import test from 'node:test';
import assert from 'node:assert/strict';

import type { ProductionOrder } from '../../types';
import {
  releaseProductionOrderForExecution,
  startProductionOperation,
  completeProductionOperation,
  closeProductionOrderExecution,
  reportProductionOutputForExecution,
} from './productionExecutionService.ts';

const baseOrder: ProductionOrder = {
  id: 'mo-001',
  orderNumber: 'MO-2026-00123',
  productId: 'p-001',
  productSku: 'Product A',
  productName: 'Product A',
  bomId: 'bom-001',
  bomCode: 'BOM-001',
  bomRevision: 'R1',
  routingId: 'rtg-001',
  routingCode: 'RTG-001',
  routingRevision: 'R1',
  plantId: 'plant-01',
  plantName: 'Plant 01',
  plannedStartDate: '2026-10-25',
  dueDate: '2026-10-27',
  demandLink: 'SO-9001',
  priority: 'NORMAL',
  status: 'PLANNED',
  targetQuantity: 120,
  goodQuantity: 0,
  scrapQuantity: 0,
  materialAvailabilityPct: 100,
  operations: [
    {
      id: 'op-1',
      workOrderNo: 'WO-001',
      sequence: 1,
      operationCode: 'CUT-01',
      name: 'Cutting',
      workCenterId: 'wc-1',
      workCenterCode: 'WC-CUT-01',
      workCenterName: 'Cutting Cell',
      status: 'PENDING',
      targetQty: 120,
      completedQty: 0,
      scrapQty: 0,
      plannedDurationMinutes: 120,
      actualDurationMinutes: 0,
      downtimeMinutes: 0,
      dependencySeq: undefined,
      setupTimeMinutes: 15,
      runTimeSecondsPerUnit: 40,
      startedAt: undefined,
      completedAt: undefined,
      assignedOperator: undefined,
    },
    {
      id: 'op-2',
      workOrderNo: 'WO-002',
      sequence: 2,
      operationCode: 'ASSY-01',
      name: 'Assembly',
      workCenterId: 'wc-2',
      workCenterCode: 'WC-ASSY-01',
      workCenterName: 'Assembly Cell',
      status: 'PENDING',
      targetQty: 120,
      completedQty: 0,
      scrapQty: 0,
      plannedDurationMinutes: 180,
      actualDurationMinutes: 0,
      downtimeMinutes: 0,
      dependencySeq: 1,
      setupTimeMinutes: 20,
      runTimeSecondsPerUnit: 60,
      startedAt: undefined,
      completedAt: undefined,
      assignedOperator: undefined,
    },
  ],
  materials: [
    {
      productId: 'p-1',
      sku: 'MAT-001',
      name: 'Material A',
      requiredQty: 10,
      allocatedQty: 10,
      consumedQty: 0,
      availableStock: 20,
      uom: 'PCS',
      unitCost: 12,
      status: 'SUFFICIENT',
    },
  ],
  outputLogs: [],
  totalCostPlanned: 1200,
  totalCostActual: 0,
  createdAt: '2026-10-24',
};

test('releaseProductionOrderForExecution releases the order and sets the first operation ready', () => {
  const decision = releaseProductionOrderForExecution(baseOrder, 'Dewi Lestari', 'Supervisor');

  assert.equal(decision.allowed, true);
  assert.equal(decision.updatedOrder?.status, 'RELEASED');
  assert.equal(decision.updatedOrder?.operations[0].status, 'READY');
  assert.equal(decision.auditLog?.action, 'RELEASE_PRODUCTION_ORDER');
});

test('startProductionOperation blocks the next operation when dependency is not complete', () => {
  const result = startProductionOperation({
    ...baseOrder,
    status: 'RELEASED',
    operations: [
      { ...baseOrder.operations[0], status: 'PENDING' },
      { ...baseOrder.operations[1], status: 'PENDING', dependencySeq: 1 },
    ],
  }, 2, 'Joko');

  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /dependency/i);
});

test('startProductionOperation starts a valid dependent operation', () => {
  const order: ProductionOrder = {
    ...baseOrder,
    status: 'RELEASED',
    operations: [
      { ...baseOrder.operations[0], status: 'COMPLETED' },
      { ...baseOrder.operations[1], status: 'PENDING', dependencySeq: 1 },
    ],
  };

  const result = startProductionOperation(order, 2, 'Joko');

  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.operations[1].status, 'IN_PROGRESS');
  assert.equal(result.updatedOrder?.status, 'IN_PROGRESS');
});

test('completeProductionOperation marks the final operation complete and closes the order when the last step ends', () => {
  const order: ProductionOrder = {
    ...baseOrder,
    status: 'RELEASED',
    operations: [
      { ...baseOrder.operations[0], status: 'COMPLETED', targetQty: 120, completedQty: 120 },
      { ...baseOrder.operations[1], status: 'IN_PROGRESS', targetQty: 120, completedQty: 120 },
    ],
  };

  const result = completeProductionOperation(order, 2, 'Joko');

  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.operations[1].status, 'COMPLETED');
  assert.equal(result.updatedOrder?.status, 'COMPLETED');
});

test('closeProductionOrderExecution closes a completed order', () => {
  const order: ProductionOrder = {
    ...baseOrder,
    status: 'COMPLETED',
  };

  const result = closeProductionOrderExecution(order, 'Dewi Lestari', 'Controller');

  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.status, 'CLOSED');
  assert.equal(result.auditLog?.action, 'CLOSE_PRODUCTION_ORDER');
});

test('reportProductionOutputForExecution records output and creates stock movements', () => {
  const order: ProductionOrder = {
    ...baseOrder,
    status: 'RELEASED',
    operations: [
      { ...baseOrder.operations[0], status: 'IN_PROGRESS', targetQty: 120, completedQty: 100 },
      { ...baseOrder.operations[1], status: 'PENDING', targetQty: 120, completedQty: 0 },
    ],
  };

  const result = reportProductionOutputForExecution(order, 1, 20, 2, 'MACHINE', 'Joko', 'Normal output');

  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.operations[0].status, 'COMPLETED');
  assert.equal(result.updatedOrder?.goodQuantity, 20);
  assert.ok((result.stockMovements?.length ?? 0) >= 1);
  assert.equal(result.auditLog?.action, 'REPORT_OUTPUT');
});
