import {
  classifyStorageIntent,
  createInMemoryErpRepository,
} from '../../infrastructure/database/index.ts';

export interface UiPreferences {
  selectedPlant: string;
  activeOrderFilter: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export const LEGACY_ERP_STORAGE_KEY = 'erp_legacy_demo_state_v1';
export const UI_PREFERENCES_STORAGE_KEY = 'erp_ui_preferences_v1';

const legacyStateRepository = createInMemoryErpRepository();
const uiPreferenceRepository = createInMemoryErpRepository();

// Temporary migration adapter.
// This storage layer is intentionally not the true ERP persistence boundary.
// It exists only to keep the demo functional while the backend repository and
// PostgreSQL-backed domain services are introduced incrementally.

export function loadLegacyErpState(): Record<string, unknown> | null {
  const scope = classifyStorageIntent(LEGACY_ERP_STORAGE_KEY);
  if (scope !== 'UI_TEMPORARY') {
    throw new Error(`Legacy demo storage key is not authorized for ERP source-of-truth: ${LEGACY_ERP_STORAGE_KEY}`);
  }

  try {
    const raw = localStorage.getItem(LEGACY_ERP_STORAGE_KEY);
    if (!raw) {
      const stored = legacyStateRepository.list('legacy_state')[0] as Record<string, unknown> | undefined;
      return stored ? (stored.value as Record<string, unknown>) : null;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Strip authoritative server-managed entities so stale values are never restored
    delete parsed.purchaseRequisitions;
    delete parsed.purchaseOrders;
    delete parsed.goodsReceiptNotes;

    legacyStateRepository.save('legacy_state', [{ id: 'snapshot', value: parsed } as Record<string, unknown> & { id: string }]);
    return parsed;
  } catch {
    const stored = legacyStateRepository.list('legacy_state')[0] as Record<string, unknown> | undefined;
    if (stored?.value) {
      const val = { ...(stored.value as Record<string, unknown>) };
      delete val.purchaseRequisitions;
      delete val.purchaseOrders;
      delete val.goodsReceiptNotes;
      return val;
    }
    return null;
  }
}

export function saveLegacyErpState(state: Record<string, unknown>): void {
  const scope = classifyStorageIntent(LEGACY_ERP_STORAGE_KEY);
  if (scope !== 'UI_TEMPORARY') {
    throw new Error(`Legacy demo storage key is not authorized for ERP source-of-truth: ${LEGACY_ERP_STORAGE_KEY}`);
  }

  try {
    // Authoritative ERP entities for migrated modules are never persisted to browser localStorage
    const sanitizedState = { ...state };
    delete sanitizedState.purchaseRequisitions;
    delete sanitizedState.purchaseOrders;
    delete sanitizedState.goodsReceiptNotes;

    const snapshot = { id: 'snapshot', value: sanitizedState };
    legacyStateRepository.save('legacy_state', [snapshot]);
    localStorage.setItem(LEGACY_ERP_STORAGE_KEY, JSON.stringify(sanitizedState));
  } catch {
    // Temporary local demo persistence only; runtime continues without storage.
  }
}

export function clearLegacyErpState(): void {
  try {
    localStorage.removeItem(LEGACY_ERP_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function loadUiPreferences(): UiPreferences {
  const fallback: UiPreferences = {
    selectedPlant: 'PLANT-01',
    activeOrderFilter: 'ALL',
    currentUser: {
      id: 'usr-001',
      name: 'Dewi Lestari',
      role: 'PPIC Supervisor',
    },
    notifications: [],
  };

  try {
    const raw = localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      const stored = uiPreferenceRepository.list('ui_preferences')[0] as Partial<UiPreferences> | undefined;
      return stored ? { ...fallback, ...stored } : fallback;
    }

    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    uiPreferenceRepository.save('ui_preferences', [{ id: 'preferences', ...parsed }]);
    return {
      selectedPlant: parsed.selectedPlant ?? fallback.selectedPlant,
      activeOrderFilter: parsed.activeOrderFilter ?? fallback.activeOrderFilter,
      currentUser: {
        id: parsed.currentUser?.id ?? fallback.currentUser.id,
        name: parsed.currentUser?.name ?? fallback.currentUser.name,
        role: parsed.currentUser?.role ?? fallback.currentUser.role,
      },
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : fallback.notifications,
    };
  } catch {
    const stored = uiPreferenceRepository.list('ui_preferences')[0] as Partial<UiPreferences> | undefined;
    return stored ? { ...fallback, ...stored } : fallback;
  }
}

export function saveUiPreferences(preferences: UiPreferences): void {
  try {
    uiPreferenceRepository.save('ui_preferences', [{ id: 'preferences', ...preferences }]);
    localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // UI preference persistence is best-effort only.
  }
}
