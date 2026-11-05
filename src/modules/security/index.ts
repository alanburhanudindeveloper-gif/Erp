/**
 * Security & Advanced Authorization Foundation Bounded Context.
 *
 * Provides production-grade RBAC, scoped context evaluation, module permission registry,
 * and cryptographic token authentication.
 */

export * from './permissionModel';
export * from './permissionRegistry';
export * from './roleModel';
export * from './authorizationEngine';
export * from './securityAudit';
export * from './authorizationService';
export * from './tokenService';
export * from './authConfig';
export * from './passwordService';
export * from './userModel';
export * from './userRepository';
export * from './application';
export * from './presentation/useAuthorization';
export * from './presentation/AuthContext';
export * from './presentation/LoginView';

import { moduleRegistry } from '../../shared/kernel/moduleRegistry';
import { permissionRegistry } from './permissionRegistry';
import { authorizationEngine } from './authorizationEngine';

// Wire security subsystem to moduleRegistry
moduleRegistry.setPermissionRegistry(permissionRegistry);
moduleRegistry.setAuthorizationEngine(authorizationEngine);
