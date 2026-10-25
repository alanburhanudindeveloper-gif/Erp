import type {
  GoodsReceiptItem,
  GoodsReceiptNote,
  PurchaseOrder,
  PurchaseOrderItem,
  QualityInspection,
  StockMovement,
} from '../../types';

export interface GoodsReceiptLineInput {
  poItemId: string;
  receivedQty: number;
  supplierLot: string;
  warehouseLoc: string;
  incomingQcRequired: boolean;
}

export interface GoodsReceiptEvaluationInput {
  po: PurchaseOrder;
  grnNumber: string;
  receivedBy: string;
  receiptLines: GoodsReceiptLineInput[];
  notes?: string;
  generatedAt?: string;
  inspectionSequence?: number;
}

export interface GoodsReceiptEvaluationResult {
  allowed: boolean;
  reason?: string;
  anyQcRequired: boolean;
  isFullyReceived: boolean;
  updatedPoItems: PurchaseOrderItem[];
  grnItems: GoodsReceiptItem[];
  newMovements: StockMovement[];
  newInspections: QualityInspection[];
  grn: GoodsReceiptNote;
}

export function evaluateGoodsReceipt(input: GoodsReceiptEvaluationInput): GoodsReceiptEvaluationResult {
  const { po, grnNumber, receivedBy, receiptLines, notes, generatedAt = new Date().toISOString(), inspectionSequence = 1 } = input;

  if (!po) {
    return {
      allowed: false,
      reason: 'PO not found.',
      anyQcRequired: false,
      isFullyReceived: false,
      updatedPoItems: [],
      grnItems: [],
      newMovements: [],
      newInspections: [],
      grn: {
        id: `grn-missing-${Date.now()}`,
        grnNumber,
        poId: '',
        poNumber: '',
        supplierName: '',
        receivedDate: generatedAt,
        receivedBy: receivedBy || 'Unknown',
        items: [],
        stockBucketSummary: 'No receipt was posted.',
      },
    };
  }

  if (!Array.isArray(receiptLines) || receiptLines.length === 0) {
    return {
      allowed: false,
      reason: 'A goods receipt must contain at least one valid receipt line.',
      anyQcRequired: false,
      isFullyReceived: false,
      updatedPoItems: po.items,
      grnItems: [],
      newMovements: [],
      newInspections: [],
      grn: {
        id: `grn-empty-${Date.now()}`,
        grnNumber,
        poId: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplierName,
        receivedDate: generatedAt,
        receivedBy: receivedBy || 'Unknown',
        items: [],
        stockBucketSummary: 'No valid receipt line was posted.',
      },
    };
  }

  const invalidLine = receiptLines.find((line) => !line || !line.poItemId || !line.poItemId.trim() || !Number.isFinite(line.receivedQty) || line.receivedQty <= 0);
  if (invalidLine) {
    return {
      allowed: false,
      reason: 'Each receipt line must include a valid PO item and a quantity greater than zero.',
      anyQcRequired: false,
      isFullyReceived: false,
      updatedPoItems: po.items,
      grnItems: [],
      newMovements: [],
      newInspections: [],
      grn: {
        id: `grn-invalid-${Date.now()}`,
        grnNumber,
        poId: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplierName,
        receivedDate: generatedAt,
        receivedBy: receivedBy || 'Unknown',
        items: [],
        stockBucketSummary: 'Receipt rejected before posting due to invalid quantities.',
      },
    };
  }

  const newMovements: StockMovement[] = [];
  const newInspections: QualityInspection[] = [];
  const grnItems: GoodsReceiptItem[] = [];
  const updatedPoItems = po.items.map((item) => {
    const line = receiptLines.find((receiptLine) => receiptLine.poItemId === item.id);
    if (!line || line.receivedQty <= 0) {
      return item;
    }

    const newReceivedQty = item.receivedQty + line.receivedQty;
    const bucket: 'AVAILABLE' | 'HOLD' = line.incomingQcRequired ? 'HOLD' : 'AVAILABLE';
    const inspectionId = line.incomingQcRequired ? `qc-${Date.now()}-${item.id}` : undefined;

    newMovements.push({
      id: `mov-${Date.now()}-${item.id}`,
      movementNo: `MATDOC-GRN-${String(grnNumber.split('-').at(-1) ?? '0001')}-${item.sku.replace(/\s+/g, '')}`,
      timestamp: generatedAt,
      productId: item.productId,
      sku: item.sku,
      quantity: line.receivedQty,
      uom: item.uom,
      fromLocation: 'SUPPLIER-INBOUND-DOCK',
      toLocation: line.warehouseLoc || (line.incomingQcRequired ? 'PLANT01-RM-WH-HOLD' : 'PLANT01-RM-WH-BAY-01'),
      lotNumber: line.supplierLot || `LOT-SUP-${Date.now().toString().slice(-4)}`,
      sourceDocument: grnNumber,
      movementType: 'GR_PURCHASE',
      stockBucket: bucket,
    });

    if (line.incomingQcRequired) {
      newInspections.push({
        id: inspectionId!,
        inspectionNo: `QC-${new Date(generatedAt).getFullYear()}-${String(inspectionSequence).padStart(4, '0')}`,
        sourceType: 'RECEIVING',
        sourceRef: grnNumber,
        productId: item.productId,
        sku: item.sku,
        productName: item.name,
        lotNumber: line.supplierLot,
        operationName: 'Incoming Raw Material Inspection (IQC Dock)',
        sampleSize: Math.min(50, line.receivedQty),
        defectsCount: 0,
        characteristic: 'Material Mill Certificate & Dimensional Tolerances',
        specification: 'ASTM / DIN Industrial Standard Compliance',
        result: 'PASS',
        disposition: 'HOLD',
        inspector: 'QC Receiving Specialist (Pending Release)',
        timestamp: generatedAt,
        notes: `Material placed on HOLD pending official IQC sign-off. Supplier lot: ${line.supplierLot}.`,
      });
    }

    grnItems.push({
      id: `gri-${Date.now()}-${item.id}`,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      receivedQty: line.receivedQty,
      uom: item.uom,
      supplierLot: line.supplierLot,
      qcRequired: line.incomingQcRequired,
      stockBucket: bucket,
      targetLocation: line.warehouseLoc,
      inspectionId,
    });

    return {
      ...item,
      receivedQty: newReceivedQty,
    };
  });

  const anyQcRequired = receiptLines.some((line) => line.incomingQcRequired);
  const isFullyReceived = updatedPoItems.every((item) => item.receivedQty >= item.orderedQty);

  const newGrn: GoodsReceiptNote = {
    id: `grn-${Date.now()}`,
    grnNumber,
    poId: po.id,
    poNumber: po.poNumber,
    supplierName: po.supplierName,
    receivedDate: generatedAt,
    receivedBy: receivedBy || 'Unknown',
    items: grnItems,
    notes: notes || 'Supplier delivery accepted at inbound dock.',
    stockBucketSummary: anyQcRequired
      ? 'Quarantine: Material routed to HOLD bucket (IQC Inspection required).'
      : 'Unrestricted: Stock placed directly into AVAILABLE inventory.',
  };

  return {
    allowed: true,
    reason: 'Goods receipt evaluated successfully.',
    anyQcRequired,
    isFullyReceived,
    updatedPoItems,
    grnItems,
    newMovements,
    newInspections,
    grn: newGrn,
  };
}
