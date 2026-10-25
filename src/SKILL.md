# ERP Root Architecture Contract

## Architecture Goal

Use a modular monolith architecture as the target design for the ERP application.

Conceptually:

React Frontend
  ↓
API Layer
  ↓
Application Services
  ↓
Domain Modules
  ↓
Repositories / Infrastructure
  ↓
PostgreSQL

The initial deployment remains a single ERP application. Do not introduce microservices without a clear need and explicit justification.

## Domain Modules

The ERP should evolve around these module boundaries:

- Organization
- People
- Security
- Manufacturing
- Planning
- Scheduling
- Inventory
- Procurement
- Quality
- Engineering
- NPI
- Workflow

A module may depend on another module's public capability, but it must not directly manipulate another module's internal implementation details or database tables.

## Source of Truth

ERP transaction state belongs to the server/database. `localStorage` may be used only for UI preferences such as theme, sidebar state, filters, and temporary view state.

It must not be used as the authoritative source for:

- BOM data
- item master data
- employees and operators
- machines
- inventory balances
- production orders
- quality results
- purchase orders
- workflow approvals
- planning or scheduling results
- audit records

## Layer Responsibilities

### Presentation Layer

Responsible for rendering, user interaction, form state, and loading/error states. It must not contain deep ERP business logic.

### Application Layer

Responsible for orchestration, transaction boundaries, policy checks, and coordination between domain modules.

### Domain Layer

Responsible for business rules, calculations, invariants, manufacturing logic, planning logic, scheduling logic, workflow rules, and inventory accounting behavior.

### Infrastructure Layer

Responsible for PostgreSQL, repositories, persistence, queues, cache, file storage, notifications, and external service integrations.

## Architectural Principles

- Prefer coherence over broad rewrites.
- Preserve working functionality while restructuring boundaries.
- Keep command/query responsibilities separated where practical.
- Treat AI as an infrastructure/service capability, not as the transactional source of truth.
- Keep deterministic ERP logic inside server-side business services and repositories.
- Ensure workflow and authorization are treated as first-class concerns.

## Module Boundaries

Planning ≠ Scheduling
Workflow ≠ Settings
Employee ≠ User
Inventory ≠ Current Stock Field
UI State ≠ ERP Source of Truth
AI ≠ Core Transaction Engine

## Verification

All meaningful refactors must be checked with the project's build and type-check commands, and any risky domain logic should be covered by targeted tests.
