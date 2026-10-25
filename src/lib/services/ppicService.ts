import {
  Product,
  BillOfMaterials,
  Routing,
  RoutingOperation,
  MachineMaster,
  EmployeeManpower,
  ProductionCalendar,
  ProductionShift,
  ChangeoverRule,
  DemandRecord,
  ProductionPlanItem,
  FiniteScheduledSlot,
  WhatIfScenario,
  BottleneckAnalysisResult,
  MultiLevelBomNode,
  FeasibilityState,
} from '../../types';

// ============================================================================
// 1. CYCLE TIME & OUTPUT RATE ENGINE (Section 6)
// ============================================================================

export interface OutputRateResult {
  cycleTimeSeconds: number;
  pcsPerSecond: number;
  pcsPerMinute: number;
  pcsPerHour: number;
}

/**
 * Calculates output rate from cycle time in seconds.
 * Formula: Output Rate = 1 / Cycle Time
 * Example: 30 sec/pcs -> 60/30 = 2 pcs/min -> 2 * 60 = 120 pcs/hour
 */
export function calculateOutputRate(cycleTimeSeconds: number): OutputRateResult {
  if (!cycleTimeSeconds || cycleTimeSeconds <= 0) {
    return { cycleTimeSeconds: 0, pcsPerSecond: 0, pcsPerMinute: 0, pcsPerHour: 0 };
  }
  const pcsPerSecond = 1 / cycleTimeSeconds;
  const pcsPerMinute = 60 / cycleTimeSeconds;
  const pcsPerHour = Number((pcsPerMinute * 60).toFixed(2));
  return {
    cycleTimeSeconds,
    pcsPerSecond,
    pcsPerMinute,
    pcsPerHour,
  };
}

// ============================================================================
// 2. MACHINE CAPACITY ENGINE (Section 7 & 8)
// ============================================================================

export interface MachineCapacityResult {
  machineCode: string;
  machineUnits: number;
  workingHoursPerDay: number;
  cycleTimeSeconds: number;
  outputRatePerHour: number;
  grossCapacityPcsPerDay: number;
  efficiencyRate: number;
  effectiveCapacityPcsPerDay: number;
}

/**
 * Gross Capacity = Machines × Available Working Hours × Output Rate
 * Effective Capacity = Gross Capacity × Efficiency
 * Example (Section 8):
 * M01: 3 units, 8 hours, 120 pcs/hr, 85% eff -> Gross = 2,880 pcs/day, Effective = 2,448 pcs/day.
 */
export function calculateMachineCapacity(
  machineCode: string,
  machineUnits: number,
  workingHoursPerDay: number,
  cycleTimeSeconds: number,
  efficiencyRate: number = 0.85
): MachineCapacityResult {
  const { pcsPerHour } = calculateOutputRate(cycleTimeSeconds);
  const grossCapacityPcsPerDay = Math.round(machineUnits * workingHoursPerDay * pcsPerHour);
  const effectiveCapacityPcsPerDay = Math.round(grossCapacityPcsPerDay * efficiencyRate);

  return {
    machineCode,
    machineUnits,
    workingHoursPerDay,
    cycleTimeSeconds,
    outputRatePerHour: pcsPerHour,
    grossCapacityPcsPerDay,
    efficiencyRate,
    effectiveCapacityPcsPerDay,
  };
}

/**
 * Calculates machine hours required to produce target quantity.
 */
export function calculateRequiredMachineHours(
  targetQty: number,
  outputRatePerHour: number,
  efficiencyRate: number = 0.85,
  setupMinutes: number = 0
): { runHours: number; setupHours: number; totalHours: number } {
  if (outputRatePerHour <= 0) return { runHours: 0, setupHours: 0, totalHours: 0 };
  const effectiveRate = outputRatePerHour * efficiencyRate;
  const runHours = Number((targetQty / effectiveRate).toFixed(2));
  const setupHours = Number((setupMinutes / 60).toFixed(2));
  const totalHours = Number((runHours + setupHours).toFixed(2));
  return { runHours, setupHours, totalHours };
}

// ============================================================================
// 3. MANPOWER CAPACITY & SHORTAGE ENGINE (Section 9)
// ============================================================================

export interface ManpowerRequirementResult {
  operationName: string;
  machinesScheduled: number;
  operatorsPerMachine: number;
  totalRequiredOperators: number;
  availableOperators: number;
  operatorShortage: number;
  hasShortage: boolean;
  qualifiedEmployees: EmployeeManpower[];
}

