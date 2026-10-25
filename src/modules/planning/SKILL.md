# Planning Domain Contract

## Purpose

Planning is responsible for determining whether production demand is feasible. It evaluates whether existing materials, capacity, and operations can support the target output.

## Planning Responsibilities

Planning must consider:

- demand
- BOM
- material requirements
- machine capacity
- manpower capacity
- cycle time
- output rate
- machine quantity
- bottlenecks
- material availability
- production feasibility

## Planning Flow

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

## Non-Goals

Planning must not become the finite scheduling engine. It should answer whether a plan is achievable, not prescribe the exact machine sequence and timestamp allocation.

Heavy MRP and planning calculations should be run asynchronously when the workload demands it.

## Boundary Requirements

- UI code must not embed the core planning formulas.
- domain logic must remain in reusable service or calculation modules.
- schedule generation and production sequencing belong to the scheduling domain.

## Key Invariants

- planning should expose feasibility, shortages, and bottlenecks
- output is a feasibility result, not a final finite schedule
- planning logic must be deterministic and auditable
