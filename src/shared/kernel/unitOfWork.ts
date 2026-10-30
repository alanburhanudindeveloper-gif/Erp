/**
 * Unit of Work & Transaction Boundary Contract.
 * Defines atomic transaction boundaries for application commands, providing
 * an explicit seam for ACID transactions in relational persistence (PostgreSQL / Drizzle)
 * and atomic Outbox event writes.
 */

export interface IUnitOfWork {
  /**
   * Executes the given work within an atomic transaction boundary.
   */
  execute<T>(work: () => Promise<T> | T): Promise<T>;
}

/**
 * Synchronous / in-memory Unit of Work implementation for the in-memory persistence seam.
 */
export class InMemoryUnitOfWork implements IUnitOfWork {
  async execute<T>(work: () => Promise<T> | T): Promise<T> {
    return await work();
  }
}
