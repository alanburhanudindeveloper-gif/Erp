import type { PurchaseRequisition } from '../../../../types';
import type { IProcurementRepository } from '../../procurementRepository';
import { evaluatePurchaseRequisitionApproval } from '../../procurementService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface ApprovePurchaseRequisitionCommand {
  prId: string;
  actorName: string;
  actorRole: string;
}

export class ApprovePurchaseRequisitionHandler {
  constructor(private readonly procurementRepo: IProcurementRepository) {}

  execute(command: ApprovePurchaseRequisitionCommand): Result<PurchaseRequisition, DomainError> {
    const pr = this.procurementRepo.findPurchaseRequisitionById(command.prId);
    if (!pr) {
      return fail(new NotFoundError('PurchaseRequisition', command.prId));
    }

    const evaluation = evaluatePurchaseRequisitionApproval(
      pr,
      command.actorName,
      command.actorRole
    );

    if (!evaluation.allowed) {
      return fail(new ValidationError(evaluation.reason ?? 'Approval rejected by authorization policy.'));
    }

    const updated: PurchaseRequisition = {
      ...pr,
      status: 'APPROVED',
      approvedBy: command.actorName,
      approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    const saved = this.procurementRepo.savePurchaseRequisition(updated);
    return ok(saved);
  }
}
