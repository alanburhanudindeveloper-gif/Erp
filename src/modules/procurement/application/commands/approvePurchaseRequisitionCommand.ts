import type { PurchaseRequisition, ApprovalTransactionRequest } from '../../../../types';
import type { IProcurementRepository } from '../../procurementRepository';
import type { IWorkflowRepository } from '../../../workflow/workflowRepository';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { evaluatePurchaseRequisitionApproval } from '../../procurementService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface ApprovePurchaseRequisitionCommand {
  prId: string;
  actorName: string;
  actorRole: string;
}

export class ApprovePurchaseRequisitionHandler {
  constructor(
    private readonly procurementRepo: IProcurementRepository,
    private readonly workflowRepo?: IWorkflowRepository,
    private readonly unitOfWork?: IUnitOfWork
  ) {}

  execute(command: ApprovePurchaseRequisitionCommand): Result<PurchaseRequisition, DomainError> {
    const runWork = () => this.executeInternal(command);

    if (this.unitOfWork && this.unitOfWork.executeSync) {
      return this.unitOfWork.executeSync(runWork);
    }

    return runWork();
  }

  private executeInternal(command: ApprovePurchaseRequisitionCommand): Result<PurchaseRequisition, DomainError> {
    const pr = this.procurementRepo.findPurchaseRequisitionById(command.prId);
    if (!pr) {
      return fail(new NotFoundError('PurchaseRequisition', command.prId));
    }

    // Step 1: Validate approval policy and invariants (including Segregation of Duties)
    const evaluation = evaluatePurchaseRequisitionApproval(
      pr,
      command.actorName,
      command.actorRole
    );

    if (!evaluation.allowed) {
      return fail(new ValidationError(evaluation.reason ?? 'Approval rejected by authorization policy.'));
    }

    // Step 2: Mutate Purchase Requisition status
    const updated: PurchaseRequisition = {
      ...pr,
      status: 'APPROVED',
      approvedBy: command.actorName,
      approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    const saved = this.procurementRepo.savePurchaseRequisition(updated);

    // Step 3: Mutate Workflow state atomically in participating workflow repository
    if (this.workflowRepo) {
      const existingRequest = this.workflowRepo.findApprovalRequestById(`app-pr-${pr.id}`) ||
        this.workflowRepo.listApprovalRequests().find((r) => r.referenceId === pr.id);

      if (existingRequest) {
        const updatedReq: ApprovalTransactionRequest = {
          ...existingRequest,
          status: 'APPROVED',
          levels: existingRequest.levels.map((lvl) => ({
            ...lvl,
            status: 'APPROVED',
            approverName: command.actorName,
            approverRole: command.actorRole,
            decisionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          })),
        };
        this.workflowRepo.saveApprovalRequest(updatedReq);
      } else {
        const newReq: ApprovalTransactionRequest = {
          id: `app-pr-${pr.id}`,
          requestNumber: `APP-${pr.prNumber}`,
          approvalType: 'PURCHASE_REQUISITION',
          referenceId: pr.id,
          referenceTitle: `Purchase Requisition ${pr.prNumber} Approval`,
          plantId: pr.plantId || 'PLANT-01',
          plantName: 'Main Plant',
          requesterId: pr.requesterId || 'usr-req-01',
          requesterName: pr.requesterName,
          requesterPosition: pr.department,
          submittedAt: pr.createdAt,
          totalQuantity: pr.items?.reduce((sum, item) => sum + item.quantity, 0) || 1,
          status: 'APPROVED',
          currentLevel: 1,
          totalLevels: 1,
          levels: [
            {
              level: 1,
              authorityTitle: `${command.actorRole} Review & Approval`,
              roleRequired: command.actorRole,
              positionCode: `POS-${command.actorRole.toUpperCase().replace(/\s+/g, '-')}`,
              status: 'APPROVED',
              slaDueDate: pr.requiredDate,
              isEscalated: false,
              approverName: command.actorName,
              approverRole: command.actorRole,
              decisionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
            },
          ],
        };
        this.workflowRepo.saveApprovalRequest(newReq);
      }
    }

    return ok(saved);
  }
}
