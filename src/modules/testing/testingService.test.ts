import test from 'node:test';
import assert from 'node:assert/strict';

import { runTestingScenario, summarizeTestingMatrix } from './testingService';
import type { TestingScenario } from '../../types';

const scenarios: TestingScenario[] = [
  {
    id: 't-1',
    scenarioNumber: 1,
    title: 'Baseline scenario',
    description: 'Material release check',
    expectedResult: 'Approved',
    status: 'PASSED',
    lastRunDetails: 'Executed successfully',
  },
  {
    id: 't-2',
    scenarioNumber: 2,
    title: 'Risk scenario',
    description: 'Capacity overload',
    expectedResult: 'Flagged',
    status: 'RUNNING',
    lastRunDetails: 'Requires review',
  },
  {
    id: 't-3',
    scenarioNumber: 3,
    title: 'Pending scenario',
    description: 'Audit trail',
    expectedResult: 'Awaiting run',
    status: 'PENDING',
    lastRunDetails: 'Queued for execution',
  },
];

test('testing matrix summary reports pass rate and counts accurately', () => {
  const summary = summarizeTestingMatrix(scenarios);

  assert.equal(summary.totalScenarios, 3);
  assert.equal(summary.passedScenarios, 1);
  assert.equal(summary.failedScenarios, 1);
  assert.equal(summary.pendingScenarios, 1);
  assert.equal(summary.passRate, 33.3);
  assert.equal(summary.status, 'PARTIALLY_READY');
});

test('runTestingScenario marks a scenario passed and records the verification note', () => {
  const run = runTestingScenario(scenarios[1]);

  assert.equal(run.status, 'PASSED');
  assert.match(run.lastRunDetails || '', /Assertions validated against domain invariants|Verified at/i);
});
