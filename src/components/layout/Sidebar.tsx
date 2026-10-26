import React, { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  CalendarRange,
  Factory,
  Boxes,
  ShieldCheck,
  Gauge,
  CircleDollarSign,
  BarChart3,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Wrench,
  Lock,
  TestTube,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Rocket,
  Compass,
  GitPullRequest,
  Sliders,
  Settings,
  Bell,
} from 'lucide-react';

export type MainNavId =
  | 'dashboard'
  | 'workflow'
  | 'settings'
  | 'npi'
  | 'engineering'
  | 'master-data'
  | 'planning'
  | 'procurement'
  | 'manufacturing'
  | 'inventory'
  | 'quality'
  | 'capacity'
  | 'costing'
  | 'maintenance'
  | 'reports'
  | 'admin'
  | 'testing'
  | 'learn';

export interface NavItem {
  id: MainNavId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  subItems?: { id: string; label: string }[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'operations',
    title: 'OPERASI (OPERATIONS)',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Operasi',
        icon: LayoutDashboard,
      },
      {
        id: 'planning',
        label: 'Planning & PPIC',
        icon: CalendarRange,
        subItems: [
          { id: 'ppic-dashboard', label: 'PPIC Dashboard' },
          { id: 'demand', label: 'Demand (MTO / MTS)' },
          { id: 'production-plan', label: 'Production Plan (MPS)' },
          { id: 'material-planning', label: 'Multi-Level BOM & MRP' },
          { id: 'capacity-planning', label: 'Capacity (Machine & Labor)' },
          { id: 'scheduling', label: 'Finite Production Scheduling' },
          { id: 'gantt', label: 'Gantt Dispatch Timeline' },
          { id: 'bottleneck', label: 'Bottleneck Analysis' },
          { id: 'what-if', label: 'What-If Simulation' },
          { id: 'e2e-demo', label: 'Section 41 E2E Test Case' },
        ],
      },
      {
        id: 'manufacturing',
        label: 'Manufacturing & Kiosk',
        icon: Factory,
        subItems: [
          { id: 'production-orders', label: 'Production Orders (MO)' },
          { id: 'material-requests', label: 'Material Requests & Line' },
          { id: 'gantt', label: 'Gantt Schedule & Dependencies' },
          { id: 'work-orders', label: 'Work Orders Dispatch' },
          { id: 'shop-floor', label: 'Shop Floor Terminal Kiosk' },
          { id: 'subcontracting', label: 'Subcontracting (Section 24)' },
        ],
      },
      {
        id: 'inventory',
        label: 'Inventory 5-Bucket',
        icon: Boxes,
        subItems: [
          { id: 'material-availability', label: 'Material Availability' },
          { id: 'reservations', label: 'Hard Reservations' },
          { id: 'material-consumption', label: 'Immutable Movement Ledger' },
          { id: 'finished-goods', label: 'Two-Way Lot Traceability' },
        ],
      },
      {
        id: 'procurement',
        label: 'Procurement & GRN',
        icon: ShoppingCart,
        subItems: [
          { id: 'pr', label: 'Purchase Requisitions (PR)' },
          { id: 'po', label: 'Purchase Orders (PO)' },
          { id: 'grn', label: 'Receiving Dock & GRN' },
          { id: 'suppliers', label: 'Certified Suppliers' },
        ],
      },
      {
        id: 'quality',
        label: 'Quality & Inspeksi',
        icon: ShieldCheck,
        subItems: [
          { id: 'inspections', label: 'Quality Inspections (FAI)' },
          { id: 'reject-scrap', label: 'Non-Conformance Reports (NCR)' },
          { id: 'rework', label: 'Rework Orders' },
          { id: 'quarantine', label: 'Quarantine Disposition' },
        ],
      },
      {
        id: 'capacity',
        label: 'Capacity Load',
        icon: Gauge,
        subItems: [{ id: 'capacity-load', label: 'Work Center Load vs Cap' }],
      },
      {
        id: 'maintenance',
        label: 'Maintenance & Mesin',
        icon: Wrench,
      },
      {
        id: 'costing',
        label: 'Costing & Variance',
        icon: CircleDollarSign,
        subItems: [
          { id: 'product-cost', label: 'Product Standard Cost' },
          { id: 'production-cost', label: 'Production Actual Cost' },
          { id: 'variance', label: 'Cost Variance Analysis' },
        ],
      },
      {
        id: 'npi',
        label: 'NPI & Line Readiness',
        icon: Rocket,
        subItems: [
          { id: 'dashboard', label: 'NPI Stage-Gate Radar' },
          { id: 'projects', label: 'NPI Projects & Milestones' },
          { id: 'readiness', label: '6-Pillar Line Readiness' },
          { id: 'trials', label: 'Trial & Pilot Runs' },
          { id: 'release-package', label: 'Product Release Packages' },
        ],
      },
      {
        id: 'engineering',
        label: 'Engineering Hub',
        icon: Compass,
        subItems: [
          { id: 'drawings', label: 'CAD Drawings & Blueprints' },
          { id: 'specifications', label: 'Engineering Specifications' },
          { id: 'tooling', label: 'Tooling Master (Molds/Jigs)' },
          { id: 'work-instructions', label: 'Work Instructions (WI/SOP)' },
          { id: 'qc-plans', label: 'Quality Control Plans (QCP)' },
          { id: 'cycle-times', label: 'Cycle Time Engine' },
          { id: 'ecr', label: 'Engineering Changes (ECR)' },
        ],
      },
      {
        id: 'master-data',
        label: 'Master Data',
        icon: Database,
        subItems: [
          { id: 'products', label: 'Products & SKUs' },
          { id: 'uom', label: 'Units of Measure (UOM)' },
          { id: 'bom', label: 'Bills of Material (BOM)' },
          { id: 'routings', label: 'Routings & Operations' },
          { id: 'work-centers', label: 'Work Centers' },
          { id: 'reason-codes', label: 'Reason Codes' },
        ],
      },
      {
        id: 'reports',
        label: 'Executive Reports',
        icon: BarChart3,
        subItems: [
          { id: 'rep-production', label: 'Production & OEE' },
          { id: 'rep-quality', label: 'Quality & Defect Pareto' },
          { id: 'rep-inventory', label: 'Inventory Valuation' },
          { id: 'rep-cost', label: 'Financial Cost Variances' },
        ],
      },
    ],
  },
  {
    id: 'workflow-pillar',
    title: 'WORKFLOW & TATA KELOLA',
    items: [
      {
        id: 'workflow',
        label: 'Approval Center',
        icon: GitPullRequest,
        subItems: [
          { id: 'my-tasks', label: 'Tugas Saya (Approval Inbox)' },
          { id: 'all-pending', label: 'Semua Antrean Pending' },
          { id: 'my-requests', label: 'Pengajuan Saya' },
          { id: 'history', label: 'Riwayat Keputusan' },
          { id: 'rules', label: 'Aturan Approval Matrix' },
        ],
      },
    ],
  },
  {
    id: 'settings-pillar',
    title: 'SETTINGS & MASTER ORGANISASI',
    items: [
      {
        id: 'settings',
        label: 'Pengaturan & Organisasi',
        icon: Settings,
        subItems: [
          { id: 'organization', label: 'Struktur Organisasi & Plant' },
          { id: 'people', label: 'Tenaga Kerja & Skill Matrix' },
          { id: 'security', label: 'Akun Pengguna & RBAC' },
          { id: 'approval-matrix', label: 'Aturan Approval Matrix' },
        ],
      },
      {
        id: 'admin',
        label: 'Tata Kelola & Audit Trail',
        icon: Lock,
        subItems: [
          { id: 'audit', label: 'Immutable Audit Trail' },
          { id: 'platform', label: 'Configuration Platform' },
          { id: 'registry', label: 'Master Feature Registry' },
          { id: 'sod', label: 'Segregation of Duties (SoD)' },
        ],
      },
    ],
  },
  {
    id: 'knowledge',
    title: 'PENGUJIAN & PANDUAN',
    items: [
      {
        id: 'testing',
        label: 'Testing Matrix & DoD',
        icon: TestTube,
      },
      {
        id: 'learn',
        label: 'Blueprint & Panduan Alur',
        icon: GraduationCap,
        subItems: [
          { id: 'architecture', label: 'Phase 0 Blueprint & Maps' },
          { id: 'guide', label: 'Workflow Walkthrough' },
        ],
      },
    ],
  },
];

