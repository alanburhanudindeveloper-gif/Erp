import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateErpToken,
  verifyErpToken,
  createDevToken,
} from './tokenService';
import {
  authorizeRequest,
  requireErpAuth,
  hasPermission,
  validateErpSession,
} from './authorizationService';

test('Token Service: generates and cryptographically verifies valid Bearer token', () => {
  const token = generateErpToken({
    userId: 'usr-planner-99',
    role: 'Planner',
    organizationId: 'aerospace-mfg-01',
    permissions: ['PLANNING_VIEW'],
  });

  assert.ok(typeof token === 'string' && token.split('.').length === 3);

  const result = verifyErpToken(token);
  assert.equal(result.valid, true);
  assert.ok(result.payload);
  assert.equal(result.payload?.userId, 'usr-planner-99');
  assert.equal(result.payload?.role, 'Planner');
  assert.equal(result.payload?.organizationId, 'aerospace-mfg-01');
  assert.deepEqual(result.payload?.permissions, ['PLANNING_VIEW']);
});

test('Token Service: rejects missing, null, or empty tokens', () => {
  const missingResult = verifyErpToken(undefined);
  assert.equal(missingResult.valid, false);
  assert.equal(missingResult.code, 'MISSING_TOKEN');

  const emptyResult = verifyErpToken('   ');
  assert.equal(emptyResult.valid, false);
  assert.equal(emptyResult.code, 'MISSING_TOKEN');
});

test('Token Service: rejects malformed token formats', () => {
  const malformed1 = verifyErpToken('not-a-token');
  assert.equal(malformed1.valid, false);
  assert.equal(malformed1.code, 'MALFORMED_TOKEN');

  const malformed2 = verifyErpToken('header.payload');
  assert.equal(malformed2.valid, false);
  assert.equal(malformed2.code, 'MALFORMED_TOKEN');

  const malformed3 = verifyErpToken('part1.part2.part3.part4');
  assert.equal(malformed3.valid, false);
  assert.equal(malformed3.code, 'MALFORMED_TOKEN');
});

test('Token Service: rejects invalid token signatures (tampered payload)', () => {
  const validToken = createDevToken('Operator', 'usr-op-01', 'org-1');
  const [header, payload, signature] = validToken.split('.');

  // Attempt to forge payload claim (e.g. elevate to Plant Manager)
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  decodedPayload.role = 'Plant Manager';
  const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64').replace(/=/g, '');

  const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
  const verification = verifyErpToken(tamperedToken);

  assert.equal(verification.valid, false);
  assert.equal(verification.code, 'INVALID_SIGNATURE');
  assert.match(verification.error || '', /Invalid token signature/i);
});

test('Token Service: rejects expired credentials', () => {
  // Generate token that expired 10 seconds ago
  const expiredToken = generateErpToken(
    {
      userId: 'usr-old-01',
      role: 'Supervisor',
      organizationId: 'org-1',
    },
    { expiresInSeconds: -10 }
  );

  const verification = verifyErpToken(expiredToken);
  assert.equal(verification.valid, false);
  assert.equal(verification.code, 'TOKEN_EXPIRED');
  assert.match(verification.error || '', /expired/i);
});

test('Anti-Spoofing: valid Operator token + forged X-Erp-Role remains Operator and rejected for Manager', () => {
  const operatorToken = createDevToken('Operator', 'usr-operator-44', 'org-metal-works');

  // Attacker sends valid Operator token but attempts header escalation
  const req = {
    headers: {
      authorization: `Bearer ${operatorToken}`,
      'x-erp-role': 'Plant Manager',
      'X-Erp-Role': 'Plant Manager',
    },
  };

  const result = authorizeRequest(req, ['Plant Manager']);
  assert.equal(result.authorized, false, 'Attacker must NOT be escalated to Plant Manager');
  assert.equal(result.code, 'FORBIDDEN_ROLE');
  assert.equal(result.session?.role, 'Operator', 'Session role must remain Operator from token claims');
});

test('Anti-Spoofing: valid user token + forged X-Erp-User-Id remains original token user', () => {
  const userToken = createDevToken('Buyer', 'usr-legit-buyer-10', 'org-procure');

  // Attacker sends legitimate token but pretends to be admin in header
  const req = {
    headers: {
      authorization: `Bearer ${userToken}`,
      'x-erp-user-id': 'usr-ceo-01',
      'X-Erp-User-Id': 'usr-ceo-01',
    },
  };

  const result = authorizeRequest(req, ['Buyer']);
  assert.equal(result.authorized, true);
  assert.equal(result.session?.userId, 'usr-legit-buyer-10', 'Session user ID must not be overwritten by forged header');
  assert.notEqual(result.session?.userId, 'usr-ceo-01');
});

