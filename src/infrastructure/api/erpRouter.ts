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
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager'] }),
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

erpRouter.post(
  '/production-orders/:id/plan',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager'] }),
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
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Plant Manager'] }),
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
   INVENTORY CQRS ROUTES
------------------------------------------------------------- */
erpRouter.get(
  '/inventory/balance/:sku',
  requireErpAuth({ requiredRoles: ['Planner', 'Supervisor', 'Quality Lead', 'Plant Manager'] }),
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

erpRouter.post(
  '/inventory/transfer',
  requireErpAuth({ requiredRoles: ['Supervisor', 'Quality Lead', 'Plant Manager'] }),
  (req, res) => {
    const command = req.body;
    const result = erpApplication.inventory.transferStock.execute(command);
    if (result.isSuccess) {
      res.json(result.value);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  }
);
