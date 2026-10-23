import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Calculator,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Plus,
} from 'lucide-react';
import { DemandRecord, MpsRecord, Product, BillOfMaterials, MrpItemRequirement } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { runMRPCalculation } from '../../lib/calculations/mrpCalculator';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createDateColumn,
  createStatusColumn,
  createActionColumn,
} from '../../components/data-grid';

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
  const [mrpResults, setMrpResults] = useState<MrpItemRequirement[]>(() =>
    runMRPCalculation(demands, products, boms)
  );

  const handleExecuteMRP = () => {
    const res = onRunMRP();
    setMrpResults(res);
  };

  // 1. Demand Columns
  const demandColumns = useMemo<GridColumn<DemandRecord>[]>(
    () => [
      createTextColumn<DemandRecord>('demandNo', 'Demand Ref', { isCode: true, pinned: 'left', width: 140 }),
      {
        field: 'productName',
        headerName: 'Product / SKU',
        type: 'text',
        width: 220,
        renderCell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{row.productName}</div>
            <div className="text-[10px] text-slate-400 font-mono">{row.productSku}</div>
          </div>
        ),
      },
      {
        field: 'source',
        headerName: 'Source Type',
        type: 'text',
        width: 150,
        renderCell: ({ value }) => (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
              value === 'SALES_ORDER'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {value === 'SALES_ORDER' ? 'Sales Order (MTO)' : 'Forecast (MTS)'}
          </span>
        ),
      },
      createNumberColumn<DemandRecord>('quantity', 'Quantity', { uomText: 'PCS', width: 120 }),
      createDateColumn<DemandRecord>('dueDate', 'Due Date', { width: 120 }),
      {
        field: 'firmness',
        headerName: 'Firmness',
        type: 'text',
        width: 110,
        renderCell: ({ value }) => (
          <span
            className={`font-semibold text-xs ${
              value === 'FIRM' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        field: 'priority',
        headerName: 'Priority',
        type: 'status',
        width: 110,
        renderCell: ({ value }) => (
          <span
            className={`text-[11px] font-semibold ${
              value === 'HIGH' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {value}
          </span>
        ),
      },
      createStatusColumn<DemandRecord>('status', 'Status', { width: 120 }),
    ],
    []
  );

  // 2. MPS Columns
  const mpsColumns = useMemo<GridColumn<MpsRecord>[]>(
    () => [
      createTextColumn<MpsRecord>('periodBucket', 'Period Bucket', { pinned: 'left', width: 140 }),
      {
        field: 'productSku',
        headerName: 'Product SKU & Name',
        type: 'text',
        width: 220,
        renderCell: ({ row }) => (
          <div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.productSku}</div>
            <div className="text-[10px] text-slate-400">{row.productName}</div>
          </div>
        ),
      },
      createNumberColumn<MpsRecord>('forecast', 'Forecast Demand', { width: 130 }),
      createNumberColumn<MpsRecord>('firmDemand', 'Firm Orders', { width: 120 }),
      createNumberColumn<MpsRecord>('beginStock', 'Beginning Stock', { width: 130 }),
      {
        field: 'plannedProduction',
        headerName: 'Planned MPS Supply',
        type: 'number',
        width: 160,
        align: 'right',
        renderCell: ({ value }) => (
          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums">
            {value.toLocaleString()} PCS
          </span>
        ),
      },
      createNumberColumn<MpsRecord>('projectedEnding', 'Projected Ending', {
        uomText: 'PCS',
        width: 140,
        renderCell: ({ value }) => (
          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {value.toLocaleString()} PCS
          </span>
        ),
      }),
    ],
    []
  );

  // 3. MRP Columns
  const mrpColumns = useMemo<GridColumn<MrpItemRequirement>[]>(
    () => [
      createTextColumn<MrpItemRequirement>('sku', 'Item SKU', { isCode: true, pinned: 'left', width: 140 }),
      createTextColumn<MrpItemRequirement>('name', 'Item Description', { width: 220 }),
      createStatusColumn<MrpItemRequirement>('type', 'Item Type', { width: 130 }),
      createNumberColumn<MrpItemRequirement>('grossRequirement', 'Gross Req', { width: 110 }),
      createNumberColumn<MrpItemRequirement>('onHandStock', 'On-Hand', { width: 100 }),
      createNumberColumn<MrpItemRequirement>('scheduledReceipts', 'Scheduled Rcpt', { width: 120 }),
      createNumberColumn<MrpItemRequirement>('safetyStock', 'Safety Buffer', { width: 110 }),
      {
        field: 'netRequirement',
        headerName: 'Net Requirement',
        type: 'number',
        width: 140,
        align: 'right',
        renderCell: ({ value }) => (
          <span
            className={`font-mono font-bold tabular-nums ${
              value > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {value.toLocaleString()}
          </span>
        ),
      },
      createTextColumn<MrpItemRequirement>('peggingSource', 'Pegging Source', { width: 160 }),
      createActionColumn<MrpItemRequirement>(
        ({ row }) => {
          if (row.actionRequired === 'CREATE_PURCHASE_ORDER') {
            return (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                Create PO ({row.netRequirement})
              </span>
            );
          }
          if (row.actionRequired === 'CREATE_PRODUCTION_ORDER') {
            return (
              <button
                onClick={() =>
                  onCreateOrder({
                    productId: row.productId,
                    quantity: row.netRequirement,
                    dueDate: '2026-11-15',
                  })
                }
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors"
              >
                Create MO ({row.netRequirement})
              </button>
            );
          }
          return (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Stock Sufficient</span>
            </span>
          );
        },
        { width: 160, headerName: 'Action Required' }
      ),
    ],
    [onCreateOrder]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Planning & Scheduling (PPIC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Demand intake, Master Production Schedule (MPS), and multi-level MRP calculation engine.
          </p>
        </div>

        {activeSubTab === 'mrp' && (
          <button
            onClick={handleExecuteMRP}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Run MRP Explosion</span>
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('demand')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'demand'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Demand Management ({demands.length})
        </button>
        <button
          onClick={() => onSelectSubTab('mps')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'mps'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Master Production Schedule (MPS)
        </button>
        <button
          onClick={() => onSelectSubTab('mrp')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'mrp'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          MRP Calculation Engine (Page 92 Spec)
        </button>
      </div>

      {/* 1. Demand Tab */}
      {activeSubTab === 'demand' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Customer Orders (MTO) & Forecast Demand (MTS)
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Source input into MPS and MRP explosion
            </span>
          </div>

          <EnterpriseDataGrid<DemandRecord>
            data={demands}
            columns={demandColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="demand_intake_schedule"
            density="compact"
          />
        </div>
      )}

      {/* 2. MPS Tab */}
      {activeSubTab === 'mps' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Master Production Schedule Time Buckets
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Converts demand into periodic production quantities
            </span>
          </div>

          <EnterpriseDataGrid<MpsRecord>
            data={mpsRecords}
            columns={mpsColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="master_production_schedule"
            density="compact"
          />
        </div>
      )}

      {/* 3. MRP Engine Tab */}
      {activeSubTab === 'mrp' && (
        <div className="space-y-4">
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

          <div className="space-y-2">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Exploded Material Requirements & Action Signals
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {mrpResults.length} items evaluated across active BOMs
              </span>
            </div>

            <EnterpriseDataGrid<MrpItemRequirement>
              keyField="productId"
              data={mrpResults}
              columns={mrpColumns}
              pagination
              searchable
              filtering
              sorting
              columnResizing
              exportable
              exportFileName="mrp_explosion_requirements"
              density="compact"
            />
          </div>
        </div>
      )}
    </div>
  );
};
