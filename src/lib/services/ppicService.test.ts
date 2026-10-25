import test from 'node:test';
import assert from 'node:assert/strict';

import * as legacyPpicService from './ppicService';
import {
  calculateOutputRate,
  calculateMachineCapacity,
  calculateRequiredMachineHours,
  calculateManpowerRequirement,
  explodeMultiLevelBom,
  flattenBomNodes,
  analyzeBottlenecks,
  evaluateProductionFeasibility,
} from '../../modules/planning/planningService';
import {
  calculateChangeoverTime,
  generateFiniteScheduleSlots,
  runWhatIfSimulation,
} from '../../modules/scheduling/schedulingService';

test('legacy PPIC service delegates planning math to the modular planning domain', () => {
  assert.equal(legacyPpicService.calculateOutputRate, calculateOutputRate);
  assert.equal(legacyPpicService.calculateMachineCapacity, calculateMachineCapacity);
  assert.equal(legacyPpicService.calculateRequiredMachineHours, calculateRequiredMachineHours);
  assert.equal(legacyPpicService.calculateManpowerRequirement, calculateManpowerRequirement);
  assert.equal(legacyPpicService.explodeMultiLevelBom, explodeMultiLevelBom);
  assert.equal(legacyPpicService.flattenBomNodes, flattenBomNodes);
  assert.equal(legacyPpicService.analyzeBottlenecks, analyzeBottlenecks);
  assert.equal(legacyPpicService.evaluateProductionFeasibility, evaluateProductionFeasibility);
});

test('legacy PPIC service delegates scheduling logic to the modular scheduling domain', () => {
  assert.equal(legacyPpicService.calculateChangeoverTime, calculateChangeoverTime);
  assert.equal(legacyPpicService.generateFiniteScheduleSlots, generateFiniteScheduleSlots);
  assert.equal(legacyPpicService.runWhatIfSimulation, runWhatIfSimulation);
});
