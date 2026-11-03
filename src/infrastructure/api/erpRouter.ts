import { Router } from 'express';
import { erpApplication } from '../../app/composition/dependencies';
import { requireErpAuth } from '../../modules/security/authorizationService';
import { createDevToken } from '../../modules/security/tokenService';
import {
  getCapacityOverview,
  getErpDashboardSummary,
  getInventoryOverview,
  getPlanningOverview,
  getProductionOrderOverview,
  getQualityOverview,
  getBomExplosionOverview,
  getSchedulingOverview,
  getTestingOverview,
  getWorkflowOverview,
} from '../erp/erpServerService';
import type { PurchaseOrderStatus, PurchaseRequisitionStatus, ProductionOrderStatus } from '../../types';

export const erpRouter = Router();

/* -------------------------------------------------------------
   HEALTH & SYSTEM STATUS
------------------------------------------------------------- */
erpRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mode: 'server-side-erp-boundary',
    repository: 'composition-root-authoritative',
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------------------------------------------
   AUTHENTICATION & CREDENTIAL VERIFICATION
------------------------------------------------------------- */
erpRouter.post('/auth/token', (req, res) => {
  const { role = 'Planner', userId, organizationId = 'default-org' } = req.body || {};
  const token = createDevToken(role, userId, organizationId);
  res.json({
    token,
    tokenType: 'Bearer',
    expiresIn: 86400,
    user: {
      userId: userId || `usr-${role.toLowerCase().replace(/\s+/g, '-')}-01`,
      role,
      organizationId,
    },
  });
});

erpRouter.get('/auth/me', requireErpAuth(), (req, res) => {
  res.json({
    authenticated: true,
    user: (req as any).session,
  });
});

/* -------------------------------------------------------------
   OPERATIONAL OVERVIEWS (Server Service)
------------------------------------------------------------- */
erpRouter.get(
  '/dashboard',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager'] }),
  (_req, res) => {
    res.json(getErpDashboardSummary());
  }
);

erpRouter.get(
  '/inventory',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager', 'Buyer'] }),
  (_req, res) => {
    res.json({ items: getInventoryOverview() });
  }
);

erpRouter.get(
  '/capacity',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager'] }),
  (_req, res) => {
    res.json({ workCenters: getCapacityOverview() });
  }
);

erpRouter.get(
  '/planning',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager'] }),
  (_req, res) => {
    res.json({ planning: getPlanningOverview() });
  }
);

erpRouter.get(
  '/scheduling',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager'] }),
  (_req, res) => {
    res.json({ scheduling: getSchedulingOverview() });
  }
);

erpRouter.get(
  '/workflows',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager'] }),
  (_req, res) => {
    res.json({ workflows: getWorkflowOverview() });
  }
);

erpRouter.get(
  '/testing',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager'] }),
  (_req, res) => {
    res.json({ testing: getTestingOverview() });
  }
);

erpRouter.get(
  '/quality',
  requireErpAuth({ requiredRoles: ['Quality Lead', 'Supervisor', 'Plant Manager'] }),
  (_req, res) => {
    res.json({ quality: getQualityOverview() });
  }
);

erpRouter.get(
  '/bom-explosion',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Buyer'] }),
  (req, res) => {
    const productId = req.query.productId as string | undefined;
    const quantity = req.query.quantity ? parseInt(req.query.quantity as string, 10) : 100;
    res.json({ explosion: getBomExplosionOverview(productId, isNaN(quantity) ? 100 : quantity) });
  }
);

