import { BillOfMaterials, Routing, CostBreakdown, ProductionOrder, OrderCostVariance } from '../../types';

export function calculateStandardCost(bom?: BillOfMaterials, routing?: Routing): CostBreakdown {
  let materialCost = 0;
  let laborCost = 0;
  let overheadCost = 0;

  if (bom) {
    for (const comp of bom.components) {
      const scrapFactor = 1 + (comp.scrapPercentage || 0) / 100;
      materialCost += comp.quantityPerUnit * comp.unitCost * scrapFactor;
    }
  }

  if (routing) {
    for (const op of routing.operations) {
      // Setup time converted to hours per unit assuming nominal batch of 100 units
      const setupHoursPerUnit = (op.setupTimeMinutes / 60) / 100;
      const runHoursPerUnit = op.runTimeSecondsPerUnit / 3600;
      const totalHoursPerUnit = setupHoursPerUnit + runHoursPerUnit;

      laborCost += totalHoursPerUnit * op.laborHourlyRate;
      overheadCost += totalHoursPerUnit * op.machineHourlyRate;
    }
  }

  const totalCost = materialCost + laborCost + overheadCost;

  return {
    materialCost,
    laborCost,
    overheadCost,
    totalCost,
    unitCost: totalCost,
  };
}

export function calculateOrderVariance(order: ProductionOrder): OrderCostVariance {
  const stdCost = order.totalCostPlanned;
  const actualCost = order.totalCostActual;
  const varianceAmount = actualCost - stdCost;
  const variancePercentage = stdCost > 0 ? (varianceAmount / stdCost) * 100 : 0;

  // Estimate material vs labor split
  const materialVariance = varianceAmount * 0.65;
  const laborVariance = varianceAmount * 0.35;

  return {
    orderNumber: order.orderNumber,
    productSku: order.productSku,
    standardCost: stdCost,
    actualCost,
    varianceAmount,
    variancePercentage,
    materialVariance,
    laborVariance,
  };
}
