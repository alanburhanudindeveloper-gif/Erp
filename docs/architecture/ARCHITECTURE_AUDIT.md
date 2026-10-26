# ERP Architecture Audit (Phase 0 Discovery)

Date: 2026-10-26  
Status: Baseline Discovery Complete  
Target: Production-Grade Modular Monolith  

---

## 1. Executive Summary

This audit assesses the structural health of the Manufacturing ERP repository. The application currently functions as a full-stack system consisting of an Express HTTP server (`server.ts`) and a Vite + React SPA frontend. 

While core business capabilities (finite capacity planning, multi-level BOM explosion, 5-bucket inventory, multi-tier approval matrix) are implemented and backed by 73 automated unit tests, the architecture exhibits architectural debt typical of rapid prototyping: several massive "God Objects", tightly coupled global state orchestration, and client-heavy data storage.

This document establishes the empirical baseline for the foundation-first refactoring roadmap.

---

## 2. Current Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION (REACT 19 SPA)                     │
│  • App.tsx: Topbar + Sidebar + Module Routing State                   │
│  • Operations Views: Manufacturing, Planning, Inventory, Quality       │
│  • Workflow View: Approval Center + Decision Drawer                   │
│  • Settings View: Organization, People, RBAC, Approval Matrix         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│   LEGACY STATE ORCHESTRATION  │     │   EXTRACTED DOMAIN SERVICES      │
│   manufacturingService.ts     │     │   • bomExplosionService.ts       │
│   (2,432 LOC God Object)      │────▶│   • shopFloorService.ts          │
│   • Global React Hook State   │     │   • inventoryLedgerService.ts    │
│   • Inline Persistence Sync   │     │   • qualityService.ts            │
│   • LocalStorage Caching      │     │   • workflowMatrixService.ts     │
│   • Cross-Domain Dispatch     │     │   • planningService.ts           │
└───────────────────────────────┘     │   • schedulingService.ts         │
                                      └──────────────────────────────────┘
                                                        │
                                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER & API BOUNDARY                     │
│  • server.ts (695 LOC): Server Bootstrap + AI Gateway + Telemetry      │
│  • Middleware: requireErpAuth (Role/Token Protected ERP Routes)        │
│  • erpServerService.ts: Repository facade for server-side ERP state    │
│  • erpServerRepository.ts: In-memory store (Postgres relational seam)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dependency Map & Direction Analysis

### Critical Dependency Paths
1. **Planning & Scheduling**:
   `PlanningView.tsx` $\rightarrow$ `useManufacturing()` (`manufacturingService.ts`) $\rightarrow$ delegates to `planningService.ts` / `schedulingService.ts` $\rightarrow$ reads `INITIAL_PRODUCTS` / `INITIAL_BOMS` / `INITIAL_MACHINES`.
2. **Manufacturing Execution**:
   `ManufacturingView.tsx` / `ShopFloorTerminal.tsx` $\rightarrow$ `useManufacturing()` $\rightarrow$ `productionExecutionService.ts` / `shopFloorService.ts` $\rightarrow$ mutates React state $\rightarrow$ writes to `localStorage`.
3. **Inventory & Movement Ledger**:
   `InventoryView.tsx` $\rightarrow$ `useManufacturing()` $\rightarrow$ `inventoryLedgerService.ts` / `materialRequestService.ts` $\rightarrow$ writes `StockMovement` records into in-memory array and `localStorage`.
4. **Approval Governance**:
   `WorkflowView.tsx` / `Topbar.tsx` $\rightarrow$ `workflowMatrixService.ts` $\rightarrow$ evaluates condition rules against `ApprovalTransactionRequest`.
5. **Server Endpoints**:
   `server.ts` $\rightarrow$ `requireErpAuth` $\rightarrow$ `erpServerService.ts` $\rightarrow$ `createErpServerRepository()` (in-memory store).

### Architectural Boundary Violations Identified
* **UI $\rightarrow$ LocalStorage**: Direct browser storage calls bypass the server authorization boundary and prevent relational multi-user synchronization.
* **UI State $\leftrightarrow$ ERP Source of Truth**: React component state in `manufacturingService.ts` currently acts as the runtime source of truth for work orders and stock levels instead of an authoritative backend repository.
* **Cross-Domain Entanglement**: `manufacturingService.ts` manages state for 15+ disparate domains simultaneously (Procurement, Maintenance, Tooling, NPI, Testing, Capacity, Costing).

---

## 4. God Objects Audit

| God Object File | LOC | Core Responsibilities | Direct Consumers | Inbound / Outbound Coupling | Refactoring Strategy |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `src/lib/services/manufacturingService.ts` | 2,432 | React state provider, 40+ useState hooks, localStorage sync, CRUD for all ERP entities, action dispatchers. | 18 UI Views, Navigation bars, Modals | **Extreme High**: Imports 60+ types, 40+ mock datasets. | Convert into a thin delegating facade; extract domain state into dedicated domain repositories and custom hooks. |
| `src/types/index.ts` | 1,545 | 100+ interface definitions spanning all ERP domains in a single monolithic file. | Whole codebase | **Extreme High**: Any change triggers full recompilation across 100+ files. | Decompose into domain-owned type modules (`src/modules/*/types.ts`) with a centralized barrel re-export. |
| `server.ts` | 710 | Express bootstrap, Gemini AI client, PO extractor, Work instruction generator, telemetry, ERP route declarations. | Frontend HTTP callers | **High**: Mixes infrastructure AI proxy with ERP business authorization. | Extract AI gateway and telemetry into `src/infrastructure/ai/`; extract route controllers into modular route definitions. |
| `src/lib/mockData.ts` | 4,292 | Master seed datasets for items, routings, machines, workflows, org masters, employees, and user accounts. | Services, tests, components | **High**: Monolithic seed store. | Split into domain-specific seed files (`src/infrastructure/database/seeds/*`). |

