# Scheduling Domain Contract

## Purpose

Scheduling is responsible for finite production scheduling. It defines when, where, and on which machine production should happen.

## Scheduling Responsibilities

Scheduling considers:

- production requirement
- machine availability
- machine capacity
- shift
- production calendar
- manpower availability
- cycle time
- setup time
- changeover
- operation sequence
- machine assignment
- scheduling constraints

## Scheduling Flow

```text
Production Requirement
        ↓
Available Machines
        ↓
Shift / Calendar
        ↓
Cycle Time
        ↓
Setup / Changeover
        ↓
Finite Schedule
```

## Question It Answers

- Planning: "Can we produce this?"
- Scheduling: "When, where, and on which machine should we produce it?"

## Boundary Requirements

- scheduling should not absorb planning feasibility logic
- finite scheduling must rely on valid machine, manpower, calendar, and routing inputs
- sequencing decisions must be explicit and auditable
- operational constraints must be captured, not hidden in a UI-only view

## Key Invariants

- scheduling is finite and time-dependent
- it must respect resource availability and calendars
- it must not replace the planning feasibility step
