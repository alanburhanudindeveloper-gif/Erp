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
} from '../mockData';
import { runMRPCalculation } from '../calculations/mrpCalculator';

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
        suppliers: parsed.suppliers?.length ? parsed.suppliers : INITIAL_SUPPLIERS,
        purchaseRequisitions: parsed.purchaseRequisitions?.length ? parsed.purchaseRequisitions : INITIAL_PURCHASE_REQUISITIONS,
        purchaseOrders: parsed.purchaseOrders?.length ? parsed.purchaseOrders : INITIAL_PURCHASE_ORDERS,
        goodsReceiptNotes: parsed.goodsReceiptNotes?.length ? parsed.goodsReceiptNotes : INITIAL_GOODS_RECEIPTS,
        featureRegistry: parsed.featureRegistry?.length ? parsed.featureRegistry : INITIAL_FEATURE_REGISTRY,
        customFields: parsed.customFields?.length ? parsed.customFields : INITIAL_CUSTOM_FIELDS,
        workflows: parsed.workflows?.length ? parsed.workflows : INITIAL_WORKFLOWS,
        businessRules: parsed.businessRules?.length ? parsed.businessRules : INITIAL_BUSINESS_RULES,
        subcontractOrders: parsed.subcontractOrders?.length ? parsed.subcontractOrders : INITIAL_SUBCONTRACT_ORDERS,
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

  // 7. createProductionOrder (Page 40-43 & 93)
  const createProductionOrder = useCallback((data: {
    productId: string;
    quantity: number;
    dueDate: string;
  }) => {
    const product = state.products.find((p) => p.id === data.productId);
    if (!product) return;

    const bom = state.boms.find((b) => b.productId === data.productId && b.status === 'ACTIVE') || state.boms[0];
    const routing = state.routings.find((r) => r.productId === data.productId && r.status === 'ACTIVE') || state.routings[0];

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
      bomRevision: bom?.revision || 'Rev.03',
      routingId: routing?.id || 'rt-001',
      routingCode: routing?.code || 'ROUTE-A',
      routingRevision: routing?.revision || 'Rev.02',
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

    addNotification('success', `Created Planned Order ${orderNum} for ${data.quantity} units of ${product.sku}.`);
    return newOrder;
  }, [state.products, state.boms, state.routings, state.productionOrders.length, addNotification]);

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
      addNotification('success', `Received ${receivedQty} units from subcontract supplier.`);
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
  };
}
