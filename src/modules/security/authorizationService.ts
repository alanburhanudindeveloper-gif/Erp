import { verifyErpToken, type ErpTokenPayload } from './tokenService';
import type { SecurityScopeContext } from './permissionModel';
import { roleRegistry, type SecurityUser } from './roleModel';
import { authorizationEngine, type AuthorizationDecision } from './authorizationEngine';

export interface ErpSession {
  userId: string;
  role: string; // primary role (backwards compatibility)
  roles: string[]; // all assigned roles
  organizationId: string;
  plantScope?: string[];
  permissions: string[];
  authorized: boolean;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  code?: string;
  session?: ErpSession;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
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
  'Plant Manager': [
    'WORKFLOW_VIEW',
    'WORKFLOW_APPROVE',
    'INVENTORY_VIEW',
    'CAPACITY_VIEW',
    'PLANNING_VIEW',
    'QUALITY_APPROVE',
    'AI_GOVERNANCE',
    'SCHEDULING_MANAGE',
    'ADMIN_ALL',
  ],
  'Procurement Manager': [
    'WORKFLOW_VIEW',
    'WORKFLOW_APPROVE',
    'PROCUREMENT_APPROVE',
    'INVENTORY_VIEW',
  ],
  Buyer: [
    'WORKFLOW_VIEW',
    'INVENTORY_VIEW',
    'PROCUREMENT_CREATE',
  ],
  Manager: [
    'WORKFLOW_VIEW',
    'WORKFLOW_APPROVE',
    'PROCUREMENT_APPROVE',
  ],
  Operator: [
    'WORKFLOW_VIEW',
  ],
  Viewer: [
    'WORKFLOW_VIEW',
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

/**
 * Validates and transforms session or candidate credentials into a typed ErpSession.
 * Aggregates permissions from all assigned user roles (multi-role support) and role registry.
 */
export function validateErpSession(
  session: Partial<ErpSession> & { roles?: string[]; plantScope?: string[] }
): ErpSession & { authorized: boolean } {
  const candidateRoles: string[] = [];
  if (session.roles && Array.isArray(session.roles) && session.roles.length > 0) {
    candidateRoles.push(...session.roles);
  } else if (session.role) {
    candidateRoles.push(session.role);
  }

  const normalizedRoles = candidateRoles
    .map(normalizeRole)
    .filter((r): r is string => Boolean(r));

  const organizationId = session.organizationId?.trim();
  const userId = session.userId?.trim();

  if (!userId || normalizedRoles.length === 0 || !organizationId) {
    return {
      userId: userId || 'unknown-user',
      role: normalizedRoles[0] || 'UNAUTHORIZED',
      roles: normalizedRoles,
      organizationId: organizationId || 'unknown-organization',
      plantScope: session.plantScope || ['*'],
      permissions: [],
      authorized: false,
    };
  }

  // 1. Collect legacy uppercase permissions from all roles
  const legacyPermissions: string[] = [];
  for (const r of normalizedRoles) {
    const roleBase = DEFAULT_ROLE_PERMISSIONS[r] || [];
    legacyPermissions.push(...roleBase);
  }

  // 2. Collect granular <resource>.<action> permissions from role registry
  const granularPermissions = roleRegistry.getPermissionsForRoles(normalizedRoles);

  // 3. Merge with any token-provided direct permissions
  const directPermissions = session.permissions || [];

  const permissions = dedupe([
    ...legacyPermissions,
    ...granularPermissions,
    ...directPermissions,
  ]);

  return {
    userId,
    role: normalizedRoles[0],
    roles: normalizedRoles,
    organizationId,
    plantScope: session.plantScope || ['*'],
    permissions,
    authorized: true,
  };
}

/**
 * Converts an ErpSession into a SecurityUser representation for authorization evaluations.
 */
export function toSecurityUser(session: Partial<ErpSession>): SecurityUser | null {
  const valid = validateErpSession(session);
  if (!valid.authorized) {
    return null;
  }
  return {
    userId: valid.userId,
    roles: valid.roles,
    organizationId: valid.organizationId,
    plantScope: valid.plantScope,
    directPermissions: valid.permissions,
  };
}

/**
 * Checks whether a session holds a specific permission, optionally scoped to context.
 */
export function hasPermission(
  session: Partial<ErpSession>,
  permission: string,
  context?: SecurityScopeContext
): boolean {
  const validSession = validateErpSession(session);
  if (!validSession.authorized) {
    return false;
  }

  // Fast-path: direct permission array check (case-insensitive)
  const cleanTarget = permission.trim().toLowerCase();
  const directMatch = validSession.permissions.some(
    (p) => p.toLowerCase() === cleanTarget || p === '*'
  );
  if (!context && directMatch) {
    return true;
  }

  // Engine evaluation including scope context
  const securityUser = toSecurityUser(validSession);
  if (!securityUser) {
    return false;
  }

  return authorizationEngine.can(securityUser, permission, context).allowed;
}

export function readHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  if (!headers) {
    return undefined;
  }

  const matchedKey = Object.keys(headers).find(
    (headerKey) => headerKey.toLowerCase() === key.toLowerCase()
  );
  const value = matchedKey ? headers[matchedKey] : undefined;

  if (Array.isArray(value)) {
    return value[0]?.trim();
  }

  return value?.trim();
}

export function extractBearerToken(
  headers?: Record<string, string | string[] | undefined>
): string | undefined {
  const authHeader = readHeaderValue(headers, 'authorization');
  if (!authHeader) {
    return undefined;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Server-side Authentication & Authorization engine.
 *
 * Verifies Bearer token credentials cryptographically.
 * Explicitly rejects trusting client-supplied headers (x-erp-role, x-erp-user-id, x-erp-organization-id).
 */
export function authorizeRequest(
  request: {
    headers?: Record<string, string | string[] | undefined>;
    session?: Partial<ErpSession>;
  },
  requiredRoles: string[] = [],
  requiredPermission?: string,
  context?: SecurityScopeContext
): AuthorizationResult {
  let candidateSession: ErpSession & { authorized: boolean };

  if (request.session && request.session.authorized) {
    candidateSession = validateErpSession(request.session);
  } else {
    const token = extractBearerToken(request.headers);
    if (token) {
      const verification = verifyErpToken(token);
      if (!verification.valid || !verification.payload) {
        return {
          authorized: false,
          code: verification.code || 'INVALID_TOKEN',
          reason: verification.error || 'Invalid authentication token.',
        };
      }
      // Verified from cryptographic token ONLY
      candidateSession = validateErpSession({
        userId: verification.payload.userId,
        role: verification.payload.role,
        roles: verification.payload.roles,
        organizationId: verification.payload.organizationId,
        plantScope: verification.payload.plantScope,
        permissions: verification.payload.permissions || [],
      });
    } else {
      return {
        authorized: false,
        code: 'MISSING_TOKEN',
        reason: 'Missing authentication credentials (Bearer token required).',
      };
    }
  }

  if (!candidateSession.authorized) {
    return {
      authorized: false,
      code: 'UNAUTHORIZED',
      reason: 'The request is not authenticated as a valid ERP user.',
      session: candidateSession,
    };
  }

  // 1. Permission authorization check
  if (requiredPermission) {
    const user = toSecurityUser(candidateSession);
    const decision = authorizationEngine.can(user, requiredPermission, context);
    if (!decision.allowed) {
      return {
        authorized: false,
        code: 'FORBIDDEN_PERMISSION',
        reason: decision.reason || `The caller does not have permission '${requiredPermission}'.`,
        session: candidateSession,
      };
    }
  }

  // 2. Role authorization check (for backwards compatibility)
  if (requiredRoles.length > 0) {
    const normalizedRoles = requiredRoles.map((role) => role.trim());
    const roleAllowed = candidateSession.roles.some((r) => normalizedRoles.includes(r));

    if (!roleAllowed) {
      return {
        authorized: false,
        code: 'FORBIDDEN_ROLE',
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

export interface RequireErpAuthOptions {
  requiredRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  scopeResolver?: (req: any) => SecurityScopeContext | undefined;
}

/**
 * Express middleware enforcing server-verified Bearer authentication & RBAC.
 * Rejects unauthenticated requests with 401 and role/permission violations with 403.
 * Discards client-controlled identity headers to prevent spoofing.
 */
export function requireErpAuth(options: RequireErpAuthOptions = {}) {
  return (
    req: {
      headers?: Record<string, string | string[] | undefined>;
      session?: Partial<ErpSession>;
      [key: string]: any;
    },
    res: {
      status: (code: number) => { json: (payload: unknown) => unknown };
      json: (payload: unknown) => unknown;
    },
    next: () => void
  ) => {
    const token = extractBearerToken(req.headers);
    if (!token) {
      return res.status(401).json({
        error: 'Missing authentication credentials (Bearer token required).',
        code: 'MISSING_TOKEN',
        authorized: false,
      });
    }

    const verification = verifyErpToken(token);
    if (!verification.valid || !verification.payload) {
      return res.status(401).json({
        error: verification.error || 'Invalid or expired authentication credentials.',
        code: verification.code || 'INVALID_TOKEN',
        authorized: false,
      });
    }

    // Identity is established STRICTLY from verified token payload
    const session = validateErpSession({
      userId: verification.payload.userId,
      role: verification.payload.role,
      roles: verification.payload.roles,
      organizationId: verification.payload.organizationId,
      plantScope: verification.payload.plantScope,
      permissions: verification.payload.permissions || [],
    });

    // Client-supplied spoofing headers are completely ignored
    req.session = session;
    const securityUser = toSecurityUser(session);
    const context = options.scopeResolver ? options.scopeResolver(req) : undefined;

    // 1. Check fine-grained singular permission if specified
    if (options.requiredPermission) {
      const decision = authorizationEngine.can(securityUser, options.requiredPermission, context);
      if (!decision.allowed) {
        return res.status(403).json({
          error: decision.reason || `The caller does not have permission '${options.requiredPermission}'.`,
          code: 'FORBIDDEN_PERMISSION',
          authorized: false,
        });
      }
    }

    // 2. Check multiple required permissions if specified
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const decision = authorizationEngine.canAll(securityUser, options.requiredPermissions, context);
      if (!decision.allowed) {
        return res.status(403).json({
          error: decision.reason || `The caller lacks required permissions: ${options.requiredPermissions.join(', ')}`,
          code: 'FORBIDDEN_PERMISSION',
          authorized: false,
        });
      }
    }

    // 3. Check roles if specified
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const normalizedRoles = options.requiredRoles.map((r) => r.trim());
      const roleAllowed = session.roles.some((r) => normalizedRoles.includes(r));
      if (!roleAllowed) {
        return res.status(403).json({
          error: `The caller role '${session.role}' is not allowed. Required role: ${normalizedRoles.join(' or ')}.`,
          code: 'FORBIDDEN_ROLE',
          authorized: false,
        });
      }
    }

    return next();
  };
}
