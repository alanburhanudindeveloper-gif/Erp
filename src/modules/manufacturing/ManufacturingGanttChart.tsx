import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Info,
  GitCommit,
  User,
  Factory,
  RotateCcw,
} from 'lucide-react';
import { ProductionOrder, ProductionOrderOperation, WorkCenter } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface ManufacturingGanttChartProps {
  orders: ProductionOrder[];
  workCenters: WorkCenter[];
  onSelectOrder: (orderId: string) => void;
  onNavigateToShopFloor: (wcCode?: string) => void;
}

interface ScheduledOperation extends ProductionOrderOperation {
  orderId: string;
  orderNumber: string;
  productSku: string;
  productName: string;
  startDate: Date;
  endDate: Date;
  startDayIndex: number;
  durationDays: number;
  isBlocked: boolean;
  predecessorOp?: string;
}

interface ScheduledOrder {
  order: ProductionOrder;
  startDate: Date;
  dueDate: Date;
  startDayIndex: number;
  durationDays: number;
  operations: ScheduledOperation[];
}

export const ManufacturingGanttChart: React.FC<ManufacturingGanttChartProps> = ({
  orders,
  workCenters,
  onSelectOrder,
  onNavigateToShopFloor,
}) => {
  const [groupBy, setGroupBy] = useState<'ORDER' | 'WORK_CENTER'>('ORDER');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<ScheduledOperation | null>(null);
  const [simulatedDelayDay, setSimulatedDelayDay] = useState<number>(0);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({
    'mo-124': true,
    'mo-125': true,
  });

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Reference Horizon: 18 days from Oct 19, 2026 to Nov 05, 2026
  const baseStartDate = useMemo(() => new Date(2026, 9, 19), []); // Oct 19, 2026
  const totalDays = 18;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayNum: number; dayName: string; isToday: boolean; isWeekend: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(baseStartDate);
      d.setDate(baseStartDate.getDate() + i);
      const isToday = d.getDate() === 22 && d.getMonth() === 9; // Oct 22, 2026
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      days.push({
        date: d,
        dateStr: `${d.getDate()} Oct`,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday,
        isWeekend,
      });
    }
    return days;
  }, [baseStartDate, totalDays]);

  // Compute scheduled timeline for each order and its sequential operations
  const scheduledOrders = useMemo<ScheduledOrder[]>(() => {
    return orders.map((order) => {
      const orderStart = new Date(order.plannedStartDate || '2026-10-20');
      const orderDue = new Date(order.dueDate || '2026-10-28');

      // Add simulated delay if applied to MO-2026-00124
      if (order.id === 'mo-124' && simulatedDelayDay > 0) {
        orderDue.setDate(orderDue.getDate() + simulatedDelayDay);
      }

      const diffTime = orderStart.getTime() - baseStartDate.getTime();
      const orderStartDayIndex = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const orderDurationDays = Math.max(
        1,
        Math.ceil((orderDue.getTime() - orderStart.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Compute sequential operation timeline
      let currentDayCursor = orderStartDayIndex;
      const scheduledOps: ScheduledOperation[] = order.operations.map((op, idx) => {
        // Estimate operation duration in days (cutting = 1.5d, assy = 3d, paint = 2d, pack = 1d)
        let opDays = idx === 0 ? 2 : idx === 1 ? 3 : idx === 2 ? 2 : 1;
        if (order.id === 'mo-124' && idx === 0 && simulatedDelayDay > 0) {
          opDays += simulatedDelayDay;
        }

        const opStart = new Date(baseStartDate);
        opStart.setDate(baseStartDate.getDate() + currentDayCursor);

        const opEnd = new Date(opStart);
        opEnd.setDate(opStart.getDate() + opDays);

        // Predecessor check (Page 96)
        let isBlocked = false;
        let predecessorOp: string | undefined = undefined;

        if (op.dependencySeq) {
          const predecessor = order.operations.find((o) => o.sequence === op.dependencySeq);
          if (predecessor) {
            predecessorOp = predecessor.operationCode;
            if (predecessor.status !== 'COMPLETED') {
              isBlocked = true;
            }
          }
        }

        const scheduledOp: ScheduledOperation = {
          ...op,
          orderId: order.id,
          orderNumber: order.orderNumber,
          productSku: order.productSku,
          productName: order.productName,
          startDate: opStart,
          endDate: opEnd,
          startDayIndex: currentDayCursor,
          durationDays: opDays,
          isBlocked,
          predecessorOp,
        };

        currentDayCursor += opDays;
        return scheduledOp;
      });

      return {
        order,
        startDate: orderStart,
        dueDate: orderDue,
        startDayIndex: orderStartDayIndex,
        durationDays: orderDurationDays,
        operations: scheduledOps,
      };
    });
  }, [orders, baseStartDate, simulatedDelayDay]);

  // Group by Work Center for machine resource schedule view
  const workCenterSchedules = useMemo(() => {
    return workCenters.map((wc) => {
      const opsAtWc = scheduledOrders.flatMap((so) =>
        so.operations.filter((op) => op.workCenterCode === wc.code || op.workCenterId === wc.id)
      );
      return {
        workCenter: wc,
        operations: opsAtWc,
      };
    });
  }, [workCenters, scheduledOrders]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStatusColor = (status: string, isBlocked: boolean) => {
    if (isBlocked) return 'bg-slate-300 text-slate-700 border-dashed border-slate-400';
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'IN_PROGRESS':
        return 'bg-amber-500 text-white border-amber-600 shadow-xs';
      case 'READY':
        return 'bg-blue-600 text-white border-blue-700';
      case 'PLANNED':
      case 'PENDING':
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300';
    }
  };

  const dayColWidth = 56; // 56px per day cell for clean readable calendar grid

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Production Gantt Schedule & Work Order Dependencies
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Strict dependency enforcement (Page 96: Cutting → Assembly → Painting → Packing) and machine timeline.
          </p>
        </div>

        {/* View mode segmented toggles & simulation triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group By selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded text-xs font-medium">
            <button
              onClick={() => setGroupBy('ORDER')}
              className={`px-3 py-1 rounded transition-colors ${
                groupBy === 'ORDER' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order View
            </button>
            <button
              onClick={() => setGroupBy('WORK_CENTER')}
              className={`px-3 py-1 rounded transition-colors ${
                groupBy === 'WORK_CENTER' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Work Center View
            </button>
          </div>

          {/* Dependency Simulation Button */}
          <button
            onClick={() => setSimulatedDelayDay((prev) => (prev === 0 ? 2 : 0))}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 ${
              simulatedDelayDay > 0
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${simulatedDelayDay > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>{simulatedDelayDay > 0 ? 'Clear +2d Delay Simulation' : 'Simulate 2-Day Delay'}</span>
          </button>
        </div>
      </div>

      {/* Dependency Invariant Notice (Page 96) */}
      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-amber-400">PDF Section 27 Dependency Rule:</strong> Predecessor operations must reach <code>COMPLETED</code> status before subsequent operations can start. Downstream schedule shifts automatically if predecessor is delayed.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Active Invariant: Strict Finish-to-Start (FS)
        </span>
      </div>

      {/* Main Gantt Grid Canvas */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs flex flex-col">
        <div className="flex overflow-x-auto" ref={timelineContainerRef}>
          {/* Left Fixed Hierarchy Column */}
          <div className="w-72 sm:w-80 shrink-0 border-r border-slate-200 bg-slate-50/70 select-none">
            {/* Header */}
            <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{groupBy === 'ORDER' ? 'Production Order / Operation' : 'Work Center / Machine'}</span>
              <span className="text-[11px] text-slate-400 font-mono">Resource</span>
            </div>

            {/* Tree Rows */}
            {groupBy === 'ORDER' ? (
              <div className="divide-y divide-slate-100">
                {scheduledOrders.map(({ order, operations }) => {
                  const isExpanded = expandedOrders[order.id] !== false;
                  return (
                    <div key={order.id}>
                      {/* Order Parent Row */}
                      <div
                        onClick={() => toggleOrderExpand(order.id)}
                        className="h-12 px-3 flex items-center justify-between hover:bg-slate-100/60 cursor-pointer transition-colors bg-white font-mono text-xs border-b border-slate-100"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button className="text-slate-400 hover:text-slate-700">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate">{order.orderNumber}</span>
                            <span className="text-[11px] text-slate-500 font-sans block truncate">
                              {order.productName} ({order.targetQuantity} PCS)
                            </span>
                          </div>
                        </div>

                        <StatusBadge status={order.status} />
                      </div>

                      {/* Operation Child Rows */}
                      {isExpanded && (
                        <div className="divide-y divide-slate-100 bg-slate-50/50">
                          {operations.map((op) => (
                            <div
                              key={op.id}
                              onClick={() => setSelectedTask(op)}
                              className={`h-10 pl-8 pr-3 flex items-center justify-between text-xs hover:bg-blue-50/50 cursor-pointer transition-colors ${
                                selectedTask?.id === op.id ? 'bg-blue-50/80 font-semibold' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-[11px] text-slate-400">{op.operationCode}</span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-600 truncate">
                                {op.workCenterCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workCenterSchedules.map(({ workCenter, operations }) => (
                  <div key={workCenter.id} className="h-16 px-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{workCenter.code}</span>
                      <StatusBadge status={workCenter.status} />
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans truncate mt-0.5">
                      {workCenter.name} ({operations.length} jobs)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Scrollable Timeline Grid */}
          <div className="flex-1 overflow-x-auto min-w-[700px]">
            {/* Calendar Days Header */}
            <div className="h-12 border-b border-slate-200 flex bg-slate-50 text-xs font-mono">
              {calendarDays.map((d, idx) => (
                <div
                  key={idx}
                  style={{ width: `${dayColWidth}px` }}
                  className={`shrink-0 border-r border-slate-200 flex flex-col items-center justify-center text-center ${
                    d.isToday
                      ? 'bg-blue-100/60 font-bold text-blue-900'
                      : d.isWeekend
                      ? 'bg-slate-100/60 text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  <span className="text-[10px] uppercase font-sans tracking-tight">{d.dayName}</span>
                  <span className="text-xs font-bold tabular-nums leading-tight">{d.dayNum}</span>
                </div>
              ))}
            </div>

            {/* Timeline Rows with Gantt Bars */}
            {groupBy === 'ORDER' ? (
              <div className="divide-y divide-slate-100">
                {scheduledOrders.map(({ order, startDayIndex, durationDays, operations }) => {
                  const isExpanded = expandedOrders[order.id] !== false;
                  return (
                    <div key={order.id} className="relative">
                      {/* Parent Order Bar Row */}
                      <div className="h-12 flex items-center relative border-b border-slate-100">
                        {/* Day Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {calendarDays.map((d, idx) => (
                            <div
                              key={idx}
                              style={{ width: `${dayColWidth}px` }}
                              className={`shrink-0 h-full border-r border-slate-100 ${
                                d.isToday ? 'bg-blue-50/20' : d.isWeekend ? 'bg-slate-50/50' : ''
                              }`}
                            />
                          ))}
                        </div>

                        {/* Order Span Bracket / Bar */}
                        <div
                          style={{
                            left: `${startDayIndex * dayColWidth + 4}px`,
                            width: `${Math.max(1, durationDays) * dayColWidth - 8}px`,
                          }}
                          className="absolute h-6 rounded bg-slate-800 text-white px-2 flex items-center justify-between text-[11px] font-mono shadow-xs truncate z-10"
                        >
                          <span className="truncate font-semibold">{order.orderNumber}</span>
                          <span className="text-[10px] text-amber-300 font-bold">
                            {order.goodQuantity}/{order.targetQuantity}
                          </span>
                        </div>
                      </div>

                      {/* Operation Child Gantt Bars */}
                      {isExpanded &&
                        operations.map((op) => {
                          const isOpSelected = selectedTask?.id === op.id;
                          return (
                            <div key={op.id} className="h-10 flex items-center relative hover:bg-slate-50/30">
                              {/* Day Grid Lines */}
                              <div className="absolute inset-0 flex pointer-events-none">
                                {calendarDays.map((d, idx) => (
                                  <div
                                    key={idx}
                                    style={{ width: `${dayColWidth}px` }}
                                    className={`shrink-0 h-full border-r border-slate-100 ${
                                      d.isToday ? 'bg-blue-50/20' : d.isWeekend ? 'bg-slate-50/40' : ''
                                    }`}
                                  />
                                ))}
                              </div>

                              {/* Gantt Operation Bar */}
                              <div
                                onClick={() => setSelectedTask(op)}
                                style={{
                                  left: `${op.startDayIndex * dayColWidth + 4}px`,
                                  width: `${Math.max(1, op.durationDays) * dayColWidth - 8}px`,
                                }}
                                className={`absolute h-7 rounded border px-2 flex items-center justify-between text-xs font-mono cursor-pointer transition-all z-10 ${
                                  getStatusColor(op.status, op.isBlocked)
                                } ${isOpSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {op.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-100" />
                                  ) : op.status === 'IN_PROGRESS' ? (
                                    <Clock className="w-3.5 h-3.5 shrink-0 text-amber-100 animate-spin" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-white/70 shrink-0" />
                                  )}
                                  <span className="truncate text-[11px] font-medium">{op.operationCode}</span>
                                </div>

                                <span className="text-[10px] opacity-90 truncate ml-1 font-mono">
                                  {op.completedQty}/{op.targetQty}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Work Center Lanes View */
              <div className="divide-y divide-slate-100">
                {workCenterSchedules.map(({ workCenter, operations }) => (
                  <div key={workCenter.id} className="h-16 flex items-center relative">
                    {/* Day Grid Lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {calendarDays.map((d, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${dayColWidth}px` }}
                          className={`shrink-0 h-full border-r border-slate-100 ${
                            d.isToday ? 'bg-blue-50/20' : d.isWeekend ? 'bg-slate-50/40' : ''
                          }`}
                        />
                      ))}
                    </div>

                    {/* Bars on this work center */}
                    {operations.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => setSelectedTask(op)}
                        style={{
                          left: `${op.startDayIndex * dayColWidth + 4}px`,
                          width: `${Math.max(1, op.durationDays) * dayColWidth - 8}px`,
                        }}
                        className={`absolute h-8 rounded border px-2 flex items-center justify-between text-xs font-mono cursor-pointer transition-all z-10 ${
                          getStatusColor(op.status, op.isBlocked)
                        }`}
                      >
                        <span className="truncate text-[11px] font-bold">{op.orderNumber} - {op.operationCode}</span>
                        <span className="text-[10px] opacity-90">{op.completedQty}/{op.targetQty}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend strip at bottom */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span>Ready / Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 border border-slate-400" />
              <span>Pending / Blocked</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Click any task bar to inspect work order dependencies, operator, and routing parameters.
          </div>
        </div>
      </div>

      {/* Task Detail Inspector Modal / Drawer */}
      {selectedTask && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs font-mono text-xs space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{selectedTask.operationCode}</span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-blue-700 font-semibold">{selectedTask.orderNumber}</span>
                <StatusBadge status={selectedTask.status} />
              </div>
              <h4 className="text-xs font-sans text-slate-700 font-semibold mt-1">
                {selectedTask.name}
              </h4>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">Work Center</span>
              <strong className="text-slate-900">{selectedTask.workCenterCode}</strong>
              <div className="text-[10px] text-slate-500 font-sans">{selectedTask.workCenterName}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Operator</span>
              <strong className="text-slate-900">{selectedTask.assignedOperator || 'Unassigned'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Planned Time</span>
              <strong className="text-slate-900">{selectedTask.durationDays} Days ({selectedTask.setupTimeMinutes}m setup)</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Completed / Target</span>
              <strong className="text-emerald-700 tabular-nums">
                {selectedTask.completedQty} / {selectedTask.targetQty} PCS
              </strong>
            </div>
          </div>

          {/* Predecessor & Successor Dependency Status (Page 96) */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5 font-sans">
            <div className="text-xs font-bold text-slate-800 font-mono flex items-center gap-2">
              <GitCommit className="w-3.5 h-3.5 text-blue-600" />
              <span>Routing Dependency Chain:</span>
            </div>
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 font-mono">
              {selectedTask.predecessorOp ? (
                <span>
                  Predecessor: <strong className="text-slate-900">{selectedTask.predecessorOp}</strong>{' '}
                  {selectedTask.isBlocked ? (
                    <span className="text-rose-600 font-bold">(Incomplete - Operation BLOCKED)</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">(COMPLETED ✓)</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500">First Operation in Routing (No Predecessor required)</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 font-sans">
            <button
              onClick={() => {
                onSelectOrder(selectedTask.orderId);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              Inspect Manufacturing Order
            </button>
            <button
              onClick={() => {
                onNavigateToShopFloor(selectedTask.workCenterCode);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-blue-400" />
              <span>Launch in Shop Floor Kiosk</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
