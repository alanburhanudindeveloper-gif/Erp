import { Product, BillOfMaterials, ProductionOrder } from '../../types';

export interface MaterialShortage {
  sku: string;
  required: number;
  available: number;
}

export interface MaterialAvailabilityResult {
  availabilityPct: number;
  shortages: MaterialShortage[];
}

export function checkMaterialAvailability(
  products: Product[],
  bom: BillOfMaterials | undefined,
  quantity: number
): MaterialAvailabilityResult {
  if (!bom) return { availabilityPct: 100, shortages: [] };

  let totalWeight = 0;
  let fulfilledWeight = 0;
  const shortages: MaterialShortage[] = [];

  for (const comp of bom.components) {
    const product = products.find((item) => item.id === comp.componentProductId);
    const required = quantity * comp.quantityPerUnit;
    const unallocated = product ? Math.max(0, product.currentStock - product.allocatedStock) : 0;
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
}

export function canReleaseProductionOrder(order: ProductionOrder, overrideReason?: string): boolean {
  const hasShortage = order.materials.some((item) => item.status === 'SHORTAGE');
  return !hasShortage || Boolean(overrideReason);
}
