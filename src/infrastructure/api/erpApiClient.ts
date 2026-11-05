/**
 * Authoritative ERP Typed API Client.
 *
 * Centralizes HTTP requests from presentation hooks to backend Express CQRS routes.
 * Operates across the network using cryptographically signed Bearer authentication tokens.
 * Sourced cleanly for browser environments without importing Node.js server dependencies.
 */

import type { PurchaseOrder, PurchaseRequisition, PurchaseOrderStatus, PurchaseRequisitionStatus, ProductionOrder, MaterialRequest, StockMovement, QualityInspection, NonConformanceReport } from '../../types';
import type { CreatePurchaseRequisitionCommand } from '../../modules/procurement/application/commands/createPurchaseRequisitionCommand';
import type { PaginatedResult } from '../../shared/kernel/pagination';
import type { BucketBalance, BucketTransferInput } from '../../modules/inventory/inventoryLedgerService';
import type { InventoryBalanceItem } from '../../modules/inventory/application/queries/listInventoryBalancesQuery';
import type { InspectionEvaluationInput, InspectionEvaluationResult, NcrResolutionResult } from '../../modules/quality/qualityService';
import type { ReleaseQcInspectionResult } from '../../modules/quality/application/commands/releaseQcInspectionCommand';

export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    userId: string;
    username: string;
    email: string;
    fullName: string;
    roles: string[];
    plantScope: string[];
    organizationId: string;
    status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  };
}

export interface MeResponse {
  authenticated: boolean;
  user: {
    userId: string;
    username?: string;
    email?: string;
    fullName?: string;
    role: string;
    roles?: string[];
    plantScope?: string[];
    organizationId: string;
    permissions: string[];
    status?: string;
  };
}

export interface ApiClientConfig {
  baseUrl?: string;
  defaultRole?: string;
  token?: string;
}

export class ErpApiClient {
  private baseUrl: string;
  private currentRole: string;
  private token: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? '';
    this.currentRole = config.defaultRole ?? 'Planner';
    this.token = config.token ?? null;

