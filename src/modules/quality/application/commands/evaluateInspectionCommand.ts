import type { InspectionEvaluationInput } from '../../qualityService';
import { evaluateQualityInspection, type InspectionEvaluationResult } from '../../qualityService';
import type { IQualityRepository } from '../../qualityRepository';
import { ok, type Result } from '../../../../shared/kernel/result';
import type { DomainError } from '../../../../shared/kernel/errors';

export interface EvaluateInspectionCommand extends InspectionEvaluationInput {}

export class EvaluateInspectionHandler {
  constructor(private readonly qualityRepo: IQualityRepository) {}

  execute(command: EvaluateInspectionCommand): Result<InspectionEvaluationResult, DomainError> {
    const result = evaluateQualityInspection(command);

    this.qualityRepo.saveInspection(result.inspection);

    if (result.ncrRequired && result.ncrDraft) {
      this.qualityRepo.saveNcr(result.ncrDraft);
    }

    return ok(result);
  }
}
