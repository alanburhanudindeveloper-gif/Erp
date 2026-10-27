# Manufacturing ERP — Incremental Refactoring Plan

Status: Approved Architectural Roadmap  
Target: Production-Grade Modular Monolith  
Companion Audit: `docs/architecture/ARCHITECTURE_AUDIT.md`  
Engineering Contract: `docs/architecture/ERP_ARCHITECTURE.md` & `AGENTS.md`  

---

## 1. Executive Strategy & Guiding Principles

This refactoring plan specifies the incremental decomposition of the monolithic `src/lib/services/manufacturingService.ts` (2,432 LOC) and associated God Objects into decoupled domain services, application use cases, and repository interfaces.

### Core Principles
1. **Incremental, Boundary-Based Extraction**: Never rewrite the application in a single pass. Refactor one domain slice at a time.
2. **Preservation of Domain Knowledge**: All manufacturing formulas (BOM explosion, scrap rates, machine capacity, manpower, changeover matrix, 5-bucket inventory, approval matrix) must remain mathematically identical.
3. **Continuous Verification Checkpoint**: After every extraction, the test suite ($\ge 76$ unit tests), TypeScript linter (`tsc --noEmit`), and production build (`vite build`) must pass 100% green before proceeding.
4. **Thin Facade Strategy**: Convert `manufacturingService.ts` into a lightweight delegating facade during the transition so existing React views continue functioning without breaking changes.

---

## 2. Refactoring Inventory & Decomposition Matrix

| Current File | Current Responsibility | Architectural Problem | Target Responsibility | Target Location | Migration Order | Validation Check |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `src/lib/services/manufacturingService.ts` (Lines 167-245) | Global `ErpState` interface combining 35+ domain models. | Extreme type bloat; any field change re-triggers app-wide rebuilds. | Domain-specific state interfaces per bounded context. | `src/modules/*/types/` | **Phase 1** | TypeScript linter: `npm run lint` |
| `src/lib/services/manufacturingService.ts` (Lines 383-446) | Work Order release, dispatching, and operation tracking. | Entangles UI state mutations with business rules and audit logging. | Dedicated Work Order application service and repository. | `src/modules/manufacturing/workOrderService.ts`, `workOrderRepository.ts` | **Phase 2** | `workOrderService.test.ts`, `workOrderRepository.test.ts` |
| `src/lib/services/manufacturingService.ts` (Lines 448-550) | Output reporting, piece counts, scrap logging, and stock movements. | Directly mixes shop floor telemetry with inventory ledger mutations. | Shop floor execution service delegating to inventory ledger. | `src/modules/manufacturing/shopFloorService.ts`, `inventoryLedgerService.ts` | **Phase 3** | `shopFloorService.test.ts`, `inventoryLedgerService.test.ts` |
| `src/lib/services/manufacturingService.ts` (Lines 551-680) | Material reservation, issue, and picking for production orders. | Direct array manipulation in React state; bypasses repository. | Dedicated Material Request and Inventory Application Service. | `src/modules/inventory/materialRequestService.ts`, `inventoryRepository.ts` | **Phase 4** | `materialRequestService.test.ts`, `inventoryRepository.test.ts` |
| `src/lib/services/manufacturingService.ts` (Lines 681-790) | Quality inspections, defect dispositions, and NCR lifecycle. | QA rules mixed with shop floor state; no isolated QA repository. | Quality application service and repository. | `src/modules/quality/qualityService.ts`, `qualityRepository.ts` | **Phase 5** | `qualityService.test.ts`, `qualityRepository.test.ts` |
| `src/lib/services/manufacturingService.ts` (Lines 791-920) | Purchase requisitions, purchase orders, and goods receipts. | Procurement logic embedded in manufacturing orchestrator. | Procurement application service and repository. | `src/modules/procurement/procurementService.ts`, `goodsReceiptService.ts` | **Phase 6** | `procurementService.test.ts`, `goodsReceiptService.test.ts` |
| `src/lib/services/manufacturingService.ts` (Lines 921-1100)| PPIC finite planning, demand parsing, and machine dispatch. | Planning logic mixed with React UI notification handling. | Planning domain service and dispatch coordinator. | `src/modules/planning/planningService.ts`, `productionPlanDispatchService.ts` | **Phase 7** | `planningService.test.ts`, `productionPlanFactory.test.ts` |
| `src/lib/services/manufacturingService.ts` (Lines 1101-1250)| Finite machine scheduling, Gantt slot allocation, changeover. | Scheduling logic coupled to UI state filters. | Scheduling application service and finite schedule factory. | `src/modules/scheduling/schedulingService.ts`, `finiteScheduleFactory.ts` | **Phase 8** | `schedulingService.test.ts`, `finiteScheduleFactory.test.ts` |
| `src/types/index.ts` (1,545 LOC) | Monolithic types file containing 110+ interfaces. | Global coupling; no module boundaries at the type level. | Domain-owned types with backwards-compatible barrel export. | `src/modules/*/types/`, `src/types/index.ts` | **Phase 9** | `npm run lint` & `npm run build` |
| `server.ts` (710 LOC) | Server HTTP bootstrap, AI gateway, telemetry, and ERP routes. | Single file mixing network, external AI SDK, and business auth. | Modular routes, AI infrastructure, and clean server bootstrap. | `src/app/routes/`, `src/infrastructure/ai/` | **Phase 10** | `authorizationService.test.ts`, server health check |

