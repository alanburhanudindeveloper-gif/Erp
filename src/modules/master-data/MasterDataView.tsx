import React, { useState } from 'react';
import {
  Boxes,
  Layers,
  Route,
  Cpu,
  Scale,
  FileQuestion,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Product, BillOfMaterials, Routing, WorkCenter, UnitOfMeasure, ReasonCode } from '../../types';
import { INITIAL_UOMS } from '../../lib/mockData';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AiWorkInstructionModal } from '../../components/ai/AiWorkInstructionModal';

interface MasterDataViewProps {
  products: Product[];
  boms: BillOfMaterials[];
  routings: Routing[];
  workCenters: WorkCenter[];
  reasonCodes: ReasonCode[];
  activeSubTab: string;
  onSelectSubTab: (subTab: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  products,
  boms,
  routings,
  workCenters,
  reasonCodes,
  activeSubTab,
  onSelectSubTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBomId, setExpandedBomId] = useState<string>(boms[0]?.id || '');
  const [expandedRoutingId, setExpandedRoutingId] = useState<string>(routings[0]?.id || '');
  const [wiModal, setWiModal] = useState<{
    isOpen: boolean;
    productSku: string;
    productName: string;
    operationCode: string;
    operationName: string;
    workCenterCode: string;
    components?: any[];
  }>({
    isOpen: false,
    productSku: '',
    productName: '',
    operationCode: '',
    operationName: '',
    workCenterCode: '',
  });

  const q = searchQuery.toLowerCase();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Master Data Management</h2>
          <p className="text-xs text-slate-500">
            Define items, bill of materials formulas, routing operations, work center capacities, and standard codes.
          </p>
        </div>
      </div>

