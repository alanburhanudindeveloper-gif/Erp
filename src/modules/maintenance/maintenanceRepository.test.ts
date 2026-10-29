import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMaintenanceRepository } from './maintenanceRepository';
import type { MachineMaster, DowntimeEvent } from '../../types';

describe('Maintenance Repository Operations', () => {
  it('manages machines and downtime events through authoritative persistence', () => {
    const repo = createMaintenanceRepository([], []);

    const machine: MachineMaster = {
      id: 'mac-test-1',
      code: 'M-TEST',
      name: 'Testing Machine',
      workCenterId: 'wc-1',
      workCenterCode: 'WC-1',
      department: 'Machining',
      availableUnits: 1,
      standardCycleTimeSeconds: 30,
      efficiencyRate: 0.9,
      availabilityRate: 0.95,
      performanceRate: 0.95,
      qualityRate: 0.99,
      hourlyCostRate: 50,
      status: 'OPERATIONAL',
      notes: 'Test machine',
    };

    repo.saveMachine(machine);
    assert.strictEqual(repo.listMachines().length, 1);
    assert.strictEqual(repo.findMachineById('mac-test-1')?.code, 'M-TEST');

    const dt: DowntimeEvent = {
      id: 'dt-test-1',
      workCenterCode: 'WC-1',
      equipmentName: 'Testing Machine',
      status: 'RESOLVED',
      startTime: '2026-10-29 08:00',
      endTime: '2026-10-29 08:30',
      durationMinutes: 30,
      reason: 'Spindle Calibration',
      maintenanceTicketNo: 'MT-001',
      productionImpact: 'Minor',
    };

    repo.recordDowntimeEvent(dt);
    assert.strictEqual(repo.listDowntimeEvents().length, 1);
    assert.strictEqual(repo.findDowntimeEventById('dt-test-1')?.maintenanceTicketNo, 'MT-001');
  });
});
