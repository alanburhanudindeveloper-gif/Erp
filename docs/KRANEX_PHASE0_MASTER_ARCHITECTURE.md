# KRANEX INDUSTRIAL ERP — PHASE 0 MASTER ARCHITECTURE BLUEPRINT

**Platform:** Kranex Configurable Manufacturing ERP / Manufacturing Operations Platform  
**Document Code:** KRX-ARCH-PHASE0-2026-V1  
**Status:** Frozen Baseline Architecture Specification  
**Classification:** Enterprise Engineering, PPIC & Product Architecture  

---

## EXECUTIVE SUMMARY & PRODUCT CONSTITUTION

> **"A modern manufacturing ERP that adapts itself to the enterprise, instead of forcing the enterprise to adapt to the software."**

Kranex Industrial ERP is engineered as a unified manufacturing operating platform combining Tier-1 functional depth (SAP S/4HANA PP, Oracle Discrete & Process Manufacturing, Microsoft Dynamics 365 Supply Chain) with high-density, low-latency web interactions inspired by KendoReact Grid and AG Grid.

### Non-Negotiable Core vs. Configurable Layer Boundary

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        IMMUTABLE & CONTROLLED SYSTEM CORE                              │
│  • Multi-level BOM Explosion Math             • Stock Balance = Sum(StockMovements)    │
│  • MRP Gross-to-Net Calculations (Page 92)    • Segregation of Duties (SoD) Invariants │
│  • State Machine Transition Guards            • Immutable Cryptographic Audit Trail    │
│  • Finite Work Center Capacity Calculus       • Hard Holding State Inventory Isolation │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                           CONFIGURABLE ENTERPRISE LAYER                                │
│  • Custom Attributes & Schema Extension       • Multi-Tier Approval Matrices & Amounts │
│  • Dynamic Workflow Stages & Custom Statuses  • Shift Schedules & Planning Horizons    │
│  • Table Column Layouts & Density Preferences • Dashboard Widgets & KPI Thresholds     │
│  • Business Policy Toggles (Backflush Timing) • Role & Permission RBAC Grants          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                           AI-ASSISTED ADVISORY COPILOT                                 │
│  • Inbound Document OCR & Quote Extraction    • Generative SOP / Work Instruction Draft│
│  • Defect Root-Cause Hypothesis (5-Why/Fish) • Token Budgeting & Telemetry Cap Guards  │
│  *(Invariant: AI NEVER writes directly to the immutable inventory ledger or financials)* │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: MASTER FEATURE MAP (P0 – P4 CLASSIFICATION)

The capability matrix categorizes all enterprise features into 5 operational tiers:

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

### Complete Capability Matrix

