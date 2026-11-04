import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createQualityRepository } from '../qualityRepository';
import { createInventoryRepository } from '../../inventory/inventoryRepository';
import { InMemoryUnitOfWork } from '../../../shared/kernel/unitOfWork';
import { EvaluateInspectionHandler } from './commands/evaluateInspectionCommand';
import { ResolveNcrHandler } from './commands/resolveNcrCommand';
import { ReleaseQcInspectionHandler } from './commands/releaseQcInspectionCommand';
import { ListOpenNcrsHandler } from './queries/listOpenNcrsQuery';
import { ListInspectionsHandler } from './queries/listInspectionsQuery';
import { GetInspectionByIdHandler } from './queries/getInspectionByIdQuery';
import { ListNcrsHandler } from './queries/listNcrsQuery';
import { GetNcrByIdHandler } from './queries/getNcrByIdQuery';
import type { NonConformanceReport, QualityInspection } from '../../../types';

const sampleInspection: QualityInspection = {
  id: 'qc-init-1',
  inspectionNo: 'INS-2026-001',
  sourceType: 'PRODUCTION_ORDER',
  sourceRef: 'MO-2026-001',
  productId: 'prd-001',
  sku: 'FG-001',
  productName: 'Flow Sensor Unit',
  lotNumber: 'LOT-QC-01',
  operationName: 'Final Assembly',
  sampleSize: 20,
  defectsCount: 0,
  characteristic: 'Voltage Stability',
  specification: '12V ± 0.2V',
  result: 'PASS',
  disposition: 'UNRESTRICTED',
  inspector: 'Agus',
  timestamp: '2026-10-26 10:00',
  notes: 'All units passed',
};

const sampleNcr: NonConformanceReport = {
  id: 'ncr-open-1',
  ncrNo: 'NCR-2026-001',
  orderNumber: 'MO-2026-001',
  lotNumber: 'LOT-QC-01',
  productSku: 'FG-001',
  defectDescription: 'Failed dielectric test',
  quantityAffected: 10,
  disposition: 'REWORK',
  status: 'OPEN',
  createdAt: '2026-10-29',
};

