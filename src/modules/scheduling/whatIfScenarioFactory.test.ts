import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_PRODUCTS,
  INITIAL_ROUTINGS,
  INITIAL_MACHINES,
  INITIAL_WHAT_IF_SCENARIOS,
} from '../../lib/mockData';
import { buildWhatIfScenarios } from './whatIfScenarioFactory';

test('buildWhatIfScenarios returns scenario comparisons for a demand', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];
  const routing = INITIAL_ROUTINGS.find((item) => item.productId === product.id || item.productSku === product.sku) ?? INITIAL_ROUTINGS[0];

  const scenarios = buildWhatIfScenarios({
    targetProductSku: product.sku,
    demandQty: 5000,
    dueDate: '2026-10-30',
    baselineMachines: INITIAL_MACHINES,
    routing,
    scenariosToRun: [
      { name: 'Scenario A', description: 'Baseline', machineQuantityOverride: 2, shiftHours: 8, extraShift: false },
      { name: 'Scenario B', description: 'Extra machine', machineQuantityOverride: 3, shiftHours: 8, extraShift: false },
    ],
  });

  assert.ok(scenarios.length >= 2);
  assert.ok(scenarios[0].targetProductSku === product.sku);
  assert.ok(scenarios[0].comparisonVsBaselineDays !== undefined);
});
