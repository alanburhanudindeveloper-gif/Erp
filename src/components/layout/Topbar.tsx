import React from 'react';
import {
  Menu,
  Search,
  BookOpen,
  Bell,
  Factory,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface TopbarProps {
  currentModuleTitle: string;
  currentSubTabTitle?: string;
  selectedPlant: string;
  onPlantChange: (plantId: string) => void;
  onOpenCommandBar: () => void;
  onOpenGuide: () => void;
  unreadNotifsCount: number;
  onOpenNotifs: () => void;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenAiBudget?: () => void;
  onOpenWorkflow?: () => void;
  pendingApprovalsCount?: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentModuleTitle,
  currentSubTabTitle,
  selectedPlant,
  onPlantChange,
  onOpenCommandBar,
  onOpenGuide,
  unreadNotifsCount,
  onOpenNotifs,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenAiBudget,
  onOpenWorkflow,
  pendingApprovalsCount = 0,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 shrink-0 w-full">
      {/* Zone 1: Hamburger Menu (Mobile/Tablet) + Brand & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded md:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle Button */}
        <button
          onClick={onToggleSidebarCollapse}
          className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (72px)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-blue-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
          {currentModuleTitle}
        </span>

        {currentSubTabTitle && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
            <span aria-hidden="true">/</span>
            <span className="text-slate-700 font-medium capitalize">
              {currentSubTabTitle.replace(/-/g, ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: Search Command Trigger */}
      <div className="flex-1 max-w-sm hidden sm:flex items-center">
        <button
          onClick={onOpenCommandBar}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search MOs, items, work centers...</span>
          </div>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions, Plant Selector, Notifications */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenCommandBar}
          className="sm:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Plant Selector */}
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          <Factory className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedPlant}
            onChange={(e) => onPlantChange(e.target.value)}
            className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            <option value="PLANT-01">Cikarang Main #1</option>
            <option value="PLANT-02">Karawang Line #2</option>
          </select>
        </div>

        {/* AI Gateway Budget / Kill Switch Pill (Section 6.5) */}
        {onOpenAiBudget && (
          <button
            onClick={onOpenAiBudget}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
            title="Inspect AI Gateway Telemetry, Token Meter & Budget Guardrails"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-blue-900">AI Gateway</span>
            <span className="text-[10px] text-blue-700 font-mono font-bold">$0.003</span>
          </button>
        )}

        {/* Approval Inbox Quick Button */}
        {onOpenWorkflow && (
          <button
            onClick={onOpenWorkflow}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
            title="Buka Pusat Approval & Workflow Inbox"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Approval Inbox</span>
            {pendingApprovalsCount > 0 && (
              <span className="font-mono text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifs}
          className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="hidden sm:inline">Alur Proses ERP</span>
        </button>
      </div>
    </header>
  );
};
