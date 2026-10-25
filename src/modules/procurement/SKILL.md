# Procurement Domain Contract

## Purpose

The procurement module manages external supply commitments, purchase requests, supplier interaction, and receipt controls. It must enforce approval thresholds and maintain audit integrity across purchasing decisions.

## Core Responsibilities

- purchase requisitions
- supplier and purchase order data
- approval thresholds and segregation-of-duties checks
- receiving and goods receipt workflows
- supplier quality and compliance context

## Mandatory Rules

1. Purchase requisitions must enforce approval thresholds and independence rules.
2. Requester cannot self-approve their own request.
3. Goods receipt and quality hold routing must remain deterministic and governed.
4. Procurement data must be traceable to supplier, document, status, and approver.
5. UI state must never replace the ERP purchasing record.

## Domain Boundaries

Procurement is a transactional domain that coordinates with workflow, inventory, quality, and governance, but it must not absorb unrelated ERP execution logic.
