# ERP Refactor Progress Status

Last updated: 2026-10-26

## Status summary

Project status: In progress, stable and verified.

The repository is being refactored incrementally toward a modular monolith with clearer domain boundaries, server-side authorization, and backend-controlled ERP source-of-truth.

---

## Completed

### Engineering contract and repository guardrails
- [AGENTS.md](../AGENTS.md) is in place as the repository operating contract.
- [prompt.md](../prompt.md) is treated as the governing engineering bootstrap and execution prompt.
- [src/SKILL.md](../src/SKILL.md) defines the modular monolith baseline.
- [src/modules/workflow/SKILL.md](../src/modules/workflow/SKILL.md) and related module guidance are aligned to the domain boundaries.

### Infrastructure boundary
- ERP repository factory seeded through the infrastructure layer.
- UI-only storage keys are rejected from ERP authoritative storage.
- ERP collection repositories require authoritative storage names.
- Server side routes remain protected by ERP authorization checks.

### Workflow domain
- Workflow instance creation and transition evaluation are extracted in [src/modules/workflow/workflowService.ts](../src/modules/workflow/workflowService.ts).
- Approval gate rules are enforced centrally for SoD and required-role validation.
- Workflow regression tests are in [src/modules/workflow/workflowService.test.ts](../src/modules/workflow/workflowService.test.ts).

### Procurement domain
- Purchase requisition approval/rejection decision logic has been moved into [src/modules/procurement/procurementService.ts](../src/modules/procurement/procurementService.ts).
- Purchase order draft validation is enforced in the procurement domain service.
- Goods receipt / GRN validation and receipt disposition logic are extracted in [src/modules/procurement/goodsReceiptService.ts](../src/modules/procurement/goodsReceiptService.ts).
- Procurement regression tests are in [src/modules/procurement/procurementService.test.ts](../src/modules/procurement/procurementService.test.ts) and [src/modules/procurement/goodsReceiptService.test.ts](../src/modules/procurement/goodsReceiptService.test.ts).
- Legacy orchestration in [src/lib/services/manufacturingService.ts](../src/lib/services/manufacturingService.ts) delegates the domain rule instead of embedding it inline.

### Planning and scheduling boundary
- Planning logic is centralized in [src/modules/planning/planningService.ts](../src/modules/planning/planningService.ts) and scheduling logic in [src/modules/scheduling/schedulingService.ts](../src/modules/scheduling/schedulingService.ts).
- The legacy [src/lib/services/ppicService.ts](../src/lib/services/ppicService.ts) compatibility layer now delegates to the modular domain services instead of re-implementing the same logic.
- Boundary regression tests are in [src/lib/services/ppicService.test.ts](../src/lib/services/ppicService.test.ts).

### Inventory delivery boundary
- Material request line-delivery posting and WIP ledger generation are extracted in [src/modules/inventory/materialRequestService.ts](../src/modules/inventory/materialRequestService.ts).
- The legacy manufacturing service delegates delivery validation and movement creation to that inventory-domain module.
- Material request lifecycle creation and picking state are extracted into [src/modules/manufacturing/materialRequestLifecycleService.ts](../src/modules/manufacturing/materialRequestLifecycleService.ts).
- Regression coverage is in [src/modules/inventory/materialRequestService.test.ts](../src/modules/inventory/materialRequestService.test.ts) and [src/modules/manufacturing/materialRequestLifecycleService.test.ts](../src/modules/manufacturing/materialRequestLifecycleService.test.ts).

### Security boundary
- ERP auth validation exists in [src/modules/security/authorizationService.ts](../src/modules/security/authorizationService.ts).
- Auth regression tests are in [src/modules/security/authorizationService.test.ts](../src/modules/security/authorizationService.test.ts).
- Duplicate unguarded ERP route exposure was removed from the server entrypoint.

### Runtime and import boundary hardening
- ESM startup imports were corrected for the Node/tsx runtime in [server.ts](../server.ts), [src/infrastructure/erp/erpServerService.ts](../src/infrastructure/erp/erpServerService.ts), and [src/lib/persistence/erpStorageAdapter.ts](../src/lib/persistence/erpStorageAdapter.ts).
- The app was verified to start under the project runtime on a free port without the previous module-resolution failure.
- Type-check and production build pass.

