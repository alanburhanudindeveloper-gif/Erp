import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInOperator, checkOutOperator, calculateOperationTelemetry } from './shopFloorService';
import type { EmployeeMaster, ProductionOrderOperation, WorkCenter } from '../../types';

const mockEmployees: EmployeeMaster[] = [
  {
    id: 'emp-op-1',
    nik: 'EMP-BTM-1001',
    fullName: 'Rudi Hartono',
    plantId: 'plant-btm',
    departmentId: 'dept-prod',
    sectionId: 'sec-assm',
    positionId: 'pos-op-sr',
    positionTitle: 'Senior SMT Operator',
    employmentStatus: 'PERMANENT',
    dailyWorkingHours: 8,
    hourlyRate: 48000,
    skills: [{ skillCode: 'SKILL-SMT', skillName: 'SMT Placement', level: 4, certifiedDate: '2023-01-01' }],
    active: true,
  },
  {
    id: 'emp-op-2',
    nik: 'EMP-CKR-2001',
    fullName: 'Ahmad Supandi',
    plantId: 'plant-ckr',
    departmentId: 'dept-prod',
    positionId: 'pos-op-jr',
    positionTitle: 'Assembly Technician',
    employmentStatus: 'CONTRACT',
    dailyWorkingHours: 8,
    hourlyRate: 35000,
    skills: [{ skillCode: 'SKILL-MECH', skillName: 'Mechanical Assembly', level: 2, certifiedDate: '2024-01-01' }],
    active: true,
  },
  {
    id: 'emp-op-3',
    nik: 'EMP-BTM-9999',
    fullName: 'Mantan Operator',
    plantId: 'plant-btm',
    departmentId: 'dept-prod',
    positionId: 'pos-op-jr',
    positionTitle: 'Former Trainee',
    employmentStatus: 'CONTRACT',
    dailyWorkingHours: 8,
    hourlyRate: 30000,
    skills: [],
    active: false,
  },
];

const mockWorkCenterBatam: WorkCenter = {
  id: 'wc-1',
  code: 'SMT-LANE-1',
  name: 'SMT High Speed Line 1',
  department: 'Production',
  plantId: 'plant-btm',
  capacityHoursPerDay: 24,
  calendar: '24x7',
  shiftsCount: 3,
  efficiencyRate: 0.95,
  costRate: 150000,
  status: 'AVAILABLE',
};

test('checkInOperator authenticates active operator in correct plant', () => {
  const result = checkInOperator('EMP-BTM-1001', mockWorkCenterBatam, mockEmployees);
  assert.equal(result.allowed, true);
  assert.ok(result.session);
  assert.equal(result.session?.workCenterCode, 'SMT-LANE-1');
  assert.match(result.session?.operator || '', /Rudi Hartono/);
});

test('checkInOperator rejects operator from different plant or resigned status', () => {
  // Wrong plant (Cikarang operator trying to clock in Batam line)
  const resultWrongPlant = checkInOperator('EMP-CKR-2001', mockWorkCenterBatam, mockEmployees);
  assert.equal(resultWrongPlant.allowed, false);
  assert.match(resultWrongPlant.reason || '', /plant/);

  // Inactive operator
  const resultInactive = checkInOperator('EMP-BTM-9999', mockWorkCenterBatam, mockEmployees);
  assert.equal(resultInactive.allowed, false);
  assert.match(resultInactive.reason || '', /inactive/i);

  // Unknown badge
  const resultUnknown = checkInOperator('UNKNOWN-999', mockWorkCenterBatam, mockEmployees);
  assert.equal(resultUnknown.allowed, false);
});

test('calculateOperationTelemetry correctly computes efficiency and high scrap alerts', () => {
  const op: ProductionOrderOperation = {
    id: 'op-1',
    workOrderNo: 'WO-101-01',
    sequence: 10,
    operationCode: 'OP-SMT',
    name: 'SMT Component Pick & Place',
    workCenterId: 'wc-1',
    workCenterCode: 'SMT-LANE-1',
    workCenterName: 'SMT High Speed Line 1',
    status: 'IN_PROGRESS',
    targetQty: 500,
    completedQty: 250,
    scrapQty: 20, // 20 / 270 = 7.4% (> 5% scrap alert!)
    plannedDurationMinutes: 120,
    actualDurationMinutes: 60,
    downtimeMinutes: 0,
    setupTimeMinutes: 15,
    runTimeSecondsPerUnit: 12, // 12s standard
  };

  const telemetry = calculateOperationTelemetry(op, 50); // 50 mins elapsed for 250 pcs = 12s/unit
  assert.equal(telemetry.progressPercent, 50);
  assert.equal(telemetry.scrapRatePercent, 7.4);
  assert.equal(telemetry.isHighScrapAlert, true);
  assert.equal(telemetry.actualPaceSecondsPerUnit, 12);
  assert.equal(telemetry.efficiencyPercent, 100);
});