export function calculateManpowerRequirement(
  operationName: string,
  machinesScheduled: number,
  operatorsPerMachine: number,
  workCenterCode: string,
  allEmployees: EmployeeManpower[]
): ManpowerRequirementResult {
  const totalRequiredOperators = machinesScheduled * operatorsPerMachine;
  const qualified = allEmployees.filter(
    (emp) =>
      emp.status === 'AVAILABLE' &&
      emp.qualifiedWorkCenters.some((wc) => wc.toLowerCase() === workCenterCode.toLowerCase())
  );
  const availableOperators = qualified.length;
  const operatorShortage = Math.max(0, totalRequiredOperators - availableOperators);

  return {
    operationName,
    machinesScheduled,
    operatorsPerMachine,
    totalRequiredOperators,
    availableOperators,
    operatorShortage,
    hasShortage: operatorShortage > 0,
    qualifiedEmployees: qualified,
  };
}

// ============================================================================
// 4. MULTI-LEVEL BOM EXPLOSION & MATERIAL REQUIREMENT (Section 4 & 10)
// ============================================================================

export function explodeMultiLevelBom(
  targetProductId: string,
  demandQty: number,
  allProducts: Product[],
  allBoms: BillOfMaterials[],
  currentLevel: number = 0,
  multiplier: number = 1
): MultiLevelBomNode | null {
  const product = allProducts.find((p) => p.id === targetProductId || p.sku === targetProductId);
  if (!product) return null;

  const totalRequiredQty = demandQty * multiplier;
  const onHand = product.currentStock || 0;
  const allocated = product.allocatedStock || 0;
  const availableStock = Math.max(0, onHand - allocated);
  const incoming = product.onOrderStock || 0;
  const safety = product.safetyStock || 0;

  // Formula Section 10: Gross - Available - Incoming + Safety = Net Requirement
  const totalAvailableAndIncoming = availableStock + incoming;
  const netRequirement = Math.max(0, totalRequiredQty - totalAvailableAndIncoming + safety);
  const shortageQty = Math.max(0, totalRequiredQty - totalAvailableAndIncoming);

  let status: 'AVAILABLE' | 'PARTIAL' | 'SHORTAGE' | 'DELAYED' = 'AVAILABLE';
  if (shortageQty > 0) {
    status = totalAvailableAndIncoming > 0 ? 'PARTIAL' : 'SHORTAGE';
  }

  const node: MultiLevelBomNode = {
    level: currentLevel,
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    type: product.type,
    quantityPerUnit: multiplier,
    totalRequiredQty,
    uom: product.baseUom,
    onHandStock: onHand,
    allocatedStock: allocated,
    availableStock,
    incomingStock: incoming,
    safetyStock: safety,
    netRequirement,
    shortageQty,
    status,
    children: [],
  };

  // Find active BOM for this product
  const bom = allBoms.find(
    (b) => (b.productId === product.id || b.productSku === product.sku) && b.status === 'ACTIVE'
  );

  if (bom && bom.components && bom.components.length > 0) {
    node.children = bom.components
      .map((comp) => {
        return explodeMultiLevelBom(
          comp.componentProductId || comp.componentSku,
          totalRequiredQty,
          allProducts,
          allBoms,
          currentLevel + 1,
          comp.quantityPerUnit
        );
      })
      .filter((child): child is MultiLevelBomNode => child !== null);
  }

  return node;
}

export function flattenBomNodes(node: MultiLevelBomNode): MultiLevelBomNode[] {
  const result: MultiLevelBomNode[] = [node];
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      result.push(...flattenBomNodes(child));
    });
  }
  return result;
}

// ============================================================================
// 5. CHANGEOVER / SETUP ENGINE (Section 20)
// ============================================================================

export function calculateChangeoverTime(
  fromProductSku: string,
  toProductSku: string,
  rules: ChangeoverRule[]
): number {
  if (!fromProductSku || !toProductSku || fromProductSku === toProductSku) {
    return 0; // Same product = 0 changeover
  }
  const match = rules.find(
    (r) => r.fromProductSku === fromProductSku && r.toProductSku === toProductSku
  );
  if (match) return match.changeoverMinutes;

  // Reverse match fallback
  const revMatch = rules.find(
    (r) => r.fromProductSku === toProductSku && r.toProductSku === fromProductSku
  );
  if (revMatch) return revMatch.changeoverMinutes;

  // Default standard changeover between different products is 30 minutes
  return 30;
}

