import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_DEMANDS,
  INITIAL_PRODUCTS,
  INITIAL_ROUTINGS,
  INITIAL_MACHINES,
  INITIAL_MANPOWER,
  INITIAL_CHANGEOVER_RULES,
} from '../../lib/mockData';
import { buildFiniteScheduleFromDemand } from './finiteScheduleFactory.ts';

test('buildFiniteScheduleFromDemand returns a schedule for the active demand', () => {
  const demand = INITIAL_DEMANDS[0];
  const product = INITIAL_PRODUCTS.find((item) => item.sku === demand.productSku) ?? INITIAL_PRODUCTS[0];
  const routing = INITIAL_ROUTINGS.find((item) => item.productId === product.id || item.productSku === product.sku) ?? INITIAL_ROUTINGS[0];

  const slots = buildFiniteScheduleFromDemand({
    demand,
    product,
    routing,
    machines: INITIAL_MACHINES,
    employees: INITIAL_MANPOWER,
    changeoverRules: INITIAL_CHANGEOVER_RULES,
    startDate: '2026-10-26',
    shiftStartTime: '07:00',
    shiftHours: 8,
  });

  assert.ok(slots.length > 0);
  assert.equal(slots[0].productSku, product.sku);
  assert.ok(['SCHEDULED', 'CONFLICT', 'BLOCKED'].includes(slots[0].status));
});