---

## 3. Detailed Extraction Phases & Work Breakdown

### Phase 1: State Separation & Storage Isolation
* **Objective**: Remove authoritative ERP transactions from browser `localStorage`.
* **Actions**:
  1. Audit all keys accessed via `erpStorageAdapter.ts`.
  2. Retain `UI_PREFERENCES_STORAGE_KEY` strictly for UI preferences (theme, column order).
  3. Divert ERP collections to `src/infrastructure/database/repositories/` backed by `ErpCollectionRepository`.
* **Validation**: Run `persistencePolicy.test.ts` to ensure `UI_TEMPORARY` keys cannot enter authoritative storage.

### Phase 2: Manufacturing & Work Order Domain Extraction
* **Objective**: Fully isolate Work Order creation, operation progression, and completion.
* **Actions**:
  1. Route all work order mutations through `IWorkOrderRepository`.
  2. Replace inline logic in `manufacturingService.ts` with calls to `workOrderService.ts` (`planWorkOrder`, `cancelWorkOrder`).
  3. Ensure operations and materials arrays are updated deterministically.
* **Validation**: Run `npx tsx --test "src/modules/manufacturing/*.test.ts"`.

### Phase 3: Inventory 5-Bucket Ledger Extraction
* **Objective**: Enforce strict bucket conservation (`AVAILABLE`, `RESERVED`, `WIP`, `HOLD`, `REJECTED`) and immutable movements.
* **Actions**:
  1. Route all stock movements through `IInventoryRepository`.
  2. Use `transferStockBetweenBuckets` from `inventoryLedgerService.ts` for all inter-bucket transitions.
  3. Prohibit direct stock deletion; require `reverseStockMovement` for compensating reversals.
* **Validation**: Run `npx tsx --test "src/modules/inventory/*.test.ts"`.

### Phase 4: Quality & NCR Boundary Extraction
* **Objective**: Isolate IQC/IPQC/FQC inspections and NCR workflows.
* **Actions**:
  1. Route inspection records and NCRs through `IQualityRepository`.
  2. Delegate tolerance checks and quarantine locks to `evaluateQualityInspection` in `qualityService.ts`.
  3. Delegate NCR resolution with mandatory root cause analysis to `resolveNcr`.
* **Validation**: Run `npx tsx --test "src/modules/quality/*.test.ts"`.

### Phase 5: Procurement & Goods Receipt Boundary Extraction
* **Objective**: Decouple purchase requisitions, PO creation, and goods receipts.
* **Actions**:
  1. Ensure PR approvals strictly enforce role segregation and anti-self-approval via `procurementService.ts`.
  2. Route GRN postings and incoming QC inspection generation through `goodsReceiptService.ts`.
* **Validation**: Run `npx tsx --test "src/modules/procurement/*.test.ts"`.

### Phase 6: Planning & Scheduling Decoupling
* **Objective**: Guarantee that Planning (finite capacity, MPS, MRP) and Scheduling (machine lanes, Gantt, changeover) remain strictly separated.
* **Actions**:
  1. Verify no scheduling logic is merged into `planningService.ts`.
  2. Ensure `planningService.ts` produces `ProductionPlanItem` and feasibility results.
  3. Ensure `schedulingService.ts` consumes plan items and generates `FiniteScheduledSlot` records.
* **Validation**: Run `npx tsx --test "src/modules/planning/*.test.ts" "src/modules/scheduling/*.test.ts"`.

### Phase 7: Types Decoupling & Modular Monolith Seams
* **Objective**: Break the monolithic `src/types/index.ts` into bounded context folders.
* **Actions**:
  1. Create `src/modules/manufacturing/types/index.ts`.
  2. Create `src/modules/inventory/types/index.ts`.
  3. Create `src/modules/quality/types/index.ts`.
  4. Create `src/modules/workflow/types/index.ts`.
  5. Keep `src/types/index.ts` as a re-exporting barrel to prevent breaking any existing file imports.
* **Validation**: Run `npm run lint` to verify zero type errors.

### Phase 8: Server & Infrastructure Modularization
* **Objective**: Separate Express HTTP bootstrap from AI services and ERP route controllers.
* **Actions**:
  1. Extract AI token telemetry, caching, and document extraction into `src/infrastructure/ai/`.
  2. Move `/api/erp/*` route handlers into dedicated controller files under `src/app/routes/`.
  3. Keep `server.ts` as a minimal HTTP listener and middleware mounter.
* **Validation**: Run `authorizationService.test.ts` and verify build.

---

## 4. Verification Checkpoint Protocol

To maintain continuous buildability and zero regression, each phase must pass the four-tier verification check:

```bash
# Tier 1: Unit Test Suite (Must pass all 76+ tests)
npx tsx --test "src/**/*.test.ts"

# Tier 2: Static Typecheck
npm run lint

# Tier 3: Production Vite Build
npm run build

# Tier 4: Git Working Tree Cleanliness
git status --porcelain
```

If any check in Tier 1–3 fails, the engineer must immediately halt the pipeline, diagnose the failure, and repair the boundary before proceeding to the next phase.
