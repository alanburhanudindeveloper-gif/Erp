import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  CheckSquare,
  FileText,
  Boxes,
  PlusCircle,
  Archive,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductionOrder, ReasonCode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface ProductionOrderDetailProps {
  order: ProductionOrder;
  onBack: () => void;
  onReleaseOrder: (orderId: string) => void;
  onStartOperation: (orderId: string, seq: number, operator: string) => void;
  onReportOutput: (
    orderId: string,
    seq: number,
    goodQty: number,
    scrapQty: number,
    reasonCode: string | undefined,
    operator: string,
    notes?: string
  ) => void;
  onCompleteOperation: (orderId: string, seq: number) => void;
  onCloseOrder: (orderId: string) => void;
  reasonCodes: ReasonCode[];
}

export const ProductionOrderDetail: React.FC<ProductionOrderDetailProps> = ({
  order,
  onBack,
  onReleaseOrder,
  onStartOperation,
  onReportOutput,
  onCompleteOperation,
  onCloseOrder,
  reasonCodes,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'operations' | 'materials' | 'output' | 'costing'>('card');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedOpSeq, setSelectedOpSeq] = useState<number>(
    order.operations.find(o => o.status === 'IN_PROGRESS' || o.status === 'READY')?.sequence || 10
  );
  const [goodQtyInput, setGoodQtyInput] = useState<number>(50);
  const [scrapQtyInput, setScrapQtyInput] = useState<number>(0);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('SCRAP-DIM');
  const [operatorInput, setOperatorInput] = useState<string>('Budi Santoso');
  const [notesInput, setNotesInput] = useState<string>('');

  const remainingQty = Math.max(0, order.targetQuantity - order.goodQuantity - order.scrapQuantity);

  const handleSubmitOutput = (e: React.FormEvent) => {
    e.preventDefault();
    onReportOutput(
      order.id,
      selectedOpSeq,
      Number(goodQtyInput),
      Number(scrapQtyInput),
      scrapQtyInput > 0 ? selectedReasonCode : undefined,
      operatorInput,
      notesInput
    );
    setShowLogModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Back button & Action controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Production Orders</span>
        </button>

        {/* Action Buttons based on order lifecycle */}
        <div className="flex items-center gap-2">
          {order.status === 'PLANNED' && (
            <button
              onClick={() => onReleaseOrder(order.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Release Production Order</span>
            </button>
          )}

          {(order.status === 'RELEASED' || order.status === 'IN_PROGRESS') && (
            <button
              onClick={() => setShowLogModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Production Output & Scrap</span>
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <button
              onClick={() => onCloseOrder(order.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Close MO & Post to Finished Goods</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('card')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'card'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Blueprint View
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'operations'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Operations & Work Orders ({order.operations.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'materials'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Materials & Availability ({order.materials.length})
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'output'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Output & Scrap Logs ({order.outputLogs.length})
        </button>
      </div>

      {/* Blueprint Layout Tab */}
      {activeTab === 'card' && (
        <div className="max-w-3xl bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-xs text-xs space-y-6 min-w-0">
          {/* Header block */}
          <div className="border-b border-slate-200 pb-4">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              PRODUCTION ORDER
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-slate-900">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>

            {/* Metadata 2-column key-values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 text-xs">
              <div className="flex items-center">
                <span className="w-28 text-slate-400">Product</span>
                <span className="font-semibold text-slate-800 truncate">{order.productName}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-400">Quantity</span>
                <span className="font-semibold text-slate-800 tabular-nums">{order.targetQuantity.toLocaleString()} PCS</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-400">Due Date</span>
                <span className="font-medium text-slate-800">{order.dueDate}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-400">Plant</span>
                <span className="text-slate-700">{order.plantName}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-400">BOM</span>
                <span className="text-slate-700 font-mono text-[11px]">{order.bomCode} {order.bomRevision}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-400">Routing</span>
                <span className="text-slate-700 font-mono text-[11px]">{order.routingCode} {order.routingRevision}</span>
              </div>
            </div>

            {/* Material Availability Banner */}
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-600 font-medium">Material Availability:</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-200 h-2 rounded overflow-hidden">
                  <div
                    className={`h-full ${order.materialAvailabilityPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${order.materialAvailabilityPct}%` }}
                  />
                </div>
                <span className={`font-bold tabular-nums ${order.materialAvailabilityPct === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {order.materialAvailabilityPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Section: Operations */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              OPERATIONS
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded">
              {order.operations.map((op) => (
                <div key={op.id} className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">{op.operationCode}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-[11px]">{op.workCenterCode}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-slate-600">
                      {op.completedQty.toLocaleString()} / {op.targetQty.toLocaleString()}
                    </span>
                    <StatusBadge status={op.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Materials */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              MATERIALS
            </div>
            <div className="border border-slate-100 rounded divide-y divide-slate-100">
              <div className="grid grid-cols-12 py-1.5 px-3 bg-slate-50 text-[11px] text-slate-400 font-semibold">
                <span className="col-span-5">Item</span>
                <span className="col-span-3 text-right">Required</span>
                <span className="col-span-3 text-right">Allocated</span>
                <span className="col-span-1 text-center">Status</span>
              </div>
              {order.materials.map((mat) => (
                <div key={mat.productId} className="grid grid-cols-12 py-2 px-3 items-center hover:bg-slate-50">
                  <div className="col-span-5 truncate">
                    <span className="font-semibold text-slate-800">{mat.sku}</span>
                    <div className="text-[10px] text-slate-400 truncate">{mat.name}</div>
                  </div>
                  <span className="col-span-3 text-right tabular-nums text-slate-700">
                    {mat.requiredQty.toLocaleString()} {mat.uom}
                  </span>
                  <span className="col-span-3 text-right tabular-nums text-slate-700">
                    {mat.allocatedQty.toLocaleString()} {mat.uom}
                  </span>
                  <span className="col-span-1 text-center">
                    {mat.status === 'SUFFICIENT' ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-amber-600 font-bold">⚠</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Output */}
          <div className="border-t border-slate-200 pt-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              OUTPUT SUMMARY
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded text-center">
                <div className="text-[11px] text-emerald-800 font-medium">Good Output</div>
                <div className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
                  {order.goodQuantity.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Ready for Next Op / FG</div>
              </div>
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded text-center">
                <div className="text-[11px] text-rose-800 font-medium">Scrap</div>
                <div className="text-xl font-bold text-rose-700 tabular-nums mt-1">
                  {order.scrapQuantity.toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-600 mt-0.5">Logged with Reason Code</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                <div className="text-[11px] text-slate-700 font-medium">Remaining</div>
                <div className="text-xl font-bold text-slate-800 tabular-nums mt-1">
                  {remainingQty.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">To reach target</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations & Work Orders Tab */}
      {activeTab === 'operations' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Sequential Work Order Operations</span>
            <span className="text-xs text-slate-500">Shop floor dispatch order</span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.operations.map((op, idx) => (
              <div key={op.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">Seq {op.sequence}</span>
                    <span className="text-sm font-semibold text-slate-900">{op.name}</span>
                    <StatusBadge status={op.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Work Center: <strong className="text-slate-800">{op.workCenterName}</strong></span>
                    <span>·</span>
                    <span>Setup: <strong className="tabular-nums font-mono">{op.setupTimeMinutes}m</strong></span>
                    <span>·</span>
                    <span>Run: <strong className="tabular-nums font-mono">{op.runTimeSecondsPerUnit}s/unit</strong></span>
                    {op.assignedOperator && (
                      <>
                        <span>·</span>
                        <span>Operator: <strong className="text-slate-800">{op.assignedOperator}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold font-mono tabular-nums text-slate-900">
                      {op.completedQty} / {op.targetQty} Good
                    </div>
                    {op.scrapQty > 0 && (
                      <div className="text-[11px] font-mono text-rose-600">
                        {op.scrapQty} Scrap
                      </div>
                    )}
                  </div>

                  {/* Operation Actions */}
                  {op.status === 'READY' && (
                    <button
                      onClick={() => onStartOperation(order.id, op.sequence, 'Agus Pratama')}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Operation</span>
                    </button>
                  )}

                  {op.status === 'IN_PROGRESS' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedOpSeq(op.sequence);
                          setShowLogModal(true);
                        }}
                        className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Log Output
                      </button>
                      <button
                        onClick={() => onCompleteOperation(order.id, op.sequence)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Complete</span>
                      </button>
                    </div>
                  )}

                  {op.status === 'COMPLETED' && (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Material Requirements & Allocation</span>
            <span className="text-xs text-slate-500">Directly exploded from BOM-A Rev.03</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Component SKU & Description</th>
                <th className="py-2.5 px-4 text-right">Required Qty</th>
                <th className="py-2.5 px-4 text-right">Allocated Qty</th>
                <th className="py-2.5 px-4 text-right">Consumed Qty</th>
                <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                <th className="py-2.5 px-4">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {order.materials.map((m) => (
                <tr key={m.productId} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans">
                    <span className="font-mono font-semibold text-slate-900 block">{m.sku}</span>
                    <span className="text-xs text-slate-500">{m.name}</span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">
                    {m.requiredQty.toLocaleString()} {m.uom}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                    {m.allocatedQty.toLocaleString()} {m.uom}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                    {m.consumedQty.toLocaleString()} {m.uom}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                    {m.availableStock.toLocaleString()} {m.uom}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Output & Scrap Logs Tab */}
      {activeTab === 'output' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Shop Floor Production & Scrap Audit Log</span>
            <button
              onClick={() => setShowLogModal(true)}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
            >
              + Add Entry
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Operation</th>
                <th className="py-2.5 px-4 text-right">Good Qty</th>
                <th className="py-2.5 px-4 text-right">Scrap Qty</th>
                <th className="py-2.5 px-4">Reason Code</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {order.outputLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{log.operationName}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-emerald-700 font-semibold">+{log.goodQty}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-rose-700 font-semibold">
                    {log.scrapQty > 0 ? `-${log.scrapQty}` : '0'}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">
                    {log.reasonCode ? (
                      <span className="text-rose-700 font-mono text-[11px]">{log.reasonCode}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">{log.operator}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 text-xs truncate max-w-xs">{log.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Output & Scrap Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Report Production Output</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOutput} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Operation</label>
                <select
                  value={selectedOpSeq}
                  onChange={(e) => setSelectedOpSeq(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-medium"
                >
                  {order.operations.map((op) => (
                    <option key={op.sequence} value={op.sequence}>
                      {op.operationCode} ({op.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-800 font-medium mb-1">Good Units Produced</label>
                  <input
                    type="number"
                    min="1"
                    value={goodQtyInput}
                    onChange={(e) => setGoodQtyInput(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-rose-800 font-medium mb-1">Scrap Units</label>
                  <input
                    type="number"
                    min="0"
                    value={scrapQtyInput}
                    onChange={(e) => setScrapQtyInput(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-mono font-semibold"
                  />
                </div>
              </div>

              {scrapQtyInput > 0 && (
                <div>
                  <label className="block text-rose-800 font-medium mb-1">Scrap Reason Code</label>
                  <select
                    value={selectedReasonCode}
                    onChange={(e) => setSelectedReasonCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-rose-300 rounded focus:outline-none font-medium text-rose-900 bg-rose-50/30"
                  >
                    {reasonCodes.map((rc) => (
                      <option key={rc.id} value={rc.code}>
                        {rc.code} - {rc.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Operator Name</label>
                <input
                  type="text"
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Inspection Notes</label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Optional notes or batch observations..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors"
                >
                  Confirm & Backflush Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
