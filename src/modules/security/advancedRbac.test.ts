import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import {
  authorizationEngine,
  AuthorizationEngine,
  permissionRegistry,
  roleRegistry,
  RoleRegistry,
  securityAuditLogger,
  createPermission,
  formatPermissionId,
  createDevToken,
  requireErpAuth,
  toSecurityUser,
  type SecurityUser,
} from './index';
import { QUALITY_PERMISSIONS } from '../quality/security/qualityPermissions';
import { erpRouter } from '../../infrastructure/api/erpRouter';
import { ErpApiClient } from '../../infrastructure/api/erpApiClient';
import { processApprovalDecision, createApprovalTransaction } from '../workflow/workflowMatrixService';

// -------------------------------------------------------------
// 1. NO PERMISSION -> DENIED (DENY BY DEFAULT)
// -------------------------------------------------------------
test('Advanced RBAC: Deny by default - unauthenticated or permissionless users are denied', () => {
  // Unauthenticated caller
  const anonDecision = authorizationEngine.can(null, QUALITY_PERMISSIONS.INSPECTION_READ);
  assert.equal(anonDecision.allowed, false);
  assert.equal(anonDecision.code, 'DENIED_UNAUTHENTICATED');

  // Authenticated user with no permissions
  const emptyUser: SecurityUser = {
    userId: 'usr-guest-01',
    roles: [],
    organizationId: 'org-kranex',
    directPermissions: [],
  };
  const emptyDecision = authorizationEngine.can(emptyUser, QUALITY_PERMISSIONS.INSPECTION_READ);
  assert.equal(emptyDecision.allowed, false);
  assert.equal(emptyDecision.code, 'DENIED_UNAUTHENTICATED');

  // User with role that lacks the requested permission
  const viewerUser: SecurityUser = {
    userId: 'usr-viewer-01',
    roles: ['Viewer'],
    organizationId: 'org-kranex',
  };
  const deniedDecision = authorizationEngine.can(viewerUser, QUALITY_PERMISSIONS.INSPECTION_RELEASE);
  assert.equal(deniedDecision.allowed, false);
  assert.equal(deniedDecision.code, 'DENIED_NO_PERMISSION');
  assert.match(deniedDecision.reason || '', /does not hold permission/i);
});

// -------------------------------------------------------------
// 2. REQUIRED PERMISSION -> ALLOWED
// -------------------------------------------------------------
test('Advanced RBAC: Required permission granted through role is allowed', () => {
  const qualityLead: SecurityUser = {
    userId: 'usr-ql-01',
    roles: ['Quality Lead'],
    organizationId: 'org-kranex',
  };

  const decisionRelease = authorizationEngine.can(qualityLead, QUALITY_PERMISSIONS.INSPECTION_RELEASE);
  assert.equal(decisionRelease.allowed, true);
  assert.equal(decisionRelease.code, 'GRANTED');

  const decisionResolve = authorizationEngine.can(qualityLead, QUALITY_PERMISSIONS.NCR_RESOLVE);
  assert.equal(decisionResolve.allowed, true);
  assert.equal(decisionResolve.code, 'GRANTED');

  const inspector: SecurityUser = {
    userId: 'usr-insp-01',
    roles: ['Inspector'],
    organizationId: 'org-kranex',
  };

  const decisionEvaluate = authorizationEngine.can(inspector, QUALITY_PERMISSIONS.INSPECTION_EVALUATE);
  assert.equal(decisionEvaluate.allowed, true);
  assert.equal(decisionEvaluate.code, 'GRANTED');

  // Inspector can evaluate, but CANNOT release
  const decisionInspectorRelease = authorizationEngine.can(inspector, QUALITY_PERMISSIONS.INSPECTION_RELEASE);
  assert.equal(decisionInspectorRelease.allowed, false);
  assert.equal(decisionInspectorRelease.code, 'DENIED_NO_PERMISSION');
});

