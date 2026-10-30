# ERP Architecture Refactoring Status

Last updated: 2026-10-30
Current Phase: Frontend Store Modularization & CQRS Integration

---

## 1. Executive Summary

The manufacturing ERP platform has completed both **Architecture Hardening, Dependency Audit & Legacy Removal** and **Frontend Store Modularization & CQRS Integration**. The platform operates as a clean **Modular Monolith with CQRS Application Orchestration**, explicit domain boundaries, isolated AI infrastructure adapters, an authoritative composition root (`src/app/composition/`), a zero-business-logic shared kernel, and feature/module-scoped React presentation hooks connecting the UI to CQRS application handlers.

Validation status:
- **Unit Tests**: **128/128 tests passing** across 15 test suites
- **Type Safety**: **0 errors** (`npm run lint` / `tsc --noEmit`)
- **Production Build**: **Succeeded** (`npm run build` in 1.40s)

---

## 2. Critical Audit Target: `src/lib/services/manufacturingService.ts`

An in-depth investigation was performed on `src/lib/services/manufacturingService.ts` to evaluate its responsibilities and eliminate architectural anti-patterns:

1. **Is it a composition root?**
   *Historically Yes (accidentally).* It was instantiating all 12 domain repositories as top-level singletons.
   *Resolution:* Stripped. Repository instantiation and CQRS wiring are now hosted in an explicit composition root (`src/app/composition/repositories.ts` and `src/app/composition/dependencies.ts`).
2. **Is it a service?**
   *Yes.* It functioned as a God Service containing thousands of lines of mixed domain, state, and UI logic.
3. **Is it a repository factory?**
   *No.* It calls factory functions defined inside individual domain modules (`createWorkOrderRepository`, `createInventoryRepository`, etc.).
4. **Is it persistence infrastructure?**
   *Partially.* It interacts with the localStorage bridge (`saveLegacyErpState`, `saveUiPreferences`) during this transition phase while server-backed persistence is finalized.
5. **Is it still containing business logic?**
   *Significantly Reduced.* Core transaction logic has been extracted into CQRS application handlers. The remaining state transitions in `useErpStore` now directly delegate business operations (`planWorkOrder`, `cancelWorkOrder`, `createPurchaseRequisition`, `approvePurchaseRequisition`, `generateWorkOrderFromPlan`, `transferStockBetweenBuckets`, `reverseStockMovement`, `resolveNcr`) to `erpApplication`.
6. **Does it instantiate repositories?**
   *No longer.* All repository instantiation is now centralized in `src/app/composition/repositories.ts`.
7. **Does it contain unrelated module logic?**
   *Historically Yes.* Now decomposed into feature-level hooks across modules (`procurement`, `inventory`, `quality`, `planning`, `manufacturing`).
8. **Do modules depend on it directly?**
   *Only presentation views:* `PlanningView.tsx`, `MaterialRequestView.tsx`, `NpiView.tsx`, `EngineeringHubView.tsx`, and `App.tsx` import `useErpStore`. No domain logic or repository files depend on it.
9. **Does it create circular or inverted dependencies?**
   *Resolved.* Composition root and module application imports are strictly separated from presentation hooks to guarantee zero circular dependency cycles.
10. **Can it be replaced by a proper composition root?**
    *Yes, and it was replaced.* The composition root is now formally located in `src/app/composition/`, with `repositories.ts` and `dependencies.ts` providing the authoritative dependency graph.

---

## 3. Architecture Audit & Modularization Findings

### 3.1 Domain Boundary Status
- Every module (`manufacturing`, `inventory`, `quality`, `procurement`, `planning`, `scheduling`, `engineering`, `npi`, `maintenance`, `costing`, `master-data`, `workflow`) owns its pure business invariants.
- No domain service imports from Express, React, Vite, or external persistence drivers.
- Invariants (e.g., Segregation of Duties in procurement approvals, BOM revision cutoffs, 5-bucket inventory calculations, root-cause mandatory resolution on NCRs) execute deterministically inside domain entities and services.

### 3.2 Application Boundary Status
- CQRS commands and queries are isolated in module `application/` folders:
  - Commands mutate state via domain entities and persist through repository ports.
  - Queries fetch read models using projections and standard pagination (`paginateItems`).
- Handlers depend strictly on repository interfaces (ports), never on concrete database clients or server singletons.

### 3.3 Infrastructure Boundary Status
- Concrete repositories are implemented via `createErpCollectionRepository` backed by `persistencePolicy.ts` to enforce server-authoritative persistence over UI storage keys.
- **AI Infrastructure Isolation:** Third-party `@google/genai` SDK is completely isolated in `src/infrastructure/ai/aiGatewayAdapter.ts`. Route handlers in `server.ts` communicate through `IAiGateway` and `aiTelemetryService`, ensuring the ERP platform functions deterministically even if the AI provider is offline or unconfigured.

