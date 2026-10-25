import { useState, useEffect, useCallback } from 'react';
import {
  Product,
  BillOfMaterials,
  Routing,
  WorkCenter,
  ReasonCode,
  DemandRecord,
  MpsRecord,
  ProductionOrder,
  QualityInspection,
  NonConformanceReport,
  ReworkOrder,
  StockMovement,
  MaterialReservation,
  MaterialConsumption,
  ProductionOutputReceipt,
  WorkCenterCapacityLoad,
  DowntimeEvent,
  CostVarianceRecord,
  AuditLogEntry,
  TestingScenario,
  MrpItemRequirement,
  OutputLogEntry,
  Supplier,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  StockBucket,
  FeatureRegistryItem,
  FeatureStatus,
  CustomFieldDefinition,
  WorkflowDefinition,
  BusinessRule,
  SubcontractOrder,
  EngineeringDrawing,
  EngineeringSpecification,
  ToolingItem,
  WorkInstruction,
  QcPlan,
  MaterialRequest,
  ProductionReadinessReport,
  NpiProject,
  NpiStatus,
  NpiTrialRun,
  NpiPilotRun,
  ProductReleasePackage,
  EngineeringChangeRequest,
  OpenWorkOrderDecision,
  ToolStatus,
  MachineMaster,
  MachineStatus,
  EmployeeManpower,
  ProductionShift,
  ProductionCalendar,
  ChangeoverRule,
  ProductionPlanItem,
  FiniteScheduledSlot,
  WhatIfScenario,
  BottleneckAnalysisResult,
  MultiLevelBomNode,
  FeasibilityState,
} from '../../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_BOMS,
  INITIAL_ROUTINGS,
  INITIAL_WORK_CENTERS,
  INITIAL_REASON_CODES,
  INITIAL_DEMANDS,
  INITIAL_MPS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_QUALITY_INSPECTIONS,
  INITIAL_NCRS,
  INITIAL_REWORK_ORDERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_DOWNTIME_EVENTS,
  INITIAL_COST_VARIANCES,
  INITIAL_AUDIT_LOGS,
  INITIAL_TESTING_SCENARIOS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_REQUISITIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_GOODS_RECEIPTS,
  INITIAL_FEATURE_REGISTRY,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_WORKFLOWS,
  INITIAL_BUSINESS_RULES,
  INITIAL_SUBCONTRACT_ORDERS,
  INITIAL_DRAWINGS,
  INITIAL_SPECIFICATIONS,
  INITIAL_TOOLING_ITEMS,
  INITIAL_WORK_INSTRUCTIONS,
  INITIAL_QC_PLANS,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_PRODUCTION_READINESS,
  INITIAL_NPI_PROJECTS,
  INITIAL_RELEASE_PACKAGES,
  INITIAL_ENGINEERING_CHANGES,
  INITIAL_MACHINES,
  INITIAL_MANPOWER,
  INITIAL_SHIFTS,
  INITIAL_CALENDARS,
  INITIAL_CHANGEOVER_RULES,
  INITIAL_PRODUCTION_PLANS,
  INITIAL_FINITE_SCHEDULES,
  INITIAL_WHAT_IF_SCENARIOS,
} from '../mockData';
import { runMRPCalculation } from '../calculations/mrpCalculator';
import {
  calculateOutputRate,
  calculateMachineCapacity,
  calculateRequiredMachineHours,
  calculateManpowerRequirement,
  explodeMultiLevelBom,
  analyzeBottlenecks,
  evaluateProductionFeasibility,
} from '../../modules/planning/planningService';
import {
  calculateChangeoverTime,
  generateFiniteScheduleSlots,
} from '../../modules/scheduling/schedulingService';
import { buildWhatIfScenarios } from '../../modules/scheduling/whatIfScenarioFactory';
import {
  runTestingScenario as executeTestingScenario,
  summarizeTestingMatrix,
} from '../../modules/testing/testingService';
import {
  LEGACY_ERP_STORAGE_KEY,
  UI_PREFERENCES_STORAGE_KEY,
  loadLegacyErpState,
  loadUiPreferences,
  saveLegacyErpState,
  saveUiPreferences,
} from '../persistence/erpStorageAdapter';
import { checkMaterialAvailability as checkMaterialAvailabilityForBom } from '../../modules/manufacturing/productionService';
import { evaluateProductionRelease } from '../../modules/manufacturing/productionReleaseService';
import { buildProductionOrderDraft } from '../../modules/manufacturing/productionOrderFactory';
import { evaluateProductionReadiness } from '../../modules/manufacturing/productionReadinessEvaluator';
import {
  releaseProductionOrderForExecution,
  startProductionOperation,
  completeProductionOperation,
  closeProductionOrderExecution,
  reportProductionOutputForExecution,
} from '../../modules/manufacturing/productionExecutionService';
import {
  reportMachineBreakdown as reportMachineBreakdownInDomain,
  resolveMachineBreakdown as resolveMachineBreakdownInDomain,
} from '../../modules/manufacturing/machineDowntimeService';
import { issueMaterialToProduction as issueMaterialToProductionForInventory } from '../../modules/inventory/inventoryService';
import { evaluateMaterialRequestDelivery } from '../../modules/inventory/materialRequestService';
import { buildProductionPlanFromDemand } from '../../modules/planning/productionPlanFactory';
import { dispatchProductionPlan } from '../../modules/planning/productionPlanDispatchService';
import { buildFiniteScheduleFromDemand } from '../../modules/scheduling/finiteScheduleFactory';
import {
  createMaterialRequest as createMaterialRequestInDomain,
  pickMaterialRequest as pickMaterialRequestInDomain,
} from '../../modules/manufacturing/materialRequestLifecycleService';
import {
  evaluatePurchaseOrderDraft,
  evaluatePurchaseRequisitionApproval,
  rejectPurchaseRequisitionDecision,
} from '../../modules/procurement/procurementService';
import { evaluateGoodsReceipt } from '../../modules/procurement/goodsReceiptService';

export interface ErpState {
  products: Product[];
  boms: BillOfMaterials[];
  routings: Routing[];
  workCenters: WorkCenter[];
  reasonCodes: ReasonCode[];
  demands: DemandRecord[];
  mpsRecords: MpsRecord[];
  productionOrders: ProductionOrder[];
  inspections: QualityInspection[];
  ncrs: NonConformanceReport[];
  reworkOrders: ReworkOrder[];
  stockMovements: StockMovement[];
  downtimeEvents: DowntimeEvent[];
  costVariances: CostVarianceRecord[];
  auditLogs: AuditLogEntry[];
  testingScenarios: TestingScenario[];
  suppliers: Supplier[];
  purchaseRequisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceiptNotes: GoodsReceiptNote[];
  featureRegistry: FeatureRegistryItem[];
  customFields: CustomFieldDefinition[];
  workflows: WorkflowDefinition[];
  businessRules: BusinessRule[];
  subcontractOrders: SubcontractOrder[];
  // Phase 8: NPI & Engineering Change Collections
  drawings: EngineeringDrawing[];
  specifications: EngineeringSpecification[];
  toolingItems: ToolingItem[];
  workInstructions: WorkInstruction[];
  qcPlans: QcPlan[];
  materialRequests: MaterialRequest[];
  readinessReports: Record<string, ProductionReadinessReport>;
  npiProjects: NpiProject[];
  productReleases: ProductReleasePackage[];
  engineeringChanges: EngineeringChangeRequest[];
  // Phase 9: PPIC Planning, Finite Capacity & Scheduling
  machines: MachineMaster[];
  manpower: EmployeeManpower[];
  productionCalendars: ProductionCalendar[];
  productionShifts: ProductionShift[];
  changeoverMatrix: ChangeoverRule[];
  productionPlans: ProductionPlanItem[];
  finiteSchedules: FiniteScheduledSlot[];
  whatIfScenarios: WhatIfScenario[];
  customValues: Record<string, Record<string, any>>;
  selectedPlant: string;
  activeOrderFilter: string;
  currentUser: { name: string; role: string; id: string };
  notifications: { id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string; timestamp: string }[];
}

