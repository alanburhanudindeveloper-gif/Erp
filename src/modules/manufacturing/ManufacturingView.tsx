import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Factory,
  Boxes,
  MonitorCheck,
  Calendar,
} from 'lucide-react';
import { ProductionOrder, Product, WorkCenter, ReasonCode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProductionOrderDetail } from './ProductionOrderDetail';
import { ShopFloorTerminal } from './ShopFloorTerminal';
import { ManufacturingGanttChart } from './ManufacturingGanttChart';

interface ManufacturingViewProps {
  orders: ProductionOrder[];
  products: Product[];
  workCenters: WorkCenter[];
  reasonCodes: ReasonCode[];
  activeSubTab: string;
  selectedOrderId?: string;
  onSelectSubTab: (tabId: string) => void;
  onSelectOrder: (orderId: string) => void;
  onReleaseOrder: (orderId: string) => void;
  onStartOperation: (orderId: string, seq: number, operator: string) => void;
  onReportOutput: (
    orderId: string,
    seq: number,
    goodQty: number,
    scrapQty: number,
    reasonCode: string | undefined,
    operator: string,
    notes?: string
  ) => void;
  onCompleteOperation: (orderId: string, seq: number) => void;
  onCloseOrder: (orderId: string) => void;
  onCreateOrder: (data: { productId: string; quantity: number; dueDate: string }) => void;
}

export const ManufacturingView: React.FC<ManufacturingViewProps> = ({
  orders,
  products,
  workCenters,
  reasonCodes,
  activeSubTab,
  selectedOrderId,
  onSelectSubTab,
  onSelectOrder,
  onReleaseOrder,
  onStartOperation,
  onReportOutput,
  onCompleteOperation,
  onCloseOrder,
  onCreateOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderProduct, setNewOrderProduct] = useState(products[0]?.id || '');
  const [newOrderQty, setNewOrderQty] = useState(500);
  const [newOrderDueDate, setNewOrderDueDate] = useState('2026-11-10');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // If a specific order is selected and we're on production-orders tab, show detail
  if (selectedOrder && activeSubTab === 'production-orders') {
    return (
      <ProductionOrderDetail
        order={selectedOrder}
        onBack={() => onSelectOrder('')}
        onReleaseOrder={onReleaseOrder}
        onStartOperation={onStartOperation}
        onReportOutput={onReportOutput}
        onCompleteOperation={onCompleteOperation}
        onCloseOrder={onCloseOrder}
        reasonCodes={reasonCodes}
      />
    );
  }

  // Gantt chart view
  if (activeSubTab === 'gantt') {
    return (
      <div className="space-y-4">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => onSelectSubTab('production-orders')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap"
          >
            Production Orders (MO) ({orders.length})
          </button>
          <button
            onClick={() => onSelectSubTab('gantt')}
            className="px-3 py-2 border-b-2 border-slate-900 text-slate-900 font-semibold transition-colors whitespace-nowrap"
          >
            Gantt Schedule & Dependencies
          </button>
          <button
            onClick={() => onSelectSubTab('work-orders')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap"
          >
            Work Orders Dispatch
          </button>
          <button
            onClick={() => onSelectSubTab('shop-floor')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap"
          >
            Shop Floor Terminal Kiosk
          </button>
        </div>

        <ManufacturingGanttChart
          orders={orders}
          workCenters={workCenters}
          onSelectOrder={(id) => {
            onSelectOrder(id);
            onSelectSubTab('production-orders');
          }}
          onNavigateToShopFloor={(wcCode) => {
            onSelectSubTab('shop-floor');
          }}
        />
      </div>
    );
  }

  // Shop floor terminal view
  if (activeSubTab === 'shop-floor') {
    return (
      <ShopFloorTerminal
        workCenters={workCenters}
        orders={orders}
        reasonCodes={reasonCodes}
        onStartOp={onStartOperation}
        onLogOutput={onReportOutput}
        onCompleteOp={onCompleteOperation}
      />
    );
  }

  // Work Orders tab
  if (activeSubTab === 'work-orders') {
    const allOperations = orders.flatMap(o =>
      o.operations.map(op => ({ ...op, orderNumber: o.orderNumber, orderId: o.id, productName: o.productName }))
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Work Orders Dispatch Queue</h3>
            <p className="text-xs text-slate-500">Operation-level routing jobs allocated to work centers</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Order & Operation</th>
                <th className="py-2.5 px-4">Assigned Work Center</th>
                <th className="py-2.5 px-4 text-right">Target</th>
                <th className="py-2.5 px-4 text-right">Completed</th>
                <th className="py-2.5 px-4 text-right">Scrap</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {allOperations.map((item) => (
                <tr key={`${item.orderId}-${item.sequence}`} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans">
                    <span className="font-mono font-semibold text-slate-900">{item.orderNumber}</span>
                    <div className="text-xs font-medium text-slate-700">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.productName}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-slate-800">{item.workCenterCode}</span>
                    <div className="text-[11px] text-slate-500">{item.workCenterName}</div>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-800 font-semibold">
                    {item.targetQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-700 font-semibold">
                    {item.completedQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-rose-600">
                    {item.scrapQty}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => {
                        onSelectSubTab('production-orders');
                        onSelectOrder(item.orderId);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      View Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Filtered Production Orders list
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productSku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Production Orders (MO)</h2>
          <p className="text-xs text-slate-500">
            Manage shop floor manufacturing work orders, BOM allocations, and execution
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Production Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, SKU, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Status segmented filters */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
              <th className="py-2.5 px-4">Order #</th>
              <th className="py-2.5 px-4">Product / SKU</th>
              <th className="py-2.5 px-4 text-right">Target Qty</th>
              <th className="py-2.5 px-4 text-right">Output (Good / Scrap)</th>
              <th className="py-2.5 px-4">Due Date</th>
              <th className="py-2.5 px-4">Material Avail.</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-slate-800">{order.productName}</span>
                    <span className="text-slate-400 block text-[11px] font-mono">{order.productSku}</span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-900 font-semibold">
                    {order.targetQuantity.toLocaleString()} PCS
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span className="text-emerald-700 font-semibold">{order.goodQuantity}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-rose-600">{order.scrapQuantity}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs font-sans whitespace-nowrap">
                    {order.dueDate}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-xs font-semibold ${
                        order.materialAvailabilityPct === 100 ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {order.materialAvailabilityPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <span className="text-slate-400 hover:text-slate-700 font-medium inline-flex items-center gap-1">
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                  No production orders matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Create New Production Order</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Product</label>
                <select
                  value={newOrderProduct}
                  onChange={(e) => setNewOrderProduct(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-medium"
                >
                  {products
                    .filter((p) => p.type !== 'RAW_MATERIAL')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Production Batch Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newOrderQty}
                  onChange={(e) => setNewOrderQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newOrderDueDate}
                  onChange={(e) => setNewOrderDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none font-sans"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">ERP Lifecycle Rule:</div>
                <p className="text-[11px]">
                  Creating this order registers it as PLANNED. The BOM and Routing will automatically explode, and you can verify Material Availability before releasing to shop floor.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onCreateOrder({
                      productId: newOrderProduct,
                      quantity: newOrderQty,
                      dueDate: newOrderDueDate,
                    });
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors"
                >
                  Generate Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
