# Manufacturing ERP — Comprehensive Architecture Audit (Phase 0)

Date: 2026-10-27  
Status: Phase 0 Discovery & Baseline Complete  
Target Architecture: Production-Ready Modular Monolith  

---

## 1. Executive Summary

This architecture audit evaluates the structure, dependencies, state management, and persistence strategy of the Manufacturing ERP repository. The application functions as an enterprise discrete manufacturing system with an Express + TypeScript server and a React 19 + TypeScript SPA frontend.

The application contains substantial, valuable manufacturing domain logic (multi-level BOM explosion with scrap multipliers, finite capacity scheduling, machine changeover matrices, 5-bucket inventory movements, and multi-tier approval matrices) backed by 76 automated unit tests. However, the application currently suffers from significant architectural entanglement, primarily centered around a massive monolithic God Service (`manufacturingService.ts`, 2,432 LOC), browser `localStorage` coupling, and an oversized monolithic type definition file (`src/types/index.ts`, 1,545 LOC).

This document establishes the empirical basis for Phase 0 discovery and guides the incremental refactoring plan.

---

## 2. Source Tree & Component Topology

```text
src/
├── app/                              # Application bootstrap & entrypoints
├── components/                       # Shared & common UI presentation
│   ├── ai/                          # AI modal dialogues & document extractors
│   ├── common/                      # TanStack DataTable, StatusBadge, Modal primitives
│   ├── data-grid/                   # Grid column builders & drawer inspection components
│   └── layout/                      # 3-Pillar Navigation: Sidebar, Topbar, Header Counters
├── infrastructure/                   # Infrastructure, database, server repositories
│   ├── database/                    # Persistence policy & ERP collection repositories
│   │   ├── repositories/            # In-memory store, generic collection repository
│   │   └── persistencePolicy.ts     # Authoritative storage enforcement (rejects UI keys)
│   └── erp/                         # Server-side repository facade & overview aggregators
├── lib/                             # Shared legacy services & seed data
│   ├── calculations/                # MRP calculation routines
│   ├── persistence/                 # Storage adapters & serialization guards
│   ├── services/                    # Legacy orchestrators (manufacturingService, ppicService)
│   └── mockData.ts                  # Monolithic seed dataset (4,292 LOC)
├── modules/                         # Domain Bounded Contexts
│   ├── capacity/                    # Capacity load evaluation & utilization metrics
│   ├── inventory/                   # 5-Bucket ledger engine & material delivery service
│   ├── manufacturing/               # BOM explosion, work order lifecycle, shop floor kiosk
│   ├── planning/                    # Finite MPS, MRP, feasibility analysis, plan dispatch
│   ├── procurement/                 # PR multi-tier approval, PO drafting, GRN receipt
│   ├── quality/                     # IQC/IPQC/FQC gates, AQL tolerances, NCR resolution
│   ├── scheduling/                  # Machine lane Gantt, changeover matrix, shift schedules
│   ├── security/                    # Server-side authorization, token validation, RBAC
│   ├── settings/                    # Organization master, Employee vs User manager
│   ├── testing/                     # Automated scenario testing matrix
│   └── workflow/                    # Condition-based approval matrix & SLA monitoring
└── types/                           # Monolithic type declarations (src/types/index.ts)
```

---

## 3. Dependency Map & Coupling Analysis

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION (REACT 19 SPA)                     │
│  Operations Hub · Workflow Approval Center · Settings & Org Hierarchy │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│   LEGACY GOD ORCHESTRATOR     │     │   EXTRACTED DOMAIN SERVICES      │
│   manufacturingService.ts     │     │   • bomExplosionService.ts       │
│   (2,432 LOC)                 │────▶│   • shopFloorService.ts          │
│   • 35+ useState variables    │     │   • workOrderService.ts          │
│   • Direct localStorage sync  │     │   • inventoryLedgerService.ts    │
│   • Cross-domain action hook  │     │   • qualityService.ts            │
└───────────────────────────────┘     │   • workflowMatrixService.ts     │
                                      │   • planningService.ts           │
                                      │   • schedulingService.ts         │
                                      └──────────────────────────────────┘
                                                        │
                                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE BOUNDARIES (REPOSITORIES)                │
