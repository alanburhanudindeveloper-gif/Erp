/**
 * Production Authentication Context & Provider.
 *
 * Manages client authentication state, token persistence, and login/logout lifecycle.
 * Ensures the ERP client session is synchronized with the server's authoritative auth state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { erpApiClient, type LoginResponse, type MeResponse } from '../../../infrastructure/api/erpApiClient';
import type { AuthenticatedUser } from '../userModel';

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(() => erpApiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize initial session on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const existingToken = erpApiClient.getToken();
      if (!existingToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const me = await erpApiClient.getMe();
        if (isMounted && me.authenticated && me.user) {
          const authenticatedUser: AuthenticatedUser = {
            userId: me.user.userId,
            username: me.user.username || me.user.userId,
            email: me.user.email || '',
            fullName: me.user.fullName || me.user.username || me.user.userId,
            roles: me.user.roles || [me.user.role],
            plantScope: me.user.plantScope || ['*'],
            organizationId: me.user.organizationId,
            status: (me.user.status as any) || 'ACTIVE',
          };
          setUser(authenticatedUser);
          setToken(existingToken);
        } else {
          erpApiClient.setToken(null);
          setToken(null);
          setUser(null);
        }
      } catch {
        // Invalid or expired token
        erpApiClient.setToken(null);
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const result: LoginResponse = await erpApiClient.login({ identifier, password });
      setUser(result.user);
      setToken(result.token);
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(message);
      setIsLoading(false);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await erpApiClient.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
