import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createSchedulingRepository } from './schedulingRepository';
import type { FiniteScheduledSlot, WhatIfScenario } from '../../types';

describe('Scheduling Repository Operations', () => {
  it('manages finite scheduled slots through authoritative persistence', () => {
    const repo = createSchedulingRepository([], []);

    const slot: FiniteScheduledSlot = {
      id: 'slot-test-1',
      scheduleNo: 'SCHED-TEST-01',
      demandRef: 'DEM-01',
      productId: 'prd-001',
      productSku: 'Product A',
      productName: 'Product A',
      targetQty: 100,
      operationSeq: 10,
      operationName: 'Cutting',
      workCenterCode: 'WC-01',
      machineCode: 'M01',
      machineUnitsAllocated: 1,
      manpowerRequired: 1,
      manpowerAssigned: ['Operator A'],
      startDateTime: '2026-10-30 08:00',
      endDateTime: '2026-10-30 12:00',
      durationMinutes: 240,
      setupMinutes: 30,
      changeoverMinutes: 0,
      processingMinutes: 210,
      expectedOutput: 100,
      status: 'SCHEDULED',
    };

    repo.saveSlot(slot);
    assert.strictEqual(repo.listSlots().length, 1);
    assert.strictEqual(repo.findSlotById('slot-test-1')?.scheduleNo, 'SCHED-TEST-01');

    const scenario: WhatIfScenario = {
      id: 'scen-test-1',
      name: 'Scenario Test',
      description: 'Testing',
      targetProductSku: 'Product A',
      targetDemandQty: 100,
      dueDate: '2026-10-30',
      machineOverrides: [],
      shiftHoursOverride: 8,
      extraShiftActive: false,
      computedOutputRatePcsPerHour: 10,
      computedGrossCapacityPerDay: 80,
      computedEffectiveCapacityPerDay: 70,
      computedProductionDurationHours: 12,
      computedCompletionDate: '2026-10-30',
      computedManpowerRequirement: 2,
      computedManpowerShortage: 0,
      computedMaterialShortages: [],
      feasibilityState: 'FEASIBLE',
      comparisonVsBaselineDays: 0,
    };

    repo.saveScenario(scenario);
    assert.strictEqual(repo.listScenarios().length, 1);
    assert.strictEqual(repo.findScenarioById('scen-test-1')?.name, 'Scenario Test');
  });
});
