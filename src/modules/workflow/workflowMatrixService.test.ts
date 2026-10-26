import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateApprovalMatrix,
  createApprovalTransaction,
  processApprovalDecision,
  filterUserTasks,
} from './workflowMatrixService';
import { INITIAL_APPROVAL_MATRIX_RULES } from '../../lib/mockData';

test('evaluateApprovalMatrix selects Batam 3-tier rule when quantity exceeds 5000', () => {
  const rule = evaluateApprovalMatrix(
    'PRODUCTION_PLAN',
    'PLANT-01',
    5000,
    undefined,
    INITIAL_APPROVAL_MATRIX_RULES
  );

  assert.ok(rule);
  assert.equal(rule.id, 'rule-prod-plan-batam');
  assert.equal(rule.levels.length, 3);
  assert.equal(rule.levels[0].roleRequired, 'PPIC_MANAGER');
  assert.equal(rule.levels[1].roleRequired, 'PRODUCTION_MANAGER');
  assert.equal(rule.levels[2].roleRequired, 'PLANT_DIRECTOR');
});

test('createApprovalTransaction constructs pending transaction with calculated SLA due dates', () => {
  const tx = createApprovalTransaction({
    type: 'PRODUCTION_PLAN',
    referenceId: 'PP-2026-TEST-01',
    referenceTitle: 'Weekly Production Plan IoT Sensor',
    plantId: 'PLANT-01',
    plantName: 'Batam Assembly & Electronics Plant',
    requesterId: 'emp-101',
    requesterName: 'Budi Santoso',
    requesterPosition: 'Senior PPIC Planner',
    totalQuantity: 6000,
  });

  assert.equal(tx.status, 'PENDING');
  assert.equal(tx.currentLevel, 1);
  assert.equal(tx.totalLevels, 3);
  assert.equal(tx.levels[0].status, 'PENDING');
  assert.ok(tx.levels[0].slaDueDate);
});

test('processApprovalDecision blocks requester self-approval via Segregation of Duties', () => {
  const tx = createApprovalTransaction({
    type: 'PRODUCTION_PLAN',
    referenceId: 'PP-2026-TEST-02',
    referenceTitle: 'Plan Test',
    plantId: 'PLANT-01',
    plantName: 'Batam Plant',
    requesterId: 'emp-101',
    requesterName: 'Budi Santoso',
    requesterPosition: 'Senior PPIC Planner',
    totalQuantity: 5000,
  });

  const result = processApprovalDecision({
    request: tx,
    currentUserId: 'emp-101',
    currentUserName: 'Budi Santoso',
    currentUserRoles: ['PPIC_MANAGER', 'PLANNER'],
    decision: 'APPROVED',
  });

  assert.equal(result.success, false);
  assert.match(result.error || '', /Segregation of Duties Violation/);
});

