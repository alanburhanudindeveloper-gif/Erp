import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createWorkflowRepository } from './workflowRepository';
import type { WorkflowDefinition, ApprovalTransactionRequest } from '../../types';

describe('Workflow Repository Operations', () => {
  it('manages workflows and approval requests through authoritative persistence', () => {
    const repo = createWorkflowRepository([], [], []);

    const wf: WorkflowDefinition = {
      id: 'wf-test-1',
      code: 'WF-TEST',
      entityType: 'PRODUCTION_ORDER',
      name: 'Test Workflow',
      description: 'Test workflow description',
      active: true,
      states: [],
      transitions: [],
    };

    repo.saveWorkflow(wf);
    assert.strictEqual(repo.listWorkflows().length, 1);
    assert.strictEqual(repo.findWorkflowById('wf-test-1')?.code, 'WF-TEST');

    const appReq: ApprovalTransactionRequest = {
      id: 'app-test-1',
      requestNumber: 'APP-TEST-001',
      approvalType: 'PRODUCTION_PLAN',
      referenceId: 'PP-01',
      referenceTitle: 'Test Plan',
      plantId: 'PLANT-01',
      plantName: 'Plant 1',
      requesterId: 'usr-1',
      requesterName: 'Alice',
      requesterPosition: 'Planner',
      submittedAt: '2026-10-29 10:00',
      status: 'PENDING',
      currentLevel: 1,
      totalLevels: 1,
      levels: [],
    };

    repo.saveApprovalRequest(appReq);
    assert.strictEqual(repo.listApprovalRequests().length, 1);
    assert.strictEqual(repo.findApprovalRequestById('app-test-1')?.requestNumber, 'APP-TEST-001');
  });
});
