import type { MaterialRequest, MaterialRequestItem, MaterialRequestStatus } from '../../types';

export interface MaterialRequestDraftInput {
  id?: string;
  requestNumber?: string;
  sourceType: MaterialRequest['sourceType'];
  sourceReferenceId: string;
  productId?: string;
  productSku?: string;
  requester: string;
  department: string;
  requiredDate: string;
  destinationLine: string;
  priority: MaterialRequest['priority'];
  status?: MaterialRequestStatus;
  items: Array<
    Partial<Pick<MaterialRequestItem, 'id' | 'pickedQuantity' | 'deliveredQuantity' | 'status'>> &
      Omit<MaterialRequestItem, 'id' | 'pickedQuantity' | 'deliveredQuantity' | 'status'>
  >;
  notes?: string;
}

export function createMaterialRequest(input: MaterialRequestDraftInput): MaterialRequest {
  const nextItems: MaterialRequestItem[] = (input.items || []).map((item, index) => ({
    id: item.id || `mri-${Date.now()}-${index}`,
    productId: item.productId,
    sku: item.sku,
    name: item.name,
    requestedQuantity: item.requestedQuantity,
    pickedQuantity: item.pickedQuantity ?? 0,
    deliveredQuantity: item.deliveredQuantity ?? 0,
    uom: item.uom,
    fromWarehouse: item.fromWarehouse,
    toLocation: item.toLocation,
    status: item.status || 'PENDING',
  }));

  const requestNumber = input.requestNumber || `MR-2026-${String(Date.now()).slice(-6)}`;

  return {
    id: input.id || `mr-${Date.now()}`,
    requestNumber,
    sourceType: input.sourceType,
    sourceReferenceId: input.sourceReferenceId,
    productId: input.productId,
    productSku: input.productSku,
    requester: input.requester,
    department: input.department,
    requiredDate: input.requiredDate,
    destinationLine: input.destinationLine,
    priority: input.priority,
    status: input.status || 'SUBMITTED',
    items: nextItems,
    notes: input.notes,
  };
}

export function pickMaterialRequest(request: MaterialRequest, pickedBy: string, pickedAt: string = new Date().toISOString().replace('T', ' ').slice(0, 16)): MaterialRequest {
  return {
    ...request,
    status: 'READY',
    pickedBy,
    pickedAt,
    items: request.items.map((item) => ({
      ...item,
      pickedQuantity: item.requestedQuantity,
      status: 'PICKED' as const,
    })),
  };
}
