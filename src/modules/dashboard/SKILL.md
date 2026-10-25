# Dashboard Domain Contract

## Purpose

The dashboard module presents operational KPIs and management summaries. It is a read-oriented presentation layer for decision support, not the source of authoritative ERP state.

## Core Responsibilities

- plant and operational KPI views
- exception and bottleneck highlights
- management summaries
- executive drill-down navigation
- state aggregation from ERP services

## Mandatory Rules

1. Dashboard metrics must be derived from server-side data or domain service outputs.
2. UI state may hold filters and display preferences, but not ERP truth.
3. KPI explanations must reference actual underlying context and data sources.
4. Ad hoc calculations in the component layer should be minimized or moved to a shared domain/service layer.
5. AI recommendations must remain advisory and must not bypass deterministic ERP logic.

## Domain Boundaries

Dashboard is a presentation and coordination layer. It consumes ERP state but does not define the rules that generate it.
