import test from 'node:test';
import assert from 'node:assert/strict';
import { createQualityRepository } from './qualityRepository';
import { createInventoryRepository } from '../inventory/inventoryRepository';
import { InMemoryUnitOfWork } from '../../shared/kernel/unitOfWork';
import { ok, fail } from '../../shared/kernel/result';
import { ValidationError } from '../../shared/kernel/errors';
import type { NonConformanceReport, QualityInspection, StockMovement } from '../../types';

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

test('QualityRepository implements ITransactionalParticipant: snapshot and restore', () => {
  const repo = createQualityRepository([testInspection], [testNcr]);

  // Take snapshot
  const snapshot = repo.createSnapshot();

  // Mutate state
  repo.saveInspection({
    ...testInspection,
    id: 'qc-mutated',
    inspectionNo: 'INS-MUTATED',
  });
  repo.saveNcr({
    ...testNcr,
    id: 'ncr-mutated',
    ncrNo: 'NCR-MUTATED',
  });

  assert.equal(repo.listInspections().length, 2);
  assert.equal(repo.listNcrs().length, 2);

  // Restore snapshot
  repo.restoreSnapshot(snapshot);

  assert.equal(repo.listInspections().length, 1);
  assert.equal(repo.listNcrs().length, 1);
  assert.equal(repo.findInspectionById('qc-mutated'), undefined);
  assert.equal(repo.findNcrById('ncr-mutated'), undefined);
});

test('QualityRepository participates in InMemoryUnitOfWork with rollback on exception', async () => {
  const repo = createQualityRepository([testInspection], [testNcr]);
  const uow = new InMemoryUnitOfWork([repo]);

  await assert.rejects(async () => {
    await uow.execute(() => {
      repo.saveInspection({
        ...testInspection,
        id: 'qc-fail-uow',
        inspectionNo: 'INS-FAIL-UOW',
      });
      throw new Error('Simulated transactional failure');
    });
  }, /Simulated transactional failure/);

  // State should be rolled back
  assert.equal(repo.listInspections().length, 1);
  assert.equal(repo.findInspectionById('qc-fail-uow'), undefined);
});

test('QualityRepository participates in InMemoryUnitOfWork with rollback on Result.fail', async () => {
  const repo = createQualityRepository([testInspection], [testNcr]);
  const uow = new InMemoryUnitOfWork([repo]);

  const outcome = await uow.execute(() => {
    repo.saveNcr({
      ...testNcr,
      id: 'ncr-fail-uow',
      ncrNo: 'NCR-FAIL-UOW',
    });
    return fail(new ValidationError('Test rollback'));
  });

  assert.equal(outcome.isSuccess, false);
  // State should be rolled back
  assert.equal(repo.listNcrs().length, 1);
  assert.equal(repo.findNcrById('ncr-fail-uow'), undefined);
});

test('Multi-repository atomic rollback: QualityRepository and InventoryRepository', async () => {
  const qualityRepo = createQualityRepository([testInspection], [testNcr]);
  const initialMovement: StockMovement = {
    id: 'mov-1',
    movementNo: 'MATDOC-001',
    timestamp: '2026-10-26 10:00',
    productId: 'prod-1',
    sku: 'FG-001',
    quantity: 10,
    uom: 'PCS',
    fromLocation: 'HOLD',
    toLocation: 'AVAILABLE',
    lotNumber: 'LOT-01',
    sourceDocument: 'INS-TEST-001',
    movementType: 'TRANSFER',
    stockBucket: 'AVAILABLE',
  };
  const inventoryRepo = createInventoryRepository([initialMovement], []);
  const uow = new InMemoryUnitOfWork([qualityRepo, inventoryRepo]);

  // Execute multi-repo operation that fails midway
  const outcome = await uow.execute(() => {
    // 1. Quality repository mutation
    qualityRepo.saveInspection({
      ...testInspection,
      id: 'qc-multi-fail',
      inspectionNo: 'INS-MULTI-FAIL',
    });

    // 2. Inventory repository mutation
    inventoryRepo.recordMovement({
      ...initialMovement,
      id: 'mov-multi-fail',
      movementNo: 'MATDOC-FAIL',
    });

    // 3. Fail the transaction
    return fail(new ValidationError('Simulated cross-boundary failure'));
  });

  assert.equal(outcome.isSuccess, false);

  // Both repositories must have rolled back completely
  assert.equal(qualityRepo.listInspections().length, 1);
  assert.equal(qualityRepo.findInspectionById('qc-multi-fail'), undefined);

  assert.equal(inventoryRepo.listMovements().length, 1);
  assert.equal(inventoryRepo.listMovements().find((m) => m.id === 'mov-multi-fail'), undefined);
});
