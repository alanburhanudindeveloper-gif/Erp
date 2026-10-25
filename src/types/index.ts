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
  dependencySeq?: number; // Predecessor operation that must finish first
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

// 16.5 MULTI-BUCKET STOCK & PROCUREMENT (UC-INV-001 & UC-PRC-001..004)
export type StockBucket = 'AVAILABLE' | 'RESERVED' | 'HOLD' | 'REJECTED' | 'WIP';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  category: string;
  rating: number;
  paymentTerms: string;
  contactEmail: string;
  active: boolean;
}

export type PurchaseRequisitionStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PO_GENERATED'
  | 'CLOSED';

export interface PurchaseRequisitionItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  uom: UomCode;
  estimatedPrice: number;
  totalCost: number;
  supplierPreferred?: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string; // e.g. PR-2026-000001
  requesterId: string;
  requesterName: string;
  department: string;
  requiredDate: string;
  reason: string;
  plantId: string;
  status: PurchaseRequisitionStatus;
  totalAmount: number;
  approvalLevelRequired: 1 | 2 | 3; // 1: <10M, 2: 10-100M, 3: >100M
  items: PurchaseRequisitionItem[];
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalAmount: number;
  uom: UomCode;
  qcRequired: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-000001
  prReference?: string;
  prId?: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  destinationWarehouse: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  receivedQty: number;
  uom: UomCode;
  supplierLot: string;
  qcRequired: boolean;
  stockBucket: 'AVAILABLE' | 'HOLD';
  targetLocation: string;
  inspectionId?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-000001
  poId: string;
  poNumber: string;
  supplierName: string;
  receivedDate: string;
  receivedBy: string;
  items: GoodsReceiptItem[];
  notes?: string;
  stockBucketSummary: string;
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
  stockBucket?: StockBucket;
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

// ============================================================================
// CONFIGURABLE PLATFORM & MASTER FEATURE REGISTRY TYPES (Sections 32-35, 42-43)
// ============================================================================

export type FeaturePhase =
  | 'PHASE_0'
  | 'PHASE_1'
  | 'PHASE_2'
  | 'PHASE_3'
  | 'PHASE_4'
  | 'PHASE_5'
  | 'PHASE_6'
  | 'PHASE_7'
  | 'PHASE_8'
  | 'PHASE_9';

export type FeatureStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'IMPLEMENTED'
  | 'TESTED'
  | 'PRODUCTION_READY';

export type FeatureCategory = 'CORE' | 'ADVANCED' | 'OPTIONAL' | 'CONFIGURABLE' | 'AI';

export interface FeatureRegistryItem {
  id: string;
  code: string;
  phase: FeaturePhase;
  phaseName: string;
  category: FeatureCategory;
  module: string;
  title: string;
  description: string;
  status: FeatureStatus;
  dependencies: string[];
  targetRelease: string;
  notes?: string;
}

export type CustomFieldEntityType = 'PRODUCT' | 'WORK_ORDER' | 'QUALITY_INSPECTION' | 'WORK_CENTER';
export type CustomFieldDataType = 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'DATE';

export interface CustomFieldDefinition {
  id: string;
  entityType: CustomFieldEntityType;
  fieldKey: string;
  label: string;
  dataType: CustomFieldDataType;
  options?: string[];
  required: boolean;
  defaultValue?: any;
  description?: string;
  active: boolean;
}

export interface WorkflowState {
  id: string;
  code: string;
  label: string;
  isInitial: boolean;
  isTerminal: boolean;
  color: string;
}

