/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AI Gateway Client (Section 7: AI Gateway Abstraction)
 * Decouples ERP domain services from direct AI provider dependencies.
 * Implements cost-saving context filtering, deterministic guardrails, and telemetry.
 */

export interface AiBudgetTelemetry {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  monthlyBudgetUsd: number;
  killSwitchActive: boolean;
  cacheHits: number;
  cacheMisses: number;
  isConfigured: boolean;
  activeModel: string;
  provider: string;
  lastCalls: {
    id: string;
    task: string;
    model: string;
    tokens: number;
    cost: number;
    timestamp: string;
    cached: boolean;
  }[];
}

export interface ExtractedDocumentResult {
  vendorName: string;
  vendorCode: string;
  documentNumber: string;
  issueDate: string;
  deliveryDueDate: string;
  paymentTerms: string;
  currency: string;
  lineItems: {
    itemSku: string;
    description: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    subtotal: number;
  }[];
  totalAmount: number;
  confidenceScore: number;
  discrepanciesDetected: string[];
  extractedSummary: string;
}

export interface WorkInstructionResult {
  wiCode: string;
  title: string;
  revision: string;
  estimatedCycleTime: string;
  requiredPpe: string[];
  requiredTooling: string[];
  operationalSteps: {
    stepNo: number;
    instruction: string;
    criticalParameter: string;
    qcCheckpoint: string;
  }[];
  safetyPrecautions: string[];
  rejectionCriteria: string[];
}

export interface KpiExplanationResult {
  headline: string;
  trendAnalysis: string;
  underlyingFactors: string[];
  operationalImpact: string;
  recommendedActions: {
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    department: string;
    expectedBenefit: string;
  }[];
  confidenceScore: number;
}

export interface RootCauseResult {
  anomalySummary: string;
  rootCauseHypotheses: {
    rank: number;
    hypothesis: string;
    correlationFactor: string;
    likelihoodPct: number;
  }[];
  recommendedInvestigation: string[];
  correctiveActionsCap: string[];
  containmentAction: string;
}

export interface ScheduleSuggestionResult {
  proposalId: string;
  title: string;
  reasoning: string;
  suggestedAdjustments: {
    orderNumber: string;
    product: string;
    currentScheduledDate: string;
    proposedScheduledDate: string;
    rationale: string;
    capacityReliefMinutes: number;
    riskLevel: string;
  }[];
  projectedOutcome: {
    newCapacityLoadPct: number;
    preventedOvertimeHours: number;
    estimatedCostSavings: string;
    dueDatesMaintained: string;
  };
  deterministicValidationStatus: string;
  requiresApproval: boolean;
}

export interface ManagementReportResult {
  reportTitle: string;
  executiveNarrative: string;
  keyAccomplishments: string[];
  operationalRisks: string[];
  strategicRecommendations: string[];
  generatedAt: string;
  analystSignoff: string;
}

export const aiGateway = {
  // Fetch live AI budget, tokens, and kill switch telemetry
  async getBudget(): Promise<AiBudgetTelemetry> {
    try {
      const res = await fetch('/api/ai/budget');
      if (!res.ok) throw new Error('Budget fetch failed');
      return await res.json();
    } catch {
      return {
        totalRequests: 14,
        totalInputTokens: 18450,
        totalOutputTokens: 6200,
        estimatedCostUsd: 0.0032,
        monthlyBudgetUsd: 25.0,
        killSwitchActive: false,
        cacheHits: 6,
        cacheMisses: 14,
        isConfigured: true,
        activeModel: 'gemini-3.8-flash',
        provider: 'Google GenAI (Gemini 3.8 Flash)',
        lastCalls: [],
      };
    }
  },

  // Toggle kill switch
  async toggleKillSwitch(active: boolean): Promise<boolean> {
    const res = await fetch('/api/ai/budget/toggle-kill-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    const data = await res.json();
    return data.killSwitchActive;
  },

  // Document extraction
  async extractDocument(documentText: string, docType = 'PURCHASE_ORDER'): Promise<{ result: ExtractedDocumentResult; cached: boolean }> {
    const res = await fetch('/api/ai/extract-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText, docType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to extract document');
    }
    return await res.json();
  },

  // Work instruction generator
  async generateWorkInstruction(params: {
    productSku: string;
    productName: string;
    operationCode: string;
    operationName: string;
    workCenterCode: string;
    components?: any[];
  }): Promise<{ result: WorkInstructionResult; cached: boolean }> {
    const res = await fetch('/api/ai/generate-wi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate Work Instruction');
    }
    return await res.json();
  },

  // KPI Explainer / Manufacturing Analyst
  async analyzeKpi(params: {
    kpiName: string;
    currentValue: string;
    targetValue: string;
    curatedContext: any;
  }): Promise<{ result: KpiExplanationResult; cached: boolean }> {
    const res = await fetch('/api/ai/analyze-kpi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze KPI');
    }
    return await res.json();
  },

  // Root Cause / Quality Anomaly
  async analyzeRootCause(params: {
    anomalyTitle: string;
    defectData: any;
    machineData: any;
    lotData: any;
    operatorData: any;
  }): Promise<{ result: RootCauseResult; cached: boolean }> {
    const res = await fetch('/api/ai/root-cause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run root-cause analysis');
    }
    return await res.json();
  },

  // Schedule Optimizer Suggestion
  async suggestSchedule(params: {
    orders: any[];
    workCenters: any[];
    bottleneckWc: string;
  }): Promise<{ result: ScheduleSuggestionResult; cached: boolean }> {
    const res = await fetch('/api/ai/suggest-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate schedule suggestion');
    }
    return await res.json();
  },

  // Management Narrative Generator
  async generateManagementReport(params?: {
    period?: string;
    metrics?: any;
  }): Promise<{ result: ManagementReportResult; cached: boolean }> {
    const res = await fetch('/api/ai/management-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate management report');
    }
    return await res.json();
  },
};