| Tier | Category | Domain Capability | Functional Scope & Specification | Current Status | System Codebase Placement | Hard Rule / Invariant |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | Master Data | **Item Master & Dual UOM** | SKU catalog (Raw, WIP, FG, Packaging, Consumables) with dual unit-of-measure conversions (e.g. 1 Coil = 2,500 KG; 1 Sheet = 1.25 m²). | **Completed** | `src/modules/master-data/` | SKU code immutable once transactions exist. |
| **P0** | Master Data | **BOM Management** | Single & Multi-level BOM hierarchy, effective validity dates, revision tracking (Rev A, B, C), and scrap/shrinkage allowances. | **Completed** | `src/modules/master-data/` | Circular BOM component references strictly rejected. |
| **P0** | Master Data | **Routing & Operations** | Work Centers, sequence numbers (01 Cutting, 02 Assembly), setup times, standard unit run times, and transfer batch sizes. | **Completed** | `src/modules/master-data/` | Sequence precedence must form an acyclic directed graph. |
| **P0** | Inventory | **5-Bucket Inventory Ledger** | Segregated stock status buckets: `AVAILABLE`, `RESERVED`, `HOLD`, `REJECTED`, and `WIP`. | **Completed** | `src/modules/inventory/` | Negative stock forbidden (`STRICT_FALSE`). |
| **P0** | Inventory | **Immutable Stock Movements** | Double-entry material movements (Receipt, Issue, Transfer, Adjustment). No direct balance mutation (`UPDATE balance`). | **Completed** | `src/modules/inventory/` | Balance strictly calculated as `Sum(Movements)`. |
| **P0** | Planning | **Deterministic MRP Engine** | Mathematical gross-to-net engine calculating net component shortages across lead time horizons. | **Completed** | `src/lib/calculations/` | Formula: `Net = Max(0, Gross - Available - ScheduledReceipts + SafetyStock)`. |
| **P0** | Governance | **Audit Trail & Event Log** | Immutable event log capturing Who, What, When, Before state, After state, and Reason Code. | **Completed** | `src/modules/admin/` | Tamper-proof audit logs; deletion disabled. |
| **P1** | Manufacturing | **Production Orders (MO)** | Order lifecycle: `PLANNED` → `RELEASED` → `IN_PROGRESS` → `COMPLETED` → `CLOSED`. Freezes active BOM snapshot. | **Completed** | `src/modules/manufacturing/` | Snapshot frozen on release; unaffected by future master BOM edits. |
| **P1** | Manufacturing | **Shop Floor Execution** | Operator touchscreen interface: start, pause, resume work orders; record good output and scrap. | **Completed** | `src/modules/manufacturing/` | Operation N cannot start until Operation N-1 completes. |
| **P1** | Manufacturing | **Swipe-to-Action Gestures** | Mobile/tablet touch and drag interaction: Swipe Right to Start/Release, Swipe Left to Complete. | **Completed** | `src/modules/manufacturing/` | Fallback physical click buttons always present. |
| **P1** | Manufacturing | **Material Consumption & Backflush** | Point-of-use consumption either automatic upon operation complete or manual via material issue request. | **Completed** | `src/modules/manufacturing/` | Material issue creates hard reservation deduction. |
| **P1** | Procurement | **Tiered Requisitions (PR)** | Requisition creation with multi-level approval matrix based on total nominal threshold. | **Completed** | `src/modules/procurement/` | Segregation of Duties: Creator cannot approve own PR. |
| **P1** | Procurement | **Purchase Orders & GRN** | PO dispatch to vendor, dock receipt (GRN) posting, and automatic quarantine routing. | **Completed** | `src/modules/procurement/` | Uninspected receipts land in `HOLD` quarantine bucket. |
| **P1** | Quality | **Incoming & In-Process QC** | Inspection lots, sample sizes, pass/fail/hold dispositions, and lot tagging. | **Completed** | `src/modules/quality/` | Failed inspection automatically transfers to `REJECTED`. |
| **P2** | Capacity | **Finite Capacity Planning** | Rough-cut and finite machine load analysis; detects machine bottlenecks vs available shift hours. | **Completed** | `src/modules/capacity/` | Machine capacity cannot exceed 24 hours/day. |
| **P2** | Manufacturing | **Interactive Gantt Scheduling**| Timeline visualization of order sequences across work centers with drag-and-drop dispatching. | **Partially Implemented** | `src/modules/manufacturing/` | Rescheduling preserves routing precedence constraints. |
| **P2** | Inventory | **Two-Way Lot Traceability** | Upstream genealogy (FG lot to raw material coils) and Downstream genealogy (Raw lot to all affected MOs). | **Completed** | `src/modules/inventory/` | Complete containment query within < 50ms. |
| **P2** | Quality | **NCR & Rework Routing** | Non-Conformance Report ticketing, root-cause tagging, and creation of dedicated Rework MOs. | **Completed** | `src/modules/quality/` | Rework orders track labor and material separately. |
| **P2** | Costing | **Standard vs Actual Costing** | Absorption costing: Planned vs Actual Material Variance, Labor Variance, and Machine Breakdown Variance. | **Completed** | `src/modules/costing/` | Variances post to separate GL account codes. |
| **P2** | Maintenance | **Station Breakdown Tracking** | Machine down-tool events; segregates downtime into breakdown, tooling, starvation, and maintenance. | **Completed** | `src/modules/maintenance/` | Breakdown automatically halts active work center jobs. |
| **P3** | Config Engine | **Custom Field Schema Admin** | Dynamic attribute generator (String, Number, Date, Select) attached to Items, BOMs, MOs, and QC records. | **Target Phase 1** | `src/modules/master-data/` | Custom fields persist as validated JSON schemas. |
| **P3** | Config Engine | **Dynamic Visual Workflow Builder** | Drag-and-drop state machine builder configuring custom status transitions, approval gates, and notifications. | **Target Phase 1** | `src/modules/admin/` | State machine must prevent unreachable deadlocks. |
| **P3** | Config Engine | **Enterprise DataGrid System** | Standardized grid across all 11 modules: server-side paging, dynamic filtering popovers, density toggle. | **Completed** | `src/components/data-grid/` | Zero layout shift; compact monospace numeric alignment. |
| **P3** | Config Engine | **Dashboard & Widget Layout** | Configurable role-based KPI widgets (OEE, OTIF, Scrap Rate, Bottleneck stations). | **Completed** | `src/modules/dashboard/` | Role-based dashboard defaults (Planner, Plant Mgr, Operator). |
| **P4** | AI Advisory | **Supplier Document Extractor** | Multi-modal OCR extracting raw supplier POs/invoices into structured ERP draft tables. | **Completed** | `src/components/ai/` | Human must review and click "Approve" before ledger commit. |
| **P4** | AI Advisory | **Generative SOP & Work Instructions** | LLM assistant generating standard operating procedure steps from BOM and routing specifications. | **Completed** | `src/components/ai/` | Drafts marked with advisory disclaimer. |
| **P4** | AI Advisory | **Root-Cause Anomaly Hypothesis** | Multi-factor defect diagnosis tool generating 5-Why and Ishikawa cause hypotheses from scrap logs. | **Completed** | `src/components/ai/` | Suggestions tagged as advisory insights. |
| **P4** | AI Advisory | **Telemetry Budget Governor** | Token and cost containment monitor capping client-side inference to predetermined daily thresholds. | **Completed** | `src/components/ai/` | Automatic cut-off when daily token budget is reached. |

