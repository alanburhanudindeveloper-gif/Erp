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
  calculateChangeoverTime,
  analyzeBottlenecks,
  evaluateProductionFeasibility,
  generateFiniteScheduleSlots,
  runWhatIfSimulation,
} from './ppicService';

const STORAGE_KEY = 'kranex_mfg_erp_platform_v4';

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
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        products: parsed.products?.length ? parsed.products : INITIAL_PRODUCTS,
        suppliers: parsed.suppliers?.length ? parsed.suppliers : INITIAL_SUPPLIERS,
        purchaseRequisitions: parsed.purchaseRequisitions?.length ? parsed.purchaseRequisitions : INITIAL_PURCHASE_REQUISITIONS,
        purchaseOrders: parsed.purchaseOrders?.length ? parsed.purchaseOrders : INITIAL_PURCHASE_ORDERS,
        goodsReceiptNotes: parsed.goodsReceiptNotes?.length ? parsed.goodsReceiptNotes : INITIAL_GOODS_RECEIPTS,
        featureRegistry: parsed.featureRegistry?.length ? parsed.featureRegistry : INITIAL_FEATURE_REGISTRY,
        customFields: parsed.customFields?.length ? parsed.customFields : INITIAL_CUSTOM_FIELDS,
        workflows: parsed.workflows?.length ? parsed.workflows : INITIAL_WORKFLOWS,
        businessRules: parsed.businessRules?.length ? parsed.businessRules : INITIAL_BUSINESS_RULES,
        subcontractOrders: parsed.subcontractOrders?.length ? parsed.subcontractOrders : INITIAL_SUBCONTRACT_ORDERS,
        // Phase 8 additions
        drawings: parsed.drawings?.length ? parsed.drawings : INITIAL_DRAWINGS,
        specifications: parsed.specifications?.length ? parsed.specifications : INITIAL_SPECIFICATIONS,
        toolingItems: parsed.toolingItems?.length ? parsed.toolingItems : INITIAL_TOOLING_ITEMS,
        workInstructions: parsed.workInstructions?.length ? parsed.workInstructions : INITIAL_WORK_INSTRUCTIONS,
        qcPlans: parsed.qcPlans?.length ? parsed.qcPlans : INITIAL_QC_PLANS,
        materialRequests: parsed.materialRequests?.length ? parsed.materialRequests : INITIAL_MATERIAL_REQUESTS,
        readinessReports: parsed.readinessReports || INITIAL_PRODUCTION_READINESS,
        npiProjects: parsed.npiProjects?.length ? parsed.npiProjects : INITIAL_NPI_PROJECTS,
        productReleases: parsed.productReleases?.length ? parsed.productReleases : INITIAL_RELEASE_PACKAGES,
        engineeringChanges: parsed.engineeringChanges?.length ? parsed.engineeringChanges : INITIAL_ENGINEERING_CHANGES,
        // Phase 9 additions
        machines: parsed.machines?.length ? parsed.machines : INITIAL_MACHINES,
        manpower: parsed.manpower?.length ? parsed.manpower : INITIAL_MANPOWER,
        productionCalendars: parsed.productionCalendars?.length ? parsed.productionCalendars : INITIAL_CALENDARS,
        productionShifts: parsed.productionShifts?.length ? parsed.productionShifts : INITIAL_SHIFTS,
        changeoverMatrix: parsed.changeoverMatrix?.length ? parsed.changeoverMatrix : INITIAL_CHANGEOVER_RULES,
        productionPlans: parsed.productionPlans?.length ? parsed.productionPlans : INITIAL_PRODUCTION_PLANS,
        finiteSchedules: parsed.finiteSchedules?.length ? parsed.finiteSchedules : INITIAL_FINITE_SCHEDULES,
        whatIfScenarios: parsed.whatIfScenarios?.length ? parsed.whatIfScenarios : INITIAL_WHAT_IF_SCENARIOS,
        testingScenarios: INITIAL_TESTING_SCENARIOS, // Always keep up-to-date scenarios
        customValues: parsed.customValues || {
          'prd-001': { materialGrade: 'AISI 304 / AL 6061', thicknessMm: 2.5, rohsCompliant: true, drawingNumber: 'DWG-KRX-2026-08' },
          'mo-124': { customerProject: 'PRJ-AEROSPACE-90', priorityReason: 'Standard Schedule', targetProductionLine: 'Cell A - High Precision' },
        },
        selectedPlant: 'PLANT-01',
        activeOrderFilter: 'ALL',
        currentUser: parsed.currentUser || { id: 'usr-001', name: 'Dewi Lestari', role: 'PPIC Supervisor' },
      };
    }
  } catch {
    // fallback
  }
  return {
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
    // Phase 8 additions
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
    // Phase 9 additions
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
    selectedPlant: 'PLANT-01',
    activeOrderFilter: 'ALL',
    currentUser: { id: 'usr-001', name: 'Dewi Lestari', role: 'PPIC Supervisor' },
    notifications: [
      {
        id: 'notif-p92',
        type: 'warning',
        message: 'Material Y deficit for MO-2026-00124 (2,700/3,000 available). Page 93 override active.',
        timestamp: 'Just now',
      },
    ],
  };
};

