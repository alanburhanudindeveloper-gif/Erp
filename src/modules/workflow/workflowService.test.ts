import test from 'node:test';
import assert from 'node:assert/strict';

import type { WorkflowDefinition } from '../../types';
import {
  createWorkflowInstance,
  evaluateTransition,
  getActiveWorkflowState,
  evaluateApprovalGate,
} from './workflowService';

const workflow: WorkflowDefinition = {
  id: 'wf-mo-default',
  code: 'MO-APPROVAL',
  entityType: 'PRODUCTION_ORDER',
  name: 'Production Order Approval',
  description: 'Approve or reject released production orders.',
  active: true,
  states: [
    { id: 'draft', code: 'DRAFT', label: 'Draft', isInitial: true, isTerminal: false, color: '#e2e8f0' },
    { id: 'submitted', code: 'SUBMITTED', label: 'Submitted', isInitial: false, isTerminal: false, color: '#facc15' },
    { id: 'approved', code: 'APPROVED', label: 'Approved', isInitial: false, isTerminal: true, color: '#22c55e' },
    { id: 'rejected', code: 'REJECTED', label: 'Rejected', isInitial: false, isTerminal: true, color: '#ef4444' },
  ],
  transitions: [
    { id: 'submit', fromState: 'draft', toState: 'submitted', actionLabel: 'Submit', requiredRole: 'Planner', requiresReason: false },
    { id: 'approve', fromState: 'submitted', toState: 'approved', actionLabel: 'Approve', requiredRole: 'Supervisor', requiresReason: true },
    { id: 'reject', fromState: 'submitted', toState: 'rejected', actionLabel: 'Reject', requiredRole: 'Supervisor', requiresReason: true },
  ],
};

test('workflow instance starts at the initial state', () => {
  const instance = createWorkflowInstance(workflow);

  assert.equal(instance.currentState, 'draft');
  assert.equal(getActiveWorkflowState(workflow), 'draft');
  assert.deepEqual(instance.availableTransitions.map((item: { actionLabel: string }) => item.actionLabel), ['Submit']);
});

test('approval transition requires role and reason', () => {
  const instance = createWorkflowInstance(workflow, 'submitted');

  const approved = evaluateTransition(instance, workflow, 'approve', 'Supervisor', 'Needed for release');
  assert.equal(approved.canTransition, true);

  const blocked = evaluateTransition(instance, workflow, 'approve', 'Planner', undefined);
  assert.equal(blocked.canTransition, false);
  assert.match(blocked.reason || '', /role|reason/i);
});

test('approval gate blocks requester self-approval and requires independent authorization', () => {
  const result = evaluateApprovalGate({
    requesterName: 'Dewi Lestari',
    actorName: 'Dewi Lestari',
    actorRole: 'Manager',
    requiredRole: 'Manager',
    requiresReason: true,
    reason: 'Approved after review',
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /Segregation of Duties|self-approve/i);

  const valid = evaluateApprovalGate({
    requesterName: 'Dewi Lestari',
    actorName: 'Agus Wijaya',
    actorRole: 'Manager',
    requiredRole: 'Manager',
    requiresReason: true,
    reason: 'Approved after review',
  });

  assert.equal(valid.allowed, true);
  assert.equal(valid.requiredRole, 'Manager');
});
