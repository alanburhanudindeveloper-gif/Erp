import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  Database,
  CalendarRange,
  Factory,
  Boxes,
  ShieldCheck,
  CircleDollarSign,
  ChevronRight,
} from 'lucide-react';

interface ManufacturingWorkflowGuideProps {
  onNavigateToNav: (navId: any, subTab?: string) => void;
  onResetDemo: () => void;
}

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
    summary: 'QC melakukan sampling inspeksi (Page 98: sample 100, 4 defect). Lot di-disposisi (Hold / Rework / Release). Setelah semua operasi tuntas, biaya aktual dibandingkan dengan standar biaya terencana.',
    rules: [
      'Costing Example Page 100: Material aktual $4,500 + Tenaga Kerja $800 + Mesin $600 + Overhead $300 = $6,200 (Varians +$300 dibanding rencana $5,900).',
      'Rework Order (Page 104) menambah biaya aktual produksi dan mewajibkan inspeksi ulang.',
      'Setelah semua biaya terselesaikan, Production Order di-CLOSE.',
    ],
  },
];

export const ManufacturingWorkflowGuide: React.FC<ManufacturingWorkflowGuideProps> = ({
  onNavigateToNav,
  onResetDemo,
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const currentStepData = STEPS.find((s) => s.step === activeStep) || STEPS[0];
  const StepIcon = currentStepData.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>Panduan Lengkap Arsitektur & Alur Bisnis Manufaktur ERP</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          Mental Model & Value Chain Manufaktur (Berdasarkan PDF Blueprint)
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-sans">
          Aplikasi ini sengaja dirancang bukan sekadar dashboard CRUD, melainkan mengimplementasikan prinsip-prinsip enterprise discrete manufacturing: pemisahan planning vs execution vs accounting, immutable inventory ledger, multi-level MRP, work order dependencies, downtime machine tracking, dan two-way lot traceability.
        </p>

        {/* Quick Stepper Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3">
          {STEPS.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-2.5 rounded text-left transition-colors font-mono text-xs ${
                activeStep === s.step
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div className="text-[10px] text-slate-300 font-sans">Tahap 0{s.step}</div>
              <div className="truncate font-semibold mt-0.5">{s.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Deep-Dive Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-xs">
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
              Aturan Bisnis & Prinsip Spesifikasi (PDF Invariants):
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
  );
};
