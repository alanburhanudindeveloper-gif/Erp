export const gridTokens = {
  row: {
    compact: {
      height: 'h-9', // 36px
      fontSize: 'text-xs',
      padding: 'px-2.5 py-1',
      iconSize: 'w-3.5 h-3.5',
    },
    comfortable: {
      height: 'h-11', // 44px
      fontSize: 'text-sm',
      padding: 'px-3 py-2',
      iconSize: 'w-4 h-4',
    },
  },
  header: {
    height: 'h-9.5', // 38px
    bg: 'bg-slate-50 dark:bg-slate-900/90',
    border: 'border-b border-slate-200 dark:border-slate-800',
    fontSize: 'text-[11px] font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-400',
    padding: 'px-2.5 py-2',
  },
  cell: {
    border: 'border-b border-slate-100 dark:border-slate-800/60',
    pinnedShadowRight: 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]',
    pinnedShadowLeft: 'shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]',
  },
  selection: {
    selectedRow: 'bg-blue-50/70 dark:bg-blue-950/30 font-medium',
    hoverRow: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
  },
  font: {
    mono: 'font-mono tracking-tight',
    numeric: 'tabular-nums text-right',
  },
};
