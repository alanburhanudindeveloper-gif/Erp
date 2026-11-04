import test from 'node:test';
import assert from 'node:assert/strict';
import * as hooks from './index';

test('Quality presentation hooks exports contract', () => {
  assert.equal(typeof hooks.useOpenNcrs, 'function', 'useOpenNcrs hook must be exported');
  assert.equal(typeof hooks.useEvaluateInspection, 'function', 'useEvaluateInspection hook must be exported');
  assert.equal(typeof hooks.useResolveNcr, 'function', 'useResolveNcr hook must be exported');
  assert.equal(typeof hooks.useInspections, 'function', 'useInspections hook must be exported');
  assert.equal(typeof hooks.useNcrs, 'function', 'useNcrs hook must be exported');
  assert.equal(typeof hooks.useReleaseQcInspection, 'function', 'useReleaseQcInspection hook must be exported');
});
