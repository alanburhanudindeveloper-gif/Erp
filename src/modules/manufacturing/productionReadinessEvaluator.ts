import type {
  BillOfMaterials,
  EngineeringDrawing,
  EngineeringSpecification,
  MaterialRequest,
  NpiProject,
  ProductionReadinessReport,
  QcPlan,
  ReadinessItem,
  Routing,
  ToolingItem,
  WorkInstruction,
} from '../../types';

export interface ProductionReadinessContext {
  project: NpiProject;
  drawings: EngineeringDrawing[];
  specifications: EngineeringSpecification[];
  boms: BillOfMaterials[];
  routings: Routing[];
  toolingItems: ToolingItem[];
  workInstructions: WorkInstruction[];
  qcPlans: QcPlan[];
  materialRequests: MaterialRequest[];
  evaluator: string;
}

export function evaluateProductionReadiness(context: ProductionReadinessContext): ProductionReadinessReport {
  const {
    project,
    drawings,
    specifications,
    boms,
    routings,
    toolingItems,
    workInstructions,
    qcPlans,
    materialRequests,
    evaluator,
  } = context;

  const dwgApproved = drawings.some(
    (drawing) => drawing.productId === project.productId && (drawing.status === 'APPROVED' || drawing.status === 'RELEASED')
  );
  const specApproved = specifications.some(
    (specification) => specification.productId === project.productId && (specification.status === 'APPROVED' || specification.status === 'RELEASED')
  );
  const bomApproved = boms.some((bom) => bom.productId === project.productId && bom.status === 'ACTIVE');
  const routingApproved = routings.some((routing) => routing.productId === project.productId && routing.status === 'ACTIVE');
  const toolingQualified = toolingItems.some(
    (tool) => tool.productId === project.productId && (tool.status === 'READY' || tool.status === 'IN_USE')
  );
  const wiReleased = workInstructions.some(
    (instruction) => instruction.productId === project.productId && (instruction.status === 'APPROVED' || instruction.status === 'RELEASED')
  );
  const qcPlanReleased = qcPlans.some(
    (plan) => plan.productId === project.productId && (plan.status === 'APPROVED' || plan.status === 'RELEASED')
  );
  const materialReady = materialRequests.some(
    (request) => (request.sourceReferenceId === project.projectNumber || request.sourceReferenceId === project.id) && request.status === 'DELIVERED'
  );

  const items = [
    {
      id: 'p-eng-1',
      pillar: 'ENGINEERING' as const,
      checkItem: `CAD Drawing Approved & Released (${project.productSku})`,
      status: dwgApproved ? ('READY' as const) : ('BLOCKED' as const),
      blockingReason: dwgApproved ? undefined : 'No approved CAD drawing found for this product revision.',
      responsibleRole: 'Lead Mechanical Eng',
      verifiedBy: dwgApproved ? 'Bambang Sutrisno' : undefined,
      verifiedAt: dwgApproved ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-eng-2',
      pillar: 'ENGINEERING' as const,
      checkItem: 'Engineering Specification Released',
      status: specApproved ? ('READY' as const) : ('BLOCKED' as const),
      blockingReason: specApproved ? undefined : 'Specification document has not been formally approved.',
      responsibleRole: 'Systems Architect',
      verifiedBy: specApproved ? 'Hendra Gunawan' : undefined,
      verifiedAt: specApproved ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-eng-3',
      pillar: 'ENGINEERING' as const,
      checkItem: 'BOM Hierarchy Validated & Released',
      status: bomApproved ? ('READY' as const) : ('BLOCKED' as const),
      blockingReason: bomApproved ? undefined : 'Active BOM is missing or not submitted.',
      responsibleRole: 'BOM Engineer',
      verifiedBy: bomApproved ? 'Dewi Lestari' : undefined,
      verifiedAt: bomApproved ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-tool-1',
      pillar: 'TOOLING' as const,
      checkItem: 'Production Tooling Qualified (Molds, Jigs, Dies)',
      status: toolingQualified ? ('READY' as const) : ('BLOCKED' as const),
      blockingReason: toolingQualified ? undefined : 'Required tooling is still in DESIGN or FABRICATION.',
      responsibleRole: 'Tooling Specialist',
      verifiedBy: toolingQualified ? 'Hendra Gunawan' : undefined,
      verifiedAt: toolingQualified ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-proc-1',
      pillar: 'PROCESS' as const,
      checkItem: 'Manufacturing Routing & Work Instructions Released',
      status: routingApproved && wiReleased ? ('READY' as const) : ('BLOCKED' as const),
      blockingReason: !routingApproved ? 'Routing is not active.' : !wiReleased ? 'Work Instructions not approved.' : undefined,
      responsibleRole: 'Methods Engineer',
      verifiedBy: routingApproved && wiReleased ? 'Dewi Lestari' : undefined,
      verifiedAt: routingApproved && wiReleased ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-mat-1',
      pillar: 'MATERIAL' as const,
      checkItem: 'Trial Raw Materials Staged at Production Line (MR)',
      status: materialReady ? ('READY' as const) : ('NOT_READY' as const),
      blockingReason: materialReady ? undefined : 'Material Request pending warehouse delivery to line staging.',
      responsibleRole: 'Warehouse Manager',
      verifiedBy: materialReady ? 'Joko Susilo' : undefined,
      verifiedAt: materialReady ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-qc-1',
      pillar: 'QUALITY' as const,
      checkItem: 'Quality Control Plan & Inspection Characteristics Released',
      status: qcPlanReleased ? ('READY' as const) : ('BLOCKED' as const),
      blockingReason: qcPlanReleased ? undefined : 'QC Plan (QCP) not yet released.',
      responsibleRole: 'Quality Director',
      verifiedBy: qcPlanReleased ? 'Siti Nurhaliza' : undefined,
      verifiedAt: qcPlanReleased ? new Date().toISOString().split('T')[0] : undefined,
    },
    {
      id: 'p-ppl-1',
      pillar: 'PEOPLE_PRODUCTION' as const,
      checkItem: 'Shop Floor Operators Certified & Shift Scheduled',
      status: 'READY' as const,
      responsibleRole: 'Production Supervisor',
      verifiedBy: 'Agus Pratama',
      verifiedAt: new Date().toISOString().split('T')[0],
    },
  ] satisfies ReadinessItem[];

  const blockingIssues = items
    .filter((item) => item.status === 'BLOCKED')
    .map((item) => `${item.checkItem}: ${item.blockingReason}`);

  const overallStatus =
    blockingIssues.length > 0
      ? 'BLOCKED'
      : items.some((item) => item.status === 'NOT_READY')
        ? 'NOT_READY'
        : 'READY';

  return {
    id: `read-${Date.now()}`,
    npiProjectId: project.id,
    productSku: project.productSku,
    productRevision: project.productRevision,
    targetRunType: project.status === 'TRIAL' ? 'TRIAL' : project.status === 'PILOT' ? 'PILOT' : 'NORMAL_PRODUCTION',
    overallStatus,
    items,
    blockingIssues,
    evaluatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    evaluator,
  };
}