test('Anti-Spoofing: valid organization token + forged X-Erp-Organization-Id remains verified org', () => {
  const orgToken = createDevToken('Planner', 'usr-planner-22', 'org-secure-plant-a');

  const req = {
    headers: {
      authorization: `Bearer ${orgToken}`,
      'x-erp-organization-id': 'org-competitor-plant-b',
    },
  };

  const result = authorizeRequest(req, ['Planner']);
  assert.equal(result.authorized, true);
  assert.equal(result.session?.organizationId, 'org-secure-plant-a', 'Session org must remain token organizationId');
  assert.notEqual(result.session?.organizationId, 'org-competitor-plant-b');
});

test('Authorization: authenticated user with required permission is allowed', () => {
  const supervisorToken = createDevToken('Supervisor', 'usr-sup-01', 'org-1');
  const req = {
    headers: {
      authorization: `Bearer ${supervisorToken}`,
    },
  };

  const result = authorizeRequest(req, ['Supervisor'], 'WORKFLOW_APPROVE');
  assert.equal(result.authorized, true);
});

test('Authorization: authenticated user without required permission is rejected', () => {
  const operatorToken = createDevToken('Operator', 'usr-op-01', 'org-1');
  const req = {
    headers: {
      authorization: `Bearer ${operatorToken}`,
    },
  };

  const result = authorizeRequest(req, ['Operator'], 'QUALITY_APPROVE');
  assert.equal(result.authorized, false);
  assert.equal(result.code, 'FORBIDDEN_PERMISSION');
  assert.match(result.reason || '', /does not have permission/i);
});

test('Express Middleware: requireErpAuth rejects missing token with 401', () => {
  const middleware = requireErpAuth({ requiredRoles: ['Planner'] });

  let statusCode = 0;
  let responseBody: any = null;
  let nextCalled = false;

  const mockReq = {
    headers: {},
  };
  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (payload: any) => {
          responseBody = payload;
          return payload;
        },
      };
    },
    json: (payload: any) => {
      responseBody = payload;
      return payload;
    },
  };
  const mockNext = () => {
    nextCalled = true;
  };

  middleware(mockReq, mockRes as any, mockNext);

  assert.equal(statusCode, 401);
  assert.equal(responseBody?.code, 'MISSING_TOKEN');
  assert.equal(nextCalled, false);
});

test('Express Middleware: requireErpAuth rejects invalid token signature with 401', () => {
  const middleware = requireErpAuth({ requiredRoles: ['Planner'] });

  let statusCode = 0;
  let responseBody: any = null;
  let nextCalled = false;

  const mockReq = {
    headers: {
      authorization: 'Bearer bad.token.signature',
    },
  };
  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (payload: any) => {
          responseBody = payload;
          return payload;
        },
      };
    },
    json: (payload: any) => {
      responseBody = payload;
      return payload;
    },
  };
  const mockNext = () => {
    nextCalled = true;
  };

  middleware(mockReq, mockRes as any, mockNext);

  assert.equal(statusCode, 401);
  assert.equal(responseBody?.code, 'INVALID_SIGNATURE');
  assert.equal(nextCalled, false);
});

test('Express Middleware: requireErpAuth rejects role mismatch with 403', () => {
  const operatorToken = createDevToken('Operator', 'usr-op-01', 'org-1');
  const middleware = requireErpAuth({ requiredRoles: ['Plant Manager'] });

  let statusCode = 0;
  let responseBody: any = null;
  let nextCalled = false;

  const mockReq: any = {
    headers: {
      authorization: `Bearer ${operatorToken}`,
      'x-erp-role': 'Plant Manager', // Spoof attempt
    },
  };
  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (payload: any) => {
          responseBody = payload;
          return payload;
        },
      };
    },
    json: (payload: any) => {
      responseBody = payload;
      return payload;
    },
  };
  const mockNext = () => {
    nextCalled = true;
  };

  middleware(mockReq, mockRes as any, mockNext);

  assert.equal(statusCode, 403);
  assert.equal(responseBody?.code, 'FORBIDDEN_ROLE');
  assert.equal(nextCalled, false);
  assert.equal(mockReq.session?.role, 'Operator');
});

test('Express Middleware: requireErpAuth succeeds for valid credentials', () => {
  const managerToken = createDevToken('Plant Manager', 'usr-pm-01', 'org-1');
  const middleware = requireErpAuth({ requiredRoles: ['Plant Manager'] });

  let nextCalled = false;
  const mockReq: any = {
    headers: {
      authorization: `Bearer ${managerToken}`,
    },
  };
  const mockRes = {
    status: () => mockRes,
    json: () => mockRes,
  };
  const mockNext = () => {
    nextCalled = true;
  };

  middleware(mockReq, mockRes as any, mockNext);

  assert.equal(nextCalled, true);
  assert.equal(mockReq.session?.role, 'Plant Manager');
  assert.equal(mockReq.session?.userId, 'usr-pm-01');
});
