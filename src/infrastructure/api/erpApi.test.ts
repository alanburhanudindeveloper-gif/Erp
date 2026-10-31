import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { erpRouter } from './erpRouter';
import { ErpApiClient } from './erpApiClient';
import { erpRepositories } from '../../app/composition/repositories';
import { erpApplication } from '../../app/composition/dependencies';
import { saveLegacyErpState, loadLegacyErpState, LEGACY_ERP_STORAGE_KEY } from '../../lib/persistence/erpStorageAdapter';

test('ERP Server Architecture: Repository Identity - Single Authoritative Instance', () => {
  // 1. Verify that composition root repository and application handlers share the identical reference
  const initialCount = erpRepositories.procurement.listPurchaseRequisitions().length;
  const cqrsResult = erpApplication.procurement.listPurchaseRequisitions.execute({ page: 1, limit: 100 });

  assert.equal(cqrsResult.total, initialCount, 'CQRS query must read directly from authoritative procurement repository');
});

test('ERP Server API End-to-End: Command, Query, and Segregation of Duties Enforcement', async () => {
  // Build an ephemeral Express test server hosting the authoritative erpRouter
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;
  const client = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Supervisor' });

  try {
    // 1. API Query: list current purchase requisitions
    const initialListing = await client.procurement.listPurchaseRequisitions({ page: 1, limit: 100 });
    assert.ok(Array.isArray(initialListing.items), 'Query must return list of PR items');
    const startCount = initialListing.total;

    // 2. API Command: create a new Purchase Requisition via HTTP POST
    const createdPR = await client.procurement.createPurchaseRequisition({
      requesterId: 'usr-buyer-88',
      requesterName: 'Ahmad Dahlan',
      department: 'Heavy Machining',
      requiredDate: '2026-12-01',
      reason: 'Urgent restocking of raw carbide inserts',
      plantId: 'PLANT-01',
      items: [
        {
          id: `pri-test-${Date.now()}`,
          productId: 'prd-001',
          sku: 'RAW-CRB-01',
          name: 'Carbide Insert CNC-T3',
          quantity: 250,
          uom: 'PCS',
          estimatedPrice: 45000,
          totalCost: 11250000,
        },
      ],
    });

    assert.ok(createdPR.id, 'Created PR must have an authoritative ID');
    assert.equal(createdPR.status, 'PENDING_APPROVAL');
    assert.equal(createdPR.requesterName, 'Ahmad Dahlan');

    // 3. Round-Trip Verification: subsequent query must immediately reflect the newly persisted PR
    const updatedListing = await client.procurement.listPurchaseRequisitions({ page: 1, limit: 100 });
    assert.equal(updatedListing.total, startCount + 1, 'Total PR count must increment by 1 in server repository');
    const persisted = updatedListing.items.find((p) => p.id === createdPR.id);
    assert.ok(persisted, 'Newly created PR must be present in server query response');

    // Also verify repository directly holds this exact record (single source of truth)
    const directFromRepo = erpRepositories.procurement.findPurchaseRequisitionById(createdPR.id);
    assert.ok(directFromRepo, 'Record must be queryable directly from authoritative repository instance');
    assert.equal(directFromRepo.id, createdPR.id);

    // 4. Invariant Enforcement via API: Requester cannot self-approve (Segregation of Duties)
    client.setRole('Manager');
    await assert.rejects(
      async () => {
        await client.procurement.approvePurchaseRequisition(createdPR.id, {
          actorName: 'Ahmad Dahlan', // Requester trying to self-approve
          actorRole: 'Manager',
        });
      },
      /Segregation of Duties Violation/i,
      'API must reject self-approval attempt by the original requester'
    );

    // 5. Valid Approval by independent authorized manager
    client.setRole('Manager');
    const approvedPR = await client.procurement.approvePurchaseRequisition(createdPR.id, {
      actorName: 'Ir. Agus Wijaya',
      actorRole: 'Manager',
    });

    assert.equal(approvedPR.status, 'APPROVED');
    assert.equal(approvedPR.approvedBy, 'Ir. Agus Wijaya');

    // 6. Direct repository verification post-approval
    const updatedInRepo = erpRepositories.procurement.findPurchaseRequisitionById(createdPR.id);
    assert.equal(updatedInRepo?.status, 'APPROVED', 'Authoritative repository must store APPROVED state');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('ERP Storage Sanitation: Authoritative Procurement Data Stripped From LocalStorage', () => {
  // Simulate setting legacy state with authoritative procurement collections
  const fakeStateWithProcurement = {
    selectedPlant: 'PLANT-01',
    purchaseRequisitions: [{ id: 'stale-pr-999', prNumber: 'PR-STALE-999' }],
    purchaseOrders: [{ id: 'stale-po-999', poNumber: 'PO-STALE-999' }],
    goodsReceiptNotes: [{ id: 'stale-grn-999' }],
    products: [{ id: 'prd-001', sku: 'TEST-SKU' }],
  };

  saveLegacyErpState(fakeStateWithProcurement);

  // Read back state from storage
  const restoredState = loadLegacyErpState();
  assert.ok(restoredState, 'State must load');
  assert.equal(restoredState.purchaseRequisitions, undefined, 'purchaseRequisitions must NOT be restored from localStorage');
  assert.equal(restoredState.purchaseOrders, undefined, 'purchaseOrders must NOT be restored from localStorage');
  assert.equal(restoredState.goodsReceiptNotes, undefined, 'goodsReceiptNotes must NOT be restored from localStorage');
  assert.ok(restoredState.products, 'Non-migrated entities may temporarily remain until their phase');
});

test('ERP Server HTTP API: Rejects unauthenticated requests and ignores spoofed headers', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  try {
    // 1. Unauthenticated request without Bearer token must fail with 401
    const unauthRes = await fetch(`http://localhost:${port}/api/erp/procurement/purchase-requisitions`);
    assert.equal(unauthRes.status, 401, 'Request without token must be rejected with 401');
    const unauthBody = await unauthRes.json();
    assert.equal(unauthBody.code, 'MISSING_TOKEN');

    // 2. Request with forged X-Erp-Role header but NO token must STILL be rejected with 401
    const spoofUnauthRes = await fetch(`http://localhost:${port}/api/erp/procurement/purchase-requisitions`, {
      headers: {
        'x-erp-role': 'Plant Manager',
        'x-erp-user-id': 'usr-admin-01',
      },
    });
    assert.equal(spoofUnauthRes.status, 401, 'Spoofed header without Bearer token must be rejected with 401');

    // 3. Request with malformed token must fail with 401
    const malformedRes = await fetch(`http://localhost:${port}/api/erp/procurement/purchase-requisitions`, {
      headers: {
        Authorization: 'Bearer invalid.token.payload',
      },
    });
    assert.equal(malformedRes.status, 401, 'Malformed token must return 401');

    // 4. Client with token can query /auth/me to verify server-verified identity
    const client = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Supervisor' });
    const meRes = await fetch(`http://localhost:${port}/api/erp/auth/me`, {
      headers: {
        Authorization: `Bearer ${client.getToken()}`,
        'x-erp-role': 'Plant Manager', // Spoof attempt
      },
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.role, 'Supervisor', 'Server verified session must retain Supervisor, ignoring spoofed header');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
