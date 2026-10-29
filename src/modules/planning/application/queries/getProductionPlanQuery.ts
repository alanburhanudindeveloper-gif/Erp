import type { ProductionPlanItem } from '../../../../types';
import type { IPlanningRepository } from '../../planningRepository';
import { paginateItems, type PaginationQuery, type PaginatedResult } from '../../../../shared/kernel/pagination';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError } from '../../../../shared/kernel/errors';

export interface GetProductionPlanByIdQuery {
  planId: string;
}

export interface ListProductionPlansQuery extends PaginationQuery {
  status?: string;
  sku?: string;
}

export class GetProductionPlanHandler {
  constructor(private readonly planningRepo: IPlanningRepository) {}

  getById(query: GetProductionPlanByIdQuery): Result<ProductionPlanItem, NotFoundError> {
    const plan = this.planningRepo.findProductionPlanById(query.planId);
    if (!plan) {
      return fail(new NotFoundError('ProductionPlanItem', query.planId));
    }
    return ok(plan);
  }

  list(query: ListProductionPlansQuery = {}): PaginatedResult<ProductionPlanItem> {
    let plans = this.planningRepo.listProductionPlans();

    if (query.status) {
      plans = plans.filter((p) => p.status === query.status);
    }
    if (query.sku) {
      plans = plans.filter((p) => p.productSku === query.sku);
    }

    return paginateItems(plans, query);
  }
}
