/**
 * Advanced RBAC Role Model & Registry.
 *
 * Implements multi-role assignment for users, role-to-permission mapping,
 * and scope boundary definitions.
 */

import type { SecurityScopeContext } from './permissionModel';

export interface SecurityUser {
  readonly userId: string;
  readonly roles: string[];
  readonly organizationId: string;
  readonly plantScope?: string[]; // e.g. ["PLANT-01", "PLANT-02"] or ["ALL"] or ["*"]
  readonly directPermissions?: string[];
  readonly attributes?: Record<string, unknown>;
}

export interface RoleDefinition {
  readonly name: string;
  readonly description?: string;
  readonly permissions: string[]; // List of permission IDs, e.g. ["quality.inspection.read", "quality.inspection.evaluate"]
  readonly plantScope?: string[];
}

export class RoleRegistry {
  private readonly roles = new Map<string, RoleDefinition>();

  constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Registers or updates a role definition.
   */
  registerRole(role: RoleDefinition): void {
    if (!role || !role.name) {
      throw new Error('Cannot register role without a valid name');
    }
    const normalizedName = role.name.trim();
    this.roles.set(normalizedName, {
      ...role,
      name: normalizedName,
      permissions: [...new Set(role.permissions.map((p) => p.trim().toLowerCase()))],
    });
  }

  /**
   * Adds permissions to an existing role (or creates it if it doesn't exist).
   */
  assignPermissionsToRole(roleName: string, permissions: string[]): void {
    const normalizedName = roleName.trim();
    const existing = this.roles.get(normalizedName);
    const newPerms = permissions.map((p) => p.trim().toLowerCase());

    if (existing) {
      const merged = [...new Set([...existing.permissions, ...newPerms])];
      this.roles.set(normalizedName, {
        ...existing,
        permissions: merged,
      });
    } else {
      this.roles.set(normalizedName, {
        name: normalizedName,
        permissions: [...new Set(newPerms)],
      });
    }
  }

  /**
   * Retrieves a role definition by name.
   */
  getRole(name: string): RoleDefinition | undefined {
    return this.roles.get(name.trim());
  }

  /**
   * Checks whether a role exists.
   */
  hasRole(name: string): boolean {
    return this.roles.has(name.trim());
  }

  /**
   * Returns all permissions granted across a list of user roles.
   */
  getPermissionsForRoles(roles: string[]): string[] {
    const permissions = new Set<string>();
    for (const r of roles) {
      const roleDef = this.roles.get(r.trim());
      if (roleDef) {
        for (const p of roleDef.permissions) {
          permissions.add(p);
        }
      }
    }
    return Array.from(permissions);
  }

  /**
   * Lists all registered roles.
   */
  listRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  /**
   * Initializes standard personas for Kranex ERP.
   */
  private initializeDefaultRoles(): void {
    // 1. Plant Manager: Broad operational authority
    this.registerRole({
      name: 'Plant Manager',
      description: 'Site executive with full operational, planning, and quality release privileges',
      permissions: [
        'quality.inspection.read',
        'quality.inspection.evaluate',
        'quality.inspection.release',
        'quality.ncr.read',
        'quality.ncr.resolve',
        'manufacturing.order.read',
        'manufacturing.order.create',
        'manufacturing.order.release',
        'inventory.stock.read',
        'inventory.stock.transfer',
        'inventory.stock.reverse',
        'inventory.stock.issue',
        'procurement.requisition.read',
        'procurement.requisition.create',
        'procurement.requisition.approve',
        'workflow.task.view',
        'workflow.task.approve',
      ],
      plantScope: ['*'],
    });

    // 2. Quality Lead: Authority over IQC, OQC, NCR dispositions, and quarantined releases
    this.registerRole({
      name: 'Quality Lead',
      description: 'Quality department leader responsible for inspection release and NCR resolution',
      permissions: [
        'quality.inspection.read',
        'quality.inspection.evaluate',
        'quality.inspection.release',
        'quality.ncr.read',
        'quality.ncr.resolve',
        'inventory.stock.read',
        'workflow.task.view',
        'workflow.task.approve',
      ],
      plantScope: ['*'],
    });

    // 3. Supervisor: Shift and shopfloor leadership
    this.registerRole({
      name: 'Supervisor',
      description: 'Production and quality supervisor overseeing operations and evaluations',
      permissions: [
        'quality.inspection.read',
        'quality.inspection.evaluate',
        'quality.ncr.read',
        'manufacturing.order.read',
        'inventory.stock.read',
        'inventory.stock.transfer',
        'inventory.stock.issue',
        'workflow.task.view',
        'workflow.task.approve',
      ],
      plantScope: ['*'],
    });

    // 4. Inspector: Quality control technician
    this.registerRole({
      name: 'Inspector',
      description: 'Quality inspector performing measurements and sample checks',
      permissions: [
        'quality.inspection.read',
        'quality.inspection.evaluate',
        'quality.ncr.read',
        'inventory.stock.read',
        'workflow.task.view',
      ],
    });

    // 5. Planner: Production and material requirements planner
    this.registerRole({
      name: 'Planner',
      description: 'Master scheduling and MRP planner',
      permissions: [
        'quality.inspection.read',
        'quality.ncr.read',
        'manufacturing.order.read',
        'manufacturing.order.create',
        'inventory.stock.read',
        'procurement.requisition.read',
        'procurement.requisition.create',
        'workflow.task.view',
      ],
    });

    // 6. Procurement Manager: Purchasing approvals and vendor contracts
    this.registerRole({
      name: 'Procurement Manager',
      description: 'Procurement head authorizing purchase orders and high-value requisitions',
      permissions: [
        'procurement.requisition.read',
        'procurement.requisition.create',
        'procurement.requisition.approve',
        'inventory.stock.read',
        'workflow.task.view',
        'workflow.task.approve',
      ],
    });

    // 7. Buyer: Purchasing officer creating purchase requisitions and orders
    this.registerRole({
      name: 'Buyer',
      description: 'Procurement buyer submitting supplier orders',
      permissions: [
        'procurement.requisition.read',
        'procurement.requisition.create',
        'inventory.stock.read',
        'workflow.task.view',
      ],
    });

    // 8. Operator: Shopfloor machinery operator
    this.registerRole({
      name: 'Operator',
      description: 'Machine and line operator reporting output and consuming parts',
      permissions: [
        'quality.inspection.read',
        'manufacturing.order.read',
        'inventory.stock.read',
        'inventory.stock.issue',
        'workflow.task.view',
      ],
    });

    // 9. Viewer: Read-only guest persona with no execution or release rights
    this.registerRole({
      name: 'Viewer',
      description: 'Auditor or guest with minimal read-only visibility',
      permissions: [
        'workflow.task.view',
      ],
    });
  }
}

/**
 * Global singleton RoleRegistry instance.
 */
export const roleRegistry = new RoleRegistry();
