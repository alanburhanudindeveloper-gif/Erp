/**
 * Central Authorization Engine for Kranex ERP.
 *
 * Evaluates authorization requests across:
 * User -> Roles -> Permissions -> Resource -> Action -> Scope / Context
 *
 * Core Principles:
 * 1. Deny by Default: If user, permission, or scope are not explicitly validated, access is denied.
 * 2. Scope Awareness: Verifies organizational context (e.g. plantId) against user scope boundaries.
 * 3. Decoupled Architecture: Completely free of Express, React, and SQL dependencies.
 */

import { parsePermissionId, type SecurityScopeContext } from './permissionModel';
import { roleRegistry, type RoleRegistry, type SecurityUser } from './roleModel';
import { securityAuditLogger, type ISecurityAuditLogger } from './securityAudit';

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly code:
    | 'GRANTED'
    | 'DENIED_UNAUTHENTICATED'
    | 'FORBIDDEN_PERMISSION'
    | 'DENIED_SCOPE_MISMATCH'
    | 'DENIED_UNKNOWN_PERMISSION';
  readonly reason?: string;
  readonly permission: string;
  readonly evaluatedRoles: string[];
  readonly scopeContext?: SecurityScopeContext;
  readonly timestamp: string;
}

export interface IAuthorizationEngine {
  can(
    user: SecurityUser | null | undefined,
    permission: string,
    context?: SecurityScopeContext
  ): AuthorizationDecision;

  canAny(
    user: SecurityUser | null | undefined,
    permissions: string[],
    context?: SecurityScopeContext
  ): AuthorizationDecision;

  canAll(
    user: SecurityUser | null | undefined,
    permissions: string[],
    context?: SecurityScopeContext
  ): AuthorizationDecision;

  filterAuthorized<T>(
    user: SecurityUser | null | undefined,
    permission: string,
    items: T[],
    getContext: (item: T) => SecurityScopeContext | undefined
  ): T[];
}

export class AuthorizationEngine implements IAuthorizationEngine {
  constructor(
    private readonly roles: RoleRegistry = roleRegistry,
    private readonly auditLogger?: ISecurityAuditLogger
  ) {}

  /**
   * Evaluates if a user is authorized to perform a permission within a given operational context.
   */
  can(
    user: SecurityUser | null | undefined,
    permission: string,
    context?: SecurityScopeContext
  ): AuthorizationDecision {
    const timestamp = new Date().toISOString();
    const cleanPermission = permission.trim().toLowerCase();
    const parsed = parsePermissionId(cleanPermission);
    const resource = parsed?.resource || 'unknown';
    const action = parsed?.action || 'unknown';

    // 1. Unauthenticated or invalid user -> Deny by default
    if (!user || !user.userId || !user.roles || user.roles.length === 0) {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'DENIED_UNAUTHENTICATED',
        reason: 'User is not authenticated or possesses no assigned roles.',
        permission: cleanPermission,
        evaluatedRoles: [],
        scopeContext: context,
        timestamp,
      };

      this.auditLogger?.logDecision({
        userId: user?.userId || 'anonymous',
        roles: [],
        organizationId: user?.organizationId || 'none',
        permission: cleanPermission,
        resource,
        action,
        decision: 'DENIED',
        code: decision.code,
        reason: decision.reason,
        scopeContext: context,
      });

      return decision;
    }

    const userRoles = user.roles.map((r) => r.trim());

    // 2. Resolve aggregated permissions from all user roles + direct permissions
    const grantedPermissions = new Set<string>([
      ...this.roles.getPermissionsForRoles(userRoles),
      ...(user.directPermissions || []).map((p) => p.trim().toLowerCase()),
    ]);

    // 3. Permission Matching: Exact match or resource wildcard (e.g. "quality.*" or "*")
    const hasPermission =
      grantedPermissions.has(cleanPermission) ||
      grantedPermissions.has('*') ||
      (parsed ? grantedPermissions.has(`${parsed.resource}.*`) : false);

    if (!hasPermission) {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'FORBIDDEN_PERMISSION',
        reason: `User '${user.userId}' with roles [${userRoles.join(', ')}] does not hold permission '${cleanPermission}'.`,
        permission: cleanPermission,
        evaluatedRoles: userRoles,
        scopeContext: context,
        timestamp,
      };

