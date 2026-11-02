/**
 * Authoritative ERP Composition Root — CQRS Dependencies.
 *
 * Assembles and wires commands and queries across domain boundaries.
 * Application use cases receive their required repository ports from the composition container.
 * Injects atomic Unit of Work transaction boundaries into multi-step commands.
 */

import { type ErpRepositories, erpRepositories } from './repositories';
import { type IUnitOfWork, InMemoryUnitOfWork } from '../../shared/kernel/unitOfWork';
import {
  PlanWorkOrderHandler,
  CancelWorkOrderHandler,
  CreateProductionOrderHandler,
  ReleaseProductionOrderHandler,
  StartProductionOperationHandler,
  CompleteProductionOperationHandler,
  CloseProductionOrderHandler,
  GetWorkOrderByIdHandler,
  ListWorkOrdersHandler,
  CreateMaterialRequestHandler,
  PickMaterialRequestHandler,
  DeliverMaterialRequestHandler,
  ListMaterialRequestsHandler,
  GetMaterialRequestByIdHandler,
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
  unitOfWork: IUnitOfWork;
  manufacturing: {
    planWorkOrder: PlanWorkOrderHandler;
    cancelWorkOrder: CancelWorkOrderHandler;
    createProductionOrder: CreateProductionOrderHandler;
    releaseProductionOrder: ReleaseProductionOrderHandler;
    startProductionOperation: StartProductionOperationHandler;
    completeProductionOperation: CompleteProductionOperationHandler;
    closeProductionOrder: CloseProductionOrderHandler;
    getWorkOrderById: GetWorkOrderByIdHandler;
    listWorkOrders: ListWorkOrdersHandler;
    createMaterialRequest: CreateMaterialRequestHandler;
    pickMaterialRequest: PickMaterialRequestHandler;
    deliverMaterialRequest: DeliverMaterialRequestHandler;
    listMaterialRequests: ListMaterialRequestsHandler;
    getMaterialRequestById: GetMaterialRequestByIdHandler;
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
  const uow = new InMemoryUnitOfWork([
    repos.procurement,
    repos.workflow,
    repos.workOrder,
    repos.materialRequest,
  ]);

  return {
    unitOfWork: uow,
    manufacturing: {
      planWorkOrder: new PlanWorkOrderHandler(repos.workOrder),
      cancelWorkOrder: new CancelWorkOrderHandler(repos.workOrder),
      createProductionOrder: new CreateProductionOrderHandler(repos.workOrder, repos.masterData, uow),
      releaseProductionOrder: new ReleaseProductionOrderHandler(repos.workOrder, uow),
      startProductionOperation: new StartProductionOperationHandler(repos.workOrder),
      completeProductionOperation: new CompleteProductionOperationHandler(repos.workOrder),
      closeProductionOrder: new CloseProductionOrderHandler(repos.workOrder),
      getWorkOrderById: new GetWorkOrderByIdHandler(repos.workOrder),
      listWorkOrders: new ListWorkOrdersHandler(repos.workOrder),
      createMaterialRequest: new CreateMaterialRequestHandler(repos.materialRequest),
      pickMaterialRequest: new PickMaterialRequestHandler(repos.materialRequest),
      deliverMaterialRequest: new DeliverMaterialRequestHandler(repos.materialRequest),
      listMaterialRequests: new ListMaterialRequestsHandler(repos.materialRequest),
      getMaterialRequestById: new GetMaterialRequestByIdHandler(repos.materialRequest),
    },
    procurement: {
      createPurchaseRequisition: new CreatePurchaseRequisitionHandler(repos.procurement),
      approvePurchaseRequisition: new ApprovePurchaseRequisitionHandler(repos.procurement, repos.workflow, uow),
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
