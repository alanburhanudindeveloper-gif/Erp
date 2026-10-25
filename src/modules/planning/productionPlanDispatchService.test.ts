import test from 'node:test';
import assert from 'node:assert/strict';

import { INITIAL_PRODUCTS, INITIAL_ROUTINGS } from '../../lib/mockData';
import { dispatchProductionPlan } from './productionPlanDispatchService';

test('dispatchProductionPlan creates a work order when plan routing is active', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];
  const routing = INITIAL_ROUTINGS.find((item) => item.productId === product.id && item.status === 'ACTIVE') ?? INITIAL_ROUTINGS[0];

  const result = dispatchProductionPlan({
    plan: {
      id: 'plan-test-1',
      planNumber: 'PLAN-TEST-1',
      periodWeek: 'Week 43 - Oct 2026',
      demandRef: 'DEM-2026-5001',
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      demandQty: 1000,
      plannedQty: 1000,
      unfulfilledQty: 0,
      feasibility: 'FEASIBLE',
      constraintNotes: 'All constraints valid',
      targetStartDate: '2026-10-26',
      targetEndDate: '2026-10-30',
      status: 'FEASIBILITY_REVIEW',
    },
    routing,
    createProductionOrder: ({ productId, quantity, dueDate }) => ({
      id: 'wo-test-1',
      orderNumber: 'WO-TEST-1',
      productId,
      productSku: 'Product A',
      productName: 'Industrial Motor Controller (Product A)',
      targetQuantity: quantity,
      goodQuantity: 0,
      scrapQuantity: 0,
      bomId: 'bom-1',
      bomCode: 'BOM-001',
      bomRevision: 'Rev A',
      routingId: 'rt-1',
      routingCode: 'RT-001',
      routingRevision: 'Rev A',
      plantId: 'PLANT-01',
      plantName: 'Cikarang Main Plant #1',
      plannedStartDate: '2026-10-26',
      dueDate,
      actualStartDate: '2026-10-26',
      actualEndDate: '2026-10-30',
      demandLink: 'DEM-2026-5001',
      priority: 'NORMAL',
      status: 'PLANNED',
      materialAvailabilityPct: 100,
      operations: [],
      materials: [],
      outputLogs: [],
      totalCostPlanned: 100000,
      totalCostActual: 0,
      createdAt: '2026-10-25',
    }),
  });

  assert.equal(result.success, true);
  assert.equal(result.orderId, 'wo-test-1');
});

test('dispatchProductionPlan fails when routing is not active', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];

  const result = dispatchProductionPlan({
    plan: {
      id: 'plan-test-2',
      planNumber: 'PLAN-TEST-2',
      periodWeek: 'Week 43 - Oct 2026',
      demandRef: 'DEM-2026-5001',
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      demandQty: 1000,
      plannedQty: 1000,
      unfulfilledQty: 0,
      feasibility: 'FEASIBLE',
      targetStartDate: '2026-10-26',
      targetEndDate: '2026-10-30',
      status: 'FEASIBILITY_REVIEW',
    },
    routing: { ...INITIAL_ROUTINGS[0], status: 'DRAFT' },
    createProductionOrder: () => null,
  });

  assert.equal(result.success, false);
  assert.ok(result.error?.includes('ACTIVE routing'));
});
