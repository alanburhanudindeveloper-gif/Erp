# AGENTS.md

## Repository Mission

This repository is a manufacturing ERP application that must evolve into a maintainable, production-grade ERP platform. The goal is a modular monolith with clear domain boundaries, secure server-side authorization, deterministic business logic, relational persistence, and a clean separation between UI state and ERP source of truth.

This project currently contains a Vite + React + TypeScript frontend and an Express + TypeScript server. The existing implementation is a working reference, not a blank canvas. The engineering objective is to improve architecture without breaking working functionality.

## Mandatory Agent Behavior

The agent MUST:

- inspect the repository before making changes
- understand the current implementation before replacing or refactoring it
- prefer incremental, boundary-based refactoring over broad rewrites
- preserve existing working behaviors where valid
- reuse existing domain logic when the logic is sound
- keep the application buildable and runnable throughout the refactor
- run type checking and build verification after meaningful changes
- keep domain boundaries explicit and documented
- differentiate UI state from ERP source-of-truth data
- explain architecture assumptions and trade-offs when changing business logic

The agent MUST NOT:

- rewrite the entire application in one pass
- introduce fake/mock production logic or placeholder data as a substitute for real ERP behavior
- store authoritative ERP data in browser localStorage
- put ERP business rules directly into UI components
- bypass server-side authorization checks
- merge planning and scheduling responsibilities into one module
- hide type safety issues with broad `any`, unsafe casts, or disabled checks
- delete existing functionality simply to simplify the refactor
- create empty layering or architecture shells without a real responsibility

## Preferred Change Strategy

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

Never:

Delete everything
  ↓
Rewrite
  ↓
Hope it works

## Repository-Specific Guidance

This repo currently has a strong front-end state model centered on localStorage and large UI-driven datasets. That approach is useful for demo interactions but not acceptable as the ERP source of truth for master data, inventory, production orders, workflows, or planning results.

The server layer is a key boundary for AI, authorization, and deterministic transaction logic. AI features may assist with extraction, recommendations, and summaries, but AI output must not bypass business validation or replace the ERP transaction engine.

## Change Principles

1. Keep the modular monolith as the target architecture.
2. Separate presentation, application, domain, and infrastructure responsibilities.
3. Use PostgreSQL as the eventual persistence target, with repository abstractions and migration tooling.
4. Treat planning and scheduling as different capabilities with different outputs.
5. Preserve auditability and traceability for manufacturing and governance workflows.
6. Keep calculations in domain/service layers, not in React components.
7. Use UI permission checks only for experience and hints, not as the actual security boundary.

## Verification Expectations

After meaningful changes, verify with the repo’s relevant checks such as:

- `npm run lint`
- `npm run build`

If a deeper refactor is underway, add focused tests for high-risk ERP domain logic such as BOM explosion, cycle time, machine capacity, manpower capacity, planning feasibility, scheduling, inventory transactions, workflow transitions, and authorization.

## Source of Truth Rule

ERP transaction data belongs to the backend and database. Browser state is allowed only for temporary UI preferences or ephemeral local UX state. The authoritative data model for production, planning, quality, inventory, and governance decisions must live in server-side application and persistence layers.