---

# SECTION 2: MANUFACTURING DOMAIN MAP & ENTITY RELATIONSHIPS

### 1. Unified Operational Data Flow

```
                                    ┌────────────────────────┐
                                    │   DEMAND MANAGEMENT    │
                                    │ • Sales Orders (MTO)   │
                                    │ • Sales Forecast (MTS) │
                                    └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │      MASTER PLAN       │
                                    │ • Time-Bucketed MPS    │
                                    │ • Safety Stock Buffer  │
                                    └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │   DETERMINISTIC MRP    │
                                    │ Gross-to-Net Engine    │
                                    └─────┬────────────┬─────┘
                     ┌────────────────────┘            └────────────────────┐
                     ▼                                                      ▼
        ┌─────────────────────────┐                            ┌─────────────────────────┐
        │   PURCHASE REQUISITION  │                            │    PRODUCTION ORDER     │
        │ • Multi-Tier Approval   │                            │ • Frozen BOM Snapshot   │
        │ • SoD Prevention Guard  │                            │ • Hard Reservations     │
        └────────────┬────────────┘                            └────────────┬────────────┘
                     │                                                      │
                     ▼                                                      ▼
        ┌─────────────────────────┐                            ┌─────────────────────────┐
        │     PURCHASE ORDER      │                            │  WORK ORDER OPERATIONS  │
        │ • Vendor Confirmation   │                            │ • Sequenced Routing     │
        │ • Dock Schedule Date    │                            │ • Work Center Assign    │
        └────────────┬────────────┘                            └────────────┬────────────┘
                     │                                                      │
                     ▼                                                      ▼
        ┌─────────────────────────┐                            ┌─────────────────────────┐
        │   GOODS RECEIPT (GRN)   │                            │   SHOP FLOOR KIOSK      │
        │ • Quantity Check        │                            │ • Swipe Gestures        │
        │ • Auto-Quarantine (Hold)│                            │ • Good & Scrap Logging  │
        └────────────┬────────────┘                            └────────────┬────────────┘
                     │                                                      │
                     ▼                                                      ▼
        ┌─────────────────────────┐                            ┌─────────────────────────┐
        │   INCOMING QC LOT       │                            │  MATERIAL CONSUMPTION   │
        │ • Pass: -> Available    │                            │ • Backflush / Issue     │
        │ • Fail: -> Rejected     │                            │ • WIP Lot Tracking      │
        └────────────┬────────────┘                            └────────────┬────────────┘
                     │                                                      │
                     └──────────────────────┬───────────────────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │     5-BUCKET INVENTORY LEDGER         │
                        │ ┌───────────┬──────────┬────────────┐ │
                        │ │ AVAILABLE │ RESERVED │    HOLD    │ │
                        │ ├───────────┼──────────┴────────────┤ │
                        │ │ REJECTED  │  WORK-IN-PROCESS(WIP) │ │
                        │ └───────────┴───────────────────────┘ │
                        └───────────────────┬───────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │      QUALITY DISPOSITION & NCR        │
                        │ • Non-Conformance Tickets            │
                        │ • Rework Work Orders                  │
                        │ • Release to FG Available Stock       │
                        └───────────────────┬───────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │     COST VARIANCE & SETTLEMENT        │
                        │ • Standard Cost Baseline              │
                        │ • Material Usage Variance             │
                        │ • Labor & Overhead Efficiency Var     │
                        │ • Machine Breakdown Variance          │
                        └───────────────────────────────────────┘
```

