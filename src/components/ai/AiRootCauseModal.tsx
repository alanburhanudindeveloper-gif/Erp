import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, Microchip, Layers } from 'lucide-react';
import { aiGateway, RootCauseResult } from '../../lib/ai/aiGateway';

interface AiRootCauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomalyTitle: string;
  defectData: any;
  machineData: any;
  lotData: any;
  operatorData: any;
  onCreateCapa: (capa: any) => void;
}

export const AiRootCauseModal: React.FC<AiRootCauseModalProps> = ({
  isOpen,
  onClose,
  anomalyTitle,
  defectData,
  machineData,
  lotData,
  operatorData,
  onCreateCapa,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RootCauseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capaCreated, setCapaCreated] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setCapaCreated(false);
      aiGateway
        .analyzeRootCause({
          anomalyTitle,
          defectData,
          machineData,
          lotData,
          operatorData,
        })
        .then((res) => {
          setResult(res.result);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to perform root cause analysis');
          setLoading(false);
        });
    }
  }, [isOpen, anomalyTitle]);

  if (!isOpen) return null;

  const handleCreateCapa = () => {
    if (result) {
      onCreateCapa(result);
      setCapaCreated(true);
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
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  AI Root Cause Analysis (Section 9.3)
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono">
                  Six Sigma Hypotheses
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Correlate Parameters & Recommend CAPA Investigation
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

        {/* Anomaly target banner */}
        <div className="px-5 py-2.5 bg-rose-50/60 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900">
          <div>
            <span className="font-semibold">Anomaly: </span>
            <span>{anomalyTitle}</span>
          </div>
          <div className="flex gap-3 text-[11px] font-mono">
            <span>Machine: {machineData?.code || 'WC-CUT-01'}</span>
            <span>·</span>
            <span>Lot: {lotData?.lotNumber || 'LOT-X-L100'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Correlating material lot hardness, cutting feed velocity, thermal cycles, and operator shifts...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
              <p className="font-semibold">Analysis Failed: {error}</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Executive Finding</span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{result.anomalySummary}</p>
              </div>

              {/* Immediate Containment */}
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-lg">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block mb-0.5">
                  Immediate Containment Action (Mandatory)
                </span>
                <p className="text-xs text-rose-950 font-semibold">{result.containmentAction}</p>
              </div>

              {/* Hypotheses ranking */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Root-Cause Hypotheses Ranked by Correlation Likelihood
                </div>
                <div className="space-y-2">
                  {result.rootCauseHypotheses.map((hyp) => (
                    <div key={hyp.rank} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {hyp.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{hyp.hypothesis}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Correlation: {hyp.correlationFactor}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold font-mono text-rose-700">{hyp.likelihoodPct}%</span>
                        <span className="block text-[10px] text-slate-400">Likelihood</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Investigation & CAPA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Recommended Technical Investigation
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {result.recommendedInvestigation.map((inv, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>{inv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                    Corrective & Preventive Action (CAPA)
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {result.correctiveActionsCap.map((capa, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{capa}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Policy:</span> AI memberi hipotesis; engineer tetap menentukan tindakan korektif resmi.
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              disabled={!result || capaCreated}
              onClick={handleCreateCapa}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {capaCreated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>NCR / CAPA Ticket Logged!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Initiate CAPA Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
