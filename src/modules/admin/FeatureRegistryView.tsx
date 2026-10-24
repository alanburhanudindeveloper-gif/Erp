import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Cpu,
  Boxes,
  Database,
  ArrowRight,
  Filter,
  Check,
  Building2,
  Zap
} from 'lucide-react';
import {
  FeatureRegistryItem,
  FeaturePhase,
  FeatureStatus,
  FeatureCategory,
} from '../../types';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createStatusColumn,
} from '../../components/data-grid';

interface FeatureRegistryViewProps {
  features: FeatureRegistryItem[];
  onUpdateStatus: (featureId: string, status: FeatureStatus, notes?: string) => void;
  onNavigateToModule?: (nav: string, subTab?: string) => void;
}

const PHASES: { code: FeaturePhase; label: string }[] = [
  { code: 'PHASE_0', label: 'Phase 0: Architecture' },
  { code: 'PHASE_1', label: 'Phase 1: Foundation' },
  { code: 'PHASE_2', label: 'Phase 2: Planning' },
  { code: 'PHASE_3', label: 'Phase 3: Execution' },
  { code: 'PHASE_4', label: 'Phase 4: Quality & Control' },
  { code: 'PHASE_5', label: 'Phase 5: Advanced Manufacturing' },
  { code: 'PHASE_6', label: 'Phase 6: Config Platform' },
  { code: 'PHASE_7', label: 'Phase 7: AI Advisory Copilot' },
];

