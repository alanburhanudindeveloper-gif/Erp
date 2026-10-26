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
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Filter,
  BadgeCheck,
} from 'lucide-react';
import { WorkCenter, ProductionOrder, ReasonCode } from '../../types';
import { INITIAL_EMPLOYEES } from '../../lib/mockData';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SwipeableOrderCard } from './SwipeableOrderCard';

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
  onReleaseOrder?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const ShopFloorTerminal: React.FC<ShopFloorTerminalProps> = ({
  workCenters,
  orders,
  reasonCodes,
  onStartOp,
  onLogOutput,
  onCompleteOp,
  onReleaseOrder,
  onSelectOrder,
}) => {
  const [selectedWcId, setSelectedWcId] = useState<string>(workCenters[1]?.id || workCenters[0]?.id);
  const [selectedOperatorNik, setSelectedOperatorNik] = useState<string>('EMP-2026-0102');
  const [operatorName, setOperatorName] = useState<string>('Agus Pratama');
  const [goodCount, setGoodCount] = useState<number>(25);
  const [scrapCount, setScrapCount] = useState<number>(0);
  const [scrapReason, setScrapReason] = useState<string>('SCRAP-OP');
  const [listFilter, setListFilter] = useState<'station' | 'ready' | 'all'>('station');

  const selectedWc = workCenters.find((w) => w.id === selectedWcId) || workCenters[0];
  const activeEmployee = INITIAL_EMPLOYEES.find((e) => e.nik === selectedOperatorNik || e.fullName === operatorName);

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">Operator NIK:</span>
            <select
              value={selectedOperatorNik}
              onChange={(e) => {
                const nik = e.target.value;
                setSelectedOperatorNik(nik);
                const found = INITIAL_EMPLOYEES.find((emp) => emp.nik === nik);
                if (found) setOperatorName(found.fullName);
              }}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {INITIAL_EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.nik} className="bg-slate-900 text-white">
                  {emp.nik} — {emp.fullName} ({emp.positionTitle})
                </option>
              ))}
            </select>
            {activeEmployee && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
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

      {/* Touch Gesture Instruction Bar */}
      <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Touch Kiosk Swipe Gestures Enabled:</strong> Swipe cards horizontally or drag with mouse to instantly update order status.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-300 shrink-0">
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <ArrowRight className="w-3 h-3" />
            <span>Swipe Right ➔ Start / Run</span>
          </span>
          <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold bg-blue-100/60 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            <ArrowLeft className="w-3 h-3" />
            <span>Swipe Left 🠔 Complete Op</span>
          </span>
        </div>
      </div>

      {/* Main Kiosk Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Active Work Order Execution */}
        <div className="lg:col-span-2 space-y-4">
          {activeOp ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-5 shadow-xs">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      ACTIVE RUN
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {activeOp.order.orderNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {activeOp.op.name}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Product: <strong className="text-slate-800 dark:text-slate-200">{activeOp.order.productName}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Standard Cycle</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {activeOp.op.runTimeSecondsPerUnit}s / unit
                  </div>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Operation Completion Progress</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {activeOp.op.completedQty} / {activeOp.op.targetQty} units ({Math.round((activeOp.op.completedQty / activeOp.op.targetQty) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
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
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Touchpad Production Entry
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Good Count Controller */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                      Good Output Units
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {goodCount}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickGoodAdd(-10)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-xs font-mono font-semibold"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleQuickGoodAdd(-1)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-xs font-mono font-semibold"
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
                  <div className="bg-white dark:bg-slate-900 p-3 rounded border border-rose-200 dark:border-rose-800 space-y-2">
                    <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block">
                      Defective / Scrap Units
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold font-mono text-rose-700 dark:text-rose-400 tabular-nums">
                        {scrapCount}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickScrapAdd(-1)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-xs font-mono font-semibold"
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
                      <div className="pt-2 border-t border-rose-100 dark:border-rose-800">
                        <label className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold block mb-1">
                          Scrap Reason Code
                        </label>
                        <select
                          value={scrapReason}
                          onChange={(e) => setScrapReason(e.target.value)}
                          className="w-full text-xs bg-rose-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded px-2 py-1 text-rose-900 dark:text-rose-300 font-medium"
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
                    className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 shadow-xs"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Operation Currently In Progress at {selectedWc.code}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Swipe right on a queued order below to immediately begin setup and manufacturing execution.
              </p>
            </div>
          )}

          {/* Swipe-to-Action Production Orders & Operations Dispatch Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Production Orders Queue & Gesture Dispatch
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Swipe cards or tap actions to update order state
                </span>
              </div>

              {/* Segmented Filter */}
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded text-[11px] font-medium">
                <button
                  onClick={() => setListFilter('station')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    listFilter === 'station'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Station Jobs ({assignedOperations.length})
                </button>
                <button
                  onClick={() => setListFilter('ready')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    listFilter === 'ready'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ready ({queuedOps.length})
                </button>
                <button
                  onClick={() => setListFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    listFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Plant MOs ({orders.length})
                </button>
              </div>
            </div>

            {/* List with Swipeable Cards */}
            <div className="p-3 space-y-2.5">
              {listFilter === 'station' && (
                assignedOperations.length > 0 ? (
                  assignedOperations.map(({ order, op }) => (
                    <SwipeableOrderCard
                      key={`${order.id}-${op.sequence}`}
                      order={order}
                      operation={op}
                      currentOperator={operatorName}
                      onQuickStart={(orderId, seq) => onStartOp(orderId, seq, operatorName)}
                      onQuickComplete={(orderId, seq) => onCompleteOp(orderId, seq)}
                      onQuickRelease={onReleaseOrder}
                      onSelectOrder={onSelectOrder}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No work orders assigned to station {selectedWc.code}.
                  </div>
                )
              )}

              {listFilter === 'ready' && (
                queuedOps.length > 0 ? (
                  queuedOps.map(({ order, op }) => (
                    <SwipeableOrderCard
                      key={`${order.id}-${op.sequence}`}
                      order={order}
                      operation={op}
                      currentOperator={operatorName}
                      onQuickStart={(orderId, seq) => onStartOp(orderId, seq, operatorName)}
                      onQuickComplete={(orderId, seq) => onCompleteOp(orderId, seq)}
                      onQuickRelease={onReleaseOrder}
                      onSelectOrder={onSelectOrder}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No queued work orders awaiting setup at {selectedWc.code}.
                  </div>
                )
              )}

              {listFilter === 'all' && (
                orders.map((order) => (
                  <SwipeableOrderCard
                    key={order.id}
                    order={order}
                    currentOperator={operatorName}
                    onQuickStart={(orderId, seq) => onStartOp(orderId, seq, operatorName)}
                    onQuickComplete={(orderId, seq) => onCompleteOp(orderId, seq)}
                    onQuickRelease={onReleaseOrder}
                    onSelectOrder={onSelectOrder}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Station Specs & Telemetry */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cell Specifications</span>
              <StatusBadge status={selectedWc.status} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Department</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedWc.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Daily Capacity</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {selectedWc.capacityHoursPerDay} Hours/Day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Efficiency Factor</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {Math.round(selectedWc.efficiencyRate * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hourly Operating Cost</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  ${selectedWc.costRate || selectedWc.hourlyRate}/hr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Active Operator</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedWc.currentOperator || operatorName}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Downtime Flag Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Report Station Downtime</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Halt line clock if mechanical breakdown, tool replacement, or waiting on materials occurs.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => alert(`Station ${selectedWc.code} logged DOWN-TOOL. Maintenance team alerted.`)}
                className="p-2 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              >
                <div className="font-semibold">Tool Wear / Broken</div>
                <div className="text-[10px] text-slate-400">DOWN-TOOL</div>
              </button>
              <button
                onClick={() => alert(`Station ${selectedWc.code} logged DOWN-MAT. Logistics alerted.`)}
                className="p-2 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
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
