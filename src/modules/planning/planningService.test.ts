import test from 'node:test';
import assert from 'node:assert/strict';

import { INITIAL_BOMS, INITIAL_PRODUCTS, INITIAL_ROUTINGS, INITIAL_MACHINES, INITIAL_MANPOWER } from '../../lib/mockData';
import { summarizeProductionPlanning } from './planningService';

test('planning summary identifies feasible production plan for a standard demand', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];
  const summary = summarizeProductionPlanning(
    product.id,
    1000,
    INITIAL_PRODUCTS,
    INITIAL_BOMS,
    INITIAL_ROUTINGS,
    INITIAL_MACHINES,
    INITIAL_MANPOWER
  );

  assert.ok(summary.bomSummary.totalRequiredQty > 0);
  assert.equal(summary.feasibility.overallState === 'FEASIBLE' || summary.feasibility.overallState === 'MATERIAL_CONSTRAINED', true);
  assert.ok(summary.bottlenecks.length > 0);
});
