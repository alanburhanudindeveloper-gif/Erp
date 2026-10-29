import type { PurchaseRequisition, PurchaseRequisitionItem } from '../../../../types';
import type { IProcurementRepository } from '../../procurementRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface CreatePurchaseRequisitionCommand {
  requesterId: string;
  requesterName: string;
  department: string;
  requiredDate: string;
  reason: string;
  plantId: string;
  items: PurchaseRequisitionItem[];
}

export class CreatePurchaseRequisitionHandler {
  constructor(private readonly procurementRepo: IProcurementRepository) {}

  execute(command: CreatePurchaseRequisitionCommand): Result<PurchaseRequisition, DomainError> {
    if (!command.items || command.items.length === 0) {
      return fail(new ValidationError('Purchase requisition must contain at least one item.'));
    }

    if (!command.reason || !command.reason.trim()) {
      return fail(new ValidationError('A justification reason is required for purchase requisition.'));
    }

    const totalAmount = command.items.reduce((sum, item) => sum + item.totalCost, 0);
    const existingCount = this.procurementRepo.listPurchaseRequisitions().length;
    const prNumber = `PR-2026-${(existingCount + 1).toString().padStart(6, '0')}`;

    // Determine tiered approval level: 1: <10M, 2: 10-100M, 3: >100M
    const approvalLevelRequired: 1 | 2 | 3 =
      totalAmount > 100000000 ? 3 : totalAmount >= 10000000 ? 2 : 1;

    const pr: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      prNumber,
      requesterId: command.requesterId,
      requesterName: command.requesterName,
      department: command.department,
      requiredDate: command.requiredDate,
      reason: command.reason,
      plantId: command.plantId,
      status: 'PENDING_APPROVAL',
      totalAmount,
      approvalLevelRequired,
      items: command.items,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    const saved = this.procurementRepo.savePurchaseRequisition(pr);
    return ok(saved);
  }
}