export interface WorkflowTransition {
  id: string;
  fromState: string;
  toState: string;
  actionLabel: string;
  requiredRole: string;
  condition?: string;
  requiresReason: boolean;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  entityType: 'PRODUCTION_ORDER' | 'PURCHASE_REQUISITION' | 'QUALITY_INSPECTION';
  name: string;
  description: string;
  active: boolean;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface BusinessRule {
  id: string;
  code: string;
  name: string;
  triggerEvent: 'BEFORE_MO_RELEASE' | 'BEFORE_PO_APPROVAL' | 'ON_SCRAP_REPORT' | 'ON_MATERIAL_ISSUE';
  conditionExpression: string;
  actionType: 'BLOCK_WITH_ERROR' | 'REQUIRE_SUPERVISOR_APPROVAL' | 'CREATE_WARNING' | 'TRIGGER_NOTIFICATION';
  actionMessage: string;
  enabled: boolean;
}

export interface SubcontractOrder {
  id: string;
  orderNo: string;
  operationRef: string;
  productionOrderNo: string;
  supplierId: string;
  supplierName: string;
  materialSent: { sku: string; name: string; quantity: number; uom: string; sentDate: string }[];
  targetQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  status: 'DRAFT' | 'MATERIAL_SENT' | 'IN_PROCESSING' | 'PARTIALLY_RECEIVED' | 'COMPLETED';
  sentDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
}

// ============================================================================
// PHASE 8: NPI, PRODUCT RELEASE & ENGINEERING CHANGE DOMAIN (Master Execution)
// ============================================================================

// 1. ENGINEERING DOCUMENTS (Drawings & Specifications)
export interface EngineeringDrawing {
  id: string;
  drawingNumber: string; // e.g. DWG-ABC-100-A
  revision: string; // Rev A, Rev B
  productId: string;
  productSku: string;
  title: string;
  fileReference?: string;
  cadModelType?: '2D_DWG' | '3D_STEP' | 'PDF_SCHEMATIC';
  description: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'RELEASED' | 'OBSOLETE';
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvalDate?: string;
  effectiveDate?: string;
}

export interface EngineeringSpecification {
  id: string;
  specNumber: string; // e.g. SPEC-ABC-100-A
  revision: string;
  productId: string;
  productSku: string;
  title: string;
  content: string;
  criticalParameters: { parameter: string; nominal: string; tolerance: string }[];
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'RELEASED' | 'OBSOLETE';
  approvedBy?: string;
  approvalDate?: string;
  effectiveDate?: string;
}

// 2. TOOLING DOMAIN
export type ToolType = 'MOLD' | 'JIG' | 'FIXTURE' | 'DIE' | 'CUTTING_TOOL' | 'SPECIAL_SETUP';
export type ToolStatus =
  | 'DESIGN'
  | 'FABRICATION'
  | 'INSPECTION'
  | 'QUALIFICATION'
  | 'READY'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'RETIRED';

export interface ToolingItem {
  id: string;
  toolId: string; // e.g. TOOL-MOLD-001
  name: string;
  type: ToolType;
  productId: string;
  productSku: string;
  revision: string;
  status: ToolStatus;
  location: string;
  owner: string;
  supplier?: string;
  drawingRef?: string;
  capacityPerShift: number;
  expectedLifeShots: number;
  currentShots: number;
  qualifiedBy?: string;
  qualificationDate?: string;
  maintenanceIntervalShots: number;
  approvedBy?: string;
  effectiveDate?: string;
  notes?: string;
}

// 3. WORK INSTRUCTIONS (WI)
export interface WorkInstruction {
  id: string;
  wiNumber: string; // e.g. WI-ABC-100-OP10
  revision: string;
  productId: string;
  productSku: string;
  productRevision: string;
  routingOperationId?: string;
  operationSeq: number;
  operationName: string;
  workCenterId: string;
  workCenterName: string;
  title: string;
  instructions: string[];
  safetyNotes: string[];
  qualityCheckpoints: string[];
  requiredTools: string[];
  requiredMaterials: string[];
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'RELEASED' | 'OBSOLETE';
  approvedBy?: string;
  approvalDate?: string;
  effectiveDate?: string;
}

// 4. QUALITY CONTROL PLAN (QC Plan)
export interface QcInspectionCharacteristic {
  id: string;
  characteristic: string;
  specification: string;
  targetValue?: number;
  toleranceMin?: number;
  toleranceMax?: number;
  measurementMethod: string;
  samplingFrequency: string;
  equipment: string;
  acceptanceCriteria: string;
  reactionPlan: string;
}

export interface QcPlan {
  id: string;
  planNumber: string; // e.g. QCP-ABC-100-A
  revision: string;
  productId: string;
  productSku: string;
  productRevision: string;
  operationSeq: number;
  operationName: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'RELEASED' | 'OBSOLETE';
  characteristics: QcInspectionCharacteristic[];
  approvedBy?: string;
  approvalDate?: string;
  effectiveDate?: string;
}

// 5. MATERIAL REQUEST & LINE DELIVERY (NPI & Normal Production)
export type MaterialRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PICKING'
  | 'READY'
  | 'DELIVERED'
  | 'ISSUED'
  | 'CLOSED';

export interface MaterialRequestItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  requestedQuantity: number;
  pickedQuantity: number;
  deliveredQuantity: number;
  uom: UomCode;
  fromWarehouse: string;
  toLocation: string; // e.g. Line 1 - Staging Bay
  status: 'PENDING' | 'PICKED' | 'DELIVERED';
}

