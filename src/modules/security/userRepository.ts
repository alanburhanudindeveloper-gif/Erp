/**
 * User & Credential Repository (PostgreSQL-Ready Seam).
 *
 * Implements authoritative in-memory storage for UserAccounts and UserCredentials,
 * participating in the Unit of Work transaction protocol.
 */

import type { UserAccount } from '../../types';
import type { UserCredential, AuthenticatedUser } from './userModel';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import { hashPassword } from './passwordService';

export interface UserLookupResult {
  readonly user: UserAccount;
  readonly credential: UserCredential;
}

export interface IUserRepository extends ITransactionalParticipant {
  findById(id: string): UserAccount | undefined;
  findByUsernameOrEmail(identifier: string): UserLookupResult | undefined;
  listUsers(): UserAccount[];
  saveUser(user: UserAccount, credential?: UserCredential): void;
  updateLastLogin(userId: string): void;
  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

const DEFAULT_DEV_PASSWORD = 'Kranex2026!';

export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, UserAccount>();
  private credentials = new Map<string, UserCredential>();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers(): void {
    const defaultCredentials = hashPassword(DEFAULT_DEV_PASSWORD);

    const seedAccounts: Array<{ user: UserAccount; credentialRole: string; isActive?: boolean }> = [
      {
        user: {
          id: 'usr-budi',
          username: 'budi.planner',
          email: 'budi.santoso@kranex.co.id',
          fullName: 'Budi Santoso',
          employeeId: 'emp-101',
          roles: ['Planner'],
          plantScope: ['PLANT-01'],
          permissionTokens: ['plan.prod_plan.create', 'plan.prod_plan.view'],
          isActive: true,
          lastLoginAt: '2026-10-26 07:15',
        },
        credentialRole: 'Planner',
      },
      {
        user: {
          id: 'usr-agus',
          username: 'agus.spv',
          email: 'agus.pratama@kranex.co.id',
          fullName: 'Agus Pratama',
          employeeId: 'emp-102',
          roles: ['Supervisor'],
          plantScope: ['PLANT-01'],
          permissionTokens: ['mfg.wo.start', 'mfg.wo.complete'],
          isActive: true,
          lastLoginAt: '2026-10-26 06:45',
        },
        credentialRole: 'Supervisor',
      },
      {
        user: {
          id: 'usr-hendra',
          username: 'hendra.ppicmgr',
          email: 'hendra.wijaya@kranex.co.id',
          fullName: 'Hendra Wijaya',
          employeeId: 'emp-103',
          roles: ['Quality Lead', 'Supervisor'],
          plantScope: ['PLANT-01', 'PLANT-02'],
          permissionTokens: ['quality.inspection.evaluate', 'quality.inspection.release'],
          isActive: true,
          lastLoginAt: '2026-10-26 08:00',
        },
        credentialRole: 'Quality Lead',
      },
      {
        user: {
          id: 'usr-bambang',
          username: 'bambang.prodmgr',
          email: 'bambang.sutrisno@kranex.co.id',
          fullName: 'Bambang Sutrisno',
          employeeId: 'emp-104',
          roles: ['Supervisor', 'Plant Manager'],
          plantScope: ['PLANT-01', 'PLANT-02'],
          permissionTokens: ['plan.prod_plan.approve_tier2', 'proc.pr.approve_tier1'],
          isActive: true,
          lastLoginAt: '2026-10-26 07:30',
        },
        credentialRole: 'Supervisor',
      },
      {
        user: {
          id: 'usr-hartono',
          username: 'hartono.plantdir',
          email: 'hartono.hadipuro@kranex.co.id',
          fullName: 'Ir. Hartono Hadipuro',
          employeeId: 'emp-105',
          roles: ['Plant Manager'],
          plantScope: ['*'],
          permissionTokens: ['*'],
          isActive: true,
          lastLoginAt: '2026-10-26 09:00',
        },
        credentialRole: 'Plant Manager',
      },
      {
        user: {
          id: 'usr-viewer',
          username: 'viewer',
          email: 'viewer@kranex.co.id',
          fullName: 'Guest Auditor',
          employeeId: 'emp-999',
          roles: ['Viewer'],
          plantScope: ['*'],
          permissionTokens: [],
          isActive: true,
        },
        credentialRole: 'Viewer',
      },
      {
        user: {
          id: 'usr-disabled',
          username: 'disabled.user',
          email: 'disabled@kranex.co.id',
          fullName: 'Deactivated Employee',
          employeeId: 'emp-000',
          roles: ['Operator'],
          plantScope: ['PLANT-01'],
          permissionTokens: [],
          isActive: false, // Disabled account
        },
        credentialRole: 'Operator',
        isActive: false,
      },
    ];

    for (const item of seedAccounts) {
      this.users.set(item.user.id, item.user);
      this.credentials.set(item.user.id, {
        id: `cred-${item.user.id}`,
        userId: item.user.id,
        username: item.user.username.toLowerCase(),
        email: item.user.email.toLowerCase(),
        salt: defaultCredentials.salt,
        passwordHash: defaultCredentials.hash,
        isActive: item.user.isActive,
        failedAttempts: 0,
      });
    }
  }

  findById(id: string): UserAccount | undefined {
    const user = this.users.get(id);
    return user ? structuredClone(user) : undefined;
  }

  findByUsernameOrEmail(identifier: string): UserLookupResult | undefined {
    const clean = identifier.trim().toLowerCase();
    for (const cred of this.credentials.values()) {
      if (cred.username === clean || cred.email === clean) {
        const user = this.users.get(cred.userId);
        if (user) {
          return {
            user: structuredClone(user),
            credential: structuredClone(cred),
          };
        }
      }
    }
    return undefined;
  }

  listUsers(): UserAccount[] {
    return Array.from(this.users.values()).map((u) => structuredClone(u));
  }

  saveUser(user: UserAccount, credential?: UserCredential): void {
    this.users.set(user.id, structuredClone(user));
    if (credential) {
      this.credentials.set(user.id, structuredClone(credential));
    }
  }

  updateLastLogin(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.users.set(userId, user);
    }
  }

  createSnapshot(): unknown {
    return {
      users: structuredClone(Array.from(this.users.entries())),
      credentials: structuredClone(Array.from(this.credentials.entries())),
    };
  }

  restoreSnapshot(snapshot: unknown): void {
    if (!snapshot || typeof snapshot !== 'object') {
      return;
    }
    const snap = snapshot as {
      users?: Array<[string, UserAccount]>;
      credentials?: Array<[string, UserCredential]>;
    };
    if (snap.users) {
      this.users = new Map(structuredClone(snap.users));
    }
    if (snap.credentials) {
      this.credentials = new Map(structuredClone(snap.credentials));
    }
  }
}

export const userRepository = new InMemoryUserRepository();
