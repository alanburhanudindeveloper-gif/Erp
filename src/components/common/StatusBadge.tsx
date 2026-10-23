import React from 'react';

export type StatusType =
  | 'DRAFT'
  | 'PLANNED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'RUNNING'
  | 'READY'
  | 'COMPLETED'
  | 'CLOSED'
  | 'SUFFICIENT'
  | 'SHORTAGE'
  | 'PARTIAL'
  | 'PASSED'
  | 'FAILED'
  | 'AVAILABLE'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'OPTIMAL'
  | 'OVERLOADED'
  | 'UNDERLOADED'
  | 'ACTIVE'
  | 'CONFIRMED'
  | 'PENDING';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', label }) => {
  const normalized = status.toUpperCase();
  const displayLabel = label || normalized.replace('_', ' ');

  // Clean unboxed text with subtle semantic indicator dot
  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700';

  switch (normalized) {
    case 'RELEASED':
    case 'READY':
    case 'AVAILABLE':
    case 'SUFFICIENT':
    case 'CONFIRMED':
    case 'OPTIMAL':
      dotColor = 'bg-blue-600';
      textColor = 'text-blue-700';
      break;

    case 'IN_PROGRESS':
    case 'RUNNING':
    case 'ACTIVE':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800';
      break;

    case 'COMPLETED':
    case 'CLOSED':
    case 'PASSED':
      dotColor = 'bg-emerald-600';
      textColor = 'text-emerald-700';
      break;

    case 'SHORTAGE':
    case 'FAILED':
    case 'OVERLOADED':
    case 'OFFLINE':
      dotColor = 'bg-rose-600';
      textColor = 'text-rose-700';
      break;

    case 'MAINTENANCE':
    case 'PARTIAL':
    case 'UNDERLOADED':
      dotColor = 'bg-amber-600';
      textColor = 'text-amber-700';
      break;

    case 'DRAFT':
    case 'PLANNED':
    case 'PENDING':
    default:
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-600';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-tight whitespace-nowrap ${textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
};
