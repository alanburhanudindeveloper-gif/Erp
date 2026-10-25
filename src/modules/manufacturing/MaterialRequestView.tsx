import React, { useState } from 'react';
import { useErpStore } from '../../lib/services/manufacturingService';
import { MaterialRequest, MaterialRequestItem } from '../../types';
import {
  Boxes,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  PackageCheck,
  Layers,
  MapPin,
  Barcode,
  Building2,
} from 'lucide-react';

export const MaterialRequestView: React.FC = () => {
  const {
    state,
    createMaterialRequest,
    pickMaterialRequest,
    deliverMaterialRequestToLine,
  } = useErpStore();

  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMrSource, setNewMrSource] = useState<'NPI_TRIAL' | 'PRODUCTION_ORDER'>('NPI_TRIAL');
  const [destinationLine, setDestinationLine] = useState('Cell A - Staging Bay (Line 1)');
  const [selectedMoId, setSelectedMoId] = useState<string>(
    state.productionOrders[0]?.id || 'mo-124'
  );
  const [selectedNpiId, setSelectedNpiId] = useState<string>(
    state.npiProjects[0]?.id || 'npi-001'
  );

  const filteredRequests = state.materialRequests.filter((mr) => {
    if (filterSource === 'NPI') return mr.sourceType === 'NPI_TRIAL' || mr.sourceType === 'NPI_PILOT';
    if (filterSource === 'PRODUCTION') return mr.sourceType === 'PRODUCTION_ORDER';
    return true;
  });

  const handleCreateNewMr = (e: React.FormEvent) => {
    e.preventDefault();

    let items: MaterialRequestItem[] = [];
    let sourceRef = '';
    let prodSku = '';

    if (newMrSource === 'NPI_TRIAL') {
      const npi = state.npiProjects.find((p) => p.id === selectedNpiId);
      sourceRef = npi?.projectNumber || 'NPI-2026-001';
      prodSku = npi?.productSku || 'ABC-100';
      items = [
        {
          id: `mri-new-${Date.now()}-1`,
          productId: 'raw-001',
          sku: 'Material X',
          name: 'Extruded Aluminum Billet 6061-T6',
          requestedQuantity: 60,
          pickedQuantity: 0,
          deliveredQuantity: 0,
          uom: 'KG',
          fromWarehouse: 'PLANT01-RM-WH-A01',
          toLocation: destinationLine,
          status: 'PENDING',
        },
        {
          id: `mri-new-${Date.now()}-2`,
          productId: 'raw-002',
          sku: 'Material Y',
          name: 'Precision Enameled Copper Wire',
          requestedQuantity: 250,
          pickedQuantity: 0,
          deliveredQuantity: 0,
          uom: 'MTR',
          fromWarehouse: 'PLANT01-RM-WH-BAY-02',
          toLocation: destinationLine,
          status: 'PENDING',
        },
      ];
    } else {
      const mo = state.productionOrders.find((o) => o.id === selectedMoId);
      sourceRef = mo?.orderNumber || 'MO-2026-00124';
      prodSku = mo?.productSku || 'Product A';
      items = mo
        ? mo.materials.map((m, idx) => ({
            id: `mri-mo-${Date.now()}-${idx}`,
            productId: m.productId,
            sku: m.sku,
            name: m.name,
            requestedQuantity: m.requiredQty,
            pickedQuantity: 0,
            deliveredQuantity: 0,
            uom: m.uom,
            fromWarehouse: 'PLANT01-RM-WH-A01',
            toLocation: destinationLine,
            status: 'PENDING',
          }))
        : [];
    }

    createMaterialRequest({
      sourceType: newMrSource,
      sourceReferenceId: sourceRef,
      productSku: prodSku,
      requester: state.currentUser.name,
      department: 'Shop Floor Staging',
      requiredDate: new Date().toISOString().split('T')[0],
      destinationLine,
      priority: 'HIGH',
      items,
      notes: `Requisition for ${newMrSource.replace(/_/g, ' ')} dispatch.`,
    });

    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Section 14 & 15
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Material Requests & Physical Line Delivery
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physical material movement from warehouse inventory to production lines and staging bays. Every delivery logs immutable movements to the WIP stock ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Source Filter */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterSource === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({state.materialRequests.length})
            </button>
            <button
              onClick={() => setFilterSource('NPI')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterSource === 'NPI'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              NPI Trials
            </button>
            <button
              onClick={() => setFilterSource('PRODUCTION')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterSource === 'PRODUCTION'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Production Orders
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Material Request
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((mr) => {
          const isDelivered = mr.status === 'DELIVERED';
          const isReady = mr.status === 'READY';
          return (
            <div
              key={mr.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {mr.requestNumber}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Source: {mr.sourceReferenceId}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {mr.sourceType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Destination: <span className="font-semibold text-slate-700 dark:text-slate-300">{mr.destinationLine}</span>
                      • Requester: {mr.requester}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isDelivered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : isReady
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    STATUS: {mr.status}
                  </span>

                  {!isDelivered && !isReady && (
                    <button
                      onClick={() => pickMaterialRequest(mr.id, state.currentUser.name)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      Pick from Warehouse
                    </button>
                  )}

                  {isReady && !isDelivered && (
                    <button
                      onClick={() => deliverMaterialRequestToLine(mr.id, state.currentUser.name, mr.destinationLine)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Confirm Line Delivery
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Material SKU & Description</th>
                      <th className="p-2.5">Requested Qty</th>
                      <th className="p-2.5">Picked Qty</th>
                      <th className="p-2.5">Delivered to Line</th>
                      <th className="p-2.5">Origin Warehouse Bin</th>
                      <th className="p-2.5">Item Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mr.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{it.sku}</div>
                          <div className="text-[11px] text-slate-400">{it.name}</div>
                        </td>
                        <td className="p-2.5 font-mono font-bold">
                          {it.requestedQuantity} {it.uom}
                        </td>
                        <td className="p-2.5 font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {it.pickedQuantity} {it.uom}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {it.deliveredQuantity} {it.uom}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">{it.fromWarehouse}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              it.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : it.status === 'PICKED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}
                          >
                            {it.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delivery History Footnote */}
              {isDelivered && (
                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span>
                    Delivered by: <span className="font-medium text-slate-600 dark:text-slate-300">{mr.deliveredBy}</span> ({mr.deliveredAt})
                  </span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Inventory Posted to WIP Ledger (BR-GLOBAL-004)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create MR Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-500" />
              Create New Material Request
            </h3>
            <form onSubmit={handleCreateNewMr} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Demand Source Type</label>
                <select
                  value={newMrSource}
                  onChange={(e) => setNewMrSource(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                >
                  <option value="NPI_TRIAL">NPI Project Trial Run (Pre-Production)</option>
                  <option value="PRODUCTION_ORDER">Standard Production Order (MO)</option>
                </select>
              </div>

              {newMrSource === 'NPI_TRIAL' ? (
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Select NPI Project</label>
                  <select
                    value={selectedNpiId}
                    onChange={(e) => setSelectedNpiId(e.target.value)}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  >
                    {state.npiProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectNumber} — {p.productSku} ({p.productName})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Select Production Order (MO)</label>
                  <select
                    value={selectedMoId}
                    onChange={(e) => setSelectedMoId(e.target.value)}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  >
                    {state.productionOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.productSku} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Destination Line Location</label>
                <input
                  type="text"
                  value={destinationLine}
                  onChange={(e) => setDestinationLine(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded"
                >
                  Generate Material Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
