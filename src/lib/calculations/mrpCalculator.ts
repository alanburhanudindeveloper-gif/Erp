import { DemandRecord, Product, BillOfMaterials, MrpItemRequirement } from '../../types';

export interface MrpCalculationResult {
  requirements: MrpItemRequirement[];
  summary: {
    totalDemandsAnalyzed: number;
    itemsEvaluated: number;
    shortageItemsCount: number;
    plannedOrdersGenerated: number;
    purchaseOrdersGenerated: number;
  };
  walkthroughExample: {
    productSku: string;
    targetQty: number;
    components: {
      sku: string;
      bomRatio: number;
      grossReq: number;
      safetyStock: number;
      onHand: number;
      scheduledReceipts: number;
      netReq: number;
      formulaStr: string;
      action: string;
    }[];
  };
}

export function runMRPCalculation(
  demands: DemandRecord[],
  products: Product[],
  boms: BillOfMaterials[]
): MrpItemRequirement[] {
  const requirementsMap = new Map<
    string,
    { grossReq: number; earliestDueDate: string; peggingSource: string }
  >();

  // 1. Collect Gross Requirements from confirmed/planned demand
  for (const demand of demands) {
    if (demand.status === 'CLOSED' || demand.status === 'DRAFT') continue;
    const existing = requirementsMap.get(demand.productId) || {
      grossReq: 0,
      earliestDueDate: demand.dueDate,
      peggingSource: demand.demandNo,
    };
    existing.grossReq += demand.quantity;
    if (new Date(demand.dueDate) < new Date(existing.earliestDueDate)) {
      existing.earliestDueDate = demand.dueDate;
    }
    requirementsMap.set(demand.productId, existing);
  }

  // 2. Multi-Level BOM Explosion (Page 92 & 107)
  const explosionQueue = Array.from(requirementsMap.entries());

  while (explosionQueue.length > 0) {
    const [productId, reqInfo] = explosionQueue.shift()!;
    const product = products.find((p) => p.id === productId);
    if (!product || product.type === 'RAW_MATERIAL') continue;

    const bom = boms.find((b) => b.productId === productId && b.status === 'ACTIVE');
    if (!bom) continue;

    for (const comp of bom.components) {
      const neededQty = reqInfo.grossReq * comp.quantityPerUnit * (1 + (comp.scrapPercentage || 0) / 100);
      const existingComp = requirementsMap.get(comp.componentProductId) || {
        grossReq: 0,
        earliestDueDate: reqInfo.earliestDueDate,
        peggingSource: `${reqInfo.peggingSource} → ${comp.componentSku}`,
      };
      existingComp.grossReq += Math.ceil(neededQty);
      requirementsMap.set(comp.componentProductId, existingComp);
    }
  }

  // 3. Compute Net Requirements using exact formula from Page 92:
  // Net Requirement = Gross Requirement + Safety Stock - (On-Hand + Scheduled Receipts)
  const results: MrpItemRequirement[] = [];

  for (const product of products) {
    const reqInfo = requirementsMap.get(product.id);
    const grossReq = reqInfo ? reqInfo.grossReq : 0;
    const onHand = product.currentStock;
    const scheduledReceipts = product.onOrderStock;
    const safety = product.safetyStock;

    // Page 92 formula: Net = Gross + Safety - OnHand - ScheduledReceipts
    const netCalculated = grossReq + safety - onHand - scheduledReceipts;
    const netReq = Math.max(0, netCalculated);

    let action: MrpItemRequirement['actionRequired'] = 'STOCK_SUFFICIENT';
    if (netReq > 0) {
      action = product.type === 'RAW_MATERIAL' || product.makeOrBuy === 'BUY'
        ? 'CREATE_PURCHASE_ORDER'
        : 'CREATE_PRODUCTION_ORDER';
    }

    // Lead time offset calculation: Required Date minus Lead Time days
    const reqDate = new Date(reqInfo?.earliestDueDate || '2026-10-28');
    const orderStartDate = new Date(reqDate);
    orderStartDate.setDate(orderStartDate.getDate() - product.leadTimeDays);

    results.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      type: product.type,
      leadTimeDays: product.leadTimeDays,
      grossRequirement: grossReq,
      onHandStock: onHand,
      scheduledReceipts,
      safetyStock: safety,
      netRequirement: netReq,
      lotSize: Math.max(50, Math.ceil(netReq / 50) * 50), // Standard lot sizing
      plannedSupplyQty: netReq,
      requiredDate: reqDate.toISOString().split('T')[0],
      actionRequired: action,
      peggingSource: reqInfo?.peggingSource || 'Independent Buffer',
    });
  }

  return results.sort((a, b) => {
    if (b.netRequirement > 0 && a.netRequirement === 0) return 1;
    if (a.netRequirement > 0 && b.netRequirement === 0) return -1;
    return a.sku.localeCompare(b.sku);
  });
}
