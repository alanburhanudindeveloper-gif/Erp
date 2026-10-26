# ERP Architecture Specification & Engineering Contract

Status: Active Governing Architecture  
Target: Production-Grade Modular Monolith  
Last Updated: 2026-10-26  

---

## 1. Architectural Topology & High-Level Flow

The system is organized strictly as a **Modular Monolith**. All code resides in one buildable repository, but runtime boundaries are enforced between architectural layers.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (UI)                         │
│  • React 19 Components, TanStack Data Grids, Views, Forms              │
│  • Owns: Ephemeral UX state (open modals, sorting, active tabs)        │
│  • Rule: MUST NOT contain business rules or direct storage calls       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Calls typed application services
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       APPLICATION & USE CASE LAYER                     │
│  • Commands, Queries, Orchestration, Work Order Release Flow           │
│  • Rule: Coordinates domain entities; enforces transaction boundaries  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Uses pure domain calculations
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN LAYER (CORE)                          │
│  • Pure Functions, Domain Entities, Business Invariants                │
│  • BOM Explosion, Finite Capacity, 5-Bucket Ledger, Approval Matrix    │
│  • Rule: ZERO external dependencies (No React, No Express, No DB)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Defines repository interfaces
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       REPOSITORY BOUNDARY LAYER                        │
│  • IWorkOrderRepository, IInventoryRepository, IBomRepository          │
│  • Rule: Domain specifies contracts; Infrastructure implements them    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Implements persistence
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE & DATABASE                         │
│  • Express HTTP Server, Database Adapters, Cache, External AI Proxy    │
│  • PostgreSQL / Drizzle Relational Store Seams                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Boundaries & Domain Ownership

Each business module operates with explicit domain ownership:

| Domain Module | Primary Ownership Scope | Forbidden Responsibilities |
| :--- | :--- | :--- |
| **`modules/manufacturing`** | Item Master, BOMs, Routings, Machines, Work Orders, Shop Floor Kiosk execution. | Long-range sales forecasts, financial ledger journals. |
| **`modules/planning`** | Demand analysis, MPS, Finite MRP calculation, material shortage assessment. | Machine-level minute dispatching (owned by Scheduling). |
| **`modules/scheduling`** | Machine lane Gantt sequencing, changeover matrix, shift calendar slots. | Releasing purchasing purchase orders (owned by Procurement). |
| **`modules/inventory`** | 5-Bucket Stock ledger (`AVAILABLE`, `RESERVED`, `WIP`, `HOLD`, `REJECTED`), movements, reversals. | Overriding quality inspection outcomes. |
| **`modules/quality`** | IQC, IPQC, FQC inspection gates, defect tolerances (AQL), NCR dispositions. | Material picking on shop floor. |
| **`modules/workflow`** | Condition-based approval matrices, multi-level sign-offs, SoD validation, SLA timers. | Embedding domain-specific calculations. |
| **`modules/organization`**| Company, Plant, Department, Section, Position hierarchy. | Digital user credentials. |
| **`modules/people`** | Physical `EmployeeMaster` (NIK, plant, skill matrix, operator rates). | Assigning software RBAC permissions. |
| **`modules/security`** | Digital `UserAccount`, RBAC roles, permission tokens (`domain.entity.action`), auth checks. | Modifying master manufacturing data. |

---

## 3. Strict Dependency Rules

1. **Rule of Inward Dependency**:
   - Presentation $\rightarrow$ Application $\rightarrow$ Domain.
   - Domain logic must never import from Presentation or Infrastructure.
2. **Rule of Inter-Module Communication**:
   - Module A may NEVER import internal private files of Module B (e.g. `import from '../planning/internalCalculations.ts'` is strictly banned).
   - Module A must only import from the public contract export of Module B (e.g. `import { summarizeProductionPlanning } from '../planning'`).
3. **Rule of Persistence Isolation**:
   - The domain must not know whether records are saved in PostgreSQL, memory, or SQLite.
   - All persistence is accessed through Repository interfaces (`IRepository<T>`).

---

## 4. State Ownership & Persistence Contract

* **Authoritative Source of Truth**:
  The backend database (or server repository in development) is the sole authority for ERP transactions.
* **Prohibition of Browser LocalStorage for Authoritative Data**:
  Browser `localStorage` is permitted **only** for non-critical client UX preferences (e.g. dark/light theme, column width preferences). Storing Work Orders, Inventory movements, or BOM master data in `localStorage` is prohibited.
* **Immutable Double-Entry Ledger**:
  Stock movements are append-only. Modifying or deleting a historical stock movement is prohibited; corrections must be executed via compensating `REVERSAL` movements with mandatory reason codes.

---

## 5. Security Contract (Server-Authoritative)

* **Deny-by-Default**:
  Every server API route must require valid credentials and specific permission tokens (`domain.entity.action`).
* **Segregation of Duties (SoD)**:
  Requesters are strictly barred from approving their own transactions.
* **UI Checks are Hints Only**:
  Hiding buttons or disabling inputs in the React UI is a convenience feature, not a security boundary. The server endpoint must reject unauthorized requests regardless of UI state.

---

## 6. Testing & Quality Verification Contract

* **Automated Regression Protection**:
  Every boundary extraction or refactoring step must maintain **100% green test suite status** (`npx tsx --test`).
* **Deterministic Calculations**:
  All domain calculations (BOM explosion, scrap multiplier, OEE, cycle times, finite capacity) must be pure functions that run deterministically in unit tests without mocking clocks or global state.
