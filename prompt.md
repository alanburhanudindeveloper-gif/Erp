# ERP — ARCHITECTURE BOOTSTRAP + EXECUTION MASTER PROMPT

## ROLE

You are the lead software architect and senior full-stack engineer responsible for refactoring and evolving this ERP repository into a production-grade manufacturing ERP.

You are **not** being asked to merely analyze the repository or write documentation.

You must:

1. Inspect the existing repository.
2. Establish persistent engineering and architecture instructions in Markdown files.
3. Make those Markdown files the governing engineering contract for this repository.
4. Read and follow those files before performing the actual refactor.
5. Refactor the existing code incrementally.
6. Preserve existing functionality wherever possible.
7. Keep the application buildable and runnable throughout the process.
8. Never replace the application with a fake/demo implementation.

The repository is an existing ERP application.

> **DO NOT rewrite the application from scratch.**

---

# PHASE 0 — REPOSITORY DISCOVERY

Before changing application code, inspect the repository thoroughly.

At minimum inspect:

- `package.json`
- `tsconfig`
- build configuration
- frontend entry points
- backend/server entry points
- `src/`
- existing modules
- services
- types
- components
- routes
- API code
- persistence/storage code
- AI integration
- existing tests
- configuration files
- environment handling
- database-related code, if any
- documentation
- existing agent instructions, if any

Pay particular attention to:

```text
src/lib/services/manufacturingService.ts
src/lib/services/ppicService.ts
src/modules/planning/PlanningView.tsx
src/types/index.ts
server.ts
```

Do not assume their current implementation is identical to previous descriptions.

Inspect the actual repository and use the current code as the source of truth.

---

# PHASE 1 — CREATE THE ENGINEERING CONTRACT

Before performing the major refactor, create the following Markdown files.

Target structure:

```text
ERP/
├── AGENTS.md
│
├── docs/
│   └── architecture/
│       └── ERP_ARCHITECTURE.md
│
└── src/
    ├── SKILL.md
│
    ├── modules/
    │   ├── manufacturing/
    │   │   └── SKILL.md
    │   ├── planning/
    │   │   └── SKILL.md
    │   ├── scheduling/
    │   │   └── SKILL.md
    │   ├── inventory/
    │   │   └── SKILL.md
    │   ├── workflow/
    │   │   └── SKILL.md
    │   └── security/
    │       └── SKILL.md
    │
    └── infrastructure/
        └── database/
            └── SKILL.md
```

If some directories do not yet exist, create the directories necessary to hold the documentation.

Do **not** create fake application modules merely to satisfy this structure.

The Markdown files are engineering instructions/contracts, not permission to generate empty boilerplate.

---

# PHASE 2 — CONTENT OF THE ENGINEERING CONTRACT

## 2.1 `AGENTS.md`

This file defines how an AI coding agent must operate inside this repository.

It must include:

### Repository Mission

This repository is a production-grade manufacturing ERP.

The goal is:

- maintainable architecture
- database-first persistence
- modular domain boundaries
- strong security
- scalable data handling
- manufacturing-aware business logic
- reliable workflows
- auditable transactions
- production readiness

### Mandatory Agent Behavior

The agent MUST:

- inspect before modifying
- understand existing behavior before replacing it
- prefer incremental refactoring
- preserve working functionality
- reuse existing domain logic when valid
- avoid unnecessary rewrites
- run typecheck/build/tests after meaningful changes
- keep changes coherent
- explain architectural decisions
- identify assumptions explicitly

The agent MUST NOT:

- rewrite the entire application unnecessarily
- create fake/mock production implementations
- silently invent business rules
- put ERP source-of-truth data into localStorage
- bypass server-side authorization
- create giant global state objects
- create giant service classes
- create giant type files
- couple UI directly to database implementation
- run heavy planning calculations directly in browser/UI
- introduce microservices without explicit requirement
- create empty architecture layers purely for appearance
- hide errors with `any`, broad casts, or disabled type checking
- delete existing functionality merely to simplify the refactor

### Preferred Change Strategy

```text
Understand
    ↓
Define boundary
    ↓
Extract
    ↓
Adapt
    ↓
Test
    ↓
Verify
    ↓
Continue
```

Never:

```text
Delete everything
    ↓
Rewrite
    ↓
Hope it works
```

