# KRANEX MANUFACTURING ERP — ARCHITECTURE CONSTITUTION & GUARDRAILS

## 1. Architectural Foundation & Topology

Kranex Manufacturing ERP is structured as a **Modular Monolith** adhering to Domain-Driven Design (DDD), Clean/Hexagonal Architecture boundaries, Command-Query Responsibility Segregation (CQRS), Repository Pattern, and explicit Unit of Work transaction boundaries.

### Core Non-Negotiables
- **No Microservices**: The system is a single deployable modular monolith. Avoid distributed microservices complexity, network-hop fallacies, and partial consistency overhead.
- **Server-Authoritative Source of Truth**: All ERP transaction data, master records, balances, orders, and statuses reside strictly on the server backend. Browser `localStorage` is prohibited from storing business entities or authoritative transaction state.
- **Strict Decoupling**: Frontend React UI must interact with backend capabilities purely through typed HTTP API clients (`ErpApiClient`). Frontend code must never import server application singletons, direct repository instances, or backend domain services directly into presentation bundles.
- **CQRS Discipline**:
  - **Commands**: Alter state, run within Unit of Work transaction boundaries, enforce business invariants and segregation of duties (SoD), and return domain Result types.
  - **Queries**: Read-only, optimized projections, supporting server-side pagination, sorting, and filtering without mutating data.

---

## 2. Domain Boundaries & Module Ownership

The system enforces strict domain boundaries between modules:

### 2.1 Manufacturing Domain (`src/modules/manufacturing`)
- **Owns**: Production Orders (Work Orders), Operations routing, Line assignments, Machine run states, OEE calculations, and Material Requests.
- **Does NOT Own**: Physical inventory balances, lot master records, warehouse bin locations, or stock ledger transactions.
- **Material Consumption Boundary**: Manufacturing requests materials via `MaterialRequest` or reserves them against a `ProductionOrder`. Actual deduction of physical inventory is delegated to Inventory Domain commands (`IssueMaterialCommand`).

### 2.2 Inventory Domain (`src/modules/inventory`)
- **Owns**: Stock Balances across the 5 logical buckets (`AVAILABLE`, `RESERVED`, `HOLD`, `REJECTED`, `WIP`), Stock Movements ledger (Goods Receipt, Goods Issue, Transfers, Reversals), Lot/Batch traceability, and Available-to-Promise (ATP) calculations.
- **Does NOT Own**: Work order scheduling, machine routing, production run status, or vendor procurement terms.
- **Double-Entry Discipline**: Physical movements require explicit source/destination buckets and locations, generating permanent, traceable movement audit logs.

### 2.3 Procurement Domain (`src/modules/procurement`)
- **Owns**: Purchase Requisitions (PR), Purchase Orders (PO), Vendor catalogs, and Goods Receipt Notes (GRN) generation.
- **Segregation of Duties**: Requesters cannot approve their own PRs. Approvals require authorized role boundaries verified by backend token validation.

---

## 3. Transaction Boundary & Unit of Work

All multi-repository state alterations must execute within an `IUnitOfWork` transaction boundary:
- Participating repositories must implement `ITransactionalParticipant` with `createSnapshot()` and `restoreSnapshot(snapshot)`.
- If any operation fails or yields a `Result.fail()`, all participants roll back atomically to their pre-transaction snapshot, preventing split-brain or partial states.
- The `InMemoryUnitOfWork` serves as the test and prototyping transaction engine and must remain swappable with a PostgreSQL ACID transaction manager (e.g. `BEGIN`, `COMMIT`, `ROLLBACK`) without modifying domain or application command logic.

---

## 4. Security & Authentication Model

- Authentication uses signed Bearer tokens (`/api/erp/auth/token` and `/api/erp/auth/me`).
- Role-Based Access Control (RBAC) is enforced exclusively on the server in Express route middleware (`requireErpAuth`).
- Client-supplied role headers (such as `X-Erp-Role` or `X-Erp-User-Id`) without a valid server-signed token are strictly rejected. Client role spoofing is impossible.

---

## 5. Future Extension Points & Guardrails

The following five enterprise capabilities are anticipated for future evolution. Their extension points are established here to ensure the core domain remains decoupled from external frameworks and protocols.

### 5.1 Advanced RBAC & Fine-Grained Authorization
- **Status**: Future Extension Point.
- **Architecture Seam**: Middleware `requireErpAuth([allowedRoles])` provides a clean hook to be upgraded to attribute-based or permission-key policies (e.g., `inventory:transfer:execute`, `workorder:release:plant01`) without altering CQRS handlers or domain entities.
- **Guardrail**: Domain logic receives pre-validated `actor` and `role` parameters via command payloads, keeping domain models free of HTTP or auth provider dependencies.

### 5.2 Dynamic Menu & Navigation Management
- **Status**: Future Extension Point.
- **Architecture Seam**: Navigation schema and role-gated UI routes are driven by module manifests. In future phases, the UI navigation menu can be hydrated from `/api/erp/navigation` or a user profile permissions payload.
- **Guardrail**: Navigation gating in UI is purely an ergonomic hint. The server API routes and CQRS handlers remain the authoritative security boundary.

### 5.3 Module Registry
- **Status**: Future Extension Point.
- **Architecture Seam**: Composition root (`src/app/composition`) registers domain modules (`procurement`, `manufacturing`, `inventory`, `quality`) through explicit dependency injection. A formal `IModuleRegistry` interface can register module routes, event handlers, and query projections at application startup.
- **Guardrail**: Modules interact across boundaries through defined contracts, application commands/queries, or domain events—never via direct internal database mutations of peer tables.

### 5.4 Enterprise Integration Readiness (e.g., SAP S/4HANA)
- **Status**: Future Extension Point.
- **Architecture Seam**:
  - Outbox pattern / Domain Events (`IDomainEvent`) emitted by transactional commands can be relayed to integration adapters (IDoc, BAPI, OData, RFC).
  - Material Documents and Goods Movements recorded in Inventory adhere to SAP movement types (`101` Goods Receipt, `261` Goods Issue to Order, `311` Transfer Posting, `102`/`262` Reversals).
- **Guardrail**: Core domain remains agnostic of SAP data formats; mapping logic must reside strictly inside integration adapter layers.

### 5.5 MES / Shop Floor / Industrial Integration
- **Status**: Future Extension Point.
- **Architecture Seam**:
  - SCADA, PLC, OPC-UA, and machine IoT telemetry integrate via dedicated gateway adapters calling manufacturing commands (e.g., `CompleteOperationCommand`, `RecordDowntimeCommand`).
  - Work order progress and machine states are updated through deterministic server endpoints.
- **Guardrail**: Industrial sensors and edge devices must communicate through authenticated API gateways, never altering database state or bypassing ERP business rules.