### Testing execution boundary
- Testing scenario execution is now extracted into [src/modules/testing/testingService.ts](../src/modules/testing/testingService.ts).
- The legacy manufacturing store delegates scenario execution to that domain module instead of embedding the pass logic inline.
- Regression coverage is in [src/modules/testing/testingService.test.ts](../src/modules/testing/testingService.test.ts).

### Maintenance downtime boundary
- Machine breakdown creation and recovery logic are extracted into [src/modules/manufacturing/machineDowntimeService.ts](../src/modules/manufacturing/machineDowntimeService.ts).
- The legacy manufacturing store delegates downtime posting and restoration to the domain module without keeping the domain decision logic inline.
- Regression coverage is in [src/modules/manufacturing/machineDowntimeService.test.ts](../src/modules/manufacturing/machineDowntimeService.test.ts).

### Enterprise Governance & 3-Pillar Navigation Taxonomy
- App navigation restructured into 3 top-level architecture pillars: `OPERATIONS`, `WORKFLOW`, and `SETTINGS`.
- Decoupled physical `EmployeeMaster` (NIK, department, plant, skill matrix, operator hourly rates) from digital `UserAccount` (login credentials, roles, permission tokens `domain.entity.action`).
- Implemented organization hierarchy master models: `Company`, `PlantMaster` (Plant 1 Batam, Plant 2 Cikarang), `DepartmentMaster`, `SectionMaster`, and `PositionMaster`.
- Seeded initial master records in [src/lib/mockData.ts](../src/lib/mockData.ts).

### Generic Dynamic Approval Matrix Engine
- Built condition-based matrix evaluator (`evaluateApprovalMatrix`) in [src/modules/workflow/workflowMatrixService.ts](../src/modules/workflow/workflowMatrixService.ts).
- Supports dynamic multi-tier authorization chains based on `approvalType`, `plantId`, `totalQuantity`, and `totalAmount` (e.g. Batam Production Plan $>5,000$ pcs requiring PPIC Manager $\rightarrow$ Production Manager $\rightarrow$ Plant Director).
- Enforces Segregation of Duties (anti-self-approval) and mandatory reason codes on rejection.
- Automated regression suite added in [src/modules/workflow/workflowMatrixService.test.ts](../src/modules/workflow/workflowMatrixService.test.ts) (6 new unit tests).

### High-Density TanStack Table Integration
- Integrated `@tanstack/react-table` in [src/components/common/DataTable.tsx](../src/components/common/DataTable.tsx) for enterprise dense data grids ($36\text{px}$–$40\text{px}$ row height).
- Implemented column sorting, live global search filtering, tabular-num typography, pagination, and zero-pill compliant unboxed tags.
- Applied to Master Data, Physical Employees, User Accounts, and Approval Inboxes.

### Standalone Workflow Center & Settings Hub
- Created [src/modules/workflow/WorkflowView.tsx](../src/modules/workflow/WorkflowView.tsx) with *My Tasks / Approval Inbox*, *Approval Requests*, *All Pending*, *History*, and *Decision Drawer* with 5-pillar constraint radar snapshot.
- Created [src/modules/settings/SettingsView.tsx](../src/modules/settings/SettingsView.tsx) with dedicated views for Organization, People (Employee vs User), Security RBAC, and Approval Matrix rules.
- Added top header indicator `🔔 [N] Pending Approvals` routing directly to the user's approval inbox.

### Manufacturing Execution & Quality Domain Services
- Extracted recursive multi-level BOM explosion and net requirements engine in [src/modules/manufacturing/bomExplosionService.ts](../src/modules/manufacturing/bomExplosionService.ts) with scrap allowances, cycle detection, and lead-time critical path calculation.
- Extracted shop floor operator check-in and execution telemetry in [src/modules/manufacturing/shopFloorService.ts](../src/modules/manufacturing/shopFloorService.ts), verifying physical `EmployeeMaster` NIK, plant compatibility, run pace, and scrap alarm thresholds.
- Extracted quality inspection gates (IQC, IPQC, FQC) and Non-Conformance Report (NCR) resolution in [src/modules/quality/qualityService.ts](../src/modules/quality/qualityService.ts), posting automatic inventory transfers into `HOLD` (Quarantine) and `REJECTED` buckets.
- Extended server routes in [server.ts](../server.ts) and [src/infrastructure/erp/erpServerService.ts](../src/infrastructure/erp/erpServerService.ts) for `/api/erp/quality` and `/api/erp/bom-explosion` protected by role authorization.
- Enhanced shop floor kiosk terminal in [src/modules/manufacturing/ShopFloorTerminal.tsx](../src/modules/manufacturing/ShopFloorTerminal.tsx) with verified NIK operator badge selection and real-time skill clearance.

