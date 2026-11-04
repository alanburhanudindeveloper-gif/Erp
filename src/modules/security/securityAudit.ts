/**
 * Security Authorization Decision Audit Boundary.
 *
 * Records sensitive authorization decisions (grants & denials) with actor,
 * action, resource, timestamp, and evaluation context.
 */

import type { SecurityScopeContext } from './permissionModel';
import type { SecurityUser } from './roleModel';

export interface SecurityAuditEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly userId: string;
  readonly roles: string[];
  readonly organizationId: string;
  readonly permission: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId?: string;
  readonly decision: 'ALLOWED' | 'DENIED';
  readonly code: string;
  readonly reason?: string;
  readonly scopeContext?: SecurityScopeContext;
}

export interface ISecurityAuditLogger {
  logDecision(entry: Omit<SecurityAuditEntry, 'id' | 'timestamp'>): void;
  getRecentAudits(limit?: number): SecurityAuditEntry[];
  clear(): void;
}

/**
 * In-memory circular ring-buffer security audit logger.
 * Decoupled from relational persistence, ready for eventual PostgreSQL logging.
 */
export class InMemorySecurityAuditLogger implements ISecurityAuditLogger {
  private readonly buffer: SecurityAuditEntry[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  logDecision(entry: Omit<SecurityAuditEntry, 'id' | 'timestamp'>): void {
    const record: SecurityAuditEntry = {
      ...entry,
      id: `sec-aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.buffer.unshift(record);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.pop();
    }
  }

  getRecentAudits(limit = 50): SecurityAuditEntry[] {
    return this.buffer.slice(0, limit);
  }

  clear(): void {
    this.buffer.length = 0;
  }
}

export const securityAuditLogger = new InMemorySecurityAuditLogger();
