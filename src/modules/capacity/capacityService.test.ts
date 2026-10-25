import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateCapacityLoad } from './capacityService';

test('capacity load marks standard overload scenario correctly', () => {
  const result = evaluateCapacityLoad(480, 520);

  assert.equal(result.utilizationPct, 108.3);
  assert.equal(result.state, 'OVERLOADED');
  assert.equal(result.isOverloaded, true);
});

test('capacity load is balanced for normal load', () => {
  const result = evaluateCapacityLoad(480, 400);

  assert.equal(result.utilizationPct, 83.3);
  assert.equal(result.state, 'UNDER_CAPACITY');
  assert.equal(result.isOverloaded, false);
});
