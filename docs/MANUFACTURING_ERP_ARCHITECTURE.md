# KRANEX INDUSTRIAL ERP — MANUFACTURING OPERATIONS PLATFORM
## PHASE 0: MASTER ARCHITECTURAL BLUEPRINT & GOVERNANCE SPECIFICATION

**Platform:** Kranex Industrial ERP / Configurable Manufacturing Operations Platform  
**Document Code:** KRX-ARCH-PHASE0-2026-V1  
**Status:** Frozen Architecture Baseline  
**Classification:** Enterprise Engineering, PPIC & Product Architecture  

> *Note: For the exhaustive system blueprint, see `/docs/KRANEX_PHASE0_MASTER_ARCHITECTURE.md`.*

---

## 1. PRODUCT VISION & CORE PHILOSOPHY

> **"A modern manufacturing ERP that adapts itself to the enterprise, instead of forcing the enterprise to adapt to the software."**

Kranex Industrial ERP synthesizes the operational depth of Tier-1 manufacturing engines (SAP S/4HANA PP, Oracle Discrete & Process Manufacturing, Microsoft Dynamics 365 Supply Chain) with the intuitive, high-density interaction paradigm of AG Grid and KendoReact.

### Non-Negotiable Core vs. Configurable Boundary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IMMUTABLE & DETERMINISTIC CORE                        │
│   • Multi-level BOM Explosion Math      • Stock Balance & ATP Calculations   │
│   • MRP Gross-to-Net Algorithm          • Immutable Double-Entry Ledger      │
│   • State Machine Transition Guards     • Cryptographic Audit Trail (Who/Why)│
├─────────────────────────────────────────────────────────────────────────────┤
│                          CONFIGURABLE BEHAVIOR                              │
│   • Custom Attributes / Schemas         • Multi-Tier Approval Matrices       │
│   • Dynamic Workflow Stages & Gates     • Planning Horizons & Safety Rules   │
│   • Role-Based Views & Dashboards       • Notification & Trigger Routing     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SECTION A: MASTER FEATURE MAP (P0 – P4 CLASSIFICATION)

```
[P0: FOUNDATIONAL]  ──> Core Master Data, 5-Bucket Ledger, Immutable Audit Trail, Deterministic MRP
        │
[P1: CORE EXECUTION] ──> Production Orders, Shop Floor Kiosk, Swipe Gestures, Procurement Approvals
        │
[P2: ADVANCED MFG]  ──> Finite Capacity Leveling, Gantt Rescheduling, Lot Traceability, Cost Variances
        │
[P3: CONFIG PLATFORM]──> Dynamic Workflow Builder, Custom Attribute Schema, Configurable Dashboards
        │
[P4: AI ASSISTIVE]   ──> Document Extractor, SOP Generation, Anomaly Root-Cause, Token Budgeting
```

