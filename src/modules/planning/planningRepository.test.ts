import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createPlanningRepository } from './planningRepository';
import type { ProductionPlanItem, DemandRecord } from '../../types';

describe('Planning Repository Operations', () => {
  it('manages production plans and demands through authoritative persistence', () => {
    const repo = createPlanningRepository([], [], []);

    const demand: DemandRecord = {
      id: 'dem-test-1',
      demandNo: 'DEM-TEST-001',
      productId: 'prd-001',
      productSku: 'Product A',
      productName: 'Product A',
      quantity: 500,
      dueDate: '2026-11-10',
      source: 'SALES_ORDER',
      firmness: 'FIRM',
      priority: 'HIGH',
      status: 'CONFIRMED',
    };

    repo.saveDemand(demand);
    assert.strictEqual(repo.listDemands().length, 1);
    assert.strictEqual(repo.findDemandById('dem-test-1')?.demandNo, 'DEM-TEST-001');

    const plan: ProductionPlanItem = {
      id: 'plan-test-1',
      planNumber: 'PLAN-TEST-001',
      periodWeek: 'Week 44',
      demandRef: 'DEM-TEST-001',
      productId: 'prd-001',
      productSku: 'Product A',
      productName: 'Product A',
      demandQty: 500,
      plannedQty: 500,
      unfulfilledQty: 0,
      feasibility: 'FEASIBLE',
      targetStartDate: '2026-11-01',
      targetEndDate: '2026-11-05',
      status: 'CONFIRMED',
    };

    repo.saveProductionPlan(plan);
    assert.strictEqual(repo.listProductionPlans().length, 1);
    assert.strictEqual(repo.findProductionPlanById('plan-test-1')?.planNumber, 'PLAN-TEST-001');
  });
});