// ============================================================================
// 6. BOTTLENECK ANALYSIS ENGINE (Section 18)
// ============================================================================

export function analyzeBottlenecks(
  routing: Routing,
  targetQty: number,
  allMachines: MachineMaster[],
  shiftHoursPerDay: number = 8,
  efficiencyFactor: number = 0.85
): BottleneckAnalysisResult[] {
  if (!routing || !routing.operations || routing.operations.length === 0) {
    return [];
  }

  const results: BottleneckAnalysisResult[] = routing.operations.map((op) => {
    const cycleTimeSeconds = op.runTimeSecondsPerUnit || 30;
    const { pcsPerHour } = calculateOutputRate(cycleTimeSeconds);

    // Find machine or work center
    const machine = allMachines.find(
      (m) =>
        m.workCenterCode === op.workCenterCode ||
        m.code.toLowerCase() === op.workCenterCode.toLowerCase()
    );
    const machineUnits = machine ? machine.availableUnits : 1;
    const efficiency = machine ? machine.efficiencyRate : efficiencyFactor;

    // Daily capacity for this operation:
    const dailyCapacityUnits = Math.round(machineUnits * shiftHoursPerDay * pcsPerHour * efficiency);
    const requiredHours = (targetQty / (pcsPerHour * efficiency)) + (op.setupTimeMinutes / 60);
    const availableHoursPerDay = machineUnits * shiftHoursPerDay;
    const utilizationPct = Math.round((requiredHours / availableHoursPerDay) * 100);
    const deficitHours = Math.max(0, Number((requiredHours - availableHoursPerDay).toFixed(1)));

    return {
      operationSeq: op.sequence,
      operationName: op.name,
      workCenterCode: op.workCenterCode,
      workCenterName: op.workCenterName,
      machineCode: machine ? machine.code : op.workCenterCode,
      cycleTimeSeconds,
      outputRatePerHour: pcsPerHour,
      dailyCapacityUnits,
      requiredCapacityUnits: targetQty,
      utilizationPct,
      isBottleneck: false, // will flag the lowest capacity below
      deficitHours,
      recommendation:
        utilizationPct > 100
          ? `Overload (${utilizationPct}%). Add machine, add 2nd shift, or reassign operations.`
          : 'Capacity optimal within single shift window.',
    };
  });

  // Identify bottleneck (the operation with minimum daily capacity)
  if (results.length > 0) {
    let minCapacity = Infinity;
    let bottleneckIndex = -1;
    results.forEach((r, idx) => {
      if (r.dailyCapacityUnits < minCapacity) {
        minCapacity = r.dailyCapacityUnits;
        bottleneckIndex = idx;
      }
    });

    if (bottleneckIndex >= 0) {
      results[bottleneckIndex].isBottleneck = true;
      results[bottleneckIndex].recommendation = `CRITICAL BOTTLENECK (${results[bottleneckIndex].dailyCapacityUnits} units/day). Paces entire production throughput. Priority for line balancing or adding alternative machines.`;
    }
  }

  return results;
}

// ============================================================================
// 7. CAPACITY & RESOURCE FEASIBILITY EVALUATION (Section 24 & 25)
// ============================================================================

export interface FeasibilityCheckResult {
  overallState: FeasibilityState;
  isFeasible: boolean;
  materialPassed: boolean;
  machinePassed: boolean;
  manpowerPassed: boolean;
  toolingPassed: boolean;
  calendarPassed: boolean;
  reasons: string[];
  summaryMessage: string;
}

