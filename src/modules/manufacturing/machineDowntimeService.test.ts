import test from 'node:test';
import assert from 'node:assert/strict';

import {
  reportMachineBreakdown,
  resolveMachineBreakdown,
} from './machineDowntimeService.ts';

test('reportMachineBreakdown creates a downtime event and marks the work center down', () => {
  const result = reportMachineBreakdown('WC-CUT-01', 'Bearing failure', 'Cutting Cell', 90);

  assert.equal(result.event.workCenterCode, 'WC-CUT-01');
  assert.equal(result.event.status, 'DOWN');
  assert.equal(result.event.durationMinutes, 90);
  assert.equal(result.workCenterStatus, 'DOWN');
  assert.match(result.event.maintenanceTicketNo, /^MT-2026-/);
});

test('resolveMachineBreakdown closes the event and marks the work center available', () => {
  const reported = reportMachineBreakdown('WC-CUT-01', 'Bearing failure', 'Cutting Cell', 90);
  const resolved = resolveMachineBreakdown(reported.event);

  assert.equal(resolved.event.status, 'RESOLVED');
  assert.equal(resolved.event.endTime !== undefined, true);
  assert.equal(resolved.workCenterStatus, 'AVAILABLE');
});
