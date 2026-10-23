import React, { useState } from 'react';
import {
  Gauge,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { WorkCenter } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface CapacityViewProps {
  workCenters: WorkCenter[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
}

export const CapacityView: React.FC<CapacityViewProps> = ({
  workCenters,
  activeSubTab,
  onSelectSubTab,
}) => {
  // Page 97 Capacity Simulation data:
  // Available minutes: 480 minutes/day (8h shift)
  // Required minutes: 520 minutes
  // Load = 108.3%
  const [selectedWc, setSelectedWc] = useState<string>('WC-CUT-01');
  const [simShiftHours, setSimShiftHours] = useState<number>(8);
  const [simRequiredMinutes, setSimRequiredMinutes] = useState<number>(520);

  const availableMinutes = simShiftHours * 60;
  const loadPct = Number(((simRequiredMinutes / availableMinutes) * 100).toFixed(1));
  const isOverloaded = loadPct > 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Capacity & Rough-Cut Scheduling</h2>
          <p className="text-xs text-slate-500">
            Workload vs available machine capacity minutes, bottleneck detection, and shift leveling.
          </p>
        </div>
      </div>

      {/* Page 97 Capacity Overload Simulation Banner */}
      <div className="bg-slate-900 text-slate-200 rounded-lg p-5 space-y-3 font-mono text-xs border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-amber-400 font-bold uppercase tracking-wider">
            PDF Section 28: Capacity Overload Blueprint Case Study
          </span>
          <span className="text-slate-400 text-[11px]">Formula Verification</span>
        </div>

        <div className="text-slate-300 font-sans text-xs leading-relaxed">
          <p>
            <strong>Baseline Scenario:</strong> Work center has 480 available minutes/day (8 hr shift). Planned operations require 520 minutes.
            Load = <code>520 ÷ 480 = 108.3%</code>.
          </p>
          <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Available Daily Time</span>
                <span className="text-base font-bold text-white font-mono">{availableMinutes} min ({simShiftHours} hrs)</span>
              </div>
              <div className="text-slate-600">/</div>
              <div>
                <span className="text-slate-400 block text-[11px]">Required Operation Load</span>
                <span className="text-base font-bold text-amber-400 font-mono">{simRequiredMinutes} min</span>
              </div>
              <div className="text-slate-600">=</div>
              <div>
                <span className="text-slate-400 block text-[11px]">Capacity Load %</span>
                <span className={`text-xl font-bold font-mono ${isOverloaded ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {loadPct}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimShiftHours(simShiftHours === 8 ? 10 : 8)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors font-sans"
              >
                {simShiftHours === 8 ? 'Simulate 2h Overtime (10h Shift)' : 'Reset to Standard (8h Shift)'}
              </button>
            </div>
          </div>
          {isOverloaded ? (
            <p className="text-[11px] text-rose-300 mt-2">
              ⚠ System flags OVERLOAD: Planner must either route to alternative work center (WC-CUT-01-ALT), add shift hours, or reschedule downstream operations.
            </p>
          ) : (
            <p className="text-[11px] text-emerald-300 mt-2">
              ✓ Capacity is balanced with overtime shift (Load: {loadPct}%).
            </p>
          )}
        </div>
      </div>

      {/* Work Centers Capacity Load Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Work Centers Weekly Load vs Available Capacity</span>
          <span className="text-slate-500">Based on active routing operations for W44</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold">
              <th className="py-2.5 px-4">Center Code & Name</th>
              <th className="py-2.5 px-4">Department</th>
              <th className="py-2.5 px-4 text-right">Available Hrs/Wk</th>
              <th className="py-2.5 px-4 text-right">Required Load Hrs</th>
              <th className="py-2.5 px-4 text-right">Utilization %</th>
              <th className="py-2.5 px-4">Load Visualization</th>
              <th className="py-2.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {workCenters.map((wc, idx) => {
              const avail = wc.capacityHoursPerDay * 5;
              const loadHrs = idx === 1 ? 42.5 : idx === 0 ? 36.8 : 28.5;
              const util = Math.round((loadHrs / avail) * 100);
              const isOver = util > 90;

              return (
                <tr key={wc.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans">
                    <span className="font-mono font-bold text-slate-900 block">{wc.code}</span>
                    <span className="text-[11px] text-slate-500">{wc.name}</span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600">{wc.department}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-800">{avail}h</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-800 font-semibold">{loadHrs}h</td>
                  <td className={`py-3 px-4 text-right tabular-nums font-bold ${
                    isOver ? 'text-amber-700' : 'text-slate-900'
                  }`}>
                    {util}%
                  </td>
                  <td className="py-3 px-4 w-44">
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div
                        className={`h-full ${util > 90 ? 'bg-amber-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={isOver ? 'OVERLOADED' : 'OPTIMAL'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
