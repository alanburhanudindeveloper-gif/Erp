import React from 'react';
import {
  X,
  Printer,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Factory,
  Boxes,
  ShieldCheck,
  Clock,
  UserCheck,
  Calendar,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { ProductionOrder, QualityInspection } from '../../types';

interface ProductionTravelerModalProps {
  order: ProductionOrder;
  inspections?: QualityInspection[];
  customValues?: Record<string, any>;
  onClose: () => void;
}

export const ProductionTravelerModal: React.FC<ProductionTravelerModalProps> = ({
  order,
  inspections = [],
  customValues = {},
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const orderInspections = inspections.filter(
    (i) => i.sourceRef === order.orderNumber || i.productId === order.productId
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl font-sans">
        {/* Header Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-t-lg shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded">
              ELECTRONIC PRODUCTION RECORD & TRAVELER
            </span>
            <span className="text-xs text-slate-400 font-mono">ORACLE MFG SPEC (REF B)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Traveler</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Traveler Document Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 text-xs">
          {/* Document Masthead */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                KRANEX MANUFACTURING OPERATIONS
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
                SHOP FLOOR TRAVELER & JOB TICKET
              </h1>
              <div className="text-xs text-slate-600 mt-1">
                Traveler Document: <span className="font-mono font-bold">{order.orderNumber}-TRV</span> | Plant: {order.plantName}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded text-right">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">ORDER BARCODE</div>
                <div className="font-mono font-bold text-sm text-slate-900">{order.orderNumber}</div>
                <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                  STATUS: {order.status}
                </div>
              </div>
              <div className="w-14 h-14 bg-white border border-slate-300 rounded flex items-center justify-center p-1">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
            </div>
          </div>

          {/* Primary Order Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded border border-slate-200">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Product SKU</div>
              <div className="font-mono font-bold text-slate-900">{order.productSku}</div>
              <div className="text-[11px] text-slate-600 truncate">{order.productName}</div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Target Quantity</div>
              <div className="font-bold text-slate-900 font-mono text-sm">{order.targetQuantity.toLocaleString()} PCS</div>
              <div className="text-[10px] text-slate-500 font-mono">
                Good: {order.goodQuantity} | Scrap: {order.scrapQuantity}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Frozen Engineering Rev</div>
              <div className="font-mono font-semibold text-slate-800">BOM: {order.bomCode} ({order.bomRevision})</div>
              <div className="font-mono text-[10px] text-slate-500">Routing: {order.routingCode}</div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Scheduled Timeline</div>
              <div className="font-mono text-slate-800">Start: {order.plannedStartDate}</div>
              <div className="font-mono text-rose-700 font-semibold text-[11px]">Due: {order.dueDate}</div>
            </div>
          </div>

          {/* Custom Fields (Section 33 Extension) */}
          {Object.keys(customValues).length > 0 && (
            <div className="bg-blue-50/50 p-3 rounded border border-blue-200 space-y-1">
              <div className="text-[10px] font-mono font-bold text-blue-800 uppercase tracking-wider">
                Configured Custom Order Attributes:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {Object.entries(customValues).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-mono text-slate-500">{k}:</span>{' '}
                    <span className="font-bold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Sequenced Routing Operations Traveler Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="font-bold text-slate-900 font-mono uppercase text-xs flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-slate-700" />
                <span>1. Sequenced Routing Operations & Sign-Offs (Dispatch Sheet)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                BR-PROD-002: Predecessor Order Strict Enforcement
              </span>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-700">
                    <th className="py-2 px-3 w-12 text-center">SEQ</th>
                    <th className="py-2 px-3 w-32">WORK ORDER #</th>
                    <th className="py-2 px-3">OPERATION DESCRIPTION</th>
                    <th className="py-2 px-3 w-36">WORK CENTER</th>
                    <th className="py-2 px-3 w-24 text-right">TARGET</th>
                    <th className="py-2 px-3 w-28 text-right">GOOD / SCRAP</th>
                    <th className="py-2 px-3 w-24 text-center">STATUS</th>
                    <th className="py-2 px-3 w-32 text-center">OPERATOR SIGN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.operations.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        0{op.sequence}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {op.workOrderNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{op.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Setup: {op.setupTimeMinutes}m | Run: {op.runTimeSecondsPerUnit}s/unit
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {op.workCenterCode} ({op.workCenterName})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {op.targetQty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className="text-emerald-700 font-bold">{op.completedQty}</span> /{' '}
                        <span className="text-rose-600">{op.scrapQty}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            op.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : op.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : op.status === 'READY'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 border-l border-slate-200">
                        {op.assignedOperator ? (
                          <span className="font-bold text-slate-800">{op.assignedOperator}</span>
                        ) : (
                          <span className="italic text-slate-400">________ (Pending)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Material Component Picking & Reservation Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="font-bold text-slate-900 font-mono uppercase text-xs flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-slate-700" />
                <span>2. Bill of Material Allocation & Picking Checklist</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Hard Stock Allocation Snapshot
              </span>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-700">
                    <th className="py-2 px-3">COMPONENT SKU</th>
                    <th className="py-2 px-3">DESCRIPTION</th>
                    <th className="py-2 px-3 text-right">REQUIRED</th>
                    <th className="py-2 px-3 text-right">ALLOCATED</th>
                    <th className="py-2 px-3 text-right">CONSUMED</th>
                    <th className="py-2 px-3 text-center">UOM</th>
                    <th className="py-2 px-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.materials.map((mat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 font-mono">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{mat.sku}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">{mat.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{mat.requiredQty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-bold">{mat.allocatedQty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{mat.consumedQty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{mat.uom}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            mat.status === 'SUFFICIENT'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {mat.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Attached Quality Inspections & NCR */}
          {orderInspections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="font-bold text-slate-900 font-mono uppercase text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>3. Quality Control Inspections & Sampling Lot Disposition</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  First Article Inspection (FAI) Records
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {orderInspections.map((qc) => (
                  <div key={qc.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-900">{qc.inspectionNo}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          qc.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {qc.result}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Parameter: {qc.characteristic} ({qc.specification})
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Sample Size: {qc.sampleSize} | Inspector: {qc.inspector}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Electronic Sign-Off & Verification Footer */}
          <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 border border-slate-200 rounded text-center space-y-3">
              <div className="text-slate-500 text-[10px] uppercase">PPIC RELEASE APPROVAL</div>
              <div className="h-8 flex items-center justify-center font-bold text-slate-800">
                Dewi Lestari (PPIC Lead)
              </div>
              <div className="text-[10px] text-slate-400">Timestamp: {order.plannedStartDate}</div>
            </div>

            <div className="p-3 border border-slate-200 rounded text-center space-y-3">
              <div className="text-slate-500 text-[10px] uppercase">PRODUCTION SUPERVISOR</div>
              <div className="h-8 flex items-center justify-center font-bold text-slate-800">
                Agung Prasetyo
              </div>
              <div className="text-[10px] text-slate-400">Floor Line: Machining Cell A</div>
            </div>

            <div className="p-3 border border-slate-200 rounded text-center space-y-3">
              <div className="text-slate-500 text-[10px] uppercase">QUALITY DISPOSITION</div>
              <div className="h-8 flex items-center justify-center font-bold text-emerald-700">
                <BadgeCheck className="w-4 h-4 inline mr-1" />
                Sari Wulandari (QA Lead)
              </div>
              <div className="text-[10px] text-slate-400">Final Release to FG Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