      {/* Sub-tab navigation bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('products')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Products & SKUs ({products.length})
        </button>
        <button
          onClick={() => onSelectSubTab('bom')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'bom'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bills of Material (BOM) ({boms.length})
        </button>
        <button
          onClick={() => onSelectSubTab('routings')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'routings'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Routings ({routings.length})
        </button>
        <button
          onClick={() => onSelectSubTab('work-centers')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'work-centers'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Work Centers ({workCenters.length})
        </button>
        <button
          onClick={() => onSelectSubTab('uom')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'uom'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Units of Measure (UOM)
        </button>
        <button
          onClick={() => onSelectSubTab('reason-codes')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reason-codes'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Reason Codes ({reasonCodes.length})
        </button>
      </div>

      {/* 1. Products Tab */}
      {activeSubTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Item SKU</th>
                <th className="py-2.5 px-4">Name & Category</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Standard Cost</th>
                <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                <th className="py-2.5 px-4 text-right">Allocated</th>
                <th className="py-2.5 px-4 text-right">Available</th>
                <th className="py-2.5 px-4 text-right">Lead Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {products.map((p) => {
                const available = Math.max(0, p.currentStock - p.allocatedStock);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.sku}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <div className="text-[11px] text-slate-400">{p.category}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="text-xs text-slate-600 font-medium">
                        {p.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800">
                      ${p.standardCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800 font-semibold">
                      {p.currentStock.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {p.allocatedStock.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-700">
                      {available.toLocaleString()} {p.baseUom}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                      {p.leadTimeDays} days
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. BOM Tab */}
      {activeSubTab === 'bom' && (
        <div className="space-y-4">
          {boms.map((bom) => {
            const isExpanded = expandedBomId === bom.id;
            return (
              <div key={bom.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <div
                  onClick={() => setExpandedBomId(isExpanded ? '' : bom.id)}
                  className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {bom.code} {bom.revision}
                        </span>
                        <StatusBadge status={bom.status} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Parent Item: <strong className="text-slate-800">{bom.productName}</strong> ({bom.productSku})
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 font-mono">
                    <div>{bom.components.length} Components</div>
                    <div className="text-[11px] text-slate-400">Effective: {bom.effectiveFrom}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-500 italic">{bom.notes}</p>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2 px-3">Component SKU</th>
                          <th className="py-2 px-3">Component Description</th>
                          <th className="py-2 px-3 text-right">Qty Per Unit</th>
                          <th className="py-2 px-3 text-right">Scrap %</th>
                          <th className="py-2 px-3 text-right">Standard Unit Cost</th>
                          <th className="py-2 px-3 text-right">Subtotal Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {bom.components.map((comp) => (
                          <tr key={comp.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-900">{comp.componentSku}</td>
                            <td className="py-2 px-3 font-sans text-slate-700">{comp.componentName}</td>
                            <td className="py-2 px-3 text-right tabular-nums text-slate-900 font-semibold">
                              {comp.quantityPerUnit} {comp.uom}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-slate-500">
                              {comp.scrapPercentage}%
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                              ${comp.unitCost.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-slate-900 font-bold">
                              ${(comp.quantityPerUnit * comp.unitCost * (1 + comp.scrapPercentage / 100)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Routings Tab */}
      {activeSubTab === 'routings' && (
        <div className="space-y-4">
          {routings.map((rt) => {
            const isExpanded = expandedRoutingId === rt.id;
            return (
              <div key={rt.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <div
                  onClick={() => setExpandedRoutingId(isExpanded ? '' : rt.id)}
                  className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {rt.code} {rt.revision}
                        </span>
                        <StatusBadge status={rt.status} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Product: <strong className="text-slate-800">{rt.productName}</strong> ({rt.productSku})
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    {rt.operations.length} Sequential Operations
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2 px-3">Sequence</th>
                          <th className="py-2 px-3">Operation Code & Name</th>
                          <th className="py-2 px-3">Assigned Work Center</th>
                          <th className="py-2 px-3 text-right">Setup Time</th>
                          <th className="py-2 px-3 text-right">Run Time / Unit</th>
                          <th className="py-2 px-3 text-right">Labor Rate</th>
                          <th className="py-2 px-3 text-right">Machine Rate</th>
                          <th className="py-2 px-3 text-right">WI Document (AI)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {rt.operations.map((op) => (
                          <tr key={op.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-bold text-slate-500">Seq {op.sequence}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="font-semibold text-slate-900 block">{op.operationCode}</span>
                              <span className="text-slate-500 text-[11px]">{op.instructions || op.description}</span>
                            </td>
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                              {op.workCenterName}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                              {op.setupTimeMinutes} mins
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                              {op.runTimeSecondsPerUnit} sec
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                              ${op.laborHourlyRate}/h
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                              ${op.machineHourlyRate}/h
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() =>
                                  setWiModal({
                                    isOpen: true,
                                    productSku: rt.productSku,
                                    productName: rt.productName,
                                    operationCode: op.operationCode,
                                    operationName: op.name,
                                    workCenterCode: op.workCenterCode,
                                    components: [],
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors whitespace-nowrap"
                                title="Generate Work Instruction / SOP with Generative AI (Section 9.2)"
                              >
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span>Generate WI</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Work Centers Tab */}
      {activeSubTab === 'work-centers' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Center Code</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-right">Daily Capacity</th>
                <th className="py-2.5 px-4 text-right">Efficiency Rate</th>
                <th className="py-2.5 px-4 text-right">Cost Rate</th>
                <th className="py-2.5 px-4">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {workCenters.map((wc) => (
                <tr key={wc.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{wc.code}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-800">{wc.name}</td>
                  <td className="py-3 px-4 font-sans text-slate-600">{wc.department}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-800">
                    {wc.capacityHoursPerDay} hrs / day
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-700 font-semibold">
                    {Math.round(wc.efficiencyRate * 100)}%
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-800 font-semibold">
                    ${(wc.costRate || wc.hourlyRate || 0).toFixed(2)}/hr
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={wc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. UOM Tab */}
      {activeSubTab === 'uom' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs max-w-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">UOM Code</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {INITIAL_UOMS.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.code}</td>
                  <td className="py-3 px-4 font-sans text-slate-800">{u.name}</td>
                  <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">{u.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Reason Codes Tab */}
      {activeSubTab === 'reason-codes' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Reason Code</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Primary Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reasonCodes.map((rc) => (
                <tr key={rc.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{rc.code}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      rc.category === 'SCRAP'
                        ? 'text-rose-700 bg-rose-50'
                        : rc.category === 'DOWNTIME'
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-purple-700 bg-purple-50'
                    }`}>
                      {rc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-800">{rc.description}</td>
                  <td className="py-3 px-4 font-sans text-slate-500">{rc.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Generative Work Instruction Modal (Section 9.2) */}
      <AiWorkInstructionModal
        isOpen={wiModal.isOpen}
        onClose={() => setWiModal((prev) => ({ ...prev, isOpen: false }))}
        productSku={wiModal.productSku}
        productName={wiModal.productName}
        operationCode={wiModal.operationCode}
        operationName={wiModal.operationName}
        workCenterCode={wiModal.workCenterCode}
        components={wiModal.components}
        onApproveWI={(wi) => {
          alert(`Work Instruction ${wi.wiCode} approved by Lead Engineer and published to shop floor!`);
        }}
      />
    </div>
  );
};
