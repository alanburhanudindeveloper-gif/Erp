import React, { useState, useMemo } from 'react';
import {
  Shield,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Layers,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  AuditLogEntry,
  FeatureRegistryItem,
  FeatureStatus,
  CustomFieldDefinition,
  WorkflowDefinition,
  BusinessRule,
} from '../../types';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createDateColumn,
  createStatusColumn,
} from '../../components/data-grid';
import { FeatureRegistryView } from './FeatureRegistryView';
import { ConfigurationPlatformView } from './ConfigurationPlatformView';

interface AuditGovernanceViewProps {
  auditLogs: AuditLogEntry[];
  activeSubTab?: string;
  onSelectSubTab?: (subTab: string) => void;
  featureRegistry?: FeatureRegistryItem[];
  onUpdateFeatureStatus?: (featureId: string, status: FeatureStatus, notes?: string) => void;
  customFields?: CustomFieldDefinition[];
  onAddCustomField?: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  onToggleCustomField?: (fieldId: string) => void;
  customValues?: Record<string, Record<string, any>>;
  onSetCustomFieldValue?: (entityId: string, fieldKey: string, value: any) => void;
  workflows?: WorkflowDefinition[];
  onUpdateWorkflow?: (workflow: WorkflowDefinition) => void;
  businessRules?: BusinessRule[];
  onToggleBusinessRule?: (ruleId: string) => void;
  currentUser?: { id: string; name: string; role: string };
  onSwitchUser?: (persona: { id: string; name: string; role: string }) => void;
}

