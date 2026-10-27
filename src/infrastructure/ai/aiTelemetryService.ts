// Infrastructure AI Telemetry, Budget Control, and Caching Service

export interface AiUsageRecord {
  id: string;
  task: string;
  model: string;
  tokens: number;
  cost: number;
  timestamp: string;
  cached: boolean;
}

export interface AiUsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  monthlyBudgetUsd: number;
  killSwitchActive: boolean;
  cacheHits: number;
  cacheMisses: number;
  lastCalls: AiUsageRecord[];
}

export class AiTelemetryService {
  private stats: AiUsageStats = {
    totalRequests: 14,
    totalInputTokens: 18450,
    totalOutputTokens: 6200,
    estimatedCostUsd: 0.0032,
    monthlyBudgetUsd: 25.0,
    killSwitchActive: false,
    cacheHits: 6,
    cacheMisses: 14,
    lastCalls: [
      {
        id: 'call-101',
        task: 'EXTRACT_PO_DOCUMENT',
        model: 'gemini-3.8-flash',
        tokens: 1240,
        cost: 0.00021,
        timestamp: '2026-10-22 09:15',
        cached: false,
      },
      {
        id: 'call-102',
        task: 'GENERATE_WORK_INSTRUCTION',
        model: 'gemini-3.8-flash',
        tokens: 2100,
        cost: 0.00045,
        timestamp: '2026-10-22 10:02',
        cached: false,
      },
      {
        id: 'call-103',
        task: 'ANALYZE_SCRAP_SPIKE',
        model: 'gemini-3.8-flash',
        tokens: 1680,
        cost: 0.00029,
        timestamp: '2026-10-22 11:40',
        cached: true,
      },
    ],
  };

  private cache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

  public getStats(): AiUsageStats {
    return {
      ...this.stats,
      lastCalls: [...this.stats.lastCalls],
    };
  }

  public setKillSwitch(active: boolean): boolean {
    this.stats.killSwitchActive = active;
    return this.stats.killSwitchActive;
  }

  public isAvailable(): { available: boolean; reason?: string } {
    if (this.stats.killSwitchActive) {
      return {
        available: false,
        reason: 'AI Kill Switch is currently ACTIVE. ERP operations continue deterministically without LLM invocations.',
      };
    }
    if (this.stats.estimatedCostUsd >= this.stats.monthlyBudgetUsd) {
      return {
        available: false,
        reason: 'Monthly AI budget limit reached ($25.00). LLM calls throttled to preserve operating cost.',
      };
    }
    return { available: true };
  }

  public recordUsage(task: string, inputTokens: number, outputTokens: number, cached: boolean): void {
    const model = 'gemini-3.8-flash';
    const cost = cached ? 0 : inputTokens * 0.000000075 + outputTokens * 0.0000003;

    this.stats.totalRequests += 1;
    if (cached) {
      this.stats.cacheHits += 1;
    } else {
      this.stats.cacheMisses += 1;
      this.stats.totalInputTokens += inputTokens;
      this.stats.totalOutputTokens += outputTokens;
      this.stats.estimatedCostUsd = Math.round((this.stats.estimatedCostUsd + cost) * 1000000) / 1000000;
    }

    this.stats.lastCalls.unshift({
      id: `call-${Date.now()}`,
      task,
      model,
      tokens: inputTokens + outputTokens,
      cost: Number(cost.toFixed(6)),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cached,
    });

    if (this.stats.lastCalls.length > 20) {
      this.stats.lastCalls.pop();
    }
  }

  public getCachedResult<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.result as T;
  }

  public setCachedResult(key: string, result: any): void {
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const aiTelemetryService = new AiTelemetryService();
