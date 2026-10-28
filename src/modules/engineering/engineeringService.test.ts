import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEngineeringChangeRequest,
  evaluateEcrApproval,
  buildProductReleasePackageFromEcr,
  applyEcrDecisionToOrder,
  buildToolingItem,
  buildEngineeringDrawing,
  buildEngineeringSpecification,
  buildWorkInstruction,
  buildQcPlan,
} from './engineeringService';
import type { ProductionOrder, EngineeringChangeRequest } from '../../types';

test('buildEngineeringChangeRequest maps open work orders and assigns initial approvals', () => {
  const dummyOrders = [
    {
      id: 'po-1',
      orderNumber: 'MO-2026-00101',
      productId: 'prd-001',
      productSku: 'Product A',
      status: 'RELEASED',
      targetQuantity: 100,
      goodQuantity: 0,
      scrapQuantity: 0,
      bomRevision: 'Rev A',
      routingRevision: 'Rev A',
      plannedStartDate: '2026-10-25',
      dueDate: '2026-10-28',
      operations: [],
      materials: [],
      plantId: 'PLANT-01',
    },
    {
      id: 'po-2',
      orderNumber: 'MO-2026-00102',
      productId: 'prd-001',
      productSku: 'Product A',
      status: 'IN_PROGRESS',
      targetQuantity: 200,
      goodQuantity: 50,
      scrapQuantity: 0,
      bomRevision: 'Rev A',
      routingRevision: 'Rev A',
      plannedStartDate: '2026-10-24',
      dueDate: '2026-10-27',
      operations: [],
      materials: [],
      plantId: 'PLANT-01',
    },
  ] as unknown as ProductionOrder[];

  const ecr = buildEngineeringChangeRequest({
    ecrData: {
      productId: 'prd-001',
      productSku: 'Product A',
      proposedRevision: 'Rev C',
      reason: 'Critical cost reduction and alloy update',
    },
    existingCount: 3,
    productionOrders: dummyOrders,
    currentUser: 'Hendra Gunawan',
  });

  assert.equal(ecr.ecrNumber, 'ECR-2026-000008');
  assert.equal(ecr.status, 'IMPACT_ANALYSIS');
  assert.equal(ecr.proposedRevision, 'Rev C');
  assert.equal(ecr.openWorkOrderDecisions.length, 2);
  assert.equal(ecr.openWorkOrderDecisions[0].decision, 'APPLY_NEW_REV');
  assert.equal(ecr.openWorkOrderDecisions[1].decision, 'CONTINUE_EXISTING_REV');
  assert.equal(ecr.approvals.length, 3);
  assert.equal(ecr.approvals[0].status, 'PENDING');
});

test('evaluateEcrApproval transitions status to APPROVED only when all tiers sign off', () => {
  const baseEcr: EngineeringChangeRequest = {
    id: 'ecr-test',
    ecrNumber: 'ECR-2026-000009',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Product A Test',
    currentRevision: 'Rev A',
    proposedRevision: 'Rev B',
    reason: 'Testing',
    requestedBy: 'Engineer',
    department: 'R&D',
    priority: 'HIGH',
    status: 'IMPACT_ANALYSIS',
    targetEffectiveDate: '2026-11-01',
    createdAt: '2026-10-28 10:00',
    impactAnalysis: {
      bomImpact: true,
      routingImpact: true,
      wiImpact: true,
      qcImpact: true,
      toolingImpact: false,
      costImpact: false,
      customerApprovalRequired: false,
      estimatedCostDifference: 0,
      affectedOpenWorkOrderIds: [],
      inventoryOldMaterialRemaining: [],
      inventoryNewMaterialRequired: [],
      impactSummary: 'None',
    },
    openWorkOrderDecisions: [],
    approvals: [
      { role: 'Engineering Lead', approver: 'Lead', status: 'PENDING' },
      { role: 'Quality Assurance', approver: 'QA', status: 'PENDING' },
      { role: 'Operations Director', approver: 'Director', status: 'PENDING' },
    ],
  };

  const step1 = evaluateEcrApproval(baseEcr, 'Engineering Lead', 'Hendra');
  assert.equal(step1.allApproved, false);
  assert.equal(step1.updatedEcr.status, 'IMPACT_ANALYSIS');

  const step2 = evaluateEcrApproval(step1.updatedEcr, 'Quality Assurance', 'Siti');
  assert.equal(step2.allApproved, false);

  const step3 = evaluateEcrApproval(step2.updatedEcr, 'Operations Director', 'Agus');
  assert.equal(step3.allApproved, true);
  assert.equal(step3.updatedEcr.status, 'APPROVED');
});