│   • IWorkOrderRepository (productionorders)                            │
│   • IInventoryRepository (stockmovements, products)                    │
│   • IQualityRepository (qualityinspections, ncrs)                      │
│   • PersistencePolicy: Enforces ERP_AUTHORITATIVE collection naming    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER & API BOUNDARY                     │
│  • server.ts (710 LOC): HTTP Bootstrap, AI Gateway, Role Auth         │
│  • Protected Routes: /api/erp/* with requireErpAuth                    │
│  • Server Repository: In-memory store (PostgreSQL/Drizzle seam)        │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Coupling Patterns Identified:
1. **Presentation Coupled to State Orchestrator**:
   18 distinct UI views (`ManufacturingView`, `InventoryView`, `QualityView`, `PlanningView`, etc.) consume `useManufacturing()`, creating a tight coupling where a change to any state variable triggers re-renders across unrelated tabs.
2. **State Orchestrator Coupled to LocalStorage**:
   `manufacturingService.ts` serializes entire domain collections into browser `localStorage` via `erpStorageAdapter.ts`. This breaks multi-user ERP invariants, risks silent storage quota crashes, and bypasses server transaction isolation.
3. **Domain Services Delegated but State Retained in Hook**:
   While pure calculation routines (`bomExplosionService`, `workflowMatrixService`, `planningService`) have been extracted, the results and state arrays are still held in React memory inside `manufacturingService.ts`.

---

## 4. God Objects Audit & Inventory

| God Object | LOC | Responsibilities | Inbound Consumers | Risk Level | Refactoring Action |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `src/lib/services/manufacturingService.ts` | 2,432 | React state container, 35+ state hooks, localStorage persistence, dispatching for 15+ sub-domains. | 18 UI Views, Topbar, Sidebar, Traveler Modal | **CRITICAL** | Decompose into domain repositories (`WorkOrderRepository`, `InventoryRepository`, `QualityRepository`) and thin domain-specific React hooks. |
| `src/types/index.ts` | 1,545 | 110+ interfaces spanning Items, BOMs, Routings, Work Orders, Quality, Procurement, Security, Org. | Whole repository | **HIGH** | Split into domain-owned `types.ts` per module directory; maintain `src/types/index.ts` as a backwards-compatible barrel export. |
| `server.ts` | 710 | Express bootstrap, Gemini AI API integration, AI token budget/cache, PO document extraction, ERP routes. | External HTTP clients | **HIGH** | Separate into HTTP bootstrap (`server.ts`), modular routes (`src/app/routes/`), and AI infrastructure (`src/infrastructure/ai/`). |
| `src/lib/mockData.ts` | 4,292 | Monolithic master seed dataset for all ERP entities. | Tests, server, services | **MEDIUM** | Split into domain seed fixtures under `src/infrastructure/database/seeds/`. |

---

## 5. Current State Management & Persistence Strategies

### Current State Management Strategy:
* **UI Ephemeral State**: Local component `useState` for active tabs, search keywords, modal open/close states, and TanStack Table sorting.
* **Domain State (Legacy)**: Single monolithic React Hook `useManufacturing()` instantiated at the root in `App.tsx` and threaded down to child views via props.
* **Server State**: `erpServerRepository.ts` maintains in-memory collections populated on server boot.

### Current Persistence Strategy:
* **Client Persistence**: `loadLegacyErpState()` / `saveLegacyErpState()` in `localStorage` under `LEGACY_ERP_STORAGE_KEY`.
* **Authoritative Persistence Boundary**: `src/infrastructure/database/repositories/` defines `ErpCollectionRepository` and domain repositories (`IWorkOrderRepository`, `IInventoryRepository`, `IQualityRepository`) enforcing `persistencePolicy.ts` rules.

### Problem with Current Persistence:
* ERP transaction data in `localStorage` violates repository rules in `AGENTS.md`.
* Client mutations do not automatically sync back to the authoritative server database.

---

## 6. Manufacturing Domain Knowledge Catalog

The following manufacturing calculations and logic were audited and **must be preserved without alteration**:

1. **Multi-Level BOM Explosion (`src/modules/manufacturing/bomExplosionService.ts`)**:
   - Recursive explosion with circular loop detection (`hasCycle`).
   - Line-by-line scrap allowances: $\text{GrossQty} = \text{TargetQty} \times \text{QuantityPerUnit} \times (1 + \frac{\text{ScrapPercentage}}{100})$.
   - Net requirements deduction against on-hand available stock.
   - Critical path lead time calculation.

2. **Finite Capacity & Planning (`src/modules/planning/planningService.ts`)**:
   - Machine capacity: $\text{AvailableMinutes} = \text{CapacityHoursPerDay} \times 60 \times \text{EfficiencyRate}$.
   - Workload demand requirement: $\text{RequiredMinutes} = \text{SetupMinutes} + (\text{Quantity} \times \text{RunTimeSecondsPerUnit} / 60)$.
   - Manpower allocation by shift and skill tier.
   - Bottleneck line pacing and 5-Pillar constraint analysis (Machine, Manpower, Tooling, Material, Calendar).

3. **Finite Scheduling & Changeover Matrix (`src/modules/scheduling/schedulingService.ts`)**:
   - Matrix-based sequence changeovers between product categories (e.g. Standard $\rightarrow$ High-Precision setup penalties).
   - Machine lane Gantt schedule slot generation respecting non-overlapping execution.

4. **Inventory 5-Bucket Conservation (`src/modules/inventory/inventoryLedgerService.ts`)**:
   - Strict conservation: $\text{Total} = \text{AVAILABLE} + \text{RESERVED} + \text{WIP} + \text{HOLD} + \text{REJECTED}$.
   - Validation against negative inventory.
   - Compensating immutable reversal transactions (`REVERSAL`).

5. **Shop Floor Telemetry (`src/modules/manufacturing/shopFloorService.ts`)**:
   - Real-time cycle pace calculation and efficiency percentage vs standard.
   - High scrap alarm triggering when scrap rate $\ge 5\%$.

6. **Governance & Segregation of Duties (`src/modules/workflow/workflowMatrixService.ts`)**:
   - Multi-tier dynamic threshold rules by plant, quantity, and nominal amount.
   - Strict anti-self-approval rule blocking requesters from signing off on their own orders.

---

## 7. Ranked Architecture Risks

| Severity | Risk Item | Impact | Remediation Strategy |
| :---: | :--- | :--- | :--- |
| **CRITICAL** | `localStorage` ERP source of truth | Data loss on cache clear; multi-tab inconsistency; lack of relational guarantees. | Shift state management to server repositories with HTTP/API sync. |
| **CRITICAL** | `manufacturingService.ts` God Object | Any change causes regression risk across all 18 views; unmaintainable cognitive load. | Decompose into domain use cases and domain repository providers. |
| **HIGH** | Monolithic `src/types/index.ts` | Any interface addition forces recompilation of the entire application. | Decompose into domain-owned types (`src/modules/*/types/`). |
| **HIGH** | Mixed Server Concerns (`server.ts`) | Server bootstrap fails if external AI credentials/tokens are absent or misconfigured. | Extract AI gateway and telemetry into dedicated infrastructure modules. |
| **MEDIUM** | Monolithic `mockData.ts` (4.2k LOC) | Bloats test suite memory and makes test data isolation difficult. | Split seed data into domain fixtures. |
| **LOW** | Client-side data grid filtering on large arrays | Potential UI lag if dataset exceeds 5,000 items. | Prepare server-side pagination contracts. |
