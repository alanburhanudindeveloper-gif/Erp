import type {
  EngineeringDrawing,
  EngineeringSpecification,
  ToolingItem,
  WorkInstruction,
  QcPlan,
  EngineeringChangeRequest,
  ProductReleasePackage,
} from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import {
  INITIAL_DRAWINGS,
  INITIAL_SPECIFICATIONS,
  INITIAL_TOOLING_ITEMS,
  INITIAL_WORK_INSTRUCTIONS,
  INITIAL_QC_PLANS,
  INITIAL_ENGINEERING_CHANGES,
  INITIAL_RELEASE_PACKAGES,
} from '../../lib/mockData';

export interface IEngineeringRepository {
  listDrawings(): EngineeringDrawing[];
  findDrawingById(id: string): EngineeringDrawing | undefined;
  saveDrawing(drawing: EngineeringDrawing): EngineeringDrawing;

  listSpecifications(): EngineeringSpecification[];
  findSpecificationById(id: string): EngineeringSpecification | undefined;
  saveSpecification(spec: EngineeringSpecification): EngineeringSpecification;

  listTooling(): ToolingItem[];
  findToolingById(id: string): ToolingItem | undefined;
  saveTooling(tool: ToolingItem): ToolingItem;

  listWorkInstructions(): WorkInstruction[];
  findWorkInstructionById(id: string): WorkInstruction | undefined;
  saveWorkInstruction(wi: WorkInstruction): WorkInstruction;

  listQcPlans(): QcPlan[];
  findQcPlanById(id: string): QcPlan | undefined;
  saveQcPlan(qcPlan: QcPlan): QcPlan;

  listEcrs(): EngineeringChangeRequest[];
  findEcrById(id: string): EngineeringChangeRequest | undefined;
  saveEcr(ecr: EngineeringChangeRequest): EngineeringChangeRequest;

  listReleasePackages(): ProductReleasePackage[];
  findReleasePackageById(id: string): ProductReleasePackage | undefined;
  saveReleasePackage(pkg: ProductReleasePackage): ProductReleasePackage;
}

export function createEngineeringRepository(
  initialDrawings: EngineeringDrawing[] = INITIAL_DRAWINGS,
  initialSpecs: EngineeringSpecification[] = INITIAL_SPECIFICATIONS,
  initialTooling: ToolingItem[] = INITIAL_TOOLING_ITEMS,
  initialWis: WorkInstruction[] = INITIAL_WORK_INSTRUCTIONS,
  initialQcPlans: QcPlan[] = INITIAL_QC_PLANS,
  initialEcrs: EngineeringChangeRequest[] = INITIAL_ENGINEERING_CHANGES,
  initialPkgs: ProductReleasePackage[] = INITIAL_RELEASE_PACKAGES
): IEngineeringRepository {
  const drawingCollection: ErpCollectionRepository<EngineeringDrawing> = createErpCollectionRepository<EngineeringDrawing>(
    'drawings',
    initialDrawings
  );

  const specCollection: ErpCollectionRepository<EngineeringSpecification> = createErpCollectionRepository<EngineeringSpecification>(
    'specifications',
    initialSpecs
  );

  const toolingCollection: ErpCollectionRepository<ToolingItem> = createErpCollectionRepository<ToolingItem>(
    'toolingitems',
    initialTooling
  );

  const wiCollection: ErpCollectionRepository<WorkInstruction> = createErpCollectionRepository<WorkInstruction>(
    'workinstructions',
    initialWis
  );

  const qcPlanCollection: ErpCollectionRepository<QcPlan> = createErpCollectionRepository<QcPlan>(
    'qcplans',
    initialQcPlans
  );

  const ecrCollection: ErpCollectionRepository<EngineeringChangeRequest> = createErpCollectionRepository<EngineeringChangeRequest>(
    'engineeringchanges',
    initialEcrs
  );

  const pkgCollection: ErpCollectionRepository<ProductReleasePackage> = createErpCollectionRepository<ProductReleasePackage>(
    'productreleases',
    initialPkgs
  );

  return {
    listDrawings: () => drawingCollection.list(),
    findDrawingById: (id: string) => drawingCollection.get(id),
    saveDrawing: (drawing: EngineeringDrawing) => drawingCollection.upsert(drawing, 'id'),

    listSpecifications: () => specCollection.list(),
    findSpecificationById: (id: string) => specCollection.get(id),
    saveSpecification: (spec: EngineeringSpecification) => specCollection.upsert(spec, 'id'),

    listTooling: () => toolingCollection.list(),
    findToolingById: (id: string) => toolingCollection.get(id),
    saveTooling: (tool: ToolingItem) => toolingCollection.upsert(tool, 'id'),

    listWorkInstructions: () => wiCollection.list(),
    findWorkInstructionById: (id: string) => wiCollection.get(id),
    saveWorkInstruction: (wi: WorkInstruction) => wiCollection.upsert(wi, 'id'),

    listQcPlans: () => qcPlanCollection.list(),
    findQcPlanById: (id: string) => qcPlanCollection.get(id),
    saveQcPlan: (qcPlan: QcPlan) => qcPlanCollection.upsert(qcPlan, 'id'),

    listEcrs: () => ecrCollection.list(),
    findEcrById: (id: string) => ecrCollection.get(id),
    saveEcr: (ecr: EngineeringChangeRequest) => ecrCollection.upsert(ecr, 'id'),

    listReleasePackages: () => pkgCollection.list(),
    findReleasePackageById: (id: string) => pkgCollection.get(id),
    saveReleasePackage: (pkg: ProductReleasePackage) => pkgCollection.upsert(pkg, 'id'),
  };
}