### Inventory 5-Bucket Ledger & Work Order Lifecycle
- Extracted atomic 5-bucket balance computation (`AVAILABLE`, `RESERVED`, `WIP`, `HOLD`, `REJECTED`) and negative inventory prevention in [src/modules/inventory/inventoryLedgerService.ts](../src/modules/inventory/inventoryLedgerService.ts).
- Enforced immutable ledger audit trails and compensating movement reversals (`REVERSAL`).
- Extracted Work Order state transitions (`DRAFT` $\rightarrow$ `PLANNED` $\rightarrow$ `CANCELLED`) in [src/modules/manufacturing/workOrderService.ts](../src/modules/manufacturing/workOrderService.ts) ensuring mandatory approved BOM and routing bindings.

### Domain Repository Layer & Persistence Boundaries
- Formalized [IWorkOrderRepository](../src/modules/manufacturing/workOrderRepository.ts), [IInventoryRepository](../src/modules/inventory/inventoryRepository.ts), and [IQualityRepository](../src/modules/quality/qualityRepository.ts) backed by authoritative ERP collection repositories.
- Replaced direct array and browser storage mutations with interface contracts ready for PostgreSQL and Drizzle ORM migration.
- Added comprehensive unit tests for each repository: [workOrderRepository.test.ts](../src/modules/manufacturing/workOrderRepository.test.ts), [inventoryRepository.test.ts](../src/modules/inventory/inventoryRepository.test.ts), and [qualityRepository.test.ts](../src/modules/quality/qualityRepository.test.ts).

### Foundation Architecture Specifications
- Established [docs/architecture/ARCHITECTURE_AUDIT.md](architecture/ARCHITECTURE_AUDIT.md) documenting God Objects, dependency directions, and risk categorizations.
- Formalized [docs/architecture/ERP_ARCHITECTURE.md](architecture/ERP_ARCHITECTURE.md) defining strict module boundaries, inward dependency rules, and server-authoritative security boundaries.
- Published [docs/architecture/ARCHITECTURE_AUDIT_FINAL.md](architecture/ARCHITECTURE_AUDIT_FINAL.md) tracking before/after architectural transformation.

### Verification
- Targeted domain tests pass.
- Full repository test suite passes (**76/76 tests passed**).
- TypeScript compile and linter pass with 0 errors (`npm run lint`).
- Production build succeeded (`npm run build`).

---

## In progress / still to harden

- Continue separating domain responsibilities from the legacy manufacturing orchestrator.
- Formalize more backend application/service boundaries beyond procurement and workflow.
- Expand repository abstraction for additional ERP collections as they become active transactional domains.
- Move more domain logic from UI/state-heavy service orchestration into dedicated modules.
- Increase coverage for high-risk ERP areas such as scheduling, capacity, and governance transitions.

---

## Pending next logical steps

1. Extract the remaining manufacturing execution logic still coupled to the legacy orchestrator into dedicated ERP domain modules.
2. Continue backend/infrastructure decomposition around persistence, repository abstractions, and application-service boundaries.
3. Maintain strict separation between ERP source-of-truth data and browser UI state; avoid placing authoritative ERP state in client-only storage.
4. Keep authorization, approval, and governance checks enforced on the server side, with UI checks treated only as UX hints.
5. Expand regression coverage for high-risk ERP domains such as capacity, scheduling, and workflow transitions.
6. Keep the repository green by validating the relevant test, lint, and build checks after each boundary extraction.

---

## Verification command used

```bash
npx tsx --test "src/**/*.test.ts" && npm run lint && npm run build
```

Result: 76 tests passed, 0 failed; lint passed; build succeeded.
