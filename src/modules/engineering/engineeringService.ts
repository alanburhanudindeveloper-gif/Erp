import type {
  EngineeringChangeRequest,
  ToolingItem,
  ToolStatus,
  EngineeringDrawing,
  EngineeringSpecification,
  WorkInstruction,
  QcPlan,
  ProductReleasePackage,
  OpenWorkOrderDecision,
  ProductionOrder,
  AuditLogEntry,
} from '../../types';

export interface CreateEcrInput {
  ecrData: Partial<EngineeringChangeRequest>;
  existingCount: number;
  productionOrders: ProductionOrder[];
  currentUser: string;
}

export interface ReleaseEcrResult {
  updatedEcr: EngineeringChangeRequest;
  releasePackage: ProductReleasePackage;
  auditLog: AuditLogEntry;
}

/**
 * Constructs a structured Engineering Change Request (ECR) with auto-impact analysis
 * and open work order mapping.
 */
export function buildEngineeringChangeRequest(input: CreateEcrInput): EngineeringChangeRequest {
  const { ecrData, existingCount, productionOrders, currentUser } = input;
  const ecrNum = `ECR-2026-${(existingCount + 5).toString().padStart(6, '0')}`;

  const affectedOrders = productionOrders.filter(
    (o) => o.status === 'RELEASED' || o.status === 'PLANNED'
  );

  return {
    id: `ecr-${Date.now()}`,
    ecrNumber: ecrNum,
    productId: ecrData.productId || 'prd-001',
    productSku: ecrData.productSku || 'Product A',
    productName: ecrData.productName || 'Industrial Motor Controller (Product A)',
    currentRevision: ecrData.currentRevision || 'Rev A',
    proposedRevision: ecrData.proposedRevision || 'Rev B',
    reason: ecrData.reason || 'Engineering specification update.',
    requestedBy: ecrData.requestedBy || currentUser,
    department: ecrData.department || 'Engineering',
    priority: ecrData.priority || 'HIGH',
    status: 'IMPACT_ANALYSIS',
    targetEffectiveDate: ecrData.targetEffectiveDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    impactAnalysis: ecrData.impactAnalysis || {
      bomImpact: true,
      routingImpact: true,
      wiImpact: true,
      qcImpact: true,
      toolingImpact: false,
      costImpact: true,
      customerApprovalRequired: false,
      estimatedCostDifference: 0,
      affectedOpenWorkOrderIds: affectedOrders.map((o) => o.id),
      inventoryOldMaterialRemaining: [],
      inventoryNewMaterialRequired: [],
      impactSummary: 'Analysis pending review.',
    },
    openWorkOrderDecisions: productionOrders.map((o) => ({
      workOrderId: o.id,
      orderNumber: o.orderNumber,
      productSku: o.productSku,
      currentRevision: o.bomRevision || 'Rev A',
      progressPercentage: o.status === 'IN_PROGRESS' ? 50 : 0,
      decision: o.status === 'IN_PROGRESS' ? 'CONTINUE_EXISTING_REV' : 'APPLY_NEW_REV',
    })),
    approvals: [
      { role: 'Engineering Lead', approver: 'Hendra Gunawan', status: 'PENDING' },
      { role: 'Quality Assurance', approver: 'Siti Nurhaliza', status: 'PENDING' },
      { role: 'Operations Director', approver: 'Ir. Agus Wijaya', status: 'PENDING' },
    ],
  };
}

/**
 * Updates approval sign-off on an ECR and determines whether all required approvals are satisfied.
 */
export function evaluateEcrApproval(
  ecr: EngineeringChangeRequest,
  role: string,
  approver: string
): { updatedEcr: EngineeringChangeRequest; allApproved: boolean } {
  const updatedApprovals = ecr.approvals.map((app) =>
    app.role === role
      ? {
          ...app,
          approver,
          status: 'APPROVED' as const,
          approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        }
      : app
  );

  const allApproved = updatedApprovals.every((a) => a.status === 'APPROVED');

  return {
    updatedEcr: {
      ...ecr,
      approvals: updatedApprovals,
      status: allApproved ? ('APPROVED' as const) : ecr.status,
    },
    allApproved,
  };
}

/**
 * Builds a released ProductReleasePackage and updates ECR status to EFFECTIVE.
 */
