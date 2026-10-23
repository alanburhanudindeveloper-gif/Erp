export type ProductType = 'FINISHED_GOOD' | 'SUB_ASSEMBLY' | 'RAW_MATERIAL' | 'CONSUMABLE' | 'PACKAGING';

export type UomCode = 'PCS' | 'KG' | 'MTR' | 'LTR' | 'SET' | 'BOX' | 'ROLL';

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  baseUom: UomCode;
  uom?: UomCode; // Convenient alias
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
  dependencySeq?: number; // Predecessor operation that must finish first
  instructions: string;
  description?: string;
  laborHourlyRate: number;
  machineHourlyRate: number;
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
  hourlyRate?: number; // Optional convenient alias
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

// 6. DEMAND MANAGEMENT
export interface DemandRecord {
  id: string;
  demandNo: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  dueDate: string;
  source: 'SALES_ORDER' | 'FORECAST' | 'SAFETY_STOCK' | 'MANUAL';
  firmness: 'FIRM' | 'PLANNED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'DRAFT' | 'CONFIRMED' | 'ALLOCATED' | 'CLOSED';
}

// 7. MPS
export interface MpsRecord {
  id: string;
  planVersion: string;
  periodBucket: string;
  productId: string;
  productSku: string;
  productName: string;
  forecast: number;
  firmDemand: number;
  beginStock: number;
  plannedProduction: number;
  projectedEnding: number;
}

// 8. MRP ENGINE
export interface MrpRunRecord {
  id: string;
  runNo: string;
  runDate: string;
  horizonDays: number;
  status: 'COMPLETED';
  itemsProcessed: number;
}

export interface MrpItemRequirement {
  productId: string;
  sku: string;
  name: string;
  type: ProductType;
  leadTimeDays: number;
  grossRequirement: number;
  onHandStock: number;
  scheduledReceipts: number;
  safetyStock: number;
  netRequirement: number;
  lotSize: number;
  plannedSupplyQty: number;
  requiredDate: string;
  actionRequired: 'CREATE_PRODUCTION_ORDER' | 'CREATE_PURCHASE_ORDER' | 'STOCK_SUFFICIENT';
  peggingSource: string;
}

// 9. AVAILABILITY & RESERVATION
export interface MaterialReservation {
  id: string;
  reservationNo: string;
  productionOrderId: string;
  orderNumber: string;
  productId: string;
  sku: string;
  productName: string;
  requiredQty: number;
  reservedQty: number;
  location: string;
  lotNumber?: string;
  reservedAt: string;
  status: 'ACTIVE' | 'CONSUMED' | 'RELEASED';
}

// 10. PRODUCTION ORDER
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

export interface ProductionOrder {
  id: string;
  orderNumber: string; // MO-2026-00124
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

// 11. WORK ORDER
export type OperationStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'BLOCKED';

export interface ProductionOrderOperation {
  id: string;
  workOrderNo: string; // e.g. WO-124-01
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

// 12. SHOP FLOOR LOGS & SESSIONS
export interface ShopFloorSession {
  id: string;
  workCenterCode: string;
  operator: string;
  startedAt: string;
  activeWorkOrder?: string;
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

// 13. MATERIAL CONSUMPTION
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

// 14. PRODUCTION OUTPUT & FG RECEIPT
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

// 15. QUALITY MANAGEMENT & NCR
export interface QualityInspection {
  id: string;
  inspectionNo: string;
  sourceType: 'PRODUCTION_ORDER' | 'RECEIVING' | 'IN_PROCESS';
  sourceRef: string;
  productId: string;
  sku: string;
  productName: string;
  lotNumber: string;
  operationName: string;
  sampleSize: number;
  defectsCount: number;
  characteristic: string;
  specification: string;
  result: 'PASS' | 'FAIL' | 'CONCESSION';
  disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
  inspector: string;
  timestamp: string;
  notes: string;
}

export interface NonConformanceReport {
  id: string;
  ncrNo: string;
  orderNumber: string;
  lotNumber: string;
  productSku: string;
  defectDescription: string;
  rootCause?: string;
  quantityAffected: number;
  disposition: 'SCRAP' | 'REWORK' | 'USE_AS_IS';
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}

// 16. SCRAP & REWORK
export interface ScrapTransaction {
  id: string;
  transactionNo: string;
  sourceRef: string;
  quantity: number;
  uom: UomCode;
  reasonCode: string;
  sourceOperation: string;
  costImpact: number;
  disposition: 'DISCARD_SCRAP' | 'RECYCLE';
  timestamp: string;
}

export interface ReworkOrder {
  id: string;
  reworkOrderNo: string;
  parentOrderNumber: string;
  productSku: string;
  quantityToRework: number;
  reworkWorkCenter: string;
  defectReason: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  additionalCost: number;
  reinspectionPassed: boolean;
}

// 17. INVENTORY LEDGER (IMMUTABLE STOCK MOVEMENTS)
export interface StockMovement {
  id: string;
  movementNo: string;
  timestamp: string;
  productId: string;
  sku: string;
  quantity: number;
  uom: UomCode;
  fromLocation: string;
  toLocation: string;
  lotNumber: string;
  sourceDocument: string;
  movementType: 'GR_PURCHASE' | 'GI_PRODUCTION' | 'GR_PRODUCTION' | 'TRANSFER' | 'SCRAP' | 'REVERSAL';
  isReversed?: boolean;
}

// 18. CAPACITY
export interface WorkCenterCapacityLoad {
  workCenterId: string;
  code: string;
  name: string;
  plantName: string;
  periodBucket: string;
  availableMinutes: number;
  requiredMinutes: number;
  loadPercentage: number;
  priority: 'HIGH' | 'NORMAL';
  status: 'OPTIMAL' | 'OVERLOADED' | 'UNDERLOADED';
}

// 19. MAINTENANCE & BREAKDOWN
export interface DowntimeEvent {
  id: string;
  workCenterCode: string;
  equipmentName: string;
  status: 'DOWN' | 'RESOLVED';
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  reason: string;
  maintenanceTicketNo: string;
  productionImpact: string;
}

// 20. COSTING
export interface CostVarianceRecord {
  orderNumber: string;
  productSku: string;
  plannedMaterialCost: number;
  actualMaterialCost: number;
  plannedLaborCost: number;
  actualLaborCost: number;
  plannedMachineCost: number;
  actualMachineCost: number;
  overheadCost: number;
  totalPlannedCost: number;
  totalActualCost: number;
  varianceAmount: number;
  variancePercentage: number;
  materialVariance: number;
  laborEfficiencyVariance: number;
  settledAt?: string;
}

// 22. APPROVAL & AUDIT
export interface AuditLogEntry {
  id: string;
  documentId: string;
  documentType: string;
  action: string;
  actor: string;
  role: string;
  timestamp: string;
  oldStatus?: string;
  newStatus?: string;
  decision: 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FLAGGED';
  reason?: string;
}

// 45. TESTING MATRIX SCENARIO
export interface TestingScenario {
  id: string;
  scenarioNumber: number;
  title: string;
  description: string;
  expectedResult: string;
  status: 'PASSED' | 'PENDING' | 'RUNNING';
  lastRunDetails?: string;
}
