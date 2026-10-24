import React, { useState } from 'react';
import {
  Database,
  CalendarRange,
  Factory,
  Boxes,
  ShieldCheck,
  CircleDollarSign,
  Play,
  ArrowRight,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ShieldAlert,
  GitBranch,
  Cpu,
  Lock,
  Workflow,
  Sparkles,
  ChevronRight,
  Check,
  Building2,
  Users,
  Settings,
  Scale
} from 'lucide-react';

interface ManufacturingWorkflowGuideProps {
  activeSubTab?: string;
  onSelectSubTab?: (subTab: string) => void;
  onNavigateToNav: (navId: any, subTab?: string) => void;
  onResetDemo: () => void;
}

interface FeatureItem {
  tier: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  tierLabel: string;
  category: string;
  name: string;
  description: string;
  placement: string;
  status: 'Completed' | 'Partially Implemented' | 'Target Phase 1';
  rule: string;
  navTarget?: { nav: string; subTab?: string };
}

const FEATURE_MAP: FeatureItem[] = [
  // P0
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Master Data',
    name: 'Item Master & Dual UOM',
    description: 'SKU catalog (Raw, WIP, FG, Packaging, Consumables) with dual unit conversions (1 Coil = 2,500 KG; 1 Sheet = 1.25 m²).',
    placement: 'src/modules/master-data/',
    status: 'Completed',
    rule: 'SKU code immutable once transactional history exists.',
    navTarget: { nav: 'master-data', subTab: 'products' },
  },
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Master Data',
    name: 'BOM Management & Revisioning',
    description: 'Multi-level BOM hierarchy, effective validity date range, revision control (Rev.01, 02), and scrap factor allowances.',
    placement: 'src/modules/master-data/',
    status: 'Completed',
    rule: 'Circular BOM references strictly prevented by DAG validation.',
    navTarget: { nav: 'master-data', subTab: 'bom' },
  },
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Master Data',
    name: 'Routing & Work Center Operations',
    description: 'Sequenced operation routing (01 Cutting -> 02 Assembly), setup minutes, unit cycle run times, and transfer batches.',
    placement: 'src/modules/master-data/',
    status: 'Completed',
    rule: 'Routing steps form an acyclic directed graph with clear sequence numbers.',
    navTarget: { nav: 'master-data', subTab: 'routings' },
  },
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Inventory',
    name: '5-Bucket Stock Isolation',
    description: 'Physical & logical stock partitioned into 5 states: Available, Reserved, Hold, Rejected, and WIP.',
    placement: 'src/modules/inventory/',
    status: 'Completed',
    rule: 'BR-INV-001: Negative stock balance strictly forbidden (STRICT_FALSE).',
    navTarget: { nav: 'inventory', subTab: 'material-availability' },
  },
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Inventory',
    name: 'Immutable Stock Movement Ledger',
    description: 'Double-entry material documents for all receipts, issues, and transfers. Direct balance UPDATE is prohibited.',
    placement: 'src/modules/inventory/',
    status: 'Completed',
    rule: 'BR-GLOBAL-004: Stock Balance = Sum(StockMovements). Zero stealth mutations.',
    navTarget: { nav: 'inventory', subTab: 'material-consumption' },
  },
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Planning',
    name: 'Deterministic MRP Engine',
    description: 'Gross-to-net algebraic formula calculating net shortages across lead time horizons with planned PO/MO action signals.',
    placement: 'src/lib/calculations/mrp.ts',
    status: 'Completed',
    rule: 'Formula: Net = Max(0, Gross - Available - ScheduledReceipts + SafetyStock).',
    navTarget: { nav: 'planning', subTab: 'mrp' },
  },
  {
    tier: 'P0',
    tierLabel: 'Foundational Core',
    category: 'Governance',
    name: 'Cryptographic Audit Trail Ledger',
    description: 'Immutable ledger logging Who, What, When, Before state, After state, and mandatory Reason Code.',
    placement: 'src/modules/admin/',
    status: 'Completed',
    rule: 'BR-GLOBAL-005: Audit records are append-only. Edit/Delete API disabled.',
    navTarget: { nav: 'admin' },
  },

  // P1
  {
    tier: 'P1',
    tierLabel: 'Core Execution',
    category: 'Manufacturing',
    name: 'Production Orders (MO) Lifecycle',
    description: 'Order lifecycle: PLANNED -> RELEASED -> IN_PROGRESS -> COMPLETED -> CLOSED with frozen BOM snapshot.',
    placement: 'src/modules/manufacturing/',
    status: 'Completed',
    rule: 'BOM snapshot frozen on release; unaffected by subsequent master BOM updates.',
    navTarget: { nav: 'manufacturing', subTab: 'production-orders' },
  },
  {
    tier: 'P1',
    tierLabel: 'Core Execution',
    category: 'Manufacturing',
    name: 'Shop Floor Kiosk & Gestures',
    description: 'Touchscreen station interface: start/pause work orders, log good & scrap output with Swipe-to-Action gestures.',
    placement: 'src/modules/manufacturing/ShopFloorTerminal.tsx',
    status: 'Completed',
    rule: 'Operation N cannot start until Operation N-1 completes. Fallback buttons present.',
    navTarget: { nav: 'manufacturing', subTab: 'shop-floor' },
  },
  {
    tier: 'P1',
    tierLabel: 'Core Execution',
    category: 'Manufacturing',
    name: 'Material Backflush & Reservations',
    description: 'Point-of-use consumption deduction and hard inventory reservations dedicated to specific work orders.',
    placement: 'src/modules/manufacturing/',
    status: 'Completed',
    rule: 'Reservations deducted from Available bucket to prevent double-allocation.',
    navTarget: { nav: 'inventory', subTab: 'reservations' },
  },
  {
    tier: 'P1',
    tierLabel: 'Core Execution',
    category: 'Procurement',
    name: 'Purchase Requisitions (PR) & Approvals',
    description: 'Tiered requisition approval based on total nominal threshold with automated routing.',
    placement: 'src/modules/procurement/',
    status: 'Completed',
    rule: 'BR-PRC-002: Segregation of Duties. Creator cannot approve their own PR.',
    navTarget: { nav: 'procurement', subTab: 'pr' },
  },
  {
    tier: 'P1',
    tierLabel: 'Core Execution',
    category: 'Procurement',
    name: 'PO Receiving & Auto-Quarantine (GRN)',
    description: 'Vendor PO dispatch, receiving dock logging, and automatic transfer into HOLD quarantine bucket.',
    placement: 'src/modules/procurement/',
    status: 'Completed',
    rule: 'All uninspected dock receipts land in quarantine HOLD state.',
    navTarget: { nav: 'procurement', subTab: 'grn' },
  },
  {
    tier: 'P1',
    tierLabel: 'Core Execution',
    category: 'Quality',
    name: 'Quality Inspections & Disposition',
    description: 'Incoming and in-process sample inspections; releases approved lots to Available or rejects to Quarantine.',
    placement: 'src/modules/quality/',
    status: 'Completed',
    rule: 'BR-INV-003: Stock in HOLD or REJECTED bucket cannot be issued to production.',
    navTarget: { nav: 'quality', subTab: 'inspections' },
  },

  // P2
  {
    tier: 'P2',
    tierLabel: 'Advanced Manufacturing',
    category: 'Capacity',
    name: 'Finite Capacity & Machine Loading',
    description: 'Machine workload vs available shift hours; rough-cut & finite load analysis with bottleneck indicators.',
    placement: 'src/modules/capacity/',
    status: 'Completed',
    rule: 'Daily machine hours hard-capped at 24.0 hours per station.',
    navTarget: { nav: 'capacity', subTab: 'capacity-load' },
  },
  {
    tier: 'P2',
    tierLabel: 'Advanced Manufacturing',
    category: 'Manufacturing',
    name: 'Interactive Gantt Scheduling',
    description: 'Timeline visualization of order sequences across work centers with predecessor constraint validation.',
    placement: 'src/modules/manufacturing/',
    status: 'Partially Implemented',
    rule: 'Rescheduling preserves routing precedence dependencies.',
    navTarget: { nav: 'manufacturing', subTab: 'gantt' },
  },
  {
    tier: 'P2',
    tierLabel: 'Advanced Manufacturing',
    category: 'Inventory',
    name: 'Two-Way Lot Genealogy',
    description: 'Forward trace (Finished Goods lot to raw material coils) and Reverse trace (Raw lot to all affected MOs).',
    placement: 'src/modules/inventory/',
    status: 'Completed',
    rule: 'Full containment query resolves in sub-50ms for recall containment.',
    navTarget: { nav: 'inventory', subTab: 'finished-goods' },
  },
  {
    tier: 'P2',
    tierLabel: 'Advanced Manufacturing',
    category: 'Quality',
    name: 'Non-Conformance Reports (NCR) & Rework',
    description: 'Formal defect ticketing, root cause categorization, and creation of dedicated rework routing orders.',
    placement: 'src/modules/quality/',
    status: 'Completed',
    rule: 'Rework orders segregate material and labor costs from primary production.',
    navTarget: { nav: 'quality', subTab: 'rework' },
  },
  {
    tier: 'P2',
    tierLabel: 'Advanced Manufacturing',
    category: 'Costing',
    name: 'Standard vs Actual Cost Variance',
    description: 'Absorption costing analysis: Material usage variance, labor rate variance, and machine downtime variance.',
    placement: 'src/modules/costing/',
    status: 'Completed',
    rule: 'Financial variances post to separate ledger accounts for monthly close.',
    navTarget: { nav: 'costing', subTab: 'variance' },
  },
  {
    tier: 'P2',
    tierLabel: 'Advanced Manufacturing',
    category: 'Maintenance',
    name: 'Station Breakdown & Downtime Logging',
    description: 'Down-tool logging segregating downtime into mechanical breakdown, tooling, starvation, and scheduled maintenance.',
    placement: 'src/modules/maintenance/',
    status: 'Completed',
    rule: 'Breakdown status automatically halts scheduled work orders at that station.',
    navTarget: { nav: 'maintenance' },
  },

  // P3
  {
    tier: 'P3',
    tierLabel: 'Configurable Platform',
    category: 'Config Engine',
    name: 'Enterprise DataGrid System',
    description: 'Standardized table across all 11 modules: server-side paging, filter popovers, column resize, density toggle.',
    placement: 'src/components/data-grid/',
    status: 'Completed',
    rule: 'Monospace tabular numerals; zero layout shift on sort/filter.',
  },
  {
    tier: 'P3',
    tierLabel: 'Configurable Platform',
    category: 'Config Engine',
    name: 'Custom Field Schema Engine',
    description: 'Dynamic attribute generator (String, Number, Date, Select) attached to Items, BOMs, MOs, and QC records.',
    placement: 'src/modules/master-data/',
    status: 'Target Phase 1',
    rule: 'Persisted in declarative JSON schema without mutating relational database tables.',
  },
  {
    tier: 'P3',
    tierLabel: 'Configurable Platform',
    category: 'Config Engine',
    name: 'Dynamic Visual Workflow Builder',
    description: 'Drag-and-drop state machine builder configuring custom status transitions, approval gates, and notifications.',
    placement: 'src/modules/admin/',
    status: 'Target Phase 1',
    rule: 'State machine validator rejects unreachable deadlocks or cycles.',
  },
  {
    tier: 'P3',
    tierLabel: 'Configurable Platform',
    category: 'Config Engine',
    name: 'Configurable Dashboard & Widgets',
    description: 'Role-based KPI layout customization: OEE gauge, scrap Pareto, inventory valuation, bottleneck monitors.',
    placement: 'src/modules/dashboard/',
    status: 'Completed',
    rule: 'Role-specific default templates for Plant Manager, Planner, and Operator.',
    navTarget: { nav: 'dashboard' },
  },

  // P4
  {
    tier: 'P4',
    tierLabel: 'AI Advisory Copilot',
    category: 'AI Advisory',
    name: 'Supplier Document Extractor',
    description: 'OCR analysis extracting raw vendor quotes/invoices into structured draft tables.',
    placement: 'src/components/ai/',
    status: 'Completed',
    rule: 'Human review required; AI cannot write directly to ledger without authorization.',
  },
  {
    tier: 'P4',
    tierLabel: 'AI Advisory Copilot',
    category: 'AI Advisory',
    name: 'Generative SOP / Work Instructions',
    description: 'Drafts step-by-step assembly instructions and safety checklists from BOM & routing specs.',
    placement: 'src/components/ai/',
    status: 'Completed',
    rule: 'Tagged with advisory disclaimer; requires supervisor approval.',
  },
  {
    tier: 'P4',
    tierLabel: 'AI Advisory Copilot',
    category: 'AI Advisory',
    name: 'Root-Cause Anomaly Hypothesis',
    description: 'Diagnostic copilot analyzing defect logs to formulate 5-Why and Ishikawa cause hypotheses.',
    placement: 'src/components/ai/',
    status: 'Completed',
    rule: 'Advisory only. Quality Inspector retains final sign-off authority.',
  },
  {
    tier: 'P4',
    tierLabel: 'AI Advisory Copilot',
    category: 'AI Advisory',
    name: 'Telemetry Budget Governor',
    description: 'Cost containment monitor enforcing strict client-side inference caps and daily token budgets.',
    placement: 'src/components/ai/',
    status: 'Completed',
    rule: 'Hard cut-off when token budget threshold is reached.',
  },
];

