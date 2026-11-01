import type { PurchaseRequisition, PurchaseOrder, GoodsReceiptNote } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import {
  INITIAL_PURCHASE_REQUISITIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_GOODS_RECEIPTS,
} from '../../lib/mockData';

export interface IProcurementRepository extends ITransactionalParticipant {
  listPurchaseRequisitions(): PurchaseRequisition[];
  findPurchaseRequisitionById(id: string): PurchaseRequisition | undefined;
  savePurchaseRequisition(pr: PurchaseRequisition): PurchaseRequisition;

  listPurchaseOrders(): PurchaseOrder[];
  findPurchaseOrderById(id: string): PurchaseOrder | undefined;
  savePurchaseOrder(po: PurchaseOrder): PurchaseOrder;

  listGoodsReceipts(): GoodsReceiptNote[];
  findGoodsReceiptById(id: string): GoodsReceiptNote | undefined;
  recordGoodsReceipt(grn: GoodsReceiptNote): GoodsReceiptNote;

  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

export function createProcurementRepository(
  initialPrs: PurchaseRequisition[] = INITIAL_PURCHASE_REQUISITIONS,
  initialPos: PurchaseOrder[] = INITIAL_PURCHASE_ORDERS,
  initialGrns: GoodsReceiptNote[] = INITIAL_GOODS_RECEIPTS
): IProcurementRepository {
  const prCollection: ErpCollectionRepository<PurchaseRequisition> = createErpCollectionRepository<PurchaseRequisition>(
    'purchaserequisitions',
    initialPrs
  );

  const poCollection: ErpCollectionRepository<PurchaseOrder> = createErpCollectionRepository<PurchaseOrder>(
    'purchaseorders',
    initialPos
  );

  const grnCollection: ErpCollectionRepository<GoodsReceiptNote> = createErpCollectionRepository<GoodsReceiptNote>(
    'goodsreceipts',
    initialGrns
  );

  return {
    listPurchaseRequisitions: () => prCollection.list(),
    findPurchaseRequisitionById: (id: string) => prCollection.get(id),
    savePurchaseRequisition: (pr: PurchaseRequisition) => prCollection.upsert(pr, 'id'),

    listPurchaseOrders: () => poCollection.list(),
    findPurchaseOrderById: (id: string) => poCollection.get(id),
    savePurchaseOrder: (po: PurchaseOrder) => poCollection.upsert(po, 'id'),

    listGoodsReceipts: () => grnCollection.list(),
    findGoodsReceiptById: (id: string) => grnCollection.get(id),
    recordGoodsReceipt: (grn: GoodsReceiptNote) => grnCollection.upsert(grn, 'id'),

    createSnapshot: () => ({
      prs: prCollection.createSnapshot(),
      pos: poCollection.createSnapshot(),
      grns: grnCollection.createSnapshot(),
    }),

    restoreSnapshot: (snapshot: unknown) => {
      if (snapshot && typeof snapshot === 'object') {
        const snap = snapshot as {
          prs?: PurchaseRequisition[];
          pos?: PurchaseOrder[];
          grns?: GoodsReceiptNote[];
        };
        if (snap.prs) prCollection.restoreSnapshot(snap.prs);
        if (snap.pos) poCollection.restoreSnapshot(snap.pos);
        if (snap.grns) grnCollection.restoreSnapshot(snap.grns);
      }
    },
  };
}
