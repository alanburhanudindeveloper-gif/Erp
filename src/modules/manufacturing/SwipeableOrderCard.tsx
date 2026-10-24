import React, { useState, useRef, useCallback } from 'react';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  Flame,
  Clock,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Send,
  Sparkles,
} from 'lucide-react';
import { ProductionOrder, ProductionOrderOperation } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export interface SwipeableOrderCardProps {
  order: ProductionOrder;
  operation?: ProductionOrderOperation;
  currentOperator: string;
  onQuickStart: (orderId: string, seq: number) => void;
  onQuickComplete: (orderId: string, seq: number) => void;
  onQuickRelease?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const SwipeableOrderCard: React.FC<SwipeableOrderCardProps> = ({
  order,
  operation,
  currentOperator,
  onQuickStart,
  onQuickComplete,
  onQuickRelease,
  onSelectOrder,
}) => {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [actionTriggered, setActionTriggered] = useState<string | null>(null);

  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 75; // Pixels required to trigger swipe action
  const MAX_DRAG = 140; // Max visual stretch

  // Determine current state of this operation / order
  const opStatus = operation?.status || (order.status === 'RELEASED' ? 'READY' : order.status);
  const isPlanned = order.status === 'PLANNED';
  const isReady = opStatus === 'READY' || opStatus === 'PLANNED';
  const isInProgress = opStatus === 'IN_PROGRESS';
  const isCompleted = opStatus === 'COMPLETED' || order.status === 'COMPLETED' || order.status === 'CLOSED';

  // Right swipe configuration (Green action: Start / Release)
  const rightActionLabel = isPlanned ? 'Release MO' : isInProgress ? 'In Run' : 'Start Run';
  const canSwipeRight = !isCompleted && !isInProgress;

  // Left swipe configuration (Blue action: Complete / Advance)
  const leftActionLabel = isInProgress ? 'Complete Op' : isCompleted ? 'Completed' : 'Advance Next';
  const canSwipeLeft = !isCompleted;

  // Handle Drag / Touch start
  const handleStart = (clientX: number) => {
    if (isCompleted) return;
    startXRef.current = clientX;
    currentXRef.current = clientX;
    setIsDragging(true);
  };

  // Handle Drag / Touch move
  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    currentXRef.current = clientX;
    const diff = clientX - startXRef.current;

    // Apply friction and bounds
    let boundedDiff = diff;
    if (diff > 0) {
      if (!canSwipeRight) boundedDiff = 0;
      else boundedDiff = Math.min(MAX_DRAG, diff * 0.85);
    } else {
      if (!canSwipeLeft) boundedDiff = 0;
      else boundedDiff = Math.max(-MAX_DRAG, diff * 0.85);
    }

    setDragOffset(boundedDiff);
  };

  // Handle Drag / Touch end
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset >= SWIPE_THRESHOLD && canSwipeRight) {
      // Trigger Right Swipe Action
      if (isPlanned && onQuickRelease) {
        setActionTriggered('RELEASED');
        onQuickRelease(order.id);
      } else if (operation) {
        setActionTriggered('STARTED');
        onQuickStart(order.id, operation.sequence);
      } else if (order.operations && order.operations.length > 0) {
        setActionTriggered('STARTED');
        onQuickStart(order.id, order.operations[0].sequence);
      }
    } else if (dragOffset <= -SWIPE_THRESHOLD && canSwipeLeft) {
      // Trigger Left Swipe Action
      if (operation) {
        setActionTriggered('COMPLETED');
        onQuickComplete(order.id, operation.sequence);
      } else if (order.operations && order.operations.length > 0) {
        const targetOp = order.operations.find((o) => o.status === 'IN_PROGRESS') || order.operations[0];
        setActionTriggered('COMPLETED');
        onQuickComplete(order.id, targetOp.sequence);
      }
    }

    // Reset offset with spring-back animation
    setDragOffset(0);

    if (actionTriggered) {
      setTimeout(() => setActionTriggered(null), 1800);
    }
  };

  // Progress percentage
  const totalTarget = operation?.targetQty || order.targetQuantity;
  const completedTarget = operation?.completedQty || order.goodQuantity;
  const progressPct = Math.min(100, Math.round((completedTarget / (totalTarget || 1)) * 100));

  const isSwipingRight = dragOffset > 20;
  const isSwipingLeft = dragOffset < -20;
  const isRightThresholdPassed = dragOffset >= SWIPE_THRESHOLD;
  const isLeftThresholdPassed = dragOffset <= -SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-lg shadow-xs select-none group touch-pan-y">
      {/* 1. Underlying Action Tray (Revealed on Swipe) */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
        {/* Right Swipe Tray (Green - Start / Release) */}
        <div
          className={`h-full flex items-center pl-4 transition-colors ${
            isRightThresholdPassed ? 'bg-emerald-600 text-white' : 'bg-emerald-500/80 text-white'
          }`}
          style={{ width: '50%', opacity: dragOffset > 0 ? 1 : 0 }}
        >
          <div className="flex items-center gap-2 font-bold text-xs">
            {isPlanned ? <Send className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRightThresholdPassed ? 'RELEASE TO START' : rightActionLabel}</span>
          </div>
        </div>

        {/* Left Swipe Tray (Blue - Complete / Finish) */}
        <div
          className={`h-full flex items-center justify-end pr-4 transition-colors ${
            isLeftThresholdPassed ? 'bg-blue-600 text-white' : 'bg-blue-500/80 text-white'
          }`}
          style={{ width: '50%', opacity: dragOffset < 0 ? 1 : 0 }}
        >
          <div className="flex items-center gap-2 font-bold text-xs">
            <span>{isLeftThresholdPassed ? 'RELEASE TO COMPLETE' : leftActionLabel}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Top-Level Draggable Card */}
      <div
        ref={cardRef}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className={`relative z-10 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-shadow ${
          isDragging ? 'shadow-lg cursor-grabbing' : 'cursor-grab hover:shadow-xs'
        } ${actionTriggered ? 'ring-2 ring-emerald-500' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Drag grip indicator & Order Details */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-1 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors shrink-0">
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                  {order.orderNumber}
                </span>
                {operation && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Seq {operation.sequence}: {operation.name}
                    </span>
                  </>
                )}
                <StatusBadge status={operation ? operation.status : order.status} />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Product: <strong className="text-slate-700 dark:text-slate-300">{order.productName}</strong> ({order.productSku})
              </div>

              {/* Progress Bar & Output details */}
              <div className="mt-2.5 flex items-center gap-3 w-full">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-xs">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progressPct >= 100
                        ? 'bg-emerald-500'
                        : isInProgress
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  {completedTarget} / {totalTarget} PCS ({progressPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Fallback Touch/Click Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-center">
            {/* Quick Action Button for non-touch / click users */}
            {canSwipeRight && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPlanned && onQuickRelease) onQuickRelease(order.id);
                  else if (operation) onQuickStart(order.id, operation.sequence);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded flex items-center gap-1 transition-colors"
                title="Click or Swipe Right to Start"
              >
                <Play className="w-3 h-3 text-emerald-600" />
                <span>Start</span>
              </button>
            )}

            {isInProgress && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (operation) onQuickComplete(order.id, operation.sequence);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded flex items-center gap-1 transition-colors"
                title="Click or Swipe Left to Complete"
              >
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>Complete</span>
              </button>
            )}

            {onSelectOrder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOrder(order.id);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                title="Open Details"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Swipe Feedback Hints during drag */}
        {isDragging && (
          <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className={isSwipingRight ? 'text-emerald-600 font-bold' : ''}>
              👉 Swipe Right: {rightActionLabel}
            </span>
            <span className={isSwipingLeft ? 'text-blue-600 font-bold' : ''}>
              👈 Swipe Left: {leftActionLabel}
            </span>
          </div>
        )}

        {actionTriggered && (
          <div className="absolute inset-0 bg-emerald-600/95 text-white flex items-center justify-center font-bold text-xs gap-1.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4" />
            <span>Action Registered: {actionTriggered}</span>
          </div>
        )}
      </div>
    </div>
  );
};