export function buildProductReleasePackageFromEcr(
  ecr: EngineeringChangeRequest,
  packageSequence: number,
  effectiveDate: string,
  releasedBy: string,
  role: string = 'Engineering Lead'
): ReleaseEcrResult {
  const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const pkgNum = `REL-PKG-2026-${packageSequence.toString().padStart(3, '0')}`;

  const releasePackage: ProductReleasePackage = {
    id: `rel-${Date.now()}-ecr`,
    packageNumber: pkgNum,
    productId: ecr.productId,
    productSku: ecr.productSku,
    productName: ecr.productName,
    releasedRevision: ecr.proposedRevision,
    drawingRevision: `${ecr.productSku} Drawing ${ecr.proposedRevision}`,
    specificationRevision: `${ecr.productSku} Spec ${ecr.proposedRevision}`,
    bomRevision: `${ecr.productSku} BOM ${ecr.proposedRevision}`,
    routingRevision: `${ecr.productSku} Routing ${ecr.proposedRevision}`,
    toolingRevision: 'Standard Tooling Rev',
    wiRevision: `${ecr.productSku} WI ${ecr.proposedRevision}`,
    qcPlanRevision: `${ecr.productSku} QCP ${ecr.proposedRevision}`,
    effectiveDate,
    releasedBy,
    status: 'ACTIVE',
    notes: `Released via ${ecr.ecrNumber}: ${ecr.reason}`,
    approvals: [
      { role: 'Engineering Lead', approver: releasedBy, approvedAt: timeStr, status: 'APPROVED' },
      { role: 'Operations Director', approver: 'Ir. Agus Wijaya', approvedAt: timeStr, status: 'APPROVED' },
    ],
  };

  const updatedEcr: EngineeringChangeRequest = {
    ...ecr,
    status: 'EFFECTIVE',
    effectiveAt: timeStr,
    releasedPackageId: releasePackage.id,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: ecr.ecrNumber,
    documentType: 'ENGINEERING_CHANGE',
    action: 'RELEASE_ECR_REVISION',
    actor: releasedBy,
    role,
    timestamp: timeStr,
    oldStatus: ecr.status,
    newStatus: 'EFFECTIVE',
    decision: 'EXECUTED',
    reason: `Engineering Change ${ecr.ecrNumber} made EFFECTIVE. Created baseline ${pkgNum} (${ecr.proposedRevision}). Open orders updated per authorized decisions without retroactive data corruption.`,
  };

  return {
    updatedEcr,
    releasePackage,
    auditLog,
  };
}

/**
 * Applies ECR decisions to an open production order.
 */
export function applyEcrDecisionToOrder(
  order: ProductionOrder,
  decision: OpenWorkOrderDecision['decision'],
  ecrProposedRevision: string,
  productSku: string
): ProductionOrder {
  if (decision === 'APPLY_NEW_REV') {
    return {
      ...order,
      productRevision: ecrProposedRevision,
      bomRevision: `${productSku} BOM ${ecrProposedRevision}`,
      routingRevision: `${productSku} Routing ${ecrProposedRevision}`,
    };
  }
  if (decision === 'HOLD_WORK_ORDER') {
    return {
      ...order,
      status: 'PLANNED',
    };
  }
  // CONTINUE_EXISTING_REV preserves current revisions
  return order;
}

/**
 * Factory for creating a ToolingItem master record.
 */
export function buildToolingItem(toolData: Partial<ToolingItem>): ToolingItem {
  return {
    id: `tool-${Date.now()}`,
    toolId: toolData.toolId || `TOOL-${Date.now().toString().slice(-4)}`,
    name: toolData.name || 'New Tooling Item',
    type: toolData.type || 'MOLD',
    productId: toolData.productId || 'prd-abc-100',
    productSku: toolData.productSku || 'ABC-100',
    revision: toolData.revision || 'Rev 01',
    status: toolData.status || 'READY',
    location: toolData.location || 'Tool Crib Bay 1',
    owner: toolData.owner || 'Tooling Section',
    capacityPerShift: toolData.capacityPerShift || 1000,
    expectedLifeShots: toolData.expectedLifeShots || 100000,
    currentShots: toolData.currentShots || 0,
    maintenanceIntervalShots: toolData.maintenanceIntervalShots || 10000,
    notes: toolData.notes,
  };
}

/**
 * Factory for creating an Engineering Drawing record.
 */
export function buildEngineeringDrawing(
  drawing: Partial<EngineeringDrawing>,
  currentUser: string
): EngineeringDrawing {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `dwg-${Date.now()}`,
    drawingNumber: drawing.drawingNumber || `DWG-${Date.now().toString().slice(-4)}`,
    revision: drawing.revision || 'Rev A',
    productId: drawing.productId || 'prd-abc-100',
    productSku: drawing.productSku || 'ABC-100',
    title: drawing.title || 'Technical CAD Blueprint',
    fileReference: drawing.fileReference || 'model.step',
    cadModelType: drawing.cadModelType || '3D_STEP',
    description: drawing.description || 'Master blueprint reference.',
    status: drawing.status || 'RELEASED',
    createdBy: currentUser,
    createdDate: today,
    approvedBy: currentUser,
    approvalDate: today,
    effectiveDate: today,
  };
}

