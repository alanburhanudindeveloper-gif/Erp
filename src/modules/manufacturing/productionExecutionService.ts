import type { AuditLogEntry, OutputLogEntry, ProductionOrder, StockMovement } from '../../types';
import { evaluateProductionRelease } from './productionReleaseService';

export interface ProductionExecutionTransitionResult {
  allowed: boolean;
  reason?: string;
  updatedOrder?: ProductionOrder;
  auditLog?: AuditLogEntry;
  outputLog?: OutputLogEntry;
  stockMovements?: StockMovement[];
}

export function releaseProductionOrderForExecution(
  order: ProductionOrder,
  actor: string,
  role: string,
  overrideReason?: string
): ProductionExecutionTransitionResult {
  return evaluateProductionRelease(order, actor, role, overrideReason);
}

export function startProductionOperation(
  order: ProductionOrder,
  operationSequence: number,
  operatorName: string
): ProductionExecutionTransitionResult {
  const op = order.operations.find((item) => item.sequence === operationSequence);
  if (!op) {
    return {
      allowed: false,
      reason: `Operation sequence ${operationSequence} was not found on order ${order.orderNumber}.`,
    };
  }

  if (op.dependencySeq) {
    const predecessor = order.operations.find((item) => item.sequence === op.dependencySeq);
    if (predecessor && predecessor.status !== 'COMPLETED') {
      return {
        allowed: false,
        reason: `Operation ${op.operationCode} cannot start until dependency ${predecessor.operationCode} is completed.`,
      };
    }
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const updatedOperations = order.operations.map((item) => {
    if (item.sequence === operationSequence) {
      return {
        ...item,
        status: 'IN_PROGRESS' as const,
        startedAt: timeStr,
        assignedOperator: operatorName,
      };
    }
    return item;
  });

  const updatedOrder: ProductionOrder = {
    ...order,
    status: order.status === 'RELEASED' ? 'IN_PROGRESS' : order.status,
    actualStartDate: order.actualStartDate || timeStr,
    operations: updatedOperations,
  };

  const auditLog: AuditLogEntry = {
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
    allowed: true,
    reason: `Operation ${operationSequence} is now IN PROGRESS.`,
    updatedOrder,
    auditLog,
  };
}

export function completeProductionOperation(
  order: ProductionOrder,
  operationSequence: number,
  actor: string,
  role: string = 'Operator'
): ProductionExecutionTransitionResult {
  const op = order.operations.find((item) => item.sequence === operationSequence);
  if (!op) {
    return {
      allowed: false,
      reason: `Operation sequence ${operationSequence} was not found on order ${order.orderNumber}.`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const updatedOperations = order.operations.map((item, index) => {
    if (item.sequence === operationSequence) {
      return {
        ...item,
        status: 'COMPLETED' as const,
        completedQty: Math.max(item.completedQty, item.targetQty),
        completedAt: timeStr,
      };
    }

    if (order.operations[index - 1]?.sequence === operationSequence && item.status === 'PENDING') {
      return {
        ...item,
        status: 'READY' as const,
      };
    }
    return item;
  });

  const allDone = updatedOperations.every((item) => item.status === 'COMPLETED');
  const updatedOrder: ProductionOrder = {
    ...order,
    status: allDone ? 'COMPLETED' : order.status,
    actualEndDate: allDone ? timeStr : order.actualEndDate,
    operations: updatedOperations,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: op.workOrderNo,
    documentType: 'WORK_ORDER',
    action: 'COMPLETE_OPERATION',
    actor,
    role,
    timestamp: timeStr,
    oldStatus: op.status,
    newStatus: 'COMPLETED',
    decision: 'EXECUTED',
    reason: `Operation ${op.operationCode} completed. Next operation unlocked.`,
  };

  return {
    allowed: true,
    reason: `Operation ${operationSequence} marked as COMPLETED.`,
    updatedOrder,
    auditLog,
  };
}

export function closeProductionOrderExecution(
  order: ProductionOrder,
  actor: string,
  role: string = 'Controller'
): ProductionExecutionTransitionResult {
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const updatedOrder: ProductionOrder = {
    ...order,
    status: 'CLOSED',
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: order.orderNumber,
    documentType: 'PRODUCTION_ORDER',
    action: 'CLOSE_PRODUCTION_ORDER',
    actor,
    role,
    timestamp: timeStr,
    oldStatus: order.status,
    newStatus: 'CLOSED',
    decision: 'APPROVED',
    reason: 'Settled production actual costs, posted residual variances, closed order lifecycle.',
  };

  return {
    allowed: true,
    reason: `Production order ${order.orderNumber} CLOSED and costs settled.`,
    updatedOrder,
    auditLog,
  };
}

export function reportProductionOutputForExecution(
  order: ProductionOrder,
  operationSequence: number,
  goodQty: number,
  scrapQty: number,
  reasonCode: string | undefined,
  operator: string,
  notes?: string
): ProductionExecutionTransitionResult {
  const op = order.operations.find((item) => item.sequence === operationSequence);
  if (!op) {
    return {
      allowed: false,
      reason: `Operation sequence ${operationSequence} was not found on order ${order.orderNumber}.`,
    };
  }

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

  let nextUnlocked = false;
  const updatedOperations = order.operations.map((item, index) => {
    if (item.sequence === operationSequence) {
      return {
        ...item,
        completedQty: updatedCompleted,
        scrapQty: updatedScrap,
        status: isFinished ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
        completedAt: isFinished ? timeStr : item.completedAt,
      };
    }

    if (isFinished && !nextUnlocked && order.operations[index - 1]?.sequence === operationSequence) {
      nextUnlocked = true;
      return {
        ...item,
        status: item.status === 'PENDING' ? ('READY' as const) : item.status,
      };
    }

    return item;
  });

  const isLastOp = operationSequence === order.operations[order.operations.length - 1]?.sequence;
  const totalGood = Math.min(order.targetQuantity, order.goodQuantity + goodQty);
  const totalScrap = order.scrapQuantity + scrapQty;
  const remainingBackorder = Math.max(0, order.targetQuantity - totalGood);

  const stockMovements: StockMovement[] = [];
  if (goodQty > 0) {
    stockMovements.push({
      id: `mov-${Date.now()}`,
      movementNo: `MOV-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      productId: order.productId,
      sku: order.productSku,
      quantity: goodQty,
      uom: 'PCS',
      fromLocation: `WIP-${op.workCenterCode}`,
      toLocation: 'FG-STORE',
      lotNumber: `LOT-${order.orderNumber}-${op.sequence}`,
      sourceDocument: order.orderNumber,
      movementType: 'GR_PRODUCTION',
      stockBucket: 'AVAILABLE',
    });
  }

  if (scrapQty > 0) {
    stockMovements.push({
      id: `mov-${Date.now() + 1}`,
      movementNo: `MOV-${(Date.now() + 1).toString().slice(-6)}`,
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
      stockBucket: 'REJECTED',
    });
  }

  const allDone = updatedOperations.every((item) => item.status === 'COMPLETED');

  const updatedOrder: ProductionOrder = {
    ...order,
    goodQuantity: totalGood,
    scrapQuantity: totalScrap,
    backorderQty: remainingBackorder,
    status: allDone ? 'COMPLETED' : order.status,
    actualEndDate: allDone ? timeStr : order.actualEndDate,
    operations: updatedOperations,
    outputLogs: [newLog, ...order.outputLogs],
    totalCostActual: order.totalCostActual + goodQty * 120,
  };

  const auditLog: AuditLogEntry = {
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
    allowed: true,
    reason: `Recorded output: ${goodQty} Good, ${scrapQty} Scrap. Stock movement posted.`,
    updatedOrder,
    auditLog,
    outputLog: newLog,
    stockMovements,
  };
}
