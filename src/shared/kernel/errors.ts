/**
 * Standard Domain and Application error types hierarchy for ERP domain boundaries.
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string, readonly details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND_ERROR';

  constructor(entityName: string, entityId: string) {
    super(`${entityName} with identifier "${entityId}" was not found.`, { entityName, entityId });
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT_ERROR';
}

export class AuthorizationError extends DomainError {
  readonly code = 'AUTHORIZATION_ERROR';
}

export class InvariantViolationError extends DomainError {
  readonly code = 'INVARIANT_VIOLATION_ERROR';
}
