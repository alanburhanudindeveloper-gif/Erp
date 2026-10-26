import { createInMemoryErpRepository, type InMemoryRecord } from '../database/index.ts';
import { createErpServerRepository } from '../database/erpServerRepository.ts';
import {
  INITIAL_BOMS,
  INITIAL_CHANGEOVER_RULES,
  INITIAL_DEMANDS,
  INITIAL_MACHINES,
  INITIAL_MANPOWER,
  INITIAL_NCRS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_QUALITY_INSPECTIONS,
  INITIAL_ROUTINGS,
  INITIAL_TESTING_SCENARIOS,
  INITIAL_WORK_CENTERS,
  INITIAL_WORKFLOWS,
} from '../../lib/mockData';
import { evaluateCapacityLoad } from '../../modules/capacity/capacityService';
import { getInventoryHealth } from '../../modules/inventory/inventoryService';
import { summarizeProductionPlanning } from '../../modules/planning/planningService';
import { generateFiniteScheduleSlots } from '../../modules/scheduling/schedulingService';
import { summarizeTestingMatrix } from '../../modules/testing/testingService';
import { createWorkflowInstance, getActiveWorkflowState } from '../../modules/workflow/workflowService';
import { explodeBom } from '../../modules/manufacturing/bomExplosionService';
import type { BillOfMaterials, Product, ProductionOrder, WorkflowDefinition } from '../../types';

export interface ErpInventoryItem {
  sku: string;
  name: string;
  available: number;
  allocated: number;
  onOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ErpDashboardSummary {
  productsTotal: number;
  activeProducts: number;
  bomsTotal: number;
  productionOrdersTotal: number;
  releasedOrders: number;
  inProgressOrders: number;
  shortageAlerts: number;
}

const repository = createErpServerRepository();

function listProducts(): Product[] {
  return repository.list('products') as unknown as Product[];
}

function listBoms(): BillOfMaterials[] {
  return repository.list('boms') as unknown as BillOfMaterials[];
}

function listProductionOrders(): ProductionOrder[] {
  return repository.list('productionOrders') as unknown as ProductionOrder[];
}

function listWorkflows(): WorkflowDefinition[] {
  return repository.list('workflows') as unknown as WorkflowDefinition[];
}

export function getErpDashboardSummary(): ErpDashboardSummary {
  const products = listProducts();
  const productionOrders = listProductionOrders();
  const shortageAlerts = productionOrders.filter((order) =>
    order.materials.some((material) => material.status === 'SHORTAGE')
  ).length;

  return {
    productsTotal: products.length,
    activeProducts: products.filter((product) => product.status === 'ACTIVE').length,
    bomsTotal: listBoms().length,
    productionOrdersTotal: productionOrders.length,
    releasedOrders: productionOrders.filter((order) => order.status === 'RELEASED').length,
    inProgressOrders: productionOrders.filter((order) => order.status === 'IN_PROGRESS').length,
    shortageAlerts,
  };
}

export function getInventoryOverview(): ErpInventoryItem[] {
  return getInventoryHealth(listProducts()).map((item) => ({
    sku: item.sku,
    name: item.name,
    available: item.availableToPromise,
    allocated: listProducts().find((product) => product.sku === item.sku)?.allocatedStock ?? 0,
    onOrder: listProducts().find((product) => product.sku === item.sku)?.onOrderStock ?? 0,
    status: item.status === 'HEALTHY' ? 'ACTIVE' : 'INACTIVE',
  }));
}

export function getProductionOrderOverview() {
  return listProductionOrders().map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    productSku: order.productSku,
    productName: order.productName,
    status: order.status,
    targetQuantity: order.targetQuantity,
    goodQuantity: order.goodQuantity,
    priority: order.priority,
  }));
}

