import test from 'node:test';
import assert from 'node:assert/strict';
import { erpApplication } from '../../../../app/composition/dependencies';

test('Quality CQRS presentation integration: listOpenNcrs executes and paginates', () => {
  const result = erpApplication.quality.listOpenNcrs.execute({ page: 1, limit: 10 });
  assert.ok(Array.isArray(result.items));
  assert.equal(typeof result.total, 'number');
});

test('Quality CQRS presentation integration: evaluateInspection drafts NCR on out-of-tolerance failure', () => {
  const evalResult = erpApplication.quality.evaluateInspection.execute({
    sourceType: 'PRODUCTION_ORDER',
    sourceRef: 'MO-2026-TEST',
    productId: 'prd-001',
    sku: 'FG-001',
    productName: 'Terminal Block',
    lotNumber: 'LOT-FAIL-01',
    operationName: 'Final Inspection',
    sampleSize: 10,
    defectsCount: 4,
    maxAllowedDefects: 0,
    characteristic: 'Outer Diameter',
    specification: '25.0 ± 0.1 mm',
    measuredValue: 25.8,
    lowerTolerance: 24.9,
    upperTolerance: 25.1,
    inspector: 'QA Inspector',
  });

  assert.equal(evalResult.isSuccess, true);
  if (evalResult.isSuccess) {
    assert.equal(evalResult.value.inspection.result, 'FAIL');
    assert.equal(evalResult.value.ncrRequired, true);
    assert.ok(evalResult.value.ncrDraft);
  }
});
