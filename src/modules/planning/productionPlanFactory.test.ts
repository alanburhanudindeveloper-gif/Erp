import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_BOMS,
  INITIAL_PRODUCTS,
  INITIAL_ROUTINGS,
  INITIAL_MACHINES,
  INITIAL_MANPOWER,
} from '../../lib/mockData';
import { buildProductionPlanFromDemand } from './productionPlanFactory';

test('buildProductionPlanFromDemand returns a structured plan with feasible or constrained status', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];

  const plan = buildProductionPlanFromDemand({
    planNumber: 'PLAN-TEST-001',
    productId: product.id,
    productSku: product.sku,
    demandQty: 1000,
    allProducts: INITIAL_PRODUCTS,
    allBoms: INITIAL_BOMS,
    allRoutings: INITIAL_ROUTINGS,
    allMachines: INITIAL_MACHINES,
    allEmployees: INITIAL_MANPOWER,
    periodWeek: 'Week 43 - Oct 2026',
    demandRef: 'DEM-2026-5001',
    targetStartDate: '2026-10-26',
    targetEndDate: '2026-10-30',
    status: 'FEASIBILITY_REVIEW',
  });

  assert.equal(plan.productSku, product.sku);
  assert.ok(plan.planNumber.length > 0);
  assert.equal(plan.feasibility === 'FEASIBLE' || plan.feasibility === 'MATERIAL_CONSTRAINED', true);
  assert.ok(plan.constraintNotes !== undefined);
});