| Tier | Category | Domain Feature | Description & Scope | System Placement |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | **CORE** | **Item Master & Dual UOM** | Raw, WIP, FG, Packaging, Consumables with multi-UOM conversions | `src/modules/master-data` |
| **P0** | **CORE** | **BOM Management** | Single/Multi-level BOM, effective dates, revision control, scrap factors | `src/modules/master-data` |
| **P0** | **CORE** | **Routing & Operations** | Work centers, setup/run cycle times, sequence dependencies | `src/modules/master-data` |
| **P0** | **CORE** | **Multi-Bucket Inventory** | 5 discrete states: Available, Reserved, Hold, Rejected, WIP | `src/modules/inventory` |
| **P0** | **CORE** | **Stock Movement Ledger** | Immutable material documents for all receipts, issues, and transfers | `src/modules/inventory` |
| **P0** | **CORE** | **Demand & Sales Orders** | MTS Forecast and MTO Sales Order intake | `src/modules/planning` |
| **P0** | **CORE** | **MPS Time-Bucketing** | Periodic production scheduling converting demand into target supply | `src/modules/planning` |
| **P0** | **CORE** | **Deterministic MRP** | Exact Net Requirement formula calculation & PO/MO action signals | `src/modules/planning` |
| **P0** | **CORE** | **Audit Trail & Governance** | Immutable log recording Who, What, When, Before, After, Reason | `src/modules/admin` |
| **P1** | **CORE** | **Production Orders (MO)** | Full lifecycle from Planned to Closed with BOM allocations | `src/modules/manufacturing` |
| **P1** | **CORE** | **Shop Floor Execution** | Start, pause, resume, output logging (good vs scrap), terminal kiosk | `src/modules/manufacturing` |
| **P1** | **CORE** | **Swipe-to-Action Gestures**| Touch & mouse drag: Swipe Right (Start/Release), Swipe Left (Complete)| `src/modules/manufacturing` |
| **P1** | **CORE** | **Material Backflush & Issue** | Point-of-use consumption and hard reservation tracking | `src/modules/manufacturing` |
| **P1** | **CORE** | **Basic Quality Disposition** | Incoming and in-process sampling with Pass / Fail / Hold rules | `src/modules/quality` |
| **P1** | **CORE** | **Procurement PR & PO** | Tiered requisition approval, purchase orders, dock receiving (GRN) | `src/modules/procurement` |
| **P2** | **ADVANCED** | **Finite Capacity Planning** | Rough-cut workload vs available machine hours, bottleneck alerts | `src/modules/capacity` |
| **P2** | **ADVANCED** | **Interactive Gantt Chart** | Machine dispatch scheduling with predecessor drag-dependencies | `src/modules/manufacturing` |
| **P2** | **ADVANCED** | **Two-Way Lot Genealogy** | Forward trace (FG -> Components) and Reverse trace (Raw -> MOs) | `src/modules/inventory` |
| **P2** | **ADVANCED** | **Non-Conformance & Rework** | Formal NCR tickets, rework routing orders, re-inspection workflows | `src/modules/quality` |
| **P2** | **ADVANCED** | **Standard & Actual Costing** | Planned vs actual material/labor/overhead variance accounting | `src/modules/costing` |
| **P2** | **ADVANCED** | **Station Breakdown Tracking** | Down-tool / down-material events with segregated capacity downtime | `src/modules/maintenance` |
| **P3** | **CONFIGURABLE** | **Custom Field Engine** | Dynamically attach attributes to Items, Orders, and Operations | Configuration Layer |
| **P3** | **CONFIGURABLE** | **Dynamic Workflow Engine** | Configurable order status lifecycles and validation guards | Configuration Layer |
| **P3** | **CONFIGURABLE** | **Approval Matrix Engine** | Threshold-based multi-tier approvals with Segregation of Duties | Configuration Layer |
| **P3** | **CONFIGURABLE** | **Enterprise DataGrid** | Standardized, density-customizable, resizable tabular grid | `src/components/data-grid` |
| **P4** | **AI-ASSISTED** | **Document Extractor** | Supplier PDF/Image quote/PO extraction to structured drafts | `src/components/ai` |
| **P4** | **AI-ASSISTED** | **SOP / WI Generator** | Automatic generation of step-by-step assembly work instructions | `src/components/ai` |
| **P4** | **AI-ASSISTED** | **Root-Cause Anomaly** | Multi-factor Ishikawa/5-Why hypothesis generator for defects | `src/components/ai` |
| **P4** | **AI-ASSISTED** | **Telemetry Budget Guard** | Client token budgeting and cost containment enforcement | `src/components/ai` |

---

## 3. SECTION B: MANUFACTURING DOMAIN MAP & RELATIONSHIP SCHEMA

