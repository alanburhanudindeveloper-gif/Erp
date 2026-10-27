// Domain-Owned Types for Workflow & Governance Bounded Context

export interface WorkflowState {
  id: string;
  code: string;
  label: string;
  isInitial: boolean;
  isTerminal: boolean;
  color: string;
}

export interface WorkflowTransition {
  id: string;
  fromState: string;
  toState: string;
  actionLabel: string;
  requiredRole: string;
  condition?: string;
  requiresReason: boolean;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  entityType: 'PRODUCTION_ORDER' | 'PURCHASE_REQUISITION' | 'QUALITY_INSPECTION';
  name: string;
  description: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  active: boolean;
}

export interface BusinessRule {
  id: string;
  code: string;
  category: 'PLANNING' | 'QUALITY' | 'INVENTORY' | 'SECURITY';
  name: string;
  condition: string;
  action: string;
  errorMessage: string;
  severity: 'BLOCK' | 'WARN' | 'INFO';
  active: boolean;
}

export type ApprovalTransactionType =
  | 'PRODUCTION_PLAN'
  | 'PURCHASE_REQUISITION'
  | 'BOM_CHANGE'
  | 'WORK_ORDER_DISPATCH'
  | 'NCR_DISPOSITION'
  | 'CAPACITY_OVERRIDE';

export interface ApprovalMatrixLevelConfig {
  level: number;
  positionCode: string;
  roleRequired: string;
  authorityTitle: string;
  slaHours: number;
  canDelegate?: boolean;
}

export interface ApprovalMatrixRule {
  id: string;
  approvalType: ApprovalTransactionType;
  plantId: string;
  title: string;
  description: string;
  minAmount?: number;
  maxAmount?: number;
  minQuantity?: number;
  maxQuantity?: number;
  levels: ApprovalMatrixLevelConfig[];
  autoEscalateHours?: number;
}

export type ApprovalLevelStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface ApprovalLevelRecord {
  level: number;
  authorityTitle: string;
  roleRequired: string;
  positionCode?: string;
  approverId?: string;
  approverName?: string;
  approverRole?: string;
  status: ApprovalLevelStatus;
  decisionDate?: string;
  reason?: string;
  slaDueDate: string;
  isEscalated?: boolean;
}

export type ApprovalTransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApprovalTransactionRequest {
  id: string;
  requestNumber: string;
  approvalType: ApprovalTransactionType;
  referenceId: string;
  referenceTitle: string;
  plantId: string;
  plantName: string;
  requesterId: string;
  requesterName: string;
  requesterPosition: string;
  submittedAt: string;
  totalAmount?: number;
  status: ApprovalTransactionStatus;
  currentLevel: number;
  totalLevels: number;
  levels: ApprovalLevelRecord[];
  metadata?: Record<string, any>;
}

export interface ApprovalDecisionInput {
  transactionId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}
