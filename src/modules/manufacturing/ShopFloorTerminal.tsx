import React, { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  User,
  Cpu,
  Flame,
  Layers,
} from 'lucide-react';
import { WorkCenter, ProductionOrder, ReasonCode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface ShopFloorTerminalProps {
  workCenters: WorkCenter[];
  orders: ProductionOrder[];
  reasonCodes: ReasonCode[];
  onStartOp: (orderId: string, seq: number, operator: string) => void;
  onLogOutput: (
    orderId: string,
    seq: number,
    goodQty: number,
    scrapQty: number,
    reasonCode: string | undefined,
    operator: string,
    notes?: string
  ) => void;
  onCompleteOp: (orderId: string, seq: number) => void;
}

export const ShopFloorTerminal: React.FC<ShopFloorTerminalProps> = ({
  workCenters,
  orders,
  reasonCodes,
  onStartOp,
  onLogOutput,
  onCompleteOp,
}) => {
  const [selectedWcId, setSelectedWcId] = useState<string>(workCenters[1]?.id || workCenters[0]?.id);
  const [operatorName, setOperatorName] = useState<string>('Agus Pratama');
  const [goodCount, setGoodCount] = useState<number>(25);
  const [scrapCount, setScrapCount] = useState<number>(0);
  const [scrapReason, setScrapReason] = useState<string>('SCRAP-OP');

  const selectedWc = workCenters.find((w) => w.id === selectedWcId) || workCenters[0];

  // Find operations assigned to this work center across all active orders
  const assignedOperations: {
    order: ProductionOrder;
    op: ProductionOrder['operations'][0];
  }[] = [];

  for (const order of orders) {
    if (order.status === 'CLOSED') continue;
    for (const op of order.operations) {
      if (op.workCenterId === selectedWc.id || op.workCenterCode === selectedWc.code) {
        assignedOperations.push({ order, op });
      }
    }
  }

  const activeOp = assignedOperations.find((item) => item.op.status === 'IN_PROGRESS');
  const queuedOps = assignedOperations.filter((item) => item.op.status === 'READY');

  const handleQuickGoodAdd = (increment: number) => {
    setGoodCount((prev) => Math.max(1, prev + increment));
  };

  const handleQuickScrapAdd = (increment: number) => {
    setScrapCount((prev) => Math.max(0, prev + increment));
  };

  const handleExecuteLog = () => {
    if (!activeOp) return;
    onLogOutput(
      activeOp.order.id,
      activeOp.op.sequence,
      goodCount,
      scrapCount,
      scrapCount > 0 ? scrapReason : undefined,
      operatorName,
      `Kiosk direct touch report: Station ${selectedWc.code}`
    );
    // Reset quick counters
    setGoodCount(25);
    setScrapCount(0);
  };

  return (
    <div className="space-y-4">
      {/* Kiosk Station Selector Bar */}
      <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Shop Floor Operator Terminal
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{selectedWc.code}</span>
              <span className="text-slate-400 font-normal">· {selectedWc.name}</span>
            </div>
          </div>
        </div>

        {/* Work Center Station Dropdown & Operator Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">Operator:</span>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none w-28"
            />
          </div>

          <select
            value={selectedWcId}
            onChange={(e) => setSelectedWcId(e.target.value)}
            className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded border border-slate-700 focus:outline-none font-semibold cursor-pointer"
          >
            {workCenters.map((wc) => (
              <option key={wc.id} value={wc.id}>
                {wc.code} ({wc.department}) - {wc.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Kiosk Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Active Work Order Execution */}
        <div className="lg:col-span-2 space-y-4">
          {activeOp ? (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      ACTIVE RUN
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {activeOp.order.orderNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mt-1">
                    {activeOp.op.name}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Product: <strong className="text-slate-800">{activeOp.order.productName}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Standard Cycle</div>
                  <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                    {activeOp.op.runTimeSecondsPerUnit}s / unit
                  </div>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Operation Completion Progress</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {activeOp.op.completedQty} / {activeOp.op.targetQty} units ({Math.round((activeOp.op.completedQty / activeOp.op.targetQty) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${(activeOp.op.completedQty / activeOp.op.targetQty) * 100}%` }}
                  />
                  {activeOp.op.scrapQty > 0 && (
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${(activeOp.op.scrapQty / activeOp.op.targetQty) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Good: {activeOp.op.completedQty}</span>
                  <span>Scrap: {activeOp.op.scrapQty}</span>
                  <span>Remaining: {Math.max(0, activeOp.op.targetQty - activeOp.op.completedQty)}</span>
                </div>
              </div>

              {/* Touch Log Controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Touchpad Production Entry
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Good Count Controller */}
                  <div className="bg-white p-3 rounded border border-emerald-200 space-y-2">
                    <span className="text-xs font-semibold text-emerald-800 block">
                      Good Output Units
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold font-mono text-emerald-700 tabular-nums">
                        {goodCount}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickGoodAdd(-10)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono font-semibold"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleQuickGoodAdd(-1)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono font-semibold"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickGoodAdd(1)}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-xs font-mono font-semibold"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickGoodAdd(10)}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-xs font-mono font-semibold"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleQuickGoodAdd(50)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-mono font-semibold"
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scrap Count Controller */}
                  <div className="bg-white p-3 rounded border border-rose-200 space-y-2">
                    <span className="text-xs font-semibold text-rose-800 block">
                      Defective / Scrap Units
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold font-mono text-rose-700 tabular-nums">
                        {scrapCount}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickScrapAdd(-1)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono font-semibold"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickScrapAdd(1)}
                          className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded text-xs font-mono font-semibold"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickScrapAdd(5)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-mono font-semibold"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    {scrapCount > 0 && (
                      <div className="pt-2 border-t border-rose-100">
                        <label className="text-[11px] text-rose-700 font-semibold block mb-1">
                          Scrap Reason Code
                        </label>
                        <select
                          value={scrapReason}
                          onChange={(e) => setScrapReason(e.target.value)}
                          className="w-full text-xs bg-rose-50 border border-rose-300 rounded px-2 py-1 text-rose-900 font-medium"
                        >
                          {reasonCodes.map((rc) => (
                            <option key={rc.id} value={rc.code}>
                              {rc.code} - {rc.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => onCompleteOp(activeOp.order.id, activeOp.op.sequence)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete Op & Advance Next</span>
                  </button>

                  <button
                    onClick={handleExecuteLog}
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors"
                  >
                    Post Log (+{goodCount} Good, {scrapCount} Scrap)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                No Operation Currently In Progress at {selectedWc.code}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a queued operation below and click "Start Operation" to begin setup and manufacturing execution.
              </p>
            </div>
          )}

          {/* Queued Work Orders at this station */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Queued Operations at {selectedWc.code} ({queuedOps.length})
              </span>
              <span className="text-[11px] text-slate-500">Ready for setup</span>
            </div>

            {queuedOps.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {queuedOps.map(({ order, op }) => (
                  <div key={`${order.id}-${op.sequence}`} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-800">{op.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Target: <strong className="font-mono text-slate-800">{op.targetQty} PCS</strong>
                        <span className="mx-1.5">·</span>
                        Setup: <strong className="font-mono text-slate-800">{op.setupTimeMinutes} mins</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartOp(order.id, op.sequence, operatorName)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Setup & Run</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No pending work orders queued for this cell.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Station Specs & Telemetry */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-slate-700">Cell Specifications</span>
              <StatusBadge status={selectedWc.status} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-800">{selectedWc.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Capacity</span>
                <span className="font-mono font-semibold text-slate-800">{selectedWc.capacityHoursPerDay} Hours/Day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Efficiency Factor</span>
                <span className="font-mono font-semibold text-slate-800">
                  {Math.round(selectedWc.efficiencyRate * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hourly Operating Cost</span>
                <span className="font-mono font-semibold text-slate-800">${selectedWc.costRate || selectedWc.hourlyRate}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Operator</span>
                <span className="font-medium text-slate-800">{selectedWc.currentOperator || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Quick Downtime Flag Box */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Report Station Downtime</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Halt line clock if mechanical breakdown, tool replacement, or waiting on materials occurs.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => alert(`Station ${selectedWc.code} logged DOWN-TOOL. Maintenance team alerted.`)}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-xs text-slate-700 transition-colors"
              >
                <div className="font-semibold">Tool Wear / Broken</div>
                <div className="text-[10px] text-slate-400">DOWN-TOOL</div>
              </button>
              <button
                onClick={() => alert(`Station ${selectedWc.code} logged DOWN-MAT. Logistics alerted.`)}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-xs text-slate-700 transition-colors"
              >
                <div className="font-semibold">Material Starvation</div>
                <div className="text-[10px] text-slate-400">DOWN-MAT</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