### 2. Core Entities, Keys & Cardinalities

```
[ItemMaster] 1 ────────── N [BOMHeader] 1 ────────── N [BOMItem] (Component)
     │ 1
     └─────────── N [RoutingHeader] 1 ─────── N [RoutingOperation]
                         │ 1                         │ 1
                         │                           │
[ProductionOrder] 1 ─────┼───────────────────────────┴─────── N [WorkOrderOperation]
     │ 1                 │                                            │ 1
     │                   │                                            │
     ├────── N [MaterialReservation]                                  ├────── N [OutputLog] (Good/Scrap)
     │                                                                │
     └────── N [StockMovement] ───────────────────────────────────────┘
                     ▲
                     │
[PurchaseOrder] 1 ───┴─── N [GoodsReceiptNote (GRN)] 1 ─── 1 [QCInspectionLot]
```

1. **ItemMaster (`Item`)**
   - *PK:* `id` (e.g. `raw-steel-coil`, `fg-hydraulic-arm`)
   - *Attributes:* `code`, `name`, `category` (RAW, WIP, FG, CONSUMABLE), `baseUom`, `secondaryUom`, `uomConversionRate`, `safetyStock`, `standardCost`, `leadTimeDays`.
   - *Relations:* Has Many `BOMHeader`, Has Many `RoutingHeader`, Has Many `StockMovement`.

2. **BOMHeader & BOMItem**
   - *PK:* `id`, `bomCode`, `revision` (`Rev.01`, `Rev.02`), `effectiveFrom`, `effectiveTo`, `isActive`.
   - *BOMItem:* `componentItemId`, `quantityPerParent`, `scrapPercentage`, `backflushEnabled`.
   - *Cardinality:* 1 Item : N BOMs (only 1 active at any date). 1 BOM : N BOMItems.

3. **RoutingHeader & RoutingOperation**
   - *PK:* `id`, `routingCode`, `itemId`, `version`, `isActive`.
   - *RoutingOperation:* `operationNumber` (10, 20, 30), `workCenterId`, `description`, `setupMinutes`, `runMinutesPerUnit`, `predecessorOpNumber`.
   - *Cardinality:* 1 Routing : N Operations.

4. **WorkCenter & Machine**
   - *PK:* `id` (e.g. `wc-cnc-01`, `wc-weld-02`), `code`, `name`, `dailyCapacityMinutes`, `hourlyOverheadRate`, `hourlyLaborRate`, `status` (ONLINE, DOWN, SETUP).
   - *Relations:* Has Many `WorkOrderOperation`, Has Many `DowntimeEvent`.

