import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateQualityInspection, resolveNcr } from './qualityService';
import type { NonConformanceReport } from '../../types';

test('evaluateQualityInspection approves lot within tolerance and 0 defects', () => {
  const result = evaluateQualityInspection({
    sourceType: 'PRODUCTION_ORDER',
    sourceRef: 'MO-2026-00124',
    productId: 'prod-fg-1',
    sku: 'FG-WIDGET-001',
    productName: 'Standard Precision Widget',
    lotNumber: 'LOT-20260320-01',
    operationName: 'Final Assembly Inspection',
    sampleSize: 50,
    defectsCount: 0,
    maxAllowedDefects: 1,
    characteristic: 'Outer Diameter',
    specification: '50.00 +/- 0.05 mm',
    measuredValue: 50.02,
    lowerTolerance: 49.95,
    upperTolerance: 50.05,
    inspector: 'Budi Santoso',
  });

  assert.equal(result.inspection.result, 'PASS');
  assert.equal(result.disposition, 'UNRESTRICTED');
  assert.equal(result.ncrRequired, false);
  assert.equal(result.stockMovements.length, 0); // No quarantine transfer needed
  assert.equal(result.auditLog.decision, 'APPROVED');
});

test('evaluateQualityInspection routes failing lot to HOLD / Quarantine and drafts NCR', () => {
  const result = evaluateQualityInspection({
    sourceType: 'RECEIVING',
    sourceRef: 'GRN-2026-0089',
    productId: 'prod-rm-1',
    sku: 'RM-CHIP-MCU',
    productName: '32-Bit Microcontroller IC',
    lotNumber: 'LOT-MCU-991',
    operationName: 'Incoming IQC',
    sampleSize: 100,
    defectsCount: 5, // Exceeds max allowed of 1!
    maxAllowedDefects: 1,
    characteristic: 'Pin Coplanarity',
    specification: 'Coplanarity < 0.08 mm',
    inspector: 'Budi Santoso',
  });

  assert.equal(result.inspection.result, 'FAIL');
  assert.equal(result.disposition, 'HOLD');
  assert.equal(result.ncrRequired, true);
  assert.ok(result.ncrDraft);
  assert.equal(result.ncrDraft?.status, 'OPEN');

  // Must post stock movement to HOLD bucket
  assert.equal(result.stockMovements.length, 1);
  assert.equal(result.stockMovements[0].stockBucket, 'HOLD');
  assert.equal(result.stockMovements[0].toLocation, 'QUARANTINE-AREA');
  assert.equal(result.auditLog.decision, 'REJECTED');
});

test('resolveNcr updates NCR with mandatory root cause and creates release/scrap movement', () => {
  const openNcr: NonConformanceReport = {
    id: 'ncr-101',
    ncrNo: 'NCR-2026-0044',
    orderNumber: 'MO-2026-00124',
    lotNumber: 'LOT-FAIL-01',
    productSku: 'FG-WIDGET-001',
    defectDescription: 'Solder bridge on pin 4 and 5',
    quantityAffected: 25,
    disposition: 'SCRAP',
    status: 'OPEN',
    createdAt: '2026-10-26 10:00',
  };

  const resolution = resolveNcr({
    ncr: openNcr,
    disposition: 'SCRAP',
    rootCause: 'Improper stencil tension and paste deposition excess',
    resolver: 'Handoko (QA Manager)',
  });

  assert.equal(resolution.resolvedNcr.status, 'RESOLVED');
  assert.equal(resolution.resolvedNcr.disposition, 'SCRAP');
  assert.equal(resolution.stockMovements.length, 1);
  assert.equal(resolution.stockMovements[0].stockBucket, 'REJECTED');
  assert.equal(resolution.stockMovements[0].toLocation, 'SCRAP-YARD');
});

test('resolveNcr fails when root cause is omitted or too short', () => {
  const openNcr: NonConformanceReport = {
    id: 'ncr-102',
    ncrNo: 'NCR-2026-0045',
    orderNumber: 'MO-2026-00125',
    lotNumber: 'LOT-FAIL-02',
    productSku: 'FG-WIDGET-001',
    defectDescription: 'Minor scratch',
    quantityAffected: 5,
    disposition: 'USE_AS_IS',
    status: 'OPEN',
    createdAt: '2026-10-26 10:00',
  };

  assert.throws(
    () =>
      resolveNcr({
        ncr: openNcr,
        disposition: 'USE_AS_IS',
        rootCause: 'bad', // less than 5 chars
        resolver: 'Handoko',
      }),
    /Mandatory root cause/
  );
});
