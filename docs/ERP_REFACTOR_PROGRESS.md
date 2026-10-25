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

### Verification
- Targeted domain tests pass.
- Full repository test suite passes.
- Type-check and production build pass.
- Server start verified under the project runtime on localhost:3001 after resolving the ESM import issue.

---

## In progress / still to harden

- Continue separating domain responsibilities from the legacy manufacturing orchestrator.
- Formalize more backend application/service boundaries beyond procurement and workflow.
- Expand repository abstraction for additional ERP collections as they become active transactional domains.
- Move more domain logic from UI/state-heavy service orchestration into dedicated modules.
- Increase coverage for high-risk ERP areas such as BOM explosion, inventory ledger, scheduling, capacity, and governance transitions.

---

## Pending next logical steps

1. Extract the remaining manufacturing execution logic still coupled to the legacy orchestrator into dedicated ERP domain modules.
2. Continue backend/infrastructure decomposition around persistence, repository abstractions, and application-service boundaries.
3. Maintain strict separation between ERP source-of-truth data and browser UI state; avoid placing authoritative ERP state in client-only storage.
4. Keep authorization, approval, and governance checks enforced on the server side, with UI checks treated only as UX hints.
5. Expand regression coverage for high-risk ERP domains such as BOM explosion, capacity, scheduling, inventory ledger, and workflow transitions.
6. Keep the repository green by validating the relevant test, lint, and build checks after each boundary extraction.

---

## Verification command used

```bash
cd /d c:\app\erpApp\Erp && npx.cmd tsx --test "src/**/*.test.ts" && npm.cmd run lint && npm.cmd run build
```

Result: 52 tests passed, 0 failed; lint passed; build succeeded.