const STEPS = [
  {
    step: 1,
    title: 'Master Data Setup',
    subtitle: 'Produk, BOM, Routing, Work Center & UOM',
    icon: Database,
    navId: 'master-data',
    subTab: 'products',
    summary: 'Fondasi utama ERP manufaktur. Sebelum membuat rencana produksi, sistem harus memiliki Item Master (SKU), Bill of Materials (BOM dengan revisi), Routing (urutan operasi dan waktu cycle), dan Work Center (kapasitas dan tarif mesin).',
    rules: [
      'BOM versioned (misal BOM-A Rev.03) menyimpan rasio material: Material X = 2/unit, Material Y = 3/unit.',
      'Routing menentukan urutan wajib: 01 Cutting → 02 Assembly → 03 Painting → 04 Packing.',
      'Work Center menetapkan kapasitas harian (misal 480 menit/hari) dan tarif biaya overhead/jam.',
    ],
  },
  {
    step: 2,
    title: 'Demand, MPS & MRP Engine',
    subtitle: 'Perhitungan Kebutuhan Material Bersih',
    icon: CalendarRange,
    navId: 'planning',
    subTab: 'mrp',
    summary: 'Mengubah permintaan penjualan (Sales Order MTO / Forecast MTS) menjadi Master Production Schedule (MPS) lalu meledakkan (explode) kebutuhan komponen melalui formula MRP.',
    rules: [
      'Formula MRP Page 92: Net Requirement = Gross + Safety Stock - On-Hand - Scheduled Receipts.',
      'Net X = 2,000 + 100 - 1,400 - 300 = 400 KG → Sistem otomatis merekomendasikan Planned Purchase Order.',
      'Net Y = 0 MTR → Stok cukup, tidak perlu order tambahan.',
    ],
  },
  {
    step: 3,
    title: 'Production Order & Hard Reservation',
    subtitle: 'Pengecekan Ketersediaan dan Order Release',
    icon: Factory,
    navId: 'manufacturing',
    subTab: 'production-orders',
    summary: 'Planner membuat Manufacturing Order (MO-2026-00124) untuk 1,000 unit Produk A. Sistem membekukan snapshot BOM dan routing yang berlaku.',
    rules: [
      'Pengecekan Ketersediaan (Material Availability): Stok dicek real-time. Jika ada shortage (Material Y kurang 300), sistem memerlukan controlled override.',
      'Saat di-Release: Material di-hard reserve agar tidak terpakai oleh order lain.',
      'Operasi pertama (01 Cutting) otomatis berubah status menjadi READY.',
    ],
  },
  {
    step: 4,
    title: 'Shop Floor Execution & Work Orders',
    subtitle: 'Eksekusi di Lantai Pabrik & Pelaporan Output',
    icon: Play,
    navId: 'manufacturing',
    subTab: 'shop-floor',
    summary: 'Operator di Work Center (Machine M01) membuka terminal sentuh, memulai setup/run operasi, dan melaporkan unit good serta scrap beserta reason code.',
    rules: [
      'Work Order Dependencies (Page 96): 01 Cutting harus selesai sebelum 02 Assembly dapat dimulai.',
      'Jika terjadi breakdown (Page 101): Status mesin Down, downtime 45 menit dicatat terpisah dari waktu cycle normal.',
      'Partial Output (Page 94): Day one output 600 unit good dicatat; sisa 400 tetap berstatus open/backorder.',
    ],
  },
  {
    step: 5,
    title: 'Inventory Integration & Backflush',
    subtitle: 'Posting Buku Besar Persediaan yang Immutable',
    icon: Boxes,
    navId: 'inventory',
    subTab: 'material-consumption',
    summary: 'Setiap output yang dilaporkan otomatis memicu backflush material (pengurangan stok bahan baku) dan memposting barang jadi (Finished Goods) ke gudang.',
    rules: [
      'Prinsip Page 99: Tidak ada direct stock update. Semua saldo persediaan diturunkan dari transaksi perpindahan material (Material Document) yang immutable.',
      'Koreksi stok dilakukan melalui dokumen reversal pembatalan, bukan edit angka diam-diam.',
      'Two-Way Traceability (Page 103): Lot bahan baku (LOT-X-L100) dapat dilacak maju ke lot produk jadi (LOT-FG-F200), dan sebaliknya.',
    ],
  },
  {
    step: 6,
    title: 'Quality Disposition, Costing & Order Close',
    subtitle: 'Inspeksi Kualitas, Varians Biaya & Penutupan MO',
    icon: CircleDollarSign,
    navId: 'costing',
    subTab: 'variance',
    summary: 'Sebelum masuk gudang barang jadi (Available), lot diinspeksi oleh QC. Setelah selesai, Production Order ditutup dan varians biaya dihitung.',
    rules: [
      'QC Dispositions (Page 104): Lolos -> Masuk FG Available; Cacat -> Masuk Reject/Scrap; Perlu perbaikan -> Rework Order.',
      'Perhitungan Varians Biaya (Page 109): Standard Cost Rp 175.000 vs Actual Cost Rp 183.000 -> Total Varian Unfavorable Rp 8.000.000.',
      'Status MO berubah menjadi CLOSED; tidak ada mutasi stok atau jam kerja baru yang dapat dicatat ke MO ini.',
    ],
  },
];

