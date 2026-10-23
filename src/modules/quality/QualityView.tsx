import React, { useState, useMemo } from 'react';
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
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createCurrencyColumn,
  createStatusColumn,
  createActionColumn,
} from '../../components/data-grid';

interface QualityViewProps {
  inspections: QualityInspection[];
  ncrs: NonConformanceReport[];
  reworkOrders: ReworkOrder[];
  reasonCodes: ReasonCode[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
  onReleaseQc?: (
    inspectionId: string,
    decision: 'PASS' | 'FAIL',
    disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK',
    notes: string
  ) => void;
}

export const QualityView: React.FC<QualityViewProps> = ({
  inspections,
  ncrs,
  reworkOrders,
  reasonCodes,
  activeSubTab,
  onSelectSubTab,
  onReleaseQc,
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

  // 1. Quality Inspections Columns
  const inspectionColumns = useMemo<GridColumn<QualityInspection>[]>(
    () => [
      createTextColumn<QualityInspection>('inspectionNo', 'Inspection #', {
        isCode: true,
        pinned: 'left',
        width: 140,
      }),
      {
        field: 'sourceRef',
        headerName: 'Order / Lot #',
        type: 'text',
        width: 170,
        renderCell: ({ row }) => (
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-semibold block">{row.sourceRef}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.lotNumber}</span>
          </div>
        ),
      },
      createTextColumn<QualityInspection>('operationName', 'Operation Tested', { width: 170 }),
      createNumberColumn<QualityInspection>('sampleSize', 'Sample Size', { width: 100 }),
      createNumberColumn<QualityInspection>('defectsCount', 'Defects', {
        width: 90,
        renderCell: ({ value }) => (
          <span
            className={`font-mono font-bold tabular-nums ${
              value > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {value}
          </span>
        ),
      }),
      {
        field: 'characteristic',
        headerName: 'Characteristic & Spec',
        type: 'text',
        width: 220,
        renderCell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{row.characteristic}</div>
            <div className="text-[10px] text-slate-400 font-mono">{row.specification}</div>
          </div>
        ),
      },
      createStatusColumn<QualityInspection>('result', 'Result', {
        width: 100,
        filterOptions: [
          { label: 'PASS', value: 'PASS' },
          { label: 'FAIL', value: 'FAIL' },
        ],
      }),
      createStatusColumn<QualityInspection>('disposition', 'Disposition', {
        width: 140,
        filterOptions: [
          { label: 'UNRESTRICTED', value: 'UNRESTRICTED' },
          { label: 'HOLD', value: 'HOLD' },
          { label: 'REJECT', value: 'REJECT' },
        ],
      }),
      createTextColumn<QualityInspection>('inspector', 'Inspector', { width: 140 }),
      createActionColumn<QualityInspection>(
        ({ row }) => {
          if (row.disposition === 'HOLD' && onReleaseQc) {
            return (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() =>
                    onReleaseQc(
                      row.id,
                      'PASS',
                      'UNRESTRICTED',
                      'Sample passed metallurgical inspection. Mill cert validated. Released to AVAILABLE.'
                    )
                  }
                  title="Release quarantined stock to Available bucket (UC-QA-002)"
                  className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors whitespace-nowrap"
                >
                  Release
                </button>
                <button
                  onClick={() =>
                    onReleaseQc(
                      row.id,
                      'FAIL',
                      'REJECT',
                      'Dimensional tolerances out of spec. Stock rejected and flagged for NCR.'
                    )
                  }
                  title="Reject quarantined stock and generate Non-Conformance Report"
                  className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded transition-colors whitespace-nowrap"
                >
                  Reject
                </button>
              </div>
            );
          }
          return (
            <span className="text-slate-400 text-[11px] font-mono">
              {row.disposition === 'UNRESTRICTED' ? 'Released' : 'Closed'}
            </span>
          );
        },
        { width: 170, headerName: 'Disposition Action' }
      ),
    ],
    [onReleaseQc]
  );

  // 2. NCR Columns
  const ncrColumns = useMemo<GridColumn<NonConformanceReport>[]>(
    () => [
      createTextColumn<NonConformanceReport>('ncrNo', 'NCR #', { isCode: true, pinned: 'left', width: 140 }),
      createTextColumn<NonConformanceReport>('orderNumber', 'Order Ref', { isCode: true, width: 140 }),
      createTextColumn<NonConformanceReport>('lotNumber', 'Lot Number', { isCode: true, width: 130 }),
      createNumberColumn<NonConformanceReport>('quantityAffected', 'Affected Qty', {
        uomText: 'PCS',
        width: 120,
        renderCell: ({ value }) => (
          <span className="font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
            {value} PCS
          </span>
        ),
      }),
      createTextColumn<NonConformanceReport>('defectDescription', 'Defect Description', { width: 220 }),
      createTextColumn<NonConformanceReport>('rootCause', 'Root Cause', {
        width: 200,
        renderCell: ({ value }) => (
          <span className="text-slate-600 dark:text-slate-400 text-xs">
            {value || 'Under investigation'}
          </span>
        ),
      }),
      createStatusColumn<NonConformanceReport>('disposition', 'Disposition', { width: 130 }),
      createStatusColumn<NonConformanceReport>('status', 'Status', { width: 120 }),
      createActionColumn<NonConformanceReport>(
        ({ row }) => (
          <button
            onClick={() =>
              setRootCauseModal({
                isOpen: true,
                anomalyTitle: `${row.ncrNo}: ${row.defectDescription}`,
                defectData: {
                  qtyAffected: row.quantityAffected,
                  disposition: row.disposition,
                },
                machineData: { code: 'WC-CUT-01', model: 'CNC Saw M01' },
                lotData: { lotNumber: row.lotNumber, material: 'Raw Steel Sheet' },
                operatorData: { shift: 'Morning', operator: 'Budi Santoso' },
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded transition-colors whitespace-nowrap shadow-2xs"
            title="Analyze root cause hypotheses with AI (Section 9.3)"
          >
            <Sparkles className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Analyze Cause</span>
          </button>
        ),
        { width: 140, headerName: 'Root Cause AI' }
      ),
    ],
    []
  );

  // 3. Rework Orders Columns
  const reworkColumns = useMemo<GridColumn<ReworkOrder>[]>(
    () => [
      createTextColumn<ReworkOrder>('reworkOrderNo', 'Rework Order #', {
        isCode: true,
        pinned: 'left',
        width: 150,
      }),
      createTextColumn<ReworkOrder>('parentOrderNumber', 'Parent MO', { isCode: true, width: 140 }),
      createTextColumn<ReworkOrder>('productSku', 'Item SKU', { isCode: true, width: 130 }),
      createNumberColumn<ReworkOrder>('quantityToRework', 'Rework Qty', { uomText: 'PCS', width: 120 }),
      createTextColumn<ReworkOrder>('reworkWorkCenter', 'Assigned Work Center', { width: 170 }),
      createCurrencyColumn<ReworkOrder>('additionalCost', 'Added Cost', {
        currency: 'USD',
        decimals: 2,
        width: 130,
      }),
      {
        field: 'reinspectionPassed',
        headerName: 'Re-inspection',
        type: 'boolean',
        width: 150,
        renderCell: ({ value }) =>
          value ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PASS</span>
            </span>
          ) : (
            <span className="text-slate-400 text-xs">Pending Re-check</span>
          ),
      },
      createStatusColumn<ReworkOrder>('status', 'Status', { width: 130 }),
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Quality Assurance & Disposition
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            First Article Inspections (FAI), in-process QC sampling, Non-Conformance Reports (NCR), and rework control.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('inspections')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'inspections'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Quality Inspections ({inspections.length})
        </button>
        <button
          onClick={() => onSelectSubTab('reject-scrap')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reject-scrap'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Non-Conformance Reports (NCR) ({ncrs.length})
        </button>
        <button
          onClick={() => onSelectSubTab('rework')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'rework'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Rework Orders ({reworkOrders.length})
        </button>
        <button
          onClick={() => onSelectSubTab('quarantine')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'quarantine'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Quarantine Hold
        </button>
      </div>

      {/* 1. Quality Inspections Tab */}
      {activeSubTab === 'inspections' && (
        <div className="space-y-3">
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

          <EnterpriseDataGrid<QualityInspection>
            data={inspections}
            columns={inspectionColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="quality_inspections_report"
            density="compact"
          />
        </div>
      )}

      {/* 2. Non-Conformance Reports (NCR) */}
      {activeSubTab === 'reject-scrap' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Formal Non-Conformance Reports (NCR)
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Root cause analysis & quality hold tracking
            </span>
          </div>

          <EnterpriseDataGrid<NonConformanceReport>
            data={ncrs}
            columns={ncrColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="non_conformance_reports"
            density="compact"
          />
        </div>
      )}

      {/* 3. Rework Orders */}
      {activeSubTab === 'rework' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Rework Manufacturing Orders (Page 104)
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Rework consumes additional labor/material and increases actual cost
            </span>
          </div>

          <EnterpriseDataGrid<ReworkOrder>
            data={reworkOrders}
            columns={reworkColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="rework_manufacturing_orders"
            density="compact"
          />
        </div>
      )}

      {/* 4. Quarantine Hold */}
      {activeSubTab === 'quarantine' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3 shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Active Quarantine Hold Warehouse Locations
            </h4>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Physical stock placed on hold pending engineering evaluation, MRB (Material Review Board) decision, or customer concession.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-900 dark:text-slate-100">QUAR-RACK-03</span>
                <span className="text-amber-800 dark:text-amber-400 font-semibold">HOLD</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">300 MTR Material Y (Copper Wire)</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reason: Insulation micro-cracking observed on outer spool layer. Awaiting vendor replacement or test certification.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-900 dark:text-slate-100">QUAR-BIN-B</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">RELEASED</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">4 PCS Product A (Extrusion Length)</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
        onCreateCapa={() => {
          alert(`CAPA Ticket registered from AI root-cause analysis! Containment action dispatched to shop floor lead.`);
        }}
      />
    </div>
  );
};
