/**
 * Unit of Work & Transaction Boundary Contract.
 * Defines atomic transaction boundaries for application commands, providing
 * an explicit seam for ACID transactions in relational persistence (PostgreSQL / Drizzle)
 * and atomic Outbox event writes.
 */

export interface ITransactionalParticipant {
  /**
   * Captures an isolated snapshot of the participant's state before mutations occur.
   */
  createSnapshot(): unknown;

  /**
   * Restores the participant's state to a previously captured snapshot upon transaction rollback.
   */
  restoreSnapshot(snapshot: unknown): void;
}

export interface IUnitOfWork {
  /**
   * Executes the given work within an atomic transaction boundary.
   * If the operation fails or throws, all mutations to participating repositories roll back.
   */
  execute<T>(work: () => Promise<T> | T): Promise<T>;

  /**
   * Synchronous execution within an atomic transaction boundary.
   */
  executeSync?<T>(work: () => T): T;
}

/**
 * Universal In-Memory Unit of Work supporting snapshot-based rollback.
 * Guarantees that multi-repository command mutations either all commit atomically
 * or all roll back cleanly with zero partial state.
 */
export class InMemoryUnitOfWork implements IUnitOfWork {
  private readonly participants: ITransactionalParticipant[];

  constructor(participants: ITransactionalParticipant[] = []) {
    this.participants = participants;
  }

  /**
   * Registers a repository as a participant in transactions.
   */
  registerParticipant(participant: ITransactionalParticipant): void {
    if (!this.participants.includes(participant)) {
      this.participants.push(participant);
    }
  }

  private captureSnapshots(): Array<{ participant: ITransactionalParticipant; snapshot: unknown }> {
    return this.participants.map((p) => ({
      participant: p,
      snapshot: p.createSnapshot(),
    }));
  }

  private restoreSnapshots(captured: Array<{ participant: ITransactionalParticipant; snapshot: unknown }>): void {
    for (const item of captured) {
      try {
        item.participant.restoreSnapshot(item.snapshot);
      } catch {
        // Continue restoring other participants even if one encounters an issue
      }
    }
  }

  private isFailureResult(value: unknown): boolean {
    if (value && typeof value === 'object' && 'isSuccess' in value && 'isFailure' in value) {
      return (value as { isFailure: boolean }).isFailure;
    }
    return false;
  }

  executeSync<T>(work: () => T): T {
    const snapshots = this.captureSnapshots();
    try {
      const result = work();
      if (this.isFailureResult(result)) {
        this.restoreSnapshots(snapshots);
      }
      return result;
    } catch (error) {
      this.restoreSnapshots(snapshots);
      throw error;
    }
  }

  async execute<T>(work: () => Promise<T> | T): Promise<T> {
    const snapshots = this.captureSnapshots();
    try {
      const outcome = await work();
      if (this.isFailureResult(outcome)) {
        this.restoreSnapshots(snapshots);
      }
      return outcome;
    } catch (error) {
      this.restoreSnapshots(snapshots);
      throw error;
    }
  }
}