test('buildProductReleasePackageFromEcr creates active release package and audit entry', () => {
  const approvedEcr: EngineeringChangeRequest = {
    id: 'ecr-1',
    ecrNumber: 'ECR-2026-000001',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Controller',
    currentRevision: 'Rev A',
    proposedRevision: 'Rev B',
    reason: 'Spec upgrade',
    requestedBy: 'Engineer',
    department: 'R&D',
    priority: 'HIGH',
    status: 'APPROVED',
    targetEffectiveDate: '2026-11-01',
    createdAt: '2026-10-28 10:00',
    impactAnalysis: {} as any,
    openWorkOrderDecisions: [],
    approvals: [],
  };

  const result = buildProductReleasePackageFromEcr(
    approvedEcr,
    4,
    '2026-11-01',
    'Lead Engineer'
  );

  assert.equal(result.releasePackage.packageNumber, 'REL-PKG-2026-004');
  assert.equal(result.releasePackage.releasedRevision, 'Rev B');
  assert.equal(result.releasePackage.status, 'ACTIVE');
  assert.equal(result.updatedEcr.status, 'EFFECTIVE');
  assert.equal(result.auditLog.action, 'RELEASE_ECR_REVISION');
});

test('applyEcrDecisionToOrder updates revision for APPLY_NEW_REV and preserves existing for CONTINUE_EXISTING_REV', () => {
  const order = {
    id: 'po-1',
    orderNumber: 'MO-2026-00101',
    productId: 'prd-001',
    productSku: 'Product A',
    status: 'RELEASED',
    targetQuantity: 100,
    goodQuantity: 0,
    scrapQuantity: 0,
    bomRevision: 'Product A BOM Rev A',
    routingRevision: 'Product A Routing Rev A',
    plannedStartDate: '2026-10-25',
    dueDate: '2026-10-28',
    operations: [],
    materials: [],
    plantId: 'PLANT-01',
  } as unknown as ProductionOrder;

  const updatedApply = applyEcrDecisionToOrder(order, 'APPLY_NEW_REV', 'Rev B', 'Product A');
  assert.equal(updatedApply.bomRevision, 'Product A BOM Rev B');
  assert.equal(updatedApply.routingRevision, 'Product A Routing Rev B');

  const updatedHold = applyEcrDecisionToOrder(order, 'HOLD_WORK_ORDER', 'Rev B', 'Product A');
  assert.equal(updatedHold.status, 'PLANNED');

  const updatedContinue = applyEcrDecisionToOrder(order, 'CONTINUE_EXISTING_REV', 'Rev B', 'Product A');
  assert.equal(updatedContinue.bomRevision, 'Product A BOM Rev A');
});

test('factory helpers construct compliant engineering master records', () => {
  const tool = buildToolingItem({ name: 'Injection Mold 500T', productSku: 'Product A' });
  assert.equal(tool.status, 'READY');
  assert.equal(tool.name, 'Injection Mold 500T');

  const dwg = buildEngineeringDrawing({ drawingNumber: 'DWG-2026-99', productSku: 'Product A' }, 'Author');
  assert.equal(dwg.drawingNumber, 'DWG-2026-99');
  assert.equal(dwg.status, 'RELEASED');

  const spec = buildEngineeringSpecification({ title: 'Tensile Spec' }, 'Author');
  assert.equal(spec.title, 'Tensile Spec');

  const wi = buildWorkInstruction({ title: 'Final Inspection WI' }, 'Author');
  assert.equal(wi.title, 'Final Inspection WI');

  const qcp = buildQcPlan({ operationName: 'Final Inspection Station' }, 'Author');
  assert.equal(qcp.operationName, 'Final Inspection Station');
  assert.equal(qcp.characteristics.length, 2);
});