5. **ProductionOrder (MO)**
   - *PK:* `id` (e.g. `mo-2026-00124`), `orderNumber`, `itemId`, `targetQuantity`, `goodQuantity`, `scrapQuantity`, `status` (PLANNED, RELEASED, IN_PROGRESS, COMPLETED, CLOSED), `startDate`, `dueDate`, `snapshotBomRevision`.
   - *Relations:* Has Many `WorkOrderOperation`, Has Many `MaterialReservation`, Has Many `CostVariance`.

6. **WorkOrderOperation**
   - *PK:* `id`, `productionOrderId`, `operationNumber`, `workCenterId`, `status` (PENDING, READY, RUNNING, PAUSED, COMPLETED), `plannedMinutes`, `actualMinutes`.
   - *Relations:* Has Many `OutputLog`.

7. **5-Bucket Inventory Ledger (`StockMovement`)**
   - *PK:* `id` (e.g. `sm-90412`), `documentNumber`, `timestamp`, `itemId`, `fromBucket`, `toBucket`, `quantity`, `uom`, `referenceType` (PO_RECEIPT, MO_ISSUE, MO_OUTPUT, QC_SCRAP, TRANSFER), `referenceId`, `lotNumber`, `operatorId`.
   - *Hard Rule:* Balances are computed via `GROUP BY itemId, bucket; SUM(quantity)`.

8. **PurchaseRequisition (PR) & PurchaseOrder (PO)**
   - *PK:* `id`, `prNumber`, `requestedBy`, `totalAmount`, `status` (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, PO_GENERATED).
   - *PO:* `id`, `poNumber`, `vendorId`, `totalAmount`, `status` (OPEN, RECEIVED, CLOSED), `paymentTerms`.

9. **QualityInspection & NCR**
   - *PK:* `id`, `inspectionType` (INCOMING, IN_PROCESS, FINAL), `referenceId`, `itemId`, `lotNumber`, `sampleQuantity`, `disposition` (PENDING, PASS, FAIL, CONCESSION), `inspectorId`.
   - *NCR:* `id`, `ncrNumber`, `defectCategory`, `reasonCode`, `reworkOrderId`.

---

# SECTION 3: CONFIGURATION MAP (USER-ADJUSTABLE SETTINGS)

