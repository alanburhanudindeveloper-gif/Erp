/**
 * Quality Domain Permission Declarations.
 *
 * Implements module-level registration into the central RBAC Permission Registry.
 * Follows standard <Resource>.<Action> conceptual format:
 * - quality.inspection.read
 * - quality.inspection.evaluate
 * - quality.inspection.release
 * - quality.ncr.read
 * - quality.ncr.resolve
 */

import { createPermission, type PermissionDefinition } from '../../security/permissionModel';
import { permissionRegistry } from '../../security/permissionRegistry';

export const QUALITY_PERMISSIONS = {
  INSPECTION_READ: 'quality.inspection.read',
  INSPECTION_EVALUATE: 'quality.inspection.evaluate',
  INSPECTION_RELEASE: 'quality.inspection.release',
  NCR_READ: 'quality.ncr.read',
  NCR_RESOLVE: 'quality.ncr.resolve',
} as const;

export const QUALITY_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  createPermission(
    'quality',
    'quality.inspection',
    'read',
    'View quality inspections, measurement characteristics, and defect records'
  ),
  createPermission(
    'quality',
    'quality.inspection',
    'evaluate',
    'Record characteristic measurements and evaluate inspection PASS/FAIL criteria'
  ),
  createPermission(
    'quality',
    'quality.inspection',
    'release',
    'Authorize material release or disposition rejection for inspected lots'
  ),
  createPermission(
    'quality',
    'quality.ncr',
    'read',
    'View Non-Conformance Reports, defect logs, and root cause analyses'
  ),
  createPermission(
    'quality',
    'quality.ncr',
    'resolve',
    'Resolve Non-Conformance Reports, assign root cause, and dispatch scrap/rework'
  ),
];

/**
 * Registers Quality permissions with the system's central PermissionRegistry.
 * Invoked at application initialization.
 */
export function registerQualityPermissions(): void {
  permissionRegistry.registerPermissions(QUALITY_PERMISSION_DEFINITIONS);
}

// Automatically register upon module load
registerQualityPermissions();