---

# 2.2 `src/SKILL.md`

This is the root engineering architecture contract.

## Architecture

Use a **Modular Monolith**.

Conceptually:

```text
React Frontend
      ↓
API
      ↓
Application Services
      ↓
Domain Modules
      ↓
Repositories / Infrastructure
      ↓
PostgreSQL
```

The initial deployment should remain one ERP application.

Do **NOT** introduce microservices unless explicitly required later.

## Domain Modules

The ERP should evolve toward:

```text
Organization
People
Security
Manufacturing
Planning
Scheduling
Inventory
Procurement
Quality
Engineering
NPI
Workflow
```

Modules should have clear ownership.

A module may consume another module's public interface/capability.

A module must **NOT** directly manipulate another module's internal implementation or database tables.

## Source of Truth

ERP transactional data belongs to the server/database.

`localStorage` may only be used for UI preferences such as:

- theme
- sidebar state
- table preferences
- filters
- temporary UI preferences

Never use localStorage as the authoritative source for:

- BOM
- item master
- employees
- machines
- inventory
- production orders
- production results
- purchase orders
- workflow approvals
- audit records
- planning results
- scheduling results

## Layer Responsibilities

### Presentation

Responsible for:

- rendering
- interaction
- form state
- UI state
- loading/error states

Must NOT contain complex ERP business rules.

### Application

Responsible for:

- use cases
- orchestration
- transaction boundaries
- authorization checks
- coordination between domain components

### Domain

Responsible for:

- business rules
- calculations
- invariants
- manufacturing logic
- planning logic
- scheduling rules
- inventory rules
- workflow rules

### Infrastructure

Responsible for:

- PostgreSQL
- repositories
- persistence
- queues
- cache
- object storage
- notifications
- external services
- AI integration

---

# 2.3 `docs/architecture/ERP_ARCHITECTURE.md`

Create the canonical architecture document.

It must document:

- system context
- module boundaries
- dependency direction
- database strategy
- API strategy
- authentication
- authorization
- RBAC
- organization/data scope
- workflow architecture
- planning architecture
- scheduling architecture
- inventory architecture
- manufacturing architecture
- NPI/engineering relationship
- AI boundary
- asynchronous processing
- audit strategy
- observability
- scalability strategy
- migration/refactoring strategy

Include architecture diagrams using Mermaid where useful.

The document must clearly state:

```text
Planning ≠ Scheduling
Workflow ≠ Settings
Employee ≠ User
Inventory ≠ Current Stock Field
UI State ≠ ERP Source of Truth
AI ≠ Core Transaction Engine
```

---

# 2.4 `src/modules/manufacturing/SKILL.md`

Define manufacturing domain rules.

Include:

- Item
- UOM
- BOM
- BOM revision
- BOM effective dates
- Routing
- Routing operation
- Work center
- Machine
- Tooling
- Production order
- Production operation
- cycle time
- setup time
- manpower requirement
- machine requirement
- output rate
- production result

Important:

**Cycle time is a first-class manufacturing parameter.**

A routing operation may define:

```text
machine
work center
cycle time
setup time
manpower required
skill required
tooling required
output rate
```

Manufacturing logic must be reusable by Planning and Scheduling.

---

# 2.5 `src/modules/planning/SKILL.md`

Planning is responsible for determining whether production demand is feasible.

Planning must consider:

- demand
- BOM
- material requirements
- machine capacity
- manpower capacity
- cycle time
- output rate
- machine quantity
- bottleneck
- material availability
- production feasibility

Conceptually:

```text
Demand
  ↓
BOM Explosion
  ↓
Material Requirement
  ↓
Capacity Requirement
  ├── Machine
  ├── Manpower
  └── Time
  ↓
Feasibility
  ↓
Planning Result
```

Planning must NOT become the finite scheduling engine.

Heavy planning/MRP calculations should eventually be executable asynchronously.

The UI must not contain the core planning formulas.

---

# 2.6 `src/modules/scheduling/SKILL.md`

Scheduling is responsible for finite production scheduling.

Scheduling considers:

- production requirement
- machine availability
- machine capacity
- shift
- production calendar
- manpower availability
- cycle time
- setup time
- changeover
- operation sequence
- machine assignment
- scheduling constraints

Conceptually:

```text
Production Requirement
        ↓
Available Machines
        ↓
Shift / Calendar
        ↓
Cycle Time
        ↓
Setup / Changeover
        ↓
Finite Schedule
```

Planning answers:

> Can we produce this?

Scheduling answers:

> When, where, and on which machine should we produce it?

Do not merge these responsibilities.

---

# 2.7 `src/modules/inventory/SKILL.md`

Inventory must be transaction-oriented.

Avoid modeling inventory as only:

```text
item.currentStock
```

Prefer:

```text
Inventory Transactions
        ↓
Inventory Balance / Projection
```

Inventory transactions may include:

- receipt
- issue
- transfer
- adjustment
- production consumption
- production output
- reservation
- release
- scrap

Inventory-affecting operations must use transaction boundaries.

Consistency between:

- production
- inventory
- reservations
- audit

must be preserved.

---

# 2.8 `src/modules/workflow/SKILL.md`

Workflow is a reusable approval engine.

It must NOT belong specifically to Planning.

Potential consumers:

- BOM approval
- Production Plan approval
- Purchase Request approval
- Engineering Change approval
- NPI approval
- Work Order approval
- Quality disposition
- other configurable business approvals

Conceptual model:

```text
Business Entity
      ↓
Submit
      ↓
Workflow Instance
      ↓
Workflow Step
      ↓
Approval Request
      ↓
Approve / Reject / Delegate
```

Workflow configuration must support approver setup.

Workflow execution and workflow configuration are different concerns.

---

# 2.9 `src/modules/security/SKILL.md`

Security must be server-side.

Use:

```text
USER
 ↓
ROLE
 ↓
PERMISSION
 ↓
ORGANIZATION / DATA SCOPE
 ↓
RESOURCE
```

Requirements:

- deny by default
- least privilege
- centralized authorization
- server-side enforcement
- backend input validation
- authentication/session security
- rate limiting
- audit logging
- secret protection
- sensitive data protection
- organization/data scope enforcement

UI permission checks are only for UX.

They are **NOT** security boundaries.

Use OWASP ASVS Level 2 as a practical baseline.

Do not claim certification.

---

# 2.10 `src/infrastructure/database/SKILL.md`

Database architecture rules:

Use PostgreSQL as the target production database unless repository constraints demonstrate a better justified choice.

Use a mature PostgreSQL-compatible ORM/query builder appropriate for the existing stack.

Prefer evaluating:

- Drizzle
- Prisma
- another mature option

but inspect the repository before deciding.

Do not blindly impose a library.

Database rules:

- relational schema
- foreign keys
- constraints
- transactions
- indexes based on real query patterns
- migration system
- repository abstraction
- no giant ERP JSON state table
- no ERP source-of-truth in localStorage
- avoid N+1 queries
- server-side pagination
- keyset pagination where appropriate
- EXPLAIN/EXPLAIN ANALYZE for important queries
- partition only when justified by workload

Large tables may include:

- inventory transactions
- production transactions
- audit logs
- workflow history
- machine downtime
- historical planning/scheduling results

Do not partition everything.

---

# PHASE 3 — VERIFY THE DOCUMENTATION CONTRACT

After creating all Markdown files:

1. Read every newly created Markdown file.
2. Check for contradictions.
3. Check that module rules do not conflict with root architecture.
4. Check that architecture documentation reflects the actual repository.
5. Correct inconsistencies before touching major application code.

The Markdown files are now the engineering contract.

From this point forward:

> **The implementation must follow the Markdown contracts.**

If an implementation decision conflicts with them, stop and resolve the architectural conflict before proceeding.

---

# PHASE 4 — BUILD AN ACTUAL REFACTOR PLAN

After the contract exists, inspect the current repository again and create a concrete migration plan based on the real code.

The plan must identify:

- current architecture
- target architecture
- dependency problems
- coupling
- persistence problems
- security gaps
- performance risks
- domain boundaries
- migration order
- risky areas
- files that should be split
- files that should remain
- code that can be reused
- code that should be deprecated

Known hotspots must be evaluated, not blindly rewritten:

```text
manufacturingService.ts
ppicService.ts
PlanningView.tsx
types/index.ts
server.ts
```

---

# PHASE 5 — DATABASE-FIRST FOUNDATION

Implement the persistence foundation before migrating large amounts of ERP state.

