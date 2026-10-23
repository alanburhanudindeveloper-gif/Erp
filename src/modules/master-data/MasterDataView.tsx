import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Layers,
  Route,
  Cpu,
  Scale,
  FileQuestion,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Product, BillOfMaterials, Routing, WorkCenter, UnitOfMeasure, ReasonCode } from '../../types';
import { INITIAL_UOMS } from '../../lib/mockData';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AiWorkInstructionModal } from '../../components/ai/AiWorkInstructionModal';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createCurrencyColumn,
  createStatusColumn,
  createActionColumn,
  GridDetailDrawer,
} from '../../components/data-grid';

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
  const [expandedBomId, setExpandedBomId] = useState<string>(boms[0]?.id || '');
  const [expandedRoutingId, setExpandedRoutingId] = useState<string>(routings[0]?.id || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  // 1. Products Columns
  const productColumns = useMemo<GridColumn<Product>[]>(
    () => [
      createTextColumn<Product>('sku', 'Item SKU', { isCode: true, pinned: 'left', width: 140 }),
      {
        field: 'name',
        headerName: 'Name & Category',
        type: 'text',
        width: 220,
        renderCell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
            <div className="text-[10px] text-slate-400">{row.category}</div>
          </div>
        ),
      },
      createStatusColumn<Product>('type', 'Item Type', {
        width: 140,
        filterOptions: [
          { label: 'RAW MATERIAL', value: 'RAW_MATERIAL' },
          { label: 'FINISHED GOOD', value: 'FINISHED_GOOD' },
          { label: 'WORK IN PROGRESS', value: 'WIP' },
        ],
      }),
      createCurrencyColumn<Product>('standardCost', 'Standard Cost', { currency: 'USD', decimals: 2, width: 130 }),
      createNumberColumn<Product>('currentStock', 'Stock On Hand', { uomField: 'baseUom', width: 130 }),
      createNumberColumn<Product>('allocatedStock', 'Allocated', { uomField: 'baseUom', width: 120 }),
      {
        field: 'available',
        headerName: 'Available',
        type: 'number',
        width: 130,
        align: 'right',
        sortable: true,
        valueGetter: (row) => Math.max(0, row.currentStock - row.allocatedStock),
        renderCell: ({ row }) => {
          const avail = Math.max(0, row.currentStock - row.allocatedStock);
          return (
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {avail.toLocaleString()} {row.baseUom}
            </span>
          );
        },
      },
      createNumberColumn<Product>('leadTimeDays', 'Lead Time', { uomText: 'days', width: 110 }),
      createActionColumn<Product>(({ row }) => (
        <button
          onClick={() => setSelectedProduct(row)}
          className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      )),
    ],
    []
  );

  // 4. Work Centers Columns
  const workCenterColumns = useMemo<GridColumn<WorkCenter>[]>(
    () => [
      createTextColumn<WorkCenter>('code', 'Center Code', { isCode: true, pinned: 'left', width: 130 }),
      createTextColumn<WorkCenter>('name', 'Name', { width: 200 }),
      createTextColumn<WorkCenter>('department', 'Department', { width: 160 }),
      createNumberColumn<WorkCenter>('capacityHoursPerDay', 'Daily Capacity', { uomText: 'hrs/day', width: 130 }),
      {
        field: 'efficiencyRate',
        headerName: 'Efficiency Rate',
        type: 'number',
        width: 130,
        align: 'right',
        renderCell: ({ value }) => (
          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {Math.round((value || 0) * 100)}%
          </span>
        ),
      },
      createCurrencyColumn<WorkCenter>('costRate', 'Cost Rate', {
        currency: 'USD',
        decimals: 2,
        width: 130,
        valueGetter: (row) => row.costRate || row.hourlyRate || 0,
      }),
      createStatusColumn<WorkCenter>('status', 'Status', { width: 120 }),
    ],
    []
  );

  // 5. UOM Columns
  const uomColumns = useMemo<GridColumn<UnitOfMeasure>[]>(
    () => [
      createTextColumn<UnitOfMeasure>('code', 'UOM Code', { isCode: true, pinned: 'left', width: 130 }),
      createTextColumn<UnitOfMeasure>('name', 'Full Name', { width: 220 }),
      createTextColumn<UnitOfMeasure>('category', 'Category', { width: 160 }),
    ],
    []
  );

  // 6. Reason Codes Columns
  const reasonCodeColumns = useMemo<GridColumn<ReasonCode>[]>(
    () => [
      createTextColumn<ReasonCode>('code', 'Reason Code', { isCode: true, pinned: 'left', width: 140 }),
      createStatusColumn<ReasonCode>('category', 'Category', { width: 130 }),
      createTextColumn<ReasonCode>('description', 'Description', { width: 260 }),
      createTextColumn<ReasonCode>('department', 'Primary Department', { width: 160 }),
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Master Data Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define items, bill of materials formulas, routing operations, work center capacities, and standard codes.
          </p>
        </div>
      </div>

      {/* Sub-tab navigation bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('products')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Products & SKUs ({products.length})
        </button>
        <button
          onClick={() => onSelectSubTab('bom')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'bom'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Bills of Material (BOM) ({boms.length})
        </button>
        <button
          onClick={() => onSelectSubTab('routings')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'routings'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Routings ({routings.length})
        </button>
        <button
          onClick={() => onSelectSubTab('work-centers')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'work-centers'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Work Centers ({workCenters.length})
        </button>
        <button
          onClick={() => onSelectSubTab('uom')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'uom'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Units of Measure (UOM)
        </button>
        <button
          onClick={() => onSelectSubTab('reason-codes')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reason-codes'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Reason Codes ({reasonCodes.length})
        </button>
      </div>

      {/* 1. Products Tab */}
      {activeSubTab === 'products' && (
        <EnterpriseDataGrid<Product>
          data={products}
          columns={productColumns}
          pagination
          searchable
          filtering
          sorting
          columnResizing
          exportable
          exportFileName="products_master_data"
          density="compact"
          onRowClick={(p) => setSelectedProduct(p)}
        />
      )}

      {/* 2. BOM Tab */}
      {activeSubTab === 'bom' && (
        <div className="space-y-4">
          {boms.map((bom) => {
            const isExpanded = expandedBomId === bom.id;

            const bomCompColumns: GridColumn<any>[] = [
              createTextColumn<any>('componentSku', 'Component SKU', { isCode: true, pinned: 'left', width: 140 }),
              createTextColumn<any>('componentName', 'Description', { width: 220 }),
              createNumberColumn<any>('quantityPerUnit', 'Qty Per Unit', { uomField: 'uom', width: 130 }),
              createNumberColumn<any>('scrapPercentage', 'Scrap %', { uomText: '%', width: 100 }),
              createCurrencyColumn<any>('unitCost', 'Unit Cost', { currency: 'USD', decimals: 2, width: 130 }),
              {
                field: 'subtotal',
                headerName: 'Subtotal Cost',
                type: 'currency',
                width: 140,
                align: 'right',
                valueGetter: (row) => row.quantityPerUnit * row.unitCost * (1 + row.scrapPercentage / 100),
                renderCell: ({ value }) => (
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    ${value.toFixed(2)}
                  </span>
                ),
              },
            ];

            return (
              <div key={bom.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
                <div
                  onClick={() => setExpandedBomId(isExpanded ? '' : bom.id)}
                  className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {bom.code} {bom.revision}
                        </span>
                        <StatusBadge status={bom.status} />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Parent Item: <strong className="text-slate-800 dark:text-slate-200">{bom.productName}</strong> ({bom.productSku})
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <div>{bom.components.length} Components</div>
                    <div className="text-[11px] text-slate-400">Effective: {bom.effectiveFrom}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 space-y-3">
                    {bom.notes && <p className="text-xs text-slate-500 italic">{bom.notes}</p>}
                    <EnterpriseDataGrid<any>
                      data={bom.components}
                      columns={bomCompColumns}
                      pagination={false}
                      searchable={false}
                      density="compact"
                    />
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

            const routingOpColumns: GridColumn<any>[] = [
              createNumberColumn<any>('sequence', 'Seq', { width: 80, pinned: 'left' }),
              {
                field: 'operationCode',
                headerName: 'Operation Code & Name',
                type: 'text',
                width: 220,
                renderCell: ({ row }) => (
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block font-mono">
                      {row.operationCode}
                    </span>
                    <span className="text-slate-500 text-[11px]">{row.instructions || row.description}</span>
                  </div>
                ),
              },
              createTextColumn<any>('workCenterName', 'Assigned Work Center', { width: 180 }),
              createNumberColumn<any>('setupTimeMinutes', 'Setup Time', { uomText: 'mins', width: 120 }),
              createNumberColumn<any>('runTimeSecondsPerUnit', 'Run Time / Unit', { uomText: 'sec', width: 130 }),
              createCurrencyColumn<any>('laborHourlyRate', 'Labor Rate', { currency: 'USD', decimals: 0, width: 120 }),
              createCurrencyColumn<any>('machineHourlyRate', 'Machine Rate', { currency: 'USD', decimals: 0, width: 120 }),
              createActionColumn<any>(
                ({ row }) => (
                  <button
                    onClick={() =>
                      setWiModal({
                        isOpen: true,
                        productSku: rt.productSku,
                        productName: rt.productName,
                        operationCode: row.operationCode,
                        operationName: row.name,
                        workCenterCode: row.workCenterCode,
                        components: [],
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded transition-colors whitespace-nowrap"
                    title="Generate Work Instruction / SOP with Generative AI (Section 9.2)"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Generate WI</span>
                  </button>
                ),
                { width: 140, headerName: 'WI Document (AI)' }
              ),
            ];

            return (
              <div key={rt.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
                <div
                  onClick={() => setExpandedRoutingId(isExpanded ? '' : rt.id)}
                  className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {rt.code} {rt.revision}
                        </span>
                        <StatusBadge status={rt.status} />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Product: <strong className="text-slate-800 dark:text-slate-200">{rt.productName}</strong> ({rt.productSku})
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {rt.operations.length} Sequential Operations
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-3">
                    <EnterpriseDataGrid<any>
                      data={rt.operations}
                      columns={routingOpColumns}
                      pagination={false}
                      searchable={false}
                      density="compact"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Work Centers Tab */}
      {activeSubTab === 'work-centers' && (
        <EnterpriseDataGrid<WorkCenter>
          data={workCenters}
          columns={workCenterColumns}
          pagination
          searchable
          filtering
          sorting
          columnResizing
          exportable
          exportFileName="work_centers_master_data"
          density="compact"
        />
      )}

      {/* 5. UOM Tab */}
      {activeSubTab === 'uom' && (
        <EnterpriseDataGrid<UnitOfMeasure>
          data={INITIAL_UOMS}
          columns={uomColumns}
          pagination
          searchable
          filtering
          sorting
          density="compact"
        />
      )}

      {/* 6. Reason Codes Tab */}
      {activeSubTab === 'reason-codes' && (
        <EnterpriseDataGrid<ReasonCode>
          data={reasonCodes}
          columns={reasonCodeColumns}
          pagination
          searchable
          filtering
          sorting
          density="compact"
        />
      )}

      {/* Product Detail Inspection Drawer */}
      <GridDetailDrawer
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct ? `${selectedProduct.sku} — ${selectedProduct.name}` : ''}
        subtitle={selectedProduct?.category}
        badge={
          selectedProduct && (
            <span className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {selectedProduct.type}
            </span>
          )
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Base UOM</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.baseUom}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Standard Cost</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">${selectedProduct.standardCost.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Physical On-Hand</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.currentStock} {selectedProduct.baseUom}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Allocated Stock</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">{selectedProduct.allocatedStock} {selectedProduct.baseUom}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Lead Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.leadTimeDays} days</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Safety Buffer</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.safetyStock} {selectedProduct.baseUom}</span>
              </div>
            </div>
          </div>
        )}
      </GridDetailDrawer>

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
