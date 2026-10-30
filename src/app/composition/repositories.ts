/**
 * Authoritative ERP Composition Root — Repository Registry.
 *
 * Wires authoritative repository implementations for each bounded context.
 * Infrastructure implementations depend on domain ports; the composition root
 * is the only place allowed to assemble these instances.
 */

import {
  createWorkOrderRepository,
  type IWorkOrderRepository,
} from '../../modules/manufacturing/workOrderRepository';
import {
  createInventoryRepository,
  type IInventoryRepository,
} from '../../modules/inventory/inventoryRepository';
import {
  createQualityRepository,
  type IQualityRepository,
} from '../../modules/quality/qualityRepository';
import {
  createProcurementRepository,
  type IProcurementRepository,
} from '../../modules/procurement/procurementRepository';
import {
  createPlanningRepository,
  type IPlanningRepository,
} from '../../modules/planning/planningRepository';
import {
  createSchedulingRepository,
  type ISchedulingRepository,
} from '../../modules/scheduling/schedulingRepository';
import {
  createEngineeringRepository,
  type IEngineeringRepository,
} from '../../modules/engineering/engineeringRepository';
import {
  createNpiRepository,
  type INpiRepository,
} from '../../modules/npi/npiRepository';
import {
  createMaintenanceRepository,
  type IMaintenanceRepository,
} from '../../modules/maintenance/maintenanceRepository';
import {
  createCostingRepository,
  type ICostingRepository,
} from '../../modules/costing/costingRepository';
import {
  createMasterDataRepository,
  type IMasterDataRepository,
} from '../../modules/master-data/masterDataRepository';
import {
  createWorkflowRepository,
  type IWorkflowRepository,
} from '../../modules/workflow/workflowRepository';

export interface ErpRepositories {
  workOrder: IWorkOrderRepository;
  inventory: IInventoryRepository;
  quality: IQualityRepository;
  procurement: IProcurementRepository;
  planning: IPlanningRepository;
  scheduling: ISchedulingRepository;
  engineering: IEngineeringRepository;
  npi: INpiRepository;
  maintenance: IMaintenanceRepository;
  costing: ICostingRepository;
  masterData: IMasterDataRepository;
  workflow: IWorkflowRepository;
}

export function createErpRepositories(): ErpRepositories {
  return {
    workOrder: createWorkOrderRepository(),
    inventory: createInventoryRepository(),
    quality: createQualityRepository(),
    procurement: createProcurementRepository(),
    planning: createPlanningRepository(),
    scheduling: createSchedulingRepository(),
    engineering: createEngineeringRepository(),
    npi: createNpiRepository(),
    maintenance: createMaintenanceRepository(),
    costing: createCostingRepository(),
    masterData: createMasterDataRepository(),
    workflow: createWorkflowRepository(),
  };
}

// Default singleton composition instances for runtime assembly
export const erpRepositories: ErpRepositories = createErpRepositories();

export const workOrderRepository = erpRepositories.workOrder;
export const inventoryRepository = erpRepositories.inventory;
export const qualityRepository = erpRepositories.quality;
export const procurementRepository = erpRepositories.procurement;
export const planningRepository = erpRepositories.planning;
export const schedulingRepository = erpRepositories.scheduling;
export const engineeringRepository = erpRepositories.engineering;
export const npiRepository = erpRepositories.npi;
export const maintenanceRepository = erpRepositories.maintenance;
export const costingRepository = erpRepositories.costing;
export const masterDataRepository = erpRepositories.masterData;
export const workflowRepository = erpRepositories.workflow;