---

## 5. Current Persistence Audit

| Data Entity | Current Storage Location | Authoritative Boundary | Migration Target |
| :--- | :--- | :--- | :--- |
| Products & BOMs | Browser `localStorage` + Memory | Frontend UI Store | PostgreSQL `items`, `boms`, `bom_components` |
| Work Orders & Operations | Browser `localStorage` + Memory | Frontend UI Store | PostgreSQL `work_orders`, `work_order_operations` |
| Stock Movements & Ledgers | Browser `localStorage` + Memory | Frontend UI Store | PostgreSQL `stock_movements` (Immutable double-entry) |
| Approval Transactions | In-Memory `mockData.ts` | Local memory | PostgreSQL `approval_transactions`, `approval_logs` |
| Server API Cache | Server in-memory repository | `erpServerRepository.ts` | PostgreSQL via Drizzle ORM |
| AI Telemetry & Budgets | Server in-memory `aiStats` | Server memory | PostgreSQL `ai_usage_logs` / Redis cache |

---

## 6. Current State Management Audit

1. **Client-Side State**:
   - `useManufacturing()` hook in `manufacturingService.ts` holds ~35 state variables (`orders`, `products`, `boms`, `stockMovements`, etc.).
   - Initialized via lazy initializer from `localStorage.getItem('mfg_...')` or falling back to `mockData.ts`.
   - Any state mutation triggers `localStorage.setItem(...)`.
2. **Server-Side State**:
   - `erpServerRepository.ts` holds in-memory maps for `products`, `boms`, `productionOrders`, and `workflows`.
   - Seeded on server startup. Changes made on client via UI do not yet persist back to server store.
3. **Target State Architecture**:
   - Client holds only **presentation/ephemeral UX state** (active tab, search filter query, drawer open/close, sorting direction).
   - Server holds authoritative **ERP transactional state**, accessible via typed repository queries and mutating commands.

---

## 7. Current Security Boundary Audit

* **Authentication**: Token-based header simulation via `x-erp-role` and `x-user-id`.
* **Authorization Middleware**: `requireErpAuth({ requiredRoles: [...] })` enforced on all `/api/erp/*` routes in `server.ts`.
* **Segregation of Duties (SoD)**: Anti-self-approval strictly enforced in `workflowMatrixService.ts` and `procurementService.ts`.
* **Risk Identified**: Frontend currently checks role permissions in UI components (`hasPermission()`). Server must remain the sole authoritative security enforcement gate.

---

## 8. Current Test Coverage Baseline

* **Total Test Suites**: 13 test files.
* **Total Automated Tests**: **73 unit tests** (100% passing).
* **Covered Domains**:
  - BOM Explosion (`bomExplosionService.test.ts`): Multi-level explosion, scrap, cycle detection.
  - Shop Floor Kiosk (`shopFloorService.test.ts`): NIK authentication, operator telemetry, scrap alerts.
  - Inventory Ledger (`inventoryLedgerService.test.ts`): 5-bucket balance, transfer validation, reversals.
  - Work Order Lifecycle (`workOrderService.test.ts`): DRAFT to PLANNED transitions, cancellations.
  - Quality & NCR (`qualityService.test.ts`): IQC/IPQC tolerance evaluation, defect routing, NCR resolution.
  - Workflow Matrix (`workflowMatrixService.test.ts`): Multi-tier conditions, SLA dates, anti-self-approval.
  - PPIC Capacity & Scheduling (`ppicService.test.ts`, `planningService.test.ts`, `schedulingService.test.ts`).
  - Security & Authorization (`authorizationService.test.ts`).
  - Procurement & Receipts (`procurementService.test.ts`, `goodsReceiptService.test.ts`).
* **Uncovered Areas**:
  - Legacy `manufacturingService.ts` orchestrator internal hook transitions.
  - Component rendering edge cases.

---

## 9. Ranked Architecture Risks

| Risk Level | Risk Factor | Impact | Mitigation Strategy |
| :---: | :--- | :--- | :--- |
| **CRITICAL** | Authoritative data living in browser `localStorage` | Data corruption on browser clear; no multi-user consistency. | Implement server repository interface layer with in-memory adapter ready for PostgreSQL. |
| **CRITICAL** | God Object `manufacturingService.ts` | High regression risk when touching any state; impossible to scale modularly. | Extract domain services and convert into delegating facade. |
| **HIGH** | Monolithic `src/types/index.ts` | Global coupling across all domains; type edits cause cascading recompilation. | Decompose into domain-owned type packages. |
| **HIGH** | Server bootstrap entangled with AI & Telemetry | Server crashes if AI configuration fails; violates single responsibility. | Extract AI subsystem into `src/infrastructure/ai/`. |
| **MEDIUM** | Monolithic seed file `mockData.ts` (4.2k LOC) | Difficult to maintain and isolate domain tests. | Split seed data by bounded context. |
| **LOW** | Client-side search and sorting in UI | Slows down on $>1,000$ records. | Prepare repository pagination seams. |
