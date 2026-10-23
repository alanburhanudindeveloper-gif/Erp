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
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createDateColumn,
  createStatusColumn,
} from '../../components/data-grid';

interface AuditGovernanceViewProps {
  auditLogs: AuditLogEntry[];
}

export const AuditGovernanceView: React.FC<AuditGovernanceViewProps> = ({ auditLogs }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'sod'>('audit');

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Governance, Approval & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable audit log of all system transitions and Segregation of Duties (SoD) authorization matrix.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Immutable Audit Log Ledger ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('sod')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sod'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Segregation of Duties (SoD) Matrix (Page 113)
        </button>
      </div>

      {/* 1. Audit Log Ledger */}
      {activeTab === 'audit' && (
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

      {/* 2. SoD Matrix (Page 113) */}
      {activeTab === 'sod' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800">
            <span className="text-amber-400 font-bold block mb-1">
              PDF Section 44: Security & Segregation of Duties Constitution
            </span>
            <p className="text-slate-300 font-sans text-xs">
              Sensitive actions: BOM approval, production release override, negative stock, quality release override, stock adjustment, cost adjustment, order reopen/close. All must enforce strict RBAC permissions and write immutable audit records.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/50 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-emerald-800 dark:text-emerald-400">Permitted Authorities (Can Do)</th>
                  <th className="py-2.5 px-4 text-rose-800 dark:text-rose-400">Restricted Invariants (Should Not Do)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">PPIC</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Plan, create/release within approval threshold</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Change posted inventory movements directly</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Operator</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Execute assigned WO, touch log good & scrap output</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Approve quality dispositions or issue POs</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Quality Inspector</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Execute inspection, sample testing, place hold/quarantine</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Override own inspection without supervisor dual-auth</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Buyer</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Create PO, negotiate terms, maintain supplier certifications</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Approve POs exceeding approval limit or approve own PR</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">Warehouse Staff</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Perform GRN receiving, putaway, staging transfer, picking</td>
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-medium">Release materials from quarantine hold without QC sign-off</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