To preserve enterprise agility without compromising core accounting and manufacturing determinism, Kranex establishes strict architectural boundaries between what is **strictly locked** vs. what is **user-configurable**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION ENGINE ARCHITECTURE                               │
└───────────────────────────────────┬────────────────────────────────────────────────────┘
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ SCHEMA ADMIN │            │ WORKFLOW/SoD │            │ POLICY ADMIN │
│ • Attributes │            │ • Approvals  │            │ • Backflush  │
│ • Custom UOM │            │ • Gate Rules │            │ • Tolerances │
│ • Form Layout│            │ • Lifecycle  │            │ • Over-Issue │
└──────────────┘            └──────────────┘            └──────────────┘
```

### 1. Controlled Core vs. Configurable Scope

| Capability Domain | Strictly Locked (Controlled Core) | User-Configurable (Enterprise Layer) |
| :--- | :--- | :--- |
| **Inventory Accounting** | Stock balances must equal `Sum(StockMovement)` ledger. Negative stock forbidden. Double-entry posting. | Warehouse locations, bin naming, lot tracking rules, cycle count schedules, FIFO vs Average valuation. |
| **MRP Planning** | Gross-to-net algebraic formula (`Page 92`). Lead time offset math. | Planning horizon (days), safety stock buffers per item, order lot-sizing rules (L4L, Fixed Order Qty). |
| **BOM Explosion** | Parent-to-component multiplier formula. Circular reference prevention. | Yield loss percentage, scrap factors, alternate components, backflush timing triggers. |
| **Work Center Capacity**| Total minutes per day cannot exceed 1,440. Predecessor operation ordering. | Daily shift schedules (1, 2, or 3 shifts), hourly labor and machine overhead financial rates. |
| **Procurement & SoD** | Creator cannot approve own requisition (`BR-PRC-002`). Audit trail must record approval. | Approval tiers (<10M, 10M–100M, >100M), designated approval role per tier, escalation timeouts. |
| **Quality Control** | Holding/Rejected bucket cannot be issued to production (`BR-INV-003`). | Inspection sample size formulas, mandatory measurement checklists, AQL tolerance thresholds. |
| **Shop Floor Kiosk** | Operation N cannot start before Operation N-1. Scrap must have reason code. | Default UI view (Station vs Plant), swipe threshold sensitivity, auto-refresh intervals. |
| **Audit & Security** | Event log is immutable and cannot be edited or deleted. | Notification subscriptions, webhook event listeners, retention archive rules. |

### 2. Deep Dive: The 5 Configuration Engines

#### A. Custom Field Schema Engine
Allows system administrators to append custom attributes to core entities without altering relational database tables or breaking migrations:
- **Supported Entities:** `ItemMaster`, `BOMHeader`, `WorkOrder`, `PurchaseOrder`, `QualityInspection`.
- **Field Data Types:**
  - `Text / String`: Single-line alphanumeric with regex validation pattern.
  - `Number / Decimal`: Numeric with minimum, maximum, and decimal precision.
  - `Currency`: Multi-currency monetary values.
  - `Boolean`: Checkbox / toggle switch.
  - `Date / Timestamp`: Calendar picker with future/past constraints.
  - `Enum Dropdown`: Configurable single or multi-select option list.
- **Form Layout Control:** Administrators can drag fields into custom fieldsets, mark fields as mandatory (`required`), or conditionally render fields based on item category.

#### B. Dynamic Multi-Tier Approval Matrix Engine (`BR-PRC-002`)
Enforces corporate delegation of authority policies with automated routing:
```
┌──────────────────────────┬─────────────────────────────┬───────────────────────────┐
│ Requisition Amount Range │ Approver Role Required      │ Segregation of Duties     │
├──────────────────────────┼─────────────────────────────┼───────────────────────────┤
│ Rp 0 — Rp 10.000.000     │ Department Supervisor       │ Creator cannot approve    │
│ Rp 10.000.001 — 100.000M │ Plant Operations Manager    │ Requires Tier 1 + Tier 2  │
│ > Rp 100.000.000         │ Operations Director / CFO   │ Requires Tier 1, 2, and 3 │
└──────────────────────────┴─────────────────────────────┴───────────────────────────┘
```
- **Configurable Attributes:** Threshold currency boundaries, proxy delegators during leave, auto-escalation timer (e.g. 24 hours to reminder).

#### C. Manufacturing Business Policy Toggles
Configurable operational policies managed by the Plant Manager:
- `backflushTrigger`: `ON_OPERATION_COMPLETED` (recommended for discrete) vs `ON_FINAL_FG_RECEIPT` (for fast assembly).
- `allowShortageOverride`: `REQUIRES_SUPERVISOR_PIN` vs `STRICT_BLOCK`.
- `overProductionTolerancePercent`: Percentage above planned MO quantity allowed without revision (e.g. 2.0%).
- `scrapVarianceThreshold`: Deviation trigger sending automatic alert to Quality Director when scrap exceeds 5.0%.
- `quarantineAutoRoute`: Automatically transfer all new GRN dock receipts into `HOLD` bucket pending inspection (`TRUE`).

#### D. Enterprise DataGrid & View Preferences
Operator and planner personalization saved in user profiles:
- `density`: `compact` (28px row height, high density), `standard` (36px), or `comfortable` (44px).
- `columnOrder` & `columnVisibility`: Hide/show columns and drag-to-reorder.
- `pinnedColumns`: Pin primary keys (`Item Code`, `MO Number`) to the left during horizontal scrolling.
- `savedViews`: Save complex multi-column filter presets (e.g. *"Critical Shortages Today"*, *"Overdue MOs"*).

#### E. Role-Based Access Control (RBAC) Permissions Matrix
- **Roles:**
  - `PLANT_MANAGER`: Full view & override permissions across all plants.
  - `PPIC_PLANNER`: Create/edit Demand, MPS, MRP, Production Orders, and BOMs.
  - `SHOP_FLOOR_OPERATOR`: Access restricted to Station Kiosk, Start/Stop ops, Scrap logging.
  - `QC_INSPECTOR`: Access to incoming inspections, NCR creation, disposition tagging.
  - `PROCUREMENT_BUYER`: Create PRs, issue POs, review supplier quotes.
  - `COST_ACCOUNTANT`: Access to standard costing baselines, cost variances, GL reconciliations.
  - `AUDIT_COMPLIANCE`: Read-only access to immutable event audit trail and SoD violations.

---

# SECTION 4: HARD DOMAIN INVARIANTS (THE 10 COMMANDMENTS)

Every engineer, service, and AI copilot operating within Kranex Industrial ERP must strictly adhere to these invariants:

1. **BR-GLOBAL-001 (Zero Stealth Mutations):** Database `UPDATE` queries on financial or physical stock quantity fields are forbidden. Stock quantities are strictly the aggregated result of immutable movement logs.
2. **BR-GLOBAL-002 (Segregation of Duties):** No user may approve any document (PR, PO, MO release, Scrap write-off) that they themselves drafted or initiated.
3. **BR-GLOBAL-003 (Cryptographic Event Ledger):** All state changes must record: Timestamp, Operator ID, IP/Terminal ID, Entity Type, Entity PK, Action, Prior State Snapshot, New State Snapshot, and Reason Code.
4. **BR-INV-001 (Non-Negative Stock):** Stock balances can never drop below zero. If an operation would cause a negative balance, the transaction must fail with `INSUFFICIENT_AVAILABLE_STOCK`.
5. **BR-INV-002 (Hard State Isolation):** Stock in `HOLD` or `REJECTED` buckets cannot be allocated, reserved, or issued to a production order under any circumstance.
6. **BR-PROD-001 (BOM Version Immutability):** Releasing a Production Order freezes a historical snapshot of the BOM and routing. Subsequent revisions to the Master BOM do not affect in-flight orders.
7. **BR-PROD-002 (Routing Precedence):** Operation $N$ cannot commence until Operation $N-1$ has reported completion or partial output handover.
8. **BR-PROD-003 (Mandatory Scrap Reason Codes):** Operator output logging that specifies scrap count $> 0$ must select an approved reason code (`TOOL_WEAR`, `MATERIAL_DEFECT`, `OPERATOR_ERROR`, `MACHINE_JAM`).
9. **BR-PLAN-001 (Deterministic MRP Math):** Net requirement calculations must strictly follow `Net = Max(0, Gross - Available - ScheduledReceipts + SafetyStock)`. AI cannot approximate or modify net requirements.
10. **BR-AI-001 (AI Advisory Boundary):** AI features operate exclusively in an advisory capacity. All AI outputs (OCR extractions, SOP drafts, anomaly suggestions) require explicit human review and authorization before committing to system records.

---

# SECTION 5: IMPLEMENTATION PHASING & VALIDATION ROADMAP

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        KRANEX ERP IMPLEMENTATION ROADMAP                               │
└───────────────────────────────────┬────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[PHASE 0: BASELINE]             [PHASE 1: EXTENSIBILITY]        [PHASE 2: SCALE]
• Master Feature Map (Done)     • Custom Field Admin UI         • IoT Machine Telemetry
• Domain & Entity Map (Done)    • Visual Workflow Builder       • Multi-Site Plant Network
• Configuration Map (Done)      • Capacity Auto-Leveling        • Subcontracting Routing
• Invariants Codified (Done)    • Gantt Rescheduling Drag       • Predictive Maintenance
```

### Sign-off & Alignment
This document establishes the single source of truth for Kranex Industrial ERP development. All subsequent feature development, schema migrations, and user interfaces must conform to the boundaries and contracts defined in this specification.
