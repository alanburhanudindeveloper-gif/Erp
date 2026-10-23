import React, { useState, useEffect } from 'react';
import { Search, X, Factory, Box, Database, ArrowRight, Play, Calculator, BookOpen } from 'lucide-react';
import { ProductionOrder, Product, WorkCenter } from '../../types';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ProductionOrder[];
  products: Product[];
  workCenters: WorkCenter[];
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToNav: (navId: any, subTab?: string) => void;
  onRunMRP: () => void;
  onOpenGuide: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  workCenters,
  onNavigateToOrder,
  onNavigateToNav,
  onRunMRP,
  onOpenGuide,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // open command bar
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredOrders = orders.filter(
    o => o.orderNumber.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q) || o.productSku.toLowerCase().includes(q)
  );

  const filteredProducts = products.filter(
    p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  );

  const filteredWc = workCenters.filter(
    w => w.code.toLowerCase().includes(q) || w.name.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search orders (MO-2026-00124), SKUs, work centers, or type actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onRunMRP();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium text-slate-800">Run MRP Calculation Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  onOpenGuide();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium text-slate-800">Open Manufacturing Workflow Guide</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  onNavigateToNav('manufacturing', 'shop-floor');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium text-slate-800">Launch Shop Floor Terminal Kiosk</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Orders */}
          {filteredOrders.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Production Orders
              </div>
              <div className="space-y-1">
                {filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => {
                      onNavigateToOrder(order.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Factory className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <span className="font-mono font-semibold text-slate-900 mr-2">{order.orderNumber}</span>
                        <span className="text-slate-600">{order.productName} ({order.targetQuantity} PCS)</span>
                      </div>
                    </div>
                    <span className="font-mono text-slate-500 uppercase">{order.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Master Data Items
              </div>
              <div className="space-y-1">
                {filteredProducts.slice(0, 5).map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      onNavigateToNav('master-data', 'products');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono font-medium text-slate-900">{prod.sku}</span>
                      <span className="text-slate-600 truncate">{prod.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono">Stock: {prod.currentStock} {prod.baseUom}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
