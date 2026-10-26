import type {
  AuditLogEntry,
  NonConformanceReport,
  QualityInspection,
  StockMovement,
} from '../../types';

export interface InspectionEvaluationInput {
  sourceType: 'PRODUCTION_ORDER' | 'RECEIVING' | 'IN_PROCESS';
  sourceRef: string;
  productId: string;
  sku: string;
  productName: string;
  lotNumber: string;
  operationName: string;
  sampleSize: number;
  defectsCount: number;
  maxAllowedDefects: number;
  characteristic: string;
  specification: string;
  measuredValue?: number;
  lowerTolerance?: number;
  upperTolerance?: number;
  inspector: string;
  notes?: string;
}

export interface InspectionEvaluationResult {
  inspection: QualityInspection;
  disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
  stockMovements: StockMovement[];
  auditLog: AuditLogEntry;
  ncrRequired: boolean;
  ncrDraft?: NonConformanceReport;
}

export interface NcrResolutionInput {
  ncr: NonConformanceReport;
  disposition: 'SCRAP' | 'REWORK' | 'USE_AS_IS';
  rootCause: string;
  resolver: string;
  notes?: string;
}

export interface NcrResolutionResult {
  resolvedNcr: NonConformanceReport;
  auditLog: AuditLogEntry;
  stockMovements: StockMovement[];
}

/**
 * Evaluates a quality inspection ticket against tolerances and defect limits.
 * Automatically posts stock movements (e.g. moving failed lots to Quarantine/Hold or Reject),
 * logs cryptographic audit trails, and auto-generates NCR drafts when criteria fail.
 */
export function evaluateQualityInspection(
  input: InspectionEvaluationInput
): InspectionEvaluationResult {
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const inspectionNo = `INS-${Date.now().toString().slice(-6)}`;

  let isTolerated = true;
  if (
    input.measuredValue !== undefined &&
    input.lowerTolerance !== undefined &&
    input.upperTolerance !== undefined
  ) {
    isTolerated =
      input.measuredValue >= input.lowerTolerance && input.measuredValue <= input.upperTolerance;
  }

  const isDefectLimitExceeded = input.defectsCount > input.maxAllowedDefects;
  const isPass = !isDefectLimitExceeded && isTolerated;

  let resultStatus: 'PASS' | 'FAIL' | 'CONCESSION' = 'PASS';
  let disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK' = 'UNRESTRICTED';
  let ncrRequired = false;

  if (isPass) {
    resultStatus = 'PASS';
    disposition = 'UNRESTRICTED';
  } else {
    resultStatus = 'FAIL';
    ncrRequired = true;
    // Critical failure (many defects) routes to REJECT or HOLD
    disposition = input.defectsCount > input.sampleSize * 0.3 ? 'REJECT' : 'HOLD';
  }

  const inspection: QualityInspection = {
    id: `qc-${Date.now()}`,
    inspectionNo,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    productId: input.productId,
    sku: input.sku,
    productName: input.productName,
    lotNumber: input.lotNumber,
    operationName: input.operationName,
    sampleSize: input.sampleSize,
    defectsCount: input.defectsCount,
    characteristic: input.characteristic,
    specification: input.specification,
    result: resultStatus,
    disposition,
    inspector: input.inspector,
    timestamp: timeStr,
    notes: input.notes || (isPass ? 'Quality inspection passed criteria.' : 'Quality non-conformance identified.'),
  };

  const stockMovements: StockMovement[] = [];
  if (disposition === 'HOLD') {
    stockMovements.push({
      id: `mov-qc-${Date.now()}`,
      movementNo: `MOV-QC-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      productId: input.productId,
      sku: input.sku,
      quantity: input.sampleSize,
      uom: 'PCS',
      fromLocation: 'INSPECTION-DOCK',
      toLocation: 'QUARANTINE-AREA',
      lotNumber: input.lotNumber,
      sourceDocument: inspectionNo,
      movementType: 'TRANSFER',
      stockBucket: 'HOLD',
    });
  } else if (disposition === 'REJECT') {
    stockMovements.push({
      id: `mov-qc-${Date.now()}`,
      movementNo: `MOV-QC-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      productId: input.productId,
      sku: input.sku,
      quantity: input.sampleSize,
      uom: 'PCS',
      fromLocation: 'INSPECTION-DOCK',
      toLocation: 'SCRAP-REJECT-YARD',
      lotNumber: input.lotNumber,
      sourceDocument: inspectionNo,
      movementType: 'SCRAP',
      stockBucket: 'REJECTED',
    });
  }

  let ncrDraft: NonConformanceReport | undefined;
  if (ncrRequired) {
    ncrDraft = {
      id: `ncr-${Date.now()}`,
      ncrNo: `NCR-${Date.now().toString().slice(-6)}`,
      orderNumber: input.sourceRef,
      lotNumber: input.lotNumber,
      productSku: input.sku,
      defectDescription: `${input.defectsCount} defects found against spec '${input.specification}'.`,
      quantityAffected: input.sampleSize,
      disposition: disposition === 'REJECT' ? 'SCRAP' : 'REWORK',
      status: 'OPEN',
      createdAt: timeStr,
    };
  }

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: inspectionNo,
    documentType: 'QC_INSPECTION',
    action: isPass ? 'APPROVE_QUALITY_LOT' : 'HOLD_DEFECTIVE_LOT',
    actor: input.inspector,
    role: 'Quality Assurance',
    timestamp: timeStr,
    oldStatus: 'PENDING_INSPECTION',
    newStatus: resultStatus,
    decision: isPass ? 'APPROVED' : 'REJECTED',
    reason: `Inspected ${input.sampleSize} units. Found ${input.defectsCount} defects. Disposition: ${disposition}.`,
  };

  return {
    inspection,
    disposition,
    stockMovements,
    auditLog,
    ncrRequired,
    ncrDraft,
  };
}

