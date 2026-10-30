import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainEvent } from './events';
import { InMemoryUnitOfWork } from './unitOfWork';

test('createDomainEvent constructs an immutable domain event with timestamp and payload', () => {
  const event = createDomainEvent('OrderPlanned', 'mo-101', 'ProductionOrder', {
    orderNumber: 'MO-2026-001',
    targetQuantity: 50,
  });

  assert.equal(event.eventType, 'OrderPlanned');
  assert.equal(event.aggregateId, 'mo-101');
  assert.equal(event.aggregateType, 'ProductionOrder');
  assert.equal(event.payload.orderNumber, 'MO-2026-001');
  assert.ok(event.eventId.startsWith('evt-'));
  assert.ok(event.occurredAt.length > 0);
  assert.ok(Object.isFrozen(event));
});

test('InMemoryUnitOfWork executes work within a transactional closure', async () => {
  const uow = new InMemoryUnitOfWork();
  let state = 0;

  const result = await uow.execute(async () => {
    state += 10;
    return state * 2;
  });

  assert.equal(state, 10);
  assert.equal(result, 20);
});