interface SidebarProps {
  activeNav: MainNavId;
  activeSubTab: string;
  onSelectNav: (nav: MainNavId, subTab?: string) => void;
  openOrdersCount: number;
  pendingApprovalsCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  activeSubTab,
  onSelectNav,
  openOrdersCount,
  pendingApprovalsCount = 1,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    manufacturing: true,
    workflow: true,
    settings: true,
  });

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavClick = (item: NavItem) => {
    const hasChildren = item.subItems && item.subItems.length > 0;
    if (hasChildren && !expandedSections[item.id]) {
      setExpandedSections((prev) => ({ ...prev, [item.id]: true }));
    }
    onSelectNav(item.id, item.subItems ? item.subItems[0].id : undefined);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const handleSubItemClick = (navId: MainNavId, subId: string) => {
    onSelectNav(navId, subId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static flex flex-col h-full bg-slate-900 text-slate-300 select-none overflow-hidden transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-18' : 'md:w-64'}`}
      >
        {/* Brand & Collapse Header */}
        <div
          className={`h-14 border-b border-slate-800 flex items-center px-4 shrink-0 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm tracking-wider shrink-0 shadow-xs">
              K
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                  Kranex Industrial
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Manufacturing ERP
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded md:hidden"
              title="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop inline collapse button */}
          {!isCollapsed && !isMobileOpen && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                const hasChildren = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedSections[item.id] || isActive;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => handleNavClick(item)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center rounded transition-colors text-left relative group ${
                        isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2 text-xs'
                      } ${
                        isActive && !hasChildren
                          ? 'bg-indigo-600/90 text-white font-semibold shadow-xs'
                          : isActive
                          ? 'bg-slate-800 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2.5 ${
                          isCollapsed ? 'justify-center' : 'truncate'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-indigo-400' : 'text-slate-400'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.id === 'manufacturing' && openOrdersCount > 0 && (
                            <span className="font-mono text-[10px] text-amber-300 font-bold px-1.5 py-0.5 bg-amber-500/20 rounded">
                              {openOrdersCount}
                            </span>
                          )}
                          {item.id === 'workflow' && pendingApprovalsCount > 0 && (
                            <span className="font-mono text-[10px] text-indigo-300 font-bold px-1.5 py-0.5 bg-indigo-500/30 rounded border border-indigo-400/30">
                              {pendingApprovalsCount}
                            </span>
                          )}
                          {hasChildren && (
                            <span
                              onClick={(e) => toggleSection(item.id, e)}
                              className="p-1 hover:text-white rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Collapsed Badge Indicators */}
                      {isCollapsed && item.id === 'manufacturing' && openOrdersCount > 0 && (
                        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                      {isCollapsed && item.id === 'workflow' && pendingApprovalsCount > 0 && (
                        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-indigo-400" />
                      )}
                    </button>

                    {/* Sub-menu items */}
                    {!isCollapsed && hasChildren && isExpanded && (
                      <div className="pl-6 pr-1 space-y-0.5 border-l border-slate-800 ml-4 py-1">
                        {item.subItems!.map((sub) => {
                          const isSubActive = isActive && activeSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => handleSubItemClick(item.id, sub.id)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                                isSubActive
                                  ? 'text-white font-medium bg-indigo-600/30 text-indigo-200'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Expand Toggle when Collapsed */}
        {isCollapsed && (
          <div className="p-2 border-t border-slate-800 flex justify-center shrink-0">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