```
                             [DEMAND MANAGEMENT]
                        (Sales Order MTO / Forecast MTS)
                                       │
                                       ▼
                         [MASTER PRODUCTION SCHEDULE]
                          (Time-Bucketed Net Target)
                                       │
                                       ▼
                         [DETERMINISTIC MRP ENGINE]
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
    [PURCHASE REQUISITION (PR)]                   [PRODUCTION ORDER (MO)]
                │                                             │
                ▼                                             ▼
       [PURCHASE ORDER (PO)]                         [HARD RESERVATIONS]
                │                                             │
                ▼                                             ▼
     [GOODS RECEIPT NOTE (GRN)]                     [WORK ORDERS / ROUTING]
                │                                             │
                ▼                                             ▼
      [INCOMING INSPECTION]                        [SHOP FLOOR EXECUTION]
       (Pass -> Available)                                    │
       (Fail -> Quarantine)                         [MATERIAL CONSUMPTION]
                │                                   (Backflush / Manual Issue)
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                            [INVENTORY LEDGER (5 BUCKETS)]
                      ┌────────────────────────────────────────┐
                      │ AVAILABLE │ RESERVED │ HOLD │ REJECT │ WIP │
                      └────────────────────────────────────────┘
                                       │
                                       ▼
                         [QUALITY DISPOSITION & NCR]
                        (Pass: FG Output / Fail: Rework)
                                       │
                                       ▼
                       [COST VARIANCE SETTLEMENT & GL]
                      (Material, Labor, Overhead Variances)
```

### Cardinality & Structural Invariants

1. **Item 1:N BOM & Routing**: A product may have multiple BOM revisions and alternate routings, but exactly **one active version** during a given effective validity window.
2. **Production Order 1:N Operations (Work Orders)**: Each operation belongs to a sequential routing node executed at a designated Work Center.
3. **Work Order 1:N Output Logs**: An operation accumulates discrete touch logs of Good and Scrap units.
4. **Scrap 1:1 Reason Code**: Every logged defect requires a mandatory standardized reason code (`BR-PROD-007`).
5. **Inventory Balance = Sum of Movement Ledger**: No direct database UPDATE on stock balances; balances are calculated deterministically by summing immutable posted documents (`BR-GLOBAL-004`).
6. **Stock Holding State Isolation**: Materials in the `HOLD` or `REJECTED` bucket cannot be reserved or issued to a Production Order (`BR-INV-003`).
7. **Segregation of Duties (SoD)**: The creator of a purchase requisition cannot approve their own requisition (`BR-PRC-002`).

---

## 4. SECTION C: CONFIGURATION MAP & ENGINE ARCHITECTURE

```
                                  ┌───────────────────────────────┐
                                  │     CONFIGURATION ENGINE      │
                                  └───────────────┬───────────────┘
                     ┌────────────────────────────┼───────────────────────────┐
                     ▼                            ▼                           ▼
        [SCHEMA & FIELD EXTENSION]    [WORKFLOW & APPROVALS]      [UI & ACCESS GOVERNANCE]
        • Custom Attributes           • Multi-Tier Thresholds     • Granular RBAC Permissions
        • Validation Regex / Range    • Segregation of Duties     • Configurable Dashboard
        • Conditional Visibility      • Dynamic State Machines    • Saved DataGrid Views
```

### 1. Custom Fields Architecture
- Supports dynamic schema expansion without table mutations:
  - Data Types: `String`, `Number`, `Currency`, `Boolean`, `Date`, `Enum Select`.
  - Scopes: `ItemMaster`, `BOMHeader`, `WorkOrder`, `PurchaseOrder`, `QualityInspection`.
  - Properties: `required`, `readOnly`, `validationRule`, `defaultValue`.

### 2. Multi-Tier Approval Matrix (`BR-PRC-002`)
- Declarative configuration by document type and valuation thresholds:
  - **Level 1 (< Rp 10.000.000)**: Direct Department Supervisor.
  - **Level 2 (Rp 10.000.000 – Rp 100.000.000)**: Plant Manager.
  - **Level 3 (> Rp 100.000.000)**: Operations Director / CFO.
- **Segregation of Duties (SoD) Invariant**: Requester/Creator is cryptographically prevented from self-approving their own requisition.

### 3. Business Rule Engine & Policy Toggles
- Configurable manufacturing policies:
  - `backflushTiming`: `ON_OPERATION_COMPLETE` vs `ON_FINAL_RECEIPT`.
  - `negativeStockAllowed`: `STRICT_FALSE` (Hard Invariant).
  - `shortageOverridePermission`: Requires `SUPERVISOR_OVERRIDE` role.
  - `overAllocationAllowed`: `FALSE` (Strict ATP check).