Target:

```text
PostgreSQL
    ↓
Database Adapter
    ↓
Repositories
    ↓
Application Services
    ↓
Domain
```

Create a migration strategy.

Do not create:

```text
erp_state JSON
```

as the primary database model.

Use relational entities.

Potential areas:

## Master

- items
- item_uoms
- bom_headers
- bom_lines
- bom_revisions
- routings
- routing_operations
- work_centers
- machines
- tooling
- employees
- departments
- positions
- shifts
- calendars
- suppliers

## Transactions

- production_orders
- production_order_operations
- production_outputs
- inventory_transactions
- inventory_balances
- material_reservations
- purchase_orders
- goods_receipts
- quality_inspections
- machine_downtime

## Governance

- users
- roles
- permissions
- role_permissions
- organization_scopes
- workflow_definitions
- workflow_steps
- workflow_instances
- approval_requests
- approval_actions
- audit_logs

Only create tables/entities justified by the actual application requirements.

Do not blindly create unused schema.

---

# PHASE 6 — MIGRATE SOURCE OF TRUTH

Move ERP data away from browser localStorage.

Use an incremental adapter strategy if necessary.

Example:

```text
Old UI
  ↓
Temporary Repository Adapter
  ↓
New Application Interface
  ↓
PostgreSQL Repository
```

This allows incremental migration.

Do NOT perform a dangerous big-bang rewrite.

localStorage may remain temporarily only where necessary during migration.

Clearly mark deprecated persistence paths.

---

# PHASE 7 — SPLIT MANUFACTURING SERVICE

Refactor:

```text
src/lib/services/manufacturingService.ts
```

if the actual code confirms it is a God Object.

Separate responsibilities into appropriate modules.

Potential boundaries:

```text
manufacturing/
├── item/
├── bom/
├── routing/
├── machine/
├── tooling/
└── production/
```

Do not split mechanically by line count.

Split by domain responsibility.

Preserve public behavior while moving implementation behind better boundaries.

---

# PHASE 8 — SPLIT PPIC LOGIC

Refactor:

```text
src/lib/services/ppicService.ts
```

into domain-oriented planning/scheduling capabilities.

Potential structure:

```text
planning/
├── domain/
│   ├── calculations/
│   │   ├── cycleTime.ts
│   │   ├── machineCapacity.ts
│   │   ├── manpowerCapacity.ts
│   │   └── materialRequirement.ts
│   ├── rules/
│   └── services/
│
scheduling/
├── domain/
│   ├── schedulingEngine.ts
│   ├── machineAssignment.ts
│   ├── changeover.ts
│   └── calendar.ts
```

Reuse valid existing calculations.

Do not invent new formulas unless required by existing requirements or explicitly documented assumptions.

---

# PHASE 9 — REFACTOR PLANNING UI

Refactor:

```text
src/modules/planning/PlanningView.tsx
```

The UI should not directly import many low-level business calculation functions.

Target:

```text
PlanningView
    ↓
Planning Hook / Application Service
    ↓
Planning Use Case
    ↓
Planning Domain
    ↓
Repository
```

The UI is responsible for presenting planning information.

The domain is responsible for calculating planning results.

---

# PHASE 10 — SPLIT GLOBAL TYPES

Evaluate:

```text
src/types/index.ts
```

If it is confirmed to be a God Types file, split it by domain.

Potential:

```text
modules/
  manufacturing/
    types.ts
  planning/
    types.ts
  scheduling/
    types.ts
  inventory/
    types.ts
  workflow/
    types.ts
  security/
    types.ts
```

Do not duplicate types unnecessarily.

Create shared types only when they are genuinely cross-domain.

---

# PHASE 11 — REFACTOR SERVER

Evaluate:

```text
server.ts
```

If it contains unrelated responsibilities, separate:

```text
server/
├── app.ts
├── routes/
├── middleware/
├── modules/
├── infrastructure/
└── ai/
```

Separate:

- HTTP setup
- middleware
- authentication
- authorization
- ERP APIs
- AI gateway
- document processing
- AI telemetry
- infrastructure

AI must remain an infrastructure/service capability.

AI must NOT become the source of truth for deterministic ERP transactions.

For example:

```text
Deterministic ERP Logic
        ↓
Database Transaction
```

AI may assist with:

