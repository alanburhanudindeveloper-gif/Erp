/**
 * Modular Permission Registry.
 *
 * Allows individual ERP modules to register their permissions dynamically
 * without requiring changes to the central authorization engine.
 */

import type { PermissionDefinition } from './permissionModel';

export class PermissionRegistry {
  private readonly permissions = new Map<string, PermissionDefinition>();

  /**
   * Registers a single permission definition.
   * If already registered, updates the description and module metadata.
   */
  registerPermission(permission: PermissionDefinition): void {
    if (!permission || !permission.id) {
      throw new Error('Cannot register permission without a valid id');
    }
    this.permissions.set(permission.id.toLowerCase(), permission);
  }

  /**
   * Bulk-registers multiple permission definitions.
   */
  registerPermissions(definitions: PermissionDefinition[]): void {
    for (const def of definitions) {
      this.registerPermission(def);
    }
  }

  /**
   * Retrieves a permission definition by its ID.
   */
  getPermission(id: string): PermissionDefinition | undefined {
    return this.permissions.get(id.trim().toLowerCase());
  }

  /**
   * Checks whether a permission ID has been formally registered in the system.
   */
  hasPermission(id: string): boolean {
    return this.permissions.has(id.trim().toLowerCase());
  }

  /**
   * Lists all registered permissions across all modules.
   */
  listPermissions(): PermissionDefinition[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Lists all permissions declared by a specific domain module.
   */
  listPermissionsByModule(moduleName: string): PermissionDefinition[] {
    const targetModule = moduleName.trim().toLowerCase();
    return Array.from(this.permissions.values()).filter(
      (p) => p.module === targetModule
    );
  }

  /**
   * Clears all registered permissions (primarily for testing).
   */
  clear(): void {
    this.permissions.clear();
  }
}

/**
 * Global singleton PermissionRegistry instance.
 */
export const permissionRegistry = new PermissionRegistry();
