// Domain-Owned Types for Manufacturing Bounded Context

export type ProductType = 'FINISHED_GOOD' | 'SUB_ASSEMBLY' | 'RAW_MATERIAL' | 'CONSUMABLE' | 'PACKAGING';

export type UomCode = 'PCS' | 'KG' | 'MTR' | 'LTR' | 'SET' | 'BOX' | 'ROLL';

export type ProductLifecycleStatus =
  | 'DRAFT'
  | 'DEVELOPMENT'
  | 'PROTOTYPE'
  | 'TRIAL'
  | 'PILOT'
  | 'RELEASED'
  | 'ON_HOLD'
  | 'OBSOLETE';

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  baseUom: UomCode;
  uom?: UomCode;
  category: string;
  makeOrBuy: 'MAKE' | 'BUY';
  lotSerialPolicy: 'LOT' | 'SERIAL' | 'NONE';
  standardCost: number;
  salesPrice?: number;
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  currentStock: number;
  allocatedStock: number;
  onOrderStock: number;
  status: 'ACTIVE' | 'INACTIVE';
  lifecycleStatus?: ProductLifecycleStatus;
  currentRevision?: string;
  drawingNumber?: string;
  drawingRevision?: string;
  specificationNumber?: string;
  specificationRevision?: string;
  customer?: string;
  effectiveDate?: string;
  obsoleteDate?: string;
  bomId?: string;
  routingId?: string;
  description: string;
}

export interface CostBreakdown {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;
}

export interface OrderCostVariance {
  orderNumber: string;
  productSku: string;
  standardCost: number;
  actualCost: number;
  varianceAmount: number;
  variancePercentage: number;
  materialVariance: number;
  laborVariance: number;
}

export interface UnitOfMeasure {
  id: string;
  code: UomCode;
  name: string;
  category: 'QUANTITY' | 'WEIGHT' | 'LENGTH' | 'VOLUME';
  referenceUom: string;
  conversionFactor: number;
  rounding: number;
  active: boolean;
}

export interface BomComponent {
  id: string;
  componentProductId: string;
  componentSku: string;
  componentName: string;
  quantityPerUnit: number;
  uom: UomCode;
  scrapPercentage: number;
  unitCost: number;
  operationSeq?: number;
}

export interface BillOfMaterials {
  id: string;
  code: string;
  revision: string;
  productId: string;
  productSku: string;
  productName: string;
  baseQuantity: number;
  effectiveFrom: string;
  effectiveTo: string;
  effectiveDate?: string;
  bomType: 'STANDARD' | 'PHANTOM' | 'SUBCONTRACT';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'OBSOLETE';
  components: BomComponent[];
  notes?: string;
}

export interface RoutingOperation {
  id: string;
  sequence: number;
  operationCode: string;
  name: string;
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  setupTimeMinutes: number;
  runTimeSecondsPerUnit: number;
  queueMoveTimeMinutes: number;
  dependencySeq?: number;
  instructions: string;
  description?: string;
  laborHourlyRate: number;
  machineHourlyRate: number;
  cycleTimeSeconds?: number;
  cycleTimeUom?: 'SECONDS_PER_PCS' | 'MINUTES_PER_PCS' | 'HOURS_PER_PCS';
  manpowerRequired?: number;
  skillRequired?: string;
  toolingRequired?: string;
  yieldPercent?: number;
  machineCode?: string;
}

export interface Routing {
  id: string;
  code: string;
  revision: string;
  productId: string;
  productSku: string;
  productName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE';
  operations: RoutingOperation[];
}

export type WorkCenterStatus = 'AVAILABLE' | 'RUNNING' | 'IN_SETUP' | 'DOWN' | 'MAINTENANCE' | 'OFFLINE';

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  department: string;
  plantId: string;
  capacityHoursPerDay: number;
  calendar: string;
  shiftsCount: number;
  efficiencyRate: number;
  costRate: number;
  hourlyRate?: number;
  status: WorkCenterStatus;
  alternativeWorkCenterId?: string;
  currentWorkOrderId?: string;
  currentOperator?: string;
}

export interface ReasonCode {
  id: string;
  code: string;
  category: 'SCRAP' | 'DOWNTIME' | 'REJECT';
  description: string;
  department: string;
}

export type ProductionOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PLANNED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export interface OrderMaterialRequirement {
  productId: string;
  sku: string;
  name: string;
  requiredQty: number;
  allocatedQty: number;
  consumedQty: number;
  availableStock: number;
  uom: UomCode;
  unitCost: number;
  status: 'SUFFICIENT' | 'SHORTAGE' | 'PARTIAL';
}

export type OperationStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'BLOCKED';

export interface ProductionOrderOperation {
  id: string;
  workOrderNo: string;
  sequence: number;
  operationCode: string;
  name: string;
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  status: OperationStatus;
  targetQty: number;
  completedQty: number;
  scrapQty: number;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  downtimeMinutes: number;
  dependencySeq?: number;
  setupTimeMinutes: number;
  runTimeSecondsPerUnit: number;
  startedAt?: string;
  completedAt?: string;
  assignedOperator?: string;
}

export interface OutputLogEntry {
  id: string;
  timestamp: string;
  operationSequence: number;
  operationName: string;
  goodQty: number;
  scrapQty: number;
  reasonCode?: string;
  operator: string;
  workCenterCode: string;
  notes?: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productSku: string;
  productName: string;
  targetQuantity: number;
  goodQuantity: number;
  scrapQuantity: number;
  bomId: string;
  bomCode: string;
  bomRevision: string;
  routingId: string;
  routingCode: string;
  routingRevision: string;
  productRevision?: string;
  releasePackageId?: string;
  wiRevision?: string;
  toolingRevision?: string;
  plantId: string;
  plantName: string;
  plannedStartDate: string;
  dueDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  demandLink: string;
  priority: 'NORMAL' | 'URGENT';
  status: ProductionOrderStatus;
  materialAvailabilityPct: number;
  operations: ProductionOrderOperation[];
  materials: OrderMaterialRequirement[];
  outputLogs: OutputLogEntry[];
  totalCostPlanned: number;
  totalCostActual: number;
  backorderQty?: number;
  createdAt: string;
}

export interface ShopFloorSession {
  id: string;
  workCenterCode: string;
  operator: string;
  startedAt: string;
  activeWorkOrder?: string;
}

export interface MaterialConsumption {
  id: string;
  transactionNo: string;
  productionOrderId: string;
  orderNumber: string;
  workOrderNo?: string;
  productId: string;
  sku: string;
  productName: string;
  requiredQty: number;
  consumedQty: number;
  uom: UomCode;
  sourceLocation: string;
  lotNumber: string;
  method: 'BACKFLUSH' | 'MANUAL';
  cost: number;
  timestamp: string;
}

export interface ProductionOutputReceipt {
  id: string;
  outputNo: string;
  orderNumber: string;
  productId: string;
  sku: string;
  productName: string;
  goodQty: number;
  scrapQty: number;
  reworkQty: number;
  lotNumber: string;
  destination: string;
  timestamp: string;
  inspectedBy: string;
}
