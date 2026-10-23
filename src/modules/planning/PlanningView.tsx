import React, { useState } from 'react';
import {
  CalendarRange,
  Calculator,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  Filter,
} from 'lucide-react';
import { DemandRecord, MpsRecord, Product, BillOfMaterials, MrpItemRequirement } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { runMRPCalculation } from '../../lib/calculations/mrpCalculator';

interface PlanningViewProps {
  demands: DemandRecord[];
  mpsRecords: MpsRecord[];
  products: Product[];
  boms: BillOfMaterials[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
  onRunMRP: () => MrpItemRequirement[];
  onCreateOrder: (data: { productId: string; quantity: number; dueDate: string }) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  demands,
  mpsRecords,
  products,
  boms,
  activeSubTab,
  onSelectSubTab,
  onRunMRP,
  onCreateOrder,
}) => {
  // Use pure calculation function for initial state to avoid updating parent state during render
  const [mrpResults, setMrpResults] = useState<MrpItemRequirement[]>(() =>
    runMRPCalculation(demands, products, boms)
  );
  const [hasRun, setHasRun] = useState(false);

  const handleExecuteMRP = () => {
    const res = onRunMRP();
    setMrpResults(res);
    setHasRun(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Planning & Scheduling (PPIC)</h2>
          <p className="text-xs text-slate-500">
            Demand intake, Master Production Schedule (MPS), and multi-level MRP calculation engine.
          </p>
        </div>

        {activeSubTab === 'mrp' && (
          <button
            onClick={handleExecuteMRP}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Run MRP Explosion</span>
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('demand')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'demand'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Demand Management ({demands.length})
        </button>
        <button
          onClick={() => onSelectSubTab('mps')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'mps'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Master Production Schedule (MPS)
        </button>
        <button
          onClick={() => onSelectSubTab('mrp')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'mrp'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          MRP Calculation Engine (Page 92 Spec)
        </button>
      </div>

      {/* 1. Demand Tab */}
      {activeSubTab === 'demand' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Customer Orders (MTO) & Forecast Demand (MTS)</span>
            <span className="text-slate-500">Source input into MPS and MRP explosion</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Demand Ref</th>
                <th className="py-2.5 px-4">Product / SKU</th>
                <th className="py-2.5 px-4">Source Type</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Firmness</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {demands.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{d.demandNo}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-slate-800">{d.productName}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">{d.productSku}</span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                      d.source === 'SALES_ORDER' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {d.source === 'SALES_ORDER' ? 'Sales Order (MTO)' : 'Forecast (MTS)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-900 font-semibold">
                    {d.quantity.toLocaleString()} PCS
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-sans">{d.dueDate}</td>
                  <td className="py-3 px-4 font-sans text-xs">
                    <span className={d.firmness === 'FIRM' ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      {d.firmness}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[11px] font-semibold ${
                      d.priority === 'HIGH' ? 'text-rose-700' : 'text-slate-600'
                    }`}>
                      {d.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. MPS Tab */}
      {activeSubTab === 'mps' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Master Production Schedule Time Buckets</span>
            <span className="text-slate-500">Converts demand into periodic production quantities</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Period Bucket</th>
                <th className="py-2.5 px-4">Product SKU</th>
                <th className="py-2.5 px-4 text-right">Forecast Demand</th>
                <th className="py-2.5 px-4 text-right">Firm Orders</th>
                <th className="py-2.5 px-4 text-right">Beginning Stock</th>
                <th className="py-2.5 px-4 text-right font-bold text-slate-900">Planned MPS Supply</th>
                <th className="py-2.5 px-4 text-right">Projected Ending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {mpsRecords.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">{m.periodBucket}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800">{m.productSku}</span>
                    <span className="text-[11px] text-slate-400 block font-sans">{m.productName}</span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">{m.forecast}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">{m.firmDemand}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">{m.beginStock}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-blue-700 bg-blue-50/30">
                    {m.plannedProduction.toLocaleString()} PCS
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-700 font-semibold">
                    {m.projectedEnding.toLocaleString()} PCS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. MRP Engine Tab (with Page 92 Walkthrough Banner) */}
      {activeSubTab === 'mrp' && (
        <div className="space-y-4">
          {/* Page 92 Walkthrough Interactive Card */}
          <div className="bg-slate-900 text-slate-200 rounded-lg p-5 space-y-3 font-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                PDF Section 23: MRP Calculation Blueprint Walkthrough
              </span>
              <span className="text-slate-400 text-[11px]">Formula Verification</span>
            </div>

            <div className="text-slate-300 leading-relaxed font-sans text-xs">
              <p>
                <strong>Scenario:</strong> Product A demand 1,000. BOM requires <code>Material X = 2/unit</code> and <code>Material Y = 3/unit</code>.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="text-blue-400 font-bold">Material X Calculation:</div>
                  <div>Gross Req = 1,000 × 2 = 2,000 KG</div>
                  <div>On-hand = 1,400 KG · Scheduled Receipts = 300 KG · Safety = 100 KG</div>
                  <div className="text-amber-300 font-bold pt-1 border-t border-slate-800">
                    Net X = 2,000 + 100 - 1,400 - 300 = 400 KG
                  </div>
                  <div className="text-[10px] text-slate-400">Action: Create Planned Purchase Order for 400 KG</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">Material Y Calculation:</div>
                  <div>Gross Req = 1,000 × 3 = 3,000 MTR</div>
                  <div>On-hand = 3,200 MTR · Scheduled Receipts = 1,000 MTR · Safety = 800 MTR</div>
                  <div className="text-emerald-300 font-bold pt-1 border-t border-slate-800">
                    Net Y = max(0, 3,000 + 800 - 3,200 - 1,000) = 0 MTR
                  </div>
                  <div className="text-[10px] text-emerald-400">Action: Stock is Sufficient (No PO needed)</div>
                </div>
              </div>
            </div>
          </div>

          {/* MRP Output Results Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Exploded Material Requirements & Action Signals</span>
              <span className="text-slate-500">{mrpResults.length} items evaluated across active BOMs</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Item SKU & Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Gross Req</th>
                  <th className="py-2.5 px-4 text-right">On-Hand</th>
                  <th className="py-2.5 px-4 text-right">Scheduled Rcpt</th>
                  <th className="py-2.5 px-4 text-right">Safety Stock</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900">Net Requirement</th>
                  <th className="py-2.5 px-4">Pegging Source</th>
                  <th className="py-2.5 px-4">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {mrpResults.map((r) => (
                  <tr key={r.productId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-sans">
                      <span className="font-mono font-bold text-slate-900 block">{r.sku}</span>
                      <span className="text-[11px] text-slate-500">{r.name}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-[11px] text-slate-600">
                      {r.type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800">{r.grossRequirement}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">{r.onHandStock}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">{r.scheduledReceipts}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">{r.safetyStock}</td>
                    <td className={`py-3 px-4 text-right tabular-nums font-bold ${
                      r.netRequirement > 0 ? 'text-rose-700 bg-rose-50/30' : 'text-emerald-700'
                    }`}>
                      {r.netRequirement}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-500 truncate max-w-xs">
                      {r.peggingSource}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {r.actionRequired === 'CREATE_PURCHASE_ORDER' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Create PO ({r.netRequirement})
                        </span>
                      )}
                      {r.actionRequired === 'CREATE_PRODUCTION_ORDER' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Create MO ({r.netRequirement})
                        </span>
                      )}
                      {r.actionRequired === 'STOCK_SUFFICIENT' && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stock Sufficient</span>
                        </span>
                      )}
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
