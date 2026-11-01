import test from 'node:test';
import assert from 'node:assert/strict';
import type { PurchaseRequisition, ApprovalTransactionRequest } from '../../../types';
import { createProcurementRepository } from '../procurementRepository';
import { createWorkflowRepository } from '../../workflow/workflowRepository';
import { InMemoryUnitOfWork } from '../../../shared/kernel/unitOfWork';
import { ApprovePurchaseRequisitionHandler } from './commands/approvePurchaseRequisitionCommand';

test('Unit of Work: TEST 1 — Successful multi-repository transaction commits all mutations', () => {
  const initialPr: PurchaseRequisition = {
    id: 'pr-tx-101',
    prNumber: 'PR-2026-TX101',
    requesterId: 'usr-requester-01',
    requesterName: 'Budi Santoso',
    department: 'CNC Machining',
    requiredDate: '2026-11-20',
    reason: 'Tooling replenishment',
    plantId: 'PLANT-01',
    status: 'PENDING_APPROVAL',
    totalAmount: 5000000,
    approvalLevelRequired: 1,
    items: [],
    createdAt: '2026-10-30 08:00',
  };

  const initialApprovalRequest: ApprovalTransactionRequest = {
    id: 'app-pr-tx-101',
    requestNumber: 'APP-PR-2026-TX101',
    approvalType: 'PURCHASE_REQUISITION',
    referenceId: 'pr-tx-101',
    referenceTitle: 'Purchase Requisition PR-2026-TX101 Approval',
    plantId: 'PLANT-01',
    plantName: 'Main Plant',
    requesterId: 'usr-requester-01',
    requesterName: 'Budi Santoso',
    requesterPosition: 'CNC Machining',
    submittedAt: '2026-10-30 08:00',
    totalQuantity: 10,
    status: 'PENDING',
    currentLevel: 1,
    totalLevels: 1,
    levels: [
      {
        level: 1,
        authorityTitle: 'Manager Approval',
        roleRequired: 'Manager',
        positionCode: 'POS-MGR',
        status: 'PENDING',
        slaDueDate: '2026-11-20',
        isEscalated: false,
      },
    ],
  };

  const procurementRepo = createProcurementRepository([initialPr], [], []);
  const workflowRepo = createWorkflowRepository([], [], [initialApprovalRequest]);
  const uow = new InMemoryUnitOfWork([procurementRepo, workflowRepo]);

  const handler = new ApprovePurchaseRequisitionHandler(procurementRepo, workflowRepo, uow);

  // Execute approval by authorized independent manager
  const result = handler.execute({
    prId: 'pr-tx-101',
    actorName: 'Ir. Agus Wijaya',
    actorRole: 'Manager',
  });

  assert.equal(result.isSuccess, true, 'Handler execution must succeed');

  // Verify Procurement repository committed mutations
  const updatedPr = procurementRepo.findPurchaseRequisitionById('pr-tx-101');
  assert.ok(updatedPr);
  assert.equal(updatedPr?.status, 'APPROVED', 'PR status must be committed as APPROVED');
  assert.equal(updatedPr?.approvedBy, 'Ir. Agus Wijaya');

  // Verify Workflow repository committed mutations
  const updatedRequest = workflowRepo.findApprovalRequestById('app-pr-tx-101');
  assert.ok(updatedRequest);
  assert.equal(updatedRequest?.status, 'APPROVED', 'Workflow approval request status must be committed as APPROVED');
  assert.equal(updatedRequest?.levels[0].status, 'APPROVED');
  assert.equal(updatedRequest?.levels[0].approverName, 'Ir. Agus Wijaya');
});

