# Inventory Domain Contract

## Purpose

Inventory must be treated as a transaction-based accounting and logistics capability. It should not be represented solely as a `currentStock` field on product records.

## Preferred Model

```text
Inventory Transactions
        ↓
Inventory Balance / Projection
```

## Transaction Types

Inventory transactions may include:

- receipt
- issue
- transfer
- adjustment
- production consumption
- production output
- reservation
- release
- scrap

## Mandatory Rules

1. Inventory-affecting operations must use transaction boundaries.
2. Inventory, reservations, production results, and audit records must remain consistent.
3. Balance calculation must be derived from transactional history when possible.
4. Production activity and inventory movements must be correlated to a traceable source record.

## Architectural Guardrails

- inventory is not just a UI property on an item master
- transactions must be auditable
- inventory states must be derived from consistent transaction records
- master data and transaction data must remain separated
