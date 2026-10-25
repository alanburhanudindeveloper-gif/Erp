import test from 'node:test';
import assert from 'node:assert/strict';

import { assertErpSourceOfTruth, classifyStorageIntent, isUiOnlyStorageKey } from './persistencePolicy';
import {
  classifyStorageIntent as classifyStorageIntentFromIndex,
  createErpCollectionRepository,
  createErpServerRepository,
} from './index';

test('ui-only storage keys are rejected as ERP source of truth', () => {
  assert.equal(isUiOnlyStorageKey('erp_ui_preferences_v1'), true);
  assert.equal(isUiOnlyStorageKey('erp_legacy_demo_state_v1'), true);

  assert.throws(() => {
    assertErpSourceOfTruth('UI_TEMPORARY', 'erp_ui_preferences_v1');
  }, /UI temporary/i);
});

test('authoritative ERP storage is allowed for ERP items', () => {
  assert.doesNotThrow(() => {
    assertErpSourceOfTruth('ERP_AUTHORITATIVE', 'inventory_transactions');
  });

  assert.doesNotThrow(() => {
    assertErpSourceOfTruth('ERP_AUTHORITATIVE', 'production_plans');
  });

  assert.doesNotThrow(() => {
    assertErpSourceOfTruth('ERP_AUTHORITATIVE', 'machines');
  });

  assert.doesNotThrow(() => {
    assertErpSourceOfTruth('ERP_AUTHORITATIVE', 'what_if_scenarios');
  });
});

test('storage classification is exposed through the infrastructure boundary', () => {
  assert.equal(classifyStorageIntent('production_plans'), 'ERP_AUTHORITATIVE');
  assert.equal(classifyStorageIntent('erp_ui_preferences_v1'), 'UI_TEMPORARY');
  assert.equal(classifyStorageIntentFromIndex('production_plans'), 'ERP_AUTHORITATIVE');
  assert.equal(classifyStorageIntentFromIndex('erp_ui_preferences_v1'), 'UI_TEMPORARY');
});

test('erp collection repositories enforce authoritative storage boundaries', () => {
  const productsRepository = createErpCollectionRepository('products', [{ id: 'p-1', sku: 'MAT-001', name: 'Material A' } as const]);

  assert.equal(productsRepository.list().length, 1);
  assert.equal(productsRepository.get('p-1')?.sku, 'MAT-001');

  assert.throws(() => {
    createErpCollectionRepository('erp_ui_preferences_v1');
  }, /UI temporary/i);
});

test('ERP server repository seeds only authoritative collections', () => {
  const repository = createErpServerRepository();

  assert.ok(repository.list('products').length > 0);
  assert.ok(repository.list('workflows').length > 0);

  assert.throws(() => {
    createErpServerRepository({ erp_ui_preferences_v1: [{ id: 'ui' }] });
  }, /Unrecognized ERP authoritative storage target|UI temporary/i);
});