test('Unit of Work: TEST 2 — Rollback after partial mutation leaves ZERO partial state', () => {
  const initialPr: PurchaseRequisition = {
    id: 'pr-tx-202',
    prNumber: 'PR-2026-TX202',
    requesterId: 'usr-requester-02',
    requesterName: 'Siti Aminah',
    department: 'Assembly Line 1',
    requiredDate: '2026-11-25',
    reason: 'Assembly fasteners',
    plantId: 'PLANT-01',
    status: 'PENDING_APPROVAL',
    totalAmount: 3500000,
    approvalLevelRequired: 1,
    items: [],
    createdAt: '2026-10-30 09:00',
  };

  const initialApprovalRequest: ApprovalTransactionRequest = {
    id: 'app-pr-tx-202',
    requestNumber: 'APP-PR-2026-TX202',
    approvalType: 'PURCHASE_REQUISITION',
    referenceId: 'pr-tx-202',
    referenceTitle: 'Purchase Requisition PR-2026-TX202 Approval',
    plantId: 'PLANT-01',
    plantName: 'Main Plant',
    requesterId: 'usr-requester-02',
    requesterName: 'Siti Aminah',
    requesterPosition: 'Assembly Line 1',
    submittedAt: '2026-10-30 09:00',
    totalQuantity: 50,
    status: 'PENDING',
    currentLevel: 1,
    totalLevels: 1,
    levels: [
      {
        level: 1,
        authorityTitle: 'Manager Approval',
        roleRequired: 'Manager',
        positionCode: 'POS-MGR',
        status: 'PENDING',
        slaDueDate: '2026-11-25',
        isEscalated: false,
      },
    ],
  };

  const procurementRepo = createProcurementRepository([initialPr], [], []);
  const realWorkflowRepo = createWorkflowRepository([], [], [initialApprovalRequest]);

  // Create a transactional participant workflow repo that simulates a catastrophic error
  // AFTER the PR has already been mutated and saved to procurementRepo
  let prWasMutatedBeforeFailure = false;

  const failingWorkflowRepo = {
    ...realWorkflowRepo,
    saveApprovalRequest: (req: ApprovalTransactionRequest) => {
      // Assert that procurementRepo has ALREADY been mutated in memory
      const currentPrState = procurementRepo.findPurchaseRequisitionById('pr-tx-202');
      if (currentPrState?.status === 'APPROVED') {
        prWasMutatedBeforeFailure = true;
      }
      // Force failure during transaction execution
      throw new Error('Simulated database write failure on workflow transaction record');
    },
  };

  const uow = new InMemoryUnitOfWork([procurementRepo, realWorkflowRepo]);
  const handler = new ApprovePurchaseRequisitionHandler(procurementRepo, failingWorkflowRepo as any, uow);

  // Execution must fail and throw / reject
  assert.throws(
    () => {
      handler.execute({
        prId: 'pr-tx-202',
        actorName: 'Ir. Agus Wijaya',
        actorRole: 'Manager',
      });
    },
    /Simulated database write failure/i
  );

  assert.equal(prWasMutatedBeforeFailure, true, 'Confirm that PR was mutated in memory prior to the simulated crash');

  // Critical Assertion: The Unit of Work must have ROLLED BACK the PR in procurementRepo!
  const rolledBackPr = procurementRepo.findPurchaseRequisitionById('pr-tx-202');
  assert.ok(rolledBackPr);
  assert.equal(
    rolledBackPr?.status,
    'PENDING_APPROVAL',
    'PR status MUST roll back to PENDING_APPROVAL with zero partial state'
  );
  assert.equal(
    rolledBackPr?.approvedBy,
    undefined,
    'approvedBy MUST be cleared back to original state upon rollback'
  );

  // Workflow request must also remain in original PENDING state
  const rolledBackRequest = realWorkflowRepo.findApprovalRequestById('app-pr-tx-202');
  assert.ok(rolledBackRequest);
  assert.equal(rolledBackRequest?.status, 'PENDING');
  assert.equal(rolledBackRequest?.levels[0].status, 'PENDING');
});

test('Unit of Work: TEST 3 — Transaction isolation prevents cross-command state contamination', () => {
  const prA: PurchaseRequisition = {
    id: 'pr-iso-A',
    prNumber: 'PR-ISO-A',
    requesterId: 'usr-A',
    requesterName: 'Andi',
    department: 'Warehouse',
    requiredDate: '2026-11-15',
    reason: 'Packaging tape',
    plantId: 'PLANT-01',
    status: 'PENDING_APPROVAL',
    totalAmount: 1000000,
    approvalLevelRequired: 1,
    items: [],
    createdAt: '2026-10-30 10:00',
  };

  const prB: PurchaseRequisition = {
    id: 'pr-iso-B',
    prNumber: 'PR-ISO-B',
    requesterId: 'usr-B',
    requesterName: 'Bambang',
    department: 'Moulding',
    requiredDate: '2026-11-18',
    reason: 'Resin pellets',
    plantId: 'PLANT-01',
    status: 'PENDING_APPROVAL',
    totalAmount: 4000000,
    approvalLevelRequired: 1,
    items: [],
    createdAt: '2026-10-30 10:30',
  };

  const procurementRepo = createProcurementRepository([prA, prB], [], []);
  const workflowRepo = createWorkflowRepository([], [], []);
  const uow = new InMemoryUnitOfWork([procurementRepo, workflowRepo]);

  // 1. Transaction 1 fails inside transactional closure
  let tx1RolledBack = false;
  try {
    uow.executeSync(() => {
      // Mutate prA
      const pr = procurementRepo.findPurchaseRequisitionById('pr-iso-A')!;
      procurementRepo.savePurchaseRequisition({ ...pr, status: 'APPROVED', approvedBy: 'Attacker' });
      // Deliberate error
      throw new Error('Transaction 1 aborted mid-way');
    });
  } catch (err) {
    tx1RolledBack = true;
  }
  assert.equal(tx1RolledBack, true);

  // Confirm prA was rolled back and is NOT contaminated
  const postTx1PrA = procurementRepo.findPurchaseRequisitionById('pr-iso-A');
  assert.equal(postTx1PrA?.status, 'PENDING_APPROVAL');
  assert.equal(postTx1PrA?.approvedBy, undefined);

  // 2. Transaction 2 on independent PR executes cleanly
  const handler = new ApprovePurchaseRequisitionHandler(procurementRepo, workflowRepo, uow);
  const resultB = handler.execute({
    prId: 'pr-iso-B',
    actorName: 'Ir. Agus Wijaya',
    actorRole: 'Manager',
  });
  assert.equal(resultB.isSuccess, true);

  // Verify prB committed cleanly
  const finalPrB = procurementRepo.findPurchaseRequisitionById('pr-iso-B');
  assert.equal(finalPrB?.status, 'APPROVED');
  assert.equal(finalPrB?.approvedBy, 'Ir. Agus Wijaya');

  // Verify prA remains uncorrupted
  const finalPrA = procurementRepo.findPurchaseRequisitionById('pr-iso-A');
  assert.equal(finalPrA?.status, 'PENDING_APPROVAL');
});
