import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ModuleRegistry,
  type ErpModuleDefinition,
  type IPermissionRegistry,
  type IAuthorizationEngine,
  type PermissionDefinition,
  type SecurityUser,
} from './moduleRegistry';

class MockPermissionRegistry implements IPermissionRegistry {
  public permissions = new Map<string, PermissionDefinition>();

  registerPermission(permission: PermissionDefinition): void {
    this.permissions.set(permission.id.toLowerCase(), permission);
  }

  hasPermission(permissionId: string): boolean {
    return this.permissions.has(permissionId.toLowerCase());
  }

  getPermission(permissionId: string): PermissionDefinition | undefined {
    return this.permissions.get(permissionId.toLowerCase());
  }
}

class MockAuthorizationEngine implements IAuthorizationEngine {
  constructor(private readonly userPermissionsMap: Record<string, string[]>) {}

  can(user: SecurityUser | null | undefined, permission: string) {
    if (!user || !user.userId) {
      return { allowed: false, code: 'DENIED_UNAUTHENTICATED' };
    }
    const granted = this.userPermissionsMap[user.userId] || [];
    const allowed = granted.includes(permission) || granted.includes('*');
    return {
      allowed,
      code: allowed ? 'GRANTED' : 'FORBIDDEN_PERMISSION',
    };
  }
}

test('Module Registry: Registers modules and exposes enabled status', () => {
  const permReg = new MockPermissionRegistry();
  const authEngine = new MockAuthorizationEngine({});
  const registry = new ModuleRegistry(permReg, authEngine);

  const sampleModule: ErpModuleDefinition = {
    id: 'sample-ops',
    name: 'Sample Operations',
    description: 'Testing module operations',
    enabled: true,
    order: 10,
    status: 'ACTIVE',
    menuItems: [
      {
        id: 'sample-ops',
        moduleId: 'sample-ops',
        label: 'Sample Operations',
        order: 10,
      },
    ],
  };

  registry.registerModule(sampleModule);

  assert.equal(registry.isModuleEnabled('sample-ops'), true);
  assert.equal(registry.getModule('sample-ops')?.name, 'Sample Operations');
  assert.equal(registry.getAllModules().length, 1);

  // Disable module
  registry.disableModule('sample-ops');
  assert.equal(registry.isModuleEnabled('sample-ops'), false);
  assert.equal(registry.getEnabledModules().length, 0);

  // Re-enable module
  registry.enableModule('sample-ops');
  assert.equal(registry.isModuleEnabled('sample-ops'), true);
  assert.equal(registry.getEnabledModules().length, 1);
});

test('Module Registry: Automatically syncs permissions to PermissionRegistry without feature coupling', () => {
  const permReg = new MockPermissionRegistry();
  const authEngine = new MockAuthorizationEngine({});
  const registry = new ModuleRegistry(permReg, authEngine);

  const customPerm: PermissionDefinition = {
    id: 'telemetry.sensor.read',
    module: 'telemetry',
    resource: 'telemetry.sensor',
    action: 'read',
    description: 'Read IoT sensor telemetry',
  };

  registry.registerModule({
    id: 'telemetry',
    name: 'IoT Telemetry',
    description: 'Shopfloor telemetry module',
    enabled: true,
    order: 50,
    status: 'ACTIVE',
    permissions: [customPerm],
  });

  assert.equal(permReg.hasPermission('telemetry.sensor.read'), true);
  assert.equal(permReg.getPermission('telemetry.sensor.read')?.description, 'Read IoT sensor telemetry');
});

test('Module Registry: Handles duplicate registration deterministically', () => {
  const permReg = new MockPermissionRegistry();
  const authEngine = new MockAuthorizationEngine({});
  const registry = new ModuleRegistry(permReg, authEngine);

  const perm1: PermissionDefinition = {
    id: 'ops.task.read',
    module: 'ops',
    resource: 'ops.task',
    action: 'read',
    description: 'Read ops tasks',
  };

  const perm2: PermissionDefinition = {
    id: 'ops.task.execute',
    module: 'ops',
    resource: 'ops.task',
    action: 'execute',
    description: 'Execute ops tasks',
  };

  // Initial registration
  registry.registerModule({
    id: 'ops',
    name: 'Operations Initial',
    description: 'Initial description',
    enabled: true,
    order: 10,
    status: 'ACTIVE',
    permissions: [perm1],
    menuItems: [{ id: 'ops-tasks', moduleId: 'ops', label: 'Tasks', order: 1 }],
    routes: [{ path: '/ops/tasks' }],
  });

  assert.equal(registry.getModule('ops')?.permissions?.length, 1);

  // Duplicate registration with additional permission, menu item, and updated metadata
  registry.registerModule({
    id: 'ops',
    name: 'Operations Updated',
    description: 'Updated description',
    enabled: true,
    order: 10,
    status: 'ACTIVE',
    permissions: [perm1, perm2], // duplicate perm1 + new perm2
    menuItems: [
      { id: 'ops-tasks', moduleId: 'ops', label: 'Tasks', order: 1 },
      { id: 'ops-dispatch', moduleId: 'ops', label: 'Dispatch', order: 2 },
    ],
    routes: [{ path: '/ops/tasks' }, { path: '/ops/dispatch' }],
  });

  const updated = registry.getModule('ops');
  assert.ok(updated);
  assert.equal(updated.name, 'Operations Updated');
  // Permissions should be merged and deduplicated
  assert.equal(updated.permissions?.length, 2);
  // Menu items should be merged and deduplicated
  assert.equal(updated.menuItems?.length, 2);
  // Routes should be merged and deduplicated
  assert.equal(updated.routes?.length, 2);
});

