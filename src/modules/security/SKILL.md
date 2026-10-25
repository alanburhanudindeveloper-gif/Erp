# Security Domain Contract

## Purpose

Security must be implemented as a server-side architecture concern. UI permission checks are only a UX feature and never a security boundary.

## Security Model

```text
USER
 ↓
ROLE
 ↓
PERMISSION
 ↓
ORGANIZATION / DATA SCOPE
 ↓
RESOURCE
```

## Required Behaviors

- deny by default
- least privilege
- centralized authorization
- server-side enforcement
- input validation
- rate limiting
- audit logging
- secure secret handling
- secure error handling
- organization/data scope enforcement

## Architectural Rules

- trust the authenticated server-side identity, not frontend-provided values
- validate all sensitive inputs on the backend
- treat authorization as a first-class service concern
- use OWASP ASVS Level 2 as a practical baseline
- do not claim certification beyond what the system truly implements

## Key Principle

Every sensitive API must answer:

- Who is calling?
- What are they allowed to do?
- Which organization/data scope applies?
- What resource are they accessing?
