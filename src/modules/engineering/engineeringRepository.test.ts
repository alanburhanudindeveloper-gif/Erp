import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEngineeringRepository } from './engineeringRepository';
import type { EngineeringChangeRequest, EngineeringDrawing } from '../../types';

describe('Engineering Repository Operations', () => {
  it('manages ECRs and drawings through authoritative persistence', () => {
    const repo = createEngineeringRepository([], [], [], [], [], [], []);

    const drawing: EngineeringDrawing = {
      id: 'dwg-test-1',
      drawingNumber: 'DWG-TEST-001',
      revision: 'Rev A',
      productId: 'prd-001',
      productSku: 'Product A',
      title: 'Test Drawing',
      fileReference: 'test.dwg',
      cadModelType: '2D_DWG',
      description: 'Drawing test',
      status: 'RELEASED',
      createdBy: 'Engineer A',
      createdDate: '2026-10-29',
    };

    repo.saveDrawing(drawing);
    assert.strictEqual(repo.listDrawings().length, 1);
    assert.strictEqual(repo.findDrawingById('dwg-test-1')?.drawingNumber, 'DWG-TEST-001');

    const ecr: EngineeringChangeRequest = {
      id: 'ecr-test-1',
      ecrNumber: 'ECR-TEST-001',
      productId: 'prd-001',
      productSku: 'Product A',
      productName: 'Product A',
      currentRevision: 'Rev A',
      proposedRevision: 'Rev B',
      reason: 'Specification update',
      requestedBy: 'Engineer B',
      department: 'Engineering',
      priority: 'HIGH',
      status: 'IMPACT_ANALYSIS',
      targetEffectiveDate: '2026-11-01',
      createdAt: '2026-10-29 10:00',
      impactAnalysis: {
        bomImpact: true,
        routingImpact: false,
        wiImpact: false,
        qcImpact: false,
        toolingImpact: false,
        costImpact: false,
        customerApprovalRequired: false,
        estimatedCostDifference: 0,
        affectedOpenWorkOrderIds: [],
        inventoryOldMaterialRemaining: [],
        inventoryNewMaterialRequired: [],
        impactSummary: 'Test summary',
      },
      openWorkOrderDecisions: [],
      approvals: [],
    };

    repo.saveEcr(ecr);
    assert.strictEqual(repo.listEcrs().length, 1);
    assert.strictEqual(repo.findEcrById('ecr-test-1')?.ecrNumber, 'ECR-TEST-001');
  });
});
