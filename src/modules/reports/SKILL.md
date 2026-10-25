# Reports Domain Contract

## Purpose

The reports module produces operational, performance, and governance views that are derived from ERP business data, not from ephemeral UI state.

## Core Responsibilities

- KPI and dashboard reporting
- operational performance summaries
- variance and exception reporting
- audit and compliance extracts
- drill-down support into source records

## Mandatory Rules

1. Reports must use server-side ERP data or deterministic service outputs.
2. Dashboard metrics must be traceable to source transactions and rules.
3. Exception reporting must include context, thresholds, and affected entities.
4. Report logic must not duplicate business logic hidden in UI components.
5. Reporting outputs must remain consistent with audit and governance boundaries.

## Domain Boundaries

Reports are a consumer of enterprise data and business services. They must not contain the authoritative rules that create the underlying ERP state.
