import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  FileCheck2,
  PackageCheck,
  Building2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  UserCheck,
  CheckCheck,
  FileDown,
} from 'lucide-react';
import {
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  Supplier,
  Product,
} from '../../types';
import { EnterpriseDataGrid } from '../../components/data-grid/EnterpriseDataGrid';
import { GridColumn, BulkAction } from '../../components/data-grid/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  usePurchaseRequisitions,
  usePurchaseOrders,
  useCreatePurchaseRequisition,
  useApprovePurchaseRequisition,
} from './presentation/hooks';

interface ProcurementViewProps {
  purchaseRequisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceiptNotes: GoodsReceiptNote[];
  suppliers: Supplier[];
  products: Product[];
  currentUser: { id: string; name: string; role: string };
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
  onCreatePR: (data: {
    requesterName: string;
    department: string;
    requiredDate: string;
    reason: string;
    items: {
      productId: string;
      quantity: number;
      estimatedPrice: number;
      supplierPreferred?: string;
    }[];
  }) => void;
  onApprovePR: (prId: string, approverName?: string, approverRole?: string) => { success: boolean; error?: string };
  onRejectPR: (prId: string, reason: string) => { success: boolean; error?: string };
  onCreatePO: (data: {
    prId?: string;
    supplierId: string;
    expectedDeliveryDate: string;
    paymentTerms: string;
    destinationWarehouse: string;
    items: {
      productId: string;
      orderedQty: number;
      unitPrice: number;
      qcRequired: boolean;
    }[];
  }) => void;
  onPostGRN: (
    poId: string,
    items: {
      poItemId: string;
      receivedQty: number;
      supplierLot: string;
      warehouseLoc: string;
      incomingQcRequired: boolean;
    }[],
    notes?: string
  ) => { success: boolean; error?: string };
  onSwitchUser: (persona: { id: string; name: string; role: string }) => void;
  onNavigateToQuality?: () => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  purchaseRequisitions: propPRs,
  purchaseOrders: propPOs,
  goodsReceiptNotes,
  suppliers,
  products,
  currentUser,
  activeSubTab,
  onSelectSubTab,
  onCreatePR,
  onApprovePR,
  onRejectPR,
  onCreatePO,
  onPostGRN,
  onSwitchUser,
  onNavigateToQuality,
}) => {
  // Authoritative server-managed state via CQRS hooks
  const {
    requisitions: serverPRs,
    refresh: refreshPRs,
  } = usePurchaseRequisitions();

  const {
    orders: serverPOs,
    refresh: refreshPOs,
  } = usePurchaseOrders();

  const { createPR: serverCreatePR } = useCreatePurchaseRequisition();
  const { approvePR: serverApprovePR } = useApprovePurchaseRequisition();

  // Authoritative server state takes priority over legacy props
  const purchaseRequisitions = serverPRs.length > 0 ? serverPRs : propPRs;
  const purchaseOrders = serverPOs.length > 0 ? serverPOs : propPOs;

  // Modal states
  const [showCreatePrModal, setShowCreatePrModal] = useState(false);
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [rejectingPrId, setRejectingPrId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Pre-selected PO for GRN tab
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<string>(
    purchaseOrders.find((p) => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED')?.id || ''
  );

  // Quick GRN receipt inputs
  const [grnReceivedQty, setGrnReceivedQty] = useState<number>(500);
  const [grnLotNumber, setGrnLotNumber] = useState<string>(`LOT-SUP-${new Date().getFullYear()}-091`);
  const [grnWarehouseLoc, setGrnWarehouseLoc] = useState<string>('PLANT01-RM-WH-A02-R01-S03');
  const [grnQcRequired, setGrnQcRequired] = useState<boolean>(true);
  const [grnNotes, setGrnNotes] = useState<string>('Delivered in protective packaging. Mill CoA attached.');

  // New PR form state
  const [newPrItemProduct, setNewPrItemProduct] = useState(products.find((p) => p.makeOrBuy === 'BUY')?.id || products[0]?.id || '');
  const [newPrItemQty, setNewPrItemQty] = useState(1000);
  const [newPrItemPrice, setNewPrItemPrice] = useState(14500);
  const [newPrReason, setNewPrReason] = useState('MRP safety stock buffer replenishment for high-runner SKU');
  const [newPrRequiredDate, setNewPrRequiredDate] = useState('2026-11-10');
  const [newPrDept, setNewPrDept] = useState('Machining & Assembly');

  // New PO form state
  const [newPoSupplier, setNewPoSupplier] = useState(suppliers[0]?.id || '');
  const [newPoPrRef, setNewPoPrRef] = useState('');
  const [newPoItemProduct, setNewPoItemProduct] = useState(products.find((p) => p.makeOrBuy === 'BUY')?.id || products[0]?.id || '');
  const [newPoItemQty, setNewPoItemQty] = useState(2000);
  const [newPoItemPrice, setNewPoItemPrice] = useState(14500);
  const [newPoDeliveryDate, setNewPoDeliveryDate] = useState('2026-11-15');
  const [newPoPaymentTerms, setNewPoPaymentTerms] = useState('NET 30');
  const [newPoWarehouse, setNewPoWarehouse] = useState('PLANT01-RM-WH-BAY-01');
  const [newPoQcRequired, setNewPoQcRequired] = useState(true);

  // Available Personas for SoD Testing
  const PERSONAS = [
    { id: 'usr-001', name: 'Dewi Lestari', role: 'PPIC Supervisor (Requester)' },
    { id: 'usr-002', name: 'Budi Santoso', role: 'CNC Section Lead (Requester)' },
    { id: 'usr-003', name: 'Ir. Agus Wijaya', role: 'Plant Manager (Level 2 Approver)' },
    { id: 'usr-004', name: 'Rudi Hartono', role: 'Operations Director (Level 3 Approver)' },
    { id: 'usr-005', name: 'Slamet Riyadi', role: 'Receiving Dock Operator' },
  ];

  // Quick stats
  const pendingPRs = purchaseRequisitions.filter((p) => p.status === 'PENDING_APPROVAL');
  const approvedPRs = purchaseRequisitions.filter((p) => p.status === 'APPROVED');
  const activePOs = purchaseOrders.filter((p) => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED');

  const handleApprovePrAction = async (prId: string) => {
    const outcome = await serverApprovePR({
      prId,
      actorName: currentUser.name,
      actorRole: currentUser.role,
    });
    if (outcome.success) {
      await refreshPRs();
    }
    if (onApprovePR) {
      onApprovePR(prId, currentUser.name, currentUser.role);
    }
    return outcome;
  };

  const handleCreatePrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === newPrItemProduct);
    const quantity = Number(newPrItemQty);
    const estimatedPrice = Number(newPrItemPrice);
    const totalCost = quantity * estimatedPrice;

    // 1. Authoritative server CQRS mutation
    const outcome = await serverCreatePR({
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      department: newPrDept,
      requiredDate: newPrRequiredDate,
      reason: newPrReason,
      plantId: 'PLANT-01',
      items: [
        {
          id: `pri-${Date.now()}-0`,
          productId: newPrItemProduct,
          sku: prod ? prod.sku : 'SKU-001',
          name: prod ? prod.name : 'Component Material',
          quantity,
          uom: prod ? prod.baseUom : 'PCS',
          estimatedPrice,
          totalCost,
        },
      ],
    });

    if (outcome.success) {
      await refreshPRs();
      setShowCreatePrModal(false);
    }

    // 2. Prop callback for UI notifications and compatibility
    if (onCreatePR) {
      onCreatePR({
        requesterName: currentUser.name,
        department: newPrDept,
        requiredDate: newPrRequiredDate,
        reason: newPrReason,
        items: [
          {
            productId: newPrItemProduct,
            quantity,
            estimatedPrice,
          },
        ],
      });
    }
  };

  const handleCreatePoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePO({
      prId: newPoPrRef || undefined,
      supplierId: newPoSupplier,
      expectedDeliveryDate: newPoDeliveryDate,
      paymentTerms: newPoPaymentTerms,
      destinationWarehouse: newPoWarehouse,
      items: [
        {
          productId: newPoItemProduct,
          orderedQty: Number(newPoItemQty),
          unitPrice: Number(newPoItemPrice),
          qcRequired: newPoQcRequired,
        },
      ],
    });
    setShowCreatePoModal(false);
  };

  // 1. Columns for Purchase Requisitions Grid
  const prGridColumns: GridColumn<PurchaseRequisition>[] = useMemo(
    () => [
      {
        field: 'prNumber',
        headerName: 'PR Number',
        width: 145,
        pinned: 'left',
        renderCell: ({ value, row }) => (
          <div>
            <span className="font-mono font-bold text-slate-900 block">{value}</span>
            <span className="text-[10px] text-slate-400 font-sans">Req: {row.requiredDate}</span>
          </div>
        ),
      },
      {
        field: 'requesterName',
        headerName: 'Requester',
        width: 140,
        renderCell: ({ value, row }) => (
          <div>
            <span className="font-semibold text-slate-800 block truncate">{value}</span>
            <span className="text-[10px] text-slate-400 truncate block">{row.department}</span>
          </div>
        ),
      },
      {
        field: 'items',
        headerName: 'Requested Items',
        width: 220,
        valueGetter: (row) => row.items.map((it) => `${it.quantity} ${it.uom} ${it.name}`).join(', '),
        renderCell: ({ row }) => (
          <div className="truncate">
            {row.items.map((it, i) => (
              <span key={i} className="text-slate-800 font-medium">
                <strong>{it.quantity.toLocaleString()} {it.uom}</strong> {it.name}
              </span>
            ))}
          </div>
        ),
      },
      {
        field: 'totalAmount',
        headerName: 'Est. Total',
        type: 'currency',
        width: 135,
        align: 'right',
      },
      {
        field: 'approvalLevelRequired',
        headerName: 'Approval Level',
        width: 130,
        align: 'center',
        renderCell: ({ value }) => (
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              value === 3
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : value === 2
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            Level {value} ({value === 3 ? '>100M' : value === 2 ? '10-100M' : '<10M'})
          </span>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'status',
        width: 140,
        filterOptions: [
          { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'PO Generated', value: 'PO_GENERATED' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Rejected', value: 'REJECTED' },
        ],
      },
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'action',
        width: 170,
        pinned: 'right',
        renderCell: ({ row }) => {
          const isRequester = row.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();

          return (
            <div className="flex items-center justify-end gap-1.5">
              {row.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprovePrAction(row.id);
                    }}
                    title={
                      isRequester
                        ? 'Segregation of Duties (BR-PRC-002): Requester cannot self-approve. Switch actor in top-right.'
                        : 'Approve Requisition'
                    }
                    className={`px-2 py-1 text-xs font-semibold rounded inline-flex items-center gap-1 transition-colors ${
                      isRequester
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isRequester ? 'SoD Blocked' : 'Approve'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRejectingPrId(row.id);
                      setRejectReason('');
                    }}
                    className="px-2 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}

              {row.status === 'APPROVED' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewPoPrRef(row.id);
                    const firstItem = row.items[0];
                    if (firstItem) {
                      setNewPoItemProduct(firstItem.productId);
                      setNewPoItemQty(firstItem.quantity);
                      setNewPoItemPrice(firstItem.estimatedPrice);
                    }
                    setShowCreatePoModal(true);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>Gen PO</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {row.status === 'PO_GENERATED' && (
                <span className="text-[10px] font-mono text-slate-400">PO Issued</span>
              )}
            </div>
          );
        },
      },
    ],
    [currentUser.name, handleApprovePrAction, onApprovePR]
  );

  // Bulk actions for PR Grid
  const prBulkActions: BulkAction<PurchaseRequisition>[] = useMemo(
    () => [
      {
        label: 'Bulk Approve',
        icon: CheckCheck,
        variant: 'success',
        onClick: (selected) => {
          selected.forEach((pr) => {
            if (pr.status === 'PENDING_APPROVAL') {
              handleApprovePrAction(pr.id);
            }
          });
        },
      },
    ],
    [handleApprovePrAction, onApprovePR]
  );

  // 2. Columns for Purchase Orders Grid
  const poGridColumns: GridColumn<PurchaseOrder>[] = useMemo(
    () => [
      {
        field: 'poNumber',
        headerName: 'PO Number',
        width: 145,
        pinned: 'left',
        renderCell: ({ value, row }) => (
          <div>
            <span className="font-mono font-bold text-slate-900 block">{value}</span>
            {row.prReference && (
              <span className="text-[10px] font-mono text-blue-600 block">Ref: {row.prReference}</span>
            )}
          </div>
        ),
      },
      {
        field: 'supplierName',
        headerName: 'Supplier Name',
        width: 180,
        renderCell: ({ value, row }) => (
          <div>
            <span className="font-semibold text-slate-800 block truncate">{value}</span>
            <span className="text-[10px] text-slate-400 truncate block">Terms: {row.paymentTerms}</span>
          </div>
        ),
      },
      {
        field: 'items',
        headerName: 'Ordered Items',
        width: 200,
        valueGetter: (row) => row.items.map((it) => `${it.orderedQty} ${it.uom} ${it.name}`).join(', '),
        renderCell: ({ row }) => (
          <div className="truncate">
            {row.items.map((it, i) => (
              <span key={i} className="text-slate-800">
                {it.name} ({it.orderedQty.toLocaleString()} {it.uom})
                {it.qcRequired && (
                  <span className="ml-1 text-[9px] font-mono px-1 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                    IQC
                  </span>
                )}
              </span>
            ))}
          </div>
        ),
      },
      {
        field: 'receiptProgress',
        headerName: 'Receiving Tally',
        width: 160,
        valueGetter: (row) => {
          const rec = row.items.reduce((acc, it) => acc + it.receivedQty, 0);
          const ord = row.items.reduce((acc, it) => acc + it.orderedQty, 0);
          return ord > 0 ? Math.round((rec / ord) * 100) : 0;
        },
        renderCell: ({ row, value }) => {
          const rec = row.items.reduce((acc, it) => acc + it.receivedQty, 0);
          const ord = row.items.reduce((acc, it) => acc + it.orderedQty, 0);
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${value === 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="font-mono text-slate-700 text-[10px] font-semibold tabular-nums">
                {rec}/{ord} ({value}%)
              </span>
            </div>
          );
        },
      },
      {
        field: 'expectedDeliveryDate',
        headerName: 'Exp. Delivery',
        type: 'date',
        width: 110,
      },
      {
        field: 'totalAmount',
        headerName: 'PO Total',
        type: 'currency',
        width: 135,
        align: 'right',
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'status',
        width: 135,
        filterOptions: [
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
          { label: 'Fully Received', value: 'FULLY_RECEIVED' },
          { label: 'Draft', value: 'DRAFT' },
        ],
      },
      {
        field: 'actions',
        headerName: 'Inbound Action',
        type: 'action',
        width: 130,
        pinned: 'right',
        renderCell: ({ row }) => (
          <div className="text-right">
            {(row.status === 'APPROVED' || row.status === 'PARTIALLY_RECEIVED') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoForGrn(row.id);
                  const firstItem = row.items[0];
                  if (firstItem) {
                    setGrnReceivedQty(Math.max(0, firstItem.orderedQty - firstItem.receivedQty));
                    setGrnQcRequired(firstItem.qcRequired);
                  }
                  onSelectSubTab('grn');
                }}
                className="px-2 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded inline-flex items-center gap-1 transition-colors shadow-2xs"
              >
                <PackageCheck className="w-3 h-3" />
                <span>Receive Dock</span>
              </button>
            )}
            {row.status === 'FULLY_RECEIVED' && (
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                Fulfilled
              </span>
            )}
          </div>
        ),
      },
    ],
    [onSelectSubTab]
  );

  // 3. Columns for Goods Receipt Notes Grid
  const grnGridColumns: GridColumn<GoodsReceiptNote>[] = useMemo(
    () => [
      {
        field: 'grnNumber',
        headerName: 'GRN Number',
        width: 145,
        pinned: 'left',
        renderCell: ({ value, row }) => (
          <div>
            <span className="font-mono font-bold text-slate-900 block">{value}</span>
            <span className="text-[10px] text-slate-400 font-sans">{row.receivedDate}</span>
          </div>
        ),
      },
      {
        field: 'poNumber',
        headerName: 'PO Ref',
        width: 135,
        renderCell: ({ value, row }) => (
          <div>
            <span className="font-mono font-semibold text-blue-600 block">{value}</span>
            <span className="text-[10px] text-slate-500 truncate block">{row.supplierName}</span>
          </div>
        ),
      },
      {
        field: 'items',
        headerName: 'Received Material',
        width: 210,
        valueGetter: (row) => row.items.map((it) => `${it.receivedQty} ${it.uom} ${it.name}`).join(', '),
        renderCell: ({ row }) => (
          <div className="truncate">
            {row.items.map((it, i) => (
              <span key={i} className="text-slate-800 font-medium">
                <strong>{it.receivedQty.toLocaleString()} {it.uom}</strong> {it.name}
              </span>
            ))}
          </div>
        ),
      },
      {
        field: 'lotLocation',
        headerName: 'Lot & Storage Location',
        width: 200,
        valueGetter: (row) => row.items.map((it) => `${it.supplierLot} @ ${it.targetLocation}`).join(', '),
        renderCell: ({ row }) => (
          <div className="font-mono text-[10px]">
            {row.items.map((it, i) => (
              <div key={i}>
                <span className="text-slate-800 font-bold">{it.supplierLot}</span>
                <span className="block text-slate-400">{it.targetLocation}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        field: 'stockBucket',
        headerName: 'Stock Bucket',
        width: 140,
        valueGetter: (row) => row.items[0]?.stockBucket || 'AVAILABLE',
        renderCell: ({ row }) => (
          <div>
            {row.items.map((it, i) => (
              <span
                key={i}
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  it.stockBucket === 'HOLD'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {it.stockBucket}
              </span>
            ))}
          </div>
        ),
      },
      {
        field: 'receivedBy',
        headerName: 'Received By',
        width: 150,
      },
    ],
    []
  );

  // 4. Columns for Suppliers Master Grid
  const supplierGridColumns: GridColumn<Supplier>[] = useMemo(
    () => [
      {
        field: 'code',
        headerName: 'Vendor Code',
        width: 130,
        pinned: 'left',
        renderCell: ({ value }) => <span className="font-mono font-bold text-slate-900">{value}</span>,
      },
      {
        field: 'name',
        headerName: 'Supplier Name',
        width: 220,
        renderCell: ({ value }) => <span className="font-semibold text-slate-800">{value}</span>,
      },
      {
        field: 'category',
        headerName: 'Material Category',
        width: 170,
      },
      {
        field: 'paymentTerms',
        headerName: 'Payment Terms',
        width: 130,
        renderCell: ({ value }) => <span className="font-mono text-slate-700">{value}</span>,
      },
      {
        field: 'rating',
        headerName: 'Quality Rating',
        width: 130,
        align: 'center',
        renderCell: ({ value }) => (
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ★ {Number(value).toFixed(1)} / 5.0
          </span>
        ),
      },
      {
        field: 'contactEmail',
        headerName: 'Contact Email',
        width: 220,
        renderCell: ({ value }) => <span className="text-slate-500 font-mono text-[11px]">{value}</span>,
      },
      {
        field: 'active',
        headerName: 'Status',
        type: 'boolean',
        width: 100,
        align: 'center',
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header & Persona SoD Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Procurement & Inbound Receiving Dock
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Enterprise DataGrid
            </span>
          </div>
          <p className="text-xs text-slate-500">
            High-density enterprise tabular grid with column filtering, multi-sort, drag-resizing, and frozen columns.
          </p>
        </div>

        {/* Persona Switcher for Testing Segregation of Duties */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs text-xs">
          <UserCheck className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-slate-500 text-[11px] hidden sm:inline">Active Actor:</span>
          <select
            value={currentUser.name}
            onChange={(e) => {
              const p = PERSONAS.find((item) => item.name === e.target.value);
              if (p) onSwitchUser(p);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-2 py-1 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} — {p.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectSubTab('pr')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'pr'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Purchase Requisitions (PR)</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-mono">
            {purchaseRequisitions.length}
          </span>
        </button>
        <button
          onClick={() => onSelectSubTab('po')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'po'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Purchase Orders (PO)</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-mono">
            {purchaseOrders.length}
          </span>
        </button>
        <button
          onClick={() => onSelectSubTab('grn')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'grn'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Receiving Dock & GRN</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-mono">
            {goodsReceiptNotes.length}
          </span>
        </button>
        <button
          onClick={() => onSelectSubTab('suppliers')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'suppliers'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Certified Suppliers ({suppliers.length})</span>
        </button>
      </div>

      {/* 1. PURCHASE REQUISITIONS (PR) ENTERPRISE GRID */}
      {activeSubTab === 'pr' && (
        <div className="space-y-3">
          {/* Top Threshold & Rules Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs space-y-0.5">
              <span className="text-slate-400 font-mono text-[10px] block">APPROVAL LEVEL 1</span>
              <div className="font-bold text-slate-800">&lt; Rp 10.000.000</div>
              <div className="text-slate-500 text-[11px]">Dept Supervisor authorization.</div>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs space-y-0.5">
              <span className="text-blue-600 font-mono text-[10px] font-bold block">APPROVAL LEVEL 2</span>
              <div className="font-bold text-slate-800">Rp 10.000.000 – Rp 100.000.000</div>
              <div className="text-slate-500 text-[11px]">Plant Manager authorization required.</div>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded shadow-2xs space-y-0.5">
              <span className="text-purple-600 font-mono text-[10px] font-bold block">APPROVAL LEVEL 3</span>
              <div className="font-bold text-slate-800">&gt; Rp 100.000.000</div>
              <div className="text-slate-500 text-[11px]">Operations Director sign-off mandated.</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              Pending Approval: <strong className="text-slate-800">{pendingPRs.length}</strong> | Ready for PO:{' '}
              <strong className="text-emerald-700">{approvedPRs.length}</strong>
            </span>

            <button
              onClick={() => setShowCreatePrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors self-start sm:self-auto shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Purchase Requisition</span>
            </button>
          </div>

          {/* Enterprise DataGrid for PR */}
          <EnterpriseDataGrid<PurchaseRequisition>
            data={purchaseRequisitions}
            columns={prGridColumns}
            keyField="id"
            rowSelection={true}
            multiSelect={true}
            bulkActions={prBulkActions}
            exportFileName="Purchase_Requisitions_Ledger"
            searchPlaceholder="Search PR number, requester, material name..."
            renderDetailRow={(pr) => (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span>Requisition Detail — {pr.prNumber}</span>
                  <span className="text-slate-500 font-mono text-[11px]">Created: {pr.createdAt}</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  <strong>Business Reason: </strong>{pr.reason}
                </p>
                <div className="bg-white border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-1 px-3">Item Name</th>
                        <th className="py-1 px-3 text-right">Qty</th>
                        <th className="py-1 px-3 text-right">Est. Unit Price</th>
                        <th className="py-1 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pr.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">{it.quantity.toLocaleString()} {it.uom}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">Rp {it.estimatedPrice.toLocaleString('id-ID')}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums font-bold">Rp {it.totalCost.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* 2. PURCHASE ORDERS (PO) ENTERPRISE GRID */}
      {activeSubTab === 'po' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              Active Inbound Orders: <strong className="text-slate-800">{activePOs.length}</strong>
            </span>

            <button
              onClick={() => {
                setNewPoPrRef('');
                setShowCreatePoModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors self-start sm:self-auto shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Purchase Order</span>
            </button>
          </div>

          {/* Enterprise DataGrid for PO */}
          <EnterpriseDataGrid<PurchaseOrder>
            data={purchaseOrders}
            columns={poGridColumns}
            keyField="id"
            rowSelection={true}
            multiSelect={true}
            exportFileName="Purchase_Orders_Ledger"
            searchPlaceholder="Search PO number, supplier, component..."
            renderDetailRow={(po) => (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span>PO Line Items &amp; Shipping — {po.poNumber}</span>
                  <span className="text-slate-500 text-[11px]">Warehouse: {po.destinationWarehouse}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-1 px-3">Item SKU</th>
                        <th className="py-1 px-3 text-right">Ordered</th>
                        <th className="py-1 px-3 text-right">Received</th>
                        <th className="py-1 px-3 text-right">Unit Price</th>
                        <th className="py-1 px-3 text-right">Total Line</th>
                        <th className="py-1 px-3 text-center">QC Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {po.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">{it.orderedQty.toLocaleString()} {it.uom}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums font-bold text-blue-700">{it.receivedQty.toLocaleString()} {it.uom}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">Rp {it.unitPrice.toLocaleString('id-ID')}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums font-bold">Rp {it.totalAmount.toLocaleString('id-ID')}</td>
                          <td className="py-1.5 px-3 text-center">
                            {it.qcRequired ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Required (HOLD)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Direct Available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* 3. GOODS RECEIPT NOTE (GRN) DOCK & AUTO QC HOLD ENTERPRISE GRID */}
      {activeSubTab === 'grn' && (
        <div className="space-y-4">
          {/* Invariant Callout */}
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-amber-400 font-bold block">
                UC-PRC-004 &amp; BR-INV-001: Automatic Stock Segregation on Receipt
              </span>
              <span className="text-slate-400 text-[11px]">
                Material flagged with `qcRequired = true` is strictly routed into the <strong className="text-amber-300">HOLD / QUARANTINE</strong> bucket and automatically generates a Quality Inspection task. Non-QC material routes directly to <strong className="text-emerald-300">AVAILABLE</strong>.
              </span>
            </div>
            {onNavigateToQuality && (
              <button
                onClick={onNavigateToQuality}
                className="px-2.5 py-1 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded self-start md:self-auto font-sans"
              >
                Inspect Quarantined Stock →
              </button>
            )}
          </div>

          {/* Interactive Inbound Dock Terminal */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              <span>Inbound Goods Receiving Terminal (Dermaga Penerimaan Material)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Select Active PO</label>
                <select
                  value={selectedPoForGrn}
                  onChange={(e) => {
                    setSelectedPoForGrn(e.target.value);
                    const selectedPo = purchaseOrders.find((p) => p.id === e.target.value);
                    const it = selectedPo?.items[0];
                    if (it) {
                      setGrnReceivedQty(Math.max(0, it.orderedQty - it.receivedQty));
                      setGrnQcRequired(it.qcRequired);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select PO --</option>
                  {purchaseOrders
                    .filter((p) => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} — {p.supplierName} ({p.items[0]?.name})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Physical Quantity Received</label>
                <input
                  type="number"
                  min="1"
                  value={grnReceivedQty}
                  onChange={(e) => setGrnReceivedQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Supplier Lot Number (Tracing)</label>
                <input
                  type="text"
                  value={grnLotNumber}
                  onChange={(e) => setGrnLotNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Target Storage Bin Location</label>
                <input
                  type="text"
                  value={grnWarehouseLoc}
                  onChange={(e) => setGrnWarehouseLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grnQcRequired}
                    onChange={(e) => setGrnQcRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Incoming QC Required (Auto HOLD)
                  </span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  disabled={!selectedPoForGrn || grnReceivedQty <= 0}
                  onClick={() => {
                    const po = purchaseOrders.find((p) => p.id === selectedPoForGrn);
                    const it = po?.items[0];
                    if (!it) return;

                    onPostGRN(
                      selectedPoForGrn,
                      [
                        {
                          poItemId: it.id,
                          receivedQty: grnReceivedQty,
                          supplierLot: grnLotNumber,
                          warehouseLoc: grnWarehouseLoc,
                          incomingQcRequired: grnQcRequired,
                        },
                      ],
                      grnNotes
                    );
                  }}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded transition-colors shadow-2xs ${
                    !selectedPoForGrn || grnReceivedQty <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  Post Goods Receipt (GRN)
                </button>
              </div>
            </div>
          </div>

          {/* Enterprise DataGrid for Posted GRN */}
          <EnterpriseDataGrid<GoodsReceiptNote>
            data={goodsReceiptNotes}
            columns={grnGridColumns}
            keyField="id"
            exportFileName="Goods_Receipt_Notes_Ledger"
            searchPlaceholder="Search GRN, PO number, lot number..."
          />
        </div>
      )}

      {/* 4. CERTIFIED SUPPLIERS ENTERPRISE GRID */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-3">
          <EnterpriseDataGrid<Supplier>
            data={suppliers}
            columns={supplierGridColumns}
            keyField="id"
            exportFileName="Certified_Suppliers_Directory"
            searchPlaceholder="Search supplier code, company name, category..."
          />
        </div>
      )}

      {/* CREATE PR MODAL */}
      {showCreatePrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>Create Purchase Requisition (PR)</span>
              </h3>
              <button
                onClick={() => setShowCreatePrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Requester (Current Persona)</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (${currentUser.role})`}
                  className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newPrDept}
                    onChange={(e) => setNewPrDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Required By Date</label>
                  <input
                    type="date"
                    required
                    value={newPrRequiredDate}
                    onChange={(e) => setNewPrRequiredDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Material SKU</label>
                <select
                  value={newPrItemProduct}
                  onChange={(e) => setNewPrItemProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({p.baseUom})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPrItemQty}
                    onChange={(e) => setNewPrItemQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Est. Unit Price (IDR)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPrItemPrice}
                    onChange={(e) => setNewPrItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Live Preview of Calculated Approval Tier */}
              {(() => {
                const total = Number(newPrItemQty) * Number(newPrItemPrice);
                let lvl = 1;
                let approverTitle = 'Department Supervisor';
                if (total > 100000000) {
                  lvl = 3;
                  approverTitle = 'Operations Director';
                } else if (total >= 10000000) {
                  lvl = 2;
                  approverTitle = 'Plant Manager';
                }

                return (
                  <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-xs text-blue-900 space-y-1">
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span>Total: Rp {total.toLocaleString('id-ID')}</span>
                      <span>Level {lvl} Approval</span>
                    </div>
                    <div className="text-[11px] text-blue-700">
                      Approval threshold rule routes this requisition to <strong>{approverTitle}</strong>.
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Business Reason</label>
                <textarea
                  required
                  rows={2}
                  value={newPrReason}
                  onChange={(e) => setNewPrReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePrModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {showCreatePoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>Issue Purchase Order (PO)</span>
              </h3>
              <button
                onClick={() => setShowCreatePoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Select Supplier</label>
                <select
                  value={newPoSupplier}
                  onChange={(e) => setNewPoSupplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-semibold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category}) — {s.paymentTerms}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={newPoDeliveryDate}
                    onChange={(e) => setNewPoDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={newPoPaymentTerms}
                    onChange={(e) => setNewPoPaymentTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Material Item</label>
                <select
                  value={newPoItemProduct}
                  onChange={(e) => setNewPoItemProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPoItemQty}
                    onChange={(e) => setNewPoItemQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Unit Price (IDR)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPoItemPrice}
                    onChange={(e) => setNewPoItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPoQcRequired}
                  onChange={(e) => setNewPoQcRequired(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">
                  Incoming QC Required (IQC upon delivery)
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT PR REASON MODAL */}
      {rejectingPrId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-4 space-y-3 shadow-xl text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject Purchase Requisition</span>
            </h4>
            <p className="text-slate-500">
              BR-PRC-002 requires an explicit explanation for rejecting this requisition.
            </p>

            <textarea
              required
              rows={3}
              placeholder="e.g., Budget exceeded for Q4 or duplicate replenishment request."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingPrId(null)}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  if (rejectingPrId && rejectReason.trim()) {
                    onRejectPR(rejectingPrId, rejectReason.trim());
                    setRejectingPrId(null);
                  }
                }}
                className={`px-3 py-1 font-semibold rounded text-white shadow-2xs ${
                  !rejectReason.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