- document extraction
- recommendations
- summaries
- work instruction generation
- analysis

but AI output must not bypass business validation.

---

# PHASE 12 — SECURITY IMPLEMENTATION

Implement security as architecture, not as UI decoration.

Required:

- authentication boundary
- authorization middleware/service
- RBAC
- permission checks
- organization/data scope
- input validation
- rate limiting
- audit context
- secure secrets
- secure error handling

Every sensitive API must answer:

```text
Who is calling?
What are they allowed to do?
Which organization/data scope applies?
What resource are they accessing?
```

Never trust:

```text
role
userId
organizationId
permission
```

sent from the frontend.

Derive authorization context from the authenticated server-side identity.

---

# PHASE 13 — PERFORMANCE

The ERP must be designed for large datasets.

Do NOT assume:

```text
100 records
```

Design for potentially large:

- BOMs
- inventory transactions
- production transactions
- employees
- machines
- workflow history
- audit logs

## Backend

- server-side pagination
- filtering
- sorting
- search
- efficient joins
- indexes
- avoid N+1
- transactions
- query profiling

## Frontend

- lazy loading
- code splitting
- table virtualization when needed
- avoid giant global state
- avoid rendering thousands of rows unnecessarily

## Heavy Computation

Do not execute large:

- MRP
- BOM explosion
- finite scheduling
- planning simulations

inside a synchronous HTTP request if workload indicates it should be asynchronous.

Target:

```text
POST /planning/runs
        ↓
Create Run
        ↓
Queue
        ↓
Worker
        ↓
Planning Engine
        ↓
Persist Result
        ↓
Notify / Poll
```

Implement queue infrastructure only when justified by the current stack, but preserve an architecture boundary that allows it.

---

# PHASE 14 — OBSERVABILITY

Introduce:

- request ID / correlation ID
- structured logs
- error handling
- performance metrics
- database query monitoring where practical
- background job monitoring
- audit trail

Never log:

- passwords
- tokens
- secrets
- sensitive credentials

Avoid blindly logging entire user objects or request payloads.

---

# PHASE 15 — TESTING

Add or improve tests around high-risk domain logic.

Priority:

1. BOM calculations
2. cycle time
3. machine capacity
4. manpower capacity
5. material requirements
6. planning feasibility
7. scheduling
8. inventory transactions
9. workflow transitions
10. authorization

Tests should validate business behavior, not merely code coverage percentages.

---

# PHASE 16 — MIGRATION SAFETY

Do not attempt the entire refactor in one uncontrolled change.

Use checkpoints.

```text
CHECKPOINT 1
Documentation contract created
Build passes

CHECKPOINT 2
Database foundation exists
Build/typecheck passes

CHECKPOINT 3
Repository interfaces exist
Build/typecheck/tests pass

CHECKPOINT 4
Manufacturing migration
Build/typecheck/tests pass

CHECKPOINT 5
Planning migration
Build/typecheck/tests pass

CHECKPOINT 6
Scheduling migration
Build/typecheck/tests pass

CHECKPOINT 7
Inventory migration
Build/typecheck/tests pass

CHECKPOINT 8
Security/workflow foundation
Build/typecheck/tests pass

CHECKPOINT 9
Server refactor
Build/typecheck/tests pass

CHECKPOINT 10
Final architecture verification
Build/typecheck/tests pass
```

If a checkpoint becomes unstable:

**STOP.**

Fix the checkpoint before proceeding.

Do not pile additional changes onto broken architecture.

---

# PHASE 17 — HANDLING AMBIGUITY

If requirements are ambiguous:

1. Inspect existing implementation.
2. Inspect existing types/data.
3. Inspect related business logic.
4. Prefer preserving existing behavior.
5. Document the ambiguity.
6. Do not invent a critical business rule silently.

For non-critical implementation details, choose the simplest production-safe option.

For critical business rules, create a clearly marked decision/TBD.

---

# PHASE 18 — NO FAKE IMPLEMENTATION

Never satisfy architecture requirements with fake code.

Forbidden examples:

```text
return []
```

for real ERP data.

```text
return true
```

for authorization.

```text
mockInventory()
```

as production persistence.

```text
setTimeout(...)
```

pretending to be a job queue.

```text
localStorage
```

pretending to be the production ERP database.