export interface MaterialRequest {
  id: string;
  requestNumber: string; // e.g. MR-2026-001
  sourceType: 'NPI_TRIAL' | 'NPI_PILOT' | 'PRODUCTION_ORDER' | 'MAINTENANCE';
  sourceReferenceId: string; // NPI-2026-001 or MO-2026-00124
  productId?: string;
  productSku?: string;
  requester: string;
  department: string;
  requiredDate: string;
  destinationLine: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: MaterialRequestStatus;
  items: MaterialRequestItem[];
  pickedBy?: string;
  pickedAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  notes?: string;
}

// 6. PRODUCTION READINESS CHECKLIST (6 Pillars)
export type ReadinessPillar =
  | 'ENGINEERING'
  | 'TOOLING'
  | 'PROCESS'
  | 'MATERIAL'
  | 'QUALITY'
  | 'PEOPLE_PRODUCTION';

export interface ReadinessItem {
  id: string;
  pillar: ReadinessPillar;
  checkItem: string;
  status: 'READY' | 'NOT_READY' | 'BLOCKED';
  blockingReason?: string;
  responsibleRole: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ProductionReadinessReport {
  id: string;
  npiProjectId: string;
  productSku: string;
  productRevision: string;
  targetRunType: 'TRIAL' | 'PILOT' | 'NORMAL_PRODUCTION';
  overallStatus: 'READY' | 'NOT_READY' | 'BLOCKED';
  items: ReadinessItem[];
  blockingIssues: string[];
  evaluatedAt: string;
  evaluator: string;
}

// 7. NPI TRIAL & PILOT RUNS
export interface NpiTrialRun {
  id: string;
  trialNumber: string; // e.g. TRL-2026-001
  npiProjectId: string;
  productSku: string;
  productRevision: string;
  bomRevision: string;
  routingRevision: string;
  wiRevision: string;
  toolingRevision: string;
  workCenterId: string;
  workCenterName: string;
  plannedQuantity: number;
  actualQuantity: number;
  goodQuantity: number;
  scrapQuantity: number;
  scrapReason?: string;
  startTime: string;
  endTime: string;
  operators: string[];
  trialResult: 'PASS' | 'FAIL' | 'PASS_WITH_ACTION';
  observations: string;
  correctiveActions?: string;
  inspector: string;
}

export interface NpiPilotRun {
  id: string;
  pilotNumber: string; // e.g. PLT-2026-001
  npiProjectId: string;
  productSku: string;
  productRevision: string;
  plannedQuantity: number;
  actualQuantity: number;
  yieldPercentage: number;
  targetCycleTimeSeconds: number;
  actualCycleTimeSeconds: number;
  cycleTimeStability: 'STABLE' | 'MODERATE' | 'UNSTABLE';
  operatorReadiness: 'READY' | 'NEEDS_TRAINING';
  toolingPerformance: 'OPTIMAL' | 'MINOR_ISSUES' | 'DEFECTIVE';
  bottlenecksIdentified: string;
  pilotResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  remarks: string;
  evaluator: string;
}

// 8. NPI PROJECT
export type NpiStatus =
  | 'DRAFT'
  | 'DEVELOPMENT'
  | 'PROTOTYPE'
  | 'TRIAL'
  | 'PILOT'
  | 'READY_FOR_RELEASE'
  | 'RELEASED'
  | 'BLOCKED';

export interface NpiMilestone {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'OVERDUE';
  responsibleRole: string;
}

export interface NpiProject {
  id: string;
  projectNumber: string; // e.g. NPI-2026-001
  productId: string;
  productSku: string;
  productName: string;
  productRevision: string;
  customer: string;
  projectOwner: string;
  engineeringOwner: string;
  ppicRepresentative: string;
  productionRepresentative: string;
  qualityRepresentative: string;
  toolingRepresentative: string;
  targetReleaseDate: string;
  actualReleaseDate?: string;
  status: NpiStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  milestones: NpiMilestone[];
  notes: string;
  blockingIssues: string[];
  trialRuns: NpiTrialRun[];
  pilotRuns: NpiPilotRun[];
}

// 9. PRODUCT RELEASE PACKAGE (Baseline Freeze)
export interface ReleaseSignOff {
  role: string;
  approver: string;
  approvedAt?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface ProductReleasePackage {
  id: string;
  packageNumber: string; // e.g. REL-PKG-2026-01
  productId: string;
  productSku: string;
  productName: string;
  releasedRevision: string; // e.g. Rev A
  drawingRevision: string;
  specificationRevision: string;
  bomRevision: string;
  routingRevision: string;
  toolingRevision: string;
  wiRevision: string;
  qcPlanRevision: string;
  effectiveDate: string;
  releasedBy: string;
  approvals: ReleaseSignOff[];
  status: 'ACTIVE' | 'SUPERSEDED';
  notes: string;
}

// 10. ENGINEERING CHANGE REQUEST (ECR / ECO)
export type EcrStatus =
  | 'DRAFT'
  | 'IMPACT_ANALYSIS'
  | 'ENGINEERING_REVIEW'
  | 'APPROVED'
  | 'IMPLEMENTATION'
  | 'EFFECTIVE'
  | 'CLOSED'
  | 'REJECTED';

export interface EcrImpactAnalysis {
  bomImpact: boolean;
  routingImpact: boolean;
  wiImpact: boolean;
  qcImpact: boolean;
  toolingImpact: boolean;
  costImpact: boolean;
  customerApprovalRequired: boolean;
  estimatedCostDifference: number; // e.g. +12.50
  affectedOpenWorkOrderIds: string[];
  inventoryOldMaterialRemaining: { sku: string; name: string; stockQty: number; disposition: 'USE_UP' | 'SCRAP' | 'REWORK' }[];
  inventoryNewMaterialRequired: { sku: string; name: string; requiredQty: number }[];
  impactSummary: string;
}

export interface OpenWorkOrderDecision {
  workOrderId: string;
  orderNumber: string;
  productSku: string;
  currentRevision: string;
  progressPercentage: number;
  decision:
    | 'CONTINUE_EXISTING_REV'
    | 'APPLY_NEW_REV'
    | 'HOLD_WORK_ORDER'
    | 'CANCEL_AND_RECREATE'
    | 'ENGINEERING_REVIEW_REQUIRED';
  authorizedBy?: string;
  notes?: string;
}

export interface EngineeringChangeRequest {
  id: string;
  ecrNumber: string; // e.g. ECR-2026-004
  productId: string;
  productSku: string;
  productName: string;
  currentRevision: string; // e.g. Rev A
  proposedRevision: string; // e.g. Rev B
  reason: string;
  requestedBy: string;
  department: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: EcrStatus;
  targetEffectiveDate: string;
  impactAnalysis: EcrImpactAnalysis;
  openWorkOrderDecisions: OpenWorkOrderDecision[];
  approvals: ReleaseSignOff[];
  releasedPackageId?: string;
  createdAt: string;
  effectiveAt?: string;
}

// ============================================================================
// PHASE 9: PPIC PLANNING, FINITE CAPACITY & PRODUCTION SCHEDULING DOMAIN
// ============================================================================

export type MachineStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'BREAKDOWN' | 'OFFLINE';

export interface MachineMaster {
  id: string;
  code: string; // e.g. M01
  name: string; // Cutting Machine
  workCenterId: string;
  workCenterCode: string;
  department: string;
  availableUnits: number; // e.g. 3 units
  standardCycleTimeSeconds: number; // e.g. 30 sec
  efficiencyRate: number; // e.g. 0.85 (85%)
  availabilityRate: number; // e.g. 0.95
  performanceRate: number; // e.g. 0.92
  qualityRate: number; // e.g. 0.98
  hourlyCostRate: number;
  status: MachineStatus;
  maintenanceSchedule?: {
    startDate: string;
    endDate: string;
    reason: string;
    blocksCapacity: boolean;
  }[];
  notes?: string;
}

export interface EmployeeSkill {
  skillName: string;
  level: 1 | 2 | 3 | 4 | 5; // 1: Novice, 5: Expert
}

export interface EmployeeManpower {
  id: string;
  employeeCode: string; // e.g. EMP-001
  name: string;
  role: string;
  department: string;
  skills: EmployeeSkill[];
  qualifiedWorkCenters: string[]; // e.g. ['WC-M01', 'WC-M02']
  assignedShiftId: string;
  dailyWorkingHours: number; // e.g. 8
  overtimeCapable: boolean;
  maxOvertimeHoursPerWeek: number;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ON_LEAVE';
}

export interface ProductionShift {
  id: string;
  code: string; // e.g. SHIFT-1
  name: string; // Shift 1 (Morning)
  startTime: string; // "07:00"
  endTime: string; // "15:00"
  workingHours: number; // 8
  breakMinutes: number; // 60
  overtimeHoursAllowed: number;
  isActive: boolean;
}

export interface ProductionCalendar {
  id: string;
  name: string;
  plantId: string;
  workingDays: number[]; // 1: Mon, 2: Tue, ..., 5: Fri
  shifts: ProductionShift[];
  holidays: string[]; // YYYY-MM-DD
  plannedShutdowns: { startDate: string; endDate: string; reason: string }[];
}

export interface ChangeoverRule {
  id: string;
  fromProductSku: string;
  toProductSku: string;
  changeoverMinutes: number;
  cleaningRequired: boolean;
  toolingChangeRequired: boolean;
  notes?: string;
}

export type FeasibilityState =
  | 'FEASIBLE'
  | 'PARTIALLY_FEASIBLE'
  | 'NOT_FEASIBLE'
  | 'MATERIAL_CONSTRAINED'
  | 'MACHINE_CAPACITY_SHORTAGE'
  | 'MANPOWER_SHORTAGE'
  | 'TOOLING_SHORTAGE'
  | 'SCHEDULE_CONFLICT';

export interface ProductionPlanItem {
  id: string;
  planNumber: string; // e.g. PLAN-2026-W43-01
  periodWeek: string; // e.g. "Week 43 - Oct 2026"
  demandRef: string; // e.g. DEM-2026-5001
  productId: string;
  productSku: string;
  productName: string;
  demandQty: number; // e.g. 5,000 pcs
  plannedQty: number; // e.g. 5,000 or 3,500 pcs
  unfulfilledQty: number;
  feasibility: FeasibilityState;
  constraintNotes?: string;
  targetStartDate: string;
  targetEndDate: string;
  status: 'DRAFT' | 'ANALYZING' | 'FEASIBILITY_REVIEW' | 'CONFIRMED' | 'DISPATCHED';
  generatedWorkOrderId?: string;
}

export interface FiniteScheduledSlot {
  id: string;
  scheduleNo: string; // e.g. SCHED-101
  productionOrderId?: string;
  orderNumber?: string;
  demandRef?: string;
  productId: string;
  productSku: string;
  productName: string;
  targetQty: number;
  operationSeq: number; // 10, 20, 30
  operationName: string;
  workCenterCode: string;
  machineCode: string; // e.g. M01
  machineUnitsAllocated: number; // e.g. 3 machines
  manpowerRequired: number; // e.g. 6 operators
  manpowerAssigned: string[];
  toolingRequired?: string;
  startDateTime: string; // "2026-10-26 07:00"
  endDateTime: string; // "2026-10-27 15:00"
  durationMinutes: number;
  setupMinutes: number;
  changeoverMinutes: number;
  processingMinutes: number;
  expectedOutput: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFLICT' | 'BLOCKED';
  conflictReason?: string;
}

export interface WhatIfScenario {
  id: string;
  name: string; // e.g. "Scenario B: +1 Machine (3 units)"
  description: string;
  targetProductSku: string;
  targetDemandQty: number;
  dueDate: string;
  machineOverrides: { machineCode: string; quantity: number }[];
  shiftHoursOverride?: number; // e.g. 10 hours (2h overtime)
  extraShiftActive?: boolean; // e.g. 2 shifts
  useAlternativeMachine?: boolean;
  // Computed values
  computedOutputRatePcsPerHour: number;
  computedGrossCapacityPerDay: number;
  computedEffectiveCapacityPerDay: number;
  computedProductionDurationHours: number;
  computedCompletionDate: string;
  computedManpowerRequirement: number;
  computedManpowerShortage: number;
  computedMaterialShortages: { sku: string; required: number; shortage: number }[];
  feasibilityState: FeasibilityState;
  comparisonVsBaselineDays: number;
}

export interface BottleneckAnalysisResult {
  operationSeq: number;
  operationName: string;
  workCenterCode: string;
  workCenterName: string;
  machineCode: string;
  cycleTimeSeconds: number;
  outputRatePerHour: number;
  dailyCapacityUnits: number;
  requiredCapacityUnits: number;
  utilizationPct: number;
  isBottleneck: boolean;
  deficitHours: number;
  recommendation: string;
}

export interface MultiLevelBomNode {
  level: number;
  productId: string;
  productSku: string;
  productName: string;
  type: ProductType;
  quantityPerUnit: number;
  totalRequiredQty: number;
  uom: UomCode;
  onHandStock: number;
  allocatedStock: number;
  availableStock: number;
  incomingStock: number;
  safetyStock: number;
  netRequirement: number;
  shortageQty: number;
  status: 'AVAILABLE' | 'PARTIAL' | 'SHORTAGE' | 'DELAYED';
  children?: MultiLevelBomNode[];
}


