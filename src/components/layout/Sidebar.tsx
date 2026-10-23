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
  ChevronLeft,
  Wrench,
  Lock,
  TestTube,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  ShoppingCart,
} from 'lucide-react';

export type MainNavId =
  | 'dashboard'
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

interface NavItem {
  id: MainNavId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { id: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
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
    id: 'planning',
    label: 'Planning',
    icon: CalendarRange,
    subItems: [
      { id: 'demand', label: 'Demand (MTO / MTS)' },
      { id: 'mps', label: 'Master Schedule (MPS)' },
      { id: 'mrp', label: 'MRP Calculation Engine' },
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
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    subItems: [
      { id: 'production-orders', label: 'Production Orders (MO)' },
      { id: 'gantt', label: 'Gantt Schedule & Dependencies' },
      { id: 'work-orders', label: 'Work Orders Dispatch' },
      { id: 'shop-floor', label: 'Shop Floor Terminal Kiosk' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    subItems: [
      { id: 'material-availability', label: 'Material Availability' },
      { id: 'reservations', label: 'Hard Reservations' },
      { id: 'material-consumption', label: 'Immutable Movement Ledger' },
      { id: 'finished-goods', label: 'Two-Way Lot Traceability' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality',
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
    label: 'Capacity',
    icon: Gauge,
    subItems: [
      { id: 'capacity-load', label: 'Work Center Load vs Cap' },
    ],
  },
  {
    id: 'costing',
    label: 'Costing',
    icon: CircleDollarSign,
    subItems: [
      { id: 'product-cost', label: 'Product Standard Cost' },
      { id: 'production-cost', label: 'Production Actual Cost' },
      { id: 'variance', label: 'Cost Variance Analysis' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
  },
  {
    id: 'reports',
    label: 'Reports & KPI',
    icon: BarChart3,
    subItems: [
      { id: 'rep-production', label: 'Production & OEE' },
      { id: 'rep-quality', label: 'Quality & Defect Pareto' },
      { id: 'rep-inventory', label: 'Inventory Valuation' },
      { id: 'rep-cost', label: 'Financial Cost Variances' },
    ],
  },
  {
    id: 'admin',
    label: 'Governance & Audit',
    icon: Lock,
  },
  {
    id: 'testing',
    label: 'Testing & DoD (Page 114)',
    icon: TestTube,
  },
  {
    id: 'learn',
    label: 'Panduan Alur ERP',
    icon: GraduationCap,
  },
];

interface SidebarProps {
  activeNav: MainNavId;
  activeSubTab: string;
  onSelectNav: (nav: MainNavId, subTab?: string) => void;
  openOrdersCount: number;
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
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'manufacturing': true,
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
    // On mobile, close drawer upon navigation
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

  // Reusable Sidebar Content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none overflow-hidden">
      {/* Brand & Collapse Header */}
      <div className={`h-14 border-b border-slate-800 flex items-center px-4 shrink-0 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm tracking-wider shrink-0 shadow-xs">
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
            title="Collapse sidebar to 72px"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
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
                    ? 'bg-slate-800 text-white font-semibold'
                    : isActive
                    ? 'bg-slate-800/90 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'truncate'}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.id === 'manufacturing' && openOrdersCount > 0 && (
                      <span className="font-mono text-[10px] text-amber-300 font-bold px-1.5 py-0.5 bg-amber-500/20 rounded">
                        {openOrdersCount}
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

                {/* Collapsed Badge Pill indicator */}
                {isCollapsed && item.id === 'manufacturing' && openOrdersCount > 0 && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>

              {/* Sub-menu items (only expanded when not collapsed) */}
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
                            ? 'text-white font-medium bg-slate-800'
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

      {/* Bottom Footer / Collapse Bar */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-xs shrink-0">
        {!isCollapsed ? (
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Active Production Order
            </div>
            <button
              onClick={() => handleNavClick(NAV_ITEMS[3])}
              className="w-full text-left p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between font-mono">
                <span className="font-semibold text-blue-400">MO-2026-00124</span>
                <span className="text-[10px] text-amber-400 font-bold">60%</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                Produk A · 1,000 PCS
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-5 h-5 text-blue-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar (in normal document flow, NOT overlaying) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-full border-r border-slate-800 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (off-canvas overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur overlay */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content (max 280px) */}
          <div className="relative z-50 w-72 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
