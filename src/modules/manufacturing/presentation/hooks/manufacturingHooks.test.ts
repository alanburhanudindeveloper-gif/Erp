import test from 'node:test';
import assert from 'node:assert/strict';
import { erpApplication } from '../../../../app/composition/dependencies';

test('Manufacturing CQRS presentation integration: listWorkOrders queries with filters and pagination', () => {
  const result = erpApplication.manufacturing.listWorkOrders.execute({ page: 1, limit: 10 });
  assert.ok(Array.isArray(result.items));
  assert.equal(typeof result.total, 'number');
  assert.equal(result.page, 1);
});
