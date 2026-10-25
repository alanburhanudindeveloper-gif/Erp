# Engineering Domain Contract

## Purpose

The engineering module manages product definition, technical change control, and design-to-manufacturing enablement. It must preserve revision integrity and maintain traceability across engineering change and release activity.

## Core Responsibilities

- product and BOM design data
- engineering change requests (ECR)
- revision control and effectivity
- design release and sign-off states
- technical documentation supporting manufacturing

## Mandatory Rules

1. Engineering data must preserve revision snapshots for in-flight production orders.
2. ECR changes must not silently mutate active production baselines without explicit authorization.
3. Design release and product release gates must be separate concerns.
4. Previous revisions must remain queryable for traceability and root-cause analysis.
5. Engineering decisions must be visible through audit and governance workflows.

## Domain Boundaries

Engineering may depend on master data, workflow, and quality domains, but it must not own the ERP execution model for scheduling or shop-floor production events.
