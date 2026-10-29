import type { MachineMaster, DowntimeEvent } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import { INITIAL_MACHINES, INITIAL_DOWNTIME_EVENTS } from '../../lib/mockData';

export interface IMaintenanceRepository {
  listMachines(): MachineMaster[];
  findMachineById(id: string): MachineMaster | undefined;
  saveMachine(machine: MachineMaster): MachineMaster;

  listDowntimeEvents(): DowntimeEvent[];
  findDowntimeEventById(id: string): DowntimeEvent | undefined;
  recordDowntimeEvent(event: DowntimeEvent): DowntimeEvent;
}

export function createMaintenanceRepository(
  initialMachines: MachineMaster[] = INITIAL_MACHINES,
  initialDowntimes: DowntimeEvent[] = INITIAL_DOWNTIME_EVENTS
): IMaintenanceRepository {
  const machineCollection: ErpCollectionRepository<MachineMaster> = createErpCollectionRepository<MachineMaster>(
    'machines',
    initialMachines
  );

  const downtimeCollection: ErpCollectionRepository<DowntimeEvent> = createErpCollectionRepository<DowntimeEvent>(
    'downtimeevents',
    initialDowntimes
  );

  return {
    listMachines: () => machineCollection.list(),
    findMachineById: (id: string) => machineCollection.get(id),
    saveMachine: (machine: MachineMaster) => machineCollection.upsert(machine, 'id'),

    listDowntimeEvents: () => downtimeCollection.list(),
    findDowntimeEventById: (id: string) => downtimeCollection.get(id),
    recordDowntimeEvent: (event: DowntimeEvent) => downtimeCollection.upsert(event, 'id'),
  };
}
