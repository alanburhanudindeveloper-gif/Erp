# Manufacturing Domain Contract

## Purpose

The manufacturing module owns the operational model for producing goods and managing work execution. It must provide reusable manufacturing logic for planning, scheduling, and execution flows.

## Core Domain Concepts

- Item
- UOM
- BOM
- BOM revision
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

## Mandatory Manufacturing Rules

1. Cycle time is a first-class manufacturing parameter.
2. Routing operations may define machine, work center, cycle time, setup time, manpower, skill, tooling, and output rate.
3. Manufacturing logic must be reusable by planning and scheduling modules.
4. Production execution must be traceable to the order, route, and operation sequence.
5. BOM and routing data must be treated as authoritative master data, not UI-generated state.

## Example Operation Shape

A routing operation may include:

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

## Domain Boundaries

The module is responsible for:

- master data for items and POs
- BOM versioning and effective dates
- routing and operation definitions
- work center and machine definitions
- tooling and tooling requirements
- production order execution and outputs

The module must not silently become a storage layer for unrelated warehouse, HR, or workflow logic.
