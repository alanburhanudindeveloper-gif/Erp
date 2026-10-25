# Costing Domain Contract

## Purpose

The costing module owns standard cost rollups, variance analysis, and allocation logic. It translates manufacturing execution data into measurable cost performance and financial insight.

## Core Responsibilities

- standard cost calculation
- material, labor, and overhead rollup
- variance analysis for planned vs actual cost
- production order settlement support
- cost drill-down to underlying transactions

## Mandatory Rules

1. Cost calculations must be deterministic and derived from master data and transaction history.
2. Material, labor, and overhead must remain separately auditable.
3. Variance must be traceable to its originating order or cost object.
4. Costing logic must not be embedded in UI components or ad hoc state.
5. Cost data must respect manufacturing and inventory boundaries.

## Domain Boundaries

Costing consumes ERP data from manufacturing, inventory, and master data, but it must not own transaction posting or physical inventory movement.
