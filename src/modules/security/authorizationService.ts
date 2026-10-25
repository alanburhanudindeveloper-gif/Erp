export interface ErpSession {
  userId: string;
  role: string;
  organizationId: string;
  permissions: string[];
  authorized: boolean;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  session?: ErpSession;
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Planner: [
    'WORKFLOW_VIEW',
    'INVENTORY_VIEW',
    'CAPACITY_VIEW',
    'PLANNING_VIEW',
    'AI_GOVERNANCE_READ',
  ],
  Supervisor: [
    'WORKFLOW_VIEW',
    'WORKFLOW_APPROVE',
    'INVENTORY_VIEW',
    'CAPACITY_VIEW',
    'PLANNING_VIEW',
    'AI_GOVERNANCE',
    'SCHEDULING_MANAGE',
  ],
  'Quality Lead': [
    'WORKFLOW_VIEW',
    'QUALITY_APPROVE',
    'AI_GOVERNANCE',
  ],
};

function normalizeRole(role?: string): string | undefined {
  if (!role) {
    return undefined;
  }

  const value = role.trim();
  return value || undefined;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function validateErpSession(session: Partial<ErpSession>): ErpSession & { authorized: boolean } {
  const role = normalizeRole(session.role);
  const organizationId = session.organizationId?.trim();
  const userId = session.userId?.trim();

  if (!userId || !role || !organizationId) {
    return {
      userId: userId || 'unknown-user',
      role: role || 'UNAUTHORIZED',
      organizationId: organizationId || 'unknown-organization',
      permissions: [],
      authorized: false,
    };
  }

  const basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
  const permissions = dedupe([
    ...basePermissions,
    ...(session.permissions || []),
  ]);

  return {
    userId,
    role,
    organizationId,
    permissions,
    authorized: true,
  };
}

export function hasPermission(session: Partial<ErpSession>, permission: string): boolean {
  const validSession = validateErpSession(session);
  if (!validSession.authorized) {
    return false;
  }

  return validSession.permissions.includes(permission);
}

export function authorizeRequest(
  request: {
    headers?: Record<string, string | string[] | undefined>;
    session?: Partial<ErpSession>;
  },
  requiredRoles: string[] = [],
  requiredPermission?: string
): AuthorizationResult {
  const candidateSession = request.session
    ? validateErpSession(request.session)
    : validateErpSession({
        userId: 'request-user',
        role: normalizeRole(readHeaderValue(request.headers, 'x-erp-role') || readHeaderValue(request.headers, 'X-Erp-Role')),
        organizationId: 'default-org',
        permissions: [],
      });

  if (!candidateSession.authorized) {
    return {
      authorized: false,
      reason: 'The request is not authenticated as a valid ERP user.',
      session: candidateSession,
    };
  }

  if (requiredPermission && !hasPermission(candidateSession, requiredPermission)) {
    return {
      authorized: false,
      reason: `The caller does not have permission '${requiredPermission}'.`,
      session: candidateSession,
    };
  }

  if (requiredRoles.length > 0) {
    const normalizedRoles = requiredRoles.map((role) => role.trim());
    const roleAllowed = normalizedRoles.includes(candidateSession.role);

    if (!roleAllowed) {
      return {
        authorized: false,
        reason: `The caller role '${candidateSession.role}' is not allowed. Required role: ${normalizedRoles.join(' or ')}.`,
        session: candidateSession,
      };
    }
  }

  return {
    authorized: true,
    session: candidateSession,
  };
}

function readHeaderValue(headers: Record<string, string | string[] | undefined> | undefined, key: string): string | undefined {
  if (!headers) {
    return undefined;
  }

  const matchedKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
  const value = matchedKey ? headers[matchedKey] : undefined;

  if (Array.isArray(value)) {
    return value[0]?.trim();
  }

  return value?.trim();
}

export function requireErpAuth(options: { requiredRoles?: string[]; requiredPermission?: string } = {}) {
  return (req: {
    headers?: Record<string, string | string[] | undefined>;
    session?: Partial<ErpSession>;
  }, res: { status: (code: number) => { json: (payload: unknown) => unknown }; json: (payload: unknown) => unknown }, next: () => void) => {
    const headerRole = readHeaderValue(req.headers, 'x-erp-role');
    const headerUserId = readHeaderValue(req.headers, 'x-erp-user-id') || 'request-user';
    const headerOrganizationId = readHeaderValue(req.headers, 'x-erp-organization-id') || 'default-org';

    const result = authorizeRequest(
      {
        headers: req.headers,
        session: {
          userId: headerUserId,
          role: normalizeRole(headerRole),
          organizationId: headerOrganizationId,
          permissions: [],
        },
      },
      options.requiredRoles ?? [],
      options.requiredPermission
    );

    if (!result.authorized || !result.session) {
      return res.status(401).json({
        error: result.reason || 'Unauthorized ERP request.',
        authorized: false,
      });
    }

    req.session = result.session;
    return next();
  };
}