export const AuditGovernanceView: React.FC<AuditGovernanceViewProps> = ({
  auditLogs,
  activeSubTab = 'audit',
  onSelectSubTab,
  featureRegistry = [],
  onUpdateFeatureStatus,
  customFields = [],
  onAddCustomField,
  onToggleCustomField,
  customValues = {},
  onSetCustomFieldValue,
  workflows = [],
  onUpdateWorkflow,
  businessRules = [],
  onToggleBusinessRule,
  currentUser = { id: 'usr-001', name: 'Dewi Lestari', role: 'PPIC Supervisor' },
  onSwitchUser,
}) => {
  const currentTab = activeSubTab || 'audit';

  // Audit Log Columns
  const auditColumns = useMemo<GridColumn<AuditLogEntry>[]>(
    () => [
      createDateColumn<AuditLogEntry>('timestamp', 'Timestamp', { isDateTime: true, width: 150, pinned: 'left' }),
      createTextColumn<AuditLogEntry>('documentId', 'Document Ref', { isCode: true, pinned: 'left', width: 140 }),
      createTextColumn<AuditLogEntry>('action', 'Action', { width: 180 }),
      createTextColumn<AuditLogEntry>('actor', 'Actor / User', { width: 150 }),
      createTextColumn<AuditLogEntry>('role', 'Role', {
        width: 140,
        renderCell: ({ value }) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{value}</span>
        ),
      }),
      {
        field: 'stateTransition',
        headerName: 'State Transition',
        type: 'text',
        width: 170,
        renderCell: ({ row }) =>
          row.oldStatus ? (
            <span className="text-xs font-mono">
              <span className="text-slate-400">{row.oldStatus}</span>
              <span className="text-slate-400 mx-1">→</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{row.newStatus}</span>
            </span>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          ),
      },
      createStatusColumn<AuditLogEntry>('decision', 'Decision', {
        width: 120,
        filterOptions: [
          { label: 'APPROVED', value: 'APPROVED' },
          { label: 'EXECUTED', value: 'EXECUTED' },
          { label: 'REJECTED', value: 'REJECTED' },
        ],
      }),
      createTextColumn<AuditLogEntry>('reason', 'Mandatory Audit Reason', {
        width: 260,
        renderCell: ({ value }) => (
          <span className="text-slate-600 dark:text-slate-400 text-xs truncate max-w-sm block">
            {value || '—'}
          </span>
        ),
      }),
    ],
    []
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Governance, Configuration Platform & Feature Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pusat tata kelola kepatuhan: Audit log permanen, platform konfigurasi skema, dan pelacakan roadmap fitur Phase 0–7.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab?.('audit')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            currentTab === 'audit'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Immutable Audit Log Ledger ({auditLogs.length})
        </button>

        <button
          onClick={() => onSelectSubTab?.('platform')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            currentTab === 'platform'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Configuration Platform Hub
        </button>

        <button
          onClick={() => onSelectSubTab?.('registry')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            currentTab === 'registry'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Master Feature Registry (Phase 0–7)
        </button>

        <button
          onClick={() => onSelectSubTab?.('sod')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            currentTab === 'sod'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Segregation of Duties (SoD) Matrix
        </button>
      </div>

      {/* 1. Audit Log Ledger */}
      {currentTab === 'audit' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Immutable System Transaction & State Audit Ledger
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">
              Strict BR-GLOBAL-005 Compliance
            </span>
          </div>

          <EnterpriseDataGrid<AuditLogEntry>
            data={auditLogs}
            columns={auditColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="audit_governance_ledger"
            density="compact"
          />
        </div>
      )}

      {/* 2. Configuration Platform Hub */}
      {currentTab === 'platform' && (
        <ConfigurationPlatformView
          customFields={customFields}
          onAddCustomField={onAddCustomField || (() => {})}
          onToggleCustomField={onToggleCustomField || (() => {})}
          customValues={customValues}
          onSetCustomFieldValue={onSetCustomFieldValue || (() => {})}
          workflows={workflows}
          onUpdateWorkflow={onUpdateWorkflow || (() => {})}
          businessRules={businessRules}
          onToggleBusinessRule={onToggleBusinessRule || (() => {})}
          currentUser={currentUser}
          onSwitchUser={onSwitchUser || (() => {})}
        />
      )}

      {/* 3. Master Feature Registry */}
      {currentTab === 'registry' && (
        <FeatureRegistryView
          features={featureRegistry}
          onUpdateStatus={onUpdateFeatureStatus || (() => {})}
        />
      )}

      {/* 4. SoD Matrix */}
      {currentTab === 'sod' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800">
            <span className="text-amber-400 font-bold block mb-1">
              Section 44: Security & Segregation of Duties Constitution
            </span>
            <p className="text-slate-300 font-sans text-xs">
              Aksi sensitif: Persetujuan BOM, override rilis produksi, stok minus, rilis kualitas override, adjustment stok, adjustment biaya, dan tutup order. Seluruhnya wajib memvalidasi otorisasi RBAC dan menuliskan audit log immutable.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/50 text-slate-500 font-semibold font-mono text-[11px]">
                  <th className="py-2.5 px-4">PERAN (ROLE)</th>
                  <th className="py-2.5 px-4 text-emerald-800 dark:text-emerald-400">OTORITAS RESMI (CAN DO)</th>
                  <th className="py-2.5 px-4 text-rose-800 dark:text-rose-400">BATASAN & INVARIAN (RESTRICTED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">PPIC Supervisor</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Rencana demand, MPS, kalkulasi MRP, rilis MO sesuai batas stok</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Dilarang mengubah angka saldo persediaan secara langsung</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Shop Floor Operator</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Mulai/jeda operasi WO, sentuh pelaporan output unit good & scrap</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Dilarang menyetujui disposisi kualitas atau menerbitkan PO</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Quality Inspector</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Eksekusi inspeksi, sampling mikrometer, penempatan karantina HOLD</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Dilarang rilis override lot sendiri tanpa otorisasi dual-approval</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Procurement Buyer</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Penerbitan PO vendor, sertifikasi supplier, negosiasi harga</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Dilarang menyetujui PR buatannya sendiri (SoD BR-PRC-002)</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Receiving Dock Lead</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Penerimaan fisik barang (GRN), alokasi ke bucket karantina HOLD</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Dilarang memindahkan material karantina ke AVAILABLE tanpa QC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
