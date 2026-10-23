import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Database } from 'lucide-react';

export interface AiRecommendationItem {
  id: string;
  category: 'SCHEDULE' | 'MATERIAL' | 'QUALITY' | 'MAINTENANCE';
  title: string;
  reason: string;
  confidencePct: number;
  dataSourcesUsed: string[];
  operationalImpact: string;
  actionLabel: string;
  onExecute: () => void;
  onDismiss: () => void;
}

interface AiCommandCenterPanelProps {
  recommendations: AiRecommendationItem[];
  onOpenBudget: () => void;
}

export const AiCommandCenterPanel: React.FC<AiCommandCenterPanelProps> = ({
  recommendations,
  onOpenBudget,
}) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Recommendations (Manufacturing Command Center)
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                {recommendations.length} Actionable
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Proactive operational proposals with deterministic validation & confidence scoring (Section 11 Blueprint).
            </p>
          </div>
        </div>

        <button
          onClick={onOpenBudget}
          className="text-[11px] text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 self-start sm:self-auto hover:underline"
        >
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>AI Gateway & Budget Telemetry</span>
        </button>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between gap-3 text-xs transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    rec.category === 'SCHEDULE'
                      ? 'bg-blue-100 text-blue-800'
                      : rec.category === 'MATERIAL'
                      ? 'bg-amber-100 text-amber-800'
                      : rec.category === 'QUALITY'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {rec.category}
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Confidence:</span>
                  <span className="font-mono font-bold text-emerald-700 text-[11px]">
                    {rec.confidencePct}%
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-xs leading-snug">
                {rec.title}
              </h4>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                {rec.reason}
              </p>

              {/* Data Sources and Impact */}
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="font-medium text-slate-400">Data Used:</span>
                  <span className="font-mono text-slate-700 truncate">{rec.dataSourcesUsed.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="font-medium text-slate-400">Impact:</span>
                  <span className="font-semibold text-slate-800">{rec.operationalImpact}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
              <button
                onClick={rec.onDismiss}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Dismiss
              </button>

              <button
                onClick={rec.onExecute}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs"
              >
                <span>{rec.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
