/**
 * Dynamic Menu Hook for Kranex ERP.
 *
 * Evaluates navigation item visibility and access permissions dynamically
 * based on the user's verified roles/permissions and module enable status.
 *
 * Core Principles:
 * - Module Registry is the single source of truth for available modules.
 * - AuthorizationEngine validates visibility (Deny by default).
 * - UI is reactive: changes in active user or role automatically re-evaluate visible items.
 * - Server remains authoritative for all actual API routes.
 */

import { useMemo } from 'react';
import { useAuthorization } from '../security/presentation/useAuthorization';
import { moduleRegistry, type MenuItemDefinition } from '../../shared/kernel/moduleRegistry';
import type { NavGroup, NavItem } from '../../components/layout/Sidebar';

export interface DynamicMenuResult {
  /**
   * List of menu item definitions authorized for the current user.
   */
  authorizedMenuItems: MenuItemDefinition[];

  /**
   * Filters pre-configured UI NavGroups against ModuleRegistry and AuthorizationEngine.
   */
  filterNavGroups: (groups: NavGroup[]) => NavGroup[];

  /**
   * Checks whether a specific main navigation section is accessible.
   */
  canAccessNav: (navId: string) => boolean;

  /**
   * Checks whether a specific sub-navigation tab is accessible.
   */
  canAccessSubNav: (navId: string, subTabId: string) => boolean;

  /**
   * Checks whether a given ERP module is enabled.
   */
  isModuleEnabled: (moduleId: string) => boolean;
}

export function useDynamicMenu(): DynamicMenuResult {
  const { user, can } = useAuthorization();

  const authorizedMenuItems = useMemo(() => {
    return moduleRegistry.getAuthorizedMenuItems(user);
  }, [user]);

  const authorizedModuleMap = useMemo(() => {
    const map = new Map<string, MenuItemDefinition>();
    for (const item of authorizedMenuItems) {
      map.set(item.id, item);
      map.set(item.moduleId, item);
    }
    return map;
  }, [authorizedMenuItems]);

  const canAccessNav = (navId: string): boolean => {
    const cleanId = navId.trim().toLowerCase();
    // Dashboard and learn are always accessible
    if (cleanId === 'dashboard' || cleanId === 'learn') {
      return true;
    }

    // Check if module is registered and enabled
    if (moduleRegistry.getModule(cleanId) && !moduleRegistry.isModuleEnabled(cleanId)) {
      return false;
    }

    // If registered in dynamic menu, check authorization
    if (authorizedModuleMap.has(cleanId)) {
      return true;
    }

    // For other modules not yet in moduleRegistry, default allow if authenticated
    return Boolean(user && user.roles.length > 0);
  };

  const canAccessSubNav = (navId: string, subTabId: string): boolean => {
    const cleanNavId = navId.trim().toLowerCase();
    const cleanSubId = subTabId.trim().toLowerCase();

    const menuItem = authorizedModuleMap.get(cleanNavId);
    if (!menuItem) {
      return canAccessNav(cleanNavId);
    }

    if (!menuItem.subItems || menuItem.subItems.length === 0) {
      return true;
    }

    return menuItem.subItems.some((sub) => sub.id.toLowerCase() === cleanSubId);
  };

  const filterNavGroups = (groups: NavGroup[]): NavGroup[] => {
    return groups
      .map((group) => {
        const filteredItems: NavItem[] = group.items
          .filter((item) => canAccessNav(item.id))
          .map((item) => {
            const menuItem = authorizedModuleMap.get(item.id.toLowerCase());
            if (!menuItem || !menuItem.subItems || !item.subItems) {
              return item;
            }

            const allowedSubIds = new Set(menuItem.subItems.map((s) => s.id.toLowerCase()));
            const filteredSubItems = item.subItems.filter((sub) =>
              allowedSubIds.has(sub.id.toLowerCase())
            );

            return {
              ...item,
              subItems: filteredSubItems,
            };
          });

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0);
  };

  const isModuleEnabled = (moduleId: string): boolean => {
    return moduleRegistry.isModuleEnabled(moduleId);
  };

  return {
    authorizedMenuItems,
    filterNavGroups,
    canAccessNav,
    canAccessSubNav,
    isModuleEnabled,
  };
}
