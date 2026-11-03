import type { NonConformanceReport } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import type { IInventoryRepository } from '../../../inventory';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { resolveNcr, type NcrResolutionResult } from '../../qualityService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface ResolveNcrCommand {
  ncrId: string;
  disposition: 'SCRAP' | 'REWORK' | 'USE_AS_IS';
  rootCause: string;
  resolver: string;
  notes?: string;
}

export class ResolveNcrHandler {
  constructor(
    private readonly qualityRepo: IQualityRepository,
    private readonly inventoryRepo?: IInventoryRepository,
    private readonly uow?: IUnitOfWork
  ) {}

  execute(command: ResolveNcrCommand): Result<NcrResolutionResult, DomainError> {
    const ncr = this.qualityRepo.findNcrById(command.ncrId);
    if (!ncr) {
      return fail(new NotFoundError('NonConformanceReport', command.ncrId));
    }

    const runWork = (): Result<NcrResolutionResult, DomainError> => {
      try {
        const result = resolveNcr({
          ncr,
          disposition: command.disposition,
          rootCause: command.rootCause,
          resolver: command.resolver,
          notes: command.notes,
        });

        this.qualityRepo.saveNcr(result.resolvedNcr);

        if (this.inventoryRepo && result.stockMovements && result.stockMovements.length > 0) {
          for (const mov of result.stockMovements) {
            this.inventoryRepo.recordMovement(mov);
          }
        }

        return ok(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return fail(new ValidationError(message));
      }
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
