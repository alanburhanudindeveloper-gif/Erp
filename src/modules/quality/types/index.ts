// Domain-Owned Types for Quality Bounded Context

export interface QualityInspection {
  id: string;
  inspectionNo: string;
  sourceType: 'PRODUCTION_ORDER' | 'RECEIVING' | 'IN_PROCESS';
  sourceRef: string;
  productId: string;
  sku: string;
  productName: string;
  lotNumber: string;
  operationName: string;
  sampleSize: number;
  defectsCount: number;
  characteristic: string;
  specification: string;
  result: 'PASS' | 'FAIL' | 'CONCESSION';
  disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
  inspector: string;
  timestamp: string;
  notes: string;
}

export interface NonConformanceReport {
  id: string;
  ncrNo: string;
  orderNumber: string;
  lotNumber: string;
  productSku: string;
  defectDescription: string;
  rootCause?: string;
  quantityAffected: number;
  disposition: 'SCRAP' | 'REWORK' | 'USE_AS_IS';
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}

export interface QcCheckpoint {
  sequence: number;
  characteristic: string;
  specification: string;
  lowerTolerance?: number;
  upperTolerance?: number;
  sampleFrequency: string;
  inspectionMethod: string;
}

export interface QcPlan {
  id: string;
  code: string;
  revision: string;
  productId: string;
  productSku: string;
  productName: string;
  status: 'DRAFT' | 'ACTIVE' | 'OBSOLETE';
  checkpoints: QcCheckpoint[];
  effectiveDate: string;
}