// -------------------------------------------------------------
// 3. MULTIPLE ROLES COMBINE CORRECTLY
// -------------------------------------------------------------
test('Advanced RBAC: Multiple roles combine permissions additively', () => {
  // A hybrid user who is both an Operator (can issue stock) and an Inspector (can evaluate inspections)
  const hybridUser: SecurityUser = {
    userId: 'usr-hybrid-01',
    roles: ['Operator', 'Inspector'],
    organizationId: 'org-kranex',
  };

  // Granted via Inspector
  assert.equal(authorizationEngine.can(hybridUser, 'quality.inspection.evaluate').allowed, true);
  // Granted via Operator
  assert.equal(authorizationEngine.can(hybridUser, 'inventory.stock.issue').allowed, true);
  // Neither role grants release -> denied
  assert.equal(authorizationEngine.can(hybridUser, 'quality.inspection.release').allowed, false);
});

// -------------------------------------------------------------
// 4. UNKNOWN PERMISSION -> DENIED
// -------------------------------------------------------------
test('Advanced RBAC: Unknown or unregistered permission is denied by default', () => {
  const plantManager: SecurityUser = {
    userId: 'usr-pm-01',
    roles: ['Plant Manager'],
    organizationId: 'org-kranex',
  };

  const decision = authorizationEngine.can(plantManager, 'alien.module.teleport');
  assert.equal(decision.allowed, false);
  assert.equal(decision.code, 'DENIED_NO_PERMISSION');
});

// -------------------------------------------------------------
// 5. CLIENT-PROVIDED ROLE CANNOT GRANT AUTHORIZATION (ANTI-SPOOFING)
// -------------------------------------------------------------
test('Advanced RBAC: Client-provided role header cannot grant authorization', () => {
  const operatorToken = createDevToken('Operator', 'usr-op-spoof', 'org-1');

  // Attacker provides valid Operator token but sends spoofed header attempting to become Plant Manager
  const spoofedReq = {
    headers: {
      authorization: `Bearer ${operatorToken}`,
      'x-erp-role': 'Plant Manager',
      'X-Erp-Role': 'Plant Manager',
    },
  };

  // Evaluated against a route requiring quality.inspection.release
  const middleware = requireErpAuth({ requiredPermission: QUALITY_PERMISSIONS.INSPECTION_RELEASE });

  let statusCode = 0;
  let responsePayload: any = null;
  let nextCalled = false;

  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (p: any) => {
          responsePayload = p;
          return p;
        },
      };
    },
    json: (p: any) => {
      responsePayload = p;
      return p;
    },
  };

  middleware(spoofedReq, mockRes as any, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, 'Spoofing caller must NOT reach the handler');
  assert.equal(statusCode, 403, 'Must return HTTP 403 Forbidden');
  assert.equal(responsePayload?.code, 'FORBIDDEN_PERMISSION');
});

