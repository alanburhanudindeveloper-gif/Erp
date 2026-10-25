import {
  DemandRecord,
  Product,
  Routing,
  MachineMaster,
  EmployeeManpower,
  ChangeoverRule,
  FiniteScheduledSlot,
  WhatIfScenario,
} from '../../types';
import { calculateOutputRate } from '../planning/planningService';

export interface ScheduleRunOptions {
  startDate: string;
  shiftStartTime: string;
  shiftHours: number;
  objective?: 'MINIMIZE_CHANGEOVER' | 'MINIMIZE_LATE' | 'MAXIMIZE_UTILIZATION';
}

export function calculateChangeoverTime(
  fromProductSku: string,
  toProductSku: string,
  rules: ChangeoverRule[]
): number {
  if (!fromProductSku || !toProductSku || fromProductSku === toProductSku) {
    return 0;
  }

  const match = rules.find(
    (rule) => rule.fromProductSku === fromProductSku && rule.toProductSku === toProductSku
  );
  if (match) return match.changeoverMinutes;

  const reverseMatch = rules.find(
    (rule) => rule.fromProductSku === toProductSku && rule.toProductSku === fromProductSku
  );
  if (reverseMatch) return reverseMatch.changeoverMinutes;

  return 30;
}

export function generateFiniteScheduleSlots(
  demand: DemandRecord,
  product: Product,
  routing: Routing,
  machines: MachineMaster[],
  employees: EmployeeManpower[],
  changeoverRules: ChangeoverRule[],
  options: ScheduleRunOptions
): FiniteScheduledSlot[] {
  if (!routing || !routing.operations || routing.operations.length === 0) {
    return [];
  }

  const slots: FiniteScheduledSlot[] = [];
  let currentStart = new Date(`${options.startDate}T${options.shiftStartTime}:00`);
  let previousProductSku = 'Product A';

  routing.operations.forEach((op) => {
    const machine = machines.find(
      (item) =>
        item.workCenterCode === op.workCenterCode ||
        item.code.toLowerCase() === op.workCenterCode.toLowerCase()
    );
    const machineCode = machine ? machine.code : op.workCenterCode;
    const machineUnits = machine ? machine.availableUnits : 1;
    const efficiency = machine ? machine.efficiencyRate : 0.85;

    const cycleTime = op.runTimeSecondsPerUnit || 30;
    const { pcsPerHour } = calculateOutputRate(cycleTime);
    const effectivePcsPerHour = pcsPerHour * efficiency;
    const parallelRatePerHour = effectivePcsPerHour * machineUnits;
    const processingHours = demand.quantity / parallelRatePerHour;
    const processingMinutes = Math.round(processingHours * 60);

    const changeoverMinutes = calculateChangeoverTime(previousProductSku, product.sku, changeoverRules);
    const setupMinutes = op.setupTimeMinutes || 15;
    const totalDurationMinutes = setupMinutes + changeoverMinutes + processingMinutes;

    const requiredOperatorsPerMachine = op.manpowerRequired || 1;
    const totalRequiredManpower = machineUnits * requiredOperatorsPerMachine;
    const qualifiedEmps = employees
      .filter((employee) => employee.qualifiedWorkCenters.includes(op.workCenterCode) && employee.status === 'AVAILABLE')
      .slice(0, totalRequiredManpower);

    const slotStart = new Date(currentStart);
    const slotEnd = new Date(slotStart.getTime() + totalDurationMinutes * 60 * 1000);
    const slotStartStr = slotStart.toISOString().replace('T', ' ').slice(0, 16);
    const slotEndStr = slotEnd.toISOString().replace('T', ' ').slice(0, 16);

    let status: 'SCHEDULED' | 'CONFLICT' | 'BLOCKED' = 'SCHEDULED';
    let conflictReason: string | undefined;

    if (machine && machine.status === 'MAINTENANCE') {
      status = 'BLOCKED';
      conflictReason = `Machine ${machine.code} is blocked under planned maintenance.`;
    } else if (qualifiedEmps.length < totalRequiredManpower) {
      status = 'CONFLICT';
      conflictReason = `Manpower shortage: Required ${totalRequiredManpower} operators, only ${qualifiedEmps.length} available.`;
    }

    slots.push({
      id: `slot-${demand.id}-${op.sequence}`,
      scheduleNo: `SCHED-${demand.demandNo}-${op.sequence}`,
      demandRef: demand.demandNo,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      targetQty: demand.quantity,
      operationSeq: op.sequence,
      operationName: op.name,
      workCenterCode: op.workCenterCode,
      machineCode,
      machineUnitsAllocated: machineUnits,
      manpowerRequired: totalRequiredManpower,
      manpowerAssigned: qualifiedEmps.map((employee) => employee.name),
      startDateTime: slotStartStr,
      endDateTime: slotEndStr,
      durationMinutes: totalDurationMinutes,
      setupMinutes,
      changeoverMinutes,
      processingMinutes,
      expectedOutput: demand.quantity,
      status,
      conflictReason,
    });

    currentStart = new Date(slotEnd);
    previousProductSku = product.sku;
  });

  return slots;
}

