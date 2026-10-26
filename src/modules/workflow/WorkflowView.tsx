import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  ApprovalTransactionRequest,
  ApprovalLevelStatus,
  ApprovalMatrixRule,
} from '../../types';
import {
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_APPROVAL_MATRIX_RULES,
} from '../../lib/mockData';
import { processApprovalDecision, filterUserTasks } from './workflowMatrixService';
import { DataTable } from '../../components/common/DataTable';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Send,
  Sliders,
  Layers,
  History,
  Info,
} from 'lucide-react';

interface WorkflowViewProps {
  initialTab?: string;
  currentUser?: {
    id: string;
    name: string;
    roles: string[];
    plantScope?: string[];
  };
  onNavigateToModule?: (module: any, subTab?: string) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  initialTab = 'my-tasks',
  currentUser = {
    id: 'emp-103',
    name: 'Hendra Wijaya',
    roles: ['PPIC_MANAGER', 'SUPERVISOR'],
    plantScope: ['PLANT-01', 'PLANT-02'],
  },
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [requests, setRequests] = useState<ApprovalTransactionRequest[]>(INITIAL_APPROVAL_REQUESTS);
  const [matrixRules, setMatrixRules] = useState<ApprovalMatrixRule[]>(INITIAL_APPROVAL_MATRIX_RULES);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalTransactionRequest | null>(null);
  const [isDecisionDrawerOpen, setIsDecisionDrawerOpen] = useState(false);
  const [decisionReason, setDecisionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { myPendingApprovals, mySubmittedRequests, completedHistory } = filterUserTasks(
    requests,
    currentUser
  );

  const allPendingRequests = requests.filter((r) => r.status === 'PENDING');
  const escalatedRequests = requests.filter(
    (r) => r.status === 'PENDING' && r.levels.some((l) => l.isEscalated)
  );

  const handleOpenDrawer = (req: ApprovalTransactionRequest) => {
    setSelectedRequest(req);
    setDecisionReason('');
    setActionError(null);
    setActionSuccess(null);
    setIsDecisionDrawerOpen(true);
  };

  const handleDecision = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setActionError(null);
    setActionSuccess(null);

    const result = processApprovalDecision({
      request: selectedRequest,
      currentUserId: currentUser.id,
      currentUserName: currentUser.name,
      currentUserRoles: currentUser.roles,
      decision,
      reason: decisionReason,
      enforceSegregationOfDuties: true,
    });

    if (!result.success) {
      setActionError(result.error || 'Gagal memproses keputusan approval.');
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === result.updatedRequest.id ? result.updatedRequest : r))
    );
    setSelectedRequest(result.updatedRequest);
    setActionSuccess(
      decision === 'APPROVED'
        ? `Transaksi ${result.updatedRequest.requestNumber} berhasil disetujui (Level ${
            result.updatedRequest.status === 'APPROVED' ? 'Selesai / Released' : result.updatedRequest.currentLevel
          }).`
        : `Transaksi ${result.updatedRequest.requestNumber} berhasil ditolak.`
    );
  };

  // TanStack columns for Approval Requests
  const requestColumns: ColumnDef<ApprovalTransactionRequest>[] = [
    {
      accessorKey: 'requestNumber',
      header: 'No. Permohonan',
      cell: ({ row }) => (
        <span className="font-semibold text-indigo-700 font-mono">
          {row.original.requestNumber}
        </span>
      ),
    },
    {
      accessorKey: 'approvalType',
      header: 'Tipe Transaksi',
      cell: ({ row }) => {
        const type = row.original.approvalType;
        const label =
          type === 'PRODUCTION_PLAN'
            ? 'Production Plan (MPS)'
            : type === 'PURCHASE_REQUISITION'
            ? 'Purchase Requisition (PR)'
            : type === 'BOM_CHANGE'
            ? 'BOM Revision (ECN)'
            : type;
        return (
          <span className="text-slate-800 font-medium">
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: 'referenceTitle',
      header: 'Judul Referensi',
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-slate-700" title={row.original.referenceTitle}>
          <span className="font-medium text-slate-900 block truncate">
            {row.original.referenceTitle}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Ref: {row.original.referenceId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'plantName',
      header: 'Plant',
      cell: ({ row }) => (
        <span className="text-slate-600">
          {row.original.plantName.replace(' Plant', '')}
        </span>
      ),
    },
    {
      accessorKey: 'requesterName',
      header: 'Pemohon',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-800 block">
            {row.original.requesterName}
          </span>
          <span className="text-[11px] text-slate-400">
            {row.original.requesterPosition}
          </span>
        </div>
      ),
    },
    {
      id: 'currentLevelDisplay',
      header: 'Tingkat Approval',
      cell: ({ row }) => {
        const currentLvl = row.original.levels[row.original.currentLevel - 1];
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-slate-700 font-semibold">
              Lvl {row.original.currentLevel}/{row.original.totalLevels}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 text-[11px] truncate max-w-[120px]">
              {currentLvl?.authorityTitle || 'N/A'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span
            className={`font-semibold text-xs ${
              s === 'APPROVED'
                ? 'text-emerald-700'
                : s === 'REJECTED'
                ? 'text-rose-700'
                : 'text-amber-700'
            }`}
          >
            {s === 'APPROVED' ? 'Disetujui' : s === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleOpenDrawer(row.original)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
        >
          <span>Tinjau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pusat Tata Kelola & Approval Workflow
            </h1>
            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded-md">
              Enterprise Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Engine persetujuan multi-level transaksional dengan audit trail kriptografis dan penegakan Segregation of Duties (SoD).
          </p>
        </div>

        {/* User Context Bar */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 text-xs">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{currentUser.name}</div>
            <div className="text-slate-500 text-[11px]">
              Role: <span className="text-indigo-600 font-medium">{currentUser.roles.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tugas Menunggu Saya</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {myPendingApprovals.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Memerlukan otorisasi sesuai kewenangan role</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Antrean Sistem</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {allPendingRequests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Seluruh plant dalam review</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pengajuan Saya</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {mySubmittedRequests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dokumen yang disubmit ke manajemen</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Eskalasi SLA Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">
            {escalatedRequests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Melebihi batas SLA 24h/48h</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('my-tasks')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'my-tasks'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tugas Saya (Approval Inbox)</span>
          {myPendingApprovals.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'my-tasks' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {myPendingApprovals.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all-pending')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'all-pending'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Pending</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'all-pending' ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {allPendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-requests')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'my-requests'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Pengajuan Saya ({mySubmittedRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Otorisasi ({completedHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Aturan Approval Matrix</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        {activeTab === 'my-tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Antrean Transaksi Menunggu Persetujuan Anda
                </h2>
                <p className="text-xs text-slate-500">
                  Hanya menampilkan dokumen yang menunggu role otorisasi Anda dan memenuhi prinsip Segregation of Duties.
                </p>
              </div>
            </div>

            <DataTable
              data={myPendingApprovals}
              columns={requestColumns}
              searchPlaceholder="Cari nomor dokumen atau pemohon..."
              emptyTitle="Tidak Ada Tugas Pending"
              emptySubtitle="Semua dokumen approval yang ditugaskan ke Anda telah selesai diproses."
            />
          </div>
        )}

        {activeTab === 'all-pending' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Seluruh Antrean Approval Pending di Organisasi
              </h2>
              <p className="text-xs text-slate-500">
                Visibilitas menyeluruh terhadap transaksi yang sedang berjalan di lintas departemen dan plant.
              </p>
            </div>

            <DataTable
              data={allPendingRequests}
              columns={requestColumns}
              searchPlaceholder="Cari semua antrean..."
            />
          </div>
        )}

        {activeTab === 'my-requests' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Status Dokumen yang Anda Ajukan
              </h2>
              <p className="text-xs text-slate-500">
                Lacak progres persetujuan berjenjang dan SLA countdown dari dokumen yang Anda buat.
              </p>
            </div>

            <DataTable
              data={mySubmittedRequests}
              columns={requestColumns}
              searchPlaceholder="Cari dokumen pengajuan..."
              emptyTitle="Belum Ada Pengajuan"
              emptySubtitle="Anda belum pernah mengajukan dokumen ke sistem workflow."
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Log Riwayat Keputusan & Otorisasi Selesai
              </h2>
              <p className="text-xs text-slate-500">
                Arsip transaksi final (Approved / Rejected) lengkap dengan alasan penolakan dan timestamp audit.
              </p>
            </div>

            <DataTable
              data={completedHistory}
              columns={requestColumns}
              searchPlaceholder="Cari riwayat transaksi..."
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Konfigurasi Aturan Approval Matrix (Multi-Tier Rules)
              </h2>
              <p className="text-xs text-slate-500">
                Matriks evaluasi dinamis berdasarkan Plant, Nilai Transaksi, dan Kuantitas Produksi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matrixRules.map((rule) => (
                <div
                  key={rule.id}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-xs">
                        {rule.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-sm">
                        {rule.approvalType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rule.description}</p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span>Plant: <strong>{rule.plantId}</strong></span>
                      {rule.minQuantity && <span>· Min Qty: <strong>{rule.minQuantity.toLocaleString()} pcs</strong></span>}
                      {rule.minAmount && <span>· Min Nilai: <strong>Rp {rule.minAmount.toLocaleString()}</strong></span>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500">Jenjang Approval:</div>
                      {rule.levels.map((lvl) => (
                        <div
                          key={lvl.level}
                          className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded border border-slate-200"
                        >
                          <span className="font-medium text-slate-800">
                            Lvl {lvl.level}: {lvl.authorityTitle}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {lvl.roleRequired} (SLA {lvl.slaHours}h)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decision Drawer Modal */}
      {isDecisionDrawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {selectedRequest.requestNumber}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      selectedRequest.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedRequest.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Tipe: <strong>{selectedRequest.approvalType}</strong> · Plant: <strong>{selectedRequest.plantName}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDecisionDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
              {/* Alert Feedback */}
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Pemberitahuan Validasi:</span>
                    {actionError}
                  </div>
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Transaction Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="font-semibold text-slate-900 text-xs">Informasi Pengajuan:</div>
                <div className="text-sm font-medium text-slate-900">{selectedRequest.referenceTitle}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400">ID Referensi:</span>{' '}
                    <span className="font-mono text-slate-800 font-semibold">{selectedRequest.referenceId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Waktu Submit:</span>{' '}
                    <span className="font-mono text-slate-800">{selectedRequest.submittedAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Pemohon (Requester):</span>{' '}
                    <span className="text-slate-800 font-medium">{selectedRequest.requesterName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Jabatan:</span>{' '}
                    <span className="text-slate-800">{selectedRequest.requesterPosition}</span>
                  </div>
                  {selectedRequest.totalQuantity && (
                    <div>
                      <span className="text-slate-400">Target Kuantitas:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">
                        {selectedRequest.totalQuantity.toLocaleString()} pcs
                      </span>
                    </div>
                  )}
                  {selectedRequest.totalAmount && (
                    <div>
                      <span className="text-slate-400">Total Nominal:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">
                        Rp {selectedRequest.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Operational Metadata / Constraint Radar Snapshot */}
              {selectedRequest.metadata && (
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-indigo-50/30">
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Evaluasi Kelayakan (5-Pillar Constraint Radar Snapshot):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedRequest.metadata.feasibility && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Status Kelayakan:</span>
                        <span className="font-bold text-emerald-700">
                          {selectedRequest.metadata.feasibility}
                        </span>
                      </div>
                    )}
                    {selectedRequest.metadata.machineCapacityLoadPct && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Beban Kapasitas Mesin:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedRequest.metadata.machineCapacityLoadPct}%
                        </span>
                      </div>
                    )}
                    {selectedRequest.metadata.manpowerRequired && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Kebutuhan Manpower:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedRequest.metadata.manpowerRequired} Operator
                        </span>
                      </div>
                    )}
                    {selectedRequest.metadata.materialConstraintCount !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Kendala Material:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {selectedRequest.metadata.materialConstraintCount} Defisit
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Chain Stepper */}
              <div>
                <div className="font-semibold text-slate-900 text-xs mb-3">
                  Rantai Persetujuan Berjenjang ({selectedRequest.currentLevel} dari {selectedRequest.totalLevels}):
                </div>
                <div className="space-y-3">
                  {selectedRequest.levels.map((lvl) => {
                    const isPassed = lvl.status === 'APPROVED';
                    const isRejected = lvl.status === 'REJECTED';
                    const isCurrent = lvl.level === selectedRequest.currentLevel && selectedRequest.status === 'PENDING';

                    return (
                      <div
                        key={lvl.level}
                        className={`p-3 rounded-lg border text-xs ${
                          isCurrent
                            ? 'border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200'
                            : isPassed
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : isRejected
                            ? 'border-rose-200 bg-rose-50/30'
                            : 'border-slate-200 bg-slate-50/30 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isPassed
                                  ? 'bg-emerald-600 text-white'
                                  : isRejected
                                  ? 'bg-rose-600 text-white'
                                  : isCurrent
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-300 text-slate-700'
                              }`}
                            >
                              {lvl.level}
                            </span>
                            <span className="font-semibold text-slate-900">{lvl.authorityTitle}</span>
                          </div>
                          <span
                            className={`font-semibold text-[11px] ${
                              isPassed
                                ? 'text-emerald-700'
                                : isRejected
                                ? 'text-rose-700'
                                : isCurrent
                                ? 'text-indigo-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {lvl.status === 'APPROVED'
                              ? 'Disetujui'
                              : lvl.status === 'REJECTED'
                              ? 'Ditolak'
                              : isCurrent
                              ? 'Menunggu Giliran'
                              : 'Antrean'}
                          </span>
                        </div>

                        <div className="mt-2 text-slate-600 text-[11px] grid grid-cols-2 gap-1">
                          <div>
                            Role Dibutuhkan: <span className="font-mono font-medium text-slate-800">{lvl.roleRequired}</span>
                          </div>
                          <div>
                            Batas SLA: <span className="font-mono text-slate-800">{lvl.slaDueDate}</span>
                          </div>
                        </div>

                        {lvl.decisionDate && (
                          <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                            <div>
                              Diputuskan oleh: <strong>{lvl.approverName}</strong> ({lvl.approverRole}) pada {lvl.decisionDate}
                            </div>
                            {lvl.reason && (
                              <div className="text-slate-700 italic mt-0.5">
                                Catatan: "{lvl.reason}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Form if Pending */}
              {selectedRequest.status === 'PENDING' && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="font-semibold text-slate-900 text-xs">
                    Tindakan Otorisasi Anda (Sebagai {currentUser.name}):
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Catatan Pertimbangan / Alasan (Wajib jika menolak):
                    </label>
                    <textarea
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="Masukkan catatan teknis atau alasan keputusan..."
                      rows={2}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDecision('APPROVED')}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui (Approve)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('REJECTED')}
                      className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak (Reject)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