export function getWorkflowOverview() {
  const workflows = listWorkflows();

  return workflows.map((workflow) => {
    const instance = createWorkflowInstance(workflow);
    return {
      id: workflow.id,
      code: workflow.code,
      name: workflow.name,
      entityType: workflow.entityType,
      activeState: getActiveWorkflowState(workflow),
      currentState: instance.currentState,
      states: workflow.states,
      transitionCount: workflow.transitions.length,
    };
  });
}

export function getPlanningOverview() {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];
  const demand = INITIAL_DEMANDS.find((item) => item.productSku === product.sku) ?? INITIAL_DEMANDS[0];

  return summarizeProductionPlanning(
    product.id,
    demand.quantity,
    INITIAL_PRODUCTS,
    INITIAL_BOMS,
    INITIAL_ROUTINGS,
    INITIAL_MACHINES,
    INITIAL_MANPOWER
  );
}

export function getSchedulingOverview() {
  const product = INITIAL_PRODUCTS.find((item) => item.sku === 'Product A') ?? INITIAL_PRODUCTS[0];
  const demand = INITIAL_DEMANDS.find((item) => item.productSku === product.sku) ?? INITIAL_DEMANDS[0];
  const routing = INITIAL_ROUTINGS.find((item) => item.productId === product.id && item.status === 'ACTIVE') ?? INITIAL_ROUTINGS[0];

  const slots = generateFiniteScheduleSlots(
    demand,
    product,
    routing,
    INITIAL_MACHINES,
    INITIAL_MANPOWER,
    INITIAL_CHANGEOVER_RULES,
    {
      startDate: '2026-10-26',
      shiftStartTime: '07:00',
      shiftHours: 8,
      objective: 'MINIMIZE_LATE',
    }
  );

  return {
    productSku: product.sku,
    demandQty: demand.quantity,
    scheduledSlots: slots.length,
    blockedSlots: slots.filter((slot) => slot.status === 'BLOCKED').length,
    conflictSlots: slots.filter((slot) => slot.status === 'CONFLICT').length,
    firstSlot: slots[0] ?? null,
  };
}

export function getCapacityOverview() {
  return INITIAL_WORK_CENTERS.map((workCenter) => {
    const availableMinutes = workCenter.capacityHoursPerDay * 60;
    const requiredMinutes = workCenter.code === 'WC-CUT-01' ? 520 : 360;
    const capacity = evaluateCapacityLoad(availableMinutes, requiredMinutes);

    return {
      code: workCenter.code,
      name: workCenter.name,
      department: workCenter.department,
      availableMinutes,
      requiredMinutes,
      utilizationPct: capacity.utilizationPct,
      state: capacity.state,
      isOverloaded: capacity.isOverloaded,
    };
  });
}

export function getTestingOverview() {
  return summarizeTestingMatrix(INITIAL_TESTING_SCENARIOS);
}

export function getQualityOverview() {
  const inspections = INITIAL_QUALITY_INSPECTIONS;
  const ncrs = INITIAL_NCRS;
  const passedCount = inspections.filter((i) => i.result === 'PASS').length;
  const failedCount = inspections.filter((i) => i.result === 'FAIL').length;
  const openNcrs = ncrs.filter((n) => n.status === 'OPEN').length;

  return {
    totalInspections: inspections.length,
    passedCount,
    failedCount,
    passRatePct: inspections.length > 0 ? Math.round((passedCount / inspections.length) * 1000) / 10 : 100,
    openNcrs,
    recentInspections: inspections.slice(0, 5),
    activeNcrs: ncrs.filter((n) => n.status === 'OPEN'),
  };
}

export function getBomExplosionOverview(productId?: string, quantity: number = 100) {
  const targetProduct = productId
    ? INITIAL_PRODUCTS.find((p) => p.id === productId || p.sku === productId) || INITIAL_PRODUCTS[0]
    : INITIAL_PRODUCTS[0];

  return explodeBom(targetProduct.id, quantity, INITIAL_PRODUCTS, INITIAL_BOMS);
}