These are allowed only as explicitly documented temporary migration adapters where appropriate.

If infrastructure cannot be fully completed in the current task, implement a clean boundary and clearly document what remains.

---

# PHASE 19 — PRESERVE EXISTING BUSINESS VALUE

The existing repository already contains domain knowledge.

Do not throw it away.

Especially inspect and preserve valid logic around:

- BOM
- routing
- cycle time
- machine capacity
- manpower
- production
- inventory
- planning
- scheduling
- workflow
- NPI
- engineering

Refactoring should improve structure without unnecessarily destroying domain knowledge.

---

# PHASE 20 — EXECUTION ORDER

Execute the work in this order unless repository evidence requires a safer variation:

```text
1. Repository discovery
2. Create Markdown engineering contract
3. Verify Markdown contract
4. Architecture assessment
5. Database/persistence foundation
6. Repository interfaces
7. Source-of-truth migration strategy
8. Manufacturing service decomposition
9. PPIC decomposition
10. Planning UI refactor
11. Types decomposition
12. Server decomposition
13. Security foundation
14. Workflow foundation
15. Performance improvements
16. Async heavy computation boundaries
17. Observability
18. Tests
19. Final architecture audit
```

Do not jump directly to adding new ERP features before the architecture foundation is stable.

---

# PHASE 21 — DEFINITION OF DONE

## Architecture

- modular monolith is established
- domain boundaries are clear
- dependencies are understandable
- UI is separated from business logic
- infrastructure is separated from domain

## Persistence

- PostgreSQL is the target source of truth
- relational schema is used
- migrations exist
- repositories exist
- transaction boundaries exist
- localStorage is not the ERP source of truth

## Manufacturing

- manufacturing logic is modular
- BOM is relationally modeled
- routing is modular
- cycle time is preserved
- machine/manpower concepts are preserved

## Planning

- planning is separated from scheduling
- planning calculations are not embedded in UI
- capacity/material logic is reusable

## Scheduling

- finite capacity concepts are separated
- machine/shift/calendar/setup/changeover are modeled appropriately

## Inventory

- inventory is transaction-oriented
- inventory-affecting operations are transactional

## Workflow

- reusable workflow engine boundary exists
- workflow is not coupled to one module

## Security

- server-side authorization exists
- RBAC exists or has a real migration path
- organization/data scope is represented
- validation exists
- audit architecture exists

## Performance

- server-side pagination exists for large datasets
- query efficiency is considered
- N+1 risks are addressed
- heavy computation has an async-ready boundary

## Quality

- build passes
- typecheck passes
- tests pass where applicable
- no major runtime errors introduced
- no critical TODOs hidden inside fake implementations

---

# PHASE 22 — FINAL REPORT

At the end of each major execution session, report:

## Completed

List concrete changes.

## Files Added

List new files.

## Files Modified

List important modified files.

## Architecture Changes

Explain the new boundaries.

## Database Changes

Explain schema/migration/repository changes.

## Security Changes

Explain authorization/validation/audit changes.

## Performance Changes

Explain pagination/indexing/query/rendering changes.

## Tests

List:

- typecheck
- build
- unit tests
- integration tests

and their results.

## Remaining Work

List real remaining work.

## Risks / Decisions

List assumptions, unresolved architectural decisions, and migration risks.

Do not claim something is complete if it is only scaffolded.

---

# CRITICAL FINAL INSTRUCTION

You are an implementation agent, not a documentation-only agent.

The Markdown files are created **FIRST** because they define the engineering contract.

After creating them:

1. **READ THEM.**
2. **FOLLOW THEM.**
3. **EXECUTE THE REFACTOR.**
4. **VERIFY THE RESULT.**
5. **CONTINUE UNTIL A STABLE CHECKPOINT IS REACHED.**

Do not stop after creating the Markdown files unless:

- the repository cannot be safely modified,
- a required external credential/infrastructure is genuinely unavailable,
- or the remaining work cannot be completed safely within the current execution limit.

If the execution limit is reached:

> **STOP AT THE LAST STABLE CHECKPOINT.**

Never leave the repository in a knowingly broken state just to claim more progress.

The final goal is not "more files".

The final goal is:

> **A maintainable, secure, database-first, scalable, production-grade manufacturing ERP with clear domain boundaries and preserved existing business functionality.**
