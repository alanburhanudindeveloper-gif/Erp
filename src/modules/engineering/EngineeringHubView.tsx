import React, { useState } from 'react';
import { useErpStore } from '../../lib/services/manufacturingService';
import {
  EngineeringDrawing,
  EngineeringSpecification,
  ToolingItem,
  WorkInstruction,
  QcPlan,
  EngineeringChangeRequest,
  ToolStatus,
} from '../../types';
import {
  Wrench,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Layers,
  ArrowRight,
  Plus,
  ShieldCheck,
  Calculator,
  Compass,
  Cpu,
  Eye,
  Sliders,
  History,
  Info,
} from 'lucide-react';

interface EngineeringHubViewProps {
  initialSubTab?: string;
}

export const EngineeringHubView: React.FC<EngineeringHubViewProps> = ({
  initialSubTab = 'drawings',
}) => {
  const {
    state,
    createEngineeringDrawing,
    approveEngineeringDrawing,
    createEngineeringSpecification,
    approveEngineeringSpecification,
    createToolingItem,
    updateToolingStatus,
    createWorkInstruction,
    approveWorkInstruction,
    createQcPlan,
    approveQcPlan,
    decideOpenWorkOrderEcr,
    approveEngineeringChange,
    releaseEngineeringChange,
  } = useErpStore();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [selectedProductId, setSelectedProductId] = useState<string>('prd-abc-100');

  // Cycle Time Calculator state
  const [calcQuantity, setCalcQuantity] = useState<number>(500);
  const [calcSetupMinutes, setCalcSetupMinutes] = useState<number>(30);
  const [calcCycleSeconds, setCalcCycleSeconds] = useState<number>(45);
  const [calcEfficiencyPct, setCalcEfficiencyPct] = useState<number>(92);
  const [calcAllowancePct, setCalcAllowancePct] = useState<number>(5);

  // ECR release modal/form state
  const [effectiveDateInput, setEffectiveDateInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // New Drawing Modal
  const [showDwgModal, setShowDwgModal] = useState(false);
  const [dwgForm, setDwgForm] = useState({
    drawingNumber: 'DWG-ABC-100-B',
    revision: 'Rev B',
    title: 'Marine Enclosure Gland Flange Modification',
    cadModelType: '3D_STEP' as '2D_DWG' | '3D_STEP' | 'PDF_SCHEMATIC',
    fileReference: 'CAD-GW-CHASSIS-R02.step',
    description: 'Updated chassis with dual M16 waterproof cable glands and anti-vibration flange.',
  });

  // Calculate cycle time deterministically
  const grossProductionSeconds = (calcQuantity * calcCycleSeconds) / (calcEfficiencyPct / 100);
  const grossProductionMinutes = grossProductionSeconds / 60;
  const allowanceMinutes = grossProductionMinutes * (calcAllowancePct / 100);
  const totalStandardProductionMinutes = Math.ceil(
    calcSetupMinutes + grossProductionMinutes + allowanceMinutes
  );
  const totalStandardHours = (totalStandardProductionMinutes / 60).toFixed(2);

  const selectedProduct =
    state.products.find((p) => p.id === selectedProductId) || state.products[0];

  const activeEcr = state.engineeringChanges[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/50 rounded-xl p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Phase 8 • Engineering Hub & Product Release
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Deterministic Revision Control
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-400" />
              Engineering Documents, Tooling Master & Change Control (ECR)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Immutable master data definition connecting CAD Blueprints, Electrical Specs, Tooling Lifecycles, Standard Work Instructions, QC Plans, and 360° Engineering Change impact analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400">Target Product:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
            >
              {state.products.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.sku} — {p.name} ({p.currentRevision || 'Rev A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800 text-sm">
          {[
            { id: 'drawings', label: 'CAD Drawings & Blueprints', icon: FileText },
            { id: 'specifications', label: 'Engineering Specifications', icon: ShieldCheck },
            { id: 'tooling', label: 'Tooling Master (Molds & Jigs)', icon: Wrench },
            { id: 'work-instructions', label: 'Work Instructions (WI / SOP)', icon: Cpu },
            { id: 'qc-plans', label: 'Quality Control Plans (QCP)', icon: CheckCircle2 },
            { id: 'cycle-times', label: 'Cycle Time Engine', icon: Calculator },
            { id: 'ecr', label: 'Engineering Change Requests (ECR)', icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow font-semibold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. DRAWINGS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'drawings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Engineering Drawings & CAD Models
              </h3>
              <p className="text-xs text-slate-500">
                Revision-controlled blueprints with CAD file references and formal approval sign-offs.
              </p>
            </div>
            <button
              onClick={() => setShowDwgModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Engineering Drawing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.drawings.map((dwg) => (
              <div
                key={dwg.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {dwg.drawingNumber}
                    </span>
                    <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
                      {dwg.revision}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {dwg.title}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dwg.status === 'RELEASED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : dwg.status === 'REVIEW'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    {dwg.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {dwg.description}
                </p>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{dwg.cadModelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Ref:</span>
                    <span className="text-blue-600 dark:text-blue-400 truncate max-w-[180px]">{dwg.fileReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective:</span>
                    <span className="text-slate-600 dark:text-slate-300">{dwg.effectiveDate || 'Pending'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span>Author: {dwg.createdBy.split(' ')[0]}</span>
                  {dwg.status === 'REVIEW' && (
                    <button
                      onClick={() => approveEngineeringDrawing(dwg.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                    >
                      Approve & Release
                    </button>
                  )}
                  {dwg.status === 'RELEASED' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Released
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. SPECIFICATIONS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'specifications' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Controlled Engineering Specifications & Tolerances
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Technical product requirements that establish the basis for incoming, in-process, and final inspection characteristics.
            </p>

            <div className="space-y-6">
              {state.specifications.map((spec) => (
                <div
                  key={spec.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-850/50 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          {spec.specNumber}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">
                          {spec.revision}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {spec.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {spec.content}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {spec.status}
                    </span>
                  </div>

                  {/* Critical Parameters Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Critical Parameter</th>
                          <th className="p-2.5">Nominal Specification</th>
                          <th className="p-2.5">Acceptable Tolerance Band</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {spec.criticalParameters.map((param, idx) => (
                          <tr key={idx} className="bg-white dark:bg-slate-900">
                            <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                              {param.parameter}
                            </td>
                            <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400">
                              {param.nominal}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">
                              {param.tolerance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. TOOLING MASTER TAB */}
      {/* ==================================================================== */}
      {activeTab === 'tooling' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manufacturing Tooling Master (Molds, Jigs, Fixtures, Dies)
                </h3>
                <p className="text-xs text-slate-500">
                  Tracks qualification status, shot life wear counters, preventative maintenance intervals, and tool room locations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.toolingItems.map((tool) => {
                const shotPct = Math.min(100, (tool.currentShots / tool.expectedLifeShots) * 100);
                return (
                  <div
                    key={tool.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {tool.toolId}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {tool.type}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {tool.name}
                        </h4>
                        <div className="text-xs text-slate-500">
                          Product: {tool.productSku} • Rev: {tool.revision}
                        </div>
                      </div>

                      <select
                        value={tool.status}
                        onChange={(e) => updateToolingStatus(tool.id, e.target.value as ToolStatus)}
                        className={`text-xs font-bold px-2 py-1 rounded cursor-pointer border ${
                          tool.status === 'READY'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : tool.status === 'IN_USE'
                            ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <option value="DESIGN">DESIGN</option>
                        <option value="FABRICATION">FABRICATION</option>
                        <option value="QUALIFICATION">QUALIFICATION</option>
                        <option value="READY">READY</option>
                        <option value="IN_USE">IN_USE</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="RETIRED">RETIRED</option>
                      </select>
                    </div>

                    {/* Shot Life Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Shot Life Usage</span>
                        <span className="font-mono font-bold">
                          {tool.currentShots.toLocaleString()} / {tool.expectedLifeShots.toLocaleString()} ({shotPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            shotPct > 80 ? 'bg-rose-500' : shotPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${shotPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{tool.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacity/Shift:</span>
                        <span className="font-bold">{tool.capacityPerShift} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Qualified By:</span>
                        <span className="text-slate-600 dark:text-slate-300">{tool.qualifiedBy || 'Pending'}</span>
                      </div>
                    </div>

                    {tool.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Note: {tool.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. WORK INSTRUCTIONS (WI / SOP) TAB */}
      {/* ==================================================================== */}
      {activeTab === 'work-instructions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              Standard Work Instructions (WI / SOP) & Operator Procedures
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Version-controlled assembly sequences, safety equipment mandates, and in-line quality checkpoints.
            </p>

            <div className="space-y-6">
              {state.workInstructions.map((wi) => (
                <div
                  key={wi.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-850/50 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {wi.wiNumber}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">
                          {wi.revision}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Operation {wi.operationSeq}: {wi.operationName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                        {wi.title}
                      </h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Work Center: <span className="font-semibold text-slate-700 dark:text-slate-300">{wi.workCenterName}</span> • Approved by: {wi.approvedBy}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {wi.status}
                    </span>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Standard Sequential Steps
                    </div>
                    <div className="space-y-1">
                      {wi.instructions.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Quality Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs">
                      <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Mandatory Safety Equipment & Precautions
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-400">
                        {wi.safetyNotes.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In-Process Quality Checkpoints
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-emerald-700 dark:text-emerald-400">
                        {wi.qualityCheckpoints.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. QUALITY CONTROL PLANS (QCP) TAB */}
      {/* ==================================================================== */}
      {activeTab === 'qc-plans' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Quality Control Plans (QC Plan) & Characteristic Tolerances
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Defines inspection operations, nominal targets, upper/lower tolerances, sampling frequency, and containment reaction plans.
            </p>

            <div className="space-y-6">
              {state.qcPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-850/50 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {plan.planNumber}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">
                          {plan.revision}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Product: {plan.productSku} ({plan.productRevision})
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                        Operation {plan.operationSeq}: {plan.operationName}
                      </h4>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {plan.status}
                    </span>
                  </div>

                  {/* Characteristic Matrix */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Inspection Characteristic</th>
                          <th className="p-2.5">Specification & Tolerance</th>
                          <th className="p-2.5">Measurement Equipment</th>
                          <th className="p-2.5">Sampling Frequency</th>
                          <th className="p-2.5">Reaction Plan (Out of Spec)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {plan.characteristics.map((char) => (
                          <tr key={char.id} className="bg-white dark:bg-slate-900">
                            <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                              {char.characteristic}
                            </td>
                            <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400">
                              {char.specification}
                            </td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300">
                              {char.equipment}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">
                              {char.samplingFrequency}
                            </td>
                            <td className="p-2.5 text-rose-600 dark:text-rose-400 font-medium">
                              {char.reactionPlan}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. CYCLE TIME & PRODUCTION TIME ENGINE TAB */}
      {/* ==================================================================== */}
      {activeTab === 'cycle-times' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Configurable Deterministic Production Time Engine (Section 10)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Calculates exact scheduling duration using deterministic formulas: Production Time = Setup Time + (Quantity × Cycle Time) / Efficiency + Allowance.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parameters Input */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Simulation Parameters
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Batch Quantity (units)</label>
                    <input
                      type="number"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded font-mono font-bold dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Setup Time (minutes)</label>
                      <input
                        type="number"
                        value={calcSetupMinutes}
                        onChange={(e) => setCalcSetupMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded font-mono dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Unit Cycle Time (seconds)</label>
                      <input
                        type="number"
                        value={calcCycleSeconds}
                        onChange={(e) => setCalcCycleSeconds(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded font-mono dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Work Center Efficiency (%)</label>
                      <input
                        type="number"
                        value={calcEfficiencyPct}
                        onChange={(e) => setCalcEfficiencyPct(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded font-mono dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Downtime & Rest Allowance (%)</label>
                      <input
                        type="number"
                        value={calcAllowancePct}
                        onChange={(e) => setCalcAllowancePct(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded font-mono dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Results */}
              <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                  Deterministic Calculation Output
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Total Production Duration:</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                      {totalStandardHours} hrs
                    </span>
                  </div>

                  <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Fixed Setup & Changeover:</span>
                      <span className="font-mono font-bold">{calcSetupMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Machine Run Time ({calcQuantity} pcs × {calcCycleSeconds}s):</span>
                      <span className="font-mono font-bold">{((calcQuantity * calcCycleSeconds) / 60).toFixed(1)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency Adjustment ({calcEfficiencyPct}%):</span>
                      <span className="font-mono font-bold text-amber-600">
                        +{(grossProductionMinutes - (calcQuantity * calcCycleSeconds) / 60).toFixed(1)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowance Buffer ({calcAllowancePct}%):</span>
                      <span className="font-mono font-bold text-amber-600">+{allowanceMinutes.toFixed(1)} min</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded border border-indigo-200/60 dark:border-indigo-900/60 text-[11px] text-slate-500">
                    <span className="font-bold text-indigo-600">PPIC Invariant:</span> Standard times are deterministic and frozen in routing master. AI advisory models cannot silently modify official standard times without an authorized Engineering Change (ECR).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. ENGINEERING CHANGE REQUEST (ECR / ECO) TAB */}
      {/* ==================================================================== */}
      {activeTab === 'ecr' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {activeEcr?.ecrNumber || 'ECR-2026-004'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeEcr?.productName} ({activeEcr?.currentRevision} → {activeEcr?.proposedRevision})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Reason: {activeEcr?.reason}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                  STATUS: {activeEcr?.status}
                </span>

                {activeEcr?.status !== 'EFFECTIVE' && (
                  <button
                    onClick={() => releaseEngineeringChange(activeEcr.id, effectiveDateInput)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <GitBranch className="w-4 h-4" />
                    Release {activeEcr.proposedRevision} & Apply Decisions
                  </button>
                )}
              </div>
            </div>

            {/* 360° Multi-Domain Impact Analysis Grid (Section 23) */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                360° Cross-Domain Impact Analysis
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-center">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">BOM Impact</div>
                  <div className="font-bold text-rose-600 mt-1">YES (Rev B)</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Routing Impact</div>
                  <div className="font-bold text-rose-600 mt-1">YES (Op 10)</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tooling Impact</div>
                  <div className="font-bold text-rose-600 mt-1">YES (Gland Punch)</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Unit Cost Delta</div>
                  <div className="font-bold text-amber-600 mt-1">+$8.50 / unit</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Open MOs Affected</div>
                  <div className="font-bold text-indigo-600 mt-1">3 Work Orders</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Customer Sign-Off</div>
                  <div className="font-bold text-emerald-600 mt-1">APPROVED</div>
                </div>
              </div>
            </div>

            {/* Open Work Orders Impact Decision Matrix (Section 26 - Critical Invariant) */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Open Work Orders Decision Matrix (BR-ECR-002)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Historical orders retain frozen Rev A snapshot unless explicitly authorized.
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Work Order #</th>
                      <th className="p-3">Current Snapshot</th>
                      <th className="p-3">Floor Progress</th>
                      <th className="p-3">Authorized Impact Decision</th>
                      <th className="p-3">Decision Rationale & Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeEcr?.openWorkOrderDecisions.map((dec) => (
                      <tr key={dec.workOrderId} className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {dec.orderNumber}
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                          {dec.currentRevision}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full"
                                style={{ width: `${dec.progressPercentage}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px]">{dec.progressPercentage}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={dec.decision}
                            onChange={(e) =>
                              decideOpenWorkOrderEcr(
                                activeEcr.id,
                                dec.workOrderId,
                                e.target.value as any
                              )
                            }
                            className="px-2.5 py-1 rounded border text-xs font-semibold cursor-pointer dark:bg-slate-800 dark:border-slate-700"
                          >
                            <option value="CONTINUE_EXISTING_REV">
                              Continue Existing Revision (Rev A)
                            </option>
                            <option value="APPLY_NEW_REV">
                              Apply New Revision (Upgrade to Rev B)
                            </option>
                            <option value="HOLD_WORK_ORDER">Hold Work Order</option>
                            <option value="CANCEL_AND_RECREATE">Cancel & Recreate</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {dec.notes || 'Awaiting formal decision.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Material Disposition Plan (Section 27) */}
            <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Inventory Material Disposition Strategy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Existing Material (Standard IP67 Shell):
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    • 350 PCS on-hand in warehouse bin PLANT01-RM-WH-BAY-03.
                  </div>
                  <div className="text-emerald-600 font-semibold mt-1">
                    Disposition: USE UP for completing active MO-124 lot and reserved warranty spare parts. Zero scrap write-off.
                  </div>
                </div>

                <div className="p-3 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    New Material (Marine Anodized Shell):
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    • 1,000 PCS required for upcoming Rev B build batches.
                  </div>
                  <div className="text-blue-600 font-semibold mt-1">
                    Action: Purchase Requisition PR-2026-000004 generated for certified supplier PT Precision Die-Casting.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Drawing Modal */}
      {showDwgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Register New Engineering CAD Drawing
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createEngineeringDrawing({
                  productId: selectedProduct.id,
                  productSku: selectedProduct.sku,
                  drawingNumber: dwgForm.drawingNumber,
                  revision: dwgForm.revision,
                  title: dwgForm.title,
                  cadModelType: dwgForm.cadModelType,
                  fileReference: dwgForm.fileReference,
                  description: dwgForm.description,
                  status: 'REVIEW',
                });
                setShowDwgModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Drawing Reference #</label>
                  <input
                    type="text"
                    value={dwgForm.drawingNumber}
                    onChange={(e) => setDwgForm({ ...dwgForm, drawingNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Revision Level</label>
                  <input
                    type="text"
                    value={dwgForm.revision}
                    onChange={(e) => setDwgForm({ ...dwgForm, revision: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Blueprint Title</label>
                <input
                  type="text"
                  value={dwgForm.title}
                  onChange={(e) => setDwgForm({ ...dwgForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Format</label>
                  <select
                    value={dwgForm.cadModelType}
                    onChange={(e) => setDwgForm({ ...dwgForm, cadModelType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                  >
                    <option value="3D_STEP">3D CAD (.step / .iges)</option>
                    <option value="2D_DWG">2D Blueprint (.dwg / .dxf)</option>
                    <option value="PDF_SCHEMATIC">PDF Schematic Drawing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">CAD File Attachment Name</label>
                  <input
                    type="text"
                    value={dwgForm.fileReference}
                    onChange={(e) => setDwgForm({ ...dwgForm, fileReference: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Engineering Description & Scope</label>
                <textarea
                  rows={2}
                  value={dwgForm.description}
                  onChange={(e) => setDwgForm({ ...dwgForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDwgModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded"
                >
                  Register Drawing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
