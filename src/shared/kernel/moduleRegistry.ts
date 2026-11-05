/**
 * Module Registry & Dynamic Menu Architecture for Kranex ERP.
 *
 * Resides in Shared Kernel with ZERO outward dependencies on feature modules.
 * Standardizes:
 * - Module identity (id, name, description, status)
 * - Permissions contributed by each module
 * - Navigation / Menu contributions
 * - Route and feature metadata
 * - Deterministic duplicate registration handling
 * - Dynamic capability-based menu filtering (Deny by default)
 */

export interface PermissionDefinition {
  readonly id: string;
  readonly module: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
}

export interface SecurityScopeContext {
  plantId?: string;
  warehouseId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface SecurityUser {
  readonly userId: string;
  readonly roles: string[];
  readonly organizationId?: string;
  readonly plantScope?: string[];
  readonly directPermissions?: string[];
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly code: string;
  readonly reason?: string;
}

export interface IPermissionRegistry {
  registerPermission(permission: PermissionDefinition): void;
  registerPermissions?(permissions: PermissionDefinition[]): void;
  hasPermission?(permissionId: string): boolean;
  getPermission?(permissionId: string): PermissionDefinition | undefined;
}

export interface IAuthorizationEngine {
  can(
    user: SecurityUser | null | undefined,
    permission: string,
    context?: SecurityScopeContext
  ): AuthorizationDecision;

  canAll?(
    user: SecurityUser | null | undefined,
    permissions: string[],
    context?: SecurityScopeContext
  ): AuthorizationDecision;
}

export interface MenuSubItemDefinition {
  readonly id: string;
  readonly label: string;
  readonly requiredPermission?: string;
  readonly requiredPermissions?: string[];
  readonly order?: number;
}

export interface MenuItemDefinition {
  readonly id: string;
  readonly moduleId: string;
  readonly label: string;
  readonly icon?: string;
  readonly order: number;
  readonly badge?: number;
  readonly requiredPermission?: string;
  readonly requiredPermissions?: string[];
  readonly requiredRoles?: string[];
  readonly subItems?: MenuSubItemDefinition[];
}

export interface NavGroupDefinition {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly itemIds: string[];
}

export interface ModuleRouteDefinition {
  readonly path: string;
  readonly label?: string;
  readonly requiredPermission?: string;
}

export interface ModuleFeatureMetadata {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly enabled?: boolean;
}

export interface ErpModuleDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  enabled: boolean;
  readonly order: number;
  readonly permissions?: PermissionDefinition[];
  readonly menuItems?: MenuItemDefinition[];
  readonly routes?: ModuleRouteDefinition[];
  readonly features?: ModuleFeatureMetadata[];
  readonly defaultSubTab?: string;
  readonly status: 'ACTIVE' | 'EXPERIMENTAL' | 'DEPRECATED';
  readonly tags?: string[];
}

export interface IModuleRegistry {
  registerModule(definition: ErpModuleDefinition): void;
  getModule(id: string): ErpModuleDefinition | undefined;
  getAllModules(): ErpModuleDefinition[];
  getEnabledModules(): ErpModuleDefinition[];
  isModuleEnabled(id: string): boolean;
  enableModule(id: string): void;
  disableModule(id: string): void;
  registerNavGroup(group: NavGroupDefinition): void;
  getNavGroups(): NavGroupDefinition[];
  getAuthorizedMenuItems(
    user: SecurityUser | null | undefined,
    context?: SecurityScopeContext
  ): MenuItemDefinition[];
}

export class ModuleRegistry implements IModuleRegistry {
  private readonly modules = new Map<string, ErpModuleDefinition>();
  private readonly navGroups = new Map<string, NavGroupDefinition>();

  constructor(
    private permissions?: IPermissionRegistry,
    private authEngine?: IAuthorizationEngine
  ) {}

  /**
   * Sets or updates the permission registry bridge.
   */
  setPermissionRegistry(permissions: IPermissionRegistry): void {
    this.permissions = permissions;
  }

  /**
   * Sets or updates the authorization engine bridge.
   */
  setAuthorizationEngine(authEngine: IAuthorizationEngine): void {
    this.authEngine = authEngine;
  }

