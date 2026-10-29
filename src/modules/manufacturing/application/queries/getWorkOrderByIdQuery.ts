import type { ProductionOrder } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError } from '../../../../shared/kernel/errors';

export interface GetWorkOrderByIdQuery {
  orderId: string;
}

export class GetWorkOrderByIdHandler {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  execute(query: GetWorkOrderByIdQuery): Result<ProductionOrder, NotFoundError> {
    const order = this.workOrderRepo.findById(query.orderId);
    if (!order) {
      return fail(new NotFoundError('ProductionOrder', query.orderId));
    }
    return ok(order);
  }
}
