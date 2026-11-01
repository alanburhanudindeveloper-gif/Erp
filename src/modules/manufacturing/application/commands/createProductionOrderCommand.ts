import type { ProductionOrder, Product, BillOfMaterials, Routing } from '../../../../types';
import type { IWorkOrderRepository } from '../../workOrderRepository';
import type { IMasterDataRepository } from '../../../master-data/masterDataRepository';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { buildProductionOrderDraft } from '../../productionOrderFactory';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface CreateProductionOrderCommand {
  productId: string;
  quantity: number;
  dueDate: string;
  plantId?: string;
  actorName?: string;
}

export class CreateProductionOrderHandler {
  constructor(
    private readonly workOrderRepo: IWorkOrderRepository,
    private readonly masterDataRepo?: IMasterDataRepository,
    private readonly unitOfWork?: IUnitOfWork
  ) {}

  execute(command: CreateProductionOrderCommand): Result<ProductionOrder, DomainError> {
    const runWork = () => this.executeInternal(command);
    if (this.unitOfWork?.executeSync) {
      return this.unitOfWork.executeSync(runWork);
    }
    return runWork();
  }

  private executeInternal(command: CreateProductionOrderCommand): Result<ProductionOrder, DomainError> {
    if (!command.productId || typeof command.productId !== 'string') {
      return fail(new ValidationError('productId is required'));
    }
    if (!command.quantity || command.quantity <= 0) {
      return fail(new ValidationError('quantity must be greater than zero'));
    }
    if (!command.dueDate) {
      return fail(new ValidationError('dueDate is required'));
    }

    const allProducts = this.masterDataRepo?.listProducts() || [];
    const product = allProducts.find((p) => p.id === command.productId);
    if (!product) {
      return fail(new NotFoundError('Product', command.productId));
    }

    if (product.lifecycleStatus && product.lifecycleStatus !== 'RELEASED') {
      return fail(
        new ValidationError(
          `Action Blocked (BR-NPI-001): Product ${product.sku} is in '${product.lifecycleStatus}' stage. Commercial production orders require RELEASED status.`
        )
      );
    }

    const boms = this.masterDataRepo?.listBoms() || [];
    const bom = boms.find((b) => b.productId === product.id && b.status === 'ACTIVE') || boms[0];
    const routings = this.masterDataRepo?.listRoutings() || [];
    const routing = routings.find((r) => r.productId === product.id && r.status === 'ACTIVE') || routings[0];

    const currentOrders = this.workOrderRepo.listAll();
    const orderNumber = `MO-2026-${String(126 + currentOrders.length).padStart(4, '0')}`;

    const newOrder = buildProductionOrderDraft({
      product,
      bom,
      routing,
      quantity: command.quantity,
      dueDate: command.dueDate,
      orderNumber,
      plantId: command.plantId || 'PLANT-01',
      plantName: 'Main Production Plant',
      createdAt: new Date().toISOString().split('T')[0],
      productCatalog: allProducts,
    });

    const saved = this.workOrderRepo.save(newOrder);
    return ok(saved);
  }
}