/**
 * Factory for creating an Engineering Specification record.
 */
export function buildEngineeringSpecification(
  spec: Partial<EngineeringSpecification>,
  currentUser: string
): EngineeringSpecification {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `spec-${Date.now()}`,
    specNumber: spec.specNumber || `SPEC-${Date.now().toString().slice(-4)}`,
    revision: spec.revision || 'Rev A',
    productId: spec.productId || 'prd-abc-100',
    productSku: spec.productSku || 'ABC-100',
    title: spec.title || 'Engineering Specification',
    content: spec.content || 'Technical performance criteria and metallurgical tolerance standard.',
    criticalParameters: spec.criticalParameters || [
      { parameter: 'Tensile Strength', nominal: '450 MPa', tolerance: '±30 MPa' },
      { parameter: 'Core Thickness', nominal: '2.5 mm', tolerance: '±0.05 mm' },
    ],
    status: spec.status || 'RELEASED',
    approvedBy: currentUser,
    approvalDate: today,
    effectiveDate: today,
  };
}

/**
 * Factory for creating a Work Instruction record.
 */
export function buildWorkInstruction(
  wi: Partial<WorkInstruction>,
  currentUser: string
): WorkInstruction {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `wi-${Date.now()}`,
    wiNumber: wi.wiNumber || `WI-${Date.now().toString().slice(-4)}`,
    revision: wi.revision || 'Rev A',
    productId: wi.productId || 'prd-abc-100',
    productSku: wi.productSku || 'ABC-100',
    productRevision: wi.productRevision || 'Rev A',
    operationSeq: wi.operationSeq || 10,
    operationName: wi.operationName || 'Assembly Operation',
    workCenterId: wi.workCenterId || 'wc-01',
    workCenterName: wi.workCenterName || 'High Precision Work Center',
    title: wi.title || 'Standard Operating Procedure',
    instructions: wi.instructions || ['Step 1: Verify components and ESD strap', 'Step 2: Assemble PCBA into chassis'],
    safetyNotes: wi.safetyNotes || ['Wear safety goggles and ESD grounding'],
    qualityCheckpoints: wi.qualityCheckpoints || ['Verify dimensions and screw torque'],
    requiredTools: wi.requiredTools || ['Torque Wrench 1.2 Nm'],
    requiredMaterials: wi.requiredMaterials || ['Raw Materials & Fasteners'],
    status: wi.status || 'RELEASED',
    approvedBy: currentUser,
    approvalDate: today,
    effectiveDate: today,
  };
}

/**
 * Factory for creating a Quality Control Plan (QCP).
 */
export function buildQcPlan(
  qcPlan: Partial<QcPlan>,
  currentUser: string
): QcPlan {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `qcp-${Date.now()}`,
    planNumber: qcPlan.planNumber || `QCP-${Date.now().toString().slice(-4)}`,
    revision: qcPlan.revision || 'Rev A',
    productId: qcPlan.productId || 'prd-abc-100',
    productSku: qcPlan.productSku || 'ABC-100',
    productRevision: qcPlan.productRevision || 'Rev A',
    operationSeq: qcPlan.operationSeq || 10,
    operationName: qcPlan.operationName || 'Final Inspection',
    status: qcPlan.status || 'RELEASED',
    characteristics: qcPlan.characteristics || [
      {
        id: 'qc-char-1',
        characteristic: 'Dimension & Alloy Grade',
        specification: 'Standard Spec',
        measurementMethod: 'Caliper & Spectrometer',
        samplingFrequency: 'ANSI/ASQ Z1.4 Level II',
        equipment: 'Digital Micrometer',
        acceptanceCriteria: 'Zero defects (AQL 0.65)',
        reactionPlan: 'Quarantine lot and notify Quality Lead',
      },
      {
        id: 'qc-char-2',
        characteristic: 'Solder Joint Integrity',
        specification: 'IPC-A-610 Class 3',
        measurementMethod: '100% AOI Inspection',
        samplingFrequency: 'Continuous 100%',
        equipment: 'Automated Optical Inspection (AOI)',
        acceptanceCriteria: 'IPC Class 3 Zero Defect',
        reactionPlan: 'Hold batch for manual rework inspection',
      },
    ],
    approvedBy: currentUser,
    approvalDate: today,
    effectiveDate: today,
  };
}
