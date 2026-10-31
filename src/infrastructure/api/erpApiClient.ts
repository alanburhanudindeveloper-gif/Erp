/**
 * Authoritative ERP Typed API Client.
 *
 * Centralizes HTTP requests from presentation hooks to backend Express CQRS routes.
 * Employs cryptographically signed Bearer authentication tokens for verified server-side identity.
 */

import type { PurchaseOrder, PurchaseRequisition, PurchaseOrderStatus, PurchaseRequisitionStatus, ProductionOrder } from '../../types';
import type { CreatePurchaseRequisitionCommand } from '../../modules/procurement/application/commands/createPurchaseRequisitionCommand';
import type { PaginatedResult } from '../../shared/kernel/pagination';
import { createDevToken } from '../../modules/security/tokenService';

export interface ApiClientConfig {
  baseUrl?: string;
  defaultRole?: string;
  token?: string;
}

export class ErpApiClient {
  private baseUrl: string;
  private currentRole: string;
  private token: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? '';
    this.currentRole = config.defaultRole ?? 'Planner';
    this.token = config.token ?? createDevToken(this.currentRole);
  }

  setRole(role: string, userId?: string, orgId?: string): void {
    this.currentRole = role;
    this.token = createDevToken(role, userId, orgId);
  }

  getRole(): string {
    return this.currentRole;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.error === 'string') {
          errorMessage = errorJson.error;
        } else if (errorJson && typeof errorJson.reason === 'string') {
          errorMessage = errorJson.reason;
        }
      } catch {
        // use fallback statusText
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  readonly procurement = {
    listPurchaseRequisitions: (params: {
      page?: number;
      limit?: number;
      status?: PurchaseRequisitionStatus;
      department?: string;
    } = {}): Promise<PaginatedResult<PurchaseRequisition>> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.status) search.set('status', params.status);
      if (params.department) search.set('department', params.department);

      const qs = search.toString();
      return this.request<PaginatedResult<PurchaseRequisition>>(
        `/api/erp/procurement/purchase-requisitions${qs ? `?${qs}` : ''}`
      );
    },

    createPurchaseRequisition: (command: CreatePurchaseRequisitionCommand): Promise<PurchaseRequisition> => {
      return this.request<PurchaseRequisition>('/api/erp/procurement/purchase-requisitions', {
        method: 'POST',
        body: JSON.stringify(command),
      });
    },

    approvePurchaseRequisition: (
      prId: string,
      actor: { actorName: string; actorRole: string }
    ): Promise<PurchaseRequisition> => {
      return this.request<PurchaseRequisition>(
        `/api/erp/procurement/purchase-requisitions/${encodeURIComponent(prId)}/approve`,
        {
          method: 'POST',
          body: JSON.stringify(actor),
        }
      );
    },

    listPurchaseOrders: (params: {
      page?: number;
      limit?: number;
      status?: PurchaseOrderStatus;
      supplierId?: string;
    } = {}): Promise<PaginatedResult<PurchaseOrder>> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.status) search.set('status', params.status);
      if (params.supplierId) search.set('supplierId', params.supplierId);

      const qs = search.toString();
      return this.request<PaginatedResult<PurchaseOrder>>(
        `/api/erp/procurement/purchase-orders${qs ? `?${qs}` : ''}`
      );
    },
  };

  readonly manufacturing = {
    listWorkOrders: (params: {
      page?: number;
      limit?: number;
      status?: string;
      sku?: string;
      plantId?: string;
    } = {}): Promise<{ orders: ProductionOrder[]; total: number; page: number; limit: number; totalPages: number }> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.status) search.set('status', params.status);
      if (params.sku) search.set('sku', params.sku);
      if (params.plantId) search.set('plantId', params.plantId);

      const qs = search.toString();
      return this.request<{ orders: ProductionOrder[]; total: number; page: number; limit: number; totalPages: number }>(
        `/api/erp/production-orders${qs ? `?${qs}` : ''}`
      );
    },
  };
}

// Default singleton client instance for runtime browser consumption
export const erpApiClient = new ErpApiClient();