describe('Quality Application CQRS Handlers', () => {
  it('EvaluateInspectionHandler records inspection and drafts NCR on failure', () => {
    const qualityRepo = createQualityRepository([], []);
    const handler = new EvaluateInspectionHandler(qualityRepo);

    const result = handler.execute({
      sourceType: 'PRODUCTION_ORDER',
      sourceRef: 'MO-2026-001',
      productId: 'prd-001',
      sku: 'FG-001',
      productName: 'Flow Sensor Unit',
      lotNumber: 'LOT-FAIL-01',
      operationName: 'Final Test',
      sampleSize: 100,
      defectsCount: 5,
      maxAllowedDefects: 0,
      characteristic: 'Voltage',
      specification: '220V',
      inspector: 'Inspector QA',
    });

    assert.equal(result.isSuccess, true);
    if (result.isSuccess) {
      assert.equal(result.value.ncrRequired, true);
      assert.equal(qualityRepo.listInspections().length, 1);
      assert.equal(qualityRepo.listOpenNcrs().length, 1);
    }
  });

  it('ReleaseQcInspectionHandler releases inspection with PASS and transfers stock to AVAILABLE', () => {
    const unreleasedInspection: QualityInspection = {
      ...sampleInspection,
      id: 'qc-unreleased-1',
      inspectionNo: 'INS-REL-001',
      result: 'PASS',
      disposition: 'HOLD',
    };
    const qualityRepo = createQualityRepository([unreleasedInspection], []);
    const inventoryRepo = createInventoryRepository([], []);
    const uow = new InMemoryUnitOfWork([qualityRepo, inventoryRepo]);
    const handler = new ReleaseQcInspectionHandler(qualityRepo, inventoryRepo, uow);

    const result = handler.execute({
      inspectionId: 'qc-unreleased-1',
      decision: 'PASS',
      disposition: 'UNRESTRICTED',
      notes: 'Passed metallurgical verification',
      actor: 'Quality Manager Hendra',
      role: 'Quality Lead',
    });

    assert.equal(result.isSuccess, true);
    if (result.isSuccess) {
      assert.equal(result.value.inspection.disposition, 'UNRESTRICTED');
      assert.ok(result.value.movement);
      assert.equal(result.value.movement.stockBucket, 'AVAILABLE');
      assert.equal(result.value.movement.toLocation, 'PLANT01-RM-WH-AVAILABLE');
      assert.equal(inventoryRepo.listMovements().length, 1);
    }
  });

  it('ReleaseQcInspectionHandler rejects inspection with FAIL and generates NCR and REJECTED movement', () => {
    const holdInspection: QualityInspection = {
      ...sampleInspection,
      id: 'qc-hold-2',
      inspectionNo: 'INS-FAIL-002',
      result: 'PENDING' as any,
      disposition: 'HOLD',
    };
    const qualityRepo = createQualityRepository([holdInspection], []);
    const inventoryRepo = createInventoryRepository([], []);
    const uow = new InMemoryUnitOfWork([qualityRepo, inventoryRepo]);
    const handler = new ReleaseQcInspectionHandler(qualityRepo, inventoryRepo, uow);

    const result = handler.execute({
      inspectionId: 'qc-hold-2',
      decision: 'FAIL',
      disposition: 'REJECT',
      notes: 'Out of tolerance scratch',
      actor: 'Quality Inspector Budi',
      role: 'Quality Lead',
    });

    assert.equal(result.isSuccess, true);
    if (result.isSuccess) {
      assert.equal(result.value.inspection.result, 'FAIL');
      assert.equal(result.value.inspection.disposition, 'REJECT');
      assert.ok(result.value.ncr);
      assert.equal(result.value.ncr.status, 'OPEN');
      assert.ok(result.value.movement);
      assert.equal(result.value.movement.stockBucket, 'REJECTED');
      assert.equal(qualityRepo.listNcrs().length, 1);
      assert.equal(inventoryRepo.listMovements().length, 1);
    }
  });

  it('ReleaseQcInspectionHandler returns NotFoundError for unknown inspection ID', () => {
    const qualityRepo = createQualityRepository([], []);
    const handler = new ReleaseQcInspectionHandler(qualityRepo);

    const result = handler.execute({
      inspectionId: 'qc-non-existent',
      decision: 'PASS',
      disposition: 'UNRESTRICTED',
      actor: 'Test Actor',
    });

    assert.equal(result.isSuccess, false);
    if (!result.isSuccess) {
      assert.equal(result.error.code, 'NOT_FOUND_ERROR');
    }
  });

  it('ResolveNcrHandler updates NCR with root cause and records stock movement', () => {
    const qualityRepo = createQualityRepository([], [sampleNcr]);
    const inventoryRepo = createInventoryRepository([], []);
    const handler = new ResolveNcrHandler(qualityRepo, inventoryRepo);

    const result = handler.execute({
      ncrId: 'ncr-open-1',
      disposition: 'SCRAP',
      rootCause: 'Defective capacitor batch C-2026 from vendor',
      resolver: 'QA Lead',
    });

    assert.equal(result.isSuccess, true);
    if (result.isSuccess) {
      assert.equal(result.value.resolvedNcr.status, 'RESOLVED');
      assert.equal(qualityRepo.listOpenNcrs().length, 0);
      assert.equal(inventoryRepo.listMovements().length, 1);
    }
  });

  it('ListInspectionsHandler queries and filters inspections', () => {
    const inspections: QualityInspection[] = [
      sampleInspection,
      {
        ...sampleInspection,
        id: 'qc-2',
        inspectionNo: 'INS-2026-002',
        sku: 'RAW-002',
        result: 'FAIL',
        disposition: 'HOLD',
      },
    ];
    const qualityRepo = createQualityRepository(inspections, []);
    const handler = new ListInspectionsHandler(qualityRepo);

    // List all
    const all = handler.execute({});
    assert.equal(all.total, 2);

    // Filter by result
    const failed = handler.execute({ result: 'FAIL' });
    assert.equal(failed.total, 1);
    assert.equal(failed.items[0].id, 'qc-2');

    // Filter by SKU
    const rawItems = handler.execute({ sku: 'RAW-002' });
    assert.equal(rawItems.total, 1);

    // Pagination
    const page1 = handler.execute({ page: 1, limit: 1 });
    assert.equal(page1.items.length, 1);
    assert.equal(page1.total, 2);
  });

  it('GetInspectionByIdHandler retrieves inspection or returns not found', () => {
    const qualityRepo = createQualityRepository([sampleInspection], []);
    const handler = new GetInspectionByIdHandler(qualityRepo);

    const found = handler.execute('qc-init-1');
    assert.equal(found.isSuccess, true);
    if (found.isSuccess) {
      assert.equal(found.value.inspectionNo, 'INS-2026-001');
    }

    const missing = handler.execute('qc-missing');
    assert.equal(missing.isSuccess, false);
    if (!missing.isSuccess) {
      assert.equal(missing.error.code, 'NOT_FOUND_ERROR');
    }
  });

  it('ListNcrsHandler queries and filters NCRs', () => {
    const ncrs: NonConformanceReport[] = [
      sampleNcr,
      {
        ...sampleNcr,
        id: 'ncr-resolved-2',
        ncrNo: 'NCR-2026-002',
        status: 'RESOLVED',
        disposition: 'SCRAP',
      },
    ];
    const qualityRepo = createQualityRepository([], ncrs);
    const handler = new ListNcrsHandler(qualityRepo);

    const all = handler.execute({});
    assert.equal(all.total, 2);

    const openOnly = handler.execute({ status: 'OPEN' });
    assert.equal(openOnly.total, 1);
    assert.equal(openOnly.items[0].id, 'ncr-open-1');

    const resolvedOnly = handler.execute({ status: 'RESOLVED' });
    assert.equal(resolvedOnly.total, 1);
    assert.equal(resolvedOnly.items[0].id, 'ncr-resolved-2');
  });

  it('GetNcrByIdHandler retrieves NCR or returns not found', () => {
    const qualityRepo = createQualityRepository([], [sampleNcr]);
    const handler = new GetNcrByIdHandler(qualityRepo);

    const found = handler.execute('ncr-open-1');
    assert.equal(found.isSuccess, true);
    if (found.isSuccess) {
      assert.equal(found.value.ncrNo, 'NCR-2026-001');
    }

    const missing = handler.execute('ncr-missing');
    assert.equal(missing.isSuccess, false);
    if (!missing.isSuccess) {
      assert.equal(missing.error.code, 'NOT_FOUND_ERROR');
    }
  });

  it('ListOpenNcrsHandler lists and paginates open NCRs', () => {
    const qualityRepo = createQualityRepository([], [sampleNcr]);
    const handler = new ListOpenNcrsHandler(qualityRepo);

    const list = handler.execute({ page: 1, limit: 10 });
    assert.equal(list.total, 1);
    assert.equal(list.items[0].ncrNo, 'NCR-2026-001');
  });
});