export function runWhatIfSimulation(
  targetProductSku: string,
  demandQty: number,
  dueDate: string,
  baselineMachines: MachineMaster[],
  routing: Routing,
  scenariosToRun: {
    name: string;
    description: string;
    machineQuantityOverride: number;
    shiftHours: number;
    extraShift: boolean;
  }[]
): WhatIfScenario[] {
  const op10 = routing.operations[0] || { runTimeSecondsPerUnit: 30, setupTimeMinutes: 15 };
  const cycleTime = op10.runTimeSecondsPerUnit || 30;
  const { pcsPerHour } = calculateOutputRate(cycleTime);
  const efficiency = 0.85;

  return scenariosToRun.map((scenario, index) => {
    const totalWorkingHoursPerDay = scenario.extraShift ? scenario.shiftHours * 2 : scenario.shiftHours;
    const effectiveUnits = scenario.machineQuantityOverride;

    const grossCapacityPerDay = effectiveUnits * totalWorkingHoursPerDay * pcsPerHour;
    const effectiveCapacityPerDay = Math.round(grossCapacityPerDay * efficiency);

    const requiredRunHours = demandQty / (pcsPerHour * efficiency);
    const requiredTotalHours = Number((requiredRunHours / effectiveUnits).toFixed(1));
    const daysRequired = Math.ceil(requiredTotalHours / totalWorkingHoursPerDay);

    const startDate = new Date(2026, 9, 26, 7, 0);
    const completionDate = new Date(startDate);
    completionDate.setDate(startDate.getDate() + daysRequired);
    const compDateStr = completionDate.toISOString().split('T')[0];

    const requiredManpower = effectiveUnits * 2;
    const availableOperators = 4;
    const manpowerShortage = Math.max(0, requiredManpower - availableOperators);

    const baselineDays = Math.ceil((demandQty / (pcsPerHour * efficiency * 2)) / 8);
    const comparisonVsBaselineDays = baselineDays - daysRequired;

    return {
      id: `whatif-${index + 1}`,
      name: scenario.name,
      description: scenario.description,
      targetProductSku,
      targetDemandQty: demandQty,
      dueDate,
      machineOverrides: [{ machineCode: 'M01', quantity: effectiveUnits }],
      shiftHoursOverride: scenario.shiftHours,
      extraShiftActive: scenario.extraShift,
      computedOutputRatePcsPerHour: pcsPerHour * effectiveUnits,
      computedGrossCapacityPerDay: grossCapacityPerDay,
      computedEffectiveCapacityPerDay: effectiveCapacityPerDay,
      computedProductionDurationHours: requiredTotalHours,
      computedCompletionDate: compDateStr,
      computedManpowerRequirement: requiredManpower,
      computedManpowerShortage: manpowerShortage,
      computedMaterialShortages: [{ sku: 'COMP-A', required: demandQty * 2, shortage: 1000 }],
      feasibilityState:
        manpowerShortage > 0
          ? 'MANPOWER_SHORTAGE'
          : compDateStr > dueDate
            ? 'MACHINE_CAPACITY_SHORTAGE'
            : 'FEASIBLE',
      comparisonVsBaselineDays,
    };
  });
}