const getInitialState = (): ErpState => {
  const uiPreferences = loadUiPreferences();
  const legacyState = loadLegacyErpState() as Partial<ErpState> | null;

  const baseState: ErpState = {
    products: INITIAL_PRODUCTS,
    boms: INITIAL_BOMS,
    routings: INITIAL_ROUTINGS,
    workCenters: INITIAL_WORK_CENTERS,
    reasonCodes: INITIAL_REASON_CODES,
    demands: INITIAL_DEMANDS,
    mpsRecords: INITIAL_MPS,
    productionOrders: INITIAL_PRODUCTION_ORDERS,
    inspections: INITIAL_QUALITY_INSPECTIONS,
    ncrs: INITIAL_NCRS,
    reworkOrders: INITIAL_REWORK_ORDERS,
    stockMovements: INITIAL_STOCK_MOVEMENTS,
    downtimeEvents: INITIAL_DOWNTIME_EVENTS,
    costVariances: INITIAL_COST_VARIANCES,
    auditLogs: INITIAL_AUDIT_LOGS,
    testingScenarios: INITIAL_TESTING_SCENARIOS,
    suppliers: INITIAL_SUPPLIERS,
    purchaseRequisitions: INITIAL_PURCHASE_REQUISITIONS,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
    goodsReceiptNotes: INITIAL_GOODS_RECEIPTS,
    featureRegistry: INITIAL_FEATURE_REGISTRY,
    customFields: INITIAL_CUSTOM_FIELDS,
    workflows: INITIAL_WORKFLOWS,
    businessRules: INITIAL_BUSINESS_RULES,
    subcontractOrders: INITIAL_SUBCONTRACT_ORDERS,
    drawings: INITIAL_DRAWINGS,
    specifications: INITIAL_SPECIFICATIONS,
    toolingItems: INITIAL_TOOLING_ITEMS,
    workInstructions: INITIAL_WORK_INSTRUCTIONS,
    qcPlans: INITIAL_QC_PLANS,
    materialRequests: INITIAL_MATERIAL_REQUESTS,
    readinessReports: INITIAL_PRODUCTION_READINESS,
    npiProjects: INITIAL_NPI_PROJECTS,
    productReleases: INITIAL_RELEASE_PACKAGES,
    engineeringChanges: INITIAL_ENGINEERING_CHANGES,
    machines: INITIAL_MACHINES,
    manpower: INITIAL_MANPOWER,
    productionCalendars: INITIAL_CALENDARS,
    productionShifts: INITIAL_SHIFTS,
    changeoverMatrix: INITIAL_CHANGEOVER_RULES,
    productionPlans: INITIAL_PRODUCTION_PLANS,
    finiteSchedules: INITIAL_FINITE_SCHEDULES,
    whatIfScenarios: INITIAL_WHAT_IF_SCENARIOS,
    customValues: {
      'prd-001': { materialGrade: 'AISI 304 / AL 6061', thicknessMm: 2.5, rohsCompliant: true, drawingNumber: 'DWG-KRX-2026-08' },
      'mo-124': { customerProject: 'PRJ-AEROSPACE-90', priorityReason: 'Standard Schedule', targetProductionLine: 'Cell A - High Precision' },
    },
    selectedPlant: uiPreferences.selectedPlant,
    activeOrderFilter: uiPreferences.activeOrderFilter,
    currentUser: uiPreferences.currentUser,
    notifications: [
      {
        id: 'notif-p92',
        type: 'warning',
        message: 'Material Y deficit for MO-2026-00124 (2,700/3,000 available). Page 93 override active.',
        timestamp: 'Just now',
      },
    ],
  };

  if (!legacyState) {
    return baseState;
  }

  return {
    ...baseState,
    ...legacyState,
    products: Array.isArray(legacyState.products) && legacyState.products.length ? legacyState.products : baseState.products,
    suppliers: Array.isArray(legacyState.suppliers) && legacyState.suppliers.length ? legacyState.suppliers : baseState.suppliers,
    purchaseRequisitions: Array.isArray(legacyState.purchaseRequisitions) && legacyState.purchaseRequisitions.length ? legacyState.purchaseRequisitions : baseState.purchaseRequisitions,
    purchaseOrders: Array.isArray(legacyState.purchaseOrders) && legacyState.purchaseOrders.length ? legacyState.purchaseOrders : baseState.purchaseOrders,
    goodsReceiptNotes: Array.isArray(legacyState.goodsReceiptNotes) && legacyState.goodsReceiptNotes.length ? legacyState.goodsReceiptNotes : baseState.goodsReceiptNotes,
    featureRegistry: Array.isArray(legacyState.featureRegistry) && legacyState.featureRegistry.length ? legacyState.featureRegistry : baseState.featureRegistry,
    customFields: Array.isArray(legacyState.customFields) && legacyState.customFields.length ? legacyState.customFields : baseState.customFields,
    workflows: Array.isArray(legacyState.workflows) && legacyState.workflows.length ? legacyState.workflows : baseState.workflows,
    businessRules: Array.isArray(legacyState.businessRules) && legacyState.businessRules.length ? legacyState.businessRules : baseState.businessRules,
    subcontractOrders: Array.isArray(legacyState.subcontractOrders) && legacyState.subcontractOrders.length ? legacyState.subcontractOrders : baseState.subcontractOrders,
    drawings: Array.isArray(legacyState.drawings) && legacyState.drawings.length ? legacyState.drawings : baseState.drawings,
    specifications: Array.isArray(legacyState.specifications) && legacyState.specifications.length ? legacyState.specifications : baseState.specifications,
    toolingItems: Array.isArray(legacyState.toolingItems) && legacyState.toolingItems.length ? legacyState.toolingItems : baseState.toolingItems,
    workInstructions: Array.isArray(legacyState.workInstructions) && legacyState.workInstructions.length ? legacyState.workInstructions : baseState.workInstructions,
    qcPlans: Array.isArray(legacyState.qcPlans) && legacyState.qcPlans.length ? legacyState.qcPlans : baseState.qcPlans,
    materialRequests: Array.isArray(legacyState.materialRequests) && legacyState.materialRequests.length ? legacyState.materialRequests : baseState.materialRequests,
    readinessReports: legacyState.readinessReports || baseState.readinessReports,
    npiProjects: Array.isArray(legacyState.npiProjects) && legacyState.npiProjects.length ? legacyState.npiProjects : baseState.npiProjects,
    productReleases: Array.isArray(legacyState.productReleases) && legacyState.productReleases.length ? legacyState.productReleases : baseState.productReleases,
    engineeringChanges: Array.isArray(legacyState.engineeringChanges) && legacyState.engineeringChanges.length ? legacyState.engineeringChanges : baseState.engineeringChanges,
    machines: Array.isArray(legacyState.machines) && legacyState.machines.length ? legacyState.machines : baseState.machines,
    manpower: Array.isArray(legacyState.manpower) && legacyState.manpower.length ? legacyState.manpower : baseState.manpower,
    productionCalendars: Array.isArray(legacyState.productionCalendars) && legacyState.productionCalendars.length ? legacyState.productionCalendars : baseState.productionCalendars,
    productionShifts: Array.isArray(legacyState.productionShifts) && legacyState.productionShifts.length ? legacyState.productionShifts : baseState.productionShifts,
    changeoverMatrix: Array.isArray(legacyState.changeoverMatrix) && legacyState.changeoverMatrix.length ? legacyState.changeoverMatrix : baseState.changeoverMatrix,
    productionPlans: Array.isArray(legacyState.productionPlans) && legacyState.productionPlans.length ? legacyState.productionPlans : baseState.productionPlans,
    finiteSchedules: Array.isArray(legacyState.finiteSchedules) && legacyState.finiteSchedules.length ? legacyState.finiteSchedules : baseState.finiteSchedules,
    whatIfScenarios: Array.isArray(legacyState.whatIfScenarios) && legacyState.whatIfScenarios.length ? legacyState.whatIfScenarios : baseState.whatIfScenarios,
    testingScenarios: baseState.testingScenarios,
    customValues: legacyState.customValues || baseState.customValues,
    selectedPlant: uiPreferences.selectedPlant,
    activeOrderFilter: uiPreferences.activeOrderFilter,
    currentUser: uiPreferences.currentUser,
    notifications: Array.isArray(legacyState.notifications) && legacyState.notifications.length ? legacyState.notifications : baseState.notifications,
  };
};

