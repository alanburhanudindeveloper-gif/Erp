import React, { useState, useEffect } from 'react';
import { X, Cpu, DollarSign, Database, ShieldAlert, CheckCircle2, AlertTriangle, Power, RotateCw, History } from 'lucide-react';
import { aiGateway, AiBudgetTelemetry } from '../../lib/ai/aiGateway';

interface AiBudgetTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiBudgetTelemetryModal: React.FC<AiBudgetTelemetryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [telemetry, setTelemetry] = useState<AiBudgetTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);

  const fetchTelemetry = () => {
    setLoading(true);
    aiGateway.getBudget().then((data) => {
      setTelemetry(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleKillSwitch = async () => {
    if (!telemetry) return;
    setTogglingKillSwitch(true);
    const newStatus = await aiGateway.toggleKillSwitch(!telemetry.killSwitchActive);
    setTelemetry({
      ...telemetry,
      killSwitchActive: newStatus,
    });
    setTogglingKillSwitch(false);
  };

  const budgetUsagePct = telemetry
    ? Math.min(100, Number(((telemetry.estimatedCostUsd / telemetry.monthlyBudgetUsd) * 100).toFixed(2)))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Section 6.5 & Section 7 Blueprint
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono border border-emerald-200">
                  Selective Invocation + Cache Active
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                AI Gateway Telemetry, Observability & Budget Guardrails
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {telemetry ? (
            <>
              {/* Emergency Kill Switch Banner (Section 6.5) */}
              <div
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  telemetry.killSwitchActive
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${telemetry.killSwitchActive ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span className="font-bold text-sm">
                      {telemetry.killSwitchActive ? 'AI KILL SWITCH IS ENGAGED' : 'AI Gateway Status: Online & Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {telemetry.killSwitchActive
                      ? 'All LLM calls are disabled. ERP core continues 100% deterministically without cost or interruption.'
                      : 'AI Gateway is safely throttled to gemini-3.8-flash with selective invocation and cache filtering.'}
                  </p>
                </div>

                <button
                  disabled={togglingKillSwitch}
                  onClick={handleToggleKillSwitch}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs ${
                    telemetry.killSwitchActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {telemetry.killSwitchActive ? 'Disengage Kill Switch' : 'Engage Emergency Kill Switch'}
                </button>
              </div>

              {/* Budget Meter Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Total Invocations</span>
                  <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block tabular-nums">
                    {telemetry.totalRequests}
                  </span>
                  <span className="text-[10px] text-slate-400">Calls recorded</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Tokens Consumed</span>
                  <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block tabular-nums">
                    {(telemetry.totalInputTokens + telemetry.totalOutputTokens).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">In: {telemetry.totalInputTokens} · Out: {telemetry.totalOutputTokens}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Estimated Cost</span>
                  <span className="text-lg font-bold font-mono text-blue-700 mt-0.5 block tabular-nums">
                    ${telemetry.estimatedCostUsd.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-400">Budget: ${telemetry.monthlyBudgetUsd.toFixed(2)}/mo</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Cache Hit Rate</span>
                  <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block tabular-nums">
                    {telemetry.totalRequests > 0
                      ? `${Math.round((telemetry.cacheHits / telemetry.totalRequests) * 100)}%`
                      : '0%'}
                  </span>
                  <span className="text-[10px] text-slate-400">{telemetry.cacheHits} cached responses</span>
                </div>
              </div>

              {/* Monthly Budget Progress Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Monthly AI Cost Allowance</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    ${telemetry.estimatedCostUsd.toFixed(4)} / ${telemetry.monthlyBudgetUsd.toFixed(2)} ({budgetUsagePct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(2, budgetUsagePct)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Enforces Section 6.5 budget threshold: Auto-throttles if consumption approaches monthly cap.
                </span>
              </div>

              {/* Architecture Provider Mapping (Section 6.4) */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-700 text-xs">Model Routing Architecture</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-400 block">Extraction, Drafting & KPI Explanation:</span>
                    <span className="font-mono font-bold text-slate-900">gemini-3.8-flash (Cost-Effective)</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-400 block">Decoupled AI Gateway Abstraction:</span>
                    <span className="font-mono font-bold text-slate-900">Provider-Agnostic Interface</span>
                  </div>
                </div>
              </div>

              {/* Invocations Audit Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Recent AI Telemetry & Audit Logs
                  </span>
                  <button
                    onClick={fetchTelemetry}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 font-mono text-[11px]">
                  {telemetry.lastCalls.map((call) => (
                    <div key={call.id} className="p-2.5 bg-white flex items-center justify-between hover:bg-slate-50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{call.task}</span>
                          {call.cached && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-sans font-bold">
                              CACHE HIT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">{call.model} · {call.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-700 block">{call.tokens.toLocaleString()} tokens</span>
                        <span className="text-slate-400 text-[10px]">${call.cost.toFixed(5)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">Loading telemetry...</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Core ERP is deterministic. AI decisions are validated before execution.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
