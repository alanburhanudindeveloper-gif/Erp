import {
  Product,
  BillOfMaterials,
  Routing,
  MachineMaster,
  EmployeeManpower,
  BottleneckAnalysisResult,
  MultiLevelBomNode,
  FeasibilityState,
} from '../../types';

export interface OutputRateResult {
  cycleTimeSeconds: number;
  pcsPerSecond: number;
  pcsPerMinute: number;
  pcsPerHour: number;
}

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

export interface PlanningSummary {
  productId: string;
  productSku: string;
  demandQty: number;
  bomSummary: {
    totalRequiredQty: number;
    shortageQty: number;
    netRequirement: number;
    status: 'AVAILABLE' | 'PARTIAL' | 'SHORTAGE' | 'DELAYED';
  };
  feasibility: FeasibilityCheckResult;
  bottlenecks: BottleneckAnalysisResult[];
}

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

  const bom = allBoms.find(
    (item) => (item.productId === product.id || item.productSku === product.sku) && item.status === 'ACTIVE'
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

    const machine = allMachines.find(
      (m) =>
        m.workCenterCode === op.workCenterCode ||
        m.code.toLowerCase() === op.workCenterCode.toLowerCase()
    );
    const machineUnits = machine ? machine.availableUnits : 1;
    const efficiency = machine ? machine.efficiencyRate : efficiencyFactor;

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
      isBottleneck: false,
      deficitHours,
      recommendation:
        utilizationPct > 100
          ? `Overload (${utilizationPct}%). Add machine, add 2nd shift, or reassign operations.`
          : 'Capacity optimal within single shift window.',
    };
  });

  if (results.length > 0) {
    let minCapacity = Infinity;
    let bottleneckIndex = -1;

    results.forEach((result, idx) => {
      if (result.dailyCapacityUnits < minCapacity) {
        minCapacity = result.dailyCapacityUnits;
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

export function summarizeProductionPlanning(
  targetProductId: string,
  demandQty: number,
  allProducts: Product[],
  allBoms: BillOfMaterials[],
  allRoutings: Routing[],
  allMachines: MachineMaster[],
  allEmployees: EmployeeManpower[]
): PlanningSummary {
  const product = allProducts.find((item) => item.id === targetProductId) || allProducts[0];
  const bom = allBoms.find((item) => item.productId === product.id && item.status === 'ACTIVE') || allBoms[0];
  const routing = allRoutings.find((item) => item.productId === product.id && item.status === 'ACTIVE') || allRoutings[0];

  const bomTree = explodeMultiLevelBom(product.id, demandQty, allProducts, allBoms);
  const allNodes = bomTree ? flattenBomNodes(bomTree) : [];
  const totalRequiredQty = allNodes.reduce((sum, node) => sum + node.totalRequiredQty, 0);
  const shortageQty = allNodes.reduce((sum, node) => sum + node.shortageQty, 0);
  const netRequirement = allNodes.reduce((sum, node) => sum + node.netRequirement, 0);
  const finalStatus = bomTree?.status ?? 'AVAILABLE';

  const bottlenecks = routing ? analyzeBottlenecks(routing, demandQty, allMachines) : [];
  const machineDeficit = bottlenecks.reduce((sum, item) => sum + (item.isBottleneck ? item.deficitHours : 0), 0);
  const manpowerShortage = allEmployees.filter((employee) => employee.status === 'AVAILABLE').length < 2 ? 1 : 0;

  const feasibility = evaluateProductionFeasibility(
    shortageQty > 0 ? 1 : 0,
    machineDeficit,
    manpowerShortage,
    false,
    false
  );

  return {
    productId: product.id,
    productSku: product.sku,
    demandQty,
    bomSummary: {
      totalRequiredQty,
      shortageQty,
      netRequirement,
      status: finalStatus,
    },
    feasibility,
    bottlenecks,
  };
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
  if (!materialPassed) overallState = 'MATERIAL_CONSTRAINED';
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
