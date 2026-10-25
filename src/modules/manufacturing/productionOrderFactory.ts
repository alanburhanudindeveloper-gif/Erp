import type {
  BillOfMaterials,
  Product,
  ProductReleasePackage,
  ProductionOrder,
  Routing,
  RoutingOperation,
} from '../../types';

export interface BuildProductionOrderDraftInput {
  product: Product;
  bom?: BillOfMaterials;
  routing?: Routing;
  quantity: number;
  dueDate: string;
  orderNumber: string;
  plantId: string;
  plantName: string;
  releasePackage?: ProductReleasePackage;
  createdAt?: string;
  productCatalog?: Product[];
}

function buildMaterialRequirements(
  bom: BillOfMaterials | undefined,
  productCatalog: Product[] = [],
  quantity: number
): ProductionOrder['materials'] {
  if (!bom) return [];

  return bom.components.map((component) => {
    const componentProduct = productCatalog.find((item) => item.id === component.componentProductId);
    const requiredQty = quantity * component.quantityPerUnit;
    const availableQty = componentProduct ? Math.max(0, componentProduct.currentStock - componentProduct.allocatedStock) : 0;

    return {
      productId: component.componentProductId,
      sku: component.componentSku,
      name: component.componentName,
      requiredQty,
      allocatedQty: 0,
      consumedQty: 0,
      availableStock: componentProduct ? componentProduct.currentStock : 0,
      uom: component.uom,
      unitCost: component.unitCost,
      status: availableQty >= requiredQty ? 'SUFFICIENT' : 'SHORTAGE',
    };
  });
}

function buildOperations(
  routing: Routing | undefined,
  orderNumber: string,
  quantity: number,
  sequencePad: string
): ProductionOrder['operations'] {
  if (!routing) return [];

  return routing.operations.map((operation: RoutingOperation) => ({
    id: `op-new-${Date.now()}-${operation.sequence}`,
    workOrderNo: `WO-${sequencePad}-${operation.sequence.toString().padStart(2, '0')}`,
    sequence: operation.sequence,
    operationCode: operation.operationCode,
    name: operation.name,
    workCenterId: operation.workCenterId,
    workCenterCode: operation.workCenterCode,
    workCenterName: operation.workCenterName,
    status: 'PENDING',
    targetQty: quantity,
    completedQty: 0,
    scrapQty: 0,
    plannedDurationMinutes: Math.ceil((operation.runTimeSecondsPerUnit * quantity) / 60) + operation.setupTimeMinutes,
    actualDurationMinutes: 0,
    downtimeMinutes: 0,
    dependencySeq: operation.dependencySeq,
    setupTimeMinutes: operation.setupTimeMinutes,
    runTimeSecondsPerUnit: operation.runTimeSecondsPerUnit,
  }));
}

export function buildProductionOrderDraft({
  product,
  bom,
  routing,
  quantity,
  dueDate,
  orderNumber,
  plantId,
  plantName,
  releasePackage,
  createdAt,
  productCatalog = [],
}: BuildProductionOrderDraftInput): ProductionOrder {
  const activeBom = bom ?? undefined;
  const activeRouting = routing ?? undefined;
  const today = createdAt ?? new Date().toISOString().split('T')[0];
  const sequencePad = orderNumber.split('-')[2] ?? '000';

  const materials = buildMaterialRequirements(activeBom, productCatalog, quantity);
  const operations = buildOperations(activeRouting, orderNumber, quantity, sequencePad);
  const availabilityPct = materials.length
    ? Math.round(
        (materials.filter((item) => item.status === 'SUFFICIENT').length / materials.length) * 100
      )
    : 100;

  return {
    id: `mo-${Date.now()}`,
    orderNumber,
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    targetQuantity: quantity,
    goodQuantity: 0,
    scrapQuantity: 0,
    status: 'PLANNED',
    bomId: activeBom?.id || 'bom-001',
    bomCode: activeBom?.code || 'BOM-A',
    bomRevision: releasePackage?.bomRevision || activeBom?.revision || 'Rev.03',
    routingId: activeRouting?.id || 'rt-001',
    routingCode: activeRouting?.code || 'ROUTE-A',
    routingRevision: releasePackage?.routingRevision || activeRouting?.revision || 'Rev.02',
    productRevision: releasePackage?.releasedRevision || product.currentRevision || 'Rev A',
    releasePackageId: releasePackage?.id,
    wiRevision: releasePackage?.wiRevision || 'Rev A',
    toolingRevision: releasePackage?.toolingRevision || 'Rev 01',
    plantId,
    plantName,
    dueDate,
    plannedStartDate: today,
    demandLink: 'SO-2026-881',
    priority: 'NORMAL',
    materialAvailabilityPct: availabilityPct,
    operations,
    materials,
    outputLogs: [],
    totalCostPlanned: quantity * product.standardCost,
    totalCostActual: 0,
    backorderQty: quantity,
    createdAt: today,
  };
}
