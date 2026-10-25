# Workflow Domain Contract

## Purpose

Workflow is a reusable approval engine that supports business process governance across the ERP. It is not specific to planning alone.

## Potential Consumers

- BOM approval
- production plan approval
- purchase request approval
- engineering change approval
- NPI approval
- work order approval
- quality disposition
- any configurable business approval process

## Conceptual Model

```text
Business Entity
      ↓
Submit
      ↓
Workflow Instance
      ↓
Workflow Step
      ↓
Approval Request
      ↓
Approve / Reject / Delegate
```

## Required Behavior

- support approver configuration
- separate workflow definition from execution
- track approval states and decision history
- allow configurable steps and escalation paths
- support auditing and reviewability

## Boundary Requirements

Workflow configuration and workflow execution are different concerns. A workflow engine must not be tightly coupled to a single business process or UI screen.
