import React, { useState, useMemo } from 'react';
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
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createProgressColumn,
  createStatusColumn,
} from '../../components/data-grid';

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
  const [selectedWc, setSelectedWc] = useState<string>('WC-CUT-01');
  const [simShiftHours, setSimShiftHours] = useState<number>(8);
  const [simRequiredMinutes, setSimRequiredMinutes] = useState<number>(520);

  const availableMinutes = simShiftHours * 60;
  const loadPct = Number(((simRequiredMinutes / availableMinutes) * 100).toFixed(1));
  const isOverloaded = loadPct > 100;

  interface CapacityRow {
    id: string;
    code: string;
    name: string;
    department: string;
    availHrs: number;
    loadHrs: number;
    utilization: number;
    status: string;
  }

  const capacityData = useMemo<CapacityRow[]>(() => {
    return workCenters.map((wc, idx) => {
      const avail = wc.capacityHoursPerDay * 5;
      const loadHrs = idx === 1 ? 42.5 : idx === 0 ? 36.8 : 28.5;
      const util = Math.round((loadHrs / avail) * 100);
      const isOver = util > 90;
      return {
        id: wc.id,
        code: wc.code,
        name: wc.name,
        department: wc.department,
        availHrs: avail,
        loadHrs,
        utilization: util,
        status: isOver ? 'OVERLOADED' : 'OPTIMAL',
      };
    });
  }, [workCenters]);

  const capacityColumns = useMemo<GridColumn<CapacityRow>[]>(
    () => [
      createTextColumn<CapacityRow>('code', 'Center Code', { isCode: true, pinned: 'left', width: 130 }),
      createTextColumn<CapacityRow>('name', 'Name', { width: 220 }),
      createTextColumn<CapacityRow>('department', 'Department', { width: 160 }),
      createNumberColumn<CapacityRow>('availHrs', 'Available Hrs/Wk', { uomText: 'h', width: 140 }),
      createNumberColumn<CapacityRow>('loadHrs', 'Required Load', { uomText: 'h', width: 140 }),
      {
        field: 'utilization',
        headerName: 'Utilization %',
        type: 'number',
        width: 120,
        align: 'right',
        renderCell: ({ value }) => (
          <span
            className={`font-mono font-bold tabular-nums ${
              value > 90 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {value}%
          </span>
        ),
      },
      createProgressColumn<CapacityRow>('utilization', 'Load Bar', { max: 100, width: 150 }),
      createStatusColumn<CapacityRow>('status', 'Capacity State', {
        width: 140,
        filterOptions: [
          { label: 'OPTIMAL', value: 'OPTIMAL' },
          { label: 'OVERLOADED', value: 'OVERLOADED' },
        ],
      }),
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Capacity & Rough-Cut Scheduling
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Workload vs available machine capacity minutes, bottleneck detection, and shift leveling.
          </p>
        </div>
      </div>

      {/* Page 97 Capacity Overload Simulation Banner */}
      <div className="bg-slate-900 text-slate-200 rounded-lg p-5 space-y-3 font-mono text-xs border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
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
                <span className="text-base font-bold text-white font-mono">
                  {availableMinutes} min ({simShiftHours} hrs)
                </span>
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors font-sans shadow-2xs"
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

      {/* Work Centers Capacity Load Table with EnterpriseDataGrid */}
      <div className="space-y-2">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Work Centers Weekly Load vs Available Capacity
          </span>
          <span className="text-slate-500 dark:text-slate-400">Based on active routing operations for W44</span>
        </div>

        <EnterpriseDataGrid<CapacityRow>
          data={capacityData}
          columns={capacityColumns}
          pagination
          searchable
          filtering
          sorting
          columnResizing
          exportable
          exportFileName="work_centers_capacity_load"
          density="compact"
        />
      </div>
    </div>
  );
};
