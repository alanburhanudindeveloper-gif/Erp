/**
 * Get Current Authenticated User Query Handler.
 *
 * Resolves verified profile data for the active authenticated session context.
 */

import { Result } from '../../../../shared/kernel/result';
import { NotFoundError } from '../../../../shared/kernel/errors';
import { userRepository, type IUserRepository } from '../../userRepository';
import type { AuthenticatedUser } from '../../userModel';

export interface GetCurrentUserQueryInput {
  readonly userId: string;
}

export class GetCurrentUserQueryHandler {
  constructor(private readonly users: IUserRepository = userRepository) {}

  execute(input: GetCurrentUserQueryInput): Result<AuthenticatedUser, NotFoundError> {
    const user = this.users.findById(input.userId);
    if (!user) {
      return Result.fail(new NotFoundError('UserAccount', input.userId));
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      plantScope: user.plantScope,
      organizationId: 'org-kranex',
      status: user.isActive ? 'ACTIVE' : 'DISABLED',
    };

    return Result.ok(authenticatedUser);
  }
}

export const getCurrentUserQueryHandler = new GetCurrentUserQueryHandler();
