export type ErpPersistenceScope = 'ERP_AUTHORITATIVE' | 'UI_TEMPORARY';

const UI_STORAGE_KEY_PATTERNS = [
  'ui_',
  'ui_preferences',
  'erp_ui_preferences',
  'erp_legacy_demo_state',
  'localStorage',
  'view_state',
  'demo_state',
  'client_state',
];

const normalizeCollectionName = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

export const ERP_AUTHORITATIVE_COLLECTIONS = new Set([
  'products',
  'boms',
  'billofmaterials',
  'routings',
  'workcenters',
  'reasoncodes',
  'demands',
  'mpsrecords',
  'productionorders',
  'qualityinspections',
  'ncrs',
  'reworkorders',
  'stockmovements',
  'downtimeevents',
  'costvariances',
  'auditlogs',
  'testingscenarios',
  'suppliers',
  'purchaserequisitions',
  'purchaseorders',
  'goodsreceipts',
  'featureregistry',
  'customfields',
  'workflows',
  'businessrules',
  'subcontractorders',
  'drawings',
  'specifications',
  'toolingitems',
  'workinstructions',
  'qcplans',
  'materialrequests',
  'readinessreports',
  'npiprojects',
  'productreleases',
  'engineeringchanges',
  'machines',
  'manpower',
  'productioncalendars',
  'productionshifts',
  'changeoverrules',
  'productionplans',
  'finiteschedules',
  'whatifscenarios',
  'inventorytransactions',
  'inventoryledger',
  'planningresults',
  'scheduleresults',
  'workflowhistory',
  'materials',
  'materialreservations',
  'materialconsumptions',
  'productionoutputreceipts',
  'featurestatus',
  'approvalrequests',
  'approvaltransactions',
]);

export function isUiOnlyStorageKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return UI_STORAGE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function assertErpSourceOfTruth(scope: ErpPersistenceScope, storageKey: string): void {
  if (scope === 'UI_TEMPORARY' || isUiOnlyStorageKey(storageKey)) {
    throw new Error(`UI temporary storage is not valid ERP source-of-truth: ${storageKey}`);
  }

  if (scope === 'ERP_AUTHORITATIVE') {
    const normalized = normalizeCollectionName(storageKey);
    const isKnownErpCollection =
      ERP_AUTHORITATIVE_COLLECTIONS.has(normalized) ||
      [...ERP_AUTHORITATIVE_COLLECTIONS].some((collection) => normalized.includes(collection));

    if (!isKnownErpCollection) {
      throw new Error(`Unrecognized ERP authoritative storage target: ${storageKey}`);
    }
  }
}

export function classifyStorageIntent(storageKey: string): ErpPersistenceScope {
  if (isUiOnlyStorageKey(storageKey)) {
    return 'UI_TEMPORARY';
  }

  return 'ERP_AUTHORITATIVE';
}
