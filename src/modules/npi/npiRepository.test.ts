import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createNpiRepository } from './npiRepository';
import type { NpiProject } from '../../types';

describe('NPI Repository Operations', () => {
  it('manages NPI projects through authoritative persistence', () => {
    const repo = createNpiRepository([]);

    const project: NpiProject = {
      id: 'npi-test-1',
      projectNumber: 'NPI-TEST-001',
      productId: 'prd-001',
      productSku: 'Product A',
      productName: 'Product A',
      productRevision: 'Rev A',
      customer: 'Acme Corp',
      projectOwner: 'Lead Eng',
      engineeringOwner: 'Systems Arch',
      ppicRepresentative: 'Planner',
      productionRepresentative: 'Supervisor',
      qualityRepresentative: 'QA Manager',
      toolingRepresentative: 'Tooling Lead',
      targetReleaseDate: '2026-12-01',
      status: 'PILOT',
      priority: 'HIGH',
      notes: 'Test NPI',
      blockingIssues: [],
      milestones: [],
      trialRuns: [],
      pilotRuns: [],
    };

    repo.saveProject(project);
    assert.strictEqual(repo.listProjects().length, 1);
    assert.strictEqual(repo.findProjectById('npi-test-1')?.projectNumber, 'NPI-TEST-001');

    const removed = repo.deleteProject('npi-test-1');
    assert.strictEqual(removed, true);
    assert.strictEqual(repo.listProjects().length, 0);
  });
});