---

## 5. SECTION D: IMPLEMENTATION ROADMAP & STATUS AUDIT

| Domain Module | Implementation Status | Current Codebase Location | Refactoring / Hardening Needs |
| :--- | :--- | :--- | :--- |
| **Enterprise DataGrid** | **Completed** | `src/components/data-grid/` | Server-side hook integrated; verified across all 11 modules |
| **Item & Master Data** | **Completed** | `src/modules/master-data/` | Add Custom Field metadata schema builder |
| **BOM & Routings** | **Completed** | `src/modules/master-data/` | Circular-dependency graph check active |
| **Work Centers & Telemetry** | **Completed** | `src/modules/capacity/` | Add multi-shift custom calendar override |
| **Deterministic MRP Engine** | **Completed** | `src/lib/calculations/` | Verified with Page 92 net requirement formula |
| **Multi-Bucket Stock Ledger** | **Completed** | `src/modules/inventory/` | Immutable movements enforced; Hold stock issue blocked |
| **Procurement & GRN Receiving** | **Completed** | `src/modules/procurement/` | Tiered approval threshold and auto-routing to quarantine |
| **Production Order Lifecycle** | **Completed** | `src/modules/manufacturing/`| Lifecycle: Planned → Released → In Progress → Closed |
| **Shop Floor Kiosk & Gestures** | **Completed** | `src/modules/manufacturing/`| Swipe-to-action gesture (Right: Start, Left: Complete) |
| **Quality Disposition & NCR** | **Completed** | `src/modules/quality/` | Release/Reject action integrated with stock buckets |
| **Cost Variance Accounting** | **Completed** | `src/modules/costing/` | Material, labor, machine breakdown variance calculations |
| **Audit Log Ledger** | **Completed** | `src/modules/admin/` | Complete BR-GLOBAL-005 compliance (Who, What, When, Reason)|
| **Finite Capacity Scheduling** | **Partially Implemented** | `src/modules/capacity/` | Add automated forward/backward leveling algorithm |
| **Production Gantt Chart** | **Partially Implemented** | `src/modules/manufacturing/`| Add interactive drag-rescheduling dependencies |
| **Dynamic Workflow Builder** | **Missing (Phase 1 Target)**| `src/modules/admin/` | Visual drag-and-drop workflow state transition designer |
| **Custom Field Schema Admin** | **Missing (Phase 1 Target)**| `src/modules/master-data/` | Runtime form field creator with JSON-schema persistence |

---

## 6. SECTION E: THE 10 HARD DOMAIN INVARIANTS

1. **BR-GLOBAL-001 (Zero Stealth Mutations):** Direct database `UPDATE` on stock balance is forbidden; stock is derived from immutable stock movements.
2. **BR-GLOBAL-002 (Segregation of Duties):** Document creator cannot approve their own requisition.
3. **BR-GLOBAL-003 (Immutable Audit Trail):** Complete audit log capturing Who, What, When, Before, After, Reason Code.
4. **BR-INV-001 (Non-Negative Stock):** Stock balances cannot drop below zero (`negativeStockAllowed: STRICT_FALSE`).
5. **BR-INV-002 (Hard State Isolation):** Materials in `HOLD` or `REJECTED` cannot be issued to production.
6. **BR-PROD-001 (BOM Snapshot Immutability):** Order release freezes active BOM revision snapshot.
7. **BR-PROD-002 (Routing Sequence Guard):** Operation $N$ cannot start until Operation $N-1$ has reported completion.
8. **BR-PROD-003 (Mandatory Scrap Reason Code):** Scrap reported $>0$ strictly requires reason code.
9. **BR-PLAN-001 (Deterministic MRP):** Net requirement math is deterministic and cannot be bypassed.
10. **BR-AI-001 (Advisory AI Boundary):** AI features operate only as advisory draft recommendations; human must approve.
