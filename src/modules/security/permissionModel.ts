/**
 * Advanced RBAC Permission & Scope Representation Model.
 *
 * Defines the standard conceptual permission format: <resource>.<action>
 * and the extensible contextual authorization scope (company, plant, warehouse, etc.).
 *
 * This module is pure TypeScript: zero dependencies on React, Express, or persistence.
 */

export interface PermissionDefinition {
  /**
   * Unique permission identifier in standard format: <resource>.<action>
   * e.g., "quality.inspection.read", "quality.ncr.resolve"
   */
  readonly id: string;

  /**
   * The business domain module owning this permission, e.g. "quality", "manufacturing", "inventory"
   */
  readonly module: string;

  /**
   * The targeted resource or entity type, e.g. "inspection", "ncr", "order", "stock"
   */
  readonly resource: string;

  /**
   * The permitted action, e.g. "read", "create", "update", "evaluate", "release", "resolve"
   */
  readonly action: string;

  /**
   * Human-readable description of what this permission grants
   */
  readonly description?: string;
}

/**
 * Extensible organizational and operational context for scoped/data-level authorization.
 * Supports enterprise multi-plant and multi-site isolation without hardcoding business rules.
 */
export interface SecurityScopeContext {
  readonly companyId?: string;
  readonly plantId?: string;
  readonly siteId?: string;
  readonly warehouseId?: string;
  readonly departmentId?: string;
  readonly lineId?: string;
  readonly orgUnitId?: string;
  readonly [customAttribute: string]: unknown;
}

/**
 * Formats a resource and action into standard canonical permission format: <resource>.<action>
 */
export function formatPermissionId(resource: string, action: string): string {
  const cleanResource = resource.trim().toLowerCase();
  const cleanAction = action.trim().toLowerCase();
  return `${cleanResource}.${cleanAction}`;
}

/**
 * Parses a permission string into its resource and action components.
 */
export function parsePermissionId(permissionId: string): { resource: string; action: string } | null {
  if (!permissionId || typeof permissionId !== 'string') {
    return null;
  }
  const parts = permissionId.trim().toLowerCase().split('.');
  if (parts.length < 2) {
    return null;
  }
  const action = parts[parts.length - 1];
  const resource = parts.slice(0, parts.length - 1).join('.');
  return { resource, action };
}

/**
 * Creates a validated PermissionDefinition descriptor.
 */
export function createPermission(
  module: string,
  resource: string,
  action: string,
  description?: string
): PermissionDefinition {
  const id = formatPermissionId(resource, action);
  return {
    id,
    module: module.trim().toLowerCase(),
    resource: resource.trim().toLowerCase(),
    action: action.trim().toLowerCase(),
    description,
  };
}
