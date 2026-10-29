import type { FiniteScheduledSlot, WhatIfScenario } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import { INITIAL_FINITE_SCHEDULES, INITIAL_WHAT_IF_SCENARIOS } from '../../lib/mockData';

export interface ISchedulingRepository {
  listSlots(): FiniteScheduledSlot[];
  findSlotById(id: string): FiniteScheduledSlot | undefined;
  saveSlot(slot: FiniteScheduledSlot): FiniteScheduledSlot;
  deleteSlot(id: string): boolean;

  listScenarios(): WhatIfScenario[];
  findScenarioById(id: string): WhatIfScenario | undefined;
  saveScenario(scenario: WhatIfScenario): WhatIfScenario;
}

export function createSchedulingRepository(
  initialSlots: FiniteScheduledSlot[] = INITIAL_FINITE_SCHEDULES,
  initialScenarios: WhatIfScenario[] = INITIAL_WHAT_IF_SCENARIOS
): ISchedulingRepository {
  const slotCollection: ErpCollectionRepository<FiniteScheduledSlot> = createErpCollectionRepository<FiniteScheduledSlot>(
    'finiteschedules',
    initialSlots
  );

  const scenarioCollection: ErpCollectionRepository<WhatIfScenario> = createErpCollectionRepository<WhatIfScenario>(
    'whatifscenarios',
    initialScenarios
  );

  return {
    listSlots: () => slotCollection.list(),
    findSlotById: (id: string) => slotCollection.get(id),
    saveSlot: (slot: FiniteScheduledSlot) => slotCollection.upsert(slot, 'id'),
    deleteSlot: (id: string) => slotCollection.remove(id),

    listScenarios: () => scenarioCollection.list(),
    findScenarioById: (id: string) => scenarioCollection.get(id),
    saveScenario: (scenario: WhatIfScenario) => scenarioCollection.upsert(scenario, 'id'),
  };
}
