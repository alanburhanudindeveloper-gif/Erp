/**
 * Frontend Authorization Hook (Advanced RBAC).
 *
 * Provides reactive authorization checks for UI components:
 * - can(permission, context?)
 * - canAny(permissions, context?)
 * - canAll(permissions, context?)
 *
 * Note: Frontend authorization controls only UI presentation (visibility, disabled states).
 * Authoritative security enforcement is always executed server-side.
 */

import { useMemo } from 'react';
import { authorizationEngine } from '../authorizationEngine';
import { roleRegistry, type SecurityUser } from '../roleModel';
import { erpApiClient } from '../../../infrastructure/api/erpApiClient';
import type { SecurityScopeContext } from '../permissionModel';

export interface UseAuthorizationOptions {
  user?: SecurityUser;
  role?: string;
  roles?: string[];
  plantScope?: string[];
}

export function useAuthorization(options: UseAuthorizationOptions = {}) {
  // 1. Resolve active user credentials
  const currentUser: SecurityUser = useMemo(() => {
    if (options.user) {
      return options.user;
    }

    const activeRoles = options.roles && options.roles.length > 0
      ? options.roles
      : [options.role || erpApiClient.getRole() || 'Viewer'];

    const directPermissions = roleRegistry.getPermissionsForRoles(activeRoles);

    return {
      userId: `usr-${activeRoles[0].toLowerCase().replace(/\s+/g, '-')}`,
      roles: activeRoles,
      organizationId: 'default-org',
      plantScope: options.plantScope || ['*'],
      directPermissions,
    };
  }, [options.user, options.role, options.roles, options.plantScope]);

  // 2. Computed permissions set
  const permissions = useMemo(() => {
    return roleRegistry.getPermissionsForRoles(currentUser.roles);
  }, [currentUser.roles]);

  // 3. Authorization evaluator functions
  const can = (permission: string, context?: SecurityScopeContext): boolean => {
    return authorizationEngine.can(currentUser, permission, context).allowed;
  };

  const canAny = (perms: string[], context?: SecurityScopeContext): boolean => {
    return authorizationEngine.canAny(currentUser, perms, context).allowed;
  };

  const canAll = (perms: string[], context?: SecurityScopeContext): boolean => {
    return authorizationEngine.canAll(currentUser, perms, context).allowed;
  };

  return {
    can,
    canAny,
    canAll,
    user: currentUser,
    roles: currentUser.roles,
    permissions,
    plantScope: currentUser.plantScope || ['*'],
  };
}
