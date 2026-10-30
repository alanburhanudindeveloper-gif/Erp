/**
 * Authoritative ERP Composition Root — CQRS Dependencies.
 *
 * Assembles and wires commands and queries across domain boundaries.
 * Application use cases receive their required repository ports from the composition container.
 */

import { type ErpRepositories, erpRepositories } from './repositories';
import {
  PlanWorkOrderHandler,
  CancelWorkOrderHandler,
  GetWorkOrderByIdHandler,
  ListWorkOrdersHandler,
} from '../../modules/manufacturing/application';
import {
  CreatePurchaseRequisitionHandler,
  ApprovePurchaseRequisitionHandler,
  ListPurchaseOrdersHandler,
  ListPurchaseRequisitionsHandler,
} from '../../modules/procurement/application';
import {
  DispatchProductionPlanHandler,
  GetProductionPlanHandler,
} from '../../modules/planning/application';
import {
  EvaluateInspectionHandler,
  ResolveNcrHandler,
  ListOpenNcrsHandler,
} from '../../modules/quality/application';
import {
  TransferStockHandler,
  ReverseMovementHandler,
  Get5BucketBalanceHandler,
} from '../../modules/inventory/application';

export interface ErpApplication {
  manufacturing: {
    planWorkOrder: PlanWorkOrderHandler;
    cancelWorkOrder: CancelWorkOrderHandler;
    getWorkOrderById: GetWorkOrderByIdHandler;
    listWorkOrders: ListWorkOrdersHandler;
  };
  procurement: {
    createPurchaseRequisition: CreatePurchaseRequisitionHandler;
    approvePurchaseRequisition: ApprovePurchaseRequisitionHandler;
    listPurchaseOrders: ListPurchaseOrdersHandler;
    listPurchaseRequisitions: ListPurchaseRequisitionsHandler;
  };
  planning: {
    dispatchProductionPlan: DispatchProductionPlanHandler;
    getProductionPlan: GetProductionPlanHandler;
  };
  quality: {
    evaluateInspection: EvaluateInspectionHandler;
    resolveNcr: ResolveNcrHandler;
    listOpenNcrs: ListOpenNcrsHandler;
  };
  inventory: {
    transferStock: TransferStockHandler;
    reverseMovement: ReverseMovementHandler;
    get5BucketBalance: Get5BucketBalanceHandler;
  };
}

export function createErpApplication(repos: ErpRepositories = erpRepositories): ErpApplication {
  return {
    manufacturing: {
      planWorkOrder: new PlanWorkOrderHandler(repos.workOrder),
      cancelWorkOrder: new CancelWorkOrderHandler(repos.workOrder),
      getWorkOrderById: new GetWorkOrderByIdHandler(repos.workOrder),
      listWorkOrders: new ListWorkOrdersHandler(repos.workOrder),
    },
    procurement: {
      createPurchaseRequisition: new CreatePurchaseRequisitionHandler(repos.procurement),
      approvePurchaseRequisition: new ApprovePurchaseRequisitionHandler(repos.procurement),
      listPurchaseOrders: new ListPurchaseOrdersHandler(repos.procurement),
      listPurchaseRequisitions: new ListPurchaseRequisitionsHandler(repos.procurement),
    },
    planning: {
      dispatchProductionPlan: new DispatchProductionPlanHandler(repos.planning, repos.workOrder),
      getProductionPlan: new GetProductionPlanHandler(repos.planning),
    },
    quality: {
      evaluateInspection: new EvaluateInspectionHandler(repos.quality),
      resolveNcr: new ResolveNcrHandler(repos.quality, repos.inventory),
      listOpenNcrs: new ListOpenNcrsHandler(repos.quality),
    },
    inventory: {
      transferStock: new TransferStockHandler(repos.inventory),
      reverseMovement: new ReverseMovementHandler(repos.inventory),
      get5BucketBalance: new Get5BucketBalanceHandler(repos.inventory),
    },
  };
}

export const erpApplication: ErpApplication = createErpApplication(erpRepositories);
