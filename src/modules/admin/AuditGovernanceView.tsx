import React, { useState } from 'react';
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

interface AuditGovernanceViewProps {
  auditLogs: AuditLogEntry[];
}

export const AuditGovernanceView: React.FC<AuditGovernanceViewProps> = ({ auditLogs }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'sod'>('audit');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Governance, Approval & Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Immutable audit log of all system transitions and Segregation of Duties (SoD) authorization matrix.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Immutable Audit Log Ledger ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('sod')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sod'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Segregation of Duties (SoD) Matrix (Page 113)
        </button>
      </div>

      {/* 1. Audit Log Ledger */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Document Ref</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">State Transition</th>
                <th className="py-2.5 px-4">Decision</th>
                <th className="py-2.5 px-4">Mandatory Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-blue-600">{log.documentId}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">{log.action}</td>
                  <td className="py-3 px-4 font-sans text-slate-800">{log.actor}</td>
                  <td className="py-3 px-4 font-sans text-slate-500 text-xs">{log.role}</td>
                  <td className="py-3 px-4 text-xs">
                    {log.oldStatus ? (
                      <span>
                        <span className="text-slate-400">{log.oldStatus}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="text-slate-800 font-bold">{log.newStatus}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      log.decision === 'APPROVED' || log.decision === 'EXECUTED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-600 truncate max-w-sm">
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-emerald-800">Permitted Authorities (Can Do)</th>
                  <th className="py-2.5 px-4 text-rose-800">Restricted Invariants (Should Not Do)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">PPIC</td>
                  <td className="py-3 px-4 text-slate-700">Plan, create/release within approval threshold</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">Change posted inventory movements directly</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">Operator</td>
                  <td className="py-3 px-4 text-slate-700">Execute assigned WO, touch log good & scrap output</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">Change master BOM or modify standard costs</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">Warehouse</td>
                  <td className="py-3 px-4 text-slate-700">Issue material, receive finished goods, transfer locations</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">Approve own physical stock write-down adjustment</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">QC (Quality Control)</td>
                  <td className="py-3 px-4 text-slate-700">Inspect sample lots, log NCR, set hold/rework disposition</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">Modify manufacturing order production cost</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">Controller</td>
                  <td className="py-3 px-4 text-slate-700">Cost valuation, variance settlement, period close</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">Approve own operational process exceptions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
