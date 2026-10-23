import React, { useState, useMemo } from 'react';
import {
  Plus,
  Factory,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Send,
} from 'lucide-react';
import { ProductionOrder, Product, WorkCenter, ReasonCode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProductionOrderDetail } from './ProductionOrderDetail';
import { ShopFloorTerminal } from './ShopFloorTerminal';
import { ManufacturingGanttChart } from './ManufacturingGanttChart';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createDateColumn,
  createStatusColumn,
  createProgressColumn,
  createActionColumn,
  BulkAction,
} from '../../components/data-grid';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderProduct, setNewOrderProduct] = useState(products[0]?.id || '');
  const [newOrderQty, setNewOrderQty] = useState(500);
  const [newOrderDueDate, setNewOrderDueDate] = useState('2026-11-10');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

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
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => onSelectSubTab('production-orders')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            Production Orders (MO) ({orders.length})
          </button>
          <button
            onClick={() => onSelectSubTab('gantt')}
            className="px-3 py-2 border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold transition-colors whitespace-nowrap"
          >
            Gantt Schedule & Dependencies
          </button>
          <button
            onClick={() => onSelectSubTab('work-orders')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            Work Orders Dispatch
          </button>
          <button
            onClick={() => onSelectSubTab('shop-floor')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
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
          onNavigateToShopFloor={() => {
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
    const allOperations = orders.flatMap((o) =>
      o.operations.map((op) => ({
        ...op,
        id: `${o.id}-${op.sequence}`,
        orderNumber: o.orderNumber,
        orderId: o.id,
        productName: o.productName,
        progressPct: Math.round((op.completedQty / (op.targetQty || 1)) * 100),
      }))
    );

    const workOrderColumns: GridColumn<any>[] = [
      createTextColumn<any>('orderNumber', 'Order Ref', { isCode: true, pinned: 'left', width: 140 }),
      {
        field: 'name',
        headerName: 'Operation Name',
        type: 'text',
        width: 200,
        renderCell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">{row.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{row.productName}</div>
          </div>
        ),
      },
      {
        field: 'workCenterCode',
        headerName: 'Work Center',
        type: 'text',
        width: 170,
        renderCell: ({ row }) => (
          <div>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {row.workCenterCode}
            </span>
            <span className="text-[10px] text-slate-400 block">{row.workCenterName}</span>
          </div>
        ),
      },
      createNumberColumn<any>('targetQty', 'Target Qty', { width: 110 }),
      createNumberColumn<any>('completedQty', 'Completed', { width: 110 }),
      createNumberColumn<any>('scrapQty', 'Scrap', { width: 90 }),
      createProgressColumn<any>('progressPct', 'Progress %', { width: 130, max: 100 }),
      createStatusColumn<any>('status', 'WO Status', {
        width: 130,
        filterOptions: [
          { label: 'PLANNED', value: 'PLANNED' },
          { label: 'IN PROGRESS', value: 'IN_PROGRESS' },
          { label: 'COMPLETED', value: 'COMPLETED' },
        ],
      }),
      createActionColumn<any>(({ row }) => (
        <button
          onClick={() => {
            onSelectSubTab('production-orders');
            onSelectOrder(row.orderId);
          }}
          className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      )),
    ];

    return (
      <div className="space-y-4">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => onSelectSubTab('production-orders')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            Production Orders (MO) ({orders.length})
          </button>
          <button
            onClick={() => onSelectSubTab('gantt')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            Gantt Schedule & Dependencies
          </button>
          <button
            onClick={() => onSelectSubTab('work-orders')}
            className="px-3 py-2 border-b-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold transition-colors whitespace-nowrap"
          >
            Work Orders Dispatch
          </button>
          <button
            onClick={() => onSelectSubTab('shop-floor')}
            className="px-3 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            Shop Floor Terminal Kiosk
          </button>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Work Orders Dispatch Queue
              </span>
              <span className="text-slate-400 ml-2">Operation-level routing jobs allocated to work centers</span>
            </div>
            <span className="font-mono text-slate-500 dark:text-slate-400">{allOperations.length} operations</span>
          </div>

          <EnterpriseDataGrid<any>
            data={allOperations}
            columns={workOrderColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="work_orders_dispatch_queue"
            density="compact"
          />
        </div>
      </div>
    );
  }

  // 1. Production Orders (MO) Table Columns
  const moColumns: GridColumn<ProductionOrder>[] = [
    createTextColumn<ProductionOrder>('orderNumber', 'Order #', { isCode: true, pinned: 'left', width: 140 }),
    {
      field: 'productName',
      headerName: 'Product / SKU',
      type: 'text',
      width: 220,
      renderCell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{row.productName}</span>
          <span className="font-mono text-[11px] text-slate-400 block">{row.productSku}</span>
        </div>
      ),
    },
    createNumberColumn<ProductionOrder>('targetQuantity', 'Target Qty', { width: 110 }),
    {
      field: 'goodQuantity',
      headerName: 'Output (Good / Scrap)',
      type: 'number',
      width: 170,
      align: 'right',
      renderCell: ({ row }) => (
        <span className="tabular-nums font-mono text-xs">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {row.goodQuantity.toLocaleString()}
          </span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-rose-600 dark:text-rose-400">{row.scrapQuantity.toLocaleString()}</span>
        </span>
      ),
    },
    createDateColumn<ProductionOrder>('dueDate', 'Due Date', { width: 120 }),
    {
      field: 'materialAvailabilityPct',
      headerName: 'Material Avail.',
      type: 'progress',
      width: 140,
      renderCell: ({ row }) => {
        const isReady = row.materialAvailabilityPct >= 100;
        return (
          <div className="flex items-center gap-1.5 w-full">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, row.materialAvailabilityPct)}%` }}
              />
            </div>
            <span
              className={`font-mono text-[10px] w-9 text-right font-medium ${
                isReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {row.materialAvailabilityPct}%
            </span>
          </div>
        );
      },
    },
    createStatusColumn<ProductionOrder>('status', 'Status', {
      width: 130,
      filterOptions: [
        { label: 'PLANNED', value: 'PLANNED' },
        { label: 'RELEASED', value: 'RELEASED' },
        { label: 'IN PROGRESS', value: 'IN_PROGRESS' },
        { label: 'COMPLETED', value: 'COMPLETED' },
        { label: 'CLOSED', value: 'CLOSED' },
      ],
    }),
    createActionColumn<ProductionOrder>(({ row }) => (
      <div className="flex items-center justify-end gap-1.5">
        {row.status === 'PLANNED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReleaseOrder(row.id);
            }}
            className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded transition-colors"
            title="Release to Shop Floor (Allocates & Hard Reserves Materials)"
          >
            Release
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectOrder(row.id);
          }}
          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          title="Open Order Details"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    ), { width: 130 }),
  ];

  // Bulk Actions for MOs
  const bulkActions: BulkAction<ProductionOrder>[] = [
    {
      label: 'Release Selected Orders',
      icon: Send,
      variant: 'primary',
      onClick: (selected) => {
        const plannedOrders = selected.filter((o) => o.status === 'PLANNED');
        if (plannedOrders.length === 0) {
          alert('Selected orders are already released or completed.');
          return;
        }
        plannedOrders.forEach((o) => onReleaseOrder(o.id));
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Production Orders (MO)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage shop floor manufacturing work orders, BOM allocations, and execution
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 rounded transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Production Order</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('production-orders')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'production-orders'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Production Orders (MO) ({orders.length})
        </button>
        <button
          onClick={() => onSelectSubTab('gantt')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'gantt'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Gantt Schedule & Dependencies
        </button>
        <button
          onClick={() => onSelectSubTab('work-orders')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'work-orders'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Work Orders Dispatch
        </button>
        <button
          onClick={() => onSelectSubTab('shop-floor')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'shop-floor'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Shop Floor Terminal Kiosk
        </button>
      </div>

      {/* Production Orders EnterpriseDataGrid */}
      <EnterpriseDataGrid<ProductionOrder>
        data={orders}
        columns={moColumns}
        pagination
        searchable
        searchPlaceholder="Search order #, SKU, or product name..."
        filtering
        sorting
        columnResizing
        rowSelection
        bulkActions={bulkActions}
        exportable
        exportFileName="production_orders_ledger"
        density="compact"
        onRowClick={(order) => onSelectOrder(order.id)}
        renderDetailRow={(order) => (
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
              <span>BOM Components Allocated ({order.materials.length})</span>
              <button
                onClick={() => onSelectOrder(order.id)}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
              >
                Full Routing & Operations <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {order.materials.map((m) => (
                <div
                  key={m.productId}
                  className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[11px]"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200">{m.sku} — {m.name}</div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Required: {m.requiredQty} {m.uom} | Allocated: {m.allocatedQty} {m.uom} | Consumed: {m.consumedQty} {m.uom}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                    Stock Available: {m.availableStock} {m.uom} ({m.status})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      />

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Create New Production Order
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Finished Good Product
                </label>
                <select
                  value={newOrderProduct}
                  onChange={(e) => setNewOrderProduct(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none"
                >
                  {products
                    .filter((p) => p.type === 'FINISHED_GOOD')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Target Production Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={newOrderQty}
                  onChange={(e) => setNewOrderQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Target Completion Due Date
                </label>
                <input
                  type="date"
                  value={newOrderDueDate}
                  onChange={(e) => setNewOrderDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
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
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 rounded shadow-xs"
              >
                Generate Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
