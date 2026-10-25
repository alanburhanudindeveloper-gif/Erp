import { MachineMaster, Routing, WhatIfScenario } from '../../types';
import { runWhatIfSimulation } from './schedulingService';

export interface BuildWhatIfScenarioRequest {
  targetProductSku: string;
  demandQty: number;
  dueDate: string;
  baselineMachines: MachineMaster[];
  routing: Routing;
  scenariosToRun: {
    name: string;
    description: string;
    machineQuantityOverride: number;
    shiftHours: number;
    extraShift: boolean;
  }[];
}

export function buildWhatIfScenarios({
  targetProductSku,
  demandQty,
  dueDate,
  baselineMachines,
  routing,
  scenariosToRun,
}: BuildWhatIfScenarioRequest): WhatIfScenario[] {
  return runWhatIfSimulation(
    targetProductSku,
    demandQty,
    dueDate,
    baselineMachines,
    routing,
    scenariosToRun
  );
}
