import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  PackageCheck,
  Send,
  Building2,
  Calendar,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { SubcontractOrder, Supplier, ProductionOrder } from '../../types';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createStatusColumn,
  createDateColumn,
} from '../../components/data-grid';

interface SubcontractingViewProps {
  orders: SubcontractOrder[];
  suppliers: Supplier[];
  productionOrders: ProductionOrder[];
  onCreateOrder: (order: Omit<SubcontractOrder, 'id'>) => void;
  onReceiveOrder: (orderId: string, receivedQty: number) => void;
}

export const SubcontractingView: React.FC<SubcontractingViewProps> = ({
  orders,
  suppliers,
  productionOrders,
  onCreateOrder,
  onReceiveOrder,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiveModalItem, setReceiveModalItem] = useState<SubcontractOrder | null>(null);
  const [receiveQty, setReceiveQty] = useState<number>(0);

  // Form State
  const [selectedMo, setSelectedMo] = useState<string>(productionOrders[0]?.orderNumber || 'MO-2026-00124');
  const [operationRef, setOperationRef] = useState<string>('03 Surface Anodizing & Powder Coating');
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || 'sup-003');
  const [targetQty, setTargetQty] = useState<number>(500);
  const [unitCost, setUnitCost] = useState<number>(15000);
  const [expectedDate, setExpectedDate] = useState<string>('2026-10-28');
  const [materialSku, setMaterialSku] = useState<string>('Material X Machined');
  const [materialQty, setMaterialQty] = useState<number>(500);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === supplierId);
    onCreateOrder({
      orderNo: `SBC-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      operationRef,
      productionOrderNo: selectedMo,
      supplierId,
      supplierName: supplier?.name || 'External Subcontractor',
      targetQuantity: targetQty,
      receivedQuantity: 0,
      unitCost,
      totalCost: targetQty * unitCost,
      status: 'MATERIAL_SENT',
      sentDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: expectedDate,
      materialSent: [
        {
          sku: materialSku,
          name: `${materialSku} Work Piece`,
          quantity: materialQty,
          uom: 'PCS',
          sentDate: new Date().toISOString().split('T')[0],
        },
      ],
    });

    setIsModalOpen(false);
  };

  const columns = useMemo<GridColumn<SubcontractOrder>[]>(
    () => [
      createTextColumn<SubcontractOrder>('orderNo', 'Subcontract Order #', {
        width: 150,
        pinned: 'left',
        isCode: true,
      }),
      createTextColumn<SubcontractOrder>('productionOrderNo', 'MO Parent Ref', {
        width: 140,
        isCode: true,
      }),
      createTextColumn<SubcontractOrder>('operationRef', 'Outsourced Operation', { width: 220 }),
      createTextColumn<SubcontractOrder>('supplierName', 'Certified Subcontractor', { width: 200 }),
      createNumberColumn<SubcontractOrder>('targetQuantity', 'Target Qty', { width: 110 }),
      createNumberColumn<SubcontractOrder>('receivedQuantity', 'Received Qty', { width: 110 }),
      createNumberColumn<SubcontractOrder>('unitCost', 'Unit Cost (Rp)', {
        width: 120,
        renderCell: ({ value }) => (
          <span className="font-mono text-xs">Rp {value.toLocaleString()}</span>
        ),
      }),
      createDateColumn<SubcontractOrder>('expectedReturnDate', 'Expected Return', { width: 130 }),
      createStatusColumn<SubcontractOrder>('status', 'Status', {
        width: 150,
        filterOptions: [
          { label: 'COMPLETED', value: 'COMPLETED' },
          { label: 'PARTIALLY RECEIVED', value: 'PARTIALLY_RECEIVED' },
          { label: 'IN PROCESSING', value: 'IN_PROCESSING' },
          { label: 'MATERIAL SENT', value: 'MATERIAL_SENT' },
        ],
      }),
      {
        field: 'actions',
        headerName: 'Action',
        type: 'text',
        width: 130,
        renderCell: ({ row }) =>
          row.status !== 'COMPLETED' ? (
            <button
              onClick={() => {
                setReceiveModalItem(row);
                setReceiveQty(row.targetQuantity - row.receivedQuantity);
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
            >
              <PackageCheck className="w-3 h-3" />
              <span>Receive Return</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono text-emerald-700 font-bold">COMPLETED</span>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Subcontracting & Outsourced Operations
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded">
              SECTION 24 SPEC
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pengiriman material ke supplier pihak ketiga, pelacakan proses eksternal, dan pencatatan penerimaan kembali ke dermaga pabrik.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Order Subkontrak</span>
        </button>
      </div>

      {/* Grid */}
      <EnterpriseDataGrid<SubcontractOrder>
        data={orders}
        columns={columns}
        pagination
        searchable
        filtering
        sorting
        columnResizing
        exportable
        exportFileName="subcontract_orders_ledger"
        density="compact"
      />

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                Penerbitan Order Operasi Subkontrak
              </h3>
              <p className="text-xs text-slate-500">
                Pilih pesanan manufaktur induk dan supplier tersertifikasi untuk proses luar.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Production Order Induk:</label>
                  <select
                    value={selectedMo}
                    onChange={(e) => setSelectedMo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  >
                    {productionOrders.map((mo) => (
                      <option key={mo.id} value={mo.orderNumber}>
                        {mo.orderNumber} ({mo.productSku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Subkontraktor:</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Operasi yang Di-outsource:</label>
                <input
                  type="text"
                  required
                  value={operationRef}
                  onChange={(e) => setOperationRef(e.target.value)}
                  placeholder="Misal: 03 Surface Anodizing / Heat Treatment"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Target:</label>
                  <input
                    type="number"
                    required
                    value={targetQty}
                    onChange={(e) => setTargetQty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya per Unit (Rp):</label>
                  <input
                    type="number"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Kembali:</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="font-semibold text-slate-800 text-[11px] font-mono uppercase">
                  Material yang Dikirim ke Vendor:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={materialSku}
                    onChange={(e) => setMaterialSku(e.target.value)}
                    placeholder="Material SKU..."
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                  <input
                    type="number"
                    value={materialQty}
                    onChange={(e) => setMaterialQty(Number(e.target.value))}
                    placeholder="Jumlah kirim..."
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold"
                >
                  Kirim Dispatch Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900">Penerimaan Pengembalian Subkontrak</h3>
              <p className="text-slate-500 font-mono text-[11px]">{receiveModalItem.orderNo}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Supplier:</span>
                <span className="font-bold">{receiveModalItem.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sisa yang Belum Diterima:</span>
                <span className="font-mono font-bold text-blue-700">
                  {receiveModalItem.targetQuantity - receiveModalItem.receivedQuantity} PCS
                </span>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Unit Diterima:</label>
                <input
                  type="number"
                  min={1}
                  max={receiveModalItem.targetQuantity - receiveModalItem.receivedQuantity}
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReceiveModalItem(null)}
                className="px-3 py-1 text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onReceiveOrder(receiveModalItem.id, receiveQty);
                  setReceiveModalItem(null);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
              >
                Simpan Penerimaan Dock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
