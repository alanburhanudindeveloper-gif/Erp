import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { aiGateway, KpiExplanationResult } from '../../lib/ai/aiGateway';

interface AiExplainKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiName: string;
  currentValue: string;
  targetValue: string;
  curatedContext: any;
}

export const AiExplainKpiModal: React.FC<AiExplainKpiModalProps> = ({
  isOpen,
  onClose,
  kpiName,
  currentValue,
  targetValue,
  curatedContext,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KpiExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      aiGateway
        .analyzeKpi({
          kpiName,
          currentValue,
          targetValue,
          curatedContext,
        })
        .then((res) => {
          setResult(res.result);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to explain metric');
          setLoading(false);
        });
    }
  }, [isOpen, kpiName, currentValue, targetValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  AI Manufacturing Analyst
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-medium border border-blue-200">
                  gemini-3.8-flash
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Explain Metric: {kpiName}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Baseline metrics summary bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Current Value</div>
              <div className="text-base font-bold text-slate-900 tabular-nums font-mono mt-0.5">
                {currentValue}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Standard Target</div>
              <div className="text-base font-bold text-slate-500 tabular-nums font-mono mt-0.5">
                {targetValue}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">AI Confidence</div>
              <div className="text-base font-bold text-emerald-600 tabular-nums font-mono mt-0.5">
                {result ? `${result.confidenceScore}%` : '...'}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Correlating ERP transactions, shop floor downtime, and material lot variances...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to generate explanation</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Executive Headline */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                <div className="font-semibold text-blue-900 text-sm">{result.headline}</div>
                <p className="mt-1 text-slate-600 leading-relaxed text-xs">{result.trendAnalysis}</p>
              </div>

              {/* Underlying Root Causes */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Underlying Factors (Curated ERP Context)
                </div>
                <ul className="space-y-2">
                  {result.underlyingFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 leading-normal">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Operational Impact */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Operational & Financial Impact
                </div>
                <p className="p-3 bg-amber-50/60 border border-amber-200 text-amber-900 rounded leading-relaxed">
                  {result.operationalImpact}
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Recommended Countermeasures
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {result.recommendedActions.map((rec, i) => (
                    <div key={i} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rec.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">[{rec.department}]</span>
                        </div>
                        <p className="font-semibold text-slate-900">{rec.action}</p>
                        <p className="text-[11px] text-emerald-700 font-medium">✓ {rec.expectedBenefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Deterministic guardrails active: Context strictly curated from ERP database.</span>
          </div>
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
