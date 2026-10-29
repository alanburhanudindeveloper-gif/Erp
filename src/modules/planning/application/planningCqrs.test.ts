import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createPlanningRepository } from '../planningRepository';
import { createWorkOrderRepository } from '../../manufacturing/workOrderRepository';
import { DispatchProductionPlanHandler } from './commands/dispatchProductionPlanCommand';
import { GetProductionPlanHandler } from './queries/getProductionPlanQuery';
import type { ProductionPlanItem, Routing } from '../../../types';

describe('Planning Application CQRS Handlers', () => {
  const samplePlan: ProductionPlanItem = {
    id: 'plan-cqrs-1',
    planNumber: 'PLAN-CQRS-001',
    periodWeek: 'Week 44',
    demandRef: 'DEM-01',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Product A',
    demandQty: 1000,
    plannedQty: 1000,
    unfulfilledQty: 0,
    feasibility: 'FEASIBLE',
    targetStartDate: '2026-11-01',
    targetEndDate: '2026-11-05',
    status: 'FEASIBILITY_REVIEW',
  };

  const sampleRouting: Routing = {
    id: 'rt-1',
    code: 'ROUTE-A',
    revision: 'Rev.01',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Product A',
    status: 'ACTIVE',
    operations: [],
  };

  it('DispatchProductionPlanHandler creates work order and updates plan status', () => {
    const planningRepo = createPlanningRepository([samplePlan], [], []);
    const workOrderRepo = createWorkOrderRepository([]);
    const handler = new DispatchProductionPlanHandler(planningRepo, workOrderRepo);

    const result = handler.execute({
      planId: 'plan-cqrs-1',
      routing: sampleRouting,
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.targetQuantity, 1000);
      assert.strictEqual(result.value.productSku, 'Product A');
      assert.strictEqual(workOrderRepo.listAll().length, 1);

      const updatedPlan = planningRepo.findProductionPlanById('plan-cqrs-1');
      assert.strictEqual(updatedPlan?.status, 'CONFIRMED');
      assert.strictEqual(updatedPlan?.generatedWorkOrderId, result.value.id);
    }
  });

  it('DispatchProductionPlanHandler fails when routing is not active', () => {
    const planningRepo = createPlanningRepository([samplePlan], [], []);
    const workOrderRepo = createWorkOrderRepository([]);
    const handler = new DispatchProductionPlanHandler(planningRepo, workOrderRepo);

    const result = handler.execute({
      planId: 'plan-cqrs-1',
      routing: { ...sampleRouting, status: 'DRAFT' },
    });

    assert.strictEqual(result.isFailure, true);
  });

  it('GetProductionPlanHandler retrieves plan and lists paginated results', () => {
    const planningRepo = createPlanningRepository([samplePlan], [], []);
    const handler = new GetProductionPlanHandler(planningRepo);

    const getRes = handler.getById({ planId: 'plan-cqrs-1' });
    assert.strictEqual(getRes.isSuccess, true);

    const listRes = handler.list({ page: 1, limit: 10 });
    assert.strictEqual(listRes.total, 1);
    assert.strictEqual(listRes.items[0].planNumber, 'PLAN-CQRS-001');
  });
});
