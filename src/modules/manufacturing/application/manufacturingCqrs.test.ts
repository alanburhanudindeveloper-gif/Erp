import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createWorkOrderRepository } from '../workOrderRepository';
import { PlanWorkOrderHandler } from './commands/planWorkOrderCommand';
import { CancelWorkOrderHandler } from './commands/cancelWorkOrderCommand';
import { GetWorkOrderByIdHandler } from './queries/getWorkOrderByIdQuery';
import { ListWorkOrdersHandler } from './queries/listWorkOrdersQuery';
import type { ProductionOrder, BillOfMaterials, Routing } from '../../../types';

describe('Manufacturing Application CQRS Handlers', () => {
  const sampleOrder: ProductionOrder = {
    id: 'mo-draft-1',
    orderNumber: 'MO-2026-DRAFT1',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Product A',
    targetQuantity: 100,
    goodQuantity: 0,
    scrapQuantity: 0,
    plantId: 'PLANT-01',
    plantName: 'Cikarang Plant',
    plannedStartDate: '2026-11-01',
    dueDate: '2026-11-05',
    status: 'DRAFT',
    priority: 'NORMAL',
    operations: [],
  } as unknown as ProductionOrder;

  const sampleBom: BillOfMaterials = {
    id: 'bom-1',
    code: 'BOM-001',
    revision: 'Rev.01',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Product A',
    baseQuantity: 1,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2027-12-31',
    bomType: 'STANDARD',
    status: 'ACTIVE',
    components: [
      {
        id: 'c-1',
        componentProductId: 'raw-1',
        componentSku: 'Material X',
        componentName: 'Material X',
        quantityPerUnit: 2,
        uom: 'KG',
        scrapPercentage: 0,
        unitCost: 10,
        operationSeq: 10,
      },
    ],
  };

  const sampleRouting: Routing = {
    id: 'rt-1',
    code: 'RT-001',
    revision: 'Rev.01',
    productId: 'prd-001',
    productSku: 'Product A',
    productName: 'Product A',
    status: 'ACTIVE',
    operations: [
      {
        id: 'op-1',
        sequence: 10,
        operationCode: 'OP-10',
        name: 'Cutting',
        workCenterId: 'wc-1',
        workCenterCode: 'WC-1',
        workCenterName: 'Cutting Center',
        setupTimeMinutes: 10,
        runTimeSecondsPerUnit: 30,
        queueMoveTimeMinutes: 5,
        instructions: 'Cut billet',
        laborHourlyRate: 20,
        machineHourlyRate: 40,
      },
    ],
  };

  it('PlanWorkOrderHandler transitions DRAFT to PLANNED and persists', () => {
    const repo = createWorkOrderRepository([sampleOrder]);
    const handler = new PlanWorkOrderHandler(repo);

    const result = handler.execute({
      orderId: 'mo-draft-1',
      bom: sampleBom,
      routing: sampleRouting,
      actor: 'PPIC Planner Alice',
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.status, 'PLANNED');
      assert.strictEqual(result.value.operations.length, 1);
      assert.strictEqual(repo.findById('mo-draft-1')?.status, 'PLANNED');
    }
  });

  it('CancelWorkOrderHandler cancels an order with reason', () => {
    const repo = createWorkOrderRepository([sampleOrder]);
    const handler = new CancelWorkOrderHandler(repo);

    const result = handler.execute({
      orderId: 'mo-draft-1',
      reason: 'Customer cancelled sales demand',
      actor: 'Manager Bob',
    });

    assert.strictEqual(result.isSuccess, true);
    if (result.isSuccess) {
      assert.strictEqual(result.value.status, 'CANCELLED');
      assert.strictEqual(repo.findById('mo-draft-1')?.status, 'CANCELLED');
    }
  });

  it('GetWorkOrderByIdHandler returns order or NotFoundError', () => {
    const repo = createWorkOrderRepository([sampleOrder]);
    const handler = new GetWorkOrderByIdHandler(repo);

    const found = handler.execute({ orderId: 'mo-draft-1' });
    assert.strictEqual(found.isSuccess, true);

    const notFound = handler.execute({ orderId: 'mo-non-existent' });
    assert.strictEqual(notFound.isFailure, true);
  });

  it('ListWorkOrdersHandler supports filtering and pagination', () => {
    const repo = createWorkOrderRepository([sampleOrder]);
    const handler = new ListWorkOrdersHandler(repo);

    const res = handler.execute({ page: 1, limit: 10, status: 'DRAFT' });
    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.items[0].orderNumber, 'MO-2026-DRAFT1');

    const emptyRes = handler.execute({ status: 'COMPLETED' });
    assert.strictEqual(emptyRes.total, 0);
  });
});
