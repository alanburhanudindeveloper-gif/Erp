import type {
  WorkflowDefinition,
  BusinessRule,
  ApprovalTransactionRequest,
} from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import {
  INITIAL_WORKFLOWS,
  INITIAL_BUSINESS_RULES,
  INITIAL_APPROVAL_REQUESTS,
} from '../../lib/mockData';

export interface IWorkflowRepository extends ITransactionalParticipant {
  listWorkflows(): WorkflowDefinition[];
  findWorkflowById(id: string): WorkflowDefinition | undefined;
  saveWorkflow(workflow: WorkflowDefinition): WorkflowDefinition;

  listBusinessRules(): BusinessRule[];
  findBusinessRuleById(id: string): BusinessRule | undefined;
  saveBusinessRule(rule: BusinessRule): BusinessRule;

  listApprovalRequests(): ApprovalTransactionRequest[];
  findApprovalRequestById(id: string): ApprovalTransactionRequest | undefined;
  saveApprovalRequest(req: ApprovalTransactionRequest): ApprovalTransactionRequest;

  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

export function createWorkflowRepository(
  initialWorkflows: WorkflowDefinition[] = INITIAL_WORKFLOWS,
  initialRules: BusinessRule[] = INITIAL_BUSINESS_RULES,
  initialRequests: ApprovalTransactionRequest[] = INITIAL_APPROVAL_REQUESTS
): IWorkflowRepository {
  const workflowCollection: ErpCollectionRepository<WorkflowDefinition> = createErpCollectionRepository<WorkflowDefinition>(
    'workflows',
    initialWorkflows
  );

  const ruleCollection: ErpCollectionRepository<BusinessRule> = createErpCollectionRepository<BusinessRule>(
    'businessrules',
    initialRules
  );

  const requestCollection: ErpCollectionRepository<ApprovalTransactionRequest> = createErpCollectionRepository<ApprovalTransactionRequest>(
    'approvalrequests',
    initialRequests
  );

  return {
    listWorkflows: () => workflowCollection.list(),
    findWorkflowById: (id: string) => workflowCollection.get(id),
    saveWorkflow: (workflow: WorkflowDefinition) => workflowCollection.upsert(workflow, 'id'),

    listBusinessRules: () => ruleCollection.list(),
    findBusinessRuleById: (id: string) => ruleCollection.get(id),
    saveBusinessRule: (rule: BusinessRule) => ruleCollection.upsert(rule, 'id'),

    listApprovalRequests: () => requestCollection.list(),
    findApprovalRequestById: (id: string) => requestCollection.get(id),
    saveApprovalRequest: (req: ApprovalTransactionRequest) => requestCollection.upsert(req, 'id'),

    createSnapshot: () => ({
      workflows: workflowCollection.createSnapshot(),
      rules: ruleCollection.createSnapshot(),
      requests: requestCollection.createSnapshot(),
    }),

    restoreSnapshot: (snapshot: unknown) => {
      if (snapshot && typeof snapshot === 'object') {
        const snap = snapshot as {
          workflows?: WorkflowDefinition[];
          rules?: BusinessRule[];
          requests?: ApprovalTransactionRequest[];
        };
        if (snap.workflows) workflowCollection.restoreSnapshot(snap.workflows);
        if (snap.rules) ruleCollection.restoreSnapshot(snap.rules);
        if (snap.requests) requestCollection.restoreSnapshot(snap.requests);
      }
    },
  };
}
