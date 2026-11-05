/**
 * Logout Command Handler.
 *
 * Implements server-side audit logging for user logout.
 */

import { Result } from '../../../../shared/kernel/result';
import { securityAuditLogger, type ISecurityAuditLogger } from '../../securityAudit';

export interface LogoutCommandInput {
  readonly userId?: string;
  readonly roles?: string[];
  readonly ipAddress?: string;
}

export class LogoutCommandHandler {
  constructor(private readonly auditLogger: ISecurityAuditLogger = securityAuditLogger) {}

  execute(input: LogoutCommandInput): Result<boolean, never> {
    if (input.userId) {
      this.auditLogger.logAuthEvent({
        eventType: 'LOGOUT',
        userId: input.userId,
        roles: input.roles,
        ipAddress: input.ipAddress,
      });
    }

    return Result.ok(true);
  }
}

export const logoutCommandHandler = new LogoutCommandHandler();
