import test from 'node:test';
import assert from 'node:assert/strict';
import { createQualityRepository } from './qualityRepository';
import type { NonConformanceReport, QualityInspection } from '../../types';

const testInspection: QualityInspection = {
  id: 'qc-test-1',
  inspectionNo: 'INS-TEST-001',
  sourceType: 'PRODUCTION_ORDER',
  sourceRef: 'MO-2026-001',
  productId: 'prod-1',
  sku: 'FG-001',
  productName: 'Flow Sensor',
  lotNumber: 'LOT-01',
  operationName: 'Final Assembly',
  sampleSize: 20,
  defectsCount: 0,
  characteristic: 'Voltage',
  specification: '12V +/- 0.2V',
  result: 'PASS',
  disposition: 'UNRESTRICTED',
  inspector: 'Agus',
  timestamp: '2026-10-26 10:00',
  notes: 'All units passed',
};

const testNcr: NonConformanceReport = {
  id: 'ncr-test-1',
  ncrNo: 'NCR-TEST-001',
  orderNumber: 'MO-2026-001',
  lotNumber: 'LOT-01',
  productSku: 'FG-001',
  defectDescription: 'Minor casing scratch',
  quantityAffected: 2,
  disposition: 'REWORK',
  status: 'OPEN',
  createdAt: '2026-10-26 10:30',
};

test('QualityRepository manages inspections and tracks open NCRs', () => {
  const repo = createQualityRepository([testInspection], [testNcr]);

  // Inspections
  assert.equal(repo.listInspections().length, 1);
  assert.equal(repo.findInspectionById('qc-test-1')?.result, 'PASS');

  // Save new inspection
  const newIns: QualityInspection = {
    ...testInspection,
    id: 'qc-test-2',
    inspectionNo: 'INS-TEST-002',
    result: 'FAIL',
    disposition: 'HOLD',
  };
  repo.saveInspection(newIns);
  assert.equal(repo.listInspections().length, 2);

  // NCRs
  assert.equal(repo.listNcrs().length, 1);
  assert.equal(repo.listOpenNcrs().length, 1);

  // Resolve NCR
  repo.saveNcr({ ...testNcr, status: 'RESOLVED', rootCause: 'Handling during transport' });
  assert.equal(repo.listOpenNcrs().length, 0);
  assert.equal(repo.findNcrById('ncr-test-1')?.status, 'RESOLVED');
});