export const ManufacturingWorkflowGuide: React.FC<ManufacturingWorkflowGuideProps> = ({
  activeSubTab = 'architecture',
  onSelectSubTab,
  onNavigateToNav,
  onResetDemo,
}) => {
  // Main mode: 'architecture' (Phase 0 Blueprint) or 'guide' (Interactive Walkthrough)
  const currentView = activeSubTab === 'guide' ? 'guide' : 'architecture';

  // Subtab inside Architecture view
  const [archTab, setArchTab] = useState<'feature-map' | 'domain-map' | 'config-map' | 'invariants'>('feature-map');

  // Filters for Feature Map
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Step state for Workflow walkthrough
  const [activeStep, setActiveStep] = useState(1);
  const currentStepData = STEPS[activeStep - 1];
  const StepIcon = currentStepData.icon;

  // Interactive Policy Toggles demo state
  const [policies, setPolicies] = useState({
    backflushTrigger: 'ON_OPERATION_COMPLETED',
    negativeStockAllowed: false,
    allowShortageOverride: true,
    scrapReasonMandatory: true,
    quarantineAutoRoute: true,
  });

  // Filtered features
  const filteredFeatures = FEATURE_MAP.filter((item) => {
    const matchesTier = tierFilter === 'ALL' || item.tier === tierFilter;
    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const tierCounts = {
    ALL: FEATURE_MAP.length,
    P0: FEATURE_MAP.filter((f) => f.tier === 'P0').length,
    P1: FEATURE_MAP.filter((f) => f.tier === 'P1').length,
    P2: FEATURE_MAP.filter((f) => f.tier === 'P2').length,
    P3: FEATURE_MAP.filter((f) => f.tier === 'P3').length,
    P4: FEATURE_MAP.filter((f) => f.tier === 'P4').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="bg-slate-900 text-white rounded-lg p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded">
                PHASE 0 ARCHITECTURAL BLUEPRINT
              </span>
              <span className="text-xs text-slate-400 font-mono">KRX-ARCH-2026-V1</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Kranex Industrial ERP — Architecture & Operations Hub
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Spesifikasi arsitektur komprehensif, pemetaan domain manufaktur berantai, aturan invarian deterministik,
              dan layer konfigurasi enterprise yang dapat disesuaikan tanpa merusak integritas buku besar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="inline-flex p-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium">
              <button
                onClick={() => onSelectSubTab?.('architecture')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                  currentView === 'architecture'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Phase 0 Blueprint & Maps</span>
              </button>
              <button
                onClick={() => onSelectSubTab?.('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                  currentView === 'guide'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Simulasi Alur 6-Tahap</span>
              </button>
            </div>

            <button
              onClick={onResetDemo}
              title="Reset data demo ke baseline"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-mono transition-colors"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE A: PHASE 0 ARCHITECTURE BLUEPRINT & MAPS                        */}
      {/* ========================================================================= */}
      {currentView === 'architecture' && (
        <div className="space-y-6">
          {/* Sub-navigation tabs within Architecture Blueprint */}
          <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg shadow-2xs">
            <button
              onClick={() => setArchTab('feature-map')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                archTab === 'feature-map'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Master Feature Map (P0–P4)</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                {FEATURE_MAP.length}
              </span>
            </button>

            <button
              onClick={() => setArchTab('domain-map')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                archTab === 'domain-map'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>2. Domain Map & Relational Flow</span>
            </button>

            <button
              onClick={() => setArchTab('config-map')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                archTab === 'config-map'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>3. Configuration Map (User-Adjustable)</span>
            </button>

            <button
              onClick={() => setArchTab('invariants')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                archTab === 'invariants'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>4. Hard Invariants (The 10 Rules)</span>
            </button>
          </div>

          {/* TAB 1: MASTER FEATURE MAP */}
          {archTab === 'feature-map' && (
            <div className="space-y-4">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">P0 Foundational</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">9 / 9</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 100% Core Ready
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">P1 Core Execution</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">6 / 6</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 100% Live
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">P2 Advanced Mfg</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">5 / 6</div>
                  <div className="text-[10px] text-blue-600 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 85% Live / Gantt
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">P3 Config Engine</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">2 / 4</div>
                  <div className="text-[10px] text-amber-600 font-medium mt-1">Grid & KPIs Live</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">P4 AI Advisory</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">4 / 4</div>
                  <div className="text-[10px] text-purple-600 font-medium mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Budget Capped
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                {/* Tier buttons */}
                <div className="flex flex-wrap items-center gap-1">
                  {(['ALL', 'P0', 'P1', 'P2', 'P3', 'P4'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setTierFilter(tier)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all ${
                        tierFilter === tier
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tier} ({tierCounts[tier]})
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari kapabilitas, modul, atau aturan..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:border-blue-500 font-sans"
                  />
                </div>
              </div>

              {/* High-density Enterprise Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                        <th className="py-2.5 px-3 font-semibold w-16">TIER</th>
                        <th className="py-2.5 px-3 font-semibold w-28">KATEGORI</th>
                        <th className="py-2.5 px-3 font-semibold w-48">FITUR / KAPABILITAS</th>
                        <th className="py-2.5 px-3 font-semibold">DESKRIPSI & SPESIFIKASI</th>
                        <th className="py-2.5 px-3 font-semibold w-48">PENEMPATAN KODE</th>
                        <th className="py-2.5 px-3 font-semibold w-28">STATUS</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredFeatures.map((item, idx) => {
                        const tierColor =
                          item.tier === 'P0'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : item.tier === 'P1'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : item.tier === 'P2'
                            ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                            : item.tier === 'P3'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-purple-100 text-purple-800 border-purple-200';

                        const statusBadge =
                          item.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-2.5 h-2.5" /> Selesai
                            </span>
                          ) : item.status === 'Partially Implemented' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Sebagian
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Phase 1 Target
                            </span>
                          );

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] ${tierColor}`}>
                                {item.tier}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-600 text-[11px]">
                              {item.category}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                              <div>{item.description}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ↳ <span className="text-slate-500 font-medium">Invarian:</span> {item.rule}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {item.placement}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {statusBadge}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.navTarget ? (
                                <button
                                  onClick={() => onNavigateToNav(item.navTarget!.nav, item.navTarget!.subTab)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-[11px] hover:underline"
                                >
                                  Buka →
                                </button>
                              ) : (
                                <span className="text-slate-300 font-mono text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOMAIN MAP & RELATIONAL SCHEMA */}
          {archTab === 'domain-map' && (
            <div className="space-y-6">
              {/* Visual Pipeline Flow */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                      Alur Rantai Domain Manufaktur (Manufacturing Value Stream)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Setiap entitas terhubung secara relasional; dilarang membuat modul CRUD yang terisolasi tanpa relasi.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded">
                    DETERMINISTIC PIPELINE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Step 1: Demand */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase">
                      <span>01. DEMAND & MPS</span>
                      <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">Demand Intake & Netting</div>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>• Sales Order Make-To-Order (MTO)</li>
                      <li>• Sales Forecast Make-To-Stock (MTS)</li>
                      <li>• Master Production Schedule (MPS)</li>
                    </ul>
                    <div className="pt-2 text-[10px] text-blue-600 font-mono border-t border-slate-200">
                      Output: Target Rencana Produksi
                    </div>
                  </div>

                  {/* Step 2: MRP & Supply */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 uppercase">
                      <span>02. DETERMINISTIC MRP</span>
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">Perhitungan Material Bersih</div>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>• BOM Multi-level Explosion Math</li>
                      <li>• Rumus Gross-to-Net (Page 92)</li>
                      <li>• Sinyal Pembelian (PR) & Produksi (MO)</li>
                    </ul>
                    <div className="pt-2 text-[10px] text-blue-700 font-mono border-t border-blue-200">
                      Output: PO Release / MO Release
                    </div>
                  </div>

                  {/* Step 3: Execution */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-emerald-600 uppercase">
                      <span>03. SHOP FLOOR & WIP</span>
                      <Factory className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">Eksekusi Work Order</div>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>• Hard Reservation stok bahan baku</li>
                      <li>• Touch Kiosk + Gestur Swipe</li>
                      <li>• Backflush & Wajib Reason Scrap</li>
                    </ul>
                    <div className="pt-2 text-[10px] text-emerald-700 font-mono border-t border-emerald-200">
                      Output: WIP & Good / Scrap Units
                    </div>
                  </div>

                  {/* Step 4: Ledger & Settlement */}
                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-600 uppercase">
                      <span>04. LEDGER & COSTING</span>
                      <CircleDollarSign className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">QC & Rekonsiliasi GL</div>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>• 5-Bucket Inventory Ledger</li>
                      <li>• Disposisi QC (Pass / Hold / Reject)</li>
                      <li>• Standard vs Actual Cost Variance</li>
                    </ul>
                    <div className="pt-2 text-[10px] text-purple-700 font-mono border-t border-purple-200">
                      Output: Finished Goods & GL Variances
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity Schema & Key Relations Card */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                  Katalog Entitas Utama & Kardinalitas Relasi
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 border border-slate-200 rounded-md bg-slate-50/50 space-y-1.5">
                    <div className="font-mono font-bold text-slate-800 flex items-center justify-between">
                      <span>ItemMaster (SKU)</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded">PK: id</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Pusat definisi material: Raw, WIP, FG. Memiliki relasi 1:N ke BOM, 1:N ke Routing, dan 1:N ke StockMovement.
                    </p>
                    <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      Kardinalitas: 1 Item ── N BOM (Hanya 1 aktif per tanggal)
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-md bg-slate-50/50 space-y-1.5">
                    <div className="font-mono font-bold text-slate-800 flex items-center justify-between">
                      <span>ProductionOrder (MO)</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded">PK: id</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Pesanan manufaktur yang membekukan snapshot BOM & routing aktif. Memiliki relasi 1:N ke WorkOrderOperation.
                    </p>
                    <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      Kardinalitas: 1 MO ── N Operasi Berurutan
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-md bg-slate-50/50 space-y-1.5">
                    <div className="font-mono font-bold text-slate-800 flex items-center justify-between">
                      <span>StockMovement (Ledger)</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded">PK: id</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Dokumen mutasi persediaan permanen (double-entry). Saldo stok fisik diperoleh dari agregasi mutasi ini.
                    </p>
                    <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      Prinsip: No UPDATE balance. Append-only ledger.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURATION MAP (USER-ADJUSTABLE) */}
          {archTab === 'config-map' && (
            <div className="space-y-6">
              {/* Architecture Boundary Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50/40 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-xs font-mono uppercase">
                    <Lock className="w-4 h-4" />
                    <span>Terkunci Ketat (Deterministic Core)</span>
                  </div>
                  <ul className="text-xs text-red-950 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Formula Perhitungan MRP Gross-to-Net (Page 92).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Stok dihitung dari Sum(StockMovement), dilarang edit saldo manual.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Bahan baku Hold/Reject dilarang keras ditarik ke produksi.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Pencegah diri sendiri (SoD): Pembuat PR tidak bisa approve PR-nya.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs font-mono uppercase">
                    <Sliders className="w-4 h-4" />
                    <span>Dapat Dikonfigurasi (Configurable Layer)</span>
                  </div>
                  <ul className="text-xs text-blue-950 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Ambang batas rupiah multi-tier approval PR/PO.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Custom Fields dinamis pada Item, BOM, MO, dan QC.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Waktu backflush: per operasi selesai vs saat barang jadi diterima.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Kerapatan tabel (density), urutan kolom, dan layout dashboard.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50/40 border border-purple-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-xs font-mono uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Copilot (Advisory Only)</span>
                  </div>
                  <ul className="text-xs text-purple-950 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Ekstraksi dokumen quotation supplier (OCR).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Pembuatan draf Instruksi Kerja (SOP).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Hipotesis penyebab cacat 5-Why / Ishikawa.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Wajib approval manusia sebelum disimpan ke buku besar.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Interactive Policy Controls Panel */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                      Panel Konfigurasi Kebijakan Operasional Manufaktur
                    </h3>
                    <p className="text-xs text-slate-500">
                      Parameter ini dapat disesuaikan oleh Plant Manager tanpa perlu mengubah kode backend aplikasi.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Enterprise Configuration
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Approval Matrix */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                    <div className="font-semibold text-slate-800 font-mono text-[11px] uppercase">
                      1. Matriks Approval Requisition (PR-002)
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200">
                        <span className="text-slate-600">&lt; Rp 10.000.000:</span>
                        <span className="font-mono font-medium text-slate-900">Direct Supervisor</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200">
                        <span className="text-slate-600">Rp 10M — Rp 100M:</span>
                        <span className="font-mono font-medium text-slate-900">Plant Manager</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-600">&gt; Rp 100.000.000:</span>
                        <span className="font-mono font-medium text-slate-900">Operations Director / CFO</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 bg-emerald-100/60 p-1.5 rounded font-mono">
                      ✓ Segregation of Duties (SoD) Active: Pembuat dilarang approve sendiri.
                    </div>
                  </div>

                  {/* Policy Toggles */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                    <div className="font-semibold text-slate-800 font-mono text-[11px] uppercase">
                      2. Kebijakan Eksekusi Pabrik
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-[11px]">Waktu Eksekusi Backflush:</span>
                        <select
                          value={policies.backflushTrigger}
                          onChange={(e) => setPolicies({ ...policies, backflushTrigger: e.target.value })}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono focus:outline-hidden"
                        >
                          <option value="ON_OPERATION_COMPLETED">Per Operasi Selesai</option>
                          <option value="ON_FINAL_RECEIPT">Saat Barang Jadi Masuk Gudang</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-[11px]">Wajib Kode Alasan untuk Scrap:</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                          STRICT TRUE
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-[11px]">Karantina Otomatis Barang Masuk (Dock):</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-mono font-bold rounded">
                          AUTO QUARANTINE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Field Schema Extension Demo */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 font-mono text-[11px] uppercase">
                      3. Contoh Skema Custom Field Dinamis (JSON Schema Layer)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Tidak merusak migrasi SQL</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2 bg-white border border-slate-200 rounded">
                      <div className="text-[10px] font-mono text-slate-400">ITEM MASTER</div>
                      <div className="font-semibold text-slate-800">rohsComplianceCert</div>
                      <div className="text-[10px] text-slate-500 font-mono">Type: Boolean (Required)</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded">
                      <div className="text-[10px] font-mono text-slate-400">PRODUCTION ORDER</div>
                      <div className="font-semibold text-slate-800">heatTreatmentLotNum</div>
                      <div className="text-[10px] text-slate-500 font-mono">Type: String (Alphanumeric)</div>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded">
                      <div className="text-[10px] font-mono text-slate-400">QUALITY INSPECTION</div>
                      <div className="font-semibold text-slate-800">caliperCalibrationId</div>
                      <div className="text-[10px] text-slate-500 font-mono">Type: String (UUID)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HARD INVARIANTS */}
          {archTab === 'invariants' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">The 10 Hard Domain Invariants:</span> Aturan-aturan ini merupakan fondasi
                kepatuhan matematis dan audit trail. Tidak ada pengembang, admin, atau model AI yang diizinkan memotong
                atau menonaktifkan aturan ini.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    code: 'BR-GLOBAL-001',
                    title: 'Zero Stealth Mutations',
                    desc: 'Dilarang melakukan UPDATE langsung pada saldo fisik atau keuangan persediaan. Seluruh saldo wajib diturunkan secara deterministik dari buku mutasi yang bersifat append-only.',
                  },
                  {
                    code: 'BR-GLOBAL-002',
                    title: 'Segregation of Duties (SoD)',
                    desc: 'Pengguna yang membuat atau mengajukan dokumen (PR, PO, MO, atau Scrap Write-off) dilarang secara sistem untuk menyetujui (approve) dokumen tersebut.',
                  },
                  {
                    code: 'BR-GLOBAL-003',
                    title: 'Cryptographic Event Ledger',
                    desc: 'Setiap perubahan status wajib mencatat: Timestamp presisi, User ID, IP/Terminal ID, Nilai Sebelum, Nilai Sesudah, dan Alasan (Reason Code).',
                  },
                  {
                    code: 'BR-INV-001',
                    title: 'Non-Negative Inventory',
                    desc: 'Saldo stok di gudang tidak boleh bernilai negatif dalam kondisi apa pun. Jika stok kurang, sistem wajib menolak transaksi dengan pesan INSUFFICIENT_STOCK.',
                  },
                  {
                    code: 'BR-INV-002',
                    title: 'Stock Holding Isolation',
                    desc: 'Material yang berada di dalam bucket HOLD atau REJECTED tidak dapat dialokasikan, direservasi, atau ditarik untuk Work Order produksi.',
                  },
                  {
                    code: 'BR-PROD-001',
                    title: 'BOM Snapshot Immutability',
                    desc: 'Saat Production Order dirilis (RELEASED), sistem membekukan snapshot revisi BOM dan Routing yang berlaku. Perubahan master BOM setelahnya tidak akan merusak order yang sedang berjalan.',
                  },
                  {
                    code: 'BR-PROD-002',
                    title: 'Routing Precedence Guard',
                    desc: 'Operasi N pada Work Center tidak dapat dimulai sebelum Operasi N-1 melaporkan penyelesaian parsial atau penuh dengan serah-terima unit yang valid.',
                  },
                  {
                    code: 'BR-PROD-003',
                    title: 'Mandatory Scrap Reason Codes',
                    desc: 'Setiap kali operator melaporkan unit cacat/scrap > 0 pada terminal kiosk, operator wajib memilih kode alasan terstandardisasi (misal: TOOL_WEAR, MACHINE_JAM).',
                  },
                  {
                    code: 'BR-PLAN-001',
                    title: 'Deterministic MRP Mathematics',
                    desc: 'Perhitungan kebutuhan bersih material wajib mengikuti rumus algebra: Net = Max(0, Gross - Available - ScheduledReceipts + SafetyStock). AI tidak boleh menebak kebutuhan.',
                  },
                  {
                    code: 'BR-AI-001',
                    title: 'Strict AI Advisory Boundary',
                    desc: 'Semua kapabilitas AI (OCR, SOP generator, Root-Cause defect) berstatus draft rekomendasi. Diperlukan review dan otorisasi manusia sebelum dicatat ke buku besar sistem.',
                  },
                ].map((rule) => (
                  <div key={rule.code} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700 text-[11px]">{rule.code}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        ENFORCED
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">{rule.title}</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE B: INTERACTIVE 6-STEP WORKFLOW SIMULATION                       */}
      {/* ========================================================================= */}
      {currentView === 'guide' && (
        <div className="space-y-6">
          {/* Step Selector Ribbon */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs overflow-x-auto">
            <div className="flex items-center min-w-max gap-2">
              {STEPS.map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs transition-all ${
                    activeStep === s.step
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] ${
                      activeStep === s.step ? 'bg-white text-blue-600 font-bold' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {s.step}
                  </span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <StepIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono font-semibold">
                    TAHAP 0{currentStepData.step} DARI 06
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{currentStepData.title}</h3>
                  <p className="text-xs text-slate-500">{currentStepData.subtitle}</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToNav(currentStepData.navId, currentStepData.subTab)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors self-start sm:self-auto"
              >
                <span>Buka Modul {currentStepData.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Explanation prose */}
            <div className="text-xs text-slate-700 leading-relaxed space-y-3 font-sans">
              <p className="text-sm text-slate-800 font-medium">
                {currentStepData.summary}
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
                  Aturan Bisnis & Prinsip Spesifikasi (Invariants):
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {currentStepData.rules.map((rule, idx) => (
                    <li key={idx} className="leading-normal">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next / Prev Step Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none font-medium"
              >
                ← Tahap Sebelumnya
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Langkah {activeStep} / 6</span>
              </div>

              <button
                disabled={activeStep === 6}
                onClick={() => setActiveStep((prev) => Math.min(6, prev + 1))}
                className="px-3 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                Tahap Selanjutnya →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
