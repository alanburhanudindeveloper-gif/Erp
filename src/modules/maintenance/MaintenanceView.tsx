import React, { useState, useMemo } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  RotateCcw,
  Cpu,
} from 'lucide-react';
import { WorkCenter, DowntimeEvent } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createDateColumn,
  createStatusColumn,
  createActionColumn,
} from '../../components/data-grid';

interface MaintenanceViewProps {
  workCenters: WorkCenter[];
  downtimeEvents: DowntimeEvent[];
  onReportBreakdown: (wcCode: string, reason: string, equipment: string, duration: number) => void;
  onResolveBreakdown: (eventId: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  workCenters,
  downtimeEvents,
  onReportBreakdown,
  onResolveBreakdown,
}) => {
  const [selectedWc, setSelectedWc] = useState('WC-CUT-01');
  const [reasonInput, setReasonInput] = useState('Tooling Breakage & Spindle Overcurrent (DOWN-TOOL)');
  const [durationInput, setDurationInput] = useState(45);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const handleSimulateBreakdown = () => {
    onReportBreakdown(
      selectedWc,
      reasonInput,
      'Machine M01 (CNC Laser Saw)',
      durationInput
    );
    setShowBreakdownModal(false);
  };

  const downtimeColumns = useMemo<GridColumn<DowntimeEvent>[]>(
    () => [
      createTextColumn<DowntimeEvent>('workCenterCode', 'Work Center', {
        isCode: true,
        pinned: 'left',
        width: 140,
      }),
      createTextColumn<DowntimeEvent>('equipmentName', 'Equipment', { width: 220 }),
      createTextColumn<DowntimeEvent>('maintenanceTicketNo', 'Maintenance Ticket', {
        isCode: true,
        width: 170,
      }),
      createNumberColumn<DowntimeEvent>('durationMinutes', 'Lost Time', {
        uomText: 'mins',
        width: 120,
        renderCell: ({ value }) => (
          <span className="font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
            {value} mins
          </span>
        ),
      }),
      createTextColumn<DowntimeEvent>('reason', 'Breakdown Reason', { width: 240 }),
      createDateColumn<DowntimeEvent>('startTime', 'Start Time', { isDateTime: true, width: 140 }),
      createStatusColumn<DowntimeEvent>('status', 'Station Status', {
        width: 130,
        filterOptions: [
          { label: 'DOWN', value: 'DOWN' },
          { label: 'RESOLVED', value: 'RESOLVED' },
        ],
      }),
      createActionColumn<DowntimeEvent>(
        ({ row }) => {
          if (row.status === 'DOWN') {
            return (
              <button
                onClick={() => onResolveBreakdown(row.id)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-2xs whitespace-nowrap"
              >
                Resolve & Resume
              </button>
            );
          }
          return <span className="text-slate-400 text-xs">Closed</span>;
        },
        { width: 150, headerName: 'Action' }
      ),
    ],
    [onResolveBreakdown]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Maintenance & Equipment Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Work center machine status, unscheduled breakdown logging, and separate tracking of lost capacity time.
          </p>
        </div>

        <button
          onClick={() => setShowBreakdownModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Machine Breakdown</span>
        </button>
      </div>

      {/* Page 101 Breakdown Flow Callout */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-amber-400 font-bold uppercase tracking-wider">
            PDF Section 32: Machine Breakdown Blueprint Specification
          </span>
          <span className="text-slate-400 text-[11px]">Time Segregation Rule</span>
        </div>
        <p className="text-slate-300 font-sans leading-relaxed">
          <strong>Rule:</strong> When operator reports breakdown on Machine M01, work center status transitions to <code>DOWN</code> and links maintenance ticket.
          Upon repair completion, WO resumes. <strong>Crucially:</strong> Actual production run duration and lost downtime remain strictly separate in accounting and OEE calculations!
        </p>
      </div>

      {/* Machine Breakdown Log Table */}
      <div className="space-y-2">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Downtime Events & Maintenance Tickets
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-mono">
            {downtimeEvents.length} recorded events
          </span>
        </div>

        <EnterpriseDataGrid<DowntimeEvent>
          data={downtimeEvents}
          columns={downtimeColumns}
          pagination
          searchable
          filtering
          sorting
          columnResizing
          exportable
          exportFileName="machine_downtime_events"
          density="compact"
        />
      </div>

      {/* Breakdown Report Modal */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Report Station Breakdown (Page 101)
              </h3>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Affected Work Center
                </label>
                <select
                  value={selectedWc}
                  onChange={(e) => setSelectedWc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none font-medium"
                >
                  {workCenters.map((wc) => (
                    <option key={wc.id} value={wc.code}>
                      {wc.code} ({wc.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Breakdown Reason
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Estimated Downtime Minutes
                </label>
                <input
                  type="number"
                  min="5"
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 font-medium rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulateBreakdown}
                  className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700 transition-colors shadow-2xs"
                >
                  Trigger Breakdown Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
