/**
 * Security User & Credential Domain Models.
 *
 * Keeps authentication identity and credential verification cleanly separated
 * from employee/master-data domain models.
 */

export interface UserCredential {
  readonly id: string;
  readonly userId: string;
  readonly username: string;
  readonly email: string;
  readonly salt: string;
  readonly passwordHash: string;
  readonly isActive: boolean;
  failedAttempts: number;
  lockedUntil?: string | null;
}

export interface AuthenticatedUser {
  readonly userId: string;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: string[];
  readonly plantScope: string[];
  readonly organizationId: string;
  readonly status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
}

export interface LoginAuditPayload {
  readonly identifier: string;
  readonly success: boolean;
  readonly userId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly failureReason?: string;
  readonly timestamp: string;
}
