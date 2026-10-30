// Domain-Owned Types for Inventory Bounded Context
export type UomCode = 'PCS' | 'KG' | 'MTR' | 'LTR' | 'SET' | 'BOX' | 'ROLL';

export type StockBucket = 'AVAILABLE' | 'RESERVED' | 'HOLD' | 'REJECTED' | 'WIP';

export interface MaterialReservation {
  id: string;
  reservationNo: string;
  productionOrderId: string;
  orderNumber: string;
  productId: string;
  sku: string;
  productName: string;
  requiredQty: number;
  reservedQty: number;
  location: string;
  lotNumber?: string;
  reservedAt: string;
  status: 'ACTIVE' | 'CONSUMED' | 'RELEASED';
}

export interface StockMovement {
  id: string;
  movementNo: string;
  timestamp: string;
  productId: string;
  sku: string;
  quantity: number;
  uom: UomCode;
  fromLocation: string;
  toLocation: string;
  lotNumber: string;
  sourceDocument: string;
  movementType: 'GR_PURCHASE' | 'GI_PRODUCTION' | 'GR_PRODUCTION' | 'TRANSFER' | 'SCRAP' | 'REVERSAL';
  stockBucket?: StockBucket;
  isReversed?: boolean;
}

export interface ScrapTransaction {
  id: string;
  transactionNo: string;
  sourceRef: string;
  quantity: number;
  uom: UomCode;
  reasonCode: string;
  sourceOperation: string;
  costImpact: number;
  disposition: 'DISCARD_SCRAP' | 'RECYCLE';
  timestamp: string;
}

export interface ReworkOrder {
  id: string;
  reworkOrderNo: string;
  parentOrderNumber: string;
  productSku: string;
  quantityToRework: number;
  dispositionAction: string;
  status: 'PLANNED' | 'IN_REWORK' | 'COMPLETED';
  workCenterCode: string;
  createdAt: string;
}

export type MaterialRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PICKED' | 'DELIVERED' | 'CANCELLED';
export type MaterialRequestPriority = 'CRITICAL' | 'HIGH' | 'NORMAL';

export interface MaterialRequestItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  requiredQty: number;
  pickedQty: number;
  deliveredQty: number;
  uom: UomCode;
  sourceLocation: string;
  lotNumber?: string;
  status: 'PENDING' | 'PICKED' | 'DELIVERED' | 'SHORTAGE';
}

export interface MaterialRequest {
  id: string;
  requestNumber: string;
  sourceType: 'PRODUCTION_ORDER' | 'MAINTENANCE' | 'MANUAL';
  sourceReferenceId: string;
  requester: string;
  department: string;
  requiredDate: string;
  destinationLine: string;
  priority: MaterialRequestPriority;
  status: MaterialRequestStatus;
  items: MaterialRequestItem[];
  approvedBy?: string;
  approvedAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
}
