import type {
  NpiProject,
  NpiStatus,
  NpiTrialRun,
  NpiPilotRun,
  ProductReleasePackage,
  Product,
  AuditLogEntry,
} from '../../types';

export interface CreateNpiProjectInput {
  projectData: Partial<NpiProject>;
  existingCount: number;
  currentUser: string;
}

export interface ProductReleaseResult {
  releasePackage: ProductReleasePackage;
  updatedProducts: Product[];
  auditLog: AuditLogEntry;
}

/**
 * Constructs an NPI Project record with default stage milestones and stakeholder assignments.
 */
export function buildNpiProject(input: CreateNpiProjectInput): NpiProject {
  const { projectData, existingCount, currentUser } = input;
  const pNum = `NPI-2026-00${existingCount + 1}`;

  return {
    id: `npi-${Date.now()}`,
    projectNumber: pNum,
    productId: projectData.productId || 'prd-abc-100',
    productSku: projectData.productSku || 'ABC-100',
    productName: projectData.productName || 'Smart Industrial Gateway Controller ABC-100',
    productRevision: projectData.productRevision || 'Rev A',
    customer: projectData.customer || 'Target Enterprise Customer',
    projectOwner: projectData.projectOwner || currentUser,
    engineeringOwner: projectData.engineeringOwner || 'Hendra Gunawan',
    ppicRepresentative: projectData.ppicRepresentative || 'Dewi Lestari',
    productionRepresentative: projectData.productionRepresentative || 'Agus Pratama',
    qualityRepresentative: projectData.qualityRepresentative || 'Siti Nurhaliza',
    toolingRepresentative: projectData.toolingRepresentative || 'Budi Santoso',
    targetReleaseDate: projectData.targetReleaseDate || '2026-11-30',
    status: (projectData.status as NpiStatus) || 'DEVELOPMENT',
    priority: projectData.priority || 'HIGH',
    notes: projectData.notes || 'New Product Introduction lifecycle project.',
    blockingIssues: projectData.blockingIssues || [],
    milestones: projectData.milestones || [
      { id: 'ms-new-1', title: 'Conceptual Design & BOM Draft', targetDate: '2026-10-30', status: 'IN_PROGRESS', responsibleRole: 'Engineering' },
      { id: 'ms-new-2', title: 'Tooling Qualification & First Article', targetDate: '2026-11-10', status: 'PENDING', responsibleRole: 'Tooling' },
      { id: 'ms-new-3', title: 'Material Kitting & Trial Run', targetDate: '2026-11-18', status: 'PENDING', responsibleRole: 'PPIC' },
      { id: 'ms-new-4', title: 'Pilot Run & Commercial Release Gate', targetDate: '2026-11-30', status: 'PENDING', responsibleRole: 'Quality & Operations' },
    ],
    trialRuns: [],
    pilotRuns: [],
  };
}

/**
 * Updates an NPI milestone status and records completion date when finished.
 */
export function updateNpiMilestoneStatus(
  project: NpiProject,
  milestoneId: string,
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
): NpiProject {
  const today = new Date().toISOString().split('T')[0];
  return {
    ...project,
    milestones: project.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            status,
            completedDate: status === 'COMPLETED' ? today : m.completedDate,
          }
        : m
    ),
  };
}

/**
 * Evaluates and records a trial run, advancing the NPI project status to PILOT if passing.
 */
export function processTrialRunRecord(
  project: NpiProject,
  trialData: NpiTrialRun
): NpiProject {
  const isPassing = trialData.trialResult === 'PASS' || trialData.trialResult === 'PASS_WITH_ACTION';
  return {
    ...project,
    status: isPassing ? 'PILOT' : 'TRIAL',
    trialRuns: [trialData, ...project.trialRuns],
  };
}

/**
 * Evaluates and records a pilot run, advancing the NPI project status to READY_FOR_RELEASE if passing.
 */
export function processPilotRunRecord(
  project: NpiProject,
  pilotData: NpiPilotRun
): NpiProject {
  const isPassing = pilotData.pilotResult === 'PASS';
  return {
    ...project,
    status: isPassing ? 'READY_FOR_RELEASE' : project.status,
    pilotRuns: [pilotData, ...project.pilotRuns],
  };
}

/**
 * Builds an official Product Release Package, updates product master lifecycle status to RELEASED,
 * and generates audit trail.
 */
export function buildProductReleasePackage(
  releaseData: Partial<ProductReleasePackage>,
  packageSequence: number,
  products: Product[],
  currentUser: string,
  role: string = 'Production GM'
): ProductReleaseResult {
  const pkgNum = `REL-PKG-2026-${packageSequence.toString().padStart(3, '0')}`;
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 16);
  const today = now.toISOString().split('T')[0];

  const releasePackage: ProductReleasePackage = {
    id: `rel-${Date.now()}`,
    packageNumber: pkgNum,
    productId: releaseData.productId || 'prd-abc-100',
    productSku: releaseData.productSku || 'ABC-100',
    productName: releaseData.productName || 'Smart Industrial Gateway Controller ABC-100',
    releasedRevision: releaseData.releasedRevision || 'Rev A',
    drawingRevision: releaseData.drawingRevision || 'DWG-ABC-100-A Rev A',
    specificationRevision: releaseData.specificationRevision || 'SPEC-ABC-100-A Rev A',
    bomRevision: releaseData.bomRevision || 'BOM-001 Rev.01',
    routingRevision: releaseData.routingRevision || 'RT-001 Rev.01',
    toolingRevision: releaseData.toolingRevision || 'TOOL-MOLD-GW01 Rev 01',
    wiRevision: releaseData.wiRevision || 'WI-ABC-100-OP10 Rev A',
    qcPlanRevision: releaseData.qcPlanRevision || 'QCP-ABC-100-A Rev A',
    effectiveDate: releaseData.effectiveDate || today,
    releasedBy: currentUser,
    status: 'ACTIVE',
    notes: releaseData.notes || 'Formal manufacturing baseline package release.',
    approvals: [
      { role: 'VP Engineering', approver: 'Ir. Agus Wijaya', approvedAt: timeStr, status: 'APPROVED' },
      { role: 'Quality Assurance Director', approver: 'Siti Nurhaliza', approvedAt: timeStr, status: 'APPROVED' },
      { role: 'Production GM', approver: currentUser, approvedAt: timeStr, status: 'APPROVED' },
      { role: 'PPIC Operations Lead', approver: 'Dewi Lestari', approvedAt: timeStr, status: 'APPROVED' },
    ],
  };

  const updatedProducts = products.map((prod) => {
    if (prod.id === releasePackage.productId || prod.sku === releasePackage.productSku) {
      return {
        ...prod,
        lifecycleStatus: 'RELEASED' as const,
        currentRevision: releasePackage.releasedRevision,
        effectiveDate: releasePackage.effectiveDate,
      };
    }
    return prod;
  });

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: releasePackage.packageNumber,
    documentType: 'PRODUCT_RELEASE',
    action: 'RELEASE_PRODUCT',
    actor: currentUser,
    role,
    timestamp: timeStr,
    oldStatus: 'PILOT',
    newStatus: 'RELEASED',
    decision: 'APPROVED',
    reason: `Approved official manufacturing baseline release package ${releasePackage.packageNumber} for ${releasePackage.productSku} ${releasePackage.releasedRevision}. Product is now authorized for commercial volume production.`,
  };

  return {
    releasePackage,
    updatedProducts,
    auditLog,
  };
}
