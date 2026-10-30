/**
 * Domain Event Abstraction for Event-Driven Architecture Readiness.
 * Allows domain models and application use cases to emit immutable domain events
 * without coupling to external brokers (e.g., Kafka, RabbitMQ, EventBridge).
 */

export interface IDomainEvent<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
}

export function createDomainEvent<TPayload>(
  eventType: string,
  aggregateId: string,
  aggregateType: string,
  payload: TPayload
): IDomainEvent<TPayload> {
  return Object.freeze({
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    aggregateId,
    aggregateType,
    occurredAt: new Date().toISOString(),
    payload,
  });
}