      this.auditLogger?.logDecision({
        userId: user.userId,
        roles: userRoles,
        organizationId: user.organizationId,
        permission: cleanPermission,
        resource,
        action,
        decision: 'DENIED',
        code: decision.code,
        reason: decision.reason,
        scopeContext: context,
      });

      return decision;
    }

    // 4. Context / Scope Evaluation: verify organizational constraints (e.g. plantId)
    if (context && context.plantId) {
      const requiredPlant = context.plantId.trim();
      const userPlantScope = user.plantScope || ['*']; // Default to all if not explicitly restricted

      const matchesScope =
        userPlantScope.includes('*') ||
        userPlantScope.includes('ALL') ||
        userPlantScope.includes(requiredPlant);

      if (!matchesScope) {
        const decision: AuthorizationDecision = {
          allowed: false,
          code: 'DENIED_SCOPE_MISMATCH',
          reason: `User scope [${userPlantScope.join(', ')}] does not grant access to target plant '${requiredPlant}'.`,
          permission: cleanPermission,
          evaluatedRoles: userRoles,
          scopeContext: context,
          timestamp,
        };

        this.auditLogger?.logDecision({
          userId: user.userId,
          roles: userRoles,
          organizationId: user.organizationId,
          permission: cleanPermission,
          resource,
          action,
          decision: 'DENIED',
          code: decision.code,
          reason: decision.reason,
          scopeContext: context,
        });

        return decision;
      }
    }

    // 5. Authorized Grant
    const decision: AuthorizationDecision = {
      allowed: true,
      code: 'GRANTED',
      permission: cleanPermission,
      evaluatedRoles: userRoles,
      scopeContext: context,
      timestamp,
    };

    this.auditLogger?.logDecision({
      userId: user.userId,
      roles: userRoles,
      organizationId: user.organizationId,
      permission: cleanPermission,
      resource,
      action,
      decision: 'ALLOWED',
      code: decision.code,
      scopeContext: context,
    });

    return decision;
  }

  /**
   * Verifies that the user holds at least one of the required permissions.
   */
  canAny(
    user: SecurityUser | null | undefined,
    permissions: string[],
    context?: SecurityScopeContext
  ): AuthorizationDecision {
    if (!permissions || permissions.length === 0) {
      return {
        allowed: true,
        code: 'GRANTED',
        permission: 'none',
        evaluatedRoles: user?.roles || [],
        scopeContext: context,
        timestamp: new Date().toISOString(),
      };
    }

    let lastDecision: AuthorizationDecision | undefined;
    for (const perm of permissions) {
      const decision = this.can(user, perm, context);
      if (decision.allowed) {
        return decision;
      }
      lastDecision = decision;
    }

    return (
      lastDecision || {
        allowed: false,
        code: 'FORBIDDEN_PERMISSION',
        reason: 'None of the requested permissions were granted.',
        permission: permissions.join(' | '),
        evaluatedRoles: user?.roles || [],
        scopeContext: context,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Verifies that the user holds ALL of the required permissions.
   */
  canAll(
    user: SecurityUser | null | undefined,
    permissions: string[],
    context?: SecurityScopeContext
  ): AuthorizationDecision {
    if (!permissions || permissions.length === 0) {
      return {
        allowed: true,
        code: 'GRANTED',
        permission: 'none',
        evaluatedRoles: user?.roles || [],
        scopeContext: context,
        timestamp: new Date().toISOString(),
      };
    }

    for (const perm of permissions) {
      const decision = this.can(user, perm, context);
      if (!decision.allowed) {
        return decision;
      }
    }

    return {
      allowed: true,
      code: 'GRANTED',
      permission: permissions.join(' & '),
      evaluatedRoles: user?.roles || [],
      scopeContext: context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Query Authorization: filters a dataset by checking whether the user is authorized for each item's context.
   * Eliminates data leakage without requiring separate custom query loops.
   */
  filterAuthorized<T>(
    user: SecurityUser | null | undefined,
    permission: string,
    items: T[],
    getContext: (item: T) => SecurityScopeContext | undefined
  ): T[] {
    if (!user) return [];
    return items.filter((item) => {
      const context = getContext(item);
      return this.can(user, permission, context).allowed;
    });
  }
}

/**
 * Singleton AuthorizationEngine instance wired with the global RoleRegistry and AuditLogger.
 */
export const authorizationEngine = new AuthorizationEngine(roleRegistry, securityAuditLogger);
