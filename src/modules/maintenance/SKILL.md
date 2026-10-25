# Maintenance Domain Contract

## Purpose

The maintenance module manages machine uptime, downtime events, maintenance tickets, and equipment availability. It separates lost-time events from production results to preserve operational integrity.

## Core Responsibilities

- maintenance ticketing
- downtime event tracking
- equipment status visibility
- repair and resolution workflow
- downtime impact reporting

## Mandatory Rules

1. Downtime must be tracked separately from production cycle time and OEE performance.
2. Maintenance events must reference the affected work center, equipment, and reason.
3. Resolution actions must be auditable and time-stamped.
4. Lost time must not be silently folded into production output data.
5. Maintenance decisions must be consistent with the operational and governance model.

## Domain Boundaries

Maintenance may interact with manufacturing and dashboard domains, but it must not own production order execution logic or ERP master data definitions.
