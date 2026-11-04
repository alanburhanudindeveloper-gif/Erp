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

test('ERP Storage Sanitation: Authoritative Procurement & Manufacturing Data Stripped From LocalStorage', () => {
  // Simulate setting legacy state with authoritative procurement and manufacturing collections
  const fakeState = {
    selectedPlant: 'PLANT-01',
    purchaseRequisitions: [{ id: 'stale-pr-999', prNumber: 'PR-STALE-999' }],
    purchaseOrders: [{ id: 'stale-po-999', poNumber: 'PO-STALE-999' }],
    goodsReceiptNotes: [{ id: 'stale-grn-999' }],
    productionOrders: [{ id: 'stale-mo-999', orderNumber: 'MO-STALE-999' }],
    products: [{ id: 'prd-001', sku: 'TEST-SKU' }],
  };

  saveLegacyErpState(fakeState);

  // Read back state from storage
  const restoredState = loadLegacyErpState();
  assert.ok(restoredState, 'State must load');
  assert.equal(restoredState.purchaseRequisitions, undefined, 'purchaseRequisitions must NOT be restored from localStorage');
  assert.equal(restoredState.purchaseOrders, undefined, 'purchaseOrders must NOT be restored from localStorage');
  assert.equal(restoredState.goodsReceiptNotes, undefined, 'goodsReceiptNotes must NOT be restored from localStorage');
  assert.equal(restoredState.productionOrders, undefined, 'productionOrders must NOT be restored from localStorage');
  assert.ok(restoredState.products, 'Non-migrated entities may temporarily remain until their phase');
});

