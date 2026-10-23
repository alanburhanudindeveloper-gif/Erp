import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  GitCommit,
  GitBranch,
  Sparkles,
  FileText,
  Upload,
  Check,
  Eye,
} from 'lucide-react';
import { Product, StockMovement, ProductionOrder } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AiDocumentExtractorModal } from '../../components/ai/AiDocumentExtractorModal';
import {
  EnterpriseDataGrid,
  GridColumn,
  createTextColumn,
  createNumberColumn,
  createCurrencyColumn,
  createDateColumn,
  createStatusColumn,
  createActionColumn,
  GridDetailDrawer,
} from '../../components/data-grid';

interface InventoryViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  orders: ProductionOrder[];
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
  onIssueMaterial?: (
    orderId: string,
    componentSku: string,
    lotNumber: string,
    quantity: number
  ) => { success: boolean; error?: string };
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockMovements,
  orders,
  activeSubTab,
  onSelectSubTab,
  onIssueMaterial,
}) => {
  const [traceLotQuery, setTraceLotQuery] = useState('LOT-X-L100');
  const [traceResult, setTraceResult] = useState<any>(null);
  const [issueSimulationFeedback, setIssueSimulationFeedback] = useState<string | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [showExtractModal, setShowExtractModal] = useState(false);

  const [extractedDrafts, setExtractedDrafts] = useState<any[]>([
    {
      id: 'draft-po-01',
      vendor: 'PT Steel Indo Perkasa',
      docNo: 'PO-EXT-2026-9921',
      itemsCount: 2,
      totalAmount: 73450000,
      currency: 'IDR',
      status: 'DRAFT_PENDING_APPROVAL',
      extractedAt: '2026-10-21 14:20',
      discrepancy: 'Unit price 2.7% below catalog rate',
    },
    {
      id: 'draft-po-02',
      vendor: 'PT Global Komponen Presisi',
      docNo: 'DN-2026-4402',
      itemsCount: 2,
      totalAmount: 6500000,
      currency: 'IDR',
      status: 'APPROVED_AND_POSTED',
      extractedAt: '2026-10-22 09:15',
      discrepancy: null,
    },
  ]);

  const handleTrace = (lotQuery: string) => {
    const q = lotQuery.trim().toUpperCase();
    if (!q) return;

    const isFg = q.includes('F200') || q.includes('FG');

    if (isFg) {
      setTraceResult({
        type: 'FORWARD',
        targetLot: q,
        item: 'Product A (LOT-FG-F200)',
        sourceMo: 'MO-2026-00124',
        producedDate: '2026-10-22 11:30',
        inspectedBy: 'Hendra Gunawan (Lead QC)',
        qcResult: 'PASSED with Concession (QC-2026-0419)',
        consumedComponents: [
          { sku: 'Material X', lot: 'LOT-X-L100', qty: '2,000 KG', location: 'WH-RAW-STAGING' },
          { sku: 'Material Y', lot: 'LOT-Y-L101', qty: '1,800 MTR', location: 'WH-RAW-WIRE-RACK' },
          { sku: 'Material Z', lot: 'LOT-Z-L088', qty: '600 PCS', location: 'WH-RAW-SHELL' },
        ],
        operationsHistory: [
          { op: '01 Cutting & Machining', wc: 'WC-CUT-01', operator: 'Budi Santoso', status: 'Completed' },
          { op: '02 Assembly & Wiring', wc: 'WC-ASSY-02', operator: 'Agus Pratama', status: 'Completed' },
        ],
      });
    } else {
      setTraceResult({
        type: 'REVERSE',
        targetLot: q,
        item: 'Material X (Extruded Aluminum Billet 6061-T6)',
        receivedDate: '2026-10-15',
        supplierPo: 'PO-2026-4402 (Alcoa Industrial Metals)',
        consumedInOrders: [
          {
            moNumber: 'MO-2026-00124',
            product: 'Product A',
            consumedQty: '2,000 KG',
            date: '2026-10-20',
            resultingFgLot: 'LOT-FG-F200',
            warehouseDestination: 'WH-FG-BAY-A1',
          },
        ],
      });
    }
  };

  // 1. Material Availability Columns
  const atpColumns = useMemo<GridColumn<Product>[]>(
    () => [
      createTextColumn<Product>('sku', 'Item SKU', { isCode: true, pinned: 'left', width: 140 }),
      createTextColumn<Product>('name', 'Product Name', { width: 220 }),
      createTextColumn<Product>('type', 'Category', {
        width: 140,
        renderCell: ({ value }) => (
          <span className="text-slate-600 dark:text-slate-300 text-xs">
            {String(value).replace(/_/g, ' ')}
          </span>
        ),
      }),
      createNumberColumn<Product>('currentStock', 'Physical On-Hand', {
        uomField: 'baseUom',
        width: 140,
      }),
      createNumberColumn<Product>('allocatedStock', 'Allocated / Reserved', {
        uomField: 'baseUom',
        width: 150,
      }),
      {
        field: 'atp',
        headerName: 'Available to Promise',
        type: 'number',
        width: 160,
        sortable: true,
        align: 'right',
        valueGetter: (row) => Math.max(0, row.currentStock - row.allocatedStock),
        renderCell: ({ row }) => {
          const atp = Math.max(0, row.currentStock - row.allocatedStock);
          return (
            <span className="tabular-nums font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {atp.toLocaleString()} {row.baseUom}
            </span>
          );
        },
      },
      createNumberColumn<Product>('safetyStock', 'Safety Buffer', {
        uomField: 'baseUom',
        width: 130,
      }),
      {
        field: 'bufferStatus',
        headerName: 'Buffer Health',
        type: 'status',
        width: 150,
        sortable: true,
        renderCell: ({ row }) => {
          const atp = Math.max(0, row.currentStock - row.allocatedStock);
          const isShort = atp < row.safetyStock;
          return isShort ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-3 h-3" />
              Below Buffer
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Healthy
            </span>
          );
        },
      },
      createActionColumn<Product>(({ row }) => (
        <button
          onClick={() => setSelectedProductDetail(row)}
          className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          Detail
        </button>
      )),
    ],
    []
  );

  // 2. Multi-Bucket Columns (UC-INV-001)
  interface MultiBucketRow {
    id: string;
    sku: string;
    name: string;
    baseUom: string;
    available: number;
    reserved: number;
    hold: number;
    rejected: number;
    wip: number;
    total: number;
  }

  const multiBucketData = useMemo<MultiBucketRow[]>(() => {
    return products.map((p) => {
      const isRawX = p.sku === 'Material X';
      const isRawY = p.sku === 'Material Y';
      const available = isRawX ? 1000 : isRawY ? 500 : Math.max(0, p.currentStock - p.allocatedStock);
      const reserved = p.allocatedStock;
      const hold = isRawX ? 1000 : isRawY ? 300 : 0;
      const rejected = 0;
      const wip = p.type === 'FINISHED_GOOD' ? 1000 : 0;
      const total = available + reserved + hold + rejected;
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        baseUom: p.baseUom,
        available,
        reserved,
        hold,
        rejected,
        wip,
        total,
      };
    });
  }, [products]);

  const multiBucketColumns = useMemo<GridColumn<MultiBucketRow>[]>(
    () => [
      createTextColumn<MultiBucketRow>('sku', 'Item SKU', { isCode: true, pinned: 'left', width: 140 }),
      createTextColumn<MultiBucketRow>('name', 'Description & UOM', {
        width: 220,
        renderCell: ({ row }) => (
          <div>
            <span className="font-medium text-slate-800 dark:text-slate-200">{row.name}</span>
            <span className="text-[10px] text-slate-400 ml-1 font-mono">({row.baseUom})</span>
          </div>
        ),
      }),
      createNumberColumn<MultiBucketRow>('available', 'Available (Ready)', {
        uomField: 'baseUom',
        width: 140,
        renderCell: ({ row, value }) => (
          <span className="tabular-nums font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {value.toLocaleString()} {row.baseUom}
          </span>
        ),
      }),
      createNumberColumn<MultiBucketRow>('reserved', 'Reserved (Allocated)', {
        uomField: 'baseUom',
        width: 150,
        renderCell: ({ row, value }) => (
          <span className="tabular-nums font-mono text-blue-700 dark:text-blue-400">
            {value.toLocaleString()} {row.baseUom}
          </span>
        ),
      }),
      createNumberColumn<MultiBucketRow>('hold', 'Hold / Quarantine', {
        uomField: 'baseUom',
        width: 150,
        renderCell: ({ row, value }) => (
          <span
            className={`tabular-nums font-mono font-bold ${
              value > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'
            }`}
          >
            {value > 0 ? `${value.toLocaleString()} ${row.baseUom}` : '—'}
          </span>
        ),
      }),
      createNumberColumn<MultiBucketRow>('rejected', 'Rejected (NCR)', {
        uomField: 'baseUom',
        width: 130,
        renderCell: ({ row, value }) => (
          <span className="tabular-nums font-mono text-slate-400">
            {value > 0 ? `${value} ${row.baseUom}` : '—'}
          </span>
        ),
      }),
      createNumberColumn<MultiBucketRow>('wip', 'WIP (Shop Floor)', {
        uomField: 'baseUom',
        width: 140,
        renderCell: ({ row, value }) => (
          <span className="tabular-nums font-mono text-slate-700 dark:text-slate-300">
            {value > 0 ? `${value.toLocaleString()} ${row.baseUom}` : '—'}
          </span>
        ),
      }),
      createNumberColumn<MultiBucketRow>('total', 'Total Physical', {
        uomField: 'baseUom',
        width: 140,
        renderCell: ({ row, value }) => (
          <span className="tabular-nums font-mono font-bold text-slate-900 dark:text-slate-100">
            {value.toLocaleString()} {row.baseUom}
          </span>
        ),
      }),
    ],
    []
  );

  // 3. Hard Stock Reservations
  interface ReservationRow {
    id: string;
    resNo: string;
    moNumber: string;
    material: string;
    reservedQty: string;
    location: string;
    status: string;
  }

  const reservationData: ReservationRow[] = [
    {
      id: 'res-1',
      resNo: 'RES-2026-0081',
      moNumber: 'MO-2026-00124',
      material: 'Material X (Aluminum Billet)',
      reservedQty: '2,000 KG',
      location: 'WH-RAW-STAGING',
      status: 'ACTIVE',
    },
    {
      id: 'res-2',
      resNo: 'RES-2026-0082',
      moNumber: 'MO-2026-00124',
      material: 'Material Y (Copper Wire)',
      reservedQty: '2,700 MTR (Deficit 300)',
      location: 'WH-RAW-WIRE-RACK',
      status: 'ACTIVE',
    },
    {
      id: 'res-3',
      resNo: 'RES-2026-0083',
      moNumber: 'MO-2026-00124',
      material: 'Material Z (Housing Shell)',
      reservedQty: '1,000 PCS',
      location: 'WH-RAW-SHELL',
      status: 'ACTIVE',
    },
  ];

  const reservationColumns = useMemo<GridColumn<ReservationRow>[]>(
    () => [
      createTextColumn<ReservationRow>('resNo', 'Reservation #', { isCode: true, pinned: 'left', width: 140 }),
      createTextColumn<ReservationRow>('moNumber', 'Production Order', { isCode: true, width: 150 }),
      createTextColumn<ReservationRow>('material', 'Material SKU & Spec', { width: 240 }),
      createTextColumn<ReservationRow>('reservedQty', 'Hard Reserved Qty', {
        width: 160,
        align: 'right',
        renderCell: ({ value }) => (
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {value}
          </span>
        ),
      }),
      createTextColumn<ReservationRow>('location', 'Staging Location', { width: 160 }),
      createStatusColumn<ReservationRow>('status', 'Reservation State', { width: 130 }),
    ],
    []
  );

  // 4. Immutable Stock Movements Columns
  const movementColumns = useMemo<GridColumn<StockMovement>[]>(
    () => [
      createTextColumn<StockMovement>('movementNo', 'Document #', { isCode: true, pinned: 'left', width: 150 }),
      createDateColumn<StockMovement>('timestamp', 'Posting Time', { isDateTime: true, width: 150 }),
      createTextColumn<StockMovement>('sku', 'Item SKU', { width: 140, isCode: true }),
      createStatusColumn<StockMovement>('movementType', 'Movement Type', {
        width: 150,
        filterOptions: [
          { label: 'GR PRODUCTION', value: 'GR_PRODUCTION' },
          { label: 'GI PRODUCTION', value: 'GI_PRODUCTION' },
          { label: 'TRANSFER', value: 'TRANSFER' },
          { label: 'SCRAP', value: 'SCRAP' },
        ],
      }),
      createNumberColumn<StockMovement>('quantity', 'Quantity', {
        uomField: 'uom',
        width: 130,
      }),
      createTextColumn<StockMovement>('fromLocation', 'From Location', { width: 140 }),
      createTextColumn<StockMovement>('toLocation', 'To Location', { width: 140 }),
      createTextColumn<StockMovement>('lotNumber', 'Lot / Batch #', { width: 140, isCode: true }),
      createTextColumn<StockMovement>('sourceDocument', 'Source Document', { width: 140, isCode: true }),
    ],
    []
  );

  // 5. Inbound Extracted Drafts Columns
  const extractedDraftColumns = useMemo<GridColumn<any>[]>(
    () => [
      createTextColumn<any>('docNo', 'Document Ref', { isCode: true, pinned: 'left', width: 160 }),
      createTextColumn<any>('vendor', 'Supplier / Vendor', { width: 220 }),
      createNumberColumn<any>('itemsCount', 'Line Items', { width: 110, uomText: 'lines' }),
      createCurrencyColumn<any>('totalAmount', 'Total Amount', { currency: 'IDR', width: 160 }),
      {
        field: 'discrepancy',
        headerName: 'Discrepancy Check',
        type: 'text',
        width: 200,
        renderCell: ({ value }) =>
          value ? (
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              ⚠ {value}
            </span>
          ) : (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              ✓ Zero Variance
            </span>
          ),
      },
      createDateColumn<any>('extractedAt', 'Extracted At', { isDateTime: false, width: 140 }),
      createStatusColumn<any>('status', 'Approval State', { width: 160 }),
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory & Inbound Material Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time material availability, hard reservations, immutable stock movements, and AI document ingestion (Section 9.1).
          </p>
        </div>

        <button
          onClick={() => setShowExtractModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors self-start sm:self-auto shadow-xs"
          title="Extract supplier document to structured transaction draft (Section 9.1)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Extract with AI</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('material-availability')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'material-availability'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Material Availability & ATP
        </button>
        <button
          onClick={() => onSelectSubTab('multi-bucket')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'multi-bucket'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>Multi-Bucket Segregation (UC-INV-001)</span>
        </button>
        <button
          onClick={() => onSelectSubTab('reservations')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reservations'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Hard Stock Reservations
        </button>
        <button
          onClick={() => onSelectSubTab('material-consumption')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'material-consumption'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Immutable Movement Ledger (Page 99)
        </button>
        <button
          onClick={() => onSelectSubTab('finished-goods')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'finished-goods'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Two-Way Lot Traceability (Page 103)
        </button>
        <button
          onClick={() => onSelectSubTab('doc-extraction')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'doc-extraction'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Document Inbound & Extraction (Section 9.1 P0)</span>
        </button>
      </div>

      {/* 1. Material Availability Tab */}
      {activeSubTab === 'material-availability' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Available-To-Promise (ATP) Material Status
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Available = On-Hand minus Hard Reservations
            </span>
          </div>

          <EnterpriseDataGrid<Product>
            data={products}
            columns={atpColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="inventory_atp_report"
            density="compact"
            onRowClick={(row) => setSelectedProductDetail(row)}
          />
        </div>
      )}

      {/* 1.5 Multi-Bucket Stock Segregation Tab */}
      {activeSubTab === 'multi-bucket' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-amber-400 font-bold block">
                UC-INV-001 &amp; BR-INV-003: Five Independent Stock State Buckets
              </span>
              <span className="text-slate-400 text-[11px]">
                Stock is partitioned into: Available, Reserved, Hold / Quarantine, Rejected, and WIP. Material with status <strong className="text-amber-300">HOLD</strong> is strictly prohibited from being issued to shop floor production.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 self-start md:self-auto">
              BR-INV-003 Enforced
            </span>
          </div>

          {/* Test Case Widget: Attempt Issue of HOLD stock */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  Interactive Test: Attempt to Issue Quarantined Lot to Production (BR-INV-003)
                </span>
              </div>
              <button
                onClick={() => {
                  if (onIssueMaterial) {
                    const res = onIssueMaterial('mo-124', 'Material X', 'LOT-SUP-STL-89', 200);
                    if (!res.success) {
                      setIssueSimulationFeedback(res.error || 'Transaction blocked by BR-INV-003');
                    } else {
                      setIssueSimulationFeedback('Issued successfully (Override enabled).');
                    }
                  }
                }}
                className="px-3 py-1 font-semibold text-xs text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded transition-colors shadow-2xs font-sans"
              >
                Simulate Issue from LOT-SUP-STL-89 (HOLD)
              </button>
            </div>

            {issueSimulationFeedback && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-rose-900 dark:text-rose-200 font-mono text-[11px] flex items-start gap-2">
                <span className="font-bold text-rose-700 shrink-0">[RULE VIOLATION DETECTED]</span>
                <span>{issueSimulationFeedback}</span>
              </div>
            )}
          </div>

          <EnterpriseDataGrid<MultiBucketRow>
            data={multiBucketData}
            columns={multiBucketColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="inventory_multi_bucket_segregation"
            density="compact"
          />
        </div>
      )}

      {/* 2. Reservations Tab */}
      {activeSubTab === 'reservations' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Hard Material Reservations (Tied to Released MOs)
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Prevents double-allocation across competing shop orders
            </span>
          </div>

          <EnterpriseDataGrid<ReservationRow>
            data={reservationData}
            columns={reservationColumns}
            pagination
            searchable
            filtering
            sorting
            exportable
            exportFileName="hard_stock_reservations"
            density="compact"
          />
        </div>
      )}

      {/* 3. Immutable Movement Ledger */}
      {activeSubTab === 'material-consumption' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold block">PDF Section 30: Immutable Inventory Ledger Contract</span>
              <span className="text-slate-400 text-[11px]">
                No direct stock modification. All stock balances are derived strictly from posted material documents. Reversals create compensating entries.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Immutable
            </span>
          </div>

          <EnterpriseDataGrid<StockMovement>
            data={stockMovements}
            columns={movementColumns}
            pagination
            searchable
            filtering
            sorting
            columnResizing
            exportable
            exportFileName="stock_movement_ledger"
            density="compact"
          />
        </div>
      )}

      {/* 4. Two-Way Lot Traceability */}
      {activeSubTab === 'finished-goods' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Two-Way Lot & Serial Traceability (Page 103)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute forward trace from finished good lot to component sources, or reverse trace from raw lot to customer MOs.
              </p>
            </div>

            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter Lot Number (e.g. LOT-X-L100 or LOT-FG-F200)..."
                value={traceLotQuery}
                onChange={(e) => setTraceLotQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded focus:outline-none"
              />
              <button
                onClick={() => handleTrace(traceLotQuery)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
              >
                Inspect Genealogy
              </button>
            </div>
          </div>

          {traceResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 font-mono text-xs space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {traceResult.type === 'FORWARD'
                      ? 'FORWARD TRACE (FG → Components)'
                      : 'REVERSE TRACE (Raw Lot → MO & FG)'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{traceResult.targetLot}</span>
                </div>
                <span className="text-slate-500 font-sans text-xs">{traceResult.item}</span>
              </div>

              {traceResult.type === 'FORWARD' ? (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-3 gap-3 font-mono text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Production Order</span>
                      <strong className="text-blue-700 dark:text-blue-400">{traceResult.sourceMo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Produced Timestamp</span>
                      <strong className="text-slate-800 dark:text-slate-200">{traceResult.producedDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">QC Disposition</span>
                      <strong className="text-emerald-700 dark:text-emerald-400">{traceResult.qcResult}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Raw Material Lots Consumed:
                    </span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs">
                      {traceResult.consumedComponents.map((c: any) => (
                        <div key={c.lot} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{c.sku}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{c.lot}</span>
                          </div>
                          <span className="text-slate-600 dark:text-slate-400">
                            {c.qty} from {c.location}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Receipt Date</span>
                      <strong className="text-slate-800 dark:text-slate-200">{traceResult.receivedDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Supplier Purchase Order</span>
                      <strong className="text-blue-700 dark:text-blue-400">{traceResult.supplierPo}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Downstream Production Orders Consumed In:
                    </span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs">
                      {traceResult.consumedInOrders.map((o: any) => (
                        <div key={o.moNumber} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-400">{o.moNumber}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-slate-800 dark:text-slate-200">{o.product}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span>Consumed {o.consumedQty}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold block">
                              {o.resultingFgLot}
                            </span>
                            <span className="text-[11px] text-slate-400">{o.warehouseDestination}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Document Inbound & AI Extraction Tab */}
      {activeSubTab === 'doc-extraction' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                  Section 9.1 Invariant
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Document → Structured Extraction → Schema Validation → Draft Transaction
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Upload supplier quotations, purchase orders, or delivery notes. AI parses line items and detects catalog discrepancies without directly mutating official stock ledgers.
              </p>
            </div>

            <button
              onClick={() => setShowExtractModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shrink-0 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Upload & Extract with AI</span>
            </button>
          </div>

          <EnterpriseDataGrid<any>
            data={extractedDrafts}
            columns={extractedDraftColumns}
            pagination
            searchable
            filtering
            sorting
            exportable
            exportFileName="inbound_extracted_drafts"
            density="compact"
          />
        </div>
      )}

      {/* Product Detail Slide-out Drawer */}
      <GridDetailDrawer
        isOpen={Boolean(selectedProductDetail)}
        onClose={() => setSelectedProductDetail(null)}
        title={selectedProductDetail ? `${selectedProductDetail.sku} — ${selectedProductDetail.name}` : ''}
        subtitle={selectedProductDetail?.id}
        badge={
          selectedProductDetail && (
            <span className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {selectedProductDetail.type}
            </span>
          )
        }
      >
        {selectedProductDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Base UOM</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedProductDetail.baseUom}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Standard Cost</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Rp {selectedProductDetail.standardCost.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Physical On-Hand</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedProductDetail.currentStock.toLocaleString()} {selectedProductDetail.baseUom}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Allocated to Production</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">
                  {selectedProductDetail.allocatedStock.toLocaleString()} {selectedProductDetail.baseUom}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Safety Buffer Threshold</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedProductDetail.safetyStock.toLocaleString()} {selectedProductDetail.baseUom}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Available To Promise</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {Math.max(
                    0,
                    selectedProductDetail.currentStock - selectedProductDetail.allocatedStock
                  ).toLocaleString()}{' '}
                  {selectedProductDetail.baseUom}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Warehouse Storage Bin
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">
                {selectedProductDetail.type === 'RAW_MATERIAL'
                  ? 'WH-RAW-STAGING / Rack A-12'
                  : 'WH-FG-BAY-A1 / High-Bay 04'}
              </span>
            </div>
          </div>
        )}
      </GridDetailDrawer>

      {/* AI Document Extractor Modal */}
      <AiDocumentExtractorModal
        isOpen={showExtractModal}
        onClose={() => setShowExtractModal(false)}
        onPostDraftPo={(extracted) => {
          setExtractedDrafts((prev) => [
            {
              id: `draft-${Date.now()}`,
              vendor: extracted.vendorName,
              docNo: extracted.documentNumber,
              itemsCount: extracted.lineItems.length,
              totalAmount: extracted.totalAmount,
              currency: extracted.currency,
              status: 'APPROVED_AND_POSTED',
              extractedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              discrepancy: extracted.discrepanciesDetected[0] || null,
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
};
