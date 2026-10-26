import {
  ApprovalMatrixRule,
  ApprovalTransactionRequest,
  ApprovalTransactionType,
  ApprovalLevelStatus,
} from '../../types';
import { INITIAL_APPROVAL_MATRIX_RULES } from '../../lib/mockData';

export function evaluateApprovalMatrix(
  approvalType: ApprovalTransactionType,
  plantId: string,
  quantity?: number,
  amount?: number,
  rules: ApprovalMatrixRule[] = INITIAL_APPROVAL_MATRIX_RULES
): ApprovalMatrixRule | undefined {
  // First match plant-specific rules, then fallback to 'ALL'
  const applicableRules = rules.filter(
    (r) => r.active && r.approvalType === approvalType && (r.plantId === plantId || r.plantId === 'ALL')
  );

  // Sort rules with specific plant first, then by stricter conditions
  applicableRules.sort((a, b) => {
    if (a.plantId === plantId && b.plantId !== plantId) return -1;
    if (b.plantId === plantId && a.plantId !== plantId) return 1;
    // higher threshold priority
    const aThresh = (a.minQuantity || 0) + (a.minAmount || 0);
    const bThresh = (b.minQuantity || 0) + (b.minAmount || 0);
    return bThresh - aThresh;
  });

  for (const rule of applicableRules) {
    let match = true;
    if (rule.minQuantity !== undefined && (quantity === undefined || quantity < rule.minQuantity)) {
      match = false;
    }
    if (rule.maxQuantity !== undefined && (quantity === undefined || quantity > rule.maxQuantity)) {
      match = false;
    }
    if (rule.minAmount !== undefined && (amount === undefined || amount < rule.minAmount)) {
      match = false;
    }
    if (rule.maxAmount !== undefined && (amount === undefined || amount > rule.maxAmount)) {
      match = false;
    }

    if (match) {
      return rule;
    }
  }

  // Fallback to first rule for type if available
  return applicableRules[0];
}

export interface CreateApprovalParams {
  type: ApprovalTransactionType;
  referenceId: string;
  referenceTitle: string;
  plantId: string;
  plantName: string;
  requesterId: string;
  requesterName: string;
  requesterPosition: string;
  totalQuantity?: number;
  totalAmount?: number;
  metadata?: Record<string, any>;
  customRule?: ApprovalMatrixRule;
}

