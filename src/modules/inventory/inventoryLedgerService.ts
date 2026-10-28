import type { AuditLogEntry, StockBucket, StockMovement } from '../../types';

export interface BucketBalance {
  available: number;
  reserved: number;
  wip: number;
  hold: number;
  rejected: number;
  totalPhysicalOnHand: number;
}

export interface BucketTransferInput {
  productId: string;
  sku: string;
  quantity: number;
  uom: string;
  fromBucket: StockBucket;
  toBucket: StockBucket;
  fromLocation: string;
  toLocation: string;
  lotNumber: string;
  sourceDocument: string;
  movementType?: StockMovement['movementType'];
  actor: string;
  role: string;
  reason: string;
}

export interface BucketTransferResult {
  success: boolean;
  reason?: string;
  movement?: StockMovement;
  auditLog?: AuditLogEntry;
}

export interface MovementReversalResult {
  success: boolean;
  reason?: string;
  reversalMovement?: StockMovement;
  auditLog?: AuditLogEntry;
}

/**
 * Computes exact 5-bucket balances for a product SKU based on historical movements.
 */
export function calculate5BucketBalance(
  sku: string,
  movements: StockMovement[]
): BucketBalance {
  const itemMovements = movements.filter((m) => m.sku === sku);

  let available = 0;
  let reserved = 0;
  let wip = 0;
  let hold = 0;
  let rejected = 0;

  for (const m of itemMovements) {
    const qty = m.quantity || 0;
    const bucket = m.stockBucket || 'AVAILABLE';

    if (m.movementType === 'GR_PURCHASE' || m.movementType === 'GR_PRODUCTION') {
      if (bucket === 'AVAILABLE') available += qty;
      else if (bucket === 'HOLD') hold += qty;
      else if (bucket === 'RESERVED') reserved += qty;
      else if (bucket === 'WIP') wip += qty;
    } else if (m.movementType === 'GI_PRODUCTION') {
      // Consumption out of available/reserved into WIP
      available = Math.max(0, available - qty);
      wip += qty;
    } else if (m.movementType === 'SCRAP') {
      // Scrapped from WIP or inspection into rejected
      wip = Math.max(0, wip - qty);
      rejected += qty;
    } else if (m.movementType === 'TRANSFER') {
      // Explicit bucket adjustment
      const fromLoc = (m.fromLocation || '').toLowerCase();
      if (bucket === 'HOLD') {
        available = Math.max(0, available - qty);
        hold += qty;
      } else if (bucket === 'RESERVED') {
        available = Math.max(0, available - qty);
        reserved += qty;
      } else if (bucket === 'AVAILABLE') {
        if (fromLoc.includes('hold') || fromLoc.includes('quarantine')) {
          hold = Math.max(0, hold - qty);
        } else if (fromLoc.includes('reserved')) {
          reserved = Math.max(0, reserved - qty);
        }
        available += qty;
      } else if (bucket === 'REJECTED') {
        if (fromLoc.includes('hold') || fromLoc.includes('quarantine')) {
          hold = Math.max(0, hold - qty);
        } else {
          available = Math.max(0, available - qty);
        }
        rejected += qty;
      }
    } else if (m.movementType === 'REVERSAL') {
      // Compensating reversal restores available or previous bucket
      if (bucket === 'AVAILABLE') available += qty;
      else if (bucket === 'HOLD') hold = Math.max(0, hold - qty);
    }
  }

  return {
    available: Math.round(available * 100) / 100,
    reserved: Math.round(reserved * 100) / 100,
    wip: Math.round(wip * 100) / 100,
    hold: Math.round(hold * 100) / 100,
    rejected: Math.round(rejected * 100) / 100,
    totalPhysicalOnHand: Math.round((available + reserved + hold) * 100) / 100,
  };
}

/**
 * Transfers inventory atomically between buckets with validation against negative balances.
 */
