# ERP Architecture Refactoring — Modular Monolith + CQRS Implementation Plan

A systematic, architectural refactoring blueprint to transform the existing manufacturing ERP application into a maintainable, testable, production-ready modular monolith with explicit domain boundaries and CQRS application orchestration.

---

> [!IMPORTANT]
> **Confirmed Architectural Contract & Invariants:**
> 1. **Zero New Features Mandate**: Strictly no speculative features or unrequested dependencies. Focus is 100% on modular boundaries, repository abstractions, CQRS application handlers, and domain purity.
> 2. **Shared Kernel Foundation**: Primitives (`Result<T, E>`, `DomainError` hierarchy, and `paginateItems`) established in `src/shared/kernel`.
> 3. **Authoritative Domain Repositories**: Every ERP business module has an authoritative repository backed by `ErpCollectionRepository` and `persistencePolicy`:
>    - Manufacturing (`workOrderRepository.ts`)
>    - Inventory (`inventoryRepository.ts`)
>    - Quality (`qualityRepository.ts`)
>    - Procurement (`procurementRepository.ts`)
>    - Planning (`planningRepository.ts`)
>    - Scheduling (`schedulingRepository.ts`)
>    - Engineering (`engineeringRepository.ts`)
>    - NPI (`npiRepository.ts`)
>    - Maintenance (`maintenanceRepository.ts`)
>    - Costing (`costingRepository.ts`)
>    - Master Data (`masterDataRepository.ts`)
>    - Workflow (`workflowRepository.ts`)
> 4. **CQRS Application Layer**:
>    - Commands modify state (Command -> Handler -> Domain / Write Repository)
>    - Queries read state (Query -> Handler -> Read Repository / Query Service with projections & pagination)
> 5. **Preservation of Domain Invariants**: 116 passing tests, 0 TypeScript errors (`npm run lint`), and clean production builds (`npm run build`).

---

## 1. Architectural Topology: Modular Monolith + CQRS

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION (REACT SPA)                        │
│   Operations Hub  │  Workflow Center  │  Settings & Master Data        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CQRS APPLICATION LAYER                             │
│   Commands: PlanWorkOrder, CancelWorkOrder, TransferStock, ResolveNcr  │
│   Queries: ListWorkOrders, Get5BucketBalance, ListOpenNcrs             │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │ (Write Path)                  │ (Read Path)
                   ▼                               ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│         DOMAIN LAYER             │ │       QUERY SERVICES              │
│  • BOM Explosion                 │ │  • Projections & Pagination       │
│  • 5-Bucket Inventory Ledger     │ │  • Capacity Aggregations          │
│  • Finite Scheduling Engine      │ │  • Multi-attribute Search         │
│  • ECR Impact Analysis & NPI     │ │  • Filtering & Sorting            │
└──────────────────┬───────────────┘ └─────────────────┬─────────────────┘
                   │                                   │
                   ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    AUTHORITATIVE REPOSITORIES                          │
│   WorkOrder, Inventory, Quality, Procurement, Planning, Scheduling,    │
│   Engineering, NPI, Maintenance, Costing, MasterData, Workflow         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               INFRASTRUCTURE PERSISTENCE (POSTGRES / SERVER)           │
│   ErpCollectionRepository  │  persistencePolicy Source of Truth        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Completed Milestones

- [x] **Stage 1: Architecture Audit & Strategy Documentation**
- [x] **Stage 2: Storage Isolation (Reject UI Storage Keys as ERP Source of Truth)**
- [x] **Stage 3: Shared Kernel Primitive Extraction (`Result`, `DomainError`, `Pagination`)**
- [x] **Stage 4: Domain Extraction for Core Subsystems**
  - Manufacturing (`workOrderService.ts`, `bomExplosionService.ts`, `shopFloorService.ts`)
  - Inventory (`inventoryLedgerService.ts`, `materialRequestService.ts`)
  - Quality (`qualityService.ts`)
  - Procurement (`procurementService.ts`, `goodsReceiptService.ts`)
  - Planning (`planningService.ts`, `productionPlanDispatchService.ts`)
  - Scheduling (`schedulingService.ts`, `finiteScheduleFactory.ts`, `whatIfScenarioFactory.ts`)
  - Engineering (`engineeringService.ts`)
  - NPI (`npiService.ts`)
  - Workflow (`workflowService.ts`, `workflowMatrixService.ts`)
- [x] **Stage 5: Modular Repositories Across All Modules**
  - All 12 business modules have dedicated repository abstractions with automated unit test coverage.
- [x] **Stage 6: CQRS Application Handlers (Commands & Queries)**
  - Manufacturing, Procurement, Planning, Quality, and Inventory application layers extracted and tested.
- [x] **Stage 7: Full Verification**
  - 116 passing tests across 15 test suites.
  - Clean `tsc --noEmit` and Vite production build.
