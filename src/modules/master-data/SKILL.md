# Master Data Domain Contract

## Purpose

The master data domain defines the authoritative static and semi-static data that the ERP depends on. It is the foundation for product, BOM, routing, work center, and resource integrity.

## Core Responsibilities

- item master and product definition
- UOM and classification data
- BOM and routing master definitions
- plant, warehouse, and work center metadata
- machine, tooling, and employee reference data

## Mandatory Rules

1. Inactive or archived master data must not be used for new transactions without explicit approval.
2. BOM and routing records must be version-aware and traceable.
3. Data changes must preserve historical validity and audit context.
4. Master data must be deterministic and reusable across manufacturing, planning, and scheduling.
5. UI-driven edits are never the system of record for ERP master data.

## Domain Boundaries

The module owns definitions, not execution. It should not absorb workflow approval logic, production order execution, or financial settlement logic.
