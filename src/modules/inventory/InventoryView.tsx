import React, { useState } from 'react';
import {
  Boxes,
  Layers,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  GitCommit,
  GitBranch,
  Sparkles,
  FileText,
  Upload,
} from 'lucide-react';
import { Product, StockMovement, ProductionOrder } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AiDocumentExtractorModal } from '../../components/ai/AiDocumentExtractorModal';

interface InventoryViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  orders: ProductionOrder[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockMovements,
  orders,
  activeSubTab,
  onSelectSubTab,
}) => {
  const [traceLotQuery, setTraceLotQuery] = useState('LOT-X-L100');
  const [traceResult, setTraceResult] = useState<any>(null);

  const handleTrace = (lotQuery: string) => {
    const q = lotQuery.trim().toUpperCase();
    if (!q) return;

    // Check if raw lot or FG lot
    const isFg = q.includes('F200') || q.includes('FG');

    if (isFg) {
      // Forward Trace (From FG Lot -> MO -> Components, Operators, Machines, QC)
      setTraceResult({
        type: 'FORWARD',
        targetLot: q,
        item: 'Product A (LOT-FG-F200)',
        sourceMo: 'MO-2026-00124',
        producedDate: '2026-10-22 11:30',
        inspectedBy: 'Hendra Gunawan (Lead QC)',
        qcResult: 'PASSED with Concession (QC-2026-0419)',
        consumedComponents: [
          { sku: 'Material X', lot: 'LOT-X-L100', qty: '2,000 KG', location: 'WH-RAW-STAGING' },
          { sku: 'Material Y', lot: 'LOT-Y-L101', qty: '1,800 MTR', location: 'WH-RAW-WIRE-RACK' },
          { sku: 'Material Z', lot: 'LOT-Z-L088', qty: '600 PCS', location: 'WH-RAW-SHELL' },
        ],
        operationsHistory: [
          { op: '01 Cutting & Machining', wc: 'WC-CUT-01', operator: 'Budi Santoso', status: 'Completed' },
          { op: '02 Assembly & Wiring', wc: 'WC-ASSY-02', operator: 'Agus Pratama', status: 'Completed' },
        ],
      });
    } else {
      // Reverse Trace (From Raw Material Lot -> MO -> FG Lot)
      setTraceResult({
        type: 'REVERSE',
        targetLot: q,
        item: 'Material X (Extruded Aluminum Billet 6061-T6)',
        receivedDate: '2026-10-15',
        supplierPo: 'PO-2026-4402 (Alcoa Industrial Metals)',
        consumedInOrders: [
          {
            moNumber: 'MO-2026-00124',
            product: 'Product A',
            consumedQty: '2,000 KG',
            date: '2026-10-20',
            resultingFgLot: 'LOT-FG-F200',
            warehouseDestination: 'WH-FG-BAY-A1',
          },
        ],
      });
    }
  };

  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractedDrafts, setExtractedDrafts] = useState<any[]>([
    {
      id: 'draft-po-01',
      vendor: 'PT Steel Indo Perkasa',
      docNo: 'PO-EXT-2026-9921',
      itemsCount: 2,
      totalAmount: 73450000,
      currency: 'IDR',
      status: 'DRAFT_PENDING_APPROVAL',
      extractedAt: '2026-10-21 14:20',
      discrepancy: 'Unit price 2.7% below catalog rate',
    },
    {
      id: 'draft-po-02',
      vendor: 'PT Global Komponen Presisi',
      docNo: 'DN-2026-4402',
      itemsCount: 2,
      totalAmount: 6500000,
      currency: 'IDR',
      status: 'APPROVED_AND_POSTED',
      extractedAt: '2026-10-22 09:15',
      discrepancy: null,
    },
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Inventory & Inbound Material Ledger</h2>
          <p className="text-xs text-slate-500">
            Real-time material availability, hard reservations, immutable stock movements, and AI document ingestion (Section 9.1).
          </p>
        </div>

        {/* Section 11 Button: 'Extract with AI' pada document upload */}
        <button
          onClick={() => setShowExtractModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors self-start sm:self-auto shadow-xs"
          title="Extract supplier document to structured transaction draft (Section 9.1)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Extract with AI</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('material-availability')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'material-availability'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Material Availability & ATP
        </button>
        <button
          onClick={() => onSelectSubTab('reservations')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reservations'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hard Stock Reservations
        </button>
        <button
          onClick={() => onSelectSubTab('material-consumption')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'material-consumption'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Immutable Movement Ledger (Page 99)
        </button>
        <button
          onClick={() => onSelectSubTab('finished-goods')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'finished-goods'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Two-Way Lot Traceability (Page 103)
        </button>
        <button
          onClick={() => onSelectSubTab('doc-extraction')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'doc-extraction'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Document Inbound & Extraction (Section 9.1 P0)</span>
        </button>
      </div>

      {/* 1. Material Availability Tab */}
      {activeSubTab === 'material-availability' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Available-To-Promise (ATP) Material Status</span>
            <span className="text-slate-500">Available = On-Hand minus Hard Reservations</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Item SKU & Name</th>
                <th className="py-2.5 px-4 text-right">Physical On-Hand</th>
                <th className="py-2.5 px-4 text-right">Allocated / Reserved</th>
                <th className="py-2.5 px-4 text-right font-bold text-slate-900">Available to Promise</th>
                <th className="py-2.5 px-4 text-right">Safety Buffer</th>
                <th className="py-2.5 px-4">Buffer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {products.map((p) => {
                const atp = Math.max(0, p.currentStock - p.allocatedStock);
                const isShort = atp < p.safetyStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-sans">
                      <span className="font-mono font-bold text-slate-900 block">{p.sku}</span>
                      <span className="text-[11px] text-slate-500">{p.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800 font-semibold">
                      {p.currentStock.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {p.allocatedStock.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-700 bg-emerald-50/20">
                      {atp.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                      {p.safetyStock.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {isShort ? (
                        <span className="text-rose-700 font-semibold text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Below Safety Stock</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Buffer Healthy</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Reservations Tab */}
      {activeSubTab === 'reservations' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Hard Material Reservations (Tied to Released MOs)</span>
            <span className="text-slate-500">Prevents double-allocation across competing shop orders</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Reservation #</th>
                <th className="py-2.5 px-4">Production Order</th>
                <th className="py-2.5 px-4">Material SKU</th>
                <th className="py-2.5 px-4 text-right">Reserved Qty</th>
                <th className="py-2.5 px-4">Staging Location</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-900">RES-2026-0081</td>
                <td className="py-3 px-4 text-blue-600 font-semibold">MO-2026-00124</td>
                <td className="py-3 px-4 font-sans text-slate-800">Material X (Aluminum Billet)</td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">2,000 KG</td>
                <td className="py-3 px-4 text-slate-600 font-sans">WH-RAW-STAGING</td>
                <td className="py-3 px-4 font-sans"><StatusBadge status="ACTIVE" /></td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-900">RES-2026-0082</td>
                <td className="py-3 px-4 text-blue-600 font-semibold">MO-2026-00124</td>
                <td className="py-3 px-4 font-sans text-slate-800">Material Y (Copper Wire)</td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-amber-700">2,700 MTR (Deficit 300)</td>
                <td className="py-3 px-4 text-slate-600 font-sans">WH-RAW-WIRE-RACK</td>
                <td className="py-3 px-4 font-sans"><StatusBadge status="ACTIVE" /></td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-900">RES-2026-0083</td>
                <td className="py-3 px-4 text-blue-600 font-semibold">MO-2026-00124</td>
                <td className="py-3 px-4 font-sans text-slate-800">Material Z (Housing Shell)</td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">1,000 PCS</td>
                <td className="py-3 px-4 text-slate-600 font-sans">WH-RAW-SHELL</td>
                <td className="py-3 px-4 font-sans"><StatusBadge status="ACTIVE" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Immutable Stock Movements Ledger (Page 99) */}
      {activeSubTab === 'material-consumption' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold block">PDF Section 30: Immutable Inventory Ledger Contract</span>
              <span className="text-slate-400 text-[11px]">
                No direct stock modification. All stock balances are derived strictly from posted material documents. Reversals create compensating entries.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Immutable
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Document #</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Item SKU</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4">From Location</th>
                  <th className="py-2.5 px-4">To Location</th>
                  <th className="py-2.5 px-4">Lot / Batch #</th>
                  <th className="py-2.5 px-4">Source Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{mov.movementNo}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">{mov.timestamp}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">{mov.sku}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        mov.movementType === 'GR_PRODUCTION'
                          ? 'bg-emerald-50 text-emerald-700'
                          : mov.movementType === 'SCRAP'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {mov.movementType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                      {mov.quantity.toLocaleString()} {mov.uom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">{mov.fromLocation}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans">{mov.toLocation}</td>
                    <td className="py-3 px-4 text-slate-800 font-bold">{mov.lotNumber}</td>
                    <td className="py-3 px-4 text-blue-600 font-semibold">{mov.sourceDocument}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Two-Way Lot Traceability (Page 103) */}
      {activeSubTab === 'finished-goods' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Two-Way Lot & Serial Traceability (Page 103)</h3>
              <p className="text-xs text-slate-500">
                Execute forward trace from finished good lot to component sources, or reverse trace from raw lot to customer MOs.
              </p>
            </div>

            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter Lot Number (e.g. LOT-X-L100 or LOT-FG-F200)..."
                value={traceLotQuery}
                onChange={(e) => setTraceLotQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none"
              />
              <button
                onClick={() => handleTrace(traceLotQuery)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
              >
                Inspect Genealogy
              </button>
            </div>
          </div>

          {/* Traceability Result Diagram */}
          {traceResult && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 font-mono text-xs space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {traceResult.type === 'FORWARD' ? 'FORWARD TRACE (FG → Components)' : 'REVERSE TRACE (Raw Lot → MO & FG)'}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{traceResult.targetLot}</span>
                </div>
                <span className="text-slate-500 font-sans text-xs">{traceResult.item}</span>
              </div>

              {traceResult.type === 'FORWARD' ? (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-3 gap-3 font-mono text-xs p-3 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Production Order</span>
                      <strong className="text-blue-700">{traceResult.sourceMo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Produced Timestamp</span>
                      <strong className="text-slate-800">{traceResult.producedDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">QC Disposition</span>
                      <strong className="text-emerald-700">{traceResult.qcResult}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1">
                      Raw Material Lots Consumed:
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded font-mono text-xs">
                      {traceResult.consumedComponents.map((c: any) => (
                        <div key={c.lot} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-semibold text-slate-800">{c.sku}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-blue-600 font-bold">{c.lot}</span>
                          </div>
                          <span className="text-slate-600">{c.qty} from {c.location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs p-3 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Receipt Date</span>
                      <strong className="text-slate-800">{traceResult.receivedDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Supplier Purchase Order</span>
                      <strong className="text-blue-700">{traceResult.supplierPo}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1">
                      Downstream Production Orders Consumed In:
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded font-mono text-xs">
                      {traceResult.consumedInOrders.map((o: any) => (
                        <div key={o.moNumber} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-blue-700">{o.moNumber}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-slate-800">{o.product}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span>Consumed {o.consumedQty}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold block">{o.resultingFgLot}</span>
                            <span className="text-[11px] text-slate-400">{o.warehouseDestination}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Document Inbound & AI Extraction Tab (Section 9.1 P0) */}
      {activeSubTab === 'doc-extraction' && (
        <div className="space-y-4">
          {/* Blueprint Banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  Section 9.1 Invariant
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Document → Structured Extraction → Schema Validation → Draft Transaction
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Upload supplier quotations, purchase orders, or delivery notes. AI parses line items and detects catalog discrepancies without directly mutating official stock ledgers.
              </p>
            </div>

            <button
              onClick={() => setShowExtractModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shrink-0 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Upload & Extract with AI</span>
            </button>
          </div>

          {/* Extracted Draft Transactions Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Extracted Inbound Document Drafts ({extractedDrafts.length})</span>
              <span className="text-slate-400 font-normal">Requires human approval before ledger posting</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Document Ref</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4 text-center">Items</th>
                  <th className="py-2.5 px-4 text-right">Total Valuation</th>
                  <th className="py-2.5 px-4">Discrepancy Check</th>
                  <th className="py-2.5 px-4">Extraction Time</th>
                  <th className="py-2.5 px-4 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {extractedDrafts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.docNo}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">{d.vendor}</td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-700">{d.itemsCount} lines</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {d.currency} {d.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs">
                      {d.discrepancy ? (
                        <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠ {d.discrepancy}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">✓ Zero Variance</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{d.extractedAt}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        d.status === 'APPROVED_AND_POSTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status === 'APPROVED_AND_POSTED' ? 'Approved & Posted' : 'Draft · Pending Approval'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Document Extractor Modal (Section 9.1) */}
      <AiDocumentExtractorModal
        isOpen={showExtractModal}
        onClose={() => setShowExtractModal(false)}
        onPostDraftPo={(extracted) => {
          setExtractedDrafts((prev) => [
            {
              id: `draft-${Date.now()}`,
              vendor: extracted.vendorName,
              docNo: extracted.documentNumber,
              itemsCount: extracted.lineItems.length,
              totalAmount: extracted.totalAmount,
              currency: extracted.currency,
              status: 'APPROVED_AND_POSTED',
              extractedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              discrepancy: extracted.discrepanciesDetected[0] || null,
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
};