test('Dynamic Menu: Filters menu items and sub-items based on user permissions (Deny by Default)', () => {
  const permReg = new MockPermissionRegistry();
  const authEngine = new MockAuthorizationEngine({
    'usr-lead': ['test.inspection.read', 'test.inspection.release', 'test.ncr.read'],
    'usr-tech': ['test.inspection.read', 'test.ncr.read'],
    'usr-restricted': [],
  });
  const registry = new ModuleRegistry(permReg, authEngine);

  registry.registerModule({
    id: 'test-mod',
    name: 'Test Module',
    description: 'Inspection test module',
    enabled: true,
    order: 20,
    status: 'ACTIVE',
    menuItems: [
      {
        id: 'test-nav',
        moduleId: 'test-mod',
        label: 'Test Nav',
        order: 10,
        requiredPermission: 'test.inspection.read',
        subItems: [
          { id: 'sub-inspect', label: 'Inspections', requiredPermission: 'test.inspection.read' },
          { id: 'sub-ncr', label: 'NCRs', requiredPermission: 'test.ncr.read' },
          { id: 'sub-release', label: 'Release', requiredPermission: 'test.inspection.release' },
        ],
      },
    ],
  });

  // 1. Unauthenticated / Anonymous -> Deny by default
  assert.equal(registry.getAuthorizedMenuItems(null).length, 0);

  // 2. Restricted user without permission -> Denied
  const restrictedUser: SecurityUser = {
    userId: 'usr-restricted',
    roles: ['Viewer'],
  };
  assert.equal(registry.getAuthorizedMenuItems(restrictedUser).length, 0);

  // 3. Technician user -> Can see main item and sub-inspect, sub-ncr, but NOT sub-release
  const techUser: SecurityUser = {
    userId: 'usr-tech',
    roles: ['Technician'],
  };
  const techItems = registry.getAuthorizedMenuItems(techUser);
  assert.equal(techItems.length, 1);
  const techSubIds = techItems[0].subItems?.map((s) => s.id) || [];
  assert.ok(techSubIds.includes('sub-inspect'));
  assert.ok(techSubIds.includes('sub-ncr'));
  assert.equal(techSubIds.includes('sub-release'), false);

  // 4. Lead user -> Can see all sub-items including release
  const leadUser: SecurityUser = {
    userId: 'usr-lead',
    roles: ['Lead'],
  };
  const leadItems = registry.getAuthorizedMenuItems(leadUser);
  assert.equal(leadItems.length, 1);
  const leadSubIds = leadItems[0].subItems?.map((s) => s.id) || [];
  assert.ok(leadSubIds.includes('sub-release'));
});

test('Dynamic Menu: Respects module disablement even if user is authorized', () => {
  const permReg = new MockPermissionRegistry();
  const authEngine = new MockAuthorizationEngine({
    'usr-super': ['*'],
  });
  const registry = new ModuleRegistry(permReg, authEngine);

  registry.registerModule({
    id: 'experimental',
    name: 'Experimental Lab',
    description: 'Experimental testing',
    enabled: true,
    order: 99,
    status: 'EXPERIMENTAL',
    menuItems: [
      { id: 'lab', moduleId: 'experimental', label: 'Lab', order: 1 },
    ],
  });

  const superUser: SecurityUser = {
    userId: 'usr-super',
    roles: ['SuperAdmin'],
  };

  assert.equal(registry.getAuthorizedMenuItems(superUser).length, 1);

  // Disable module
  registry.disableModule('experimental');
  assert.equal(registry.getAuthorizedMenuItems(superUser).length, 0);
});