  /**
   * Registers an ERP domain module.
   * Handles duplicate registrations deterministically by merging permissions, menu items, routes, and features.
   */
  registerModule(definition: ErpModuleDefinition): void {
    const id = definition.id.trim().toLowerCase();
    const existing = this.modules.get(id);

    if (existing) {
      // Deterministic duplicate registration handling: merge without corruption
      const mergedPermissionsMap = new Map<string, PermissionDefinition>();
      for (const p of existing.permissions || []) {
        mergedPermissionsMap.set(p.id.toLowerCase(), p);
      }
      for (const p of definition.permissions || []) {
        mergedPermissionsMap.set(p.id.toLowerCase(), p);
      }

      const mergedMenuItemsMap = new Map<string, MenuItemDefinition>();
      for (const m of existing.menuItems || []) {
        mergedMenuItemsMap.set(m.id.toLowerCase(), m);
      }
      for (const m of definition.menuItems || []) {
        mergedMenuItemsMap.set(m.id.toLowerCase(), m);
      }

      const mergedRoutesMap = new Map<string, ModuleRouteDefinition>();
      for (const r of existing.routes || []) {
        mergedRoutesMap.set(r.path.toLowerCase(), r);
      }
      for (const r of definition.routes || []) {
        mergedRoutesMap.set(r.path.toLowerCase(), r);
      }

      const mergedFeaturesMap = new Map<string, ModuleFeatureMetadata>();
      for (const f of existing.features || []) {
        mergedFeaturesMap.set(f.key.toLowerCase(), f);
      }
      for (const f of definition.features || []) {
        mergedFeaturesMap.set(f.key.toLowerCase(), f);
      }

      const merged: ErpModuleDefinition = {
        ...existing,
        ...definition,
        id,
        permissions: Array.from(mergedPermissionsMap.values()),
        menuItems: Array.from(mergedMenuItemsMap.values()).sort((a, b) => a.order - b.order),
        routes: Array.from(mergedRoutesMap.values()),
        features: Array.from(mergedFeaturesMap.values()),
      };

      this.modules.set(id, merged);
    } else {
      this.modules.set(id, { ...definition, id });
    }

    // Automatically sync permissions into the permission registry if attached
    if (this.permissions && definition.permissions && definition.permissions.length > 0) {
      for (const perm of definition.permissions) {
        this.permissions.registerPermission(perm);
      }
    }
  }

  getModule(id: string): ErpModuleDefinition | undefined {
    return this.modules.get(id.trim().toLowerCase());
  }

  getAllModules(): ErpModuleDefinition[] {
    return Array.from(this.modules.values()).sort((a, b) => a.order - b.order);
  }

  getEnabledModules(): ErpModuleDefinition[] {
    return this.getAllModules().filter((m) => m.enabled);
  }

  isModuleEnabled(id: string): boolean {
    const mod = this.getModule(id);
    return Boolean(mod?.enabled);
  }

  enableModule(id: string): void {
    const mod = this.getModule(id);
    if (mod) {
      mod.enabled = true;
    }
  }

  disableModule(id: string): void {
    const mod = this.getModule(id);
    if (mod) {
      mod.enabled = false;
    }
  }

  registerNavGroup(group: NavGroupDefinition): void {
    this.navGroups.set(group.id, group);
  }

  getNavGroups(): NavGroupDefinition[] {
    return Array.from(this.navGroups.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Computes dynamic menu visibility based on:
   * 1. Module enabled state.
   * 2. User capabilities via authorizationEngine (Deny by default).
   * 3. Granular sub-item permissions.
   */
  getAuthorizedMenuItems(
    user: SecurityUser | null | undefined,
    context?: SecurityScopeContext
  ): MenuItemDefinition[] {
    // Deny by default if user is unauthenticated or has no roles
    if (!user || !user.userId || !user.roles || user.roles.length === 0) {
      return [];
    }

    const enabledModules = new Set(this.getEnabledModules().map((m) => m.id));
    const authorizedItems: MenuItemDefinition[] = [];

    for (const mod of this.getAllModules()) {
      if (!enabledModules.has(mod.id)) {
        continue;
      }

      if (!mod.menuItems || mod.menuItems.length === 0) {
        continue;
      }

      for (const item of mod.menuItems) {
        // If an authEngine is available, evaluate fine-grained permissions
        if (this.authEngine) {
          // Evaluate single required permission
          if (item.requiredPermission) {
            const decision = this.authEngine.can(user, item.requiredPermission, context);
            if (!decision.allowed) {
              continue;
            }
          }

          // Evaluate multiple required permissions (requires ALL)
          if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            if (this.authEngine.canAll) {
              const decision = this.authEngine.canAll(user, item.requiredPermissions, context);
              if (!decision.allowed) {
                continue;
              }
            } else {
              const allAllowed = item.requiredPermissions.every(
                (p) => this.authEngine!.can(user, p, context).allowed
              );
              if (!allAllowed) {
                continue;
              }
            }
          }
        }

        // Evaluate role constraint if specified
        if (item.requiredRoles && item.requiredRoles.length > 0) {
          const userRoles = (user?.roles || []).map((r) => r.trim());
          const roleMatched = item.requiredRoles.some((reqRole) => userRoles.includes(reqRole.trim()));
          if (!roleMatched) {
            continue;
          }
        }

        // Filter subItems based on subItem permissions
        let authorizedSubItems: MenuSubItemDefinition[] | undefined = undefined;
        if (item.subItems && item.subItems.length > 0) {
          authorizedSubItems = item.subItems.filter((sub) => {
            if (!this.authEngine) {
              return true;
            }
            if (sub.requiredPermission) {
              return this.authEngine.can(user, sub.requiredPermission, context).allowed;
            }
            if (sub.requiredPermissions && sub.requiredPermissions.length > 0) {
              if (this.authEngine.canAll) {
                return this.authEngine.canAll(user, sub.requiredPermissions, context).allowed;
              }
              return sub.requiredPermissions.every(
                (p) => this.authEngine!.can(user, p, context).allowed
              );
            }
            return true;
          });
        }

        authorizedItems.push({
          ...item,
          subItems: authorizedSubItems,
        });
      }
    }

    return authorizedItems.sort((a, b) => a.order - b.order);
  }
}

export const moduleRegistry = new ModuleRegistry();
