# ERP Architecture Refactoring — Foundation First Plan

A systematic, architectural refactoring blueprint to transform the existing manufacturing ERP application into a maintainable, testable, production-ready modular monolith without breaking existing functionality or introducing new features.

---

> [!IMPORTANT]
> **Confirmed Architectural Contract & User Decisions:**
> 1. **Zero New Features Mandate**: Strictly no new ERP features, dashboards, AI workflows, or speculative modules. Focus is 100% on architecture, boundaries, decoupling, and testability.
> 2. **Phase 0 Audit Complete**: Comprehensive audit documented in `docs/architecture/ARCHITECTURE_AUDIT.md`, identifying God Objects (`manufacturingService.ts`, `server.ts`, `src/types/index.ts`, `mockData.ts`) and coupling risks.
> 3. **Detailed Extraction Plan Complete**: Multi-phase extraction strategy documented in `docs/architecture/REFACTORING_PLAN.md`, mapping responsibilities, target locations, dependencies, and validation criteria.
> 4. **Persistence Boundary**: Implementation of the Repository Pattern with a server-authoritative in-memory adapter engineered with explicit seams for PostgreSQL / Drizzle ORM migration. Authoritative ERP data will not live in browser `localStorage`.
> 5. **Preservation of Domain Knowledge & Invariants**: All 76 existing automated unit tests covering BOM explosion, finite capacity scheduling, cycle times, 5-bucket inventory, and approval workflows must pass continuously after every single change checkpoint.

---

## 1. Overview & Core Concept

### Target Architectural Topology: Modular Monolith
The application remains deployable as a cohesive unit (Express server + Vite React SPA) while strictly enforcing internal boundaries between UI, application orchestration, domain calculations, and persistence infrastructure.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION (REACT SPA)                        │
│   Operations Hub  │  Workflow Center  │  Settings & Master Data        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (HTTP / Typed API Client)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION & SERVER LAYER                        │
│   Server Entrypoint (server.ts)  │  Route Controllers  │  RBAC Auth    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN MODULE BOUNDARIES                        │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐   │
│  │   Manufacturing Domain      │     │   Planning & Scheduling     │   │
│  │   • BOM Explosion Service   │     │   • Finite Capacity Engine  │   │
│  │   • Work Order Lifecycle    │     │   • Machine Pacing & Gantt  │   │
│  │   • Shop Floor Execution    │     │   • Feasibility Analyzer    │   │
│  └─────────────────────────────┘     └─────────────────────────────┘   │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐   │
│  │   Inventory Ledger          │     │   Workflow & Governance     │   │
│  │   • 5-Bucket Balance Engine │     │   • Condition Matrix Engine │   │
│  │   • Immutable Reversals     │     │   • Multi-tier Sign-Off     │   │
│  │   • Material Allocation     │     │   • SoD & SLA Monitoring    │   │
│  └─────────────────────────────┘     └─────────────────────────────┘   │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐   │
│  │   Quality & Compliance      │     │   Procurement Domain        │   │
│  │   • IQC / IPQC / FQC Gates  │     │   • PR Multi-tier Approval  │   │
│  │   • Quarantine / NCR Dispos │     │   • PO Draft & GRN Postings │   │
│  └─────────────────────────────┘     └─────────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE BOUNDARIES                           │
│   Domain Repository Interfaces (IWorkOrderRepo, IInventoryRepo, etc.)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE & DATABASE ADAPTER                    │
│   Authoritative Server Store  │  Postgres / Drizzle Relational Seams   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phased Execution Roadmap

### Stage 1: Full Architectural Audit (`docs/architecture/ARCHITECTURE_AUDIT.md`) — [COMPLETED]
* Detailed audit of all God Objects (`manufacturingService.ts`, `server.ts`, `src/types/index.ts`, `mockData.ts`).
* Complete mapping of dependency directions and boundary violations.
* Catalog of all existing manufacturing domain calculations to guarantee preservation.
* Risk ranking: CRITICAL (`localStorage` source of truth, `manufacturingService.ts`), HIGH (`src/types/index.ts`, `server.ts`).

### Stage 2: Define Architectural Contract (`docs/architecture/ERP_ARCHITECTURE.md`) — [COMPLETED]
* Boundary rules: Module A may not import internal files of Module B; access only via exported public domain contracts.
* Dependency direction: Domain logic must never import UI hooks, components, or infrastructure adapters.
* Repository contract: All database read/writes routed through repository interfaces (`IWorkOrderRepository`, `IInventoryRepository`, `IQualityRepository`).

### Stage 3: Concrete Refactoring Plan (`docs/architecture/REFACTORING_PLAN.md`) — [COMPLETED]
* Detailed breakdown of `manufacturingService.ts` by line number and responsibility.
* 10-phase incremental migration matrix with target locations and verification checks.

### Stage 4: Incremental Extraction & Facade Decoupling — [READY FOR EXECUTION]
1. **Work Order Domain**: Route order mutations through `IWorkOrderRepository` and `workOrderService.ts`.
2. **Inventory 5-Bucket Ledger**: Route all movements and transfers through `IInventoryRepository` and `inventoryLedgerService.ts`.
3. **Quality & NCR**: Route inspection sheets and NCRs through `IQualityRepository` and `qualityService.ts`.
4. **Thin Facade Conversion**: Convert `manufacturingService.ts` into a lightweight delegator.

### Stage 5: Domain Types Decoupling
* Decompose monolithic `src/types/index.ts` into domain-owned type packages with backwards-compatible re-exports.

### Stage 6: Server & Infrastructure Modularization
* Split `server.ts` into HTTP bootstrap, `src/app/routes/`, and `src/infrastructure/ai/`.

---

## 3. Checkpoint & Verification Strategy

After every discrete extraction step:
1. Run `npx tsx --test "src/**/*.test.ts"` (ensure $\ge 76$ tests pass without regression).
2. Run `npm run lint` (`tsc --noEmit`).
3. Run `npm run build` (`vite build`).
4. Never proceed to the next extraction if a checkpoint fails.
