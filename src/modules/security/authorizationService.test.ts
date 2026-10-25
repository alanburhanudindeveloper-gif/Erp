import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { authorizeRequest, hasPermission, validateErpSession } from './authorizationService';

test('validated ERP session grants the expected permissions for supervisors', () => {
  const session = validateErpSession({
    userId: 'u-100',
    role: 'Supervisor',
    organizationId: 'org-1',
  });

  assert.equal(session.authorized, true);
  assert.equal(hasPermission(session, 'WORKFLOW_APPROVE'), true);
  assert.equal(hasPermission(session, 'AI_GOVERNANCE'), true);
});

test('authorization rejects callers that do not meet the required role', () => {
  const result = authorizeRequest({ headers: { 'x-erp-role': 'Planner' } }, ['Supervisor']);

  assert.equal(result.authorized, false);
  assert.match(result.reason || '', /required role/i);
});

test('ERP routes are protected by server-side authorization checks', () => {
  const serverSource = fs.readFileSync(new URL('../../../server.ts', import.meta.url), 'utf8');

  assert.equal((serverSource.match(/app\.get\('\/api\/erp\/testing'/g) || []).length, 1);
  assert.match(serverSource, /app\.get\('\/api\/erp\/testing', requireErpAuth\(/);
});
