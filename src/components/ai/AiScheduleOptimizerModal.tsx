import React, { useState } from 'react';
import { X, Sparkles, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Gauge, Clock } from 'lucide-react';
import { aiGateway, ScheduleSuggestionResult } from '../../lib/ai/aiGateway';

interface AiScheduleOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottleneckWc: string;
  orders: any[];
  workCenters: any[];
  onApplySchedule: (proposal: ScheduleSuggestionResult) => void;
}

export const AiScheduleOptimizerModal: React.FC<AiScheduleOptimizerModalProps> = ({
  isOpen,
  onClose,
  bottleneckWc,
  orders,
  workCenters,
  onApplySchedule,
}) => {
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<ScheduleSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setApplied(false);
      aiGateway
        .suggestSchedule({
          orders,
          workCenters,
          bottleneckWc,
        })
        .then((res) => {
          setProposal(res.result);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to suggest schedule');
          setLoading(false);
        });
    }
  }, [isOpen, bottleneckWc]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (proposal) {
      onApplySchedule(proposal);
      setApplied(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Hybrid Pattern · Section 5 Blueprint
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono border border-emerald-200">
                  AI Proposes → Engine Validates
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Production Schedule Leveling & Capacity Optimization
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Evaluating work center finite capacity, setup grouping, and delivery due date constraints...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
              <p className="font-semibold">Schedule Optimization Failed: {error}</p>
            </div>
          ) : proposal ? (
            <div className="space-y-4">
              {/* Proposal Banner */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-blue-700 font-bold uppercase">{proposal.proposalId}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    ✓ {proposal.deterministicValidationStatus}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-blue-950 mt-1">{proposal.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proposal.reasoning}</p>
              </div>

              {/* Projected Outcome Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Relieved Load</span>
                  <span className="text-sm font-bold font-mono text-emerald-600 mt-0.5 block">
                    {proposal.projectedOutcome.newCapacityLoadPct}%
                  </span>
                  <span className="text-[10px] text-slate-400">Down from 108.3%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Overtime Saved</span>
                  <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block">
                    {proposal.projectedOutcome.preventedOvertimeHours}h
                  </span>
                  <span className="text-[10px] text-slate-400">Avoided fatigue risk</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Cost Variance</span>
                  <span className="text-sm font-bold font-mono text-blue-700 mt-0.5 block">
                    {proposal.projectedOutcome.estimatedCostSavings}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Delivery Service</span>
                  <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                    100% OTD
                  </span>
                  <span className="text-[10px] text-slate-400">Zero late orders</span>
                </div>
              </div>

              {/* Adjustments Sequence Table */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Deterministic Engine Validated Adjustments
                </div>
                <div className="space-y-2.5">
                  {proposal.suggestedAdjustments.map((adj, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{adj.orderNumber}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700">{adj.product}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            Risk: {adj.riskLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{adj.rationale}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Shift Timing</span>
                          <div className="flex items-center gap-1 font-mono">
                            <span className="line-through text-slate-400">{adj.currentScheduledDate}</span>
                            <ArrowRight className="w-3 h-3 text-blue-600" />
                            <span className="font-bold text-blue-700">{adj.proposedScheduledDate}</span>
                          </div>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded font-mono text-[11px] font-bold">
                          -{adj.capacityReliefMinutes}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Audit Rule:</span> Planner approval is required. Workflow engine executes reschedule and logs to immutable audit trail.
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Reject Proposal
            </button>
            <button
              disabled={!proposal || applied}
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Schedule Approved & Dispatched!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Planner Review & Approve Reschedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
