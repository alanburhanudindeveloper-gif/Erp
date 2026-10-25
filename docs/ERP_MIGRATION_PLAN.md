# ERP Migration and Refactor Plan

## 1. Current Repository Reality

The repo already contains a broad manufacturing ERP demo and a functioning Vite + React + TypeScript frontend with an Express server. The codebase includes rich module screens, MRP/planning calculations, manufacturing workflow logic, procurement, quality, engineering, AI document extraction, and operational state management.

The most important architectural reality is that much of the ERP “source of truth” is currently held in a single large React store (`src/lib/services/manufacturingService.ts`) and persisted via browser `localStorage`. This is useful for rapid demo iteration but does not satisfy the target production ERP boundary.

## 2. Current Hotspots

The prompt's key hotspots are accurate:

- `src/lib/services/manufacturingService.ts` is the main god-object and business state container.
- `src/lib/services/ppicService.ts` contains reusable planning and capacity logic, which is a strong base for domain extraction.
- `src/modules/planning/PlanningView.tsx` mixes UI rendering with planning calculations and state orchestration.
- `src/types/index.ts` is broad enough to be split by domain when the refactor begins in earnest.
- `server.ts` is already doing HTTP + AI gateway responsibilities and will likely need a cleaner server structure as the app matures.

## 3. Target Architecture

The target is a modular monolith with explicit boundaries:

```text
React Frontend
  ↓
API Layer
  ↓
Application Services
  ↓
Domain Modules
  ↓
Repositories / Infrastructure
  ↓
PostgreSQL
```

The following responsibilities should be separated:

- UI state: presentation only
- ERP source-of-truth: backend services and repositories
- planning: feasibility and demand evaluation
- scheduling: finite asset allocation
- manufacturing: BOM, routing, work order operations
- inventory: transaction-based balance logic
- workflow: approval orchestration
- security: server-side authz and policy enforcement

## 4. Dependency Problems to Fix

1. `localStorage` is being used for authoritative ERP data instead of a server-side persistence layer.
2. A large state hook owns manufacturing, inventory, governance, planning, and workflow operations in one place.
3. Domain calculations are mixed with UI coordination and view state.
4. The backend currently packages AI and HTTP responsibilities together without a clean app/service split.
5. Domain and presentation concerns are partially coupled in the React modules.

## 5. Migration Order

### Phase 1: Stabilize the contract

- keep the architecture contract in place
- preserve the current build and type safety
- document responsibilities before re-architecting logic

### Phase 2: Separate legacy persistence from UI concerns

- establish a temporary persistence adapter layer
- mark localStorage as legacy migration storage, not source-of-truth
- isolate UI preferences from ERP data
- add explicit boundaries before deeper refactoring

### Phase 3: Split manufacturing responsibility

- break the large store into domain-oriented modules or hooks
- separate product/BOM, routing, work-order, and inventory concerns
- preserve public behavior while extracting domain logic

### Phase 4: Extract planning and scheduling domains

- keep planning as feasibility logic
- keep scheduling as finite allocation logic
- ensure planning and scheduling remain separate, with different outputs

### Phase 5: Move inventory to transaction-ledgers

- ensure stock movement, reservation, and consumption derive from explicit transactions
- preserve auditability and consistency between production and inventory

### Phase 6: Harden security and workflow boundary

- centralize authorization checks in server-side middleware/services
- keep workflow reusable across approval scenarios
- keep UI permission hints separate from actual authorization

### Phase 7: Backend server refactor

- split HTTP, middleware, routes, and AI integration responsibilities
- keep AI as an infrastructure capability and not a transaction authority

### Phase 8: Database-first foundation

- introduce repository abstractions
- define PostgreSQL-friendly entities
- migrate from transient UI state to backend persistence

## 6. Concrete Code Changes to Start

The first safe refactor step is to stop treating all runtime data as if it were safe ERP source-of-truth and instead mark the persistence layer as a temporary migration adapter.

Planned first-step refactor:

- create a dedicated persistence adapter file
- separate UI preferences from ERP state persistence
- clearly label legacy local storage behavior as temporary and deprecated
- keep the application functional while the backend repository layer is introduced

This is the correct incremental boundary because it creates an explicit migration seam without rewriting the full ERP in one pass.

## 7. Risk Areas

The highest-risk files are:

- `src/lib/services/manufacturingService.ts`
- `src/lib/services/ppicService.ts`
- `src/modules/planning/PlanningView.tsx`
- `src/types/index.ts`
- `server.ts`

They should be refactored in order, with one boundary at a time.

## 8. Refactor Safety Rules

- do not delete working functionality
- do not convert the app into a fake ERP
- do not merge planning and scheduling responsibilities
- do not flatten all state into one global store without extraction
- do not make localStorage the final persistence layer
- do not place business rules in React components

## 9. Immediate Next Step

The first code refactor is to introduce a temporary persistence adapter and replace the direct `localStorage` usage in the main store with that adapter. This maintains application behavior while establishing a migration boundary in the source code.