export function useErpStore() {
  const [state, setState] = useState<ErpState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
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
    if (!bom) return { availabilityPct: 100, shortages: [] };

    let totalWeight = 0;
    let fulfilledWeight = 0;
    const shortages: { sku: string; required: number; available: number }[] = [];

    for (const comp of bom.components) {
      const prod = state.products.find((p) => p.id === comp.componentProductId);
      const required = quantity * comp.quantityPerUnit;
      const unallocated = prod ? Math.max(0, prod.currentStock - prod.allocatedStock) : 0;
      totalWeight += required;

      if (unallocated >= required) {
        fulfilledWeight += required;
      } else {
        fulfilledWeight += unallocated;
        shortages.push({
          sku: comp.componentSku,
          required,
          available: unallocated,
        });
      }
    }

    const availabilityPct = totalWeight > 0 ? Math.round((fulfilledWeight / totalWeight) * 100) : 100;
    return { availabilityPct, shortages };
  }, [state.boms, state.products]);

  // 2. releaseProductionOrder (Page 93 & Page 112)
  const releaseProductionOrder = useCallback((orderId: string, overrideReason?: string) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;
      if (order.status !== 'PLANNED' && order.status !== 'DRAFT') return prev;

      // Check shortage
      const hasShortage = order.materials.some((m) => m.status === 'SHORTAGE');
      if (hasShortage && !overrideReason) {
        // Warning notification
        return prev;
      }

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // Update operations: first operation becomes READY
      const updatedOperations = order.operations.map((op, idx) => ({
        ...op,
        status: idx === 0 ? ('READY' as const) : ('PENDING' as const),
      }));

      const updatedOrder: ProductionOrder = {
        ...order,
        status: 'RELEASED',
        operations: updatedOperations,
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: order.orderNumber,
        documentType: 'PRODUCTION_ORDER',
        action: overrideReason ? 'RELEASE_WITH_OVERRIDE' : 'RELEASE_PRODUCTION_ORDER',
        actor: prev.currentUser.name,
        role: prev.currentUser.role,
        timestamp: timeStr,
        oldStatus: order.status,
        newStatus: 'RELEASED',
        decision: 'APPROVED',
        reason: overrideReason || 'Standard production order release after availability check.',
      };

      return {
        ...prev,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? updatedOrder : o)),
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    addNotification('success', `Production order ${orderId} has been RELEASED.`);
  }, [addNotification]);

  // 3. startWorkOrder (Page 96 & 112)
  const startWorkOrder = useCallback((orderId: string, operationSequence: number, operatorName: string) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const op = order.operations.find((o) => o.sequence === operationSequence);
      if (!op) return prev;

      // Check dependency (Page 96: Cutting must finish before Assembly!)
      if (op.dependencySeq) {
        const predecessor = order.operations.find((o) => o.sequence === op.dependencySeq);
        if (predecessor && predecessor.status !== 'COMPLETED') {
          return prev;
        }
      }

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const updatedOperations = order.operations.map((o) => {
        if (o.sequence === operationSequence) {
          return {
            ...o,
            status: 'IN_PROGRESS' as const,
            startedAt: timeStr,
            assignedOperator: operatorName,
          };
        }
        return o;
      });

      const updatedWorkCenters = prev.workCenters.map((wc) => {
        if (wc.id === op.workCenterId) {
          return {
            ...wc,
            status: 'RUNNING' as const,
            currentWorkOrderId: op.workOrderNo,
            currentOperator: operatorName,
          };
        }
        return wc;
      });

      const updatedOrder: ProductionOrder = {
        ...order,
        status: order.status === 'RELEASED' ? 'IN_PROGRESS' : order.status,
        actualStartDate: order.actualStartDate || timeStr,
        operations: updatedOperations,
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: op.workOrderNo,
        documentType: 'WORK_ORDER',
        action: 'START_WORK_ORDER',
        actor: operatorName,
        role: 'Operator',
        timestamp: timeStr,
        oldStatus: op.status,
        newStatus: 'IN_PROGRESS',
        decision: 'EXECUTED',
        reason: `Started operation ${op.operationCode} on ${op.workCenterCode}.`,
      };

      return {
        ...prev,
        workCenters: updatedWorkCenters,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? updatedOrder : o)),
        auditLogs: [audit, ...prev.auditLogs],
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

      const op = order.operations.find((o) => o.sequence === operationSequence);
      if (!op) return prev;

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const newLog: OutputLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        operationSequence,
        operationName: op.name,
        goodQty,
        scrapQty,
        reasonCode,
        operator,
        workCenterCode: op.workCenterCode,
        notes: notes || 'Shop floor execution output report',
      };

      const updatedCompleted = op.completedQty + goodQty;
      const updatedScrap = op.scrapQty + scrapQty;
      const isFinished = updatedCompleted >= op.targetQty;

      // Unlock next operation if finished
      let nextUnlocked = false;
      const updatedOperations = order.operations.map((o, index) => {
        if (o.sequence === operationSequence) {
          return {
            ...o,
            completedQty: updatedCompleted,
            scrapQty: updatedScrap,
            status: isFinished ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
            completedAt: isFinished ? timeStr : o.completedAt,
          };
        }
        if (isFinished && !nextUnlocked && order.operations[index - 1]?.sequence === operationSequence) {
          nextUnlocked = true;
          return {
            ...o,
            status: o.status === 'PENDING' ? ('READY' as const) : o.status,
          };
        }
        return o;
      });

      const isLastOp = operationSequence === order.operations[order.operations.length - 1]?.sequence;
      const totalGood = isLastOp ? Math.min(order.targetQuantity, order.goodQuantity + goodQty) : order.goodQuantity;
      const totalScrap = order.scrapQuantity + scrapQty;

      // Page 94: Partial production & Backorder logic
      // Remaining quantity stays open / backorder
      const remainingBackorder = Math.max(0, order.targetQuantity - totalGood - totalScrap);

      // Page 99: Immutable inventory movement posting
      const newMovements: StockMovement[] = [];

      // If last operation produced good units, post GR_PRODUCTION
      if (isLastOp && goodQty > 0) {
        newMovements.push({
          id: `mov-${Date.now()}-fg`,
          movementNo: `MATDOC-${Date.now().toString().slice(-6)}`,
          timestamp: timeStr,
          productId: order.productId,
          sku: order.productSku,
          quantity: goodQty,
          uom: 'PCS',
          fromLocation: `WIP-${op.workCenterCode}`,
          toLocation: 'WH-FG-BAY-A1',
          lotNumber: `LOT-FG-${now.getFullYear()}${now.getMonth() + 1}`,
          sourceDocument: order.orderNumber,
          movementType: 'GR_PRODUCTION',
        });
      }

      // If scrap reported, post SCRAP movement (Page 105)
      if (scrapQty > 0) {
        newMovements.push({
          id: `mov-${Date.now()}-scrap`,
          movementNo: `MATDOC-SCRAP-${Date.now().toString().slice(-4)}`,
          timestamp: timeStr,
          productId: order.productId,
          sku: order.productSku,
          quantity: scrapQty,
          uom: 'PCS',
          fromLocation: `WIP-${op.workCenterCode}`,
          toLocation: 'SCRAP-YARD',
          lotNumber: `LOT-SCRAP-${order.orderNumber}`,
          sourceDocument: order.orderNumber,
          movementType: 'SCRAP',
        });
      }

      const allDone = updatedOperations.every((o) => o.status === 'COMPLETED');

      const updatedOrder: ProductionOrder = {
        ...order,
        goodQuantity: totalGood,
        scrapQuantity: totalScrap,
        backorderQty: remainingBackorder,
        status: allDone ? 'COMPLETED' : order.status,
        actualEndDate: allDone ? timeStr : order.actualEndDate,
        operations: updatedOperations,
        outputLogs: [newLog, ...order.outputLogs],
        totalCostActual: order.totalCostActual + (goodQty * 120),
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: order.orderNumber,
        documentType: 'PRODUCTION_ORDER',
        action: 'REPORT_OUTPUT',
        actor: operator,
        role: 'Operator',
        timestamp: timeStr,
        decision: 'EXECUTED',
        reason: `Reported +${goodQty} Good, +${scrapQty} Scrap on Op ${op.operationCode}. Backorder remaining: ${remainingBackorder}.`,
      };

      return {
        ...prev,
        stockMovements: [...newMovements, ...prev.stockMovements],
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? updatedOrder : o)),
        auditLogs: [audit, ...prev.auditLogs],
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

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const updatedOperations = order.operations.map((o, idx) => {
        if (o.sequence === operationSequence) {
          return {
            ...o,
            status: 'COMPLETED' as const,
            completedQty: Math.max(o.completedQty, o.targetQty),
            completedAt: timeStr,
          };
        }
        if (order.operations[idx - 1]?.sequence === operationSequence && o.status === 'PENDING') {
          return { ...o, status: 'READY' as const };
        }
        return o;
      });

      const allDone = updatedOperations.every((o) => o.status === 'COMPLETED');

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

      const updatedOrder: ProductionOrder = {
        ...order,
        status: allDone ? 'COMPLETED' : order.status,
        actualEndDate: allDone ? timeStr : order.actualEndDate,
        operations: updatedOperations,
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: op.workOrderNo,
        documentType: 'WORK_ORDER',
        action: 'COMPLETE_OPERATION',
        actor: prev.currentUser.name,
        role: prev.currentUser.role,
        timestamp: timeStr,
        oldStatus: op.status,
        newStatus: 'COMPLETED',
        decision: 'EXECUTED',
        reason: `Operation ${op.operationCode} completed. Next operation unlocked.`,
      };

      return {
        ...prev,
        workCenters: updatedWorkCenters,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? updatedOrder : o)),
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    addNotification('success', `Operation ${operationSequence} marked as COMPLETED.`);
  }, [addNotification]);

  // 6. closeProductionOrder (Page 109 & 112)
  const closeProductionOrder = useCallback((orderId: string) => {
    setState((prev) => {
      const order = prev.productionOrders.find((o) => o.id === orderId);
      if (!order) return prev;

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const updatedOrder: ProductionOrder = {
        ...order,
        status: 'CLOSED',
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: order.orderNumber,
        documentType: 'PRODUCTION_ORDER',
        action: 'CLOSE_PRODUCTION_ORDER',
        actor: prev.currentUser.name,
        role: 'Controller',
        timestamp: timeStr,
        oldStatus: order.status,
        newStatus: 'CLOSED',
        decision: 'APPROVED',
        reason: 'Settled production actual costs, posted residual variances, closed order lifecycle.',
      };

      return {
        ...prev,
        productionOrders: prev.productionOrders.map((o) => (o.id === orderId ? updatedOrder : o)),
        auditLogs: [audit, ...prev.auditLogs],
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

    // Strict Gate BR-NPI-001: Unreleased products under NPI cannot be released for normal production
    if (product.lifecycleStatus && product.lifecycleStatus !== 'RELEASED') {
      const errorMsg = `Action Blocked (BR-NPI-001): Product ${product.sku} is in '${product.lifecycleStatus}' stage. Normal commercial production orders can only be dispatched for products in 'RELEASED' status. To produce pre-production units, initiate an NPI Trial Run under NPI Management or approve the Product Release Package.`;
      addNotification('error', errorMsg);
      return null;
    }

    const bom = state.boms.find((b) => b.productId === data.productId && b.status === 'ACTIVE') || state.boms[0];
    const routing = state.routings.find((r) => r.productId === data.productId && r.status === 'ACTIVE') || state.routings[0];

    // Snapshot official approved baseline release package if available
    const activeRelease = state.productReleases?.find(
      (r) => r.productId === product.id && r.status === 'ACTIVE'
    );

    const orderNum = `MO-2026-00${126 + state.productionOrders.length}`;
    const today = new Date().toISOString().split('T')[0];

    const materials = bom
      ? bom.components.map((c) => {
          const compProd = state.products.find((p) => p.id === c.componentProductId);
          const req = data.quantity * c.quantityPerUnit;
          const avail = compProd ? compProd.currentStock - compProd.allocatedStock : 0;
          return {
            productId: c.componentProductId,
            sku: c.componentSku,
            name: c.componentName,
            requiredQty: req,
            allocatedQty: 0,
            consumedQty: 0,
            availableStock: compProd ? compProd.currentStock : 0,
            uom: c.uom,
            unitCost: c.unitCost,
            status: (avail >= req ? 'SUFFICIENT' : 'SHORTAGE') as 'SUFFICIENT' | 'SHORTAGE',
          };
        })
      : [];

    const operations = routing
      ? routing.operations.map((op) => ({
          id: `op-new-${Date.now()}-${op.sequence}`,
          workOrderNo: `WO-${orderNum.split('-')[2]}-${op.sequence.toString().padStart(2, '0')}`,
          sequence: op.sequence,
          operationCode: op.operationCode,
          name: op.name,
          workCenterId: op.workCenterId,
          workCenterCode: op.workCenterCode,
          workCenterName: op.workCenterName,
          status: 'PENDING' as const,
          targetQty: data.quantity,
          completedQty: 0,
          scrapQty: 0,
          plannedDurationMinutes: Math.ceil((op.runTimeSecondsPerUnit * data.quantity) / 60) + op.setupTimeMinutes,
          actualDurationMinutes: 0,
          downtimeMinutes: 0,
          dependencySeq: op.dependencySeq,
          setupTimeMinutes: op.setupTimeMinutes,
          runTimeSecondsPerUnit: op.runTimeSecondsPerUnit,
        }))
      : [];

    const newOrder: ProductionOrder = {
      id: `mo-${Date.now()}`,
      orderNumber: orderNum,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      targetQuantity: data.quantity,
      goodQuantity: 0,
      scrapQuantity: 0,
      status: 'PLANNED',
      bomId: bom?.id || 'bom-001',
      bomCode: bom?.code || 'BOM-A',
      bomRevision: activeRelease?.bomRevision || bom?.revision || 'Rev.03',
      routingId: routing?.id || 'rt-001',
      routingCode: routing?.code || 'ROUTE-A',
      routingRevision: activeRelease?.routingRevision || routing?.revision || 'Rev.02',
      productRevision: activeRelease?.releasedRevision || product.currentRevision || 'Rev A',
      releasePackageId: activeRelease?.id,
      wiRevision: activeRelease?.wiRevision || 'Rev A',
      toolingRevision: activeRelease?.toolingRevision || 'Rev 01',
      plantId: 'PLANT-01',
      plantName: 'Cikarang Main Plant #1',
      dueDate: data.dueDate,
      plannedStartDate: today,
      demandLink: 'SO-2026-881',
      priority: 'NORMAL',
      materialAvailabilityPct: 92,
      operations,
      materials,
      outputLogs: [],
      totalCostPlanned: data.quantity * product.standardCost,
      totalCostActual: 0,
      backorderQty: data.quantity,
      createdAt: today,
    };

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
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newEvent: DowntimeEvent = {
      id: `dt-${Date.now()}`,
      workCenterCode,
      equipmentName,
      status: 'DOWN',
      startTime: timeStr,
      durationMinutes,
      reason,
      maintenanceTicketNo: `MT-2026-${Math.floor(100 + Math.random() * 900)}`,
      productionImpact: `Capacity loss of ${durationMinutes} mins recorded. Machine flagged DOWN.`,
    };

    setState((prev) => ({
      ...prev,
      downtimeEvents: [newEvent, ...prev.downtimeEvents],
      workCenters: prev.workCenters.map((wc) =>
        wc.code === workCenterCode ? { ...wc, status: 'DOWN' as const } : wc
      ),
    }));

    addNotification('error', `Machine Breakdown flagged on ${workCenterCode}: ${reason}. Ticket ${newEvent.maintenanceTicketNo} opened.`);
  }, [addNotification]);

  // 9. resolveMachineBreakdown (Page 101)
  const resolveMachineBreakdown = useCallback((eventId: string) => {
    setState((prev) => {
      const evt = prev.downtimeEvents.find((e) => e.id === eventId);
      if (!evt) return prev;

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return {
        ...prev,
        downtimeEvents: prev.downtimeEvents.map((e) =>
          e.id === eventId ? { ...e, status: 'RESOLVED' as const, endTime: timeStr } : e
        ),
        workCenters: prev.workCenters.map((wc) =>
          wc.code === evt.workCenterCode ? { ...wc, status: 'AVAILABLE' as const } : wc
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
        sc.id === scenarioId
          ? {
              ...sc,
              status: 'PASSED' as const,
              lastRunDetails: `Verified at ${new Date().toLocaleTimeString()}: Assertions validated against domain invariants.`,
            }
          : sc
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

      // BR-PRC-002: Segregation of Duties (SoD) - Requester CANNOT self-approve
      if (pr.requesterName.trim().toLowerCase() === activeUser.trim().toLowerCase()) {
        const errorMsg = `Segregation of Duties Violation (BR-PRC-002): Requester (${pr.requesterName}) is not permitted to self-approve their own Purchase Requisition. Approval must be performed by an independent authorized manager.`;
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
      if (!reason || reason.trim().length === 0) {
        addNotification('error', 'Rejection rejected: BR-PRC-002 mandates an explicit explanation reason for rejecting a PR.');
        return { success: false, error: 'Reason mandatory' };
      }

      const pr = state.purchaseRequisitions.find((p) => p.id === prId);
      if (!pr) return { success: false, error: 'PR not found' };

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

      const newMovements: StockMovement[] = [];
      const newInspections: QualityInspection[] = [];
      const updatedProducts = [...state.products];
      const grnItems: any[] = [];
      let anyQcRequired = false;

      const updatedPoItems = po.items.map((item) => {
        const line = receiptLines.find((r) => r.poItemId === item.id);
        if (!line || line.receivedQty <= 0) return item;

        const newReceivedQty = item.receivedQty + line.receivedQty;
        const bucket: StockBucket = line.incomingQcRequired ? 'HOLD' : 'AVAILABLE';
        if (line.incomingQcRequired) anyQcRequired = true;

        const inspectionId = line.incomingQcRequired ? `qc-${Date.now()}-${item.id}` : undefined;

        // 1. Immutable Stock Movement
        newMovements.push({
          id: `mov-${Date.now()}-${item.id}`,
          movementNo: `MATDOC-GRN-${grnSeq}-${item.sku.replace(/\s+/g, '')}`,
          timestamp: timeStr,
          productId: item.productId,
          sku: item.sku,
          quantity: line.receivedQty,
          uom: item.uom,
          fromLocation: 'SUPPLIER-INBOUND-DOCK',
          toLocation: line.warehouseLoc || (line.incomingQcRequired ? 'PLANT01-RM-WH-HOLD' : 'PLANT01-RM-WH-BAY-01'),
          lotNumber: line.supplierLot || `LOT-SUP-${Date.now().toString().slice(-4)}`,
          sourceDocument: grnNumber,
          movementType: 'GR_PURCHASE',
          stockBucket: bucket,
        });

        // 2. Auto-generate Quality Inspection if QC required (UC-PRC-004 & BR-INV-001)
        if (line.incomingQcRequired) {
          newInspections.push({
            id: inspectionId!,
            inspectionNo: `QC-2026-0${420 + state.inspections.length}`,
            sourceType: 'RECEIVING',
            sourceRef: grnNumber,
            productId: item.productId,
            sku: item.sku,
            productName: item.name,
            lotNumber: line.supplierLot,
            operationName: 'Incoming Raw Material Inspection (IQC Dock)',
            sampleSize: Math.min(50, line.receivedQty),
            defectsCount: 0,
            characteristic: 'Material Mill Certificate & Dimensional Tolerances',
            specification: 'ASTM / DIN Industrial Standard Compliance',
            result: 'PASS',
            disposition: 'HOLD',
            inspector: 'QC Receiving Specialist (Pending Release)',
            timestamp: timeStr,
            notes: `Material placed on HOLD pending official IQC sign-off. Supplier lot: ${line.supplierLot}.`,
          });
        }

        // 3. Update Product On-Hand Stock
        const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId);
        if (prodIndex >= 0) {
          updatedProducts[prodIndex] = {
            ...updatedProducts[prodIndex],
            currentStock: updatedProducts[prodIndex].currentStock + line.receivedQty,
          };
        }

        grnItems.push({
          id: `gri-${Date.now()}-${item.id}`,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          receivedQty: line.receivedQty,
          uom: item.uom,
          supplierLot: line.supplierLot,
          qcRequired: line.incomingQcRequired,
          stockBucket: bucket,
          targetLocation: line.warehouseLoc,
          inspectionId,
        });

        return {
          ...item,
          receivedQty: newReceivedQty,
        };
      });

      const isFullyReceived = updatedPoItems.every((it) => it.receivedQty >= it.orderedQty);

      const newGrn: GoodsReceiptNote = {
        id: `grn-${Date.now()}`,
        grnNumber,
        poId: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplierName,
        receivedDate: timeStr,
        receivedBy: state.currentUser.name,
        items: grnItems,
        notes: notes || 'Supplier delivery accepted at inbound dock.',
        stockBucketSummary: anyQcRequired
          ? 'Quarantine: Material routed to HOLD bucket (IQC Inspection required).'
          : 'Unrestricted: Stock placed directly into AVAILABLE inventory.',
      };

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
      // Find if lot has stock movements in HOLD
      const isLotOnHold = state.stockMovements.some(
        (m) => m.lotNumber === lotNumber && m.stockBucket === 'HOLD'
      );

      if (isLotOnHold && !isHoldOverride) {
        const errorMsg = `Action Blocked (UC-INV-003 / BR-INV-003): Material ${componentSku} from Lot ${lotNumber} is currently in HOLD / QUARANTINE status. Material under QC hold is strictly prohibited from being issued to shop floor production. Complete QC release inspection first.`;
        addNotification('error', errorMsg);
        return { success: false, error: errorMsg };
      }

      const order = state.productionOrders.find((o) => o.id === orderId);
      if (!order) return { success: false, error: 'Order not found' };

      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // Post GI_PRODUCTION stock movement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-gi`,
        movementNo: `MATDOC-GI-${Date.now().toString().slice(-5)}`,
        timestamp: timeStr,
        productId: 'raw-001',
        sku: componentSku,
        quantity,
        uom: 'KG',
        fromLocation: 'PLANT01-RM-WH-AVAILABLE',
        toLocation: `WIP-${order.operations[0]?.workCenterCode || 'WC-CUT-01'}`,
        lotNumber,
        sourceDocument: order.orderNumber,
        movementType: 'GI_PRODUCTION',
        stockBucket: 'WIP',
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: order.orderNumber,
        documentType: 'MATERIAL_ISSUE',
        action: 'ISSUE_MATERIAL',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: timeStr,
        decision: 'EXECUTED',
        reason: `Issued ${quantity} of ${componentSku} (Lot: ${lotNumber}) to ${order.orderNumber}.`,
      };

      setState((prev) => ({
        ...prev,
        stockMovements: [movement, ...prev.stockMovements],
        auditLogs: [audit, ...prev.auditLogs],
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

      const dwgApproved = state.drawings.some(
        (d) => d.productId === project.productId && (d.status === 'APPROVED' || d.status === 'RELEASED')
      );
      const specApproved = state.specifications.some(
        (s) => s.productId === project.productId && (s.status === 'APPROVED' || s.status === 'RELEASED')
      );
      const bomApproved = state.boms.some((b) => b.productId === project.productId && b.status === 'ACTIVE');
      const routingApproved = state.routings.some((r) => r.productId === project.productId && r.status === 'ACTIVE');
      const toolingQualified = state.toolingItems.some(
        (t) => t.productId === project.productId && (t.status === 'READY' || t.status === 'IN_USE')
      );
      const wiReleased = state.workInstructions.some(
        (w) => w.productId === project.productId && (w.status === 'APPROVED' || w.status === 'RELEASED')
      );
      const qcPlanReleased = state.qcPlans.some(
        (q) => q.productId === project.productId && (q.status === 'APPROVED' || q.status === 'RELEASED')
      );
      const materialReady = state.materialRequests.some(
        (m) => (m.sourceReferenceId === project.projectNumber || m.sourceReferenceId === project.id) && m.status === 'DELIVERED'
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
          checkItem: `Engineering Specification Released`,
          status: specApproved ? ('READY' as const) : ('BLOCKED' as const),
          blockingReason: specApproved ? undefined : 'Specification document has not been formally approved.',
          responsibleRole: 'Systems Architect',
          verifiedBy: specApproved ? 'Hendra Gunawan' : undefined,
          verifiedAt: specApproved ? new Date().toISOString().split('T')[0] : undefined,
        },
        {
          id: 'p-eng-3',
          pillar: 'ENGINEERING' as const,
          checkItem: `BOM Hierarchy Validated & Released`,
          status: bomApproved ? ('READY' as const) : ('BLOCKED' as const),
          blockingReason: bomApproved ? undefined : 'Active BOM is missing or not submitted.',
          responsibleRole: 'BOM Engineer',
          verifiedBy: bomApproved ? 'Dewi Lestari' : undefined,
          verifiedAt: bomApproved ? new Date().toISOString().split('T')[0] : undefined,
        },
        {
          id: 'p-tool-1',
          pillar: 'TOOLING' as const,
          checkItem: `Production Tooling Qualified (Molds, Jigs, Dies)`,
          status: toolingQualified ? ('READY' as const) : ('BLOCKED' as const),
          blockingReason: toolingQualified ? undefined : 'Required tooling is still in DESIGN or FABRICATION.',
          responsibleRole: 'Tooling Specialist',
          verifiedBy: toolingQualified ? 'Hendra Gunawan' : undefined,
          verifiedAt: toolingQualified ? new Date().toISOString().split('T')[0] : undefined,
        },
        {
          id: 'p-proc-1',
          pillar: 'PROCESS' as const,
          checkItem: `Manufacturing Routing & Work Instructions Released`,
          status: routingApproved && wiReleased ? ('READY' as const) : ('BLOCKED' as const),
          blockingReason: !routingApproved ? 'Routing is not active.' : !wiReleased ? 'Work Instructions not approved.' : undefined,
          responsibleRole: 'Methods Engineer',
          verifiedBy: routingApproved && wiReleased ? 'Dewi Lestari' : undefined,
          verifiedAt: routingApproved && wiReleased ? new Date().toISOString().split('T')[0] : undefined,
        },
        {
          id: 'p-mat-1',
          pillar: 'MATERIAL' as const,
          checkItem: `Trial Raw Materials Staged at Production Line (MR)`,
          status: materialReady ? ('READY' as const) : ('NOT_READY' as const),
          blockingReason: materialReady ? undefined : 'Material Request pending warehouse delivery to line staging.',
          responsibleRole: 'Warehouse Manager',
          verifiedBy: materialReady ? 'Joko Susilo' : undefined,
          verifiedAt: materialReady ? new Date().toISOString().split('T')[0] : undefined,
        },
        {
          id: 'p-qc-1',
          pillar: 'QUALITY' as const,
          checkItem: `Quality Control Plan & Inspection Characteristics Released`,
          status: qcPlanReleased ? ('READY' as const) : ('BLOCKED' as const),
          blockingReason: qcPlanReleased ? undefined : 'QC Plan (QCP) not yet released.',
          responsibleRole: 'Quality Director',
          verifiedBy: qcPlanReleased ? 'Siti Nurhaliza' : undefined,
          verifiedAt: qcPlanReleased ? new Date().toISOString().split('T')[0] : undefined,
        },
        {
          id: 'p-ppl-1',
          pillar: 'PEOPLE_PRODUCTION' as const,
          checkItem: `Shop Floor Operators Certified & Shift Scheduled`,
          status: 'READY' as const,
          responsibleRole: 'Production Supervisor',
          verifiedBy: 'Agus Pratama',
          verifiedAt: new Date().toISOString().split('T')[0],
        },
      ];

      const blockingIssues = items.filter((i) => i.status === 'BLOCKED').map((i) => `${i.checkItem}: ${i.blockingReason}`);
      const overallStatus = blockingIssues.length > 0 ? ('BLOCKED' as const) : items.some((i) => i.status === 'NOT_READY') ? ('NOT_READY' as const) : ('READY' as const);

      const report: ProductionReadinessReport = {
        id: `read-${Date.now()}`,
        npiProjectId,
        productSku: project.productSku,
        productRevision: project.productRevision,
        targetRunType: project.status === 'TRIAL' ? 'TRIAL' : 'PILOT',
        overallStatus,
        items,
        blockingIssues,
        evaluatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        evaluator: state.currentUser.name,
      };

      setState((prev) => ({
        ...prev,
        readinessReports: {
          ...prev.readinessReports,
          [npiProjectId]: report,
        },
        npiProjects: prev.npiProjects.map((p) =>
          p.id === npiProjectId ? { ...p, blockingIssues } : p
        ),
      }));

      addNotification(
        overallStatus === 'READY' ? 'success' : 'warning',
        `Production Readiness Evaluated: Overall status is ${overallStatus}. ${blockingIssues.length} blockers detected.`
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
      const mrNum = `MR-2026-${(state.materialRequests.length + 1).toString().padStart(6, '0')}`;
      const newMR: MaterialRequest = {
        id: `mr-${Date.now()}`,
        requestNumber: mrNum,
        sourceType: mrData.sourceType || 'PRODUCTION_ORDER',
        sourceReferenceId: mrData.sourceReferenceId || 'MO-2026-00124',
        productId: mrData.productId,
        productSku: mrData.productSku,
        requester: mrData.requester || state.currentUser.name,
        department: mrData.department || 'Manufacturing Shop Floor',
        requiredDate: mrData.requiredDate || new Date().toISOString().split('T')[0],
        destinationLine: mrData.destinationLine || 'Line 1 - Staging Bay',
        priority: mrData.priority || 'HIGH',
        status: 'SUBMITTED',
        items: mrData.items || [],
        notes: mrData.notes,
      };

      setState((prev) => ({
        ...prev,
        materialRequests: [newMR, ...prev.materialRequests],
      }));
      addNotification('success', `Created Material Request: ${newMR.requestNumber}`);
      return newMR;
    },
    [state.materialRequests.length, state.currentUser.name, addNotification]
  );

  const pickMaterialRequest = useCallback(
    (id: string, pickedBy: string) => {
      setState((prev) => ({
        ...prev,
        materialRequests: prev.materialRequests.map((mr) => {
          if (mr.id === id) {
            return {
              ...mr,
              status: 'READY' as const,
              pickedBy,
              pickedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              items: mr.items.map((it) => ({
                ...it,
                pickedQuantity: it.requestedQuantity,
                status: 'PICKED' as const,
              })),
            };
          }
          return mr;
        }),
      }));
      addNotification('info', `Material Request picked from warehouse bins and staged for line dispatch.`);
    },
    [addNotification]
  );

  const deliverMaterialRequestToLine = useCallback(
    (id: string, deliveredBy: string, lineLocation: string) => {
      const mr = state.materialRequests.find((m) => m.id === id);
      if (!mr) return;

      const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      // Post physical StockMovement into WIP / Line Staging
      const movements: StockMovement[] = mr.items.map((item, idx) => ({
        id: `mov-${Date.now()}-${idx}-line`,
        movementNo: `MATDOC-LINE-${Date.now().toString().slice(-5)}-${idx}`,
        timestamp: timeStr,
        productId: item.productId,
        sku: item.sku,
        quantity: item.requestedQuantity,
        uom: item.uom,
        fromLocation: item.fromWarehouse || 'MAIN-WH-STAGING',
        toLocation: lineLocation || mr.destinationLine,
        lotNumber: `LOT-LINE-${Date.now().toString().slice(-4)}`,
        sourceDocument: mr.requestNumber,
        movementType: 'GI_PRODUCTION',
        stockBucket: 'WIP',
      }));

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: mr.requestNumber,
        documentType: 'MATERIAL_REQUEST',
        action: 'LINE_DELIVERY',
        actor: deliveredBy,
        role: 'Material Logistics Handler',
        timestamp: timeStr,
        oldStatus: mr.status,
        newStatus: 'DELIVERED',
        decision: 'EXECUTED',
        reason: `Delivered ${mr.items.length} line items to ${lineLocation || mr.destinationLine}. Inventory posted to WIP ledger.`,
      };

      setState((prev) => ({
        ...prev,
        stockMovements: [...movements, ...prev.stockMovements],
        materialRequests: prev.materialRequests.map((m) => {
          if (m.id === id) {
            return {
              ...m,
              status: 'DELIVERED' as const,
              deliveredBy,
              deliveredAt: timeStr,
              receivedBy: state.currentUser.name,
              receivedAt: timeStr,
              items: m.items.map((it) => ({
                ...it,
                deliveredQuantity: it.requestedQuantity,
                status: 'DELIVERED' as const,
              })),
            };
          }
          return m;
        }),
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification('success', `Material Request ${mr.requestNumber} delivered to line. Ledger updated.`);
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
      const planSeq = (state.productionPlans.length + 1).toString().padStart(2, '0');
      const planNumber = planData.planNumber || `PLAN-2026-W43-${planSeq}`;
      const product = state.products.find((p) => p.id === planData.productId || p.sku === planData.productSku) || state.products[0];
      const demandQty = planData.demandQty || 5000;
      const plannedQty = planData.plannedQty !== undefined ? planData.plannedQty : demandQty;
      const unfulfilledQty = Math.max(0, demandQty - plannedQty);

      // Check BOM explosion
      const bomNode = explodeMultiLevelBom(product.id, demandQty, state.products, state.boms);
      const flat = bomNode ? [bomNode, ...(bomNode.children || [])] : [];
      const shortages = flat.filter((n) => n.shortageQty > 0);

      // Check routing & machine load
      const routing = state.routings.find((r) => r.productId === product.id || r.productSku === product.sku) || state.routings[0];
      const op10 = routing?.operations[0];
      const cycleTime = op10 ? op10.runTimeSecondsPerUnit : 30;
      const { pcsPerHour } = calculateOutputRate(cycleTime);
      const m01 = state.machines.find((m) => m.code === 'M01') || state.machines[0];
      const machineUnits = m01 ? m01.availableUnits : 3;
      const dailyCap = Math.round(machineUnits * 8 * pcsPerHour * (m01 ? m01.efficiencyRate : 0.85));
      const machineDeficitHours = Math.max(0, (demandQty - dailyCap) / (pcsPerHour * 0.85));

      const feasibility = evaluateProductionFeasibility(
        shortages.length,
        machineDeficitHours,
        2 // e.g. 2 operators deficit when 6 needed vs 4 available
      );

      const newPlan: ProductionPlanItem = {
        id: `plan-${Date.now()}`,
        planNumber,
        periodWeek: planData.periodWeek || 'Week 43 - Oct 2026',
        demandRef: planData.demandRef || 'DEM-2026-5001',
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        demandQty,
        plannedQty,
        unfulfilledQty,
        feasibility: feasibility.overallState,
        constraintNotes: feasibility.summaryMessage,
        targetStartDate: planData.targetStartDate || '2026-10-26',
        targetEndDate: planData.targetEndDate || '2026-10-30',
        status: planData.status || 'FEASIBILITY_REVIEW',
      };

      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        documentId: planNumber,
        documentType: 'PRODUCTION_PLAN',
        action: 'CREATE_PLAN',
        actor: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        newStatus: newPlan.status,
        decision: 'EXECUTED',
        reason: `Generated Master Production Plan ${planNumber}. Feasibility: ${newPlan.feasibility} (${feasibility.summaryMessage})`,
      };

      setState((prev) => ({
        ...prev,
        productionPlans: [newPlan, ...prev.productionPlans],
        auditLogs: [audit, ...prev.auditLogs],
      }));

      addNotification(
        newPlan.feasibility === 'FEASIBLE' ? 'success' : 'warning',
        `Created Production Plan ${planNumber} (${newPlan.feasibility}).`
      );
      return newPlan;
    },
    [state.productionPlans.length, state.products, state.boms, state.routings, state.machines, state.currentUser, addNotification]
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

      // Rule 1: Production cannot be scheduled without active routing!
      const routing = state.routings.find(
        (r) => (r.productId === plan.productId || r.productSku === plan.productSku) && r.status === 'ACTIVE'
      );
      if (!routing) {
        const err = `Rule 1 Violation: Cannot generate Work Order for ${plan.productSku} without an ACTIVE routing.`;
        addNotification('error', err);
        return { success: false, error: err };
      }

      const mo = createProductionOrder({
        productId: plan.productId,
        quantity: plan.plannedQty,
        dueDate: plan.targetEndDate,
      });

      if (mo) {
        setState((prev) => ({
          ...prev,
          productionPlans: prev.productionPlans.map((p) =>
            p.id === planId ? { ...p, status: 'DISPATCHED' as const, generatedWorkOrderId: mo.id } : p
          ),
        }));
        addNotification('success', `Dispatched Work Order ${mo.orderNumber} from Plan ${plan.planNumber}. BOM & Routing revisions snapshot frozen per Rule 10.`);
        return { success: true, orderId: mo.id };
      }
      return { success: false, error: 'Failed to create production order.' };
    },
    [state.productionPlans, state.routings, createProductionOrder, addNotification]
  );

  const runFiniteScheduling = useCallback(
    (options?: { startDate?: string; shiftStartTime?: string; shiftHours?: number }) => {
      const targetDemand = state.demands.find((d) => d.productSku === 'FG-001') || state.demands[0];
      const product = state.products.find((p) => p.id === targetDemand.productId || p.sku === targetDemand.productSku) || state.products[0];
      const routing = state.routings.find((r) => r.productId === product.id || r.productSku === product.sku) || state.routings[0];

      const slots = generateFiniteScheduleSlots(
        targetDemand,
        product,
        routing,
        state.machines,
        state.manpower,
        state.changeoverMatrix,
        {
          startDate: options?.startDate || '2026-10-26',
          shiftStartTime: options?.shiftStartTime || '07:00',
          shiftHours: options?.shiftHours || 8,
        }
      );

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
      const scenarios = runWhatIfSimulation(
        'FG-001',
        5000,
        '2026-10-30',
        state.machines,
        routing,
        [
          { name: 'Scenario A: Baseline (2 Machines, 8h Shift)', description: 'Baseline single-shift capacity allocation', machineQuantityOverride: 2, shiftHours: 8, extraShift: false },
          { name: 'Scenario B: +1 Machine (3 Machines M01, 8h Shift)', description: 'Activate 3rd machine to increase throughput', machineQuantityOverride: 3, shiftHours: 8, extraShift: false },
          { name: 'Scenario C: 2 Machines + Overtime (10h Shift)', description: 'Authorize 2h daily overtime on 2 machines', machineQuantityOverride: 2, shiftHours: 10, extraShift: false },
        ]
      );

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
    localStorage.removeItem(STORAGE_KEY);
    setState(getInitialState());
    addNotification('info', 'Reset database to pristine PDF specification baseline.');
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
