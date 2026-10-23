import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Plus,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { QualityInspection, NonConformanceReport, ReworkOrder, ReasonCode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AiRootCauseModal } from '../../components/ai/AiRootCauseModal';

interface QualityViewProps {
  inspections: QualityInspection[];
  ncrs: NonConformanceReport[];
  reworkOrders: ReworkOrder[];
  reasonCodes: ReasonCode[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
}

export const QualityView: React.FC<QualityViewProps> = ({
  inspections,
  ncrs,
  reworkOrders,
  reasonCodes,
  activeSubTab,
  onSelectSubTab,
}) => {
  const [rootCauseModal, setRootCauseModal] = useState<{
    isOpen: boolean;
    anomalyTitle: string;
    defectData: any;
    machineData: any;
    lotData: any;
    operatorData: any;
  }>({
    isOpen: false,
    anomalyTitle: '',
    defectData: null,
    machineData: null,
    lotData: null,
    operatorData: null,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quality Assurance & Disposition</h2>
          <p className="text-xs text-slate-500">
            First Article Inspections (FAI), in-process QC sampling, Non-Conformance Reports (NCR), and rework control.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('inspections')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'inspections'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quality Inspections ({inspections.length})
        </button>
        <button
          onClick={() => onSelectSubTab('reject-scrap')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reject-scrap'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Non-Conformance Reports (NCR) ({ncrs.length})
        </button>
        <button
          onClick={() => onSelectSubTab('rework')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'rework'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rework Orders ({reworkOrders.length})
        </button>
        <button
          onClick={() => onSelectSubTab('quarantine')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'quarantine'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quarantine Hold
        </button>
      </div>

      {/* 1. Quality Inspections Tab */}
      {activeSubTab === 'inspections' && (
        <div className="space-y-4">
          {/* Page 98 Quality Flow Callout */}
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold block">PDF Section 29: Quality Flow Specification</span>
              <span className="text-slate-400 text-[11px]">
                Output 1,000. QC samples 100 and finds 4 failures. Policy holds full lot, records NCR, and triggers rework order RWK-2026-004.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              Sample 100 / Defect 4
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Inspection #</th>
                  <th className="py-2.5 px-4">Order / Lot #</th>
                  <th className="py-2.5 px-4">Operation Tested</th>
                  <th className="py-2.5 px-4 text-right">Sample Size</th>
                  <th className="py-2.5 px-4 text-right">Defects</th>
                  <th className="py-2.5 px-4">Test Characteristic & Spec</th>
                  <th className="py-2.5 px-4">Result</th>
                  <th className="py-2.5 px-4">Disposition</th>
                  <th className="py-2.5 px-4">Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {inspections.map((qc) => (
                  <tr key={qc.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{qc.inspectionNo}</td>
                    <td className="py-3 px-4">
                      <span className="text-blue-600 font-semibold block">{qc.sourceRef}</span>
                      <span className="text-[11px] text-slate-400">{qc.lotNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800">{qc.operationName}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800">{qc.sampleSize}</td>
                    <td className={`py-3 px-4 text-right tabular-nums font-bold ${
                      qc.defectsCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}>
                      {qc.defectsCount}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs">
                      <span className="font-medium text-slate-800 block">{qc.characteristic}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{qc.specification}</span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        qc.result === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {qc.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        qc.disposition === 'UNRESTRICTED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : qc.disposition === 'HOLD'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {qc.disposition}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">{qc.inspector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Non-Conformance Reports (NCR) */}
      {activeSubTab === 'reject-scrap' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Formal Non-Conformance Reports (NCR)</span>
            <span className="text-slate-500">Root cause analysis & quality hold tracking</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">NCR #</th>
                <th className="py-2.5 px-4">Production Order</th>
                <th className="py-2.5 px-4">Lot #</th>
                <th className="py-2.5 px-4 text-right">Affected Qty</th>
                <th className="py-2.5 px-4">Defect Description</th>
                <th className="py-2.5 px-4">Root Cause</th>
                <th className="py-2.5 px-4">Disposition</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Root Cause (AI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ncrs.map((ncr) => (
                <tr key={ncr.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{ncr.ncrNo}</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">{ncr.orderNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{ncr.lotNumber}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-rose-700 font-bold">
                    {ncr.quantityAffected} PCS
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-800">{ncr.defectDescription}</td>
                  <td className="py-3 px-4 font-sans text-slate-500 text-xs">{ncr.rootCause || 'Under investigation'}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {ncr.disposition}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={ncr.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        setRootCauseModal({
                          isOpen: true,
                          anomalyTitle: `${ncr.ncrNo}: ${ncr.defectDescription}`,
                          defectData: {
                            qtyAffected: ncr.quantityAffected,
                            disposition: ncr.disposition,
                          },
                          machineData: { code: 'WC-CUT-01', model: 'CNC Saw M01' },
                          lotData: { lotNumber: ncr.lotNumber, material: 'Raw Steel Sheet' },
                          operatorData: { shift: 'Morning', operator: 'Budi Santoso' },
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors whitespace-nowrap shadow-2xs"
                      title="Analyze root cause hypotheses with AI (Section 9.3)"
                    >
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      <span>Analyze Cause</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Rework Orders (Page 104) */}
      {activeSubTab === 'rework' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Rework Manufacturing Orders (Page 104)</span>
            <span className="text-slate-500">Rework consumes additional labor/material and increases actual cost</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Rework Order #</th>
                <th className="py-2.5 px-4">Parent MO</th>
                <th className="py-2.5 px-4">Item SKU</th>
                <th className="py-2.5 px-4 text-right">Rework Qty</th>
                <th className="py-2.5 px-4">Assigned Work Center</th>
                <th className="py-2.5 px-4 text-right">Added Cost</th>
                <th className="py-2.5 px-4">Reinspection</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reworkOrders.map((rwk) => (
                <tr key={rwk.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{rwk.reworkOrderNo}</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">{rwk.parentOrderNumber}</td>
                  <td className="py-3 px-4 text-slate-800">{rwk.productSku}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                    {rwk.quantityToRework} PCS
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700">{rwk.reworkWorkCenter}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-rose-700 font-semibold">
                    +${rwk.additionalCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {rwk.reinspectionPassed ? (
                      <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Re-inspected PASS</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Pending Re-check</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={rwk.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Quarantine Hold */}
      {activeSubTab === 'quarantine' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-slate-900">Active Quarantine Hold Warehouse Locations</h4>
          </div>
          <p className="text-slate-500">
            Physical stock placed on hold pending engineering evaluation, MRB (Material Review Board) decision, or customer concession.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-amber-50/40 rounded border border-amber-200 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-900">QUAR-RACK-03</span>
                <span className="text-amber-800 font-semibold">HOLD</span>
              </div>
              <div className="text-slate-800 font-semibold">300 MTR Material Y (Copper Wire)</div>
              <p className="text-[11px] text-slate-500">
                Reason: Insulation micro-cracking observed on outer spool layer. Awaiting vendor replacement or test certification.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-900">QUAR-BIN-B</span>
                <span className="text-emerald-700 font-semibold">RELEASED</span>
              </div>
              <div className="text-slate-800 font-semibold">4 PCS Product A (Extrusion Length)</div>
              <p className="text-[11px] text-slate-500">
                Rework Order RWK-2026-004 completed; dimensions re-machined within spec. Unrestricted release granted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Root Cause Analysis Modal (Section 9.3) */}
      <AiRootCauseModal
        isOpen={rootCauseModal.isOpen}
        onClose={() => setRootCauseModal((prev) => ({ ...prev, isOpen: false }))}
        anomalyTitle={rootCauseModal.anomalyTitle}
        defectData={rootCauseModal.defectData}
        machineData={rootCauseModal.machineData}
        lotData={rootCauseModal.lotData}
        operatorData={rootCauseModal.operatorData}
        onCreateCapa={(capa) => {
          alert(`CAPA Ticket registered from AI root-cause analysis! Containment action dispatched to shop floor lead.`);
        }}
      />
    </div>
  );
};
