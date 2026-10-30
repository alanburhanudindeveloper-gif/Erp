import test from 'node:test';
import assert from 'node:assert/strict';
import { createErpRepositories, erpRepositories } from './repositories';
import { createErpApplication, erpApplication } from './dependencies';

test('composition root successfully provisions all 12 bounded context repositories', () => {
  const repos = createErpRepositories();

  assert.ok(repos.workOrder, 'workOrder repository must be initialized');
  assert.ok(repos.inventory, 'inventory repository must be initialized');
  assert.ok(repos.quality, 'quality repository must be initialized');
  assert.ok(repos.procurement, 'procurement repository must be initialized');
  assert.ok(repos.planning, 'planning repository must be initialized');
  assert.ok(repos.scheduling, 'scheduling repository must be initialized');
  assert.ok(repos.engineering, 'engineering repository must be initialized');
  assert.ok(repos.npi, 'npi repository must be initialized');
  assert.ok(repos.maintenance, 'maintenance repository must be initialized');
  assert.ok(repos.costing, 'costing repository must be initialized');
  assert.ok(repos.masterData, 'masterData repository must be initialized');
  assert.ok(repos.workflow, 'workflow repository must be initialized');
});

test('composition root wires all CQRS application handlers without null dependencies', () => {
  const app = createErpApplication(erpRepositories);

  assert.ok(app.manufacturing.planWorkOrder, 'planWorkOrder handler should be wired');
  assert.ok(app.manufacturing.cancelWorkOrder, 'cancelWorkOrder handler should be wired');
  assert.ok(app.procurement.createPurchaseRequisition, 'createPR handler should be wired');
  assert.ok(app.procurement.approvePurchaseRequisition, 'approvePR handler should be wired');
  assert.ok(app.planning.dispatchProductionPlan, 'dispatchPlan handler should be wired');
  assert.ok(app.quality.evaluateInspection, 'evaluateInspection handler should be wired');
  assert.ok(app.quality.resolveNcr, 'resolveNcr handler should be wired');
  assert.ok(app.inventory.transferStock, 'transferStock handler should be wired');
  assert.ok(app.inventory.get5BucketBalance, 'get5BucketBalance handler should be wired');

  // Verify singleton export
  assert.ok(erpApplication.manufacturing.planWorkOrder);
});
