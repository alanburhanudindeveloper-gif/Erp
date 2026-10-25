# Learn Domain Contract

## Purpose

The learn module provides guided operational education, process explanations, and onboarding material. It helps users understand ERP flows without becoming a source of operational authority.

## Core Responsibilities

- manufacturing process education
- guided workflows and playbooks
- scenario explanations and walkthroughs
- operational knowledge surfaces
- contextual help for complex ERP flows

## Mandatory Rules

1. Learn content must not be treated as executable ERP logic.
2. Any instructional guidance must reflect actual business process boundaries and rules.
3. Educational modules must not bypass the server-side authorization or domain business rules.
4. The learn layer must remain descriptive and supportive, not authoritative.
5. Process examples should be aligned with the real ERP domain structure.

## Domain Boundaries

Learn is a user enablement layer. It consumes ERP structure and rules but does not own transactional state, controls, or operational decisions.