export const FeatureRegistryView: React.FC<FeatureRegistryViewProps> = ({
  features,
  onUpdateStatus,
  onNavigateToModule,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingItem, setEditingItem] = useState<FeatureRegistryItem | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<FeatureStatus>('PLANNED');

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return features.filter((item) => {
      const matchPhase = selectedPhase === 'ALL' || item.phase === selectedPhase;
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStat = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.module.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPhase && matchCat && matchStat && matchSearch;
    });
  }, [features, selectedPhase, selectedCategory, selectedStatus, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = features.length;
    const prodReady = features.filter((f) => f.status === 'PRODUCTION_READY').length;
    const tested = features.filter((f) => f.status === 'TESTED').length;
    const inProgress = features.filter((f) => f.status === 'IN_PROGRESS').length;
    const planned = features.filter((f) => f.status === 'PLANNED').length;
    const implemented = features.filter((f) => f.status === 'IMPLEMENTED').length;
    const completedPct = Math.round(((prodReady + tested + implemented) / total) * 100);
    return { total, prodReady, tested, inProgress, planned, implemented, completedPct };
  }, [features]);

  // Columns for the EnterpriseDataGrid
  const columns = useMemo<GridColumn<FeatureRegistryItem>[]>(
    () => [
      createTextColumn<FeatureRegistryItem>('code', 'Feature Code', {
        width: 140,
        pinned: 'left',
        isCode: true,
      }),
      {
        field: 'phase',
        headerName: 'Phase',
        type: 'text',
        width: 160,
        renderCell: ({ row }) => (
          <span className="text-xs font-mono text-slate-700">
            {row.phaseName.replace('Phase ', 'P')}
          </span>
        ),
      },
      {
        field: 'category',
        headerName: 'Category',
        type: 'text',
        width: 130,
        renderCell: ({ value }) => {
          const color =
            value === 'CORE'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : value === 'ADVANCED'
              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
              : value === 'CONFIGURABLE'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : value === 'AI'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-slate-50 text-slate-700 border-slate-200';
          return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`}>
              {value}
            </span>
          );
        },
      },
      createTextColumn<FeatureRegistryItem>('module', 'Domain Module', { width: 140 }),
      createTextColumn<FeatureRegistryItem>('title', 'Feature Title', {
        width: 240,
        renderCell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900">{row.title}</div>
            <div className="text-[11px] text-slate-500 truncate max-w-xs">{row.description}</div>
          </div>
        ),
      }),
      createStatusColumn<FeatureRegistryItem>('status', 'Lifecycle Status', {
        width: 160,
        filterOptions: [
          { label: 'PRODUCTION READY', value: 'PRODUCTION_READY' },
          { label: 'TESTED', value: 'TESTED' },
          { label: 'IN PROGRESS', value: 'IN_PROGRESS' },
          { label: 'PLANNED', value: 'PLANNED' },
        ],
        renderCell: ({ value }) => {
          const badge =
            value === 'PRODUCTION_READY' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-2.5 h-2.5" /> PRODUCTION READY
              </span>
            ) : value === 'TESTED' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <ShieldCheck className="w-2.5 h-2.5" /> TESTED
              </span>
            ) : value === 'IN_PROGRESS' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-2.5 h-2.5" /> IN PROGRESS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                PLANNED
              </span>
            );
          return badge;
        },
      }),
      createTextColumn<FeatureRegistryItem>('targetRelease', 'Target', { width: 100, isCode: true }),
      {
        field: 'actions',
        headerName: 'Action',
        type: 'text',
        width: 100,
        renderCell: ({ row }) => (
          <button
            onClick={() => {
              setEditingItem(row);
              setEditStatus(row.status);
              setEditNotes(row.notes || '');
            }}
            className="px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            Edit Status
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded">
                MASTER FEATURE REGISTRY
              </span>
              <span className="text-xs text-slate-400 font-mono">SECTIONS 42 & 43 ROADMAP</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              Manufacturing ERP Full Capability Lifecycle Registry
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mt-0.5">
              Seluruh requirement dari Phase 0 hingga Phase 7 tetap aktif dan terdaftar secara persisten.
              Status transisi tidak boleh menghapus atau menyederhanakan cakupan arsitektur platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Platform Readiness</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{stats.completedPct}% Live</div>
              <div className="text-[10px] text-slate-300 font-mono">
                {stats.prodReady + stats.tested} / {stats.total} Features Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Roadmap Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {PHASES.map((p, idx) => {
          const phaseFeatures = features.filter((f) => f.phase === p.code);
          const activeCount = phaseFeatures.filter(
            (f) => f.status === 'PRODUCTION_READY' || f.status === 'TESTED'
          ).length;
          const isSelected = selectedPhase === p.code;

          return (
            <button
              key={p.code}
              onClick={() => setSelectedPhase(isSelected ? 'ALL' : p.code)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className={`text-[10px] font-mono font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                PHASE 0{idx}
              </div>
              <div className="text-xs font-bold truncate mt-0.5">{p.label.split(': ')[1]}</div>
              <div className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                {activeCount} / {phaseFeatures.length} Ready
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Phase Filter Dropdown */}
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-sans focus:outline-hidden"
          >
            <option value="ALL">Semua Phase (0–7)</option>
            {PHASES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-sans focus:outline-hidden"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="CORE">CORE</option>
            <option value="ADVANCED">ADVANCED</option>
            <option value="CONFIGURABLE">CONFIGURABLE</option>
            <option value="AI">AI ADVISORY</option>
            <option value="OPTIONAL">OPTIONAL</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-sans focus:outline-hidden"
          >
            <option value="ALL">Semua Status</option>
            <option value="PRODUCTION_READY">PRODUCTION READY</option>
            <option value="TESTED">TESTED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="PLANNED">PLANNED</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode, fitur, atau modul..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:border-blue-500 font-sans"
          />
        </div>
      </div>

      {/* Main Enterprise DataGrid */}
      <EnterpriseDataGrid<FeatureRegistryItem>
        data={filteredFeatures}
        columns={columns}
        pagination
        searchable={false}
        filtering
        sorting
        columnResizing
        exportable
        exportFileName="kranex_master_feature_registry"
        density="compact"
      />

      {/* Edit Status Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-[10px] font-mono text-blue-600 font-bold uppercase">{editingItem.code}</div>
              <h3 className="text-sm font-bold text-slate-900">{editingItem.title}</h3>
              <p className="text-xs text-slate-500">{editingItem.description}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lifecycle Status:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as FeatureStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono text-xs focus:outline-hidden"
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="IMPLEMENTED">IMPLEMENTED</option>
                  <option value="TESTED">TESTED</option>
                  <option value="PRODUCTION_READY">PRODUCTION READY</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Implementation Notes / Audit Reason:</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan update progress atau verifikasi test..."
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(editingItem.id, editStatus, editNotes);
                  setEditingItem(null);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