    if (!this.token && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        this.token = window.sessionStorage.getItem('kranex_erp_token');
      } catch {
        // Restricted storage fallback
      }
    }
  }

  setRole(role: string): void {
    if (this.currentRole !== role) {
      this.currentRole = role;
      this.setToken(null);
    }
  }

  getRole(): string {
    return this.currentRole;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        if (token) {
          window.sessionStorage.setItem('kranex_erp_token', token);
        } else {
          window.sessionStorage.removeItem('kranex_erp_token');
        }
      } catch {
        // Restricted storage fallback
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * Performs server-verified credential authentication.
   */
  async login(credentials: { identifier: string; password: string }): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = 'Invalid credentials.';
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.error === 'string') {
          errorMessage = errorJson.error;
        }
      } catch {
        // Fallback message
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as LoginResponse;
    this.setToken(data.token);
    if (data.user?.roles?.[0]) {
      this.currentRole = data.user.roles[0];
    }
    return data;
  }

  /**
   * Signs out current user session.
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch {
      // Continue clearing local token
    } finally {
      this.setToken(null);
    }
  }

  /**
   * Resolves current verified user profile from server.
   */
  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/api/auth/me');
  }

  readonly auth = {
    login: (credentials: { identifier: string; password: string }) => this.login(credentials),
    logout: () => this.logout(),
    getMe: () => this.getMe(),
  };

  /**
   * Securely acquires a signed development Bearer token from the server auth endpoint.
   */
  async acquireDevToken(role = this.currentRole): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/erp/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.token === 'string') {
          this.token = data.token;
          return this.token;
        }
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  private async ensureToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    if (!this.tokenPromise) {
      this.tokenPromise = this.acquireDevToken(this.currentRole).finally(() => {
        this.tokenPromise = null;
      });
    }
    return this.tokenPromise;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (!headers.has('Authorization')) {
      const token = await this.ensureToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
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

    getWorkOrder: (id: string): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(`/api/erp/production-orders/${encodeURIComponent(id)}`);
    },

    createProductionOrder: (data: {
      productId: string;
      quantity: number;
      dueDate: string;
      plantId?: string;
      actorName?: string;
    }): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>('/api/erp/production-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    releaseWorkOrder: (
      id: string,
      overrideReason?: string,
      actor: { actorName?: string; actorRole?: string } = {}
    ): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(`/api/erp/production-orders/${encodeURIComponent(id)}/release`, {
        method: 'POST',
        body: JSON.stringify({
          overrideReason,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
        }),
      });
    },

    startOperation: (
      orderId: string,
      operationSequence: number,
      operatorName: string
    ): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(
        `/api/erp/production-orders/${encodeURIComponent(orderId)}/operations/${operationSequence}/start`,
        {
          method: 'POST',
          body: JSON.stringify({ operatorName }),
        }
      );
    },

    completeOperation: (
      orderId: string,
      operationSequence: number,
      actor: { actorName?: string; actorRole?: string } = {}
    ): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(
        `/api/erp/production-orders/${encodeURIComponent(orderId)}/operations/${operationSequence}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            actorName: actor.actorName,
            actorRole: actor.actorRole,
          }),
        }
      );
    },

    closeWorkOrder: (
      orderId: string,
      actor: { actorName?: string; actorRole?: string } = {}
    ): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(`/api/erp/production-orders/${encodeURIComponent(orderId)}/close`, {
        method: 'POST',
        body: JSON.stringify({
          actorName: actor.actorName,
          actorRole: actor.actorRole,
        }),
      });
    },

    planWorkOrder: (
      orderId: string,
      payload: { bom: unknown; routing: unknown; actor?: string; role?: string }
    ): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(`/api/erp/production-orders/${encodeURIComponent(orderId)}/plan`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    cancelWorkOrder: (
      orderId: string,
      payload: { reason: string; actor?: string; role?: string }
    ): Promise<ProductionOrder> => {
      return this.request<ProductionOrder>(`/api/erp/production-orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    listMaterialRequests: (params: {
      page?: number;
      limit?: number;
      sourceType?: string;
      status?: string;
      destinationLine?: string;
    } = {}): Promise<{
      requests: MaterialRequest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.sourceType) search.set('sourceType', params.sourceType);
      if (params.status) search.set('status', params.status);
      if (params.destinationLine) search.set('destinationLine', params.destinationLine);

      const qs = search.toString();
      return this.request<{
        requests: MaterialRequest[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/erp/material-requests${qs ? `?${qs}` : ''}`);
    },

    getMaterialRequest: (id: string): Promise<MaterialRequest> => {
      return this.request<MaterialRequest>(`/api/erp/material-requests/${encodeURIComponent(id)}`);
    },

    createMaterialRequest: (payload: {
      sourceType: MaterialRequest['sourceType'];
      sourceReferenceId: string;
      productSku?: string;
      requester?: string;
      department?: string;
      requiredDate?: string;
      destinationLine: string;
      priority?: MaterialRequest['priority'];
      items: Array<{
        productId?: string;
        sku: string;
        name: string;
        requestedQuantity: number;
        pickedQuantity?: number;
        deliveredQuantity?: number;
        uom: string;
        fromWarehouse?: string;
        toLocation?: string;
        status?: string;
      }>;
      notes?: string;
    }): Promise<MaterialRequest> => {
      return this.request<MaterialRequest>('/api/erp/material-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    pickMaterialRequest: (
      id: string,
      payload: { pickedBy?: string; pickedAt?: string } = {}
    ): Promise<MaterialRequest> => {
      return this.request<MaterialRequest>(`/api/erp/material-requests/${encodeURIComponent(id)}/pick`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    deliverMaterialRequest: (
      id: string,
      payload: { deliveredBy?: string; destinationLine?: string; deliveredAt?: string } = {}
    ): Promise<MaterialRequest> => {
      return this.request<MaterialRequest>(`/api/erp/material-requests/${encodeURIComponent(id)}/deliver`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  };

  readonly inventory = {
    listBalances: (params: {
      page?: number;
      limit?: number;
      sku?: string;
      type?: string;
      category?: string;
      belowBufferOnly?: boolean;
    } = {}): Promise<PaginatedResult<InventoryBalanceItem>> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.sku) search.set('sku', params.sku);
      if (params.type) search.set('type', params.type);
      if (params.category) search.set('category', params.category);
      if (params.belowBufferOnly) search.set('belowBufferOnly', 'true');

      const qs = search.toString();
      return this.request<PaginatedResult<InventoryBalanceItem>>(
        `/api/erp/inventory/balances${qs ? `?${qs}` : ''}`
      );
    },

    getBalanceBySku: (sku: string): Promise<BucketBalance> => {
      return this.request<BucketBalance>(`/api/erp/inventory/balances/${encodeURIComponent(sku)}`);
    },

    listMovements: (params: {
      page?: number;
      limit?: number;
      sku?: string;
      movementType?: string;
      stockBucket?: string;
      lotNumber?: string;
    } = {}): Promise<PaginatedResult<StockMovement>> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.sku) search.set('sku', params.sku);
      if (params.movementType) search.set('movementType', params.movementType);
      if (params.stockBucket) search.set('stockBucket', params.stockBucket);
      if (params.lotNumber) search.set('lotNumber', params.lotNumber);

      const qs = search.toString();
      return this.request<PaginatedResult<StockMovement>>(
        `/api/erp/inventory/movements${qs ? `?${qs}` : ''}`
      );
    },

    getMovementById: (id: string): Promise<StockMovement> => {
      return this.request<StockMovement>(`/api/erp/inventory/movements/${encodeURIComponent(id)}`);
    },

    transferStock: (payload: BucketTransferInput): Promise<StockMovement> => {
      return this.request<StockMovement>('/api/erp/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    reverseMovement: (
      id: string,
      payload: { reason?: string; actor?: string; role?: string } = {}
    ): Promise<StockMovement> => {
      return this.request<StockMovement>(`/api/erp/inventory/movements/${encodeURIComponent(id)}/reverse`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    issueMaterial: (payload: {
      orderId: string;
      componentSku: string;
      lotNumber: string;
      quantity: number;
      isHoldOverride?: boolean;
      actor?: string;
      role?: string;
    }): Promise<{ movement: StockMovement; message: string }> => {
      return this.request<{ movement: StockMovement; message: string }>('/api/erp/inventory/issue', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  };

  readonly quality = {
    listInspections: (params: {
      page?: number;
      limit?: number;
      sourceType?: string;
      sourceRef?: string;
      sku?: string;
      lotNumber?: string;
      result?: 'PASS' | 'FAIL' | 'CONCESSION';
      disposition?: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
    } = {}): Promise<PaginatedResult<QualityInspection>> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.sourceType) search.set('sourceType', params.sourceType);
      if (params.sourceRef) search.set('sourceRef', params.sourceRef);
      if (params.sku) search.set('sku', params.sku);
      if (params.lotNumber) search.set('lotNumber', params.lotNumber);
      if (params.result) search.set('result', params.result);
      if (params.disposition) search.set('disposition', params.disposition);

      const qs = search.toString();
      return this.request<PaginatedResult<QualityInspection>>(
        `/api/erp/quality/inspections${qs ? `?${qs}` : ''}`
      );
    },

    getInspection: (id: string): Promise<QualityInspection> => {
      return this.request<QualityInspection>(`/api/erp/quality/inspections/${encodeURIComponent(id)}`);
    },

    evaluateInspection: (payload: InspectionEvaluationInput): Promise<InspectionEvaluationResult> => {
      return this.request<InspectionEvaluationResult>('/api/erp/quality/inspections/evaluate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    releaseInspection: (
      id: string,
      payload: {
        decision: 'PASS' | 'FAIL';
        disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
        notes?: string;
        actor?: string;
        role?: string;
      }
    ): Promise<ReleaseQcInspectionResult> => {
      return this.request<ReleaseQcInspectionResult>(`/api/erp/quality/inspections/${encodeURIComponent(id)}/release`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    listNcrs: (params: {
      page?: number;
      limit?: number;
      status?: string;
      disposition?: string;
      sku?: string;
      orderNumber?: string;
      lotNumber?: string;
    } = {}): Promise<PaginatedResult<NonConformanceReport>> => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.status) search.set('status', params.status);
      if (params.disposition) search.set('disposition', params.disposition);
      if (params.sku) search.set('sku', params.sku);
      if (params.orderNumber) search.set('orderNumber', params.orderNumber);
      if (params.lotNumber) search.set('lotNumber', params.lotNumber);

      const qs = search.toString();
      return this.request<PaginatedResult<NonConformanceReport>>(
        `/api/erp/quality/ncrs${qs ? `?${qs}` : ''}`
      );
    },

    getNcr: (id: string): Promise<NonConformanceReport> => {
      return this.request<NonConformanceReport>(`/api/erp/quality/ncrs/${encodeURIComponent(id)}`);
    },

    resolveNcr: (
      id: string,
      payload: {
        disposition: 'SCRAP' | 'REWORK' | 'USE_AS_IS';
        rootCause: string;
        resolver?: string;
        notes?: string;
      }
    ): Promise<NcrResolutionResult> => {
      return this.request<NcrResolutionResult>(`/api/erp/quality/ncrs/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  };
}

// Default singleton client instance for runtime browser consumption
export const erpApiClient = new ErpApiClient();