export function createApprovalTransaction(
  params: CreateApprovalParams,
  rules: ApprovalMatrixRule[] = INITIAL_APPROVAL_MATRIX_RULES
): ApprovalTransactionRequest {
  const rule =
    params.customRule ||
    evaluateApprovalMatrix(params.type, params.plantId, params.totalQuantity, params.totalAmount, rules);

  const now = new Date();
  const submittedAt = now.toISOString().replace('T', ' ').slice(0, 16);

  const levels: ApprovalLevelStatus[] = (rule?.levels || [
    {
      level: 1,
      roleRequired: 'SUPERVISOR',
      authorityTitle: 'Department Supervisor Approval',
      slaHours: 24,
    },
  ]).map((lvl, index) => {
    const dueDate = new Date(now.getTime() + lvl.slaHours * 60 * 60 * 1000);
    const slaDueDate = dueDate.toISOString().replace('T', ' ').slice(0, 16);

    return {
      level: lvl.level,
      authorityTitle: lvl.authorityTitle,
      roleRequired: lvl.roleRequired,
      positionCode: lvl.positionCode,
      status: index === 0 ? 'PENDING' : 'PENDING',
      slaDueDate,
      isEscalated: false,
    };
  });

  const requestNumber = `APP-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    id: `app-req-${Date.now()}`,
    requestNumber,
    approvalType: params.type,
    referenceId: params.referenceId,
    referenceTitle: params.referenceTitle,
    plantId: params.plantId,
    plantName: params.plantName,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    requesterPosition: params.requesterPosition,
    submittedAt,
    totalQuantity: params.totalQuantity,
    totalAmount: params.totalAmount,
    status: 'PENDING',
    currentLevel: 1,
    totalLevels: levels.length,
    levels,
    metadata: params.metadata,
  };
}

export interface ProcessDecisionParams {
  request: ApprovalTransactionRequest;
  currentUserId: string;
  currentUserName: string;
  currentUserRoles: string[];
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
  enforceSegregationOfDuties?: boolean;
}

export interface ProcessDecisionResult {
  success: boolean;
  error?: string;
  updatedRequest: ApprovalTransactionRequest;
}

export function processApprovalDecision(params: ProcessDecisionParams): ProcessDecisionResult {
  const {
    request,
    currentUserId,
    currentUserName,
    currentUserRoles,
    decision,
    reason,
    enforceSegregationOfDuties = true,
  } = params;

  if (request.status !== 'PENDING') {
    return {
      success: false,
      error: `Transaction ${request.requestNumber} is already ${request.status}. No further decisions allowed.`,
      updatedRequest: request,
    };
  }

  // 1. Segregation of Duties Check (Anti-Self-Approval)
  if (enforceSegregationOfDuties) {
    const isSelfApproval =
      (request.requesterId && request.requesterId === currentUserId) ||
      (request.requesterName && request.requesterName.trim().toLowerCase() === currentUserName.trim().toLowerCase());

    if (isSelfApproval) {
      return {
        success: false,
        error: `Segregation of Duties Violation: Requester (${request.requesterName}) cannot approve their own submission. Approval must be conducted by an independent authorized approver.`,
        updatedRequest: request,
      };
    }
  }

  // 2. Identify Current Level
  const currentLevelIndex = request.currentLevel - 1;
  const currentLevel = request.levels[currentLevelIndex];
  if (!currentLevel) {
    return {
      success: false,
      error: `Level ${request.currentLevel} not found in transaction approval chain.`,
      updatedRequest: request,
    };
  }

  // 3. Role Authorization Check
  const requiredRole = currentLevel.roleRequired.trim().toUpperCase();
  const normalizedUserRoles = currentUserRoles.map((r) => r.trim().toUpperCase());

  // Allow plant directors / system admins or exact matching role
  const isAuthorizedRole =
    normalizedUserRoles.includes(requiredRole) ||
    normalizedUserRoles.includes('PLANT_DIRECTOR') ||
    normalizedUserRoles.includes('OPERATIONS_DIRECTOR') ||
    normalizedUserRoles.includes('ADMIN');

  if (!isAuthorizedRole) {
    return {
      success: false,
      error: `Authorization Error: Current user roles [${currentUserRoles.join(', ')}] do not satisfy required role '${currentLevel.roleRequired}' for level ${request.currentLevel}.`,
      updatedRequest: request,
    };
  }

  // 4. Reason Enforcement for Rejections
  if (decision === 'REJECTED' && (!reason || !reason.trim())) {
    return {
      success: false,
      error: 'A mandatory rejection reason must be provided for governance audit trail.',
      updatedRequest: request,
    };
  }

  const now = new Date();
  const decisionTimestamp = now.toISOString().replace('T', ' ').slice(0, 16);

  const updatedLevels = [...request.levels];

  if (decision === 'REJECTED') {
    updatedLevels[currentLevelIndex] = {
      ...currentLevel,
      status: 'REJECTED',
      approverName: currentUserName,
      approverRole: currentUserRoles[0] || 'Approver',
      decisionDate: decisionTimestamp,
      reason: reason?.trim() || 'Rejected during review.',
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: 'REJECTED',
        levels: updatedLevels,
      },
    };
  }

  // Decision === 'APPROVED'
  updatedLevels[currentLevelIndex] = {
    ...currentLevel,
    status: 'APPROVED',
    approverName: currentUserName,
    approverRole: currentUserRoles[0] || 'Approver',
    decisionDate: decisionTimestamp,
    reason: reason?.trim() || 'Approved according to operational feasibility criteria.',
  };

  const isFinalLevel = request.currentLevel >= request.totalLevels;

  if (isFinalLevel) {
    return {
      success: true,
      updatedRequest: {
        ...request,
        status: 'APPROVED',
        levels: updatedLevels,
      },
    };
  }

  // Advance to Next Level
  const nextLevel = request.currentLevel + 1;
  return {
    success: true,
    updatedRequest: {
      ...request,
      currentLevel: nextLevel,
      levels: updatedLevels,
    },
  };
}

export function filterUserTasks(
  requests: ApprovalTransactionRequest[],
  currentUser: { id: string; name: string; roles: string[]; plantScope?: string[] }
) {
  const normalizedUserRoles = currentUser.roles.map((r) => r.trim().toUpperCase());
  const isExecutive =
    normalizedUserRoles.includes('PLANT_DIRECTOR') ||
    normalizedUserRoles.includes('OPERATIONS_DIRECTOR') ||
    normalizedUserRoles.includes('ADMIN');

  const myPendingApprovals = requests.filter((req) => {
    if (req.status !== 'PENDING') return false;
    // Anti self-approval filter
    if (req.requesterId === currentUser.id || req.requesterName.toLowerCase() === currentUser.name.toLowerCase()) {
      return false;
    }
    const currentLevel = req.levels[req.currentLevel - 1];
    if (!currentLevel || currentLevel.status !== 'PENDING') return false;

    const requiredRole = currentLevel.roleRequired.trim().toUpperCase();
    return isExecutive || normalizedUserRoles.includes(requiredRole);
  });

  const mySubmittedRequests = requests.filter(
    (req) => req.requesterId === currentUser.id || req.requesterName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const completedHistory = requests.filter(
    (req) => req.status === 'APPROVED' || req.status === 'REJECTED' || req.status === 'CANCELLED'
  );

  return {
    myPendingApprovals,
    mySubmittedRequests,
    completedHistory,
  };
}
