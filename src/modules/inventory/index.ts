// Public Contract of Inventory Bounded Context (Modular Monolith)

export * from './types';
export * from './inventoryRepository';
export * from './inventoryLedgerService';
export {
  type InventoryHealthStatus,
  type InventoryHealthItem,
  type ProductionReadinessResult,
  type MaterialIssueDecision,
  type MaterialReservationDecision,
  type MaterialConsumptionDecision,
  type ScrapDecision,
  type ReversalDecision,
  getInventoryHealth,
  assessProductionOrderReadiness,
  issueMaterialToProduction,
  reserveMaterialsForProduction,
  consumeMaterialsForProduction,
  recordScrapTransaction,
} from './inventoryService';
export * from './materialRequestService';
export * from './application';
export * from './presentation/hooks';
