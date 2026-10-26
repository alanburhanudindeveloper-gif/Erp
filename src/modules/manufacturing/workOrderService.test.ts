import test from 'node:test';
import assert from 'node:assert/strict';
import { planWorkOrder, cancelWorkOrder } from './workOrderService';
import type { BillOfMaterials, ProductionOrder, Routing } from '../../types';

const mockDraftOrder: ProductionOrder = {
  id: 'mo-draft-1',
  orderNumber: 'MO-2026-90001',
  productId: 'prod-fg-1',
  productSku: 'FG-WIDGET-001',
  productName: 'Standard Precision Widget',
  targetQuantity: 100,
  goodQuantity: 0,
  scrapQuantity: 0,
  bomId: '',
  bomCode: '',
  bomRevision: '',
  routingId: '',
  routingCode: '',
  routingRevision: '',
  plantId: 'plant-btm',
  plantName: 'Batam Assembly Plant',
  plannedStartDate: '2026-11-01',
  dueDate: '2026-11-05',
  demandLink: 'DEM-001',
  priority: 'NORMAL',
  status: 'DRAFT',
  materialAvailabilityPct: 100,
  operations: [],
  materials: [],
  outputLogs: [],
  totalCostPlanned: 0,
  totalCostActual: 0,
  createdAt: '2026-10-26 08:00',
};

const mockBom: BillOfMaterials = {
  id: 'bom-01',
  code: 'BOM-WIDGET-01',
  revision: 'REV-A',
  productId: 'prod-fg-1',
  productSku: 'FG-WIDGET-001',
  productName: 'Standard Precision Widget',
  baseQuantity: 1,
  effectiveFrom: '2026-01-01',
  effectiveTo: '2099-12-31',
  bomType: 'STANDARD',
  status: 'ACTIVE',
  components: [
    {
      id: 'comp-1',
      componentProductId: 'prod-rm-1',
      componentSku: 'RM-STEEL',
      componentName: 'Cold Rolled Steel',
      quantityPerUnit: 2,
      uom: 'KG',
      scrapPercentage: 5,
      unitCost: 25,
    },
  ],
};

const mockRouting: Routing = {
  id: 'rtg-01',
  code: 'RTG-WIDGET-01',
  revision: 'REV-A',
  productId: 'prod-fg-1',
  productSku: 'FG-WIDGET-001',
  productName: 'Standard Precision Widget',
  status: 'ACTIVE',
  operations: [
    {
      id: 'rtg-op-1',
      sequence: 10,
      operationCode: 'OP-STAMP',
      name: 'Precision Stamping',
      workCenterId: 'wc-1',
      workCenterCode: 'WC-STAMP-01',
      workCenterName: 'Press Stamping 1',
      setupTimeMinutes: 30,
      runTimeSecondsPerUnit: 15,
      queueMoveTimeMinutes: 10,
      instructions: 'Inspect die alignment',
      laborHourlyRate: 50000,
      machineHourlyRate: 120000,
    },
  ],
};

test('planWorkOrder transitions DRAFT order to PLANNED and binds operations & materials', () => {
  const result = planWorkOrder(mockDraftOrder, mockBom, mockRouting, 'Budi Santoso', 'PPIC_PLANNER');

  assert.equal(result.allowed, true);
  assert.ok(result.updatedOrder);
  assert.equal(result.updatedOrder?.status, 'PLANNED');
  assert.equal(result.updatedOrder?.bomCode, 'BOM-WIDGET-01');
  assert.equal(result.updatedOrder?.operations.length, 1);
  assert.equal(result.updatedOrder?.operations[0].operationCode, 'OP-STAMP');
  assert.equal(result.updatedOrder?.materials.length, 1);
  // 100 * 2 * 1.05 = 210 KG
  assert.equal(result.updatedOrder?.materials[0].requiredQty, 210);
  assert.equal(result.auditLog?.newStatus, 'PLANNED');
});

test('cancelWorkOrder cancels order with mandatory reason', () => {
  const plannedOrder: ProductionOrder = {
    ...mockDraftOrder,
    status: 'PLANNED',
  };

  const result = cancelWorkOrder(plannedOrder, 'Budi Santoso', 'PPIC_PLANNER', 'Customer cancelled sales order SO-991');
  assert.equal(result.allowed, true);
  assert.equal(result.updatedOrder?.status, 'CANCELLED');
  assert.equal(result.auditLog?.newStatus, 'CANCELLED');

  // Short reason fails
  const failed = cancelWorkOrder(plannedOrder, 'Budi', 'PPIC_PLANNER', 'err');
  assert.equal(failed.allowed, false);
});