### 3.4 Presentation Boundary & Feature Hooks
- Thin, module-scoped presentation hooks now provide direct data access to CQRS handlers:
  - **Procurement:** `usePurchaseOrders`, `usePurchaseRequisitions`, `useCreatePurchaseRequisition`, `useApprovePurchaseRequisition`
  - **Inventory:** `useInventoryBalance`, `useTransferStock`, `useReverseMovement`
  - **Quality:** `useOpenNcrs`, `useEvaluateInspection`, `useResolveNcr`
  - **Planning:** `useProductionPlans`, `useDispatchProductionPlan`
  - **Manufacturing:** `useWorkOrders`, `usePlanWorkOrder`, `useCancelWorkOrder`
- These hooks keep UI state (pagination, loading, errors, selected items) separate from server-authoritative application state and invoke CQRS handlers without containing domain business rules.

### 3.5 Shared Kernel Status
- `src/shared/kernel/` contains strictly cross-cutting, domain-agnostic primitives:
  - `Result<T, E>`, `ok`, `fail`, `unwrap`, `isOk`, `isFail`
  - `DomainError`, `ValidationError`, `NotFoundError`, `ConflictError`, `AuthorizationError`, `InvariantViolationError`
  - `PaginationQuery`, `PaginatedResult<T>`, `paginateItems`
  - `IDomainEvent`, `createDomainEvent` (Event-driven compatibility foundation)
  - `IUnitOfWork`, `InMemoryUnitOfWork` (Transaction boundary abstraction)
- Zero business-specific logic has leaked into `src/shared/kernel/`.

---

## 4. Work Completed in this Phase

1. **Shared Kernel Event & Transaction Readiness:**
   - Added `IDomainEvent` and `createDomainEvent` to `src/shared/kernel/events.ts`.
   - Added `IUnitOfWork` and `InMemoryUnitOfWork` to `src/shared/kernel/unitOfWork.ts`.
   - Added unit tests in `src/shared/kernel/events.test.ts`.
2. **Authoritative Composition Root:**
   - Created `src/app/composition/repositories.ts` to instantiate all 12 bounded context repositories without circular dependencies.
   - Created `src/app/composition/dependencies.ts` to wire all CQRS command and query handlers into `erpApplication`.
   - Created `src/app/composition/index.ts` public barrel.
   - Added unit test `src/app/composition/composition.test.ts`.
3. **Decoupled & Delegated `manufacturingService.ts`:**
   - Removed direct repository instantiations from `src/lib/services/manufacturingService.ts`, delegating them to `src/app/composition/repositories.ts`.
   - Delegated core store operations directly to `erpApplication` CQRS handlers (`planWorkOrder`, `cancelWorkOrder`, `createPurchaseRequisition`, `approvePurchaseRequisition`, `generateWorkOrderFromPlan`, `transferStockBetweenBuckets`, `reverseStockMovement`, `resolveNcr`).
4. **Feature Presentation Hooks Created:**
   - Procurement: `src/modules/procurement/presentation/hooks/` + tests in `procurementHooks.test.ts`.
   - Inventory: `src/modules/inventory/presentation/hooks/` + tests in `inventoryHooks.test.ts`.
   - Quality: `src/modules/quality/presentation/hooks/` + tests in `qualityHooks.test.ts`.
   - Planning: `src/modules/planning/presentation/hooks/` + tests in `planningHooks.test.ts`.
   - Manufacturing: `src/modules/manufacturing/presentation/hooks/` + tests in `manufacturingHooks.test.ts`.
5. **AI SDK Isolation:**
   - Created `src/infrastructure/ai/aiGatewayAdapter.ts` with `IAiGateway` and `GoogleGenAiGatewayAdapter`.
   - Refactored `server.ts` to remove `@google/genai` from the server file and delegate via the adapter.
   - Added unit test `src/infrastructure/ai/aiGatewayAdapter.test.ts`.
6. **Cross-Module Public Contract Cleanups:**
   - Enforced module public contract barrel imports in planning and quality application commands.
   - Decoupled `UomCode` type import from `manufacturing` in `inventory/types`.

---

## 5. Verification Results

```bash
npx tsx --test "src/**/*.test.ts" && npm run lint && npm run build
```

- **Tests:** 128 tests passed, 0 failed across 15 suites.
- **Type Checking:** 0 errors (`tsc --noEmit`).
- **Linter:** Clean.
- **Build:** Succeeded in 1.40s.

---

## 6. Known Technical Debt

1. **Legacy Views Prop Drilling**:
   `src/App.tsx` still initializes `useErpStore()` and passes handlers down via props to child views. Individual views can now be incrementally switched to consume feature hooks directly.
2. **Mock Data Seeding in Production Code**:
   Initial seed datasets (`mockData.ts`) are currently directly referenced by repository factories when no external database connection is present.
3. **Relational PostgreSQL Driver Integration**:
   Repositories currently use `ErpCollectionRepository` with in-memory authoritative storage. The database schema in PostgreSQL exists via Drizzle ORM, but write paths need full driver integration.

---

## 7. Recommended Next Refactoring Phase

**Recommended Phase: Relational Database Persistence & Drizzle ORM Repository Migration**

Migrate repository implementations from the in-memory `ErpCollectionRepository` to real PostgreSQL database tables using Drizzle ORM, backed by transaction-safe units of work.
