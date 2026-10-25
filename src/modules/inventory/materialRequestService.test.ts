import test from 'node:test';
import assert from 'node:assert/strict';

import type { MaterialRequest } from '../../types';
import { evaluateMaterialRequestDelivery } from './materialRequestService.ts';

const materialRequest: MaterialRequest = {
  id: 'mr-1',
  requestNumber: 'MR-2026-000001',
  sourceType: 'PRODUCTION_ORDER',
  sourceReferenceId: 'MO-2026-00124',
  productId: 'prd-001',
  productSku: 'FG-001',
  requester: 'Operator A',
  department: 'Manufacturing',
  requiredDate: '2026-10-27',
  destinationLine: 'Line 1 - Staging Bay',
  priority: 'HIGH',
  status: 'READY',
  items: [
    {
      id: 'mri-1',
      productId: 'raw-001',
      sku: 'MAT-001',
      name: 'Raw Material A',
      requestedQuantity: 75,
      pickedQuantity: 75,
      deliveredQuantity: 0,
      uom: 'KG',
      fromWarehouse: 'MAIN-WH-STAGING',
      toLocation: 'Line 1 - Staging Bay',
      status: 'PICKED',
    },
  ],
};

test('material request delivery posts WIP movement and marks the request as delivered', () => {
  const result = evaluateMaterialRequestDelivery({
    request: materialRequest,
    deliveredBy: 'Warehouse Clerk',
    receivedBy: 'Line Supervisor',
    lineLocation: 'Line 1 - Staging Bay',
    timestamp: '2026-10-26 08:45',
  });

  assert.equal(result.allowed, true);
  assert.equal(result.request.status, 'DELIVERED');
  assert.equal(result.stockMovements.length, 1);
  assert.equal(result.stockMovements[0].stockBucket, 'WIP');
  assert.equal(result.auditLog?.decision, 'EXECUTED');
});

test('material request delivery rejects empty or invalid request payloads', () => {
  const result = evaluateMaterialRequestDelivery({
    request: { ...materialRequest, items: [] },
    deliveredBy: 'Warehouse Clerk',
    receivedBy: 'Line Supervisor',
    lineLocation: 'Line 1 - Staging Bay',
    timestamp: '2026-10-26 08:50',
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /at least one|invalid/i);
});
