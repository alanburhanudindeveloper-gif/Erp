import React, { useState, useEffect } from 'react';
import { useErpStore } from './lib/services/manufacturingService';
import { Topbar } from './components/layout/Topbar';
import { Sidebar, MainNavId } from './components/layout/Sidebar';
import { CommandBar } from './components/common/CommandBar';
import { DashboardView } from './modules/dashboard/DashboardView';
import { MasterDataView } from './modules/master-data/MasterDataView';
import { PlanningView } from './modules/planning/PlanningView';
import { ManufacturingView } from './modules/manufacturing/ManufacturingView';
import { InventoryView } from './modules/inventory/InventoryView';
import { QualityView } from './modules/quality/QualityView';
import { CapacityView } from './modules/capacity/CapacityView';
import { CostingView } from './modules/costing/CostingView';
import { MaintenanceView } from './modules/maintenance/MaintenanceView';
import { ReportsView } from './modules/reports/ReportsView';
import { AuditGovernanceView } from './modules/admin/AuditGovernanceView';
import { TestingMatrixView } from './modules/testing/TestingMatrixView';
import { ManufacturingWorkflowGuide } from './modules/learn/ManufacturingWorkflowGuide';
import { AiBudgetTelemetryModal } from './components/ai/AiBudgetTelemetryModal';
import { Bell, X } from 'lucide-react';