test('processApprovalDecision advances multi-level workflow sequentially through all tiers', () => {
  const tx = createApprovalTransaction({
    type: 'PRODUCTION_PLAN',
    referenceId: 'PP-2026-TEST-03',
    referenceTitle: 'Plan Sequential Test',
    plantId: 'PLANT-01',
    plantName: 'Batam Plant',
    requesterId: 'emp-101',
    requesterName: 'Budi Santoso',
    requesterPosition: 'Senior PPIC Planner',
    totalQuantity: 5000,
  });

  // Level 1: PPIC Manager approves
  const res1 = processApprovalDecision({
    request: tx,
    currentUserId: 'emp-103',
    currentUserName: 'Hendra Wijaya',
    currentUserRoles: ['PPIC_MANAGER'],
    decision: 'APPROVED',
    reason: 'Capacity and routing clearance verified.',
  });

  assert.equal(res1.success, true);
  assert.equal(res1.updatedRequest.status, 'PENDING');
  assert.equal(res1.updatedRequest.currentLevel, 2);
  assert.equal(res1.updatedRequest.levels[0].status, 'APPROVED');

  // Level 2: Production Manager approves
  const res2 = processApprovalDecision({
    request: res1.updatedRequest,
    currentUserId: 'emp-104',
    currentUserName: 'Bambang Sutrisno',
    currentUserRoles: ['PRODUCTION_MANAGER'],
    decision: 'APPROVED',
    reason: 'Manpower schedule confirmed.',
  });

  assert.equal(res2.success, true);
  assert.equal(res2.updatedRequest.status, 'PENDING');
  assert.equal(res2.updatedRequest.currentLevel, 3);
  assert.equal(res2.updatedRequest.levels[1].status, 'APPROVED');

  // Level 3: Plant Operations Director approves (Final)
  const res3 = processApprovalDecision({
    request: res2.updatedRequest,
    currentUserId: 'emp-105',
    currentUserName: 'Ir. Hartono Hadipuro',
    currentUserRoles: ['PLANT_DIRECTOR'],
    decision: 'APPROVED',
    reason: 'Released for shop floor dispatch.',
  });

  assert.equal(res3.success, true);
  assert.equal(res3.updatedRequest.status, 'APPROVED');
  assert.equal(res3.updatedRequest.levels[2].status, 'APPROVED');
});

test('processApprovalDecision rejects transaction and enforces mandatory reason', () => {
  const tx = createApprovalTransaction({
    type: 'PRODUCTION_PLAN',
    referenceId: 'PP-2026-TEST-04',
    referenceTitle: 'Plan Rejection Test',
    plantId: 'PLANT-01',
    plantName: 'Batam Plant',
    requesterId: 'emp-101',
    requesterName: 'Budi Santoso',
    requesterPosition: 'Senior PPIC Planner',
    totalQuantity: 5000,
  });

  // Attempt rejection without reason
  const noReasonRes = processApprovalDecision({
    request: tx,
    currentUserId: 'emp-103',
    currentUserName: 'Hendra Wijaya',
    currentUserRoles: ['PPIC_MANAGER'],
    decision: 'REJECTED',
    reason: '',
  });

  assert.equal(noReasonRes.success, false);
  assert.match(noReasonRes.error || '', /mandatory rejection reason/);

  // Rejection with reason
  const validRejectRes = processApprovalDecision({
    request: tx,
    currentUserId: 'emp-103',
    currentUserName: 'Hendra Wijaya',
    currentUserRoles: ['PPIC_MANAGER'],
    decision: 'REJECTED',
    reason: 'Machine M01 undergoing scheduled calibration overhaul.',
  });

  assert.equal(validRejectRes.success, true);
  assert.equal(validRejectRes.updatedRequest.status, 'REJECTED');
  assert.equal(validRejectRes.updatedRequest.levels[0].status, 'REJECTED');
});

test('filterUserTasks routes pending approvals only to authorized roles without self-approval', () => {
  const tx = createApprovalTransaction({
    type: 'PRODUCTION_PLAN',
    referenceId: 'PP-2026-TEST-05',
    referenceTitle: 'Filter Task Test',
    plantId: 'PLANT-01',
    plantName: 'Batam Plant',
    requesterId: 'emp-101',
    requesterName: 'Budi Santoso',
    requesterPosition: 'Senior PPIC Planner',
    totalQuantity: 5000,
  });

  // For requester (Budi)
  const budiTasks = filterUserTasks([tx], {
    id: 'emp-101',
    name: 'Budi Santoso',
    roles: ['PPIC_PLANNER'],
  });
  assert.equal(budiTasks.myPendingApprovals.length, 0);
  assert.equal(budiTasks.mySubmittedRequests.length, 1);

  // For PPIC Manager (Hendra)
  const hendraTasks = filterUserTasks([tx], {
    id: 'emp-103',
    name: 'Hendra Wijaya',
    roles: ['PPIC_MANAGER'],
  });
  assert.equal(hendraTasks.myPendingApprovals.length, 1);
  assert.equal(hendraTasks.mySubmittedRequests.length, 0);
});
