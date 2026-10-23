import React, { useState } from 'react';
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Maintenance & Equipment Telemetry</h2>
          <p className="text-xs text-slate-500">
            Work center machine status, unscheduled breakdown logging, and separate tracking of lost capacity time.
          </p>
        </div>

        <button
          onClick={() => setShowBreakdownModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
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
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Downtime Events & Maintenance Tickets</span>
          <span className="text-slate-500">{downtimeEvents.length} recorded events</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
              <th className="py-2.5 px-4">Work Center</th>
              <th className="py-2.5 px-4">Equipment</th>
              <th className="py-2.5 px-4">Maintenance Ticket</th>
              <th className="py-2.5 px-4 text-right">Lost Time</th>
              <th className="py-2.5 px-4">Breakdown Reason</th>
              <th className="py-2.5 px-4">Start Time</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {downtimeEvents.map((evt) => (
              <tr key={evt.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-900">{evt.workCenterCode}</td>
                <td className="py-3 px-4 font-sans text-slate-800">{evt.equipmentName}</td>
                <td className="py-3 px-4 text-blue-600 font-semibold">{evt.maintenanceTicketNo}</td>
                <td className="py-3 px-4 text-right tabular-nums text-rose-700 font-bold">
                  {evt.durationMinutes} mins
                </td>
                <td className="py-3 px-4 font-sans text-slate-700">{evt.reason}</td>
                <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">{evt.startTime}</td>
                <td className="py-3 px-4 font-sans">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    evt.status === 'DOWN' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {evt.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-sans">
                  {evt.status === 'DOWN' ? (
                    <button
                      onClick={() => onResolveBreakdown(evt.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                    >
                      Resolve & Resume
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs">Closed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Breakdown Report Modal */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Report Station Breakdown (Page 101)</h3>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Affected Work Center</label>
                <select
                  value={selectedWc}
                  onChange={(e) => setSelectedWc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-medium"
                >
                  {workCenters.map((wc) => (
                    <option key={wc.id} value={wc.code}>
                      {wc.code} ({wc.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Breakdown Reason</label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Estimated Downtime Minutes</label>
                <input
                  type="number"
                  min="5"
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulateBreakdown}
                  className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700 transition-colors"
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
