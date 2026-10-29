import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createCostingRepository } from './costingRepository';
import type { CostVarianceRecord } from '../../types';

describe('Costing Repository Operations', () => {
  it('manages cost variances through authoritative persistence', () => {
    const repo = createCostingRepository([]);

    const variance: CostVarianceRecord = {
      orderNumber: 'MO-TEST-001',
      productSku: 'Product A',
      plannedMaterialCost: 1000,
      actualMaterialCost: 1100,
      plannedLaborCost: 200,
      actualLaborCost: 200,
      plannedMachineCost: 150,
      actualMachineCost: 150,
      overheadCost: 50,
      totalPlannedCost: 1400,
      totalActualCost: 1500,
      varianceAmount: 100,
      variancePercentage: 7.14,
      materialVariance: 100,
      laborEfficiencyVariance: 0,
      settledAt: '2026-10-29',
    };

    repo.saveCostVariance(variance);
    assert.strictEqual(repo.listCostVariances().length, 1);
    const fetched = repo.findCostVarianceByOrderNumber('MO-TEST-001');
    assert.strictEqual(fetched?.varianceAmount, 100);
  });
});