// -------------------------------------------------------------
// 6. BACKEND REJECTS UNAUTHORIZED API OPERATION
// -------------------------------------------------------------
test('Advanced RBAC: Backend rejects unauthorized API operation with 403', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

  const viewerClient = new ErpApiClient({ baseUrl: `http://localhost:${port}`, defaultRole: 'Viewer' });

  try {
    // Viewer lacks quality.inspection.evaluate
    await assert.rejects(
      async () => {
        await viewerClient.quality.evaluateInspection({
          sourceType: 'PRODUCTION_ORDER',
          sourceRef: 'MO-TEST-RBAC',
          productId: 'prd-01',
          sku: 'SKU-01',
          productName: 'Test Prod',
          lotNumber: 'LOT-01',
          operationName: 'Op1',
          sampleSize: 5,
          defectsCount: 0,
          maxAllowedDefects: 0,
          characteristic: 'Tensile Strength',
          specification: '500 MPa',
          inspector: 'Viewer Persona',
        });
      },
      /is not allowed|FORBIDDEN_PERMISSION|does not hold permission/i
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

// -------------------------------------------------------------
// 7. FRONTEND HIDING A BUTTON DOES NOT AFFECT BACKEND AUTHORIZATION
// -------------------------------------------------------------
test('Advanced RBAC: Frontend UI state does not weaken backend authorization boundary', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

  // Even if a malicious client constructs raw HTTP POST to release endpoint
  const operatorToken = createDevToken('Operator', 'usr-op-bypass', 'org-1');

  try {
    const rawResponse = await fetch(`http://localhost:${port}/api/erp/quality/inspections/ins-001/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        decision: 'PASS',
        disposition: 'UNRESTRICTED',
      }),
    });

    assert.equal(rawResponse.status, 403, 'Backend must block unpermitted release regardless of frontend');
    const body = await rawResponse.json();
    assert.equal(body.code, 'FORBIDDEN_PERMISSION');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

// -------------------------------------------------------------
// 8. CONTEXT / SCOPE-AWARE AUTHORIZATION EVALUATION
// -------------------------------------------------------------
test('Advanced RBAC: Context-aware authorization enforces organizational scope (e.g. Plant isolation)', () => {
  // Quality Lead scoped strictly to PLANT-01
  const plant1Lead: SecurityUser = {
    userId: 'usr-ql-plant1',
    roles: ['Quality Lead'],
    organizationId: 'org-kranex',
    plantScope: ['PLANT-01'],
  };

  // Operation within authorized plant scope
  const decisionPlant1 = authorizationEngine.can(
    plant1Lead,
    QUALITY_PERMISSIONS.INSPECTION_RELEASE,
    { plantId: 'PLANT-01' }
  );
  assert.equal(decisionPlant1.allowed, true);
  assert.equal(decisionPlant1.code, 'GRANTED');

  // Operation outside authorized plant scope (PLANT-02)
  const decisionPlant2 = authorizationEngine.can(
    plant1Lead,
    QUALITY_PERMISSIONS.INSPECTION_RELEASE,
    { plantId: 'PLANT-02' }
  );
  assert.equal(decisionPlant2.allowed, false);
  assert.equal(decisionPlant2.code, 'DENIED_SCOPE_MISMATCH');
  assert.match(decisionPlant2.reason || '', /does not grant access to target plant 'PLANT-02'/);

  // Global Lead with wildcard plant scope ['*']
  const globalLead: SecurityUser = {
    userId: 'usr-ql-global',
    roles: ['Quality Lead'],
    organizationId: 'org-kranex',
    plantScope: ['*'],
  };

  assert.equal(
    authorizationEngine.can(globalLead, QUALITY_PERMISSIONS.INSPECTION_RELEASE, { plantId: 'PLANT-02' }).allowed,
    true
  );
});

// -------------------------------------------------------------
// 9. AUTHORIZATION FAILURE IS DISTINCT FROM BUSINESS VALIDATION FAILURE
// -------------------------------------------------------------
test('Advanced RBAC: Authorization failure is distinct from business validation failure', async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/erp', erpRouter);

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

  const viewerToken = createDevToken('Viewer', 'usr-viewer', 'org-1');
  const leadToken = createDevToken('Quality Lead', 'usr-lead', 'org-1');

  try {
    // Case A: Authorization failure occurs first (HTTP 403, code FORBIDDEN_PERMISSION)
    const authFailResponse = await fetch(`http://localhost:${port}/api/erp/quality/ncrs/ncr-999/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({ disposition: 'SCRAP' }), // missing root cause too
    });
    assert.equal(authFailResponse.status, 403);
    const authFailBody = await authFailResponse.json();
    assert.equal(authFailBody.code, 'FORBIDDEN_PERMISSION');

    // Case B: Authorized caller fails business rule validation (HTTP 400, root cause too short)
    const bizFailResponse = await fetch(`http://localhost:${port}/api/erp/quality/ncrs/ncr-fake-missing/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({ disposition: 'SCRAP', rootCause: 'short' }), // violates min 10 chars business rule
    });
    assert.equal(bizFailResponse.status, 400);
    const bizFailBody = await bizFailResponse.json();
    assert.match(bizFailBody.error, /Root cause explanation must be at least 10 characters|NCR with identifier/i);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

// -------------------------------------------------------------
// 10. EXISTING WORKFLOW & SEGREGATION OF DUTIES (SoD) REMAINS INTACT
// -------------------------------------------------------------
test('Advanced RBAC: Segregation of Duties (SoD) remains distinct and composable', () => {
  // A Supervisor has workflow.task.approve permission in RBAC
  const supervisorUser: SecurityUser = {
    userId: 'usr-bambang-01',
    roles: ['Supervisor'],
    organizationId: 'org-kranex',
  };

  // RBAC checks capability
  const rbacDecision = authorizationEngine.can(supervisorUser, 'workflow.task.approve');
  assert.equal(rbacDecision.allowed, true, 'Supervisor holds general workflow approval capability');

  // However, SoD business logic prevents self-approval of a transaction they submitted
  const pendingTx = createApprovalTransaction({
    type: 'PURCHASE_REQUISITION',
    referenceId: 'PR-2026-001',
    referenceTitle: 'Urgent Tooling Restock',
    plantId: 'PLANT-01',
    plantName: 'Batam Plant',
    requesterId: 'usr-bambang-01', // Bambang submitted this
    requesterName: 'Bambang Sutrisno',
    requesterPosition: 'Supervisor',
  });

  const sodResult = processApprovalDecision({
    request: pendingTx,
    currentUserId: 'usr-bambang-01', // Bambang tries to approve his own PR
    currentUserName: 'Bambang Sutrisno',
    currentUserRoles: ['Supervisor'],
    decision: 'APPROVED',
    enforceSegregationOfDuties: true,
  });

  assert.equal(sodResult.success, false);
  assert.match(sodResult.error || '', /Segregation of Duties Violation: Requester/i);
});

// -------------------------------------------------------------
// 11. QUERY AUTHORIZATION: filterAuthorized RESTRICTS BY SCOPE
// -------------------------------------------------------------
test('Advanced RBAC: Query authorization filters records based on user scope context', () => {
  const records = [
    { id: 'rec-1', plantId: 'PLANT-01', title: 'Inspection Unit 1' },
    { id: 'rec-2', plantId: 'PLANT-02', title: 'Inspection Unit 2' },
    { id: 'rec-3', plantId: 'PLANT-01', title: 'Inspection Unit 3' },
  ];

  const plant1Inspector: SecurityUser = {
    userId: 'usr-insp-p1',
    roles: ['Inspector'],
    organizationId: 'org-kranex',
    plantScope: ['PLANT-01'],
  };

  const filtered = authorizationEngine.filterAuthorized(
    plant1Inspector,
    QUALITY_PERMISSIONS.INSPECTION_READ,
    records,
    (item) => ({ plantId: item.plantId })
  );

  assert.equal(filtered.length, 2);
  assert.deepEqual(filtered.map((r) => r.id), ['rec-1', 'rec-3']);
});

// -------------------------------------------------------------
// 12. AUDIT LOGGING OF SECURITY DECISIONS
// -------------------------------------------------------------
test('Advanced RBAC: Security decisions are recorded by audit boundary', () => {
  securityAuditLogger.clear();

  const user: SecurityUser = {
    userId: 'usr-audited-01',
    roles: ['Viewer'],
    organizationId: 'org-kranex',
  };

  authorizationEngine.can(user, QUALITY_PERMISSIONS.INSPECTION_RELEASE, { plantId: 'PLANT-01' });

  const recentAudits = securityAuditLogger.getRecentAudits(5);
  assert.ok(recentAudits.length >= 1);
  const audit = recentAudits[0];
  assert.equal(audit.userId, 'usr-audited-01');
  assert.equal(audit.permission, QUALITY_PERMISSIONS.INSPECTION_RELEASE);
  assert.equal(audit.decision, 'DENIED');
  assert.equal(audit.code, 'DENIED_NO_PERMISSION');
  assert.equal(audit.scopeContext?.plantId, 'PLANT-01');
});

// -------------------------------------------------------------
// 13. DYNAMIC MODULE PERMISSION REGISTRATION
// -------------------------------------------------------------
test('Advanced RBAC: Dynamic module permission registration without engine changes', () => {
  const customPerm = createPermission(
    'maintenance',
    'maintenance.workorder',
    'execute',
    'Execute preventive maintenance work order'
  );

  permissionRegistry.registerPermission(customPerm);
  assert.equal(permissionRegistry.hasPermission('maintenance.workorder.execute'), true);
  assert.equal(permissionRegistry.getPermission('maintenance.workorder.execute')?.module, 'maintenance');

  // Assign to Technician role dynamically
  roleRegistry.assignPermissionsToRole('Technician', ['maintenance.workorder.execute']);

  const techUser: SecurityUser = {
    userId: 'usr-tech-01',
    roles: ['Technician'],
    organizationId: 'org-kranex',
  };

  const decision = authorizationEngine.can(techUser, 'maintenance.workorder.execute');
  assert.equal(decision.allowed, true);
  assert.equal(decision.code, 'GRANTED');
});
