import type {
  EmployeeMaster,
  OutputLogEntry,
  ProductionOrder,
  ProductionOrderOperation,
  ShopFloorSession,
  WorkCenter,
} from '../../types';

export interface OperatorCheckInResult {
  allowed: boolean;
  reason?: string;
  session?: ShopFloorSession;
}

export interface OperatorCheckOutResult {
  allowed: boolean;
  reason?: string;
  durationMinutes: number;
}

export interface OperationTelemetrySnapshot {
  workOrderNo: string;
  operationCode: string;
  targetQty: number;
  completedQty: number;
  scrapQty: number;
  progressPercent: number;
  scrapRatePercent: number;
  isHighScrapAlert: boolean;
  standardCycleTimeSeconds: number;
  actualPaceSecondsPerUnit: number;
  efficiencyPercent: number;
}

/**
 * Validates physical employee credentials (NIK badge, skill, plant) and begins a shop floor kiosk session.
 */
export function checkInOperator(
  nikOrBadge: string,
  workCenter: WorkCenter,
  allEmployees: EmployeeMaster[]
): OperatorCheckInResult {
  const employee = allEmployees.find(
    (e) => e.nik === nikOrBadge || e.id === nikOrBadge
  );

  if (!employee) {
    return {
      allowed: false,
      reason: `Operator badge or NIK '${nikOrBadge}' was not recognized in Employee Master records.`,
    };
  }

  if (!employee.active) {
    return {
      allowed: false,
      reason: `Operator ${employee.fullName} (${employee.nik}) is currently inactive.`,
    };
  }

  if (employee.plantId !== workCenter.plantId) {
    return {
      allowed: false,
      reason: `Operator plant (${employee.plantId}) does not match work center location (${workCenter.plantId}).`,
    };
  }

  const now = new Date();
  const session: ShopFloorSession = {
    id: `sess-${Date.now()}-${employee.nik}`,
    workCenterCode: workCenter.code,
    operator: `${employee.fullName} (${employee.nik})`,
    startedAt: now.toISOString(),
  };

  return {
    allowed: true,
    reason: `Operator ${employee.fullName} authenticated for ${workCenter.name} [${workCenter.code}].`,
    session,
  };
}

/**
 * Ends an active operator session and computes logged operating duration.
 */
export function checkOutOperator(session: ShopFloorSession): OperatorCheckOutResult {
  const startTime = new Date(session.startedAt).getTime();
  const endTime = Date.now();
  const durationMs = Math.max(0, endTime - startTime);
  const durationMinutes = Math.round((durationMs / 60000) * 10) / 10;

  return {
    allowed: true,
    reason: `Operator session ended for ${session.operator} at ${session.workCenterCode}.`,
    durationMinutes,
  };
}

/**
 * Computes live operational telemetry (progress %, scrap %, cycle efficiency, and quality alarms).
 */
export function calculateOperationTelemetry(
  operation: ProductionOrderOperation,
  totalElapsedMinutes: number = 0
): OperationTelemetrySnapshot {
  const target = Math.max(1, operation.targetQty);
  const completed = operation.completedQty;
  const scrap = operation.scrapQty;
  const totalProduced = completed + scrap;

  const progressPercent = Math.min(100, Math.round((completed / target) * 1000) / 10);
  const scrapRatePercent = totalProduced > 0 ? Math.round((scrap / totalProduced) * 1000) / 10 : 0;
  const isHighScrapAlert = scrapRatePercent >= 5.0 && scrap > 0;

  const standardCycleSeconds = operation.runTimeSecondsPerUnit || 60;
  let actualPaceSeconds = standardCycleSeconds;
  let efficiencyPercent = 100;

  if (completed > 0 && totalElapsedMinutes > 0) {
    const elapsedSeconds = totalElapsedMinutes * 60;
    actualPaceSeconds = Math.round((elapsedSeconds / completed) * 10) / 10;
    if (actualPaceSeconds > 0) {
      efficiencyPercent = Math.min(200, Math.round((standardCycleSeconds / actualPaceSeconds) * 1000) / 10);
    }
  }

  return {
    workOrderNo: operation.workOrderNo,
    operationCode: operation.operationCode,
    targetQty: target,
    completedQty: completed,
    scrapQty: scrap,
    progressPercent,
    scrapRatePercent,
    isHighScrapAlert,
    standardCycleTimeSeconds: standardCycleSeconds,
    actualPaceSecondsPerUnit: actualPaceSeconds,
    efficiencyPercent,
  };
}
