import type { WorkflowDefinition, WorkflowTransition } from '../../types';

export interface WorkflowAvailability {
  id: string;
  fromState: string;
  toState: string;
  actionLabel: string;
  requiredRole: string;
  requiresReason: boolean;
}

export interface WorkflowTransitionEvaluation {
  canTransition: boolean;
  nextState?: string;
  reason?: string;
  transition?: WorkflowAvailability;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  currentState: string;
  entityType: WorkflowDefinition['entityType'];
  availableTransitions: WorkflowAvailability[];
  history: Array<{
    from: string;
    to: string;
    action: string;
    actor: string;
    decision: 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'PENDING';
    reason?: string;
    timestamp: string;
  }>;
}

export interface ApprovalGateInput {
  requesterName?: string;
  actorName?: string;
  actorRole?: string;
  requiredRole?: string;
  requiresReason?: boolean;
  reason?: string;
  enforceSegregationOfDuties?: boolean;
}

export interface ApprovalGateResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
}

function resolveTransition(workflow: WorkflowDefinition, currentState: string, transitionId?: string): WorkflowTransition | undefined {
  if (transitionId) {
    return workflow.transitions.find((item) => item.id === transitionId && item.fromState === currentState);
  }

  return workflow.transitions.find((item) => item.fromState === currentState);
}

function getWorkflowState(workflow: WorkflowDefinition, stateId: string) {
  return workflow.states.find((state) => state.id === stateId);
}

export function evaluateApprovalGate(input: ApprovalGateInput): ApprovalGateResult {
  const {
    requesterName,
    actorName,
    actorRole,
    requiredRole,
    requiresReason = false,
    reason,
    enforceSegregationOfDuties = true,
  } = input;

  if (enforceSegregationOfDuties && requesterName && actorName) {
    const samePerson = requesterName.trim().toLowerCase() === actorName.trim().toLowerCase();
    if (samePerson) {
      return {
        allowed: false,
        reason: `Segregation of Duties Violation: Requester (${requesterName}) is not permitted to self-approve their own request. Approval must be performed by an independent authorized manager.`,
        requiredRole,
      };
    }
  }

  if (requiredRole && actorRole && actorRole.trim().toLowerCase() !== requiredRole.trim().toLowerCase()) {
    return {
      allowed: false,
      reason: `Role '${actorRole}' is not permitted to perform this approval. Required role: '${requiredRole}'.`,
      requiredRole,
    };
  }

  if (requiresReason && (!reason || !reason.trim())) {
    return {
      allowed: false,
      reason: 'A reason is required before the approval can be executed.',
      requiredRole,
    };
  }

  return {
    allowed: true,
    reason: 'Approval gate satisfied.',
    requiredRole,
  };
}

export function createWorkflowInstance(
  workflow: WorkflowDefinition,
  initialState?: string,
  entityId: string = `${workflow.code}-instance`
): WorkflowInstance {
  const startState = initialState || workflow.states.find((state) => state.isInitial)?.id || workflow.states[0]?.id || 'draft';
  const currentState = getWorkflowState(workflow, startState)?.id || startState;

  return {
    id: entityId,
    workflowId: workflow.id,
    currentState,
    entityType: workflow.entityType,
    availableTransitions: workflow.transitions
      .filter((transition) => transition.fromState === currentState)
      .map((transition) => ({
        id: transition.id,
        fromState: transition.fromState,
        toState: transition.toState,
        actionLabel: transition.actionLabel,
        requiredRole: transition.requiredRole,
        requiresReason: transition.requiresReason,
      })),
    history: [],
  };
}

export function evaluateTransition(
  instance: WorkflowInstance,
  workflow: WorkflowDefinition,
  transitionId: string,
  actorRole: string,
  reason?: string
): WorkflowTransitionEvaluation {
  const transition = resolveTransition(workflow, instance.currentState, transitionId);
  if (!transition) {
    return {
      canTransition: false,
      reason: 'No valid transition exists for the current workflow state.',
    };
  }

  if (transition.requiredRole && actorRole !== transition.requiredRole) {
    return {
      canTransition: false,
      reason: `Role '${actorRole}' is not permitted to perform '${transition.actionLabel}'. Required role: '${transition.requiredRole}'.`,
      transition: {
        id: transition.id,
        fromState: transition.fromState,
        toState: transition.toState,
        actionLabel: transition.actionLabel,
        requiredRole: transition.requiredRole,
        requiresReason: transition.requiresReason,
      },
    };
  }

  if (transition.requiresReason && (!reason || !reason.trim())) {
    return {
      canTransition: false,
      reason: `A reason is required before '${transition.actionLabel}' can be executed.`,
      transition: {
        id: transition.id,
        fromState: transition.fromState,
        toState: transition.toState,
        actionLabel: transition.actionLabel,
        requiredRole: transition.requiredRole,
        requiresReason: transition.requiresReason,
      },
    };
  }

  return {
    canTransition: true,
    nextState: transition.toState,
    reason: 'Transition is valid.',
    transition: {
      id: transition.id,
      fromState: transition.fromState,
      toState: transition.toState,
      actionLabel: transition.actionLabel,
      requiredRole: transition.requiredRole,
      requiresReason: transition.requiresReason,
    },
  };
}

export function applyWorkflowTransition(
  instance: WorkflowInstance,
  workflow: WorkflowDefinition,
  transitionId: string,
  actor: string,
  actorRole: string,
  reason?: string
): WorkflowInstance {
  const evaluation = evaluateTransition(instance, workflow, transitionId, actorRole, reason);
  if (!evaluation.canTransition || !evaluation.nextState || !evaluation.transition) {
    return instance;
  }

  const timestamp = new Date().toISOString();
  const decision = evaluation.transition.actionLabel.toLowerCase().includes('reject')
    ? 'REJECTED'
    : evaluation.transition.actionLabel.toLowerCase().includes('approve')
      ? 'APPROVED'
      : 'PENDING';

  return {
    ...instance,
    currentState: evaluation.nextState,
    availableTransitions: workflow.transitions
      .filter((transition) => transition.fromState === evaluation.nextState)
      .map((transition) => ({
        id: transition.id,
        fromState: transition.fromState,
        toState: transition.toState,
        actionLabel: transition.actionLabel,
        requiredRole: transition.requiredRole,
        requiresReason: transition.requiresReason,
      })),
    history: [
      ...instance.history,
      {
        from: instance.currentState,
        to: evaluation.nextState,
        action: evaluation.transition.actionLabel,
        actor,
        decision,
        reason,
        timestamp,
      },
    ],
  };
}

export function getActiveWorkflowState(workflow: WorkflowDefinition): string {
  return workflow.states.find((state) => state.isInitial)?.id || workflow.states[0]?.id || 'draft';
}
