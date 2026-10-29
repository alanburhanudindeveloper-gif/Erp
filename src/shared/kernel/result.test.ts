import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ok, fail, isOk, isFail, unwrap } from './result';
import { ValidationError, NotFoundError } from './errors';
import { paginateItems } from './pagination';

describe('Shared Kernel Primitives', () => {
  it('Result ok and fail constructs proper states', () => {
    const successResult = ok({ id: '123' });
    assert.strictEqual(successResult.isSuccess, true);
    assert.strictEqual(successResult.isFailure, false);
    assert.strictEqual(isOk(successResult), true);
    assert.deepStrictEqual(unwrap(successResult), { id: '123' });

    const mapped = successResult.map(v => v.id.toUpperCase());
    assert.strictEqual(unwrap(mapped), '123');

    const err = new ValidationError('Bad request');
    const failureResult = fail<{ id: string }>(err);
    assert.strictEqual(failureResult.isSuccess, false);
    assert.strictEqual(failureResult.isFailure, true);
    assert.strictEqual(isFail(failureResult), true);
    assert.strictEqual(failureResult.getOrElse({ id: 'fallback' }).id, 'fallback');

    assert.throws(() => unwrap(failureResult), (error: unknown) => {
      return error instanceof ValidationError && error.message === 'Bad request';
    });
  });

  it('NotFoundError builds formatted message and details', () => {
    const err = new NotFoundError('WorkOrder', 'WO-999');
    assert.strictEqual(err.code, 'NOT_FOUND_ERROR');
    assert.strictEqual(err.message, 'WorkOrder with identifier "WO-999" was not found.');
    assert.deepStrictEqual(err.details, { entityName: 'WorkOrder', entityId: 'WO-999' });
  });

  it('paginateItems slices items accurately with meta', () => {
    const items = Array.from({ length: 45 }, (_, i) => ({ id: `item-${i + 1}` }));
    const result = paginateItems(items, { page: 2, limit: 10 });

    assert.strictEqual(result.page, 2);
    assert.strictEqual(result.limit, 10);
    assert.strictEqual(result.total, 45);
    assert.strictEqual(result.totalPages, 5);
    assert.strictEqual(result.items.length, 10);
    assert.strictEqual(result.items[0].id, 'item-11');
    assert.strictEqual(result.items[9].id, 'item-20');
  });
});
