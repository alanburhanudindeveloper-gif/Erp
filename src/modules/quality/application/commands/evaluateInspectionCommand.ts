import type { InspectionEvaluationInput } from '../../qualityService';
import { evaluateQualityInspection, type InspectionEvaluationResult } from '../../qualityService';
import type { IQualityRepository } from '../../qualityRepository';
import type { IInventoryRepository } from '../../../inventory';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface EvaluateInspectionCommand extends InspectionEvaluationInput {}

export class EvaluateInspectionHandler {
  constructor(
    private readonly qualityRepo: IQualityRepository,
    private readonly inventoryRepo?: IInventoryRepository,
    private readonly uow?: IUnitOfWork
  ) {}

  execute(command: EvaluateInspectionCommand): Result<InspectionEvaluationResult, DomainError> {
    const runWork = (): Result<InspectionEvaluationResult, DomainError> => {
      const result = evaluateQualityInspection(command);

      this.qualityRepo.saveInspection(result.inspection);

      if (result.ncrRequired && result.ncrDraft) {
        this.qualityRepo.saveNcr(result.ncrDraft);
      }

      if (this.inventoryRepo && result.stockMovements && result.stockMovements.length > 0) {
        for (const mov of result.stockMovements) {
          this.inventoryRepo.recordMovement(mov);
        }
      }

      return ok(result);
    };

    if (this.uow && typeof this.uow.executeSync === 'function') {
      try {
        return this.uow.executeSync(runWork);
      } catch (err: unknown) {
        return fail(new ValidationError(err instanceof Error ? err.message : String(err)));
      }
    }

    return runWork();
  }
}
