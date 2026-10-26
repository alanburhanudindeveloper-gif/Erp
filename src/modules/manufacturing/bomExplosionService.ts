import type { BillOfMaterials, BomComponent, Product, UomCode } from '../../types';

export interface ExplodedMaterialRequirement {
  level: number;
  productId: string;
  sku: string;
  name: string;
  bomId?: string;
  bomType?: 'STANDARD' | 'PHANTOM' | 'SUBCONTRACT';
  quantityPerUnit: number;
  grossQuantityRequired: number;
  scrapPercentage: number;
  scrapQuantity: number;
  uom: UomCode;
  unitCost: number;
  extendedCost: number;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  netQuantityRequired: number;
  shortageQuantity: number;
  leadTimeDays: number;
  makeOrBuy: 'MAKE' | 'BUY';
  isPhantom: boolean;
  parentSku?: string;
}

export interface BomExplosionResult {
  rootProduct: Product;
  targetQuantity: number;
  hasCycle: boolean;
  totalRollupCost: number;
  requirements: ExplodedMaterialRequirement[];
  criticalPathLeadTimeDays: number;
  shortageCount: number;
}

/**
 * Deterministically explodes a multi-level Bill of Materials.
 * Resolves sub-assemblies recursively with cycle detection, computes scrap allowances,
 * and determines net material requirements against on-hand and allocated stock.
 */
export function explodeBom(
  rootProductId: string,
  targetQuantity: number,
  allProducts: Product[],
  allBoms: BillOfMaterials[],
  options?: {
    maxDepth?: number;
    includePhantomsInRequirements?: boolean;
  }
): BomExplosionResult {
  const maxDepth = options?.maxDepth ?? 10;
  const includePhantoms = options?.includePhantomsInRequirements ?? false;

  const rootProduct = allProducts.find((p) => p.id === rootProductId || p.sku === rootProductId);
  if (!rootProduct) {
    throw new Error(`Root product '${rootProductId}' was not found in product master.`);
  }

  const visitedProductIds = new Set<string>();
  let hasCycle = false;
  const requirements: ExplodedMaterialRequirement[] = [];

  function recurse(
    currentProduct: Product,
    multiplier: number,
    level: number,
    parentSku?: string,
    ancestors: Set<string> = new Set()
  ): number {
    if (level > maxDepth) {
      return 0;
    }

    if (ancestors.has(currentProduct.id)) {
      hasCycle = true;
      return 0;
    }

    const currentAncestors = new Set(ancestors);
    currentAncestors.add(currentProduct.id);

    // Find active approved BOM for current product
    const bom = allBoms.find(
      (b) =>
        (b.productId === currentProduct.id || b.productSku === currentProduct.sku) &&
        (b.status === 'APPROVED' || b.status === 'ACTIVE')
    );

    let maxSubLeadTime = 0;

    if (!bom || !bom.components || bom.components.length === 0) {
      // Leaf component or raw material
      return currentProduct.leadTimeDays || 0;
    }

    const isPhantomBom = bom.bomType === 'PHANTOM';

    for (const comp of bom.components) {
      const childProduct = allProducts.find(
        (p) => p.id === comp.componentProductId || p.sku === comp.componentSku
      );

      const scrapPct = comp.scrapPercentage || 0;
      const nominalQty = comp.quantityPerUnit * multiplier;
      const scrapFactor = 1 + scrapPct / 100;
      const grossQty = Math.round(nominalQty * scrapFactor * 1000) / 1000;
      const scrapQty = Math.round((grossQty - nominalQty) * 1000) / 1000;

      const currentStock = childProduct?.currentStock || 0;
      const allocatedStock = childProduct?.allocatedStock || 0;
      const availableStock = Math.max(0, currentStock - allocatedStock);
      const netQty = Math.max(0, Math.round((grossQty - availableStock) * 1000) / 1000);
      const shortageQty = netQty > 0 ? netQty : 0;
      const unitCost = comp.unitCost || childProduct?.standardCost || 0;
      const extendedCost = Math.round(grossQty * unitCost * 100) / 100;
      const leadTime = childProduct?.leadTimeDays || 0;

      const isSubAssembly = childProduct?.makeOrBuy === 'MAKE';

      if (!isPhantomBom || includePhantoms) {
        requirements.push({
          level,
          productId: comp.componentProductId || childProduct?.id || comp.componentSku,
          sku: comp.componentSku,
          name: comp.componentName || childProduct?.name || comp.componentSku,
          bomId: bom.id,
          bomType: bom.bomType,
          quantityPerUnit: comp.quantityPerUnit,
          grossQuantityRequired: grossQty,
          scrapPercentage: scrapPct,
          scrapQuantity: scrapQty,
          uom: comp.uom,
          unitCost,
          extendedCost,
          currentStock,
          allocatedStock,
          availableStock,
          netQuantityRequired: netQty,
          shortageQuantity: shortageQty,
          leadTimeDays: leadTime,
          makeOrBuy: childProduct?.makeOrBuy || 'BUY',
          isPhantom: isPhantomBom,
          parentSku,
        });
      }

      // If child is a manufactured sub-assembly, recursively explode it
      if (childProduct && isSubAssembly) {
        const childLeadTime = recurse(
          childProduct,
          grossQty,
          level + 1,
          childProduct.sku,
          currentAncestors
        );
        maxSubLeadTime = Math.max(maxSubLeadTime, leadTime + childLeadTime);
      } else {
        maxSubLeadTime = Math.max(maxSubLeadTime, leadTime);
      }
    }

    return maxSubLeadTime;
  }

  const criticalPathLeadTimeDays = recurse(
    rootProduct,
    targetQuantity,
    1,
    rootProduct.sku
  );

  const totalRollupCost = requirements.reduce(
    (sum, item) => Math.round((sum + item.extendedCost) * 100) / 100,
    0
  );

  const shortageCount = requirements.filter((item) => item.shortageQuantity > 0).length;

  return {
    rootProduct,
    targetQuantity,
    hasCycle,
    totalRollupCost,
    requirements,
    criticalPathLeadTimeDays,
    shortageCount,
  };
}
