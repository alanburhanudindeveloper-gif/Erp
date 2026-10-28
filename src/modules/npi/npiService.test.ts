import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNpiProject,
  updateNpiMilestoneStatus,
  processTrialRunRecord,
  processPilotRunRecord,
  buildProductReleasePackage,
} from './npiService';
import type { NpiProject, Product, NpiTrialRun, NpiPilotRun } from '../../types';

test('buildNpiProject generates project number and assigns default milestones', () => {
  const project = buildNpiProject({
    projectData: {
      productId: 'prd-gw-101',
      productSku: 'GW-101',
      productName: 'Smart Industrial Gateway',
    },
    existingCount: 4,
    currentUser: 'Hendra Gunawan',
  });

  assert.equal(project.projectNumber, 'NPI-2026-005');
  assert.equal(project.status, 'DEVELOPMENT');
  assert.equal(project.projectOwner, 'Hendra Gunawan');
  assert.equal(project.milestones.length, 4);
  assert.equal(project.milestones[0].status, 'IN_PROGRESS');
});

test('updateNpiMilestoneStatus sets status and completedDate when completed', () => {
  const baseProject = buildNpiProject({
    projectData: {},
    existingCount: 0,
    currentUser: 'User',
  });

  const updated = updateNpiMilestoneStatus(baseProject, 'ms-new-1', 'COMPLETED');
  const targetMs = updated.milestones.find((m) => m.id === 'ms-new-1');

  assert.equal(targetMs?.status, 'COMPLETED');
  assert.ok(targetMs?.completedDate);
});

test('processTrialRunRecord transitions NPI status to PILOT on PASS', () => {
  const baseProject = buildNpiProject({
    projectData: { status: 'TRIAL' },
    existingCount: 0,
    currentUser: 'User',
  });

  const trialRun = {
    id: 'tr-1',
    npiProjectId: baseProject.id,
    trialNumber: 'TR-01',
    trialDate: '2026-10-28',
    plannedQuantity: 50,
    actualQuantity: 48,
    goodQuantity: 48,
    scrapQuantity: 2,
    trialResult: 'PASS',
    observations: 'Good trial',
    leadEngineer: 'Hendra',
    inspector: 'QA Inspector',
  } as unknown as NpiTrialRun;

  const updated = processTrialRunRecord(baseProject, trialRun);
  assert.equal(updated.status, 'PILOT');
  assert.equal(updated.trialRuns.length, 1);
});

test('processPilotRunRecord transitions NPI status to READY_FOR_RELEASE on PASS', () => {
  const baseProject = buildNpiProject({
    projectData: { status: 'PILOT' },
    existingCount: 0,
    currentUser: 'User',
  });

  const pilotRun = {
    id: 'pr-1',
    npiProjectId: baseProject.id,
    pilotNumber: 'PR-01',
    plannedQuantity: 200,
    actualQuantity: 198,
    yieldPercentage: 99,
    targetCycleTimeSeconds: 45,
    actualCycleTimeSeconds: 44,
    cycleTimeStability: 'STABLE',
    operatorReadiness: 'READY',
    toolingPerformance: 'OPTIMAL',
    bottlenecksIdentified: 'None',
    pilotResult: 'PASS',
    remarks: 'Meets CPK criteria',
    evaluator: 'QA Lead',
  } as unknown as NpiPilotRun;

  const updated = processPilotRunRecord(baseProject, pilotRun);
  assert.equal(updated.status, 'READY_FOR_RELEASE');
  assert.equal(updated.pilotRuns.length, 1);
});

test('buildProductReleasePackage sets product lifecycle to RELEASED and logs audit', () => {
  const dummyProducts = [
    {
      id: 'prd-abc-100',
      sku: 'ABC-100',
      name: 'Smart Controller',
      type: 'FINISHED_GOOD',
      baseUom: 'PCS',
      standardCost: 150000,
      safetyStock: 50,
      currentStock: 100,
      allocatedStock: 0,
      onOrderStock: 0,
      leadTimeDays: 7,
      lifecycleStatus: 'PILOT',
      currentRevision: 'Rev 01',
      drawingRevision: 'Rev 01',
      specificationRevision: 'Rev 01',
      active: true,
      costCenter: 'CC-01',
      inventoryValuationMethod: 'FIFO',
    },
  ] as unknown as Product[];

  const result = buildProductReleasePackage(
    {
      productId: 'prd-abc-100',
      productSku: 'ABC-100',
      releasedRevision: 'Rev A',
    },
    2,
    dummyProducts,
    'GM Production',
    'Plant Director'
  );

  assert.equal(result.releasePackage.packageNumber, 'REL-PKG-2026-002');
  assert.equal(result.releasePackage.releasedRevision, 'Rev A');
  assert.equal(result.updatedProducts[0].lifecycleStatus, 'RELEASED');
  assert.equal(result.updatedProducts[0].currentRevision, 'Rev A');
  assert.equal(result.auditLog.action, 'RELEASE_PRODUCT');
  assert.equal(result.auditLog.newStatus, 'RELEASED');
});
