import React, { useState } from 'react';
import { useErpStore } from '../../lib/services/manufacturingService';
import {
  NpiProject,
  NpiTrialRun,
  NpiPilotRun,
  ProductReleasePackage,
  NpiStatus,
} from '../../types';
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  Wrench,
  Cpu,
  Layers,
  ShieldAlert,
  ArrowRight,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Target,
  FileText,
  BadgeAlert,
  ExternalLink,
} from 'lucide-react';

interface NpiViewProps {
  initialSubTab?: string;
  onNavigateToProductionOrder?: () => void;
}

export const NpiView: React.FC<NpiViewProps> = ({
  initialSubTab = 'dashboard',
  onNavigateToProductionOrder,
}) => {
  const {
    state,
    createNpiProject,
    updateNpiProject,
    updateNpiMilestone,
    runProductionReadinessCheck,
    recordNpiTrialRun,
    recordNpiPilotRun,
    createProductRelease,
  } = useErpStore();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    state.npiProjects[0]?.id || 'npi-001'
  );

  // New Trial Run Form Modal
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialForm, setTrialForm] = useState({
    plannedQty: 50,
    actualQty: 50,
    goodQty: 48,
    scrapQty: 2,
    scrapReason: 'SCRAP-DIM: Dimensional deviation on enclosure boss',
    observations: 'First power-up verified. Thermal profile stable at 48°C peak.',
    result: 'PASS' as 'PASS' | 'FAIL' | 'PASS_WITH_ACTION',
  });

  // New Pilot Run Form Modal
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [pilotForm, setPilotForm] = useState({
    plannedQty: 200,
    actualQty: 200,
    yieldPct: 99.0,
    targetCycleTime: 45,
    actualCycleTime: 42,
    stability: 'STABLE' as 'STABLE' | 'MODERATE' | 'UNSTABLE',
    remarks: 'Full line speed reached. First-pass yield exceeds target threshold.',
    result: 'PASS' as 'PASS' | 'FAIL' | 'CONDITIONAL',
  });

  // Release Package Creation Form Modal
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState(
    'Commercial volume production authorization. All 10 prerequisite engineering and quality gates satisfied.'
  );

  const selectedProject =
    state.npiProjects.find((p) => p.id === selectedProjectId) ||
    state.npiProjects[0];

  const readinessReport = selectedProject
    ? state.readinessReports[selectedProject.id]
    : undefined;

  const handleRunReadiness = () => {
    if (selectedProject) {
      runProductionReadinessCheck(selectedProject.id);
    }
  };

  const handleSubmitTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const newTrial: NpiTrialRun = {
      id: `trl-${Date.now()}`,
      trialNumber: `TRL-2026-00${selectedProject.trialRuns.length + 1}`,
      npiProjectId: selectedProject.id,
      productSku: selectedProject.productSku,
      productRevision: selectedProject.productRevision,
      bomRevision: 'Rev A',
      routingRevision: 'Rev A',
      wiRevision: 'Rev A',
      toolingRevision: 'Rev 01',
      workCenterId: 'wc-01',
      workCenterName: 'High Precision CNC Milling Center',
      plannedQuantity: trialForm.plannedQty,
      actualQuantity: trialForm.actualQty,
      goodQuantity: trialForm.goodQty,
      scrapQuantity: trialForm.scrapQty,
      scrapReason: trialForm.scrapQty > 0 ? trialForm.scrapReason : undefined,
      startTime: `${new Date().toISOString().split('T')[0]} 08:30`,
      endTime: `${new Date().toISOString().split('T')[0]} 16:00`,
      operators: [state.currentUser.name, 'Agus Pratama'],
      trialResult: trialForm.result,
      observations: trialForm.observations,
      inspector: 'Siti Nurhaliza (QA Manager)',
    };

    recordNpiTrialRun(newTrial);
    setShowTrialModal(false);
  };

  const handleSubmitPilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const newPilot: NpiPilotRun = {
      id: `plt-${Date.now()}`,
      pilotNumber: `PLT-2026-00${selectedProject.pilotRuns.length + 1}`,
      npiProjectId: selectedProject.id,
      productSku: selectedProject.productSku,
      productRevision: selectedProject.productRevision,
      plannedQuantity: pilotForm.plannedQty,
      actualQuantity: pilotForm.actualQty,
      yieldPercentage: pilotForm.yieldPct,
      targetCycleTimeSeconds: pilotForm.targetCycleTime,
      actualCycleTimeSeconds: pilotForm.actualCycleTime,
      cycleTimeStability: pilotForm.stability,
      operatorReadiness: 'READY',
      toolingPerformance: 'OPTIMAL',
      bottlenecksIdentified: 'None detected during 200 unit continuous run.',
      pilotResult: pilotForm.result,
      remarks: pilotForm.remarks,
      evaluator: state.currentUser.name,
    };

    recordNpiPilotRun(newPilot);
    setShowPilotModal(false);
  };

  const handleExecuteRelease = () => {
    if (!selectedProject) return;
    createProductRelease({
      productId: selectedProject.productId,
      productSku: selectedProject.productSku,
      productName: selectedProject.productName,
      releasedRevision: selectedProject.productRevision,
      drawingRevision: `DWG-${selectedProject.productSku}-A Rev A`,
      specificationRevision: `SPEC-${selectedProject.productSku}-A Rev A`,
      bomRevision: `BOM-${selectedProject.productSku} Rev.01`,
      routingRevision: `RT-${selectedProject.productSku} Rev.01`,
      toolingRevision: `TOOL-MOLD-GW01 Rev 01`,
      wiRevision: `WI-${selectedProject.productSku}-OP10 Rev A`,
      qcPlanRevision: `QCP-${selectedProject.productSku}-A Rev A`,
      notes: releaseNotes,
    });
    setShowReleaseModal(false);
  };

  // Funnel status counts
  const stageCounts: Record<NpiStatus, number> = {
    DRAFT: 0,
    DEVELOPMENT: 0,
    PROTOTYPE: 0,
    TRIAL: 0,
    PILOT: 0,
    READY_FOR_RELEASE: 0,
    RELEASED: 0,
    BLOCKED: 0,
  };
  state.npiProjects.forEach((p) => {
    if (stageCounts[p.status] !== undefined) {
      stageCounts[p.status]++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Phase 8 • NPI & Readiness Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Deterministic Stage-Gates
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Rocket className="w-6 h-6 text-indigo-400" />
              New Product Introduction (NPI) & Production Readiness
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Controlled lifecycle separating pre-production development from normal commercial manufacturing.
              Enforces strict 6-pillar line readiness validation before products are authorized for normal Work Orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Active Project Dropdown */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
              <span className="text-slate-400">Active NPI:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
              >
                {state.npiProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.projectNumber} — {p.productSku} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunReadiness}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Audit Readiness
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800 text-sm">
          {[
            { id: 'dashboard', label: 'NPI Stage-Gate Radar', icon: Layers },
            { id: 'projects', label: 'NPI Projects & Milestones', icon: Rocket },
            { id: 'readiness', label: '6-Pillar Line Readiness', icon: ShieldAlert },
            { id: 'trials', label: 'Trial & Pilot Runs', icon: Play },
            { id: 'release-package', label: 'Product Release Packages', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
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
      {/* 1. DASHBOARD TAB: STAGE-GATE RADAR & FUNNEL */}
      {/* ==================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stage Gate Progression Visual Pipeline */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Enterprise NPI Stage-Gate Funnel (Page 1-3 & Section 2)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { stage: 'DRAFT', label: '1. Draft', color: 'slate', count: stageCounts.DRAFT },
                { stage: 'DEVELOPMENT', label: '2. Dev', color: 'blue', count: stageCounts.DEVELOPMENT },
                { stage: 'PROTOTYPE', label: '3. Prototype', color: 'cyan', count: stageCounts.PROTOTYPE },
                { stage: 'TRIAL', label: '4. Trial Run', color: 'amber', count: stageCounts.TRIAL },
                { stage: 'PILOT', label: '5. Pilot Run', color: 'indigo', count: stageCounts.PILOT },
                { stage: 'READY_FOR_RELEASE', label: '6. Release Gate', color: 'purple', count: stageCounts.READY_FOR_RELEASE },
                { stage: 'RELEASED', label: '7. Released (Normal)', color: 'emerald', count: stageCounts.RELEASED },
                { stage: 'BLOCKED', label: 'Blocked / Hold', color: 'rose', count: stageCounts.BLOCKED },
              ].map((item, idx) => {
                const isSelected = selectedProject?.status === item.stage;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      {item.label}
                    </div>
                    <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                      {item.count}
                    </div>
                    {isSelected && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Current: {selectedProject.productSku}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Project Highlight Card */}
          {selectedProject && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {selectedProject.projectNumber}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedProject.productName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {selectedProject.productRevision}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Customer Account: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedProject.customer}</span> • Target Commercial Release:{' '}
                    <span className="font-mono">{selectedProject.targetReleaseDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      selectedProject.status === 'RELEASED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : selectedProject.status === 'PILOT'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    STATUS: {selectedProject.status.replace(/_/g, ' ')}
                  </span>

                  {selectedProject.status === 'PILOT' && (
                    <button
                      onClick={() => setShowReleaseModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Issue Product Release Package
                    </button>
                  )}
                </div>
              </div>

              {/* Cross-Functional Team (Section 3) */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Project Owner</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {selectedProject.projectOwner}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Engineering</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {selectedProject.engineeringOwner}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">PPIC Rep</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {selectedProject.ppicRepresentative}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Quality QA</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {selectedProject.qualityRepresentative}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tooling Lead</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {selectedProject.toolingRepresentative}
                  </div>
                </div>
              </div>

              {/* Milestones Progress Table */}
              <div className="mt-5">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Project Milestones & Gate Transition Criteria
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedProject.milestones.filter((m) => m.status === 'COMPLETED').length} /{' '}
                    {selectedProject.milestones.length} Completed
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedProject.milestones.map((ms) => {
                    const isDone = ms.status === 'COMPLETED';
                    const isInProgress = ms.status === 'IN_PROGRESS';
                    return (
                      <div
                        key={ms.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateNpiMilestone(
                                selectedProject.id,
                                ms.id,
                                isDone ? 'IN_PROGRESS' : 'COMPLETED'
                              )
                            }
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : isInProgress
                                ? 'border-2 border-indigo-500 text-indigo-500'
                                : 'border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div
                              className={`text-xs font-medium ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {ms.title}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Responsible: {ms.responsibleRole} • Target: {ms.targetDate}{' '}
                              {ms.completedDate && `• Done: ${ms.completedDate}`}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isInProgress
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {ms.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. 6-PILLAR LINE READINESS CHECKLIST TAB */}
      {/* ==================================================================== */}
      {activeTab === 'readiness' && selectedProject && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  6-Pillar Deterministic Production Readiness Checklist
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Evaluates Engineering, Tooling, Process, Material, Quality, and People pillars. Any failure flags a hard blocker before trial or pilot release.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 ${
                    readinessReport?.overallStatus === 'READY'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                      : readinessReport?.overallStatus === 'BLOCKED'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {readinessReport?.overallStatus === 'READY' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  OVERALL READINESS: {readinessReport?.overallStatus || 'PENDING EVALUATION'}
                </div>

                <button
                  onClick={handleRunReadiness}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-evaluate Invariants
                </button>
              </div>
            </div>

            {/* Blocking Issues Alert Box */}
            {readinessReport?.blockingIssues && readinessReport.blockingIssues.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <BadgeAlert className="w-4 h-4" />
                  Deterministic Blockers Detected ({readinessReport.blockingIssues.length})
                </div>
                <ul className="mt-2 space-y-1 text-xs text-rose-700 dark:text-rose-400 list-disc list-inside">
                  {readinessReport.blockingIssues.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklist Items Grouped by Pillar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {['ENGINEERING', 'TOOLING', 'PROCESS', 'MATERIAL', 'QUALITY', 'PEOPLE_PRODUCTION'].map(
                (pillar) => {
                  const items =
                    readinessReport?.items.filter((i) => i.pillar === pillar) || [];
                  return (
                    <div
                      key={pillar}
                      className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-850/50"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                          {pillar === 'ENGINEERING' && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                          {pillar === 'TOOLING' && <Wrench className="w-3.5 h-3.5 text-amber-500" />}
                          {pillar === 'PROCESS' && <Cpu className="w-3.5 h-3.5 text-indigo-500" />}
                          {pillar === 'MATERIAL' && <Layers className="w-3.5 h-3.5 text-purple-500" />}
                          {pillar === 'QUALITY' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {pillar === 'PEOPLE_PRODUCTION' && <Users className="w-3.5 h-3.5 text-teal-500" />}
                          {pillar.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {items.filter((i) => i.status === 'READY').length} / {items.length} Ready
                        </span>
                      </div>

                      <div className="space-y-2">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-start gap-2"
                          >
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {it.checkItem}
                              </div>
                              {it.blockingReason && (
                                <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                                  {it.blockingReason}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 mt-1">
                                Verified by: {it.verifiedBy || 'Pending'} {it.verifiedAt && `(${it.verifiedAt})`}
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                it.status === 'READY'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : it.status === 'BLOCKED'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {it.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. TRIAL & PILOT RUNS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'trials' && selectedProject && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Validation Runs for {selectedProject.productSku} ({selectedProject.productRevision})
              </h3>
              <p className="text-xs text-slate-500">
                Trial runs validate tooling/process tolerances; Pilot runs evaluate repeatable capacity & cycle times.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTrialModal(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Engineering Trial Run
              </button>
              <button
                onClick={() => setShowPilotModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Commercial Pilot Run
              </button>
            </div>
          </div>

          {/* Trial Runs Card List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recorded Trial Runs ({selectedProject.trialRuns.length})
            </h4>

            {selectedProject.trialRuns.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                No trial runs logged for this project yet. Click &quot;Log Engineering Trial Run&quot; to begin.
              </div>
            ) : (
              selectedProject.trialRuns.map((tr) => (
                <div
                  key={tr.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {tr.trialNumber}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {tr.workCenterName}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({tr.startTime} to {tr.endTime})
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        tr.trialResult === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : tr.trialResult === 'PASS_WITH_ACTION'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      RESULT: {tr.trialResult.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                    <div>
                      <span className="text-slate-400">Planned Output:</span>{' '}
                      <span className="font-bold">{tr.plannedQuantity} PCS</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Good Verified:</span>{' '}
                      <span className="font-bold text-emerald-600">{tr.goodQuantity} PCS</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Scrap Logged:</span>{' '}
                      <span className="font-bold text-rose-600">{tr.scrapQuantity} PCS</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Inspector QA:</span>{' '}
                      <span className="font-semibold">{tr.inspector}</span>
                    </div>
                  </div>

                  {tr.observations && (
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Observations:</span> {tr.observations}
                    </div>
                  )}

                  {tr.correctiveActions && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold">Corrective Action Taken:</span> {tr.correctiveActions}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pilot Runs Card List */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recorded Commercial Pilot Runs ({selectedProject.pilotRuns.length})
            </h4>

            {selectedProject.pilotRuns.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                No pilot runs logged yet. Once trial run passes, run a pilot batch to validate repeatability.
              </div>
            ) : (
              selectedProject.pilotRuns.map((pr) => (
                <div
                  key={pr.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {pr.pilotNumber}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Repeatability & Capacity Validation Batch
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        pr.pilotResult === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      PILOT RESULT: {pr.pilotResult}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                    <div>
                      <span className="text-slate-400">Batch Quantity:</span>{' '}
                      <span className="font-bold">{pr.actualQuantity} PCS</span>
                    </div>
                    <div>
                      <span className="text-slate-400">First-Pass Yield:</span>{' '}
                      <span className="font-bold text-emerald-600">{pr.yieldPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Cycle Time:</span>{' '}
                      <span className="font-mono font-bold">{pr.actualCycleTimeSeconds}s (Target: {pr.targetCycleTimeSeconds}s)</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Stability:</span>{' '}
                      <span className="font-semibold text-emerald-600">{pr.cycleTimeStability}</span>
                    </div>
                  </div>

                  {pr.remarks && (
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Evaluation Remarks:</span> {pr.remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. PRODUCT RELEASE PACKAGES TAB */}
      {/* ==================================================================== */}
      {activeTab === 'release-package' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Official Product Release Packages (Baseline Freeze)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  When a product release package is approved, it freezes the exact Drawing, Specification, BOM, Routing, Tooling, WI, and QC Plan revisions as the manufacturing baseline.
                </p>
              </div>

              {selectedProject?.status === 'PILOT' && (
                <button
                  onClick={() => setShowReleaseModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Issue Release Package for {selectedProject.productSku}
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {state.productReleases.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-850/50 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {pkg.packageNumber}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {pkg.productName} ({pkg.productSku})
                        </h4>
                        <div className="text-xs text-slate-500">
                          Baseline Revision: <span className="font-semibold text-slate-700 dark:text-slate-300">{pkg.releasedRevision}</span> • Effective Date: {pkg.effectiveDate}
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      STATUS: {pkg.status}
                    </span>
                  </div>

                  {/* Frozen Artifacts Table (Section 20) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Drawing</div>
                      <div className="font-semibold mt-1 truncate">{pkg.drawingRevision}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Specification</div>
                      <div className="font-semibold mt-1 truncate">{pkg.specificationRevision}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">BOM Rev</div>
                      <div className="font-semibold mt-1 truncate">{pkg.bomRevision}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Routing Rev</div>
                      <div className="font-semibold mt-1 truncate">{pkg.routingRevision}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tooling Rev</div>
                      <div className="font-semibold mt-1 truncate">{pkg.toolingRevision}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Work Instruction</div>
                      <div className="font-semibold mt-1 truncate">{pkg.wiRevision}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">QC Plan</div>
                      <div className="font-semibold mt-1 truncate">{pkg.qcPlanRevision}</div>
                    </div>
                  </div>

                  {/* Multi-Department Sign-Offs */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                      Multi-Department Release Gate Authorization
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {pkg.approvals.map((app, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{app.role}</div>
                            <div className="text-[10px] text-slate-400">
                              {app.approver} ({app.approvedAt ? app.approvedAt.slice(0, 10) : 'Approved'})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. NPI PROJECTS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Active New Product Introduction Projects ({state.npiProjects.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full project registry tracking product definition, prototypes, and release gates.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.npiProjects.map((p) => (
                <div key={p.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {p.projectNumber}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{p.productName}</span>
                      <span className="text-xs text-slate-400">({p.productSku} • {p.productRevision})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Customer: {p.customer} • Project Owner: {p.projectOwner} • Target: {p.targetReleaseDate}
                    </div>
                    {p.blockingIssues.length > 0 && (
                      <div className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {p.blockingIssues[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : p.status === 'PILOT'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {p.status}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setActiveTab('dashboard');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      Inspect Project <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS */}
      {/* ==================================================================== */}

      {/* Log Trial Run Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-amber-500" />
              Log Engineering Trial Run for {selectedProject?.productSku}
            </h3>
            <form onSubmit={handleSubmitTrial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Planned Quantity</label>
                  <input
                    type="number"
                    value={trialForm.plannedQty}
                    onChange={(e) => setTrialForm({ ...trialForm, plannedQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Actual Quantity Output</label>
                  <input
                    type="number"
                    value={trialForm.actualQty}
                    onChange={(e) => setTrialForm({ ...trialForm, actualQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Good Verified Units</label>
                  <input
                    type="number"
                    value={trialForm.goodQty}
                    onChange={(e) => setTrialForm({ ...trialForm, goodQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Scrap Units</label>
                  <input
                    type="number"
                    value={trialForm.scrapQty}
                    onChange={(e) => setTrialForm({ ...trialForm, scrapQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              {trialForm.scrapQty > 0 && (
                <div>
                  <label className="block text-slate-500 mb-1">Scrap Reason Code & Description</label>
                  <input
                    type="text"
                    value={trialForm.scrapReason}
                    onChange={(e) => setTrialForm({ ...trialForm, scrapReason: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-500 mb-1">Trial Run Result</label>
                <select
                  value={trialForm.result}
                  onChange={(e) => setTrialForm({ ...trialForm, result: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 font-semibold cursor-pointer"
                >
                  <option value="PASS">PASS — Ready for Pilot</option>
                  <option value="PASS_WITH_ACTION">PASS WITH ACTION — Corrective action required</option>
                  <option value="FAIL">FAIL — Rework process and retry</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Observations & Engineering Notes</label>
                <textarea
                  rows={2}
                  value={trialForm.observations}
                  onChange={(e) => setTrialForm({ ...trialForm, observations: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrialModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded"
                >
                  Save Trial Run Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Pilot Run Modal */}
      {showPilotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-500" />
              Log Commercial Pilot Run for {selectedProject?.productSku}
            </h3>
            <form onSubmit={handleSubmitPilot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Batch Run Quantity</label>
                  <input
                    type="number"
                    value={pilotForm.actualQty}
                    onChange={(e) => setPilotForm({ ...pilotForm, actualQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">First-Pass Yield %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pilotForm.yieldPct}
                    onChange={(e) => setPilotForm({ ...pilotForm, yieldPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Actual Cycle Time (sec/unit)</label>
                  <input
                    type="number"
                    value={pilotForm.actualCycleTime}
                    onChange={(e) => setPilotForm({ ...pilotForm, actualCycleTime: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Cycle Time Stability</label>
                  <select
                    value={pilotForm.stability}
                    onChange={(e) => setPilotForm({ ...pilotForm, stability: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="STABLE">STABLE (Standard Deviation &lt; 2s)</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="UNSTABLE">UNSTABLE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Pilot Evaluation Result</label>
                <select
                  value={pilotForm.result}
                  onChange={(e) => setPilotForm({ ...pilotForm, result: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 font-semibold cursor-pointer"
                >
                  <option value="PASS">PASS — Ready for Official Product Release</option>
                  <option value="CONDITIONAL">CONDITIONAL — Review minor bottlenecks</option>
                  <option value="FAIL">FAIL — Yield / cycle time unacceptable</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Remarks & Bottleneck Analysis</label>
                <textarea
                  rows={2}
                  value={pilotForm.remarks}
                  onChange={(e) => setPilotForm({ ...pilotForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPilotModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded"
                >
                  Save Pilot Run Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Release Package Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              Authorize Product Release for {selectedProject?.productSku}
            </h3>
            <p className="text-xs text-slate-500">
              This action will officially change product lifecycle status from{' '}
              <span className="font-semibold text-indigo-600">PILOT</span> to{' '}
              <span className="font-semibold text-emerald-600">RELEASED</span>. It will freeze the release package baseline and allow normal commercial production orders.
            </p>

            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All 6 Readiness Pillars Verified (Score: 100%)
              </div>
              <div>• CAD Drawing: Released (Rev A)</div>
              <div>• BOM & Routing: Active & Circular Validated</div>
              <div>• Tooling: TOOL-MOLD-GW01 Qualified</div>
              <div>• 200-Unit Pilot Run: Passed (99.0% Yield)</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Executive Release Notes / Directive
              </label>
              <textarea
                rows={3}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReleaseModal(false)}
                className="px-3 py-1.5 border rounded text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRelease}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                Authorize & Freeze Release Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
