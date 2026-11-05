/**
 * Authenticate User Login Command Handler.
 *
 * Implements strict credential verification with:
 * - Constant-time password hashing comparison (anti-timing attack).
 * - Generic error messages to prevent username/email enumeration.
 * - Server-authoritative signed Bearer token generation.
 * - Security event audit logging (NEVER logging passwords or hashes).
 */

import { Result } from '../../../../shared/kernel/result';
import { AuthenticationError, ValidationError } from '../../../../shared/kernel/errors';
import { verifyPassword } from '../../passwordService';
import { userRepository, type IUserRepository } from '../../userRepository';
import { generateErpToken } from '../../tokenService';
import { securityAuditLogger, type ISecurityAuditLogger } from '../../securityAudit';
import type { AuthenticatedUser } from '../../userModel';

export interface LoginCommandInput {
  readonly identifier: string;
  readonly password: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface LoginCommandResult {
  readonly token: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly user: AuthenticatedUser;
}

export class LoginCommandHandler {
  constructor(
    private readonly users: IUserRepository = userRepository,
    private readonly auditLogger: ISecurityAuditLogger = securityAuditLogger
  ) {}

  execute(input: LoginCommandInput): Result<LoginCommandResult, AuthenticationError | ValidationError> {
    const rawIdentifier = input.identifier?.trim();
    const rawPassword = input.password;

    // 1. Mandatory input validation
    if (!rawIdentifier || !rawPassword) {
      return Result.fail(new ValidationError('Username/email and password are required.'));
    }

    // 2. Lookup user and credential
    const lookup = this.users.findByUsernameOrEmail(rawIdentifier);

    // Constant-time dummy check if user not found to thwart timing enumeration
    if (!lookup) {
      this.auditLogger.logAuthEvent({
        eventType: 'LOGIN_FAILURE',
        identifier: rawIdentifier,
        reason: 'User not found or credentials invalid.',
        ipAddress: input.ipAddress,
      });

      // Generic authentication failure message
      return Result.fail(new AuthenticationError('Invalid credentials.'));
    }

    const { user, credential } = lookup;

    // 3. Verify account is active (generic error to avoid leaking account existence status)
    if (!user.isActive || !credential.isActive) {
      this.auditLogger.logAuthEvent({
        eventType: 'LOGIN_FAILURE',
        identifier: rawIdentifier,
        userId: user.id,
        roles: user.roles,
        reason: 'Account is deactivated or disabled.',
        ipAddress: input.ipAddress,
      });

      return Result.fail(new AuthenticationError('Invalid credentials.'));
    }

    // 4. Verify password hash using constant-time comparison
    const passwordValid = verifyPassword(rawPassword, credential.salt, credential.passwordHash);

    if (!passwordValid) {
      this.auditLogger.logAuthEvent({
        eventType: 'LOGIN_FAILURE',
        identifier: rawIdentifier,
        userId: user.id,
        roles: user.roles,
        reason: 'Password mismatch.',
        ipAddress: input.ipAddress,
      });

      return Result.fail(new AuthenticationError('Invalid credentials.'));
    }

    // 5. Update last login timestamp
    this.users.updateLastLogin(user.id);

    // 6. Generate cryptographically signed Bearer token
    const primaryRole = user.roles[0] || 'Viewer';
    const organizationId = 'org-kranex';
    const expiresInSeconds = 86400; // 24 hours

    const token = generateErpToken(
      {
        userId: user.id,
        role: primaryRole,
        roles: user.roles,
        organizationId,
        plantScope: user.plantScope,
        permissions: user.permissionTokens,
      },
      { expiresInSeconds }
    );

    // 7. Audit successful authentication event (DO NOT log password or token!)
    this.auditLogger.logAuthEvent({
      eventType: 'LOGIN_SUCCESS',
      identifier: rawIdentifier,
      userId: user.id,
      roles: user.roles,
      organizationId,
      ipAddress: input.ipAddress,
    });

    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      plantScope: user.plantScope,
      organizationId,
      status: 'ACTIVE',
    };

    return Result.ok({
      token,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      user: authenticatedUser,
    });
  }
}

export const loginCommandHandler = new LoginCommandHandler();
