import {
  MachineMaster,
  EmployeeManpower,
  ProductionPlanItem,
  Product,
  BillOfMaterials,
  Routing,
} from '../../types';
import { calculateOutputRate, evaluateProductionFeasibility, explodeMultiLevelBom } from './planningService';

export interface BuildProductionPlanRequest {
  planNumber?: string;
  productId?: string;
  productSku?: string;
  demandQty?: number;
  plannedQty?: number;
  allProducts: Product[];
  allBoms: BillOfMaterials[];
  allRoutings: Routing[];
  allMachines: MachineMaster[];
  allEmployees: EmployeeManpower[];
  periodWeek?: string;
  demandRef?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  status?: ProductionPlanItem['status'];
}

export function buildProductionPlanFromDemand({
  planNumber,
  productId,
  productSku,
  demandQty = 5000,
  plannedQty,
  allProducts,
  allBoms,
  allRoutings,
  allMachines,
  allEmployees,
  periodWeek = 'Week 43 - Oct 2026',
  demandRef = 'DEM-2026-5001',
  targetStartDate = '2026-10-26',
  targetEndDate = '2026-10-30',
  status = 'FEASIBILITY_REVIEW',
}: BuildProductionPlanRequest): ProductionPlanItem {
  const product =
    allProducts.find((item) => item.id === productId || item.sku === productSku) || allProducts[0];

  const resolvedPlannedQty = plannedQty ?? demandQty;
  const unfulfilledQty = Math.max(0, demandQty - resolvedPlannedQty);

  const bomNode = explodeMultiLevelBom(product.id, demandQty, allProducts, allBoms);
  const flat = bomNode ? [bomNode, ...(bomNode.children || [])] : [];
  const shortages = flat.filter((node) => node.shortageQty > 0);

  const routing =
    allRoutings.find((item) => item.productId === product.id || item.productSku === product.sku) ||
    allRoutings[0];

  const op10 = routing?.operations[0];
  const cycleTime = op10 ? op10.runTimeSecondsPerUnit : 30;
  const { pcsPerHour } = calculateOutputRate(cycleTime);
  const machine = allMachines.find((item) => item.code === 'M01') || allMachines[0];
  const machineUnits = machine ? machine.availableUnits : 3;
  const dailyCap = Math.round(machineUnits * 8 * pcsPerHour * (machine ? machine.efficiencyRate : 0.85));
  const machineDeficitHours = Math.max(0, (demandQty - dailyCap) / (pcsPerHour * 0.85));

  const feasibility = evaluateProductionFeasibility(
    shortages.length,
    machineDeficitHours,
    allEmployees.filter((employee) => employee.status === 'AVAILABLE').length < 4 ? 2 : 0
  );

  const generatedPlanNumber = planNumber || `PLAN-${new Date().getFullYear()}-W43-${Date.now().toString().slice(-4)}`;

  return {
    id: `plan-${Date.now()}`,
    planNumber: generatedPlanNumber,
    periodWeek,
    demandRef,
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    demandQty,
    plannedQty: resolvedPlannedQty,
    unfulfilledQty,
    feasibility: feasibility.overallState,
    constraintNotes: feasibility.summaryMessage,
    targetStartDate,
    targetEndDate,
    status,
  };
}
