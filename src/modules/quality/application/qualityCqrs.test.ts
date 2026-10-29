import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createQualityRepository } from '../qualityRepository';
import { createInventoryRepository } from '../../inventory/inventoryRepository';
import { EvaluateInspectionHandler } from './commands/evaluateInspectionCommand';
import { ResolveNcrHandler } from './commands/resolveNcrCommand';
import { ListOpenNcrsHandler } from './queries/listOpenNcrsQuery';
import type { NonConformanceReport } from '../../../types';

describe('Quality Application CQRS Handlers', () => {
  it('EvaluateInspectionHandler records inspection and drafts NCR on failure', () => {
    const qualityRepo = createQualityRepository([], []);
    const handler = new EvaluateInspectionHandler(qualityRepo);

    const result = handler.execute({
      sourceType: 'PRODUCTION_ORDER',
      sourceRef: 'MO-2026-001',
      productId: 'prd-001',
      sku: 'Product A',
      productName: 'Product A',
      lotNumber: 'LOT-FAIL-01',
      operationName: 'Final Test',
      sampleSize: 100,
      defectsCount: 5,
      maxAllowedDefects: 0,
      characteristic: 'Voltage',
      specification: '220V',
      inspector: 'Inspector QA',
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.ncrRequired, true);
      assert.strictEqual(qualityRepo.listInspections().length, 1);
      assert.strictEqual(qualityRepo.listOpenNcrs().length, 1);
    }
  });

  it('ResolveNcrHandler updates NCR with root cause and records stock movement', () => {
    const openNcr: NonConformanceReport = {
      id: 'ncr-open-1',
      ncrNo: 'NCR-2026-001',
      orderNumber: 'MO-2026-001',
      lotNumber: 'LOT-FAIL-01',
      productSku: 'Product A',
      defectDescription: 'Failed dielectric test',
      quantityAffected: 10,
      disposition: 'REWORK',
      status: 'OPEN',
      createdAt: '2026-10-29',
    };

    const qualityRepo = createQualityRepository([], [openNcr]);
    const inventoryRepo = createInventoryRepository([], []);
    const handler = new ResolveNcrHandler(qualityRepo, inventoryRepo);

    const result = handler.execute({
      ncrId: 'ncr-open-1',
      disposition: 'SCRAP',
      rootCause: 'Defective capacitor batch C-2026 from vendor',
      resolver: 'QA Lead',
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.resolvedNcr.status, 'RESOLVED');
      assert.strictEqual(qualityRepo.listOpenNcrs().length, 0);
      assert.strictEqual(inventoryRepo.listMovements().length, 1);
    }
  });

  it('ListOpenNcrsHandler lists and paginates open NCRs', () => {
    const openNcr: NonConformanceReport = {
      id: 'ncr-open-1',
      ncrNo: 'NCR-2026-001',
      orderNumber: 'MO-2026-001',
      lotNumber: 'LOT-FAIL-01',
      productSku: 'Product A',
      defectDescription: 'Failed dielectric test',
      quantityAffected: 10,
      disposition: 'REWORK',
      status: 'OPEN',
      createdAt: '2026-10-29',
    };

    const qualityRepo = createQualityRepository([], [openNcr]);
    const handler = new ListOpenNcrsHandler(qualityRepo);

    const list = handler.execute({ page: 1, limit: 10 });
    assert.strictEqual(list.total, 1);
    assert.strictEqual(list.items[0].ncrNo, 'NCR-2026-001');
  });
});
