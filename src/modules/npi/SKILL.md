# NPI Domain Contract

## Purpose

The NPI module manages new product introduction and release readiness. It ensures that products cannot be treated as fully commercial without satisfying the required readiness gate.

## Core Responsibilities

- NPI milestone tracking
- readiness review and gate checks
- product release package coordination
- pilot and commercial transition control
- engineering and quality readiness validation

## Mandatory Rules

1. NPI products must remain constrained by readiness gate checks before commercial release.
2. Pilot and commercial states must remain distinct and explicit.
3. Release decisions must be auditable and tied to approval roles.
4. In-flight manufacturing orders must not bypass the product release gate.
5. Product readiness criteria must be reusable across governance and workflow transitions.

## Domain Boundaries

NPI is a policy and coordination domain, not the execution engine for routine operations. It coordinates with engineering, quality, workflow, and manufacturing without taking over their core responsibilities.