export function evaluateProductionFeasibility(
  materialShortagesCount: number,
  machineCapacityDeficitHours: number,
  manpowerShortageCount: number,
  hasToolingIssue: boolean = false,
  hasCalendarConflict: boolean = false
): FeasibilityCheckResult {
  const reasons: string[] = [];

  const materialPassed = materialShortagesCount === 0;
  if (!materialPassed) {
    reasons.push(`Material Constrained: ${materialShortagesCount} components have net inventory deficit.`);
  }

  const machinePassed = machineCapacityDeficitHours <= 0;
  if (!machinePassed) {
    reasons.push(`Machine Capacity Shortage: Required machine load exceeds single-shift window by ${machineCapacityDeficitHours.toFixed(1)} hours.`);
  }

  const manpowerPassed = manpowerShortageCount === 0;
  if (!manpowerPassed) {
    reasons.push(`Manpower Shortage: Deficit of ${manpowerShortageCount} certified operators.`);
  }

  const toolingPassed = !hasToolingIssue;
  if (!toolingPassed) {
    reasons.push('Tooling Issue: Required mold/fixture is undergoing maintenance or in conflict.');
  }

  const calendarPassed = !hasCalendarConflict;
  if (!calendarPassed) {
    reasons.push('Calendar Conflict: Scheduled production falls on holiday/planned facility shutdown.');
  }

  let overallState: FeasibilityState = 'FEASIBLE';
  if (!materialPassed && !machinePassed) overallState = 'NOT_FEASIBLE';
  else if (!materialPassed) overallState = 'MATERIAL_CONSTRAINED';
  else if (!machinePassed) overallState = 'MACHINE_CAPACITY_SHORTAGE';
  else if (!manpowerPassed) overallState = 'MANPOWER_SHORTAGE';
  else if (!toolingPassed) overallState = 'TOOLING_SHORTAGE';
  else if (!calendarPassed) overallState = 'SCHEDULE_CONFLICT';

  const isFeasible = overallState === 'FEASIBLE';
  const summaryMessage = isFeasible
    ? 'All 5 constraint dimensions verified (Material ✓, Machine ✓, Manpower ✓, Tooling ✓, Calendar ✓).'
    : `Feasibility check blocked: ${reasons.join(' | ')}`;

  return {
    overallState,
    isFeasible,
    materialPassed,
    machinePassed,
    manpowerPassed,
    toolingPassed,
    calendarPassed,
    reasons,
    summaryMessage,
  };
}

// ============================================================================
// 8. FINITE CAPACITY SCHEDULING ENGINE (Section 13, 14, 15, 16, 17, 19, 32, 33)
// ============================================================================

export interface ScheduleRunOptions {
  startDate: string; // "2026-10-26"
  shiftStartTime: string; // "07:00"
  shiftHours: number; // 8
  objective?: 'MINIMIZE_CHANGEOVER' | 'MINIMIZE_LATE' | 'MAXIMIZE_UTILIZATION';
}

/**
 * Generates finite capacity schedule slots for a production demand / order.
 * Ensures:
 * 1. Operations are sequential (Op 20 follows Op 10).
 * 2. Changeover matrix is factored into start time.
 * 3. Machine allocation and cycle times govern exact completion date.
 * 4. Hard constraints trigger warnings instead of silently assuming infinite capacity.
 */
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
  let previousProductSku = 'Product A'; // Baseline for changeover calculation

  routing.operations.forEach((op, index) => {
    // 1. Identify machine
    const machine = machines.find(
      (m) =>
        m.workCenterCode === op.workCenterCode ||
        m.code.toLowerCase() === op.workCenterCode.toLowerCase()
    );
    const machineCode = machine ? machine.code : op.workCenterCode;
    const machineUnits = machine ? machine.availableUnits : 1;
    const efficiency = machine ? machine.efficiencyRate : 0.85;

    // 2. Output rate & duration
    const cycleTime = op.runTimeSecondsPerUnit || 30;
    const { pcsPerHour } = calculateOutputRate(cycleTime);
    const effectivePcsPerHour = pcsPerHour * efficiency;

    // Output rate across all allocated machines in parallel:
    const parallelRatePerHour = effectivePcsPerHour * machineUnits;
    const processingHours = demand.quantity / parallelRatePerHour;
    const processingMinutes = Math.round(processingHours * 60);

    // 3. Changeover & Setup
    const changeoverMinutes = calculateChangeoverTime(previousProductSku, product.sku, changeoverRules);
    const setupMinutes = op.setupTimeMinutes || 15;
    const totalDurationMinutes = setupMinutes + changeoverMinutes + processingMinutes;

    // 4. Manpower calculation (Section 9)
    const requiredOperatorsPerMachine = op.manpowerRequired || 1;
    const totalRequiredManpower = machineUnits * requiredOperatorsPerMachine;
    const qualifiedEmps = employees
      .filter((e) => e.qualifiedWorkCenters.includes(op.workCenterCode) && e.status === 'AVAILABLE')
      .slice(0, totalRequiredManpower);

    // 5. Calculate slot start & end
    const slotStart = new Date(currentStart);
    const slotEnd = new Date(slotStart.getTime() + totalDurationMinutes * 60 * 1000);

    const slotStartStr = slotStart.toISOString().replace('T', ' ').slice(0, 16);
    const slotEndStr = slotEnd.toISOString().replace('T', ' ').slice(0, 16);

    // 6. Conflict detection
    let status: 'SCHEDULED' | 'CONFLICT' | 'BLOCKED' = 'SCHEDULED';
    let conflictReason: string | undefined;

    if (machine && machine.status === 'MAINTENANCE') {
      status = 'BLOCKED';
      conflictReason = `Machine ${machine.code} is blocked under planned maintenance. (Rule 9)`;
    } else if (qualifiedEmps.length < totalRequiredManpower) {
      status = 'CONFLICT';
      conflictReason = `Manpower shortage: Required ${totalRequiredManpower} operators, only ${qualifiedEmps.length} available. (Rule 4)`;
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
      manpowerAssigned: qualifiedEmps.map((e) => e.name),
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

    // Next sequential operation starts after this operation finishes (Section 19: Sequential Dependency)
    currentStart = new Date(slotEnd);
    previousProductSku = product.sku;
  });

  return slots;
}