/* -------------------------------------------------------------
   MANUFACTURING CQRS ROUTES
------------------------------------------------------------- */
erpRouter.get(
  '/production-orders',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager', 'Operator', 'Quality Lead'] }),
  (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const status = req.query.status as ProductionOrderStatus | undefined;
    const sku = req.query.sku as string | undefined;
    const plantId = req.query.plantId as string | undefined;

    const result = erpApplication.manufacturing.listWorkOrders.execute({
      page,
      limit,
      status,
      sku,
      plantId,
    });

    res.json({
      orders: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
);

erpRouter.get(
  '/production-orders/:id',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager', 'Operator', 'Quality Lead'] }),
  (req, res) => {
    const result = erpApplication.manufacturing.getWorkOrderById.execute({ orderId: req.params.id });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(404).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const { productId, quantity, dueDate, plantId, actorName } = req.body;
    const session = (req as any).session;
    const result = erpApplication.manufacturing.createProductionOrder.execute({
      productId,
      quantity,
      dueDate,
      plantId,
      actorName: actorName || session?.userId || 'Production Planner',
    });
    if (result.isSuccess) {
      res.status(201).json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders/:id/release',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const orderId = req.params.id;
    const { actorName, actorRole, overrideReason } = req.body;
    const session = (req as any).session;
    const result = erpApplication.manufacturing.releaseProductionOrder.execute({
      orderId,
      actorName: actorName || session?.userId || 'Supervisor',
      actorRole: actorRole || session?.role || 'Supervisor',
      overrideReason,
    });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders/:id/operations/:seq/start',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Operator', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const orderId = req.params.id;
    const sequence = parseInt(req.params.seq, 10);
    const { operatorName } = req.body;
    const session = (req as any).session;
    const result = erpApplication.manufacturing.startProductionOperation.execute({
      orderId,
      operationSequence: sequence,
      operatorName: operatorName || session?.userId || 'Operator',
    });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders/:id/operations/:seq/complete',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Operator', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const orderId = req.params.id;
    const sequence = parseInt(req.params.seq, 10);
    const { actorName, actorRole } = req.body;
    const session = (req as any).session;
    const result = erpApplication.manufacturing.completeProductionOperation.execute({
      orderId,
      operationSequence: sequence,
      actorName: actorName || session?.userId || 'Operator',
      actorRole: actorRole || session?.role || 'Operator',
    });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders/:id/close',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const orderId = req.params.id;
    const { actorName, actorRole } = req.body;
    const session = (req as any).session;
    const result = erpApplication.manufacturing.closeProductionOrder.execute({
      orderId,
      actorName: actorName || session?.userId || 'Plant Manager',
      actorRole: actorRole || session?.role || 'Plant Manager',
    });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders/:id/plan',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const orderId = req.params.id;
    const { bom, routing, actor, role } = req.body;
    if (!bom || !routing) {
      return res.status(400).json({ error: 'bom and routing are required to plan work order' });
    }
    const result = erpApplication.manufacturing.planWorkOrder.execute({
      orderId,
      bom,
      routing,
      actor: actor || 'Production Planner',
      role,
    });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/production-orders/:id/cancel',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const orderId = req.params.id;
    const { reason, actor, role } = req.body;
    const result = erpApplication.manufacturing.cancelWorkOrder.execute({
      orderId,
      reason: reason || 'Cancelled by controller',
      actor: actor || 'Production Controller',
      role,
    });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

/* -------------------------------------------------------------
   MANUFACTURING: MATERIAL REQUESTS (Authoritative Server State)
------------------------------------------------------------- */
erpRouter.get(
  '/material-requests',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager', 'Operator', 'Quality Lead'] }),
  (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const sourceType = req.query.sourceType as string | undefined;
    const status = req.query.status as string | undefined;
    const destinationLine = req.query.destinationLine as string | undefined;

    const result = erpApplication.manufacturing.listMaterialRequests.execute({
      page,
      limit,
      sourceType,
      status,
      destinationLine,
    });

    res.json({
      requests: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
);

erpRouter.get(
  '/material-requests/:id',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager', 'Operator', 'Quality Lead'] }),
  (req, res) => {
    const result = erpApplication.manufacturing.getMaterialRequestById.execute({ id: req.params.id });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(404).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/material-requests',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager', 'Production Manager', 'Operator'] }),
  (req, res) => {
    const session = (req as any).session;
    const { sourceType, sourceReferenceId, productSku, requester, department, requiredDate, destinationLine, priority, items, notes } = req.body;

    const result = erpApplication.manufacturing.createMaterialRequest.execute({
      sourceType,
      sourceReferenceId,
      productSku,
      requester: requester || session?.userId || 'Shop Floor Requester',
      department: department || 'Shop Floor Staging',
      requiredDate: requiredDate || new Date().toISOString().split('T')[0],
      destinationLine,
      priority: priority || 'HIGH',
      items,
      notes,
    });

    if (result.isSuccess) {
      res.status(201).json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/material-requests/:id/pick',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Operator', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const session = (req as any).session;
    const { pickedBy, pickedAt } = req.body;

    const result = erpApplication.manufacturing.pickMaterialRequest.execute({
      id: req.params.id,
      pickedBy: pickedBy || session?.userId || 'Warehouse Operator',
      pickedAt,
    });

    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/material-requests/:id/deliver',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Operator', 'Plant Manager', 'Production Manager'] }),
  (req, res) => {
    const session = (req as any).session;
    const { deliveredBy, destinationLine, deliveredAt } = req.body;

    const result = erpApplication.manufacturing.deliverMaterialRequest.execute({
      id: req.params.id,
      deliveredBy: deliveredBy || session?.userId || 'Logistics Operator',
      destinationLine,
      deliveredAt,
    });

    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

/* -------------------------------------------------------------
   PROCUREMENT CQRS ROUTES (Authoritative Server State)
------------------------------------------------------------- */
erpRouter.get(
  '/procurement/purchase-requisitions',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Procurement Manager', 'Buyer', 'Plant Manager'] }),
  (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const status = req.query.status as PurchaseRequisitionStatus | undefined;
    const department = req.query.department as string | undefined;

    const result = erpApplication.procurement.listPurchaseRequisitions.execute({
      page,
      limit,
      status,
      department,
    });

    res.json(result);
  }
);

erpRouter.post(
  '/procurement/purchase-requisitions',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Procurement Manager', 'Buyer', 'Plant Manager'] }),
  (req, res) => {
    const command = req.body;
    const result = erpApplication.procurement.createPurchaseRequisition.execute(command);
    if (result.isSuccess) {
      res.status(201).json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/procurement/purchase-requisitions/:id/approve',
  requireErpAuth({ requiredRoles: ['Manager', 'Supervisor', 'Procurement Manager', 'Plant Manager'] }),
  (req, res) => {
    const prId = req.params.id;
    const { actorName, actorRole } = req.body;

    const result = erpApplication.procurement.approvePurchaseRequisition.execute({
      prId,
      actorName: actorName || 'Authorized Manager',
      actorRole: actorRole || 'Manager',
    });

    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.get(
  '/procurement/purchase-orders',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Procurement Manager', 'Buyer', 'Plant Manager'] }),
  (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const status = req.query.status as PurchaseOrderStatus | undefined;
    const supplierId = req.query.supplierId as string | undefined;

    const result = erpApplication.procurement.listPurchaseOrders.execute({
      page,
      limit,
      status,
      supplierId,
    });

    res.json(result);
  }
);

/* -------------------------------------------------------------
   INVENTORY CQRS ROUTES (Authoritative Server State)
------------------------------------------------------------- */
erpRouter.get(
  '/inventory/balances',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager', 'Buyer', 'Operator'] }),
  (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const sku = req.query.sku as string | undefined;
    const type = req.query.type as string | undefined;
    const category = req.query.category as string | undefined;
    const belowBufferOnly = req.query.belowBufferOnly === 'true';

    const result = erpApplication.inventory.listInventoryBalances.execute({
      page,
      limit,
      sku,
      type,
      category,
      belowBufferOnly,
    });

    res.json(result);
  }
);

erpRouter.get(
  '/inventory/balances/:sku',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager', 'Buyer', 'Operator'] }),
  (req, res) => {
    const sku = req.params.sku;
    const result = erpApplication.inventory.get5BucketBalance.execute({ sku });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(404).json({ error: result.error.message });
    }
  }
);

// Backward compatibility alias
erpRouter.get(
  '/inventory/balance/:sku',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager', 'Buyer', 'Operator'] }),
  (req, res) => {
    const sku = req.params.sku;
    const result = erpApplication.inventory.get5BucketBalance.execute({ sku });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(404).json({ error: result.error.message });
    }
  }
);

erpRouter.get(
  '/inventory/movements',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager', 'Operator'] }),
  (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const sku = req.query.sku as string | undefined;
    const movementType = req.query.movementType as string | undefined;
    const stockBucket = req.query.stockBucket as string | undefined;
    const lotNumber = req.query.lotNumber as string | undefined;

    const result = erpApplication.inventory.listStockMovements.execute({
      page,
      limit,
      sku,
      movementType,
      stockBucket,
      lotNumber,
    });

    res.json(result);
  }
);

erpRouter.get(
  '/inventory/movements/:id',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager', 'Procurement Manager', 'Operator'] }),
  (req, res) => {
    const result = erpApplication.inventory.getStockMovementById.execute({ id: req.params.id });
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(404).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/inventory/transfers',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Quality Lead', 'Plant Manager', 'Operator'] }),
  (req, res) => {
    const session = (req as any).session;
    const body = req.body || {};
    const command = {
      ...body,
      actor: body.actor || session?.userId || 'Warehouse Operator',
      role: body.role || session?.role || 'Operator',
    };
    const result = erpApplication.inventory.transferStock.execute(command);
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

// Backward compatibility alias
erpRouter.post(
  '/inventory/transfer',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Quality Lead', 'Plant Manager', 'Operator'] }),
  (req, res) => {
    const session = (req as any).session;
    const body = req.body || {};
    const command = {
      ...body,
      actor: body.actor || session?.userId || 'Warehouse Operator',
      role: body.role || session?.role || 'Operator',
    };
    const result = erpApplication.inventory.transferStock.execute(command);
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/inventory/movements/:id/reverse',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Quality Lead', 'Plant Manager'] }),
  (req, res) => {
    const session = (req as any).session;
    const movementId = req.params.id;
    const { reason, actor, role } = req.body || {};

    const result = erpApplication.inventory.reverseMovement.execute({
      movementId,
      reason: reason || 'Compensating reversal posted by controller',
      actor: actor || session?.userId || 'Warehouse Controller',
      role: role || session?.role || 'Supervisor',
    });

    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

erpRouter.post(
  '/inventory/issue',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Operator', 'Plant Manager'] }),
  (req, res) => {
    const session = (req as any).session;
    const { orderId, componentSku, lotNumber, quantity, isHoldOverride, actor, role } = req.body || {};

    const result = erpApplication.inventory.issueMaterial.execute({
      orderId,
      componentSku,
      lotNumber,
      quantity: Number(quantity),
      actor: actor || session?.userId || 'Shop Floor Operator',
      role: role || session?.role || 'Operator',
      isHoldOverride: Boolean(isHoldOverride),
    });

    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);

