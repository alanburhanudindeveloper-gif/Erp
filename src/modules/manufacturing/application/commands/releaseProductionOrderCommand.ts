import type { ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { releaseProductionOrderForExecution } from '../../productionExecutionService';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface ReleaseProductionOrderCommand {
  orderId: string;
  actorName: string;
  actorRole: string;
  overrideReason?: string;
}

export class ReleaseProductionOrderHandler {
  constructor(
    private readonly workOrderRepo: IWorkOrderRepository,
    private readonly unitOfWork?: IUnitOfWork
  ) {}

  execute(command: ReleaseProductionOrderCommand): Result<ProductionOrder, DomainError> {
    const runWork = () => this.executeInternal(command);
    if (this.unitOfWork?.executeSync) {
      return this.unitOfWork.executeSync(runWork);
    }
    return runWork();
  }

  private executeInternal(command: ReleaseProductionOrderCommand): Result<ProductionOrder, DomainError> {
    const order = this.workOrderRepo.findById(command.orderId);
    if (!order) {
      return fail(new NotFoundError('ProductionOrder', command.orderId));
    }

    const decision = releaseProductionOrderForExecution(
      order,
      command.actorName,
      command.actorRole,
      command.overrideReason
    );

    if (!decision.allowed || !decision.updatedOrder) {
      return fail(new ValidationError(decision.reason ?? 'Failed to release production order'));
    }

    const saved = this.workOrderRepo.save(decision.updatedOrder);
    return ok(saved);
  }
}