test('ERP Server API End-to-End: Manufacturing Work Order CQRS Lifecycle & Authorization', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;
  const client = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Production Manager' });

  try {
    // 1. Query initial work orders list
    const initialList = await client.manufacturing.listWorkOrders({ page: 1, limit: 10 });
    assert.ok(Array.isArray(initialList.orders), 'Orders must be returned as an array');
    const initialTotal = initialList.total;

    // 2. Command: Create production order via HTTP POST
    const createdOrder = await client.manufacturing.createProductionOrder({
      productId: 'prd-001',
      quantity: 50,
      dueDate: '2026-12-15',
      plantId: 'PLANT-01',
      actorName: 'Budi Santoso',
    });

    assert.ok(createdOrder.id, 'Created order must have an authoritative ID');
    assert.equal(createdOrder.status, 'PLANNED');
    assert.equal(createdOrder.targetQuantity, 50);

    // 3. Query single order by ID
    const fetchedOrder = await client.manufacturing.getWorkOrder(createdOrder.id);
    assert.equal(fetchedOrder.id, createdOrder.id);
    assert.equal(fetchedOrder.productSku, createdOrder.productSku);

    // 4. Verification that count incremented
    const afterCreateList = await client.manufacturing.listWorkOrders({ page: 1, limit: 10 });
    assert.equal(afterCreateList.total, initialTotal + 1, 'Total orders must increment by 1');

    // 5. Command: Release production order
    const released = await client.manufacturing.releaseWorkOrder(createdOrder.id, 'Standard schedule release', {
      actorName: 'Budi Santoso',
      actorRole: 'Production Manager',
    });
    assert.equal(released.status, 'RELEASED');

    // 6. Command: Start operation 1
    const firstOp = released.operations[0];
    assert.ok(firstOp, 'Order must have operations');
    const started = await client.manufacturing.startOperation(
      createdOrder.id,
      firstOp.sequence,
      'Op Joko'
    );
    const updatedOp = started.operations.find((op) => op.sequence === firstOp.sequence);
    assert.equal(updatedOp?.status, 'IN_PROGRESS');
    assert.equal(started.status, 'IN_PROGRESS');

    // 7. Command: Complete operation 1
    const completedOp = await client.manufacturing.completeOperation(
      createdOrder.id,
      firstOp.sequence,
      { actorName: 'Budi Santoso', actorRole: 'Production Manager' }
    );
    const opAfterComplete = completedOp.operations.find((op) => op.sequence === firstOp.sequence);
    assert.equal(opAfterComplete?.status, 'COMPLETED');

    // 8. Command: Close production order
    const closed = await client.manufacturing.closeWorkOrder(createdOrder.id, {
      actorName: 'Budi Santoso',
      actorRole: 'Production Manager',
    });
    assert.equal(closed.status, 'CLOSED');

    // 9. Role-based authorization: unauthorized role cannot release an order
    const viewerClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Viewer' });
    await assert.rejects(
      async () => {
        await viewerClient.manufacturing.releaseWorkOrder(createdOrder.id);
      },
      /is not allowed|FORBIDDEN|Access denied/i,
      'Viewer role must not be permitted to release work orders'
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
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
    const token = await client.acquireDevToken('Supervisor');
    assert.ok(token, 'Client must acquire valid token');
    const meRes = await fetch(`http://localhost:${port}/api/erp/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

test('ERP Server HTTP API: Material Requests End-to-End CQRS & Lifecycle', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const supervisorClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Supervisor' });

  try {
    // 1. Create a Material Request
    const createdMR = await supervisorClient.manufacturing.createMaterialRequest({
      sourceType: 'PRODUCTION_ORDER',
      sourceReferenceId: 'MO-2026-TEST-MR',
      productSku: 'PROD-FG-99',
      requester: 'Supervisor Jane',
      destinationLine: 'Cell 3 - Staging Bay',
      priority: 'HIGH',
      items: [
        {
          sku: 'RAW-ALUM-01',
          name: 'Aluminum Bar Stock',
          requestedQuantity: 80,
          uom: 'KG',
          fromWarehouse: 'WH-MAIN-A1',
        },
      ],
    });

    assert.ok(createdMR.id);
    assert.equal(createdMR.status, 'SUBMITTED');
    assert.equal(createdMR.items.length, 1);
    assert.equal(createdMR.items[0].requestedQuantity, 80);

    // 2. Query Material Requests
    const listing = await supervisorClient.manufacturing.listMaterialRequests({
      sourceType: 'PRODUCTION_ORDER',
    });
    assert.ok(listing.requests.length >= 1);
    const found = listing.requests.find((r) => r.id === createdMR.id);
    assert.ok(found);
    assert.equal(found?.destinationLine, 'Cell 3 - Staging Bay');

    // 3. Pick Material Request
    const pickedMR = await supervisorClient.manufacturing.pickMaterialRequest(createdMR.id, {
      pickedBy: 'Warehouse Tech John',
    });
    assert.equal(pickedMR.status, 'READY');
    assert.equal(pickedMR.items[0].pickedQuantity, 80);

    // 4. Deliver Material Request to Line
    const deliveredMR = await supervisorClient.manufacturing.deliverMaterialRequest(createdMR.id, {
      deliveredBy: 'Logistics Courier Mike',
      destinationLine: 'Cell 3 - Staging Bay',
    });
    assert.equal(deliveredMR.status, 'DELIVERED');
    assert.equal(deliveredMR.deliveredBy, 'Logistics Courier Mike');
    assert.equal(deliveredMR.items[0].deliveredQuantity, 80);

    // 5. RBAC check: Unauthorized role (Viewer) cannot create a Material Request
    const viewerClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Viewer' });
    await assert.rejects(
      async () => {
        await viewerClient.manufacturing.createMaterialRequest({
          sourceType: 'PRODUCTION_ORDER',
          sourceReferenceId: 'MO-ILLEGAL',
          destinationLine: 'Cell 1',
          items: [{ sku: 'RAW-01', name: 'Raw', requestedQuantity: 10, uom: 'PCS' }],
        });
      },
      /is not allowed|FORBIDDEN|Access denied/i,
      'Viewer role must not be permitted to create material requests'
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('ERP Storage Adapter: Authoritative Material Requests, Production Orders, Stock Movements, Inspections, and NCRs are sanitized from localStorage', () => {
  const dummyState = {
    productionOrders: [{ id: 'mo-local-fake', orderNumber: 'MO-FAKE' }],
    materialRequests: [{ id: 'mr-local-fake', requestNumber: 'MR-FAKE' }],
    purchaseRequisitions: [{ id: 'pr-local-fake', prNumber: 'PR-FAKE' }],
    stockMovements: [{ id: 'mov-local-fake', movementNo: 'MOV-FAKE' }],
    inspections: [{ id: 'qc-local-fake', inspectionNo: 'INS-FAKE' }],
    ncrs: [{ id: 'ncr-local-fake', ncrNo: 'NCR-FAKE' }],
    otherField: 'preserved_value',
  };

  saveLegacyErpState(dummyState);
  const loaded = loadLegacyErpState();

  assert.ok(loaded);
  assert.equal((loaded as any).otherField, 'preserved_value');
  assert.equal((loaded as any).productionOrders, undefined, 'productionOrders must be stripped from local storage');
  assert.equal((loaded as any).materialRequests, undefined, 'materialRequests must be stripped from local storage');
  assert.equal((loaded as any).purchaseRequisitions, undefined, 'purchaseRequisitions must be stripped from local storage');
  assert.equal((loaded as any).stockMovements, undefined, 'stockMovements must be stripped from local storage');
  assert.equal((loaded as any).inspections, undefined, 'inspections must be stripped from local storage');
  assert.equal((loaded as any).ncrs, undefined, 'ncrs must be stripped from local storage');
});

test('ERP Server API End-to-End: Inventory Balances, Movements, Transfers, and Reversals', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const supervisorClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Supervisor' });

  try {
    // 1. Query Balances
    const balances = await supervisorClient.inventory.listBalances({ page: 1, limit: 10 });
    assert.ok(Array.isArray(balances.items), 'Balances items must be an array');
    assert.ok(balances.total >= 0);

    // 2. Query Movements
    const movements = await supervisorClient.inventory.listMovements({ page: 1, limit: 10 });
    assert.ok(Array.isArray(movements.items), 'Movements items must be an array');
    const initialMovementCount = movements.total;

    // 3. Transfer Stock
    const firstProduct = erpRepositories.inventory.listProducts()[0];
    assert.ok(firstProduct, 'Product must exist for transfer test');

    const transferResult = await supervisorClient.inventory.transferStock({
      productId: firstProduct.id,
      sku: firstProduct.sku,
      quantity: 5,
      uom: firstProduct.baseUom,
      fromBucket: 'AVAILABLE',
      toBucket: 'HOLD',
      fromLocation: 'MAIN-WH-A1',
      toLocation: 'HOLD-INSPECT',
      lotNumber: 'LOT-TEST-01',
      sourceDocument: 'TR-DOC-001',
      reason: 'Routine quality quarantine check',
      actor: 'Warehouse Supervisor Budi',
      role: 'Supervisor',
    });

    assert.ok(transferResult.id);
    assert.equal(transferResult.sku, firstProduct.sku);
    assert.equal(transferResult.stockBucket, 'HOLD');
    assert.equal(transferResult.quantity, 5);

    // Verify movements count incremented
    const afterTransferMovements = await supervisorClient.inventory.listMovements({ page: 1, limit: 10 });
    assert.equal(afterTransferMovements.total, initialMovementCount + 1);

    // 4. Reverse Movement
    const reverseResult = await supervisorClient.inventory.reverseMovement(transferResult.id, {
      reason: 'Reversing quarantine transfer test',
      actor: 'Warehouse Supervisor Budi',
      role: 'Supervisor',
    });
    assert.ok(reverseResult.id);
    assert.equal(reverseResult.movementType, 'REVERSAL');

    // 5. Query single movement by ID
    const singleMovement = await supervisorClient.inventory.getMovementById(transferResult.id);
    assert.equal(singleMovement.id, transferResult.id);

    // 6. Query single product balance
    const singleBalance = await supervisorClient.inventory.getBalanceBySku(firstProduct.sku);
    assert.equal(typeof singleBalance.available, 'number');
    assert.equal(typeof singleBalance.hold, 'number');
    assert.equal(typeof singleBalance.totalPhysicalOnHand, 'number');

    // 7. Role-Based Access Control: Viewer role cannot transfer stock
    const viewerClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Viewer' });
    await assert.rejects(
      async () => {
        await viewerClient.inventory.transferStock({
          productId: firstProduct.id,
          sku: firstProduct.sku,
          quantity: 1,
          uom: firstProduct.baseUom,
          fromBucket: 'AVAILABLE',
          toBucket: 'HOLD',
          fromLocation: 'LOC-1',
          toLocation: 'LOC-2',
          lotNumber: 'LOT-TEST-01',
          sourceDocument: 'TR-DOC-VIEWER',
          reason: 'Unauthorized test',
          actor: 'Viewer User',
          role: 'Viewer',
        });
      },
      /is not allowed|FORBIDDEN|Access denied/i,
      'Viewer role must not be permitted to transfer stock'
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('ERP Server API End-to-End: Quality Inspections, NCRs, Evaluations, Release, and RBAC', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const qualityLeadClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Supervisor' });
  const viewerClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Viewer' });

  try {
    // 1. Query initial inspections list
    const initialInspections = await qualityLeadClient.quality.listInspections({ page: 1, limit: 10 });
    assert.ok(Array.isArray(initialInspections.items), 'Inspections items must be an array');
    const startCount = initialInspections.total;

    // 2. Evaluate an inspection with an out-of-tolerance defect (triggers NCR requirement)
    const evalResult = await qualityLeadClient.quality.evaluateInspection({
      sourceType: 'PRODUCTION_ORDER',
      sourceRef: 'MO-2026-EVAL-API',
      productId: 'prd-001',
      sku: 'FG-001',
      productName: 'Flow Sensor Unit',
      lotNumber: 'LOT-FAIL-API-01',
      operationName: 'Final Assembly Test',
      sampleSize: 10,
      defectsCount: 3,
      maxAllowedDefects: 0,
      characteristic: 'Pressure Tolerance',
      specification: '50 PSI ± 1',
      measuredValue: 55,
      lowerTolerance: 49,
      upperTolerance: 51,
      inspector: 'Supervisor Hendra',
    });

    assert.ok(evalResult.inspection.id);
    assert.equal(evalResult.inspection.result, 'FAIL');
    assert.equal(evalResult.ncrRequired, true);

    // 3. Query inspection by ID
    const singleInspection = await qualityLeadClient.quality.getInspection(evalResult.inspection.id);
    assert.equal(singleInspection.id, evalResult.inspection.id);
    assert.equal(singleInspection.sku, 'FG-001');

    // 4. Query updated inspections list
    const updatedInspections = await qualityLeadClient.quality.listInspections({ page: 1, limit: 10 });
    assert.equal(updatedInspections.total, startCount + 1);

    // 5. Release / Reject inspection disposition via API
    const releaseResult = await qualityLeadClient.quality.releaseInspection(evalResult.inspection.id, {
      decision: 'FAIL',
      disposition: 'REJECT',
      notes: 'Confirmed pressure sensor casing crack, reject to quarantine ledger',
      actor: 'Supervisor Hendra',
      role: 'Supervisor',
    });

    assert.equal(releaseResult.inspection.result, 'FAIL');
    assert.equal(releaseResult.inspection.disposition, 'REJECT');
    assert.ok(releaseResult.ncr);
    assert.ok(releaseResult.movement);

    // 6. Query NCRs list
    const ncrsList = await qualityLeadClient.quality.listNcrs({ status: 'OPEN' });
    assert.ok(ncrsList.total >= 1);
    const createdNcr = ncrsList.items.find((n) => n.id === releaseResult.ncr?.id);
    assert.ok(createdNcr);

    // 7. Get single NCR by ID
    const singleNcr = await qualityLeadClient.quality.getNcr(createdNcr.id);
    assert.equal(singleNcr.id, createdNcr.id);
    assert.equal(singleNcr.status, 'OPEN');

    // 8. Resolve NCR
    const resolvedNcrResult = await qualityLeadClient.quality.resolveNcr(createdNcr.id, {
      disposition: 'SCRAP',
      rootCause: 'Defective brass casting mold wear',
      resolver: 'Supervisor Hendra',
    });
    assert.equal(resolvedNcrResult.resolvedNcr.status, 'RESOLVED');

    // Verify NCR is no longer OPEN
    const afterResolveNcr = await qualityLeadClient.quality.getNcr(createdNcr.id);
    assert.equal(afterResolveNcr.status, 'RESOLVED');

    // 9. Role-Based Access Control: Viewer role cannot evaluate or release inspections
    await assert.rejects(
      async () => {
        await viewerClient.quality.evaluateInspection({
          sourceType: 'PRODUCTION_ORDER',
          sourceRef: 'MO-VIEWER',
          productId: 'prd-001',
          sku: 'FG-001',
          productName: 'Flow Sensor Unit',
          lotNumber: 'LOT-V1',
          operationName: 'Op1',
          sampleSize: 1,
          defectsCount: 0,
          maxAllowedDefects: 0,
          characteristic: 'Test',
          specification: 'Spec',
          inspector: 'Viewer',
        });
      },
      /is not allowed|FORBIDDEN|Access denied/i,
      'Viewer role must not be permitted to evaluate inspections'
    );

    await assert.rejects(
      async () => {
        await viewerClient.quality.releaseInspection(evalResult.inspection.id, {
          decision: 'PASS',
          disposition: 'UNRESTRICTED',
          actor: 'Viewer User',
        });
      },
      /is not allowed|FORBIDDEN|Access denied/i,
      'Viewer role must not be permitted to release inspections'
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});


