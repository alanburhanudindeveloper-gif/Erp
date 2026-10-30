import test from 'node:test';
import assert from 'node:assert/strict';
import { erpApplication } from '../../../../app/composition/dependencies';

test('Planning CQRS presentation integration: getProductionPlan list queries cleanly', () => {
  const result = erpApplication.planning.getProductionPlan.list({ page: 1, limit: 10 });
  assert.ok(Array.isArray(result.items));
  assert.equal(typeof result.total, 'number');
});