export function transferStockBetweenBuckets(
  input: BucketTransferInput,
  currentMovements: StockMovement[]
): BucketTransferResult {
  if (input.quantity <= 0) {
    return {
      success: false,
      reason: 'Transfer quantity must be strictly greater than zero.',
    };
  }

  if (input.fromBucket === input.toBucket) {
    return {
      success: false,
      reason: `Source bucket and destination bucket cannot be identical (${input.fromBucket}).`,
    };
  }

  const currentBalance = calculate5BucketBalance(input.sku, currentMovements);
  let availableInSource = 0;

  switch (input.fromBucket) {
    case 'AVAILABLE':
      availableInSource = currentBalance.available;
      break;
    case 'RESERVED':
      availableInSource = currentBalance.reserved;
      break;
    case 'WIP':
      availableInSource = currentBalance.wip;
      break;
    case 'HOLD':
      availableInSource = currentBalance.hold;
      break;
    case 'REJECTED':
      availableInSource = currentBalance.rejected;
      break;
  }

  // Prevent negative balance in source bucket
  if (availableInSource < input.quantity) {
    return {
      success: false,
      reason: `Insufficient quantity in source bucket '${input.fromBucket}' for SKU ${input.sku}. Requested: ${input.quantity}, Available: ${availableInSource}.`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const movementNo = `MOV-TR-${Date.now().toString().slice(-6)}`;

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    movementNo,
    timestamp: timeStr,
    productId: input.productId,
    sku: input.sku,
    quantity: input.quantity,
    uom: input.uom as any,
    fromLocation: input.fromLocation,
    toLocation: input.toLocation,
    lotNumber: input.lotNumber,
    sourceDocument: input.sourceDocument,
    movementType: input.movementType || 'TRANSFER',
    stockBucket: input.toBucket,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: movementNo,
    documentType: 'STOCK_MOVEMENT',
    action: 'TRANSFER_STOCK_BUCKET',
    actor: input.actor,
    role: input.role,
    timestamp: timeStr,
    oldStatus: input.fromBucket,
    newStatus: input.toBucket,
    decision: 'EXECUTED',
    reason: input.reason || `Transferred ${input.quantity} ${input.sku} from ${input.fromBucket} to ${input.toBucket}.`,
  };

  return {
    success: true,
    movement,
    auditLog,
  };
}

/**
 * Creates a compensating reversal movement for a posted material transaction.
 * Strictly adheres to immutable ledger principles: original records are preserved.
 */
export function reverseStockMovement(
  originalMovement: StockMovement,
  actor: string,
  role: string,
  reversalReason: string
): MovementReversalResult {
  if (originalMovement.isReversed) {
    return {
      success: false,
      reason: `Stock movement ${originalMovement.movementNo} has already been reversed.`,
    };
  }

  if (!reversalReason || reversalReason.trim().length < 5) {
    return {
      success: false,
      reason: 'Mandatory justification reason (at least 5 characters) is required to reverse an inventory movement.',
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const reversalNo = `REV-${Date.now().toString().slice(-6)}`;

  const reversalMovement: StockMovement = {
    id: `mov-rev-${Date.now()}`,
    movementNo: reversalNo,
    timestamp: timeStr,
    productId: originalMovement.productId,
    sku: originalMovement.sku,
    quantity: originalMovement.quantity,
    uom: originalMovement.uom,
    fromLocation: originalMovement.toLocation,
    toLocation: originalMovement.fromLocation,
    lotNumber: originalMovement.lotNumber,
    sourceDocument: originalMovement.movementNo,
    movementType: 'REVERSAL',
    stockBucket: originalMovement.stockBucket === 'HOLD' ? 'AVAILABLE' : originalMovement.stockBucket,
    isReversed: true,
  };

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: reversalNo,
    documentType: 'STOCK_MOVEMENT',
    action: 'REVERSE_MOVEMENT',
    actor,
    role,
    timestamp: timeStr,
    decision: 'EXECUTED',
    reason: `Reversed movement ${originalMovement.movementNo}. Justification: ${reversalReason}`,
  };

  return {
    success: true,
    reversalMovement,
    auditLog,
  };
}
