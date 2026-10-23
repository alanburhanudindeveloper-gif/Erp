import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Gauge,
  ShieldCheck,
  CircleDollarSign,
  Boxes,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ProductionOrder, Product, WorkCenter, CostVarianceRecord } from '../../types';

interface ReportsViewProps {
  orders: ProductionOrder[];
  products: Product[];
  workCenters: WorkCenter[];
  costVariances: CostVarianceRecord[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  products,
  workCenters,
  costVariances,
  activeSubTab,
  onSelectSubTab,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Executive Analytics & KPI Formula Sheet</h2>
          <p className="text-xs text-slate-500">
            Formulas grounded in PDF Section 46: Plan Attainment, Yield, Scrap Rate, Schedule Adherence, OEE, and Variances.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('rep-production')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'rep-production'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Production & OEE Performance
        </button>
        <button
          onClick={() => onSelectSubTab('rep-quality')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'rep-quality'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quality & Defect Pareto
        </button>
        <button
          onClick={() => onSelectSubTab('rep-inventory')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'rep-inventory'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory Valuation & Turns
        </button>
        <button
          onClick={() => onSelectSubTab('rep-cost')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'rep-cost'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Financial Cost Variances
        </button>
      </div>

      {/* Page 115 KPI Formula Reference Card */}
      <div className="bg-slate-900 text-slate-200 rounded-lg p-5 font-mono text-xs border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-amber-400 font-bold uppercase tracking-wider">
            PDF Section 46: Standard Manufacturing KPI Formula Sheet
          </span>
          <span className="text-slate-400 text-[11px]">Strict Invariants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] font-sans">
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-white font-bold block mb-1">Plan Attainment</span>
            <code className="text-blue-400 font-mono text-xs block mb-1">Good output ÷ Planned output</code>
            <p className="text-slate-400 text-[10px]">Measures execution volume against scheduled dispatch.</p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-white font-bold block mb-1">Scrap Rate</span>
            <code className="text-rose-400 font-mono text-xs block mb-1">Scrap qty ÷ Total produced qty</code>
            <p className="text-slate-400 text-[10px]">Cost-of-poor-quality impact metric.</p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-white font-bold block mb-1">OEE (Overall Equipment Effectiveness)</span>
            <code className="text-emerald-400 font-mono text-xs block mb-1">Availability × Performance × Quality</code>
            <p className="text-slate-400 text-[10px]">Gold-standard discrete manufacturing utilization index.</p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-white font-bold block mb-1">Capacity Load %</span>
            <code className="text-amber-400 font-mono text-xs block mb-1">Required minutes ÷ Available minutes</code>
            <p className="text-slate-400 text-[10px]">Flags machine bottlenecks and overtime triggers.</p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-white font-bold block mb-1">Schedule Adherence</span>
            <code className="text-purple-400 font-mono text-xs block mb-1">On-time completed orders ÷ Due orders</code>
            <p className="text-slate-400 text-[10px]">Customer delivery punctuality rate.</p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <span className="text-white font-bold block mb-1">Cost Variance</span>
            <code className="text-emerald-400 font-mono text-xs block mb-1">Actual cost − Planned standard cost</code>
            <p className="text-slate-400 text-[10px]">Material price/usage and labor efficiency split.</p>
          </div>
        </div>
      </div>

      {/* KPI Realization Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <span className="text-xs text-slate-500">Plan Attainment (W44)</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">92.4%</div>
          <span className="text-[11px] text-emerald-700 font-semibold font-sans">1,800 / 1,948 Target</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <span className="text-xs text-slate-500">First-Pass Yield</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">98.8%</div>
          <span className="text-[11px] text-slate-400 font-sans">1.2% Scrap / Rework</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <span className="text-xs text-slate-500">Schedule Adherence</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">96.0%</div>
          <span className="text-[11px] text-slate-400 font-sans">24 of 25 Orders On-Time</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <span className="text-xs text-slate-500">Plant OEE Benchmark</span>
          <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">84.1%</div>
          <span className="text-[11px] text-slate-400 font-sans">World Class Threshold: 85%</span>
        </div>
      </div>
    </div>
  );
};
