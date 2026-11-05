/**
 * Quality Domain Module Registration.
 *
 * Exposes the official ErpModuleDefinition for the Quality domain,
 * declaring its name, permissions, and dynamic menu contributions.
 */

import { moduleRegistry, type ErpModuleDefinition } from '../../shared/kernel/moduleRegistry';
import { QUALITY_PERMISSION_DEFINITIONS, QUALITY_PERMISSIONS } from './security/qualityPermissions';

export const qualityModuleDefinition: ErpModuleDefinition = {
  id: 'quality',
  name: 'Quality Management',
  description: 'Quality inspections (IQC/IPQC/OQC), Non-Conformance Reports (NCR), quarantine disposition, and rework tracking.',
  enabled: true,
  order: 60,
  status: 'ACTIVE',
  tags: ['core', 'operations', 'quality', 'compliance'],
  permissions: QUALITY_PERMISSION_DEFINITIONS,
  defaultSubTab: 'inspections',
  menuItems: [
    {
      id: 'quality',
      moduleId: 'quality',
      label: 'Quality & Inspeksi',
      order: 60,
      requiredPermission: QUALITY_PERMISSIONS.INSPECTION_READ,
      subItems: [
        {
          id: 'inspections',
          label: 'Quality Inspections (FAI)',
          requiredPermission: QUALITY_PERMISSIONS.INSPECTION_READ,
          order: 10,
        },
        {
          id: 'reject-scrap',
          label: 'Non-Conformance Reports (NCR)',
          requiredPermission: QUALITY_PERMISSIONS.NCR_READ,
          order: 20,
        },
        {
          id: 'rework',
          label: 'Rework Orders',
          requiredPermission: QUALITY_PERMISSIONS.INSPECTION_READ,
          order: 30,
        },
        {
          id: 'quarantine',
          label: 'Quarantine Disposition',
          requiredPermission: QUALITY_PERMISSIONS.INSPECTION_RELEASE,
          order: 40,
        },
      ],
    },
  ],
};

/**
 * Registers the Quality module into the global ModuleRegistry.
 */
export function registerQualityModule(): void {
  moduleRegistry.registerModule(qualityModuleDefinition);
}

// Auto-register on import
registerQualityModule();
