# ERP Architecture Refactoring — Foundation First Plan

A systematic, architectural refactoring blueprint to transform the existing manufacturing ERP application into a maintainable, testable, production-ready modular monolith without breaking existing functionality or introducing new features.

---

> [!IMPORTANT]
> **Confirmed Architectural Contract & User Decisions:**
> 1. **Zero New Features Mandate**: Strictly no new ERP features, dashboards, AI workflows, or speculative modules. Focus is 100% on architecture, boundaries, decoupling, and testability.
> 2. **God Object Priority**: Decomposition of the 2,400+ LOC `manufacturingService.ts` God Object into isolated domain services, clean application use cases, and repository interfaces.
> 3. **Persistence Boundary**: Implementation of the Repository Pattern with a server-authoritative in-memory adapter engineered with explicit seams for PostgreSQL / Drizzle ORM migration. Authoritative ERP data will not live in browser `localStorage`.
> 4. **Domain-Owned Types Strategy**: Gradual extraction of monolithic `src/types/index.ts` (1,500+ LOC) into domain-owned type modules with a centralized backwards-compatible contract re-export.
> 5. **Preservation of Domain Knowledge & Invariants**: All 73 existing automated unit tests covering BOM explosion, finite capacity scheduling, cycle times, 5-bucket inventory, and approval workflows must pass continuously after every single change checkpoint.

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

### Stage 1: Full Architectural Audit (`docs/architecture/ARCHITECTURE_AUDIT.md`)
Perform a deep, non-destructive audit of the current codebase:
* Document all God Objects (`manufacturingService.ts`, `server.ts`, `src/types/index.ts`, `mockData.ts`).
* Map actual dependency directions (UI $\rightarrow$ Store $\rightarrow$ LocalStorage).
* Audit `localStorage` keys and categorize each as UI preference vs ERP source-of-truth.
* Catalog all existing manufacturing domain calculations to guarantee preservation.
* Rank architectural risks (Critical, High, Medium, Low).

### Stage 2: Define Architectural Contract (`docs/architecture/ERP_ARCHITECTURE.md`)
Formalize the structural rules governing all future changes:
* Boundary rules: Module A may not import internal files of Module B; access only via exported public domain contracts.
* Dependency direction: Domain logic must never import UI hooks, components, or infrastructure adapters.
* Repository contract: All database read/writes routed through repository interfaces.

### Stage 3: Decompose `manufacturingService.ts` God Object
Systematically extract mixed responsibilities:
1. **Work Order Repository & Service**: Isolate order creation, operation status tracking, and dispatching.
2. **Item & BOM Repository**: Isolate item master mutations and BOM revisions.
3. **Inventory & Movement Repository**: Route material issues, scrap postings, and bucket adjustments through `inventoryLedgerService`.
4. **Adapter Seam**: Convert `manufacturingService.ts` into a thin delegating facade so existing UI consumers continue operating without disruption during transition.

### Stage 4: Server Boundary Refactoring (`server.ts`)
* Separate HTTP server bootstrapping from application routes and middleware.
* Extract AI telemetry/caching services into `src/infrastructure/ai/`.
* Protect all ERP routes with unified server-side role and permission tokens (`domain.entity.action`).

### Stage 5: Domain Types Decoupling
* Create domain-owned type declarations under each module (`src/modules/manufacturing/types/`, `src/modules/inventory/types/`, etc.).
* Keep `src/types/index.ts` as a backwards-compatible barrel exporter to prevent breaking existing imports.

### Stage 6: Final Architecture Audit & Verification
* Run full verification suite: `npx tsx --test "src/**/*.test.ts"`, `npm run lint`, and `npm run build`.
* Generate `docs/architecture/ARCHITECTURE_AUDIT_FINAL.md` contrasting the "Before" vs "After" system graph and documenting remaining migration seams.

---

## 3. Checkpoint & Verification Strategy

After every discrete extraction step:
1. Run `npx tsx --test "src/**/*.test.ts"` (ensure $\ge 73$ tests pass without regression).
2. Run `npm run lint` (`tsc --noEmit`).
3. Run `npm run build` (`vite build`).
4. Never proceed to the next extraction if a checkpoint fails.
