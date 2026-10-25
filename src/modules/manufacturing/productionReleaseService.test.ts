import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateProductionRelease } from './productionReleaseService';
import { buildProductionOrderDraft } from './productionOrderFactory';
import type { ProductionOrder, Product, BillOfMaterials, Routing } from '../../types';

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

test('production order draft is built from BOM and routing definitions', () => {
  const product: Product = {
    id: 'p-001',
    sku: 'PRODUCT-01',
    name: 'Test Product',
    type: 'FINISHED_GOOD',
    baseUom: 'PCS',
    category: 'ASSEMBLY',
    makeOrBuy: 'MAKE',
    lotSerialPolicy: 'LOT',
    standardCost: 25,
    leadTimeDays: 5,
    safetyStock: 0,
    reorderPoint: 0,
    currentStock: 0,
    allocatedStock: 0,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'Test product',
  };

  const bom: BillOfMaterials = {
    id: 'bom-001',
    code: 'BOM-001',
    revision: 'R1',
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    baseQuantity: 1,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2099-12-31',
    bomType: 'STANDARD',
    status: 'ACTIVE',
    components: [
      {
        id: 'comp-001',
        componentProductId: 'raw-001',
        componentSku: 'RAW-001',
        componentName: 'Raw Material',
        quantityPerUnit: 2,
        uom: 'PCS',
        scrapPercentage: 0,
        unitCost: 10,
      },
    ],
  };

  const routing: Routing = {
    id: 'routing-001',
    code: 'ROUTE-001',
    revision: 'R1',
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    status: 'ACTIVE',
    operations: [
      {
        id: 'op-1',
        sequence: 1,
        operationCode: 'CUT-01',
        name: 'Cutting',
        workCenterId: 'wc-1',
        workCenterCode: 'WC-01',
        workCenterName: 'Cutting',
        setupTimeMinutes: 15,
        runTimeSecondsPerUnit: 60,
        queueMoveTimeMinutes: 10,
        instructions: 'Cut material',
        laborHourlyRate: 20,
        machineHourlyRate: 12,
      },
    ],
  };

  const order = buildProductionOrderDraft({
    product,
    bom,
    routing,
    quantity: 10,
    dueDate: '2026-10-30',
    orderNumber: 'MO-2026-00099',
    plantId: 'PLANT-01',
    plantName: 'Plant 01',
    releasePackage: undefined,
  });

  assert.equal(order.status, 'PLANNED');
  assert.equal(order.targetQuantity, 10);
  assert.equal(order.materials.length, 1);
  assert.equal(order.operations.length, 1);
  assert.equal(order.materials[0].requiredQty, 20);
  assert.equal(order.operations[0].sequence, 1);
});

test('production release is allowed for planned orders without shortages', () => {
  const result = evaluateProductionRelease(baseOrder, 'Dewi Lestari', 'Supervisor');

  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.status, 'RELEASED');
  assert.equal(result.auditLog?.action, 'RELEASE_PRODUCTION_ORDER');
});

test('production release is blocked when a shortage is present without override', () => {
  const shortageOrder: ProductionOrder = {
    ...baseOrder,
    materials: [
      {
        productId: 'p-1',
        sku: 'MAT-001',
        name: 'Material A',
        requiredQty: 10,
        allocatedQty: 0,
        consumedQty: 0,
        availableStock: 0,
        uom: 'PCS',
        unitCost: 12,
        status: 'SHORTAGE',
      },
    ],
  };

  const result = evaluateProductionRelease(shortageOrder, 'Dewi Lestari', 'Supervisor');

  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /shortage/i);
});

test('production release is allowed with override when shortage is present', () => {
  const shortageOrder: ProductionOrder = {
    ...baseOrder,
    materials: [
      {
        productId: 'p-1',
        sku: 'MAT-001',
        name: 'Material A',
        requiredQty: 10,
        allocatedQty: 0,
        consumedQty: 0,
        availableStock: 0,
        uom: 'PCS',
        unitCost: 12,
        status: 'SHORTAGE',
      },
    ],
  };

  const result = evaluateProductionRelease(shortageOrder, 'Dewi Lestari', 'Supervisor', 'Approved by supervisor for urgent delivery');

  assert.equal(result.allowed, true);
  assert.equal(result.auditLog?.action, 'RELEASE_WITH_OVERRIDE');
});
