import React, { useState } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  ArrowRight,
  Layers,
  PieChart,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CostVarianceRecord, Product, BillOfMaterials, Routing } from '../../types';
import { calculateStandardCost } from '../../lib/calculations/costCalculator';

interface CostingViewProps {
  costVariances: CostVarianceRecord[];
  products: Product[];
  boms: BillOfMaterials[];
  routings: Routing[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
}

export const CostingView: React.FC<CostingViewProps> = ({
  costVariances,
  products,
  boms,
  routings,
  activeSubTab,
  onSelectSubTab,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const activeProd = products.find((p) => p.id === selectedProduct) || products[0];
  const activeBom = boms.find((b) => b.productId === activeProd?.id);
  const activeRouting = routings.find((r) => r.productId === activeProd?.id);

  const stdCost = calculateStandardCost(activeBom, activeRouting);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Product Costing & Variance Analysis</h2>
          <p className="text-xs text-slate-500">
            Standard cost rollups (material, labor, machine overhead) vs actual manufacturing orders settlement.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('product-cost')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'product-cost'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Product Standard Cost Rollup
        </button>
        <button
          onClick={() => onSelectSubTab('production-cost')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'production-cost'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Production Order Actual Cost
        </button>
        <button
          onClick={() => onSelectSubTab('variance')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'variance'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Variance Analysis (Page 100 Spec)
        </button>
      </div>

      {/* 1. Standard Cost Rollup Tab */}
      {activeSubTab === 'product-cost' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Select Item to Inspect Standard Cost:</span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="text-xs border border-slate-300 rounded px-3 py-1.5 focus:outline-none font-semibold text-slate-800"
            >
              {products
                .filter((p) => p.type !== 'RAW_MATERIAL')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">Direct Material Cost</span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                ${stdCost.materialCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400">Sum of exploded BOM lines</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">Direct Labor Cost</span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                ${stdCost.laborCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400">Routing cycle time × labor rate</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">Machine Overhead</span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                ${stdCost.overheadCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400">Work Center rate allocation</span>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-lg space-y-1">
              <span className="text-slate-400 text-xs">Total Standard Unit Cost</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                ${stdCost.totalCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400">Frozen baseline standard</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Production Actual Cost & 3. Variance Analysis (Page 100) */}
      {(activeSubTab === 'production-cost' || activeSubTab === 'variance') && (
        <div className="space-y-4">
          {/* Page 100 Costing Callout */}
          <div className="bg-slate-900 text-slate-200 rounded-lg p-5 space-y-3 font-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider">
                PDF Section 31: Costing Example Blueprint Case Study
              </span>
              <span className="text-slate-400 text-[11px]">Formula Verification</span>
            </div>

            <div className="text-slate-300 font-sans leading-relaxed text-xs">
              <p>
                <strong>Exact PDF Specification:</strong>
              </p>
              <div className="mt-2 p-3 bg-slate-950 rounded border border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual Material</span>
                  <span className="text-white font-bold">$4,500</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual Labor</span>
                  <span className="text-white font-bold">$800</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual Machine</span>
                  <span className="text-white font-bold">$600</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual Overhead</span>
                  <span className="text-white font-bold">$300</span>
                </div>
                <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                  <span className="text-slate-400 block text-[10px]">Total Actual</span>
                  <span className="text-emerald-400 font-bold text-sm">$6,200</span>
                </div>
              </div>
              <div className="mt-2 text-slate-400 text-[11px] font-mono">
                Planned: $5,900 · Actual: $6,200 · Variance: <strong className="text-rose-400">+$300 (Unfavorable)</strong>. Drill-down identifies component material price difference on Material Y.
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Product SKU</th>
                  <th className="py-2.5 px-4 text-right">Planned Material</th>
                  <th className="py-2.5 px-4 text-right">Actual Material</th>
                  <th className="py-2.5 px-4 text-right">Labor Cost</th>
                  <th className="py-2.5 px-4 text-right">Machine Cost</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900">Total Planned</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900">Total Actual</th>
                  <th className="py-2.5 px-4 text-right font-bold">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {costVariances.map((c) => (
                  <tr key={c.orderNumber} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-blue-600">{c.orderNumber}</td>
                    <td className="py-3 px-4 text-slate-800 font-sans font-semibold">{c.productSku}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">${c.plannedMaterialCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">${c.actualMaterialCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">${c.actualLaborCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">${c.actualMachineCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-800">${c.totalPlannedCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">${c.totalActualCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-rose-700 bg-rose-50/30">
                      +${c.varianceAmount.toLocaleString()} ({c.variancePercentage}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