// ============================================================================
// 9. WHAT-IF PLANNING SIMULATION ENGINE (Section 31)
// ============================================================================

export function runWhatIfSimulation(
  targetProductSku: string,
  demandQty: number,
  dueDate: string,
  baselineMachines: MachineMaster[],
  routing: Routing,
  scenariosToRun: {
    name: string;
    description: string;
    machineQuantityOverride: number; // e.g. 2 -> 3
    shiftHours: number; // e.g. 8h or 10h overtime
    extraShift: boolean; // e.g. true for 2 shifts
  }[]
): WhatIfScenario[] {
  const op10 = routing.operations[0] || { runTimeSecondsPerUnit: 30, setupTimeMinutes: 15 };
  const cycleTime = op10.runTimeSecondsPerUnit || 30;
  const { pcsPerHour } = calculateOutputRate(cycleTime);
  const efficiency = 0.85;

  return scenariosToRun.map((sc, index) => {
    const totalWorkingHoursPerDay = sc.extraShift ? sc.shiftHours * 2 : sc.shiftHours;
    const effectiveUnits = sc.machineQuantityOverride;

    const grossCapacityPerDay = effectiveUnits * totalWorkingHoursPerDay * pcsPerHour;
    const effectiveCapacityPerDay = Math.round(grossCapacityPerDay * efficiency);

    const requiredRunHours = demandQty / (pcsPerHour * efficiency);
    const requiredTotalHours = Number((requiredRunHours / effectiveUnits).toFixed(1));
    const daysRequired = Math.ceil(requiredTotalHours / totalWorkingHoursPerDay);

    // Calculate completion date based on 2026-10-26 start
    const startDate = new Date(2026, 9, 26, 7, 0);
    const completionDate = new Date(startDate);
    completionDate.setDate(startDate.getDate() + daysRequired);
    const compDateStr = completionDate.toISOString().split('T')[0];

    const requiredManpower = effectiveUnits * 2; // 2 operators per machine
    const availableOperators = 4;
    const manpowerShortage = Math.max(0, requiredManpower - availableOperators);

    // Check vs baseline days (index 0 is baseline)
    const baselineDays = Math.ceil((demandQty / (pcsPerHour * efficiency * 2)) / 8);
    const comparisonVsBaselineDays = baselineDays - daysRequired;

    return {
      id: `whatif-${index + 1}`,
      name: sc.name,
      description: sc.description,
      targetProductSku,
      targetDemandQty: demandQty,
      dueDate,
      machineOverrides: [{ machineCode: 'M01', quantity: effectiveUnits }],
      shiftHoursOverride: sc.shiftHours,
      extraShiftActive: sc.extraShift,
      computedOutputRatePcsPerHour: pcsPerHour * effectiveUnits,
      computedGrossCapacityPerDay: grossCapacityPerDay,
      computedEffectiveCapacityPerDay: effectiveCapacityPerDay,
      computedProductionDurationHours: requiredTotalHours,
      computedCompletionDate: compDateStr,
      computedManpowerRequirement: requiredManpower,
      computedManpowerShortage: manpowerShortage,
      computedMaterialShortages: [
        { sku: 'COMP-A', required: demandQty * 2, shortage: 1000 },
      ],
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
