import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleRegistry } from '../../shared/kernel/moduleRegistry';
import { permissionRegistry, authorizationEngine } from '../security';
import { qualityModuleDefinition, registerQualityModule } from './qualityModule';
import { QUALITY_PERMISSIONS } from './security/qualityPermissions';

test('Quality Module: Declares canonical identity and registers with ModuleRegistry', () => {
  // Ensure module is registered
  registerQualityModule();

  const qualityMod = moduleRegistry.getModule('quality');
  assert.ok(qualityMod, 'Quality module must be registered in moduleRegistry');
  assert.equal(qualityMod.id, 'quality');
  assert.equal(qualityMod.name, 'Quality Management');
  assert.equal(qualityMod.enabled, true);
  assert.equal(qualityMod.status, 'ACTIVE');

  // Verify permissions registered in permissionRegistry
  assert.equal(permissionRegistry.hasPermission(QUALITY_PERMISSIONS.INSPECTION_READ), true);
  assert.equal(permissionRegistry.hasPermission(QUALITY_PERMISSIONS.INSPECTION_EVALUATE), true);
  assert.equal(permissionRegistry.hasPermission(QUALITY_PERMISSIONS.INSPECTION_RELEASE), true);
  assert.equal(permissionRegistry.hasPermission(QUALITY_PERMISSIONS.NCR_READ), true);
  assert.equal(permissionRegistry.hasPermission(QUALITY_PERMISSIONS.NCR_RESOLVE), true);

  // Verify menu items
  assert.ok(qualityMod.menuItems && qualityMod.menuItems.length > 0);
  const mainItem = qualityMod.menuItems[0];
  assert.equal(mainItem.id, 'quality');
  assert.equal(mainItem.requiredPermission, QUALITY_PERMISSIONS.INSPECTION_READ);

  const subItems = mainItem.subItems || [];
  assert.ok(subItems.some((s) => s.id === 'inspections' && s.requiredPermission === QUALITY_PERMISSIONS.INSPECTION_READ));
  assert.ok(subItems.some((s) => s.id === 'reject-scrap' && s.requiredPermission === QUALITY_PERMISSIONS.NCR_READ));
  assert.ok(subItems.some((s) => s.id === 'quarantine' && s.requiredPermission === QUALITY_PERMISSIONS.INSPECTION_RELEASE));
});

test('Quality Module: Dynamic menu visibility respects persona capabilities', () => {
  registerQualityModule();

  // 1. Unauthenticated -> Denied
  assert.equal(moduleRegistry.getAuthorizedMenuItems(null).filter((i) => i.id === 'quality').length, 0);

  // 2. Viewer (no quality read) -> Denied
  const viewerUser = {
    userId: 'usr-v-01',
    roles: ['Viewer'],
    organizationId: 'org-1',
  };
  const viewerItems = moduleRegistry.getAuthorizedMenuItems(viewerUser).filter((i) => i.id === 'quality');
  assert.equal(viewerItems.length, 0, 'Viewer must not see Quality in dynamic menu');

  // 3. Inspector (can inspect, but not release) -> Can see quality, but NOT quarantine disposition
  const inspectorUser = {
    userId: 'usr-insp-01',
    roles: ['Inspector'],
    organizationId: 'org-1',
  };
  const inspectorItems = moduleRegistry.getAuthorizedMenuItems(inspectorUser).filter((i) => i.id === 'quality');
  assert.equal(inspectorItems.length, 1);
  const inspectorSubIds = inspectorItems[0].subItems?.map((s) => s.id) || [];
  assert.ok(inspectorSubIds.includes('inspections'));
  assert.ok(inspectorSubIds.includes('reject-scrap'));
  assert.equal(inspectorSubIds.includes('quarantine'), false);

  // 4. Quality Lead (full quality permissions) -> Sees all quality sub-items
  const leadUser = {
    userId: 'usr-lead-01',
    roles: ['Quality Lead'],
    organizationId: 'org-1',
  };
  const leadItems = moduleRegistry.getAuthorizedMenuItems(leadUser).filter((i) => i.id === 'quality');
  assert.equal(leadItems.length, 1);
  const leadSubIds = leadItems[0].subItems?.map((s) => s.id) || [];
  assert.ok(leadSubIds.includes('quarantine'));
});
