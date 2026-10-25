import test from 'node:test';
import assert from 'node:assert/strict';

import { createMaterialRequest, pickMaterialRequest } from './materialRequestLifecycleService.ts';

test('createMaterialRequest assigns a request number and PENDING item statuses', () => {
  const request = createMaterialRequest({
    sourceType: 'PRODUCTION_ORDER',
    sourceReferenceId: 'MO-2026-00124',
    requester: 'Rina',
    department: 'Machining',
    requiredDate: '2026-10-28',
    destinationLine: 'Line 1 - Staging Bay',
    priority: 'HIGH',
    productId: 'prd-001',
    productSku: 'MAT-001',
    items: [
      {
        productId: 'prd-001',
        sku: 'MAT-001',
        name: 'Steel Rod',
        requestedQuantity: 40,
        pickedQuantity: 0,
        deliveredQuantity: 0,
        uom: 'PCS',
        fromWarehouse: 'MAIN-WH-STAGING',
        toLocation: 'Line 1 - Staging Bay',
        status: 'PENDING',
      },
    ],
  });

  assert.equal(request.status, 'SUBMITTED');
  assert.match(request.requestNumber, /^MR-2026-/);
  assert.equal(request.items[0].status, 'PENDING');
  assert.ok(request.items[0].id.length > 0);
});

test('pickMaterialRequest moves items to PICKED and marks the request READY', () => {
  const request = createMaterialRequest({
    sourceType: 'PRODUCTION_ORDER',
    sourceReferenceId: 'MO-2026-00124',
    requester: 'Rina',
    department: 'Machining',
    requiredDate: '2026-10-28',
    destinationLine: 'Line 1 - Staging Bay',
    priority: 'HIGH',
    productId: 'prd-001',
    productSku: 'MAT-001',
    items: [
      {
        productId: 'prd-001',
        sku: 'MAT-001',
        name: 'Steel Rod',
        requestedQuantity: 40,
        pickedQuantity: 0,
        deliveredQuantity: 0,
        uom: 'PCS',
        fromWarehouse: 'MAIN-WH-STAGING',
        toLocation: 'Line 1 - Staging Bay',
        status: 'PENDING',
      },
    ],
  });

  const picked = pickMaterialRequest(request, 'Warehouse A');

  assert.equal(picked.status, 'READY');
  assert.equal(picked.pickedBy, 'Warehouse A');
  assert.equal(picked.items[0].status, 'PICKED');
  assert.equal(picked.items[0].pickedQuantity, 40);
});
