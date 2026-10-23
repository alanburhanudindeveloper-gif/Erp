import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Wrench, AlertTriangle, FileText, Check, Copy } from 'lucide-react';
import { aiGateway, WorkInstructionResult } from '../../lib/ai/aiGateway';

interface AiWorkInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSku: string;
  productName: string;
  operationCode: string;
  operationName: string;
  workCenterCode: string;
  components?: any[];
  onApproveWI: (wi: WorkInstructionResult) => void;
}

export const AiWorkInstructionModal: React.FC<AiWorkInstructionModalProps> = ({
  isOpen,
  onClose,
  productSku,
  productName,
  operationCode,
  operationName,
  workCenterCode,
  components = [],
  onApproveWI,
}) => {
  const [loading, setLoading] = useState(false);
  const [wi, setWi] = useState<WorkInstructionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setApproved(false);
      aiGateway
        .generateWorkInstruction({
          productSku,
          productName,
          operationCode,
          operationName,
          workCenterCode,
          components,
        })
        .then((res) => {
          setWi(res.result);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to generate Work Instruction');
          setLoading(false);
        });
    }
  }, [isOpen, productSku, operationCode]);

  if (!isOpen) return null;

  const handleApprove = () => {
    if (wi) {
      onApproveWI(wi);
      setApproved(true);
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
                  Generative AI · Section 9.2 Blueprint
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono border border-emerald-200">
                  Drafting Layer
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Generate Standard Work Instruction (WI / SOP)
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

        {/* Target Meta Pill */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500">Target Product: </span>
            <span className="font-bold text-slate-900">{productName} ({productSku})</span>
          </div>
          <div>
            <span className="text-slate-500">Operation: </span>
            <span className="font-bold text-slate-900">{operationCode} · {operationName}</span>
          </div>
          <div>
            <span className="text-slate-500">Station: </span>
            <span className="font-mono font-bold text-slate-800">{workCenterCode}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1 font-sans">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Synthesizing BOM components, tooling tolerances, and QC checkpoints into standard SOP...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          ) : wi ? (
            <div className="space-y-4">
              {/* Document Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{wi.wiCode}</div>
                  <div className="text-sm font-bold text-slate-900">{wi.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{wi.revision}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Standard Cycle Time</div>
                  <div className="text-sm font-bold font-mono text-blue-700">{wi.estimatedCycleTime}</div>
                </div>
              </div>

              {/* PPE & Tooling Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mandatory PPE (Safety)</span>
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    {wi.requiredPpe.map((ppe, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span>{ppe}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Wrench className="w-3.5 h-3.5 text-slate-600" />
                    <span>Required Tooling & Calibrated Gauges</span>
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    {wi.requiredTooling.map((tool, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>{tool}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sequential Steps */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Standard Operating Steps & Critical QC Checkpoints
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {wi.operationalSteps.map((step) => (
                    <div key={step.stepNo} className="p-3.5 bg-white hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {step.stepNo}
                        </span>
                        <div className="space-y-1 flex-1">
                          <p className="font-semibold text-slate-900 text-xs leading-relaxed">
                            {step.instruction}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                            <div className="p-2 bg-slate-50 rounded">
                              <span className="text-slate-400 block font-medium">Critical Parameter:</span>
                              <span className="font-mono text-slate-800">{step.criticalParameter}</span>
                            </div>
                            <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded">
                              <span className="text-emerald-700 block font-medium">QC Checkpoint:</span>
                              <span className="text-emerald-900 font-semibold">{step.qcCheckpoint}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety & Rejection Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50/40 border border-rose-200 rounded-lg">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Safety Precautions (LOTO / Interlocks)</span>
                  </div>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    {wi.safetyPrecautions.map((s, idx) => (
                      <li key={idx}>• {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Immediate Rejection Criteria</span>
                  </div>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    {wi.rejectionCriteria.map((r, idx) => (
                      <li key={idx}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer with Guardrail Approval (Section 5 & 8) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Guardrail Policy:</span> AI creates draft WI. Senior Engineer must review and approve before official publish.
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading || !wi || approved}
              onClick={handleApprove}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {approved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Approved & Published!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Engineer Review & Publish WI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