export function useErpStore() {
  const [state, setState] = useState<ErpState>(getInitialState);

  useEffect(() => {
    // Temporary migration adapter: the ERP state is still persisted locally while
    // the backend repository layer and database-backed source of truth are introduced.
    saveLegacyErpState(state as unknown as Record<string, unknown>);
    saveUiPreferences({
      selectedPlant: state.selectedPlant,
      activeOrderFilter: state.activeOrderFilter,
      currentUser: state.currentUser,
      notifications: state.notifications,
    });
  }, [state]);

  const addNotification = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications].slice(0, 15),
    }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const setPlant = useCallback((plantId: string) => {
    setState((prev) => ({ ...prev, selectedPlant: plantId }));
  }, []);

  // Post Audit Log Entry (Page 88-91)
  const logAudit = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newLog: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: timeStr,
    };
    setState((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  }, []);

  // 1. checkMaterialAvailability (Page 93)
  const checkMaterialAvailability = useCallback((productId: string, quantity: number) => {
    const bom = state.boms.find((b) => b.productId === productId && b.status === 'ACTIVE');
    return checkMaterialAvailabilityForBom(state.products, bom, quantity);
  }, [state.boms, state.products]);

  // 2. releaseProductionOrder (Page 93 & Page 112)
  const releaseProductionOrder = useCallback((orderId: string, overrideReason?: string) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const decision = releaseProductionOrderForExecution(order, prev.currentUser.name, prev.currentUser.role, overrideReason);
      if (!decision.allowed || !decision.updatedOrder || !decision.auditLog) {
        return prev;
      }

      return {
        ...prev,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? decision.updatedOrder! : o)),
        auditLogs: [decision.auditLog, ...prev.auditLogs],
      };
    });

    addNotification('success', `Production order ${orderId} has been RELEASED.`);
  }, [addNotification]);

  // 3. startWorkOrder (Page 96 & 112)
  const startWorkOrder = useCallback((orderId: string, operationSequence: number, operatorName: string) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const decision = startProductionOperation(order, operationSequence, operatorName);
      if (!decision.allowed || !decision.updatedOrder || !decision.auditLog) {
        return prev;
      }

      const op = order.operations.find((o) => o.sequence === operationSequence);
      const updatedWorkCenters = op
        ? prev.workCenters.map((wc) => {
            if (wc.id === op.workCenterId) {
              return {
                ...wc,
                status: 'RUNNING' as const,
                currentWorkOrderId: op.workOrderNo,
                currentOperator: operatorName,
              };
            }
            return wc;
          })
        : prev.workCenters;

      return {
        ...prev,
        workCenters: updatedWorkCenters,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? decision.updatedOrder! : o)),
        auditLogs: [decision.auditLog, ...prev.auditLogs],
      };
    });

    addNotification('info', `Operation ${operationSequence} is now IN PROGRESS.`);
  }, [addNotification]);

  // 4. reportProductionOutput & Immutable Stock Movement (Page 94, 99 & 112)
  const reportProductionOutput = useCallback((
    orderId: string,
    operationSequence: number,
    goodQty: number,
    scrapQty: number,
    reasonCode: string | undefined,
    operator: string,
    notes?: string
  ) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const decision = reportProductionOutputForExecution(
        order,
        operationSequence,
        goodQty,
        scrapQty,
        reasonCode,
        operator,
        notes
      );

      if (!decision.allowed || !decision.updatedOrder || !decision.auditLog) {
        return prev;
      }

      return {
        ...prev,
        stockMovements: [...(decision.stockMovements ?? []), ...prev.stockMovements],
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? decision.updatedOrder! : o)),
        auditLogs: [decision.auditLog, ...prev.auditLogs],
      };
    });

    addNotification('success', `Recorded output: ${goodQty} Good, ${scrapQty} Scrap. Stock movement posted.`);
  }, [addNotification]);

  // 5. completeWorkOrder (Page 96 & 112)
  const completeWorkOrder = useCallback((orderId: string, operationSequence: number) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const op = order.operations.find((o) => o.sequence === operationSequence);
      if (!op) return prev;

      const decision = completeProductionOperation(order, operationSequence, prev.currentUser.name, prev.currentUser.role);
      if (!decision.allowed || !decision.updatedOrder || !decision.auditLog) {
        return prev;
      }

      const updatedWorkCenters = prev.workCenters.map((wc) => {
        if (wc.id === op.workCenterId) {
          return {
            ...wc,
            status: 'AVAILABLE' as const,
            currentWorkOrderId: undefined,
            currentOperator: undefined,
          };
        }
        return wc;
      });

      return {
        ...prev,
        workCenters: updatedWorkCenters,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? decision.updatedOrder! : o)),
        auditLogs: [decision.auditLog, ...prev.auditLogs],
      };
    });

    addNotification('success', `Operation ${operationSequence} marked as COMPLETED.`);
  }, [addNotification]);

  // 6. closeProductionOrder (Page 109 & 112)
  const closeProductionOrder = useCallback((orderId: string) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const decision = closeProductionOrderExecution(order, prev.currentUser.name, prev.currentUser.role);
      if (!decision.allowed || !decision.updatedOrder || !decision.auditLog) {
        return prev;
      }

      return {
        ...prev,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? decision.updatedOrder! : o)),
        auditLogs: [decision.auditLog, ...prev.auditLogs],
      };
    });

    addNotification('success', `Production order ${orderId} CLOSED and costs settled.`);
  }, [addNotification]);

  // 7. createProductionOrder (Page 40-43, 93 & NPI Release Gate BR-NPI-001)
  const createProductionOrder = useCallback((data: {
    productId: string;
    quantity: number;
    dueDate: string;
  }) => {
    const product = state.products.find((p) => p.id === data.productId);
    if (!product) return null;

    if (product.lifecycleStatus && product.lifecycleStatus !== 'RELEASED') {
      const errorMsg = `Action Blocked (BR-NPI-001): Product ${product.sku} is in '${product.lifecycleStatus}' stage. Normal commercial production orders can only be dispatched for products in 'RELEASED' status. To produce pre-production units, initiate an NPI Trial Run under NPI Management or approve the Product Release Package.`;
      addNotification('error', errorMsg);
      return null;
    }

    const bom = state.boms.find((b) => b.productId === data.productId && b.status === 'ACTIVE') || state.boms[0];
    const routing = state.routings.find((r) => r.productId === data.productId && r.status === 'ACTIVE') || state.routings[0];
    const activeRelease = state.productReleases?.find((r) => r.productId === product.id && r.status === 'ACTIVE');
    const orderNum = `MO-2026-00${126 + state.productionOrders.length}`;

    const newOrder = buildProductionOrderDraft({
      product,
      bom,
      routing,
      quantity: data.quantity,
      dueDate: data.dueDate,
      orderNumber: orderNum,
      plantId: 'PLANT-01',
      plantName: 'Cikarang Main Plant #1',
      releasePackage: activeRelease,
      createdAt: new Date().toISOString().split('T')[0],
      productCatalog: state.products,
    });

    setState((prev) => ({
      ...prev,
      productionOrders: [newOrder, ...prev.productionOrders],
    }));

    addNotification('success', `Created Planned Order ${orderNum} for ${data.quantity} units of ${product.sku} (Snapshot: ${newOrder.productRevision}, BOM: ${newOrder.bomRevision}).`);
    return newOrder;
  }, [state.products, state.boms, state.routings, state.productReleases, state.productionOrders.length, addNotification]);

  // 8. reportMachineBreakdown (Page 101)
  const reportMachineBreakdown = useCallback((
    workCenterCode: string,
    reason: string,
    equipmentName: string,
    durationMinutes: number
  ) => {
    const decision = reportMachineBreakdownInDomain(workCenterCode, reason, equipmentName, durationMinutes);

    setState((prev) => ({
      ...prev,
      downtimeEvents: [decision.event, ...prev.downtimeEvents],
      workCenters: prev.workCenters.map((wc) =>
        wc.code === workCenterCode ? { ...wc, status: decision.workCenterStatus } : wc
      ),
    }));

    addNotification('error', `Machine Breakdown flagged on ${workCenterCode}: ${reason}. Ticket ${decision.event.maintenanceTicketNo} opened.`);
  }, [addNotification]);

  // 9. resolveMachineBreakdown (Page 101)
  const resolveMachineBreakdown = useCallback((eventId: string) => {
    setState((prev) => {
      const evt = prev.downtimeEvents.find((e) => e.id === eventId);
      if (!evt) return prev;

      const decision = resolveMachineBreakdownInDomain(evt);

      return {
        ...prev,
        downtimeEvents: prev.downtimeEvents.map((e) =>
          e.id === eventId ? decision.event : e
        ),
        workCenters: prev.workCenters.map((wc) =>
          wc.code === evt.workCenterCode ? { ...wc, status: decision.workCenterStatus } : wc
        ),
      };
    });

    addNotification('success', 'Machine repair completed. Work Center restored to AVAILABLE.');
  }, [addNotification]);

  // 10. Run MRP Calculation (Page 92)
  const runMRP = useCallback((): MrpItemRequirement[] => {
    const results = runMRPCalculation(state.demands, state.products, state.boms);
    addNotification('info', `MRP engine executed: calculated net requirements with Page 92 formula for ${results.length} items.`);
    return results;
  }, [state.demands, state.products, state.boms, addNotification]);

  // 11. Run Testing Matrix Scenario (Page 114)
  const runTestingScenario = useCallback((scenarioId: string) => {
    setState((prev) => ({
      ...prev,
      testingScenarios: prev.testingScenarios.map((sc) =>
        sc.id === scenarioId ? executeTestingScenario(sc) : sc
      ),
    }));
    addNotification('success', `Testing Scenario ${scenarioId} executed successfully: Expected domain result validated.`);
  }, [addNotification]);

  // 12. Create Purchase Requisition (UC-PRC-001 & BR-GLOBAL-002)
  const createPurchaseRequisition = useCallback(
    (data: {
      requesterName: string;
      department: string;
      requiredDate: string;
      reason: string;
      items: {
        productId: string;
        quantity: number;
        estimatedPrice: number;
        supplierPreferred?: string;
      }[];
    }) => {
      const prSeq = (state.purchaseRequisitions.length + 1).toString().padStart(6, '0');
      const prNumber = `PR-2026-${prSeq}`;
      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      let totalAmount = 0;
      const prItems = data.items.map((item, idx) => {
        const prod = state.products.find((p) => p.id === item.productId);
        const cost = item.quantity * item.estimatedPrice;
        totalAmount += cost;
        return {
          id: `pri-${Date.now()}-${idx}`,
          productId: item.productId,
          sku: prod ? prod.sku : 'SKU-UNKNOWN',
          name: prod ? prod.name : 'Unknown Material',
          quantity: item.quantity,
          uom: prod ? prod.baseUom : 'PCS',
          estimatedPrice: item.estimatedPrice,
          totalCost: cost,
          supplierPreferred: item.supplierPreferred,
        };
      });

      // Tiered Approval Engine:
      // < 10M => Level 1 (Dept Supervisor)
      // 10M - 100M => Level 2 (Plant Manager)
      // > 100M => Level 3 (Operations Director)
      let approvalLevel: 1 | 2 | 3 = 1;
      if (totalAmount > 100000000) {
        approvalLevel = 3;
      } else if (totalAmount >= 10000000) {
        approvalLevel = 2;
      }

      const newPR: PurchaseRequisition = {
        id: `pr-${Date.now()}`,
        prNumber,
        requesterId: state.currentUser.id || 'usr-001',
        requesterName: data.requesterName || state.currentUser.name,
        department: data.department || 'Operations',
        requiredDate: data.requiredDate,
        reason: data.reason,
        plantId: state.selectedPlant,
        status: 'PENDING_APPROVAL',
        totalAmount,
        approvalLevelRequired: approvalLevel,
        items: prItems,
        createdAt: timeStr,
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: prNumber,
        documentType: 'PURCHASE_REQUISITION',
        action: 'CREATE_PR',
        actor: newPR.requesterName,
        role: state.currentUser.role,
        timestamp: timeStr,
        newStatus: 'PENDING_APPROVAL',
        decision: 'EXECUTED',
        reason: `Created PR ${prNumber} with Total Rp ${totalAmount.toLocaleString('id-ID')}. Assigned to Approval Level ${approvalLevel}.`,
      };

      setState((prev) => ({
        ...prev,
        purchaseRequisitions: [newPR, ...prev.purchaseRequisitions],
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification('success', `Created PR ${prNumber} (Total: Rp ${totalAmount.toLocaleString('id-ID')}, Level ${approvalLevel} Approval).`);
      return newPR;
    },
    [state.purchaseRequisitions.length, state.products, state.currentUser, state.selectedPlant, addNotification]
  );

  // 13. Approve Purchase Requisition (UC-PRC-002 & BR-PRC-002 SoD Enforcement)
  const approvePurchaseRequisition = useCallback(
    (prId: string, approverName?: string, approverRole?: string): { success: boolean; error?: string } => {
      const pr = state.purchaseRequisitions.find((p) => p.id === prId);
      if (!pr) return { success: false, error: 'PR not found' };

      const activeUser = approverName || state.currentUser.name;
      const activeRole = approverRole || state.currentUser.role;

      const approvalGate = evaluatePurchaseRequisitionApproval(pr, activeUser, activeRole, 'Manager');

      if (!approvalGate.allowed) {
        const errorMsg = approvalGate.reason || 'Approval is not permitted for this request.';
        addNotification('error', errorMsg);
        return { success: false, error: errorMsg };
      }

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: pr.prNumber,
        documentType: 'PURCHASE_REQUISITION',
        action: 'APPROVE_PR',
        actor: activeUser,
        role: activeRole,
        timestamp: timeStr,
        oldStatus: pr.status,
        newStatus: 'APPROVED',
        decision: 'APPROVED',
        reason: `Approved Level ${pr.approvalLevelRequired} Purchase Requisition after verifying budget and necessity.`,
      };

      setState((prev) => ({
        ...prev,
        purchaseRequisitions: prev.purchaseRequisitions.map((p) =>
          p.id === prId
            ? {
                ...p,
                status: 'APPROVED' as const,
                approvedBy: `${activeUser} (${activeRole})`,
                approvedAt: timeStr,
              }
            : p
        ),
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification('success', `Purchase Requisition ${pr.prNumber} has been APPROVED by ${activeUser}. Ready for PO creation.`);
      return { success: true };
    },
    [state.purchaseRequisitions, state.currentUser, addNotification]
  );

  // 14. Reject Purchase Requisition (UC-PRC-002)
  const rejectPurchaseRequisition = useCallback(
    (prId: string, reason: string): { success: boolean; error?: string } => {
      const pr = state.purchaseRequisitions.find((p) => p.id === prId);
      if (!pr) return { success: false, error: 'PR not found' };

      const rejectionDecision = rejectPurchaseRequisitionDecision(pr, state.currentUser.name, state.currentUser.role, reason, 'Manager');
      if (!rejectionDecision.allowed) {
        const errorMsg = rejectionDecision.reason || 'Rejection is not permitted for this request.';
        addNotification('error', errorMsg);
        return { success: false, error: errorMsg };
      }

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: pr.prNumber,
        documentType: 'PURCHASE_REQUISITION',
        action: 'REJECT_PR',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: timeStr,
        oldStatus: pr.status,
        newStatus: 'REJECTED',
        decision: 'REJECTED',
        reason,
      };

      setState((prev) => ({
        ...prev,
        purchaseRequisitions: prev.purchaseRequisitions.map((p) =>
          p.id === prId
            ? {
                ...p,
                status: 'REJECTED' as const,
                rejectionReason: reason,
              }
            : p
        ),
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification('warning', `PR ${pr.prNumber} REJECTED. Reason recorded: ${reason}`);
      return { success: true };
    },
    [state.purchaseRequisitions, state.currentUser, addNotification]
  );

  // 15. Create Purchase Order (UC-PRC-003)
  const createPurchaseOrder = useCallback(
    (data: {
      prId?: string;
      supplierId: string;
      expectedDeliveryDate: string;
      paymentTerms: string;
      destinationWarehouse: string;
      items: {
        productId: string;
        orderedQty: number;
        unitPrice: number;
        qcRequired: boolean;
      }[];
    }) => {
      const draftEvaluation = evaluatePurchaseOrderDraft(data);
      if (!draftEvaluation.allowed) {
        addNotification('error', draftEvaluation.reason || 'Purchase order draft is invalid.');
        return null;
      }

      const poSeq = (state.purchaseOrders.length + 1).toString().padStart(6, '0');
      const poNumber = `PO-2026-${poSeq}`;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = `${today} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const supplier = state.suppliers.find((s) => s.id === data.supplierId) || state.suppliers[0];
      const prRef = data.prId ? state.purchaseRequisitions.find((p) => p.id === data.prId) : undefined;

      let totalAmount = 0;
      const poItems = data.items.map((item, idx) => {
        const prod = state.products.find((p) => p.id === item.productId);
        const lineTotal = item.orderedQty * item.unitPrice;
        totalAmount += lineTotal;
        return {
          id: `poi-${Date.now()}-${idx}`,
          productId: item.productId,
          sku: prod ? prod.sku : 'SKU-UNKNOWN',
          name: prod ? prod.name : 'Component Item',
          orderedQty: item.orderedQty,
          receivedQty: 0,
          unitPrice: item.unitPrice,
          totalAmount: lineTotal,
          uom: prod ? prod.baseUom : 'PCS',
          qcRequired: item.qcRequired,
        };
      });

      totalAmount = draftEvaluation.totalAmount;

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber,
        prReference: prRef?.prNumber,
        prId: data.prId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        orderDate: today,
        expectedDeliveryDate: data.expectedDeliveryDate,
        paymentTerms: data.paymentTerms || supplier.paymentTerms,
        destinationWarehouse: data.destinationWarehouse || 'PLANT01-RM-WH-BAY-01',
        status: 'APPROVED',
        items: poItems,
        totalAmount,
        createdBy: state.currentUser.name,
        approvedBy: 'Bambang Sutrisno (Procurement Manager)',
        approvedAt: timeStr,
        createdAt: timeStr,
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: poNumber,
        documentType: 'PURCHASE_ORDER',
        action: 'CREATE_PO',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: timeStr,
        newStatus: 'APPROVED',
        decision: 'EXECUTED',
        reason: `Created PO ${poNumber} for ${supplier.name} totaling Rp ${totalAmount.toLocaleString('id-ID')}.`,
      };

      setState((prev) => ({
        ...prev,
        purchaseOrders: [newPO, ...prev.purchaseOrders],
        purchaseRequisitions: data.prId
          ? prev.purchaseRequisitions.map((p) => (p.id === data.prId ? { ...p, status: 'PO_GENERATED' as const } : p))
          : prev.purchaseRequisitions,
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification('success', `Issued Purchase Order ${poNumber} to ${supplier.name}. Status: APPROVED.`);
      return newPO;
    },
    [state.purchaseOrders.length, state.suppliers, state.purchaseRequisitions, state.products, state.currentUser, addNotification]
  );

  // 15.5 Approve Purchase Order (UC-PRC-003)
  const approvePurchaseOrder = useCallback(
    (poId: string) => {
      const po = state.purchaseOrders.find((p) => p.id === poId);
      if (!po) return;

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      setState((prev) => ({
        ...prev,
        purchaseOrders: prev.purchaseOrders.map((p) =>
          p.id === poId
            ? {
                ...p,
                status: 'APPROVED' as const,
                approvedBy: `${prev.currentUser.name} (${prev.currentUser.role})`,
                approvedAt: timeStr,
              }
            : p
        ),
      }));

      addNotification('success', `Purchase Order ${po.poNumber} has been APPROVED.`);
    },
    [state.purchaseOrders, addNotification]
  );

  // 16. Post Goods Receipt Note (UC-PRC-004 & UC-INV-001 Auto-Routing to Hold)
  const postGoodsReceipt = useCallback(
    (
      poId: string,
      receiptLines: {
        poItemId: string;
        receivedQty: number;
        supplierLot: string;
        warehouseLoc: string;
        incomingQcRequired: boolean;
      }[],
      notes?: string
    ) => {
      const po = state.purchaseOrders.find((p) => p.id === poId);
      if (!po) return { success: false, error: 'PO not found' };

      const grnSeq = (state.goodsReceiptNotes.length + 1).toString().padStart(6, '0');
      const grnNumber = `GRN-2026-${grnSeq}`;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = `${today} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const evaluation = evaluateGoodsReceipt({
        po,
        grnNumber,
        receivedBy: state.currentUser.name,
        receiptLines,
        notes,
        generatedAt: timeStr,
        inspectionSequence: state.inspections.length + 1,
      });

      if (!evaluation.allowed) {
        addNotification('warning', evaluation.reason ?? 'Goods receipt validation rejected the posted receipt.');
        return { success: false, error: evaluation.reason ?? 'Goods receipt validation failed.' };
      }

      const { anyQcRequired, isFullyReceived, grn: newGrn, updatedPoItems, newMovements, newInspections, grnItems } = evaluation;
      const updatedProducts = [...state.products];

      for (const line of grnItems) {
        const prodIndex = updatedProducts.findIndex((product) => product.id === line.productId);
        if (prodIndex >= 0) {
          updatedProducts[prodIndex] = {
            ...updatedProducts[prodIndex],
            currentStock: updatedProducts[prodIndex].currentStock + line.receivedQty,
          };
        }
      }

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: grnNumber,
        documentType: 'GOODS_RECEIPT',
        action: 'POST_GRN',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: timeStr,
        decision: 'EXECUTED',
        reason: `Posted receipt ${grnNumber} for ${po.poNumber}. Stock bucket disposition: ${newGrn.stockBucketSummary}`,
      };

      setState((prev) => ({
        ...prev,
        goodsReceiptNotes: [newGrn, ...prev.goodsReceiptNotes],
        stockMovements: [...newMovements, ...prev.stockMovements],
        inspections: [...newInspections, ...prev.inspections],
        products: updatedProducts,
        purchaseOrders: prev.purchaseOrders.map((p) =>
          p.id === poId
            ? {
                ...p,
                items: updatedPoItems,
                status: isFullyReceived ? ('FULLY_RECEIVED' as const) : ('PARTIALLY_RECEIVED' as const),
              }
            : p
        ),
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification(
        anyQcRequired ? 'warning' : 'success',
        `Posted GRN ${grnNumber}. ${anyQcRequired ? 'Stock placed on HOLD (IQC task created).' : 'Stock AVAILABLE for issue.'}`
      );
      return { success: true, grn: newGrn };
    },
    [state.purchaseOrders, state.goodsReceiptNotes.length, state.products, state.currentUser, state.inspections.length, addNotification]
  );

  // 17. Release QC Inspection (UC-QA-001..003: Moves stock from HOLD to AVAILABLE or creates NCR)
  const releaseQcInspection = useCallback(
    (inspectionId: string, decision: 'PASS' | 'FAIL', disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK', notes: string) => {
      const qc = state.inspections.find((i) => i.id === inspectionId);
      if (!qc) return;

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const newMovements: StockMovement[] = [];
      const newNcrs: NonConformanceReport[] = [];

      if (decision === 'PASS' && disposition === 'UNRESTRICTED') {
        // Transfer stock from HOLD to AVAILABLE
        newMovements.push({
          id: `mov-${Date.now()}-rel`,
          movementNo: `MATDOC-REL-${Date.now().toString().slice(-5)}`,
          timestamp: timeStr,
          productId: qc.productId,
          sku: qc.sku,
          quantity: qc.sampleSize * 20, // batch release
          uom: 'KG',
          fromLocation: 'PLANT01-RM-WH-HOLD',
          toLocation: 'PLANT01-RM-WH-AVAILABLE',
          lotNumber: qc.lotNumber,
          sourceDocument: qc.inspectionNo,
          movementType: 'TRANSFER',
          stockBucket: 'AVAILABLE',
        });
      } else if (decision === 'FAIL') {
        // Spawn Non-Conformance Report (NCR)
        newNcrs.push({
          id: `ncr-${Date.now()}`,
          ncrNo: `NCR-2026-0${19 + state.ncrs.length}`,
          orderNumber: qc.sourceRef,
          lotNumber: qc.lotNumber,
          productSku: qc.sku,
          defectDescription: notes || 'Material failed IQC metallurgical specification test.',
          rootCause: 'Supplier alloy deviation outside acceptable tolerance range.',
          quantityAffected: qc.sampleSize * 10,
          disposition: disposition === 'REWORK' ? 'REWORK' : 'SCRAP',
          status: 'OPEN',
          createdAt: timeStr,
        });
      }

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: qc.inspectionNo,
        documentType: 'QUALITY_INSPECTION',
        action: 'RELEASE_QC_DISPOSITION',
        actor: state.currentUser.name,
        role: 'Quality Lead',
        timestamp: timeStr,
        oldStatus: qc.disposition,
        newStatus: disposition,
        decision: decision === 'PASS' ? 'APPROVED' : 'FLAGGED',
        reason: notes || `QC evaluation complete: Result ${decision}, Disposition ${disposition}.`,
      };

      setState((prev) => ({
        ...prev,
        inspections: prev.inspections.map((i) =>
          i.id === inspectionId
            ? {
                ...i,
                result: decision,
                disposition,
                inspector: prev.currentUser.name,
                notes: `${i.notes || ''} [Decision: ${decision}/${disposition}] ${notes}`,
              }
            : i
        ),
        stockMovements: [...newMovements, ...prev.stockMovements],
        ncrs: [...newNcrs, ...prev.ncrs],
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification(
        decision === 'PASS' ? 'success' : 'error',
        `QC Inspection ${qc.inspectionNo} updated: ${decision} (${disposition}). Stock ledger updated.`
      );
    },
    [state.inspections, state.ncrs.length, state.currentUser, addNotification]
  );

  // 18. Issue Material to Production Order (UC-INV-003 & BR-INV-003 Prevention of Hold Stock Issue)
  const issueMaterialToProduction = useCallback(
    (orderId: string, componentSku: string, lotNumber: string, quantity: number, isHoldOverride?: boolean) => {
      const order = state.productionOrders.find((o) => o.id === orderId);
      if (!order) return { success: false, error: 'Order not found' };

      const decision = issueMaterialToProductionForInventory(
        order,
        componentSku,
        lotNumber,
        quantity,
        state.stockMovements,
        state.currentUser.name,
        state.currentUser.role,
        isHoldOverride
      );

      if (!decision.allowed || !decision.movement || !decision.auditLog) {
        const errorMsg = decision.reason || 'Material issue blocked.';
        addNotification('error', errorMsg);
        return { success: false, error: errorMsg };
      }

      setState((prev) => ({
        ...prev,
        stockMovements: [decision.movement!, ...prev.stockMovements],
        auditLogs: [decision.auditLog!, ...prev.auditLogs],
      }));

      addNotification('success', `Issued ${quantity} of ${componentSku} (Lot: ${lotNumber}) to ${order.orderNumber}.`);
      return { success: true };
    },
    [state.stockMovements, state.productionOrders, state.currentUser, addNotification]
  );

  // 19. Switch Current User Persona (for testing SoD and multi-role workflows)
  const switchCurrentUser = useCallback(
    (persona: { id: string; name: string; role: string }) => {
      setState((prev) => ({
        ...prev,
        currentUser: persona,
      }));
      addNotification('info', `Active user switched to: ${persona.name} (${persona.role})`);
    },
    [addNotification]
  );

  // 20. Update Feature Registry Status (Section 42 & 43)
  const updateFeatureStatus = useCallback(
    (featureId: string, status: FeatureStatus, notes?: string) => {
      setState((prev) => ({
        ...prev,
        featureRegistry: prev.featureRegistry.map((item) =>
          item.id === featureId
            ? { ...item, status, notes: notes !== undefined ? notes : item.notes }
            : item
        ),
      }));
      addNotification('info', `Feature status updated to ${status}`);
    },
    [addNotification]
  );

  // 21. Custom Field Management (Section 33)
  const addCustomField = useCallback(
    (field: Omit<CustomFieldDefinition, 'id'>) => {
      const newField: CustomFieldDefinition = {
        ...field,
        id: `cf-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        customFields: [...prev.customFields, newField],
      }));
      addNotification('success', `Added custom field: ${field.label} (${field.entityType})`);
      return newField;
    },
    [addNotification]
  );

  const toggleCustomField = useCallback(
    (fieldId: string) => {
      setState((prev) => ({
        ...prev,
        customFields: prev.customFields.map((f) =>
          f.id === fieldId ? { ...f, active: !f.active } : f
        ),
      }));
      addNotification('info', 'Custom field status updated.');
    },
    [addNotification]
  );

  const setCustomFieldValue = useCallback(
    (entityId: string, fieldKey: string, value: any) => {
      setState((prev) => ({
        ...prev,
        customValues: {
          ...prev.customValues,
          [entityId]: {
            ...(prev.customValues[entityId] || {}),
            [fieldKey]: value,
          },
        },
      }));
    },
    []
  );

  // 22. Dynamic Workflow Engine (Section 34)
  const addWorkflow = useCallback(
    (workflow: WorkflowDefinition) => {
      setState((prev) => ({
        ...prev,
        workflows: [...prev.workflows, workflow],
      }));
      addNotification('success', `Added workflow definition: ${workflow.name}`);
    },
    [addNotification]
  );

  const updateWorkflow = useCallback(
    (updated: WorkflowDefinition) => {
      setState((prev) => ({
        ...prev,
        workflows: prev.workflows.map((w) => (w.id === updated.id ? updated : w)),
      }));
      addNotification('info', `Updated workflow definition: ${updated.name}`);
    },
    [addNotification]
  );

  // 23. Configurable Business Rules (Section 35)
  const toggleBusinessRule = useCallback(
    (ruleId: string) => {
      setState((prev) => ({
        ...prev,
        businessRules: prev.businessRules.map((r) =>
          r.id === ruleId ? { ...r, enabled: !r.enabled } : r
        ),
      }));
      addNotification('info', 'Business rule state toggled.');
    },
    [addNotification]
  );

  // 24. Subcontracting Operations (Section 24)
  const createSubcontractOrder = useCallback(
    (orderData: Omit<SubcontractOrder, 'id'>) => {
      const newOrder: SubcontractOrder = {
        ...orderData,
        id: `subc-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        subcontractOrders: [newOrder, ...prev.subcontractOrders],
      }));
      addNotification('success', `Created subcontract dispatch order: ${newOrder.orderNo}`);
      return newOrder;
    },
    [addNotification]
  );

  const receiveSubcontractOrder = useCallback(
    (orderId: string, receivedQty: number) => {
      setState((prev) => ({
        ...prev,
        subcontractOrders: prev.subcontractOrders.map((o) => {
          if (o.id === orderId) {
            const newTotalReceived = o.receivedQuantity + receivedQty;
            const newStatus =
              newTotalReceived >= o.targetQuantity
                ? ('COMPLETED' as const)
                : ('PARTIALLY_RECEIVED' as const);
            return {
              ...o,
              receivedQuantity: newTotalReceived,
              status: newStatus,
              actualReturnDate: newTotalReceived >= o.targetQuantity ? new Date().toISOString().split('T')[0] : o.actualReturnDate,
            };
          }
          return o;
        }),
      }));
      addNotification('info', `Recorded receipt of ${receivedQty} units for subcontract order.`);
    },
    [addNotification]
  );

  // ============================================================================
  // 25. PHASE 8: NPI & PRODUCT LIFECYCLE MANAGEMENT
  // ============================================================================
  const createNpiProject = useCallback(
    (projectData: Partial<NpiProject>) => {
      const pNum = `NPI-2026-00${state.npiProjects.length + 1}`;
      const newProject: NpiProject = {
        id: `npi-${Date.now()}`,
        projectNumber: pNum,
        productId: projectData.productId || 'prd-abc-100',
        productSku: projectData.productSku || 'ABC-100',
        productName: projectData.productName || 'Smart Industrial Gateway Controller ABC-100',
        productRevision: projectData.productRevision || 'Rev A',
        customer: projectData.customer || 'Target Enterprise Customer',
        projectOwner: projectData.projectOwner || state.currentUser.name,
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

      setState((prev) => ({
        ...prev,
        npiProjects: [newProject, ...prev.npiProjects],
      }));
      addNotification('success', `Created NPI Project: ${newProject.projectNumber} (${newProject.productSku})`);
      return newProject;
    },
    [state.npiProjects.length, state.currentUser.name, addNotification]
  );

  const updateNpiProject = useCallback(
    (id: string, updates: Partial<NpiProject>) => {
      setState((prev) => ({
        ...prev,
        npiProjects: prev.npiProjects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      addNotification('info', `Updated NPI Project.`);
    },
    [addNotification]
  );

  const updateNpiMilestone = useCallback(
    (projectId: string, milestoneId: string, status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING') => {
      setState((prev) => ({
        ...prev,
        npiProjects: prev.npiProjects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId
                  ? {
                      ...m,
                      status,
                      completedDate: status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : m.completedDate,
                    }
                  : m
              ),
            };
          }
          return p;
        }),
      }));
      addNotification('info', `Milestone status updated to ${status}.`);
    },
    [addNotification]
  );

  // 26. 6-PILLAR DETERMINISTIC PRODUCTION READINESS CHECK
  const runProductionReadinessCheck = useCallback(
    (npiProjectId: string) => {
      const project = state.npiProjects.find((p) => p.id === npiProjectId);
      if (!project) return;

      const report = evaluateProductionReadiness({
        project,
        drawings: state.drawings,
        specifications: state.specifications,
        boms: state.boms,
        routings: state.routings,
        toolingItems: state.toolingItems,
        workInstructions: state.workInstructions,
        qcPlans: state.qcPlans,
        materialRequests: state.materialRequests,
        evaluator: state.currentUser.name,
      });

      setState((prev) => ({
        ...prev,
        readinessReports: {
          ...prev.readinessReports,
          [npiProjectId]: report,
        },
        npiProjects: prev.npiProjects.map((p) =>
          p.id === npiProjectId ? { ...p, blockingIssues: report.blockingIssues } : p
        ),
      }));

      addNotification(
        report.overallStatus === 'READY' ? 'success' : 'warning',
        `Production Readiness Evaluated: Overall status is ${report.overallStatus}. ${report.blockingIssues.length} blockers detected.`
      );
    },
    [state.npiProjects, state.drawings, state.specifications, state.boms, state.routings, state.toolingItems, state.workInstructions, state.qcPlans, state.materialRequests, state.currentUser.name, addNotification]
  );

  // 27. RECORD TRIAL & PILOT RUNS
  const recordNpiTrialRun = useCallback(
    (trialData: NpiTrialRun) => {
      setState((prev) => ({
        ...prev,
        npiProjects: prev.npiProjects.map((p) => {
          if (p.id === trialData.npiProjectId) {
            return {
              ...p,
              status: trialData.trialResult === 'PASS' || trialData.trialResult === 'PASS_WITH_ACTION' ? 'PILOT' : 'TRIAL',
              trialRuns: [trialData, ...p.trialRuns],
            };
          }
          return p;
        }),
      }));
      addNotification('success', `Recorded Trial Run ${trialData.trialNumber}: Result ${trialData.trialResult}.`);
    },
    [addNotification]
  );

  const recordNpiPilotRun = useCallback(
    (pilotData: NpiPilotRun) => {
      setState((prev) => ({
        ...prev,
        npiProjects: prev.npiProjects.map((p) => {
          if (p.id === pilotData.npiProjectId) {
            return {
              ...p,
              status: pilotData.pilotResult === 'PASS' ? 'READY_FOR_RELEASE' : p.status,
              pilotRuns: [pilotData, ...p.pilotRuns],
            };
          }
          return p;
        }),
      }));
      addNotification('success', `Recorded Pilot Run ${pilotData.pilotNumber}: Result ${pilotData.pilotResult}. Project marked as READY FOR RELEASE.`);
    },
    [addNotification]
  );

  // 28. PRODUCT RELEASE PACKAGE & OFFICIAL RELEASE GATE
  const createProductRelease = useCallback(
    (releaseData: Partial<ProductReleasePackage>) => {
      const pkgNum = `REL-PKG-2026-${(state.productReleases.length + 1).toString().padStart(3, '0')}`;
      const newPackage: ProductReleasePackage = {
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
        effectiveDate: releaseData.effectiveDate || new Date().toISOString().split('T')[0],
        releasedBy: state.currentUser.name,
        status: 'ACTIVE',
        notes: releaseData.notes || 'Formal manufacturing baseline package release.',
        approvals: [
          { role: 'VP Engineering', approver: 'Ir. Agus Wijaya', approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'APPROVED' },
          { role: 'Quality Assurance Director', approver: 'Siti Nurhaliza', approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'APPROVED' },
          { role: 'Production GM', approver: state.currentUser.name, approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'APPROVED' },
          { role: 'PPIC Operations Lead', approver: 'Dewi Lestari', approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'APPROVED' },
        ],
      };

      // Set product lifecycle to RELEASED
      setState((prev) => {
        const updatedProducts = prev.products.map((prod) => {
          if (prod.id === newPackage.productId || prod.sku === newPackage.productSku) {
            return {
              ...prod,
              lifecycleStatus: 'RELEASED' as const,
              currentRevision: newPackage.releasedRevision,
              effectiveDate: newPackage.effectiveDate,
            };
          }
          return prod;
        });

        const audit: AuditLogEntry = {
          id: `aud-${Date.now()}`,
          documentId: newPackage.packageNumber,
          documentType: 'PRODUCT_RELEASE',
          action: 'RELEASE_PRODUCT',
          actor: state.currentUser.name,
          role: state.currentUser.role,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          oldStatus: 'PILOT',
          newStatus: 'RELEASED',
          decision: 'APPROVED',
          reason: `Approved official manufacturing baseline release package ${newPackage.packageNumber} for ${newPackage.productSku} ${newPackage.releasedRevision}. Product is now authorized for commercial volume production.`,
        };

        return {
          ...prev,
          productReleases: [newPackage, ...prev.productReleases],
          products: updatedProducts,
          auditLogs: [audit, ...prev.auditLogs],
        };
      });

      addNotification('success', `Product ${newPackage.productSku} is officially RELEASED for commercial manufacturing (Package: ${newPackage.packageNumber}).`);
      return newPackage;
    },
    [state.productReleases.length, state.currentUser, addNotification]
  );

  // 29. MATERIAL REQUEST & PHYSICAL LINE DELIVERY LEDGER
  const createMaterialRequest = useCallback(
    (mrData: Partial<MaterialRequest>) => {
      const newMR = createMaterialRequestInDomain({
        sourceType: mrData.sourceType || 'PRODUCTION_ORDER',
        sourceReferenceId: mrData.sourceReferenceId || 'MO-2026-00124',
        productId: mrData.productId,
        productSku: mrData.productSku,
        requester: mrData.requester || state.currentUser.name,
        department: mrData.department || 'Manufacturing Shop Floor',
        requiredDate: mrData.requiredDate || new Date().toISOString().split('T')[0],
        destinationLine: mrData.destinationLine || 'Line 1 - Staging Bay',
        priority: mrData.priority || 'HIGH',
        items: mrData.items || [],
        notes: mrData.notes,
      });

      setState((prev) => ({
        ...prev,
        materialRequests: [newMR, ...prev.materialRequests],
      }));
      addNotification('success', `Created Material Request: ${newMR.requestNumber}`);
      return newMR;
    },
    [state.currentUser.name, addNotification]
  );

  const pickMaterialRequest = useCallback(
    (id: string, pickedBy: string) => {
      const request = state.materialRequests.find((m) => m.id === id);
      if (!request) return;

      const updatedRequest = pickMaterialRequestInDomain(request, pickedBy);

      setState((prev) => ({
        ...prev,
        materialRequests: prev.materialRequests.map((mr) => (mr.id === id ? updatedRequest : mr)),
      }));
      addNotification('info', `Material Request picked from warehouse bins and staged for line dispatch.`);
    },
    [state.materialRequests, addNotification]
  );

  const deliverMaterialRequestToLine = useCallback(
    (id: string, deliveredBy: string, lineLocation: string) => {
      const mr = state.materialRequests.find((m) => m.id === id);
      if (!mr) return;

      const evaluation = evaluateMaterialRequestDelivery({
        request: mr,
        deliveredBy,
        receivedBy: state.currentUser.name,
        lineLocation,
      });

      if (!evaluation.allowed) {
        addNotification('error', evaluation.reason || 'Material request delivery rejected.');
        return;
      }

      setState((prev) => ({
        ...prev,
        stockMovements: [...evaluation.stockMovements, ...prev.stockMovements],
        materialRequests: prev.materialRequests.map((m) => (m.id === id ? evaluation.request : m)),
        auditLogs: [evaluation.auditLog!, ...prev.auditLogs],
      }));

      addNotification('success', evaluation.reason || `Material Request ${mr.requestNumber} delivered to line. Ledger updated.`);
    },
    [state.materialRequests, state.currentUser.name, addNotification]
  );

  // 30. ENGINEERING CHANGE MANAGEMENT (ECR / ECO)
  const createEngineeringChangeRequest = useCallback(
    (ecrData: Partial<EngineeringChangeRequest>) => {
      const ecrNum = `ECR-2026-${(state.engineeringChanges.length + 5).toString().padStart(6, '0')}`;
      const newEcr: EngineeringChangeRequest = {
        id: `ecr-${Date.now()}`,
        ecrNumber: ecrNum,
        productId: ecrData.productId || 'prd-001',
        productSku: ecrData.productSku || 'Product A',
        productName: ecrData.productName || 'Industrial Motor Controller (Product A)',
        currentRevision: ecrData.currentRevision || 'Rev A',
        proposedRevision: ecrData.proposedRevision || 'Rev B',
        reason: ecrData.reason || 'Engineering specification update.',
        requestedBy: ecrData.requestedBy || state.currentUser.name,
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
          affectedOpenWorkOrderIds: state.productionOrders.filter((o) => o.status === 'RELEASED' || o.status === 'PLANNED').map((o) => o.id),
          inventoryOldMaterialRemaining: [],
          inventoryNewMaterialRequired: [],
          impactSummary: 'Analysis pending review.',
        },
        openWorkOrderDecisions: state.productionOrders.map((o) => ({
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

      setState((prev) => ({
        ...prev,
        engineeringChanges: [newEcr, ...prev.engineeringChanges],
      }));
      addNotification('success', `Created Engineering Change Request: ${newEcr.ecrNumber}`);
      return newEcr;
    },
    [state.engineeringChanges.length, state.productionOrders, state.currentUser.name, addNotification]
  );

  const decideOpenWorkOrderEcr = useCallback(
    (ecrId: string, workOrderId: string, decision: OpenWorkOrderDecision['decision'], notes?: string) => {
      setState((prev) => ({
        ...prev,
        engineeringChanges: prev.engineeringChanges.map((ecr) => {
          if (ecr.id === ecrId) {
            return {
              ...ecr,
              openWorkOrderDecisions: ecr.openWorkOrderDecisions.map((dec) =>
                dec.workOrderId === workOrderId
                  ? {
                      ...dec,
                      decision,
                      notes: notes || dec.notes,
                      authorizedBy: prev.currentUser.name,
                    }
                  : dec
              ),
            };
          }
          return ecr;
        }),
      }));
      addNotification('info', `Updated Open Work Order decision: ${decision}`);
    },
    [addNotification]
  );

  const approveEngineeringChange = useCallback(
    (ecrId: string, role: string, approver: string) => {
      setState((prev) => ({
        ...prev,
        engineeringChanges: prev.engineeringChanges.map((ecr) => {
          if (ecr.id === ecrId) {
            const updatedApprovals = ecr.approvals.map((app) =>
              app.role === role
                ? { ...app, approver, status: 'APPROVED' as const, approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) }
                : app
            );
            const allApproved = updatedApprovals.every((a) => a.status === 'APPROVED');
            return {
              ...ecr,
              approvals: updatedApprovals,
              status: allApproved ? ('APPROVED' as const) : ecr.status,
            };
          }
          return ecr;
        }),
      }));
      addNotification('success', `Approved ECR sign-off for ${role}.`);
    },
    [addNotification]
  );

  const releaseEngineeringChange = useCallback(
    (ecrId: string, effectiveDate: string) => {
      const ecr = state.engineeringChanges.find((e) => e.id === ecrId);
      if (!ecr) return;

      const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      // Create new Release Package for the proposed revision
      const newReleasePkg: ProductReleasePackage = {
        id: `rel-${Date.now()}-ecr`,
        packageNumber: `REL-PKG-2026-${(state.productReleases.length + 1).toString().padStart(3, '0')}`,
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
        releasedBy: state.currentUser.name,
        status: 'ACTIVE',
        notes: `Released via ${ecr.ecrNumber}: ${ecr.reason}`,
        approvals: [
          { role: 'Engineering Lead', approver: state.currentUser.name, approvedAt: timeStr, status: 'APPROVED' },
          { role: 'Operations Director', approver: 'Ir. Agus Wijaya', approvedAt: timeStr, status: 'APPROVED' },
        ],
      };

      // Mark older release packages for this product as SUPERSEDED
      const updatedReleases = state.productReleases.map((pkg) =>
        pkg.productId === ecr.productId ? { ...pkg, status: 'SUPERSEDED' as const } : pkg
      );

      // Update product master current revision
      const updatedProducts = state.products.map((p) =>
        p.id === ecr.productId
          ? {
              ...p,
              currentRevision: ecr.proposedRevision,
              drawingRevision: ecr.proposedRevision,
              specificationRevision: ecr.proposedRevision,
              effectiveDate,
            }
          : p
      );

      // Apply decisions to open work orders deterministically
      const updatedProductionOrders = state.productionOrders.map((order) => {
        const decisionObj = ecr.openWorkOrderDecisions.find((d) => d.workOrderId === order.id);
        if (!decisionObj) return order;

        if (decisionObj.decision === 'APPLY_NEW_REV') {
          return {
            ...order,
            productRevision: ecr.proposedRevision,
            bomRevision: `${ecr.productSku} BOM ${ecr.proposedRevision}`,
            routingRevision: `${ecr.productSku} Routing ${ecr.proposedRevision}`,
          };
        }
        if (decisionObj.decision === 'HOLD_WORK_ORDER') {
          return {
            ...order,
            status: 'PLANNED' as const, // Or held
          };
        }
        // If CONTINUE_EXISTING_REV: remains untouched!
        return order;
      });

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: ecr.ecrNumber,
        documentType: 'ENGINEERING_CHANGE',
        action: 'RELEASE_ECR_REVISION',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: timeStr,
        oldStatus: ecr.status,
        newStatus: 'EFFECTIVE',
        decision: 'EXECUTED',
        reason: `Engineering Change ${ecr.ecrNumber} made EFFECTIVE. Created baseline ${newReleasePkg.packageNumber} (${ecr.proposedRevision}). Open orders updated per authorized decisions without retroactive data corruption.`,
      };

      setState((prev) => ({
        ...prev,
        engineeringChanges: prev.engineeringChanges.map((e) =>
          e.id === ecrId ? { ...e, status: 'EFFECTIVE' as const, effectiveAt: timeStr, releasedPackageId: newReleasePkg.id } : e
        ),
        productReleases: [newReleasePkg, ...updatedReleases],
        products: updatedProducts,
        productionOrders: updatedProductionOrders,
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification('success', `ECR ${ecr.ecrNumber} released! New revision ${ecr.proposedRevision} is now EFFECTIVE as of ${effectiveDate}.`);
    },
    [state.engineeringChanges, state.productReleases, state.products, state.productionOrders, state.currentUser, addNotification]
  );

  // 31. TOOLING, WI, QC PLAN & DRAWING ACTIONS
  const createToolingItem = useCallback(
    (toolData: Partial<ToolingItem>) => {
      const newTool: ToolingItem = {
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

      setState((prev) => ({
        ...prev,
        toolingItems: [newTool, ...prev.toolingItems],
      }));
      addNotification('success', `Created Tooling Master: ${newTool.toolId}`);
      return newTool;
    },
    [addNotification]
  );

  const updateToolingStatus = useCallback(
    (id: string, status: ToolStatus) => {
      setState((prev) => ({
        ...prev,
        toolingItems: prev.toolingItems.map((t) => (t.id === id ? { ...t, status } : t)),
      }));
      addNotification('info', `Tooling status updated to ${status}.`);
    },
    [addNotification]
  );

  const createEngineeringDrawing = useCallback(
    (drawing: Partial<EngineeringDrawing>) => {
      const newDwg: EngineeringDrawing = {
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
        createdBy: state.currentUser.name,
        createdDate: new Date().toISOString().split('T')[0],
        approvedBy: state.currentUser.name,
        approvalDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
      };
      setState((prev) => ({
        ...prev,
        drawings: [newDwg, ...prev.drawings],
      }));
      addNotification('success', `Registered Engineering Drawing: ${newDwg.drawingNumber}`);
      return newDwg;
    },
    [state.currentUser.name, addNotification]
  );

  const approveEngineeringDrawing = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        drawings: prev.drawings.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'RELEASED' as const,
                approvedBy: prev.currentUser.name,
                approvalDate: new Date().toISOString().split('T')[0],
              }
            : d
        ),
      }));
      addNotification('success', `Drawing approved and released.`);
    },
    [addNotification]
  );

  const createEngineeringSpecification = useCallback(
    (spec: Partial<EngineeringSpecification>) => {
      const newSpec: EngineeringSpecification = {
        id: `spec-${Date.now()}`,
        specNumber: spec.specNumber || `SPEC-${Date.now().toString().slice(-4)}`,
        revision: spec.revision || 'Rev A',
        productId: spec.productId || 'prd-abc-100',
        productSku: spec.productSku || 'ABC-100',
        title: spec.title || 'Engineering Specification',
        content: spec.content || 'Technical performance criteria.',
        criticalParameters: spec.criticalParameters || [],
        status: spec.status || 'RELEASED',
        approvedBy: state.currentUser.name,
        effectiveDate: new Date().toISOString().split('T')[0],
      };
      setState((prev) => ({
        ...prev,
        specifications: [newSpec, ...prev.specifications],
      }));
      addNotification('success', `Created Specification: ${newSpec.specNumber}`);
      return newSpec;
    },
    [state.currentUser.name, addNotification]
  );

  const approveEngineeringSpecification = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        specifications: prev.specifications.map((s) =>
          s.id === id ? { ...s, status: 'RELEASED' as const, approvedBy: prev.currentUser.name } : s
        ),
      }));
      addNotification('success', `Specification approved and released.`);
    },
    [addNotification]
  );

  const createWorkInstruction = useCallback(
    (wi: Partial<WorkInstruction>) => {
      const newWi: WorkInstruction = {
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
        instructions: wi.instructions || ['Step 1: Check components', 'Step 2: Assemble'],
        safetyNotes: wi.safetyNotes || ['Wear safety goggles'],
        qualityCheckpoints: wi.qualityCheckpoints || ['Verify dimensions'],
        requiredTools: wi.requiredTools || ['Torque Wrench'],
        requiredMaterials: wi.requiredMaterials || ['Raw Materials'],
        status: wi.status || 'RELEASED',
        approvedBy: state.currentUser.name,
        approvalDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
      };
      setState((prev) => ({
        ...prev,
        workInstructions: [newWi, ...prev.workInstructions],
      }));
      addNotification('success', `Created Work Instruction: ${newWi.wiNumber}`);
      return newWi;
    },
    [state.currentUser.name, addNotification]
  );

  const approveWorkInstruction = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        workInstructions: prev.workInstructions.map((w) =>
          w.id === id ? { ...w, status: 'RELEASED' as const, approvedBy: prev.currentUser.name } : w
        ),
      }));
      addNotification('success', `Work Instruction approved and released.`);
    },
    [addNotification]
  );

  const createQcPlan = useCallback(
    (plan: Partial<QcPlan>) => {
      const newPlan: QcPlan = {
        id: `qcp-${Date.now()}`,
        planNumber: plan.planNumber || `QCP-${Date.now().toString().slice(-4)}`,
        revision: plan.revision || 'Rev A',
        productId: plan.productId || 'prd-abc-100',
        productSku: plan.productSku || 'ABC-100',
        productRevision: plan.productRevision || 'Rev A',
        operationSeq: plan.operationSeq || 10,
        operationName: plan.operationName || 'Final Inspection',
        status: plan.status || 'RELEASED',
        characteristics: plan.characteristics || [],
        approvedBy: state.currentUser.name,
        effectiveDate: new Date().toISOString().split('T')[0],
      };
      setState((prev) => ({
        ...prev,
        qcPlans: [newPlan, ...prev.qcPlans],
      }));
      addNotification('success', `Created QC Plan: ${newPlan.planNumber}`);
      return newPlan;
    },
    [state.currentUser.name, addNotification]
  );

  const approveQcPlan = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        qcPlans: prev.qcPlans.map((q) =>
          q.id === id ? { ...q, status: 'RELEASED' as const, approvedBy: prev.currentUser.name } : q
        ),
      }));
      addNotification('success', `QC Plan approved and released.`);
    },
    [addNotification]
  );

  // ============================================================================
  // 32. PHASE 9: PPIC PLANNING, FINITE CAPACITY & SCHEDULING ACTIONS
  // ============================================================================
  const createProductionPlan = useCallback(
    (planData: Partial<ProductionPlanItem>) => {
      const newPlan = buildProductionPlanFromDemand({
        planNumber: planData.planNumber,
        productId: planData.productId,
        productSku: planData.productSku,
        demandQty: planData.demandQty,
        plannedQty: planData.plannedQty,
        allProducts: state.products,
        allBoms: state.boms,
        allRoutings: state.routings,
        allMachines: state.machines,
        allEmployees: state.manpower,
        periodWeek: planData.periodWeek,
        demandRef: planData.demandRef,
        targetStartDate: planData.targetStartDate,
        targetEndDate: planData.targetEndDate,
        status: planData.status,
      });

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: newPlan.planNumber,
        documentType: 'PRODUCTION_PLAN',
        action: 'CREATE_PLAN',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        newStatus: newPlan.status,
        decision: 'EXECUTED',
        reason: `Generated Master Production Plan ${newPlan.planNumber}. Feasibility: ${newPlan.feasibility} (${newPlan.constraintNotes ?? 'No specific constraints logged'})`,
      };

      setState((prev) => ({
        ...prev,
        productionPlans: [newPlan, ...prev.productionPlans],
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification(
        newPlan.feasibility === 'FEASIBLE' ? 'success' : 'warning',
        `Created Production Plan ${newPlan.planNumber} (${newPlan.feasibility}).`
      );
      return newPlan;
    },
    [state.productionPlans.length, state.products, state.boms, state.routings, state.machines, state.manpower, state.currentUser, addNotification]
  );

  const updateProductionPlan = useCallback(
    (planId: string, updates: Partial<ProductionPlanItem>) => {
      setState((prev) => ({
        ...prev,
        productionPlans: prev.productionPlans.map((p) =>
          p.id === planId ? { ...p, ...updates } : p
        ),
      }));
      addNotification('info', `Updated Production Plan ${planId}.`);
    },
    [addNotification]
  );

  const generateWorkOrderFromPlan = useCallback(
    (planId: string): { success: boolean; orderId?: string; error?: string } => {
      const plan = state.productionPlans.find((p) => p.id === planId);
      if (!plan) return { success: false, error: 'Plan not found.' };

      const routing = state.routings.find(
        (r) => (r.productId === plan.productId || r.productSku === plan.productSku) && r.status === 'ACTIVE'
      ) || state.routings.find((r) => r.productId === plan.productId || r.productSku === plan.productSku);

      const result = dispatchProductionPlan({
        plan,
        routing,
        createProductionOrder: (input) => createProductionOrder(input),
      });

      if (!result.success) {
        addNotification('error', result.error || 'Work order dispatch failed.');
        return result;
      }

      const mo = state.productionOrders.find((order) => order.id === result.orderId);
      if (mo) {
        setState((prev) => ({
          ...prev,
          productionPlans: prev.productionPlans.map((p) =>
            p.id === planId ? { ...p, status: 'DISPATCHED' as const, generatedWorkOrderId: mo.id } : p
          ),
        }));
        addNotification('success', `Dispatched Work Order ${mo.orderNumber} from Plan ${plan.planNumber}. BOM & Routing revisions snapshot frozen per Rule 10.`);
      }

      return result;
    },
    [state.productionPlans, state.routings, state.productionOrders, createProductionOrder, addNotification]
  );

  const runFiniteScheduling = useCallback(
    (options?: { startDate?: string; shiftStartTime?: string; shiftHours?: number }) => {
      const targetDemand = state.demands.find((d) => d.productSku === 'FG-001') || state.demands[0];
      const product = state.products.find((p) => p.id === targetDemand.productId || p.sku === targetDemand.productSku) || state.products[0];
      const routing = state.routings.find((r) => r.productId === product.id || r.productSku === product.sku) || state.routings[0];

      const slots = buildFiniteScheduleFromDemand({
        demand: targetDemand,
        product,
        routing,
        machines: state.machines,
        employees: state.manpower,
        changeoverRules: state.changeoverMatrix,
        startDate: options?.startDate || '2026-10-26',
        shiftStartTime: options?.shiftStartTime || '07:00',
        shiftHours: options?.shiftHours || 8,
      });

      setState((prev) => ({
        ...prev,
        finiteSchedules: slots,
      }));

      const conflictCount = slots.filter((s) => s.status === 'CONFLICT' || s.status === 'BLOCKED').length;
      if (conflictCount > 0) {
        addNotification('warning', `Finite scheduling completed with ${conflictCount} resource exception(s) detected (Manpower/Machine constraints active).`);
      } else {
        addNotification('success', `Finite scheduling completed: Generated ${slots.length} feasible, non-overlapping sequence slots.`);
      }
      return slots;
    },
    [state.demands, state.products, state.routings, state.machines, state.manpower, state.changeoverMatrix, addNotification]
  );

  const simulateWhatIfScenario = useCallback(
    (customOverrides?: any) => {
      const routing = state.routings.find((r) => r.productSku === 'FG-001') || state.routings[0];
      const scenarioDefinitions = [
        { name: 'Scenario A: Baseline (2 Machines, 8h Shift)', description: 'Baseline single-shift capacity allocation', machineQuantityOverride: 2, shiftHours: 8, extraShift: false },
        { name: 'Scenario B: +1 Machine (3 Machines M01, 8h Shift)', description: 'Activate 3rd machine to increase throughput', machineQuantityOverride: 3, shiftHours: 8, extraShift: false },
        { name: 'Scenario C: 2 Machines + Overtime (10h Shift)', description: 'Authorize 2h daily overtime on 2 machines', machineQuantityOverride: 2, shiftHours: 10, extraShift: false },
      ];

      const scenarios = buildWhatIfScenarios({
        targetProductSku: 'FG-001',
        demandQty: 5000,
        dueDate: '2026-10-30',
        baselineMachines: state.machines,
        routing,
        scenariosToRun: customOverrides ? customOverrides : scenarioDefinitions,
      });

      setState((prev) => ({
        ...prev,
        whatIfScenarios: scenarios,
      }));
      addNotification('info', `What-If Simulation recomputed: Evaluated ${scenarios.length} capacity scenarios against Section 41 demand.`);
      return scenarios;
    },
    [state.routings, state.machines, addNotification]
  );

  const addMachine = useCallback(
    (machineData: Partial<MachineMaster>) => {
      const newMachine: MachineMaster = {
        id: `mac-${Date.now()}`,
        code: machineData.code || `M0${state.machines.length + 1}`,
        name: machineData.name || 'New Machine Station',
        workCenterId: machineData.workCenterId || 'wc-m01',
        workCenterCode: machineData.workCenterCode || 'WC-M01',
        department: machineData.department || 'Fabrication',
        availableUnits: machineData.availableUnits || 1,
        standardCycleTimeSeconds: machineData.standardCycleTimeSeconds || 30,
        efficiencyRate: machineData.efficiencyRate || 0.85,
        availabilityRate: machineData.availabilityRate || 0.95,
        performanceRate: machineData.performanceRate || 0.92,
        qualityRate: machineData.qualityRate || 0.98,
        hourlyCostRate: machineData.hourlyCostRate || 50.0,
        status: machineData.status || 'OPERATIONAL',
        notes: machineData.notes,
      };

      setState((prev) => ({
        ...prev,
        machines: [...prev.machines, newMachine],
      }));
      addNotification('success', `Registered machine: ${newMachine.code} (${newMachine.name}).`);
      return newMachine;
    },
    [state.machines.length, addNotification]
  );

  const updateMachineStatus = useCallback(
    (id: string, status: MachineStatus) => {
      setState((prev) => ({
        ...prev,
        machines: prev.machines.map((m) => (m.id === id ? { ...m, status } : m)),
      }));
      addNotification('info', `Machine status updated to ${status}. ${status === 'MAINTENANCE' ? 'Capacity blocked per Rule 9.' : ''}`);
    },
    [addNotification]
  );

  const addEmployee = useCallback(
    (empData: Partial<EmployeeManpower>) => {
      const newEmp: EmployeeManpower = {
        id: `emp-${Date.now()}`,
        employeeCode: empData.employeeCode || `EMP-00${state.manpower.length + 1}`,
        name: empData.name || 'New Operator',
        role: empData.role || 'Machine Operator',
        department: empData.department || 'Fabrication',
        skills: empData.skills || [{ skillName: 'Machine Operation', level: 3 }],
        qualifiedWorkCenters: empData.qualifiedWorkCenters || ['WC-M01'],
        assignedShiftId: empData.assignedShiftId || 'SHIFT-1',
        dailyWorkingHours: empData.dailyWorkingHours || 8,
        overtimeCapable: empData.overtimeCapable !== undefined ? empData.overtimeCapable : true,
        maxOvertimeHoursPerWeek: empData.maxOvertimeHoursPerWeek || 8,
        status: empData.status || 'AVAILABLE',
      };

      setState((prev) => ({
        ...prev,
        manpower: [...prev.manpower, newEmp],
      }));
      addNotification('success', `Added operator: ${newEmp.name} (${newEmp.employeeCode}).`);
      return newEmp;
    },
    [state.manpower.length, addNotification]
  );

  const updateEmployeeStatus = useCallback(
    (id: string, status: EmployeeManpower['status']) => {
      setState((prev) => ({
        ...prev,
        manpower: prev.manpower.map((e) => (e.id === id ? { ...e, status } : e)),
      }));
      addNotification('info', `Operator status changed to ${status}.`);
    },
    [addNotification]
  );

  const updateChangeoverRule = useCallback(
    (fromProductSku: string, toProductSku: string, changeoverMinutes: number) => {
      setState((prev) => {
        const exists = prev.changeoverMatrix.some(
          (r) => r.fromProductSku === fromProductSku && r.toProductSku === toProductSku
        );
        let updated: ChangeoverRule[];
        if (exists) {
          updated = prev.changeoverMatrix.map((r) =>
            r.fromProductSku === fromProductSku && r.toProductSku === toProductSku
              ? { ...r, changeoverMinutes }
              : r
          );
        } else {
          updated = [
            ...prev.changeoverMatrix,
            {
              id: `co-${Date.now()}`,
              fromProductSku,
              toProductSku,
              changeoverMinutes,
              cleaningRequired: changeoverMinutes > 20,
              toolingChangeRequired: changeoverMinutes > 30,
            },
          ];
        }
        return {
          ...prev,
          changeoverMatrix: updated,
        };
      });
      addNotification('info', `Changeover between ${fromProductSku} and ${toProductSku} updated to ${changeoverMinutes} mins.`);
    },
    [addNotification]
  );

  // Reset to initial baseline
  const resetDemoState = useCallback(() => {
    localStorage.removeItem(LEGACY_ERP_STORAGE_KEY);
    localStorage.removeItem(UI_PREFERENCES_STORAGE_KEY);
    setState(getInitialState());
    addNotification('info', 'Reset demo ERP state to pristine baseline.');
  }, [addNotification]);

  return {
    state,
    setPlant,
    addNotification,
    dismissNotification,
    checkMaterialAvailability,
    releaseProductionOrder,
    startWorkOrder,
    reportProductionOutput,
    completeWorkOrder,
    closeProductionOrder,
    createProductionOrder,
    reportMachineBreakdown,
    resolveMachineBreakdown,
    runMRP,
    runTestingScenario,
    resetDemoState,
    logAudit,
    // Procurement & Stock Invariants
    createPurchaseRequisition,
    approvePurchaseRequisition,
    rejectPurchaseRequisition,
    createPurchaseOrder,
    approvePurchaseOrder,
    postGoodsReceipt,
    releaseQcInspection,
    issueMaterialToProduction,
    switchCurrentUser,
    // Configurable Platform & Registry
    updateFeatureStatus,
    addCustomField,
    toggleCustomField,
    setCustomFieldValue,
    addWorkflow,
    updateWorkflow,
    toggleBusinessRule,
    createSubcontractOrder,
    receiveSubcontractOrder,
    // Phase 8: NPI & Product Lifecycle
    createNpiProject,
    updateNpiProject,
    updateNpiMilestone,
    runProductionReadinessCheck,
    recordNpiTrialRun,
    recordNpiPilotRun,
    createProductRelease,
    // Phase 8: Material Request & Line Delivery
    createMaterialRequest,
    pickMaterialRequest,
    deliverMaterialRequestToLine,
    // Phase 8: Engineering Change Management (ECR/ECO)
    createEngineeringChangeRequest,
    decideOpenWorkOrderEcr,
    approveEngineeringChange,
    releaseEngineeringChange,
    // Phase 8: Tooling, Drawings, WI, QC Plans
    createToolingItem,
    updateToolingStatus,
    createEngineeringDrawing,
    approveEngineeringDrawing,
    createEngineeringSpecification,
    approveEngineeringSpecification,
    createWorkInstruction,
    approveWorkInstruction,
    createQcPlan,
    approveQcPlan,
    // Phase 9: PPIC Planning, Finite Capacity & Scheduling
    createProductionPlan,
    updateProductionPlan,
    generateWorkOrderFromPlan,
    runFiniteScheduling,
    simulateWhatIfScenario,
    addMachine,
    updateMachineStatus,
    addEmployee,
    updateEmployeeStatus,
    updateChangeoverRule,
  };
}
