# Database Architecture Contract

## Purpose

The ERP should use PostgreSQL as the target production database unless the repository clearly shows a better justified alternative. Database design must support relational integrity, transaction safety, and query efficiency.

## Database Requirements

- relational schema with foreign keys and constraints
- transactions for state-changing operations
- migration system
- repository abstraction
- indexes based on actual query patterns
- no giant ERP JSON state table as the primary source of truth
- no authoritative ERP data in browser localStorage
- avoid N+1 patterns in access layers
- server-side pagination and filtering

## Preferred Approach

Use a mature PostgreSQL-compatible ORM or query builder after inspecting the repository. Suitable candidates include Prisma, Drizzle, or a comparable mature option.

Do not impose a library blindly. Choose the approach that fits the codebase and team constraints.

## Architectural Guardrails

Large tables may include:

- inventory transactions
- production transactions
- audit logs
- workflow history
- downtime events
- historical planning and scheduling results

Partitioning should only be added when workload and access patterns justify it. Do not partition everything unnecessarily.

## Core Principle

Data persistence should be a repository-backed infrastructure concern, not a UI concern or a JavaScript-memory-only implementation.
