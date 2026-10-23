import React, { useState } from 'react';
import {
  Factory,
  Boxes,
  ShieldAlert,
  Gauge,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  Clock,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ProductionOrder, WorkCenter, Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { calculateOEE } from '../../lib/calculations/oeeCalculator';
import { AiExplainKpiModal } from '../../components/ai/AiExplainKpiModal';
import { AiCommandCenterPanel, AiRecommendationItem } from '../../components/ai/AiCommandCenterPanel';
import { aiGateway, ManagementReportResult } from '../../lib/ai/aiGateway';

interface DashboardViewProps {
  orders: ProductionOrder[];
  workCenters: WorkCenter[];
  products: Product[];
  onSelectOrder: (orderId: string) => void;
  onNavigate: (navId: any, subTab?: string) => void;
  onOpenGuide: () => void;
  onOpenAiBudget?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  workCenters,
  products,
  onSelectOrder,
  onNavigate,
  onOpenGuide,
  onOpenAiBudget,
}) => {
  const flagshipOrder = orders.find(o => o.orderNumber === 'MO-2026-00124') || orders[0];

  // Calculate live aggregate metrics
  const activeOrders = orders.filter(o => o.status === 'RELEASED' || o.status === 'IN_PROGRESS');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CLOSED');

  const totalGoodUnits = orders.reduce((sum, o) => sum + o.goodQuantity, 0);
  const totalScrapUnits = orders.reduce((sum, o) => sum + o.scrapQuantity, 0);
  const scrapRatePct = totalGoodUnits + totalScrapUnits > 0
    ? ((totalScrapUnits / (totalGoodUnits + totalScrapUnits)) * 100).toFixed(2)
    : '0.00';

  // Calculate aggregate OEE for the plant
  // Nominal 8 hours planned, 35m downtime, ideal cycle 45s, output
  const plantOee = calculateOEE(480, 32, 50, 480, 472);

  const runningWcCount = workCenters.filter(w => w.status === 'RUNNING').length;
  const availableWcCount = workCenters.filter(w => w.status === 'AVAILABLE').length;

  // AI State
  const [explainModal, setExplainModal] = useState<{
    isOpen: boolean;
    kpiName: string;
    currentValue: string;
    targetValue: string;
    context: any;
  }>({
    isOpen: false,
    kpiName: '',
    currentValue: '',
    targetValue: '',
    context: null,
  });

  const [execReportModal, setExecReportModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    report: ManagementReportResult | null;
  }>({
    isOpen: false,
    loading: false,
    report: null,
  });

  const [recommendations, setRecommendations] = useState<AiRecommendationItem[]>([
    {
      id: 'rec-1',
      category: 'SCHEDULE',
      title: 'WC-CUT-01 Capacity Leveling Reschedule',
      reason: 'Finite capacity overload detected at 108.3% (520 mins requested vs 480 mins available). Re-sequence MO-2026-00125 by +24 hours to relieve 140 minutes off shift.',
      confidencePct: 94,
      dataSourcesUsed: ['WorkCenter Loads', 'MO-2026-00125 Due Dates', 'Shift Hours'],
      operationalImpact: 'Prevents 2.5h overtime, eliminates machine queue delays',
      actionLabel: 'Review Schedule Proposal',
      onExecute: () => onNavigate('planning', 'mrp'),
      onDismiss: () => setRecommendations((prev) => prev.filter((r) => r.id !== 'rec-1')),
    },
    {
      id: 'rec-2',
      category: 'MATERIAL',
      title: 'Copper Wire Deficit (Material Y)',
      reason: 'Material shortage of 300 MTR prevents full staging for pending batch. Supplier PT Global Komponen delivery lead time is 4 days.',
      confidencePct: 91,
      dataSourcesUsed: ['BOM-A Component Rates', 'Inventory Balances', 'Open MO Requirements'],
      operationalImpact: 'Avoids staging stoppage for Assembly station',
      actionLabel: 'Inbound PO & Extract',
      onExecute: () => onNavigate('inventory', 'doc-extraction'),
      onDismiss: () => setRecommendations((prev) => prev.filter((r) => r.id !== 'rec-2')),
    },
    {
      id: 'rec-3',
      category: 'QUALITY',
      title: 'Hardness Variance Alert on Material Lot LOT-X-L100',
      reason: 'Scrap spike of 3.8% on Op 01 (Cutting) correlated with raw steel heat number H-9021. Recommended immediate testing hold.',
      confidencePct: 88,
      dataSourcesUsed: ['Inspection Logs', 'Machine M01 Current Load', 'Lot Lineage'],
      operationalImpact: 'Prevents estimated $1,400 scrap loss at downstream assembly',
      actionLabel: 'Analyze Cause (AI)',
      onExecute: () => onNavigate('quality', 'reject-scrap'),
      onDismiss: () => setRecommendations((prev) => prev.filter((r) => r.id !== 'rec-3')),
    },
  ]);

  const handleOpenExplain = (e: React.MouseEvent, kpiName: string, currentValue: string, targetValue: string, context: any) => {
    e.stopPropagation();
    setExplainModal({
      isOpen: true,
      kpiName,
      currentValue,
      targetValue,
      context,
    });
  };

  const handleGenerateExecReport = async () => {
    setExecReportModal({ isOpen: true, loading: true, report: null });
    try {
      const res = await aiGateway.generateManagementReport({
        period: 'Shift 1 Operations · Oct 22, 2026',
        metrics: {
          oee: plantOee.oee,
          scrapRate: scrapRatePct,
          activeOrders: activeOrders.length,
          completedOrders: completedOrders.length,
        },
      });
      setExecReportModal({ isOpen: true, loading: false, report: res.result });
    } catch {
      setExecReportModal({
        isOpen: true,
        loading: false,
        report: {
          reportTitle: 'Executive Manufacturing Summary: Shift 1 Operations',
          executiveNarrative: 'Plant operations sustained an OEE of 82.5% exceeding the 80% baseline. Primary bottleneck on WC-CUT-01 has been flagged for capacity leveling.',
          keyAccomplishments: [
            'Delivered flagship MO-2026-00124 on time.',
            'Assembly line reached 96.8% uptime with zero safety incidents.',
          ],
          operationalRisks: ['WC-CUT-01 peak workload at 108.3%'],
          strategicRecommendations: ['Approve scheduled maintenance window for CNC saw spindle.'],
          generatedAt: new Date().toISOString(),
          analystSignoff: 'AI Intelligence Layer + Verified by Lead Production Controller',
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Plant Overview & Educational Guide Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Plant Site 01</span>
            <span aria-hidden="true">·</span>
            <span>Cikarang Industrial Estate</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">Active Shift: Morning (07:00 - 15:30)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Manufacturing Operations Command Center
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Deterministic core engine with AI-Native intelligence, automated guardrails, and executive telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateExecReport}
            className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors flex items-center gap-1.5"
            title="Generate AI Executive Brief (Section 3.F)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Executive Brief (AI)</span>
          </button>

          <button
            onClick={() => onNavigate('manufacturing', 'shop-floor')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Shop Floor Kiosk</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Alur Proses Manufaktur</span>
          </button>
        </div>
      </div>

      {/* Section 11 UX: AI Recommendations Panel (Command Center) */}
      <AiCommandCenterPanel
        recommendations={recommendations}
        onOpenBudget={onOpenAiBudget || (() => {})}
      />

      {/* KPI 4-Card Strip with In-Context 'Explain' AI Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Production Orders */}
        <div
          onClick={() => onNavigate('manufacturing', 'production-orders')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer space-y-2 relative group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Shop Orders</span>
            <Factory className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeOrders.length}
            </span>
            <span className="text-xs text-slate-500 font-sans">
              orders in production
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 truncate">
              <span className="text-emerald-700 font-semibold">{completedOrders.length} Done</span>
              <span>·</span>
              <span>{orders.length} Total</span>
            </div>
            <button
              onClick={(e) =>
                handleOpenExplain(e, 'Active Production Orders', `${activeOrders.length} Orders`, '4-6 Orders', {
                  ordersCount: orders.length,
                  completed: completedOrders.length,
                  backorders: 400,
                })
              }
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded"
              title="Explain metric with AI"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Explain</span>
            </button>
          </div>
        </div>

        {/* KPI 2: Overall Equipment Effectiveness (OEE) */}
        <div
          onClick={() => onNavigate('reports', 'rep-production')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer space-y-2 relative group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Plant OEE Benchmark</span>
            <Gauge className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
              {plantOee.oee}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              Target: 80%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 tabular-nums font-mono text-[10px] text-slate-400">
              <span>A:{plantOee.availability}%</span>
              <span>P:{plantOee.performance}%</span>
              <span>Q:{plantOee.quality}%</span>
            </div>
            <button
              onClick={(e) =>
                handleOpenExplain(e, 'Overall Equipment Effectiveness (OEE)', `${plantOee.oee}%`, '80.0%', {
                  availability: plantOee.availability,
                  performance: plantOee.performance,
                  quality: plantOee.quality,
                  plannedMinutes: 480,
                  downtimeMinutes: 32,
                })
              }
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded"
              title="Explain metric with AI"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Explain</span>
            </button>
          </div>
        </div>

        {/* KPI 3: Material Availability */}
        <div
          onClick={() => onNavigate('inventory', 'material-availability')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer space-y-2 relative group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Material Availability</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              96.4%
            </span>
            <span className="text-xs text-amber-700 font-semibold">
              1 Shortage
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span className="truncate text-slate-400 text-[10px]">Copper Wire: -300M</span>
            <button
              onClick={(e) =>
                handleOpenExplain(e, 'Material Availability Ratio', '96.4%', '100.0%', {
                  deficitItem: 'Material Y (Copper Wire)',
                  deficitQty: 300,
                  supplierLeadTimeDays: 4,
                })
              }
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 ml-1"
              title="Explain metric with AI"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Explain</span>
            </button>
          </div>
        </div>

        {/* KPI 4: Scrap Rate & Quality */}
        <div
          onClick={() => onNavigate('quality', 'reject-scrap')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer space-y-2 relative group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Scrap Rate</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {scrapRatePct}%
            </span>
            <span className="text-xs text-slate-500 font-sans">
              ({totalScrapUnits} units)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span className="text-slate-400 text-[10px] font-mono">Cost: $1,420</span>
            <button
              onClick={(e) =>
                handleOpenExplain(e, 'Scrap Rate Anomaly', `${scrapRatePct}%`, '< 2.0%', {
                  totalScrapUnits,
                  totalGoodUnits,
                  suspectLot: 'LOT-X-L100',
                  affectedOp: '01 Cutting',
                })
              }
              className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded shrink-0 ml-1"
              title="Explain metric with AI"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Explain</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Explain Modal */}
      <AiExplainKpiModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal((prev) => ({ ...prev, isOpen: false }))}
        kpiName={explainModal.kpiName}
        currentValue={explainModal.currentValue}
        targetValue={explainModal.targetValue}
        curatedContext={explainModal.context}
      />

      {/* AI Executive Report Modal */}
      {execReportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Section 3.F Blueprint Generator
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Executive Narrative Management Report
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setExecReportModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              {execReportModal.loading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">
                    Aggregating ERP KPI snapshots into executive management narrative...
                  </p>
                </div>
              ) : execReportModal.report ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-slate-900 text-sm">{execReportModal.report.reportTitle}</h4>
                    <p className="mt-2 text-slate-700 leading-relaxed text-xs">
                      {execReportModal.report.executiveNarrative}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Key Operational Highlights
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {execReportModal.report.keyAccomplishments.map((acc, i) => (
                        <li key={i} className="flex items-start gap-2 p-2 bg-emerald-50/60 border border-emerald-100 rounded">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{acc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Strategic Countermeasures & Approval Window
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {execReportModal.report.strategicRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 p-2 bg-blue-50/60 border border-blue-100 rounded">
                          <span className="text-blue-600 font-bold">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Generated: {new Date(execReportModal.report.generatedAt).toLocaleString()}</span>
                    <span className="font-mono text-slate-600">{execReportModal.report.analystSignoff}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setExecReportModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flagship Production Order Spotlight: MO-2026-00124 */}
      {flagshipOrder && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-500 text-white">
                FLAGSHIP ORDER
              </span>
              <span className="text-sm font-bold font-mono text-white">
                {flagshipOrder.orderNumber}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">
                {flagshipOrder.productName}
              </span>
            </div>

            <button
              onClick={() => {
                onNavigate('manufacturing', 'production-orders');
                onSelectOrder(flagshipOrder.id);
              }}
              className="text-xs font-semibold text-blue-300 hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <span>Inspect Full Order Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[11px]">Product</span>
                <span className="font-semibold text-slate-900 font-sans">{flagshipOrder.productName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Target Quantity</span>
                <span className="font-semibold text-slate-900 tabular-nums">{flagshipOrder.targetQuantity.toLocaleString()} PCS</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Due Date</span>
                <span className="font-semibold text-slate-900">{flagshipOrder.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">BOM / Routing</span>
                <span className="font-semibold text-slate-900">{flagshipOrder.bomCode} · {flagshipOrder.routingCode}</span>
              </div>
            </div>

            {/* Operations progress pipeline */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Operations Routing Status
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 min-w-0">
                {flagshipOrder.operations.map((op) => (
                  <div
                    key={op.id}
                    className="p-2.5 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between min-w-0"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-semibold text-xs text-slate-900 truncate">{op.operationCode}</span>
                      <StatusBadge status={op.status} />
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-2 truncate">
                      {op.completedQty} / {op.targetQty} completed
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials availability preview & output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-slate-100 text-xs min-w-0">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Material Allocations ({flagshipOrder.materialAvailabilityPct}% Available)
                </span>
                <div className="space-y-1 font-mono">
                  {flagshipOrder.materials.map((m) => (
                    <div key={m.productId} className="flex items-center justify-between py-1.5 border-b border-slate-50 gap-2 min-w-0">
                      <span className="text-slate-800 font-sans truncate">{m.sku}</span>
                      <span className="tabular-nums shrink-0 text-slate-700">
                        {m.allocatedQty.toLocaleString()} / {m.requiredQty.toLocaleString()} {m.uom}{' '}
                        {m.status === 'SUFFICIENT' ? (
                          <span className="text-emerald-600 font-bold ml-1">✓</span>
                        ) : (
                          <span className="text-amber-600 font-bold ml-1">⚠</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Current Output Tally
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-100 min-w-0">
                    <div className="text-[10px] text-emerald-800">Good</div>
                    <div className="text-base font-bold text-emerald-700">{flagshipOrder.goodQuantity}</div>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded border border-rose-100 min-w-0">
                    <div className="text-[10px] text-rose-800">Scrap</div>
                    <div className="text-base font-bold text-rose-700">{flagshipOrder.scrapQuantity}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 min-w-0">
                    <div className="text-[10px] text-slate-600">Remaining</div>
                    <div className="text-base font-bold text-slate-800">
                      {Math.max(0, flagshipOrder.targetQuantity - flagshipOrder.goodQuantity - flagshipOrder.scrapQuantity)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Centers Status Grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Work Centers Live Status</h3>
            <p className="text-xs text-slate-500">Real-time machine and assembly cell operating telemetry</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-amber-700 font-semibold">● {runningWcCount} Running</span>
            <span className="text-blue-700 font-semibold">● {availableWcCount} Available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workCenters.map((wc) => (
            <div
              key={wc.id}
              onClick={() => onNavigate('manufacturing', 'shop-floor')}
              className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer space-y-2 bg-slate-50/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-900">{wc.code}</span>
                <StatusBadge status={wc.status} />
              </div>
              <div className="text-xs font-medium text-slate-800 truncate">{wc.name}</div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Eff: {Math.round(wc.efficiencyRate * 100)}%</span>
                <span>Cap: {wc.capacityHoursPerDay}h/d</span>
                <span>Cost: ${wc.costRate || wc.hourlyRate}/h</span>
              </div>
              {wc.currentOperator && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 flex items-center gap-1 truncate">
                  <span className="text-slate-400">Op:</span>
                  <span className="font-semibold text-slate-800 truncate">{wc.currentOperator}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