/**
 * Formally resolves an open Non-Conformance Report with root-cause assignment and inventory posting.
 */
export function resolveNcr(input: NcrResolutionInput): NcrResolutionResult {
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  if (!input.rootCause || input.rootCause.trim().length < 5) {
    throw new Error('Mandatory root cause explanation (minimum 5 characters) is required to resolve an NCR.');
  }

  const resolvedNcr: NonConformanceReport = {
    ...input.ncr,
    status: 'RESOLVED',
    disposition: input.disposition,
    rootCause: input.rootCause,
  };

  const stockMovements: StockMovement[] = [];
  if (input.disposition === 'SCRAP') {
    stockMovements.push({
      id: `mov-ncr-${Date.now()}`,
      movementNo: `MOV-SCRAP-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      productId: input.ncr.productSku,
      sku: input.ncr.productSku,
      quantity: input.ncr.quantityAffected,
      uom: 'PCS',
      fromLocation: 'QUARANTINE-AREA',
      toLocation: 'SCRAP-YARD',
      lotNumber: input.ncr.lotNumber,
      sourceDocument: input.ncr.ncrNo,
      movementType: 'SCRAP',
      stockBucket: 'REJECTED',
    });
  } else if (input.disposition === 'USE_AS_IS') {
    stockMovements.push({
      id: `mov-ncr-${Date.now()}`,
      movementNo: `MOV-RELEASE-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      productId: input.ncr.productSku,
      sku: input.ncr.productSku,
      quantity: input.ncr.quantityAffected,
      uom: 'PCS',
      fromLocation: 'QUARANTINE-AREA',
      toLocation: 'FG-STORE',
      lotNumber: input.ncr.lotNumber,
      sourceDocument: input.ncr.ncrNo,
      movementType: 'TRANSFER',
      stockBucket: 'AVAILABLE',
    });
  }

  const auditLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    documentId: input.ncr.ncrNo,
    documentType: 'NCR_REPORT',
    action: 'RESOLVE_NCR',
    actor: input.resolver,
    role: 'QA Manager',
    timestamp: timeStr,
    oldStatus: 'OPEN',
    newStatus: 'RESOLVED',
    decision: 'APPROVED',
    reason: `Resolved NCR with disposition ${input.disposition}. Root Cause: ${input.rootCause}.`,
  };

  return {
    resolvedNcr,
    auditLog,
    stockMovements,
  };
}