export default function App() {
  const {
    state,
    setPlant,
    addNotification,
    dismissNotification,
    releaseProductionOrder,
    startWorkOrder,
    reportProductionOutput,
    completeWorkOrder,
    closeProductionOrder,
    createProductionOrder,
    reportMachineBreakdown,
    resolveMachineBreakdown,
    runMRP,
    runTestingScenario,
    resetDemoState,
  } = useErpStore();

  const [activeNav, setActiveNav] = useState<MainNavId>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('products');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('mo-124');
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showAiBudgetModal, setShowAiBudgetModal] = useState(false);

  // Responsive sidebar collapse & mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auto-collapse sidebar on tablet screen sizes (768px <= width < 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        // Can remain in user's chosen state
      } else {
        // Mobile
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectNav = (nav: MainNavId, subTab?: string) => {
    setActiveNav(nav);
    if (subTab) {
      setActiveSubTab(subTab);
    } else {
      if (nav === 'master-data') setActiveSubTab('products');
      else if (nav === 'planning') setActiveSubTab('demand');
      else if (nav === 'manufacturing') setActiveSubTab('production-orders');
      else if (nav === 'inventory') setActiveSubTab('material-availability');
      else if (nav === 'quality') setActiveSubTab('inspections');
      else if (nav === 'capacity') setActiveSubTab('capacity-load');
      else if (nav === 'costing') setActiveSubTab('product-cost');
      else if (nav === 'reports') setActiveSubTab('rep-production');
    }
  };

  const openOrdersCount = state.productionOrders.filter(
    (o) => o.status === 'RELEASED' || o.status === 'IN_PROGRESS'
  ).length;

  const currentModuleTitle =
    activeNav === 'dashboard'
      ? 'Dashboard'
      : activeNav === 'master-data'
      ? 'Master Data'
      : activeNav === 'planning'
      ? 'Planning & MPS'
      : activeNav === 'manufacturing'
      ? 'Manufacturing'
      : activeNav === 'inventory'
      ? 'Inventory Ledger'
      : activeNav === 'quality'
      ? 'Quality Control'
      : activeNav === 'capacity'
      ? 'Capacity'
      : activeNav === 'costing'
      ? 'Costing & Variance'
      : activeNav === 'maintenance'
      ? 'Maintenance'
      : activeNav === 'reports'
      ? 'Executive Reports'
      : activeNav === 'admin'
      ? 'Governance & Audit'
      : activeNav === 'testing'
      ? 'Testing Matrix'
      : 'Panduan Alur ERP';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        activeSubTab={activeSubTab}
        onSelectNav={handleSelectNav}
        openOrdersCount={openOrdersCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentModuleTitle={currentModuleTitle}
          currentSubTabTitle={activeSubTab}
          selectedPlant={state.selectedPlant}
          onPlantChange={setPlant}
          onOpenCommandBar={() => setIsCommandBarOpen(true)}
          onOpenGuide={() => handleSelectNav('learn')}
          unreadNotifsCount={state.notifications.length}
          onOpenNotifs={() => setShowNotifDrawer(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenAiBudget={() => setShowAiBudgetModal(true)}
        />

        {/* Content Scroll Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 w-full max-w-7xl mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              orders={state.productionOrders}
              workCenters={state.workCenters}
              products={state.products}
              onSelectOrder={(id) => {
                setSelectedOrderId(id);
                handleSelectNav('manufacturing', 'production-orders');
              }}
              onNavigate={handleSelectNav}
              onOpenGuide={() => handleSelectNav('learn')}
              onOpenAiBudget={() => setShowAiBudgetModal(true)}
            />
          )}

          {activeNav === 'master-data' && (
            <MasterDataView
              products={state.products}
              boms={state.boms}
              routings={state.routings}
              workCenters={state.workCenters}
              reasonCodes={state.reasonCodes}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
            />
          )}

          {activeNav === 'planning' && (
            <PlanningView
              demands={state.demands}
              mpsRecords={state.mpsRecords}
              products={state.products}
              boms={state.boms}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
              onRunMRP={runMRP}
              onCreateOrder={createProductionOrder}
            />
          )}

          {activeNav === 'manufacturing' && (
            <ManufacturingView
              orders={state.productionOrders}
              products={state.products}
              workCenters={state.workCenters}
              reasonCodes={state.reasonCodes}
              activeSubTab={activeSubTab}
              selectedOrderId={selectedOrderId}
              onSelectSubTab={setActiveSubTab}
              onSelectOrder={setSelectedOrderId}
              onReleaseOrder={(id) => releaseProductionOrder(id)}
              onStartOperation={startWorkOrder}
              onReportOutput={reportProductionOutput}
              onCompleteOperation={completeWorkOrder}
              onCloseOrder={closeProductionOrder}
              onCreateOrder={createProductionOrder}
            />
          )}

          {activeNav === 'inventory' && (
            <InventoryView
              products={state.products}
              stockMovements={state.stockMovements}
              orders={state.productionOrders}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
            />
          )}

          {activeNav === 'quality' && (
            <QualityView
              inspections={state.inspections}
              ncrs={state.ncrs}
              reworkOrders={state.reworkOrders}
              reasonCodes={state.reasonCodes}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
            />
          )}

          {activeNav === 'capacity' && (
            <CapacityView
              workCenters={state.workCenters}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
            />
          )}

          {activeNav === 'costing' && (
            <CostingView
              costVariances={state.costVariances}
              products={state.products}
              boms={state.boms}
              routings={state.routings}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
            />
          )}

          {activeNav === 'maintenance' && (
            <MaintenanceView
              workCenters={state.workCenters}
              downtimeEvents={state.downtimeEvents}
              onReportBreakdown={reportMachineBreakdown}
              onResolveBreakdown={resolveMachineBreakdown}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsView
              orders={state.productionOrders}
              products={state.products}
              workCenters={state.workCenters}
              costVariances={state.costVariances}
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
            />
          )}

          {activeNav === 'admin' && (
            <AuditGovernanceView auditLogs={state.auditLogs} />
          )}

          {activeNav === 'testing' && (
            <TestingMatrixView
              scenarios={state.testingScenarios}
              onRunScenario={runTestingScenario}
              onNavigateToNav={handleSelectNav}
            />
          )}

          {activeNav === 'learn' && (
            <ManufacturingWorkflowGuide
              onNavigateToNav={handleSelectNav}
              onResetDemo={resetDemoState}
            />
          )}
        </main>
      </div>

      {/* Command Search Bar (Cmd+K) */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        orders={state.productionOrders}
        products={state.products}
        workCenters={state.workCenters}
        onNavigateToOrder={(id) => {
          setSelectedOrderId(id);
          handleSelectNav('manufacturing', 'production-orders');
        }}
        onNavigateToNav={handleSelectNav}
        onRunMRP={runMRP}
        onOpenGuide={() => handleSelectNav('learn')}
      />

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-80 sm:w-96 bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col p-4 animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">System Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {state.notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 relative group"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className={`text-[10px] font-bold uppercase ${
                      n.type === 'error'
                        ? 'text-rose-600'
                        : n.type === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}>
                      {n.type}
                    </span>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-700 leading-normal font-sans">{n.message}</p>
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="text-[10px] text-slate-400 hover:text-slate-700 pt-1 font-mono"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={resetDemoState}
                className="w-full py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors font-medium"
              >
                Reset Demo to PDF Spec Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Gateway Budget Guardrails & Telemetry Modal */}
      <AiBudgetTelemetryModal
        isOpen={showAiBudgetModal}
        onClose={() => setShowAiBudgetModal(false)}
      />
    </div>
  );
}
