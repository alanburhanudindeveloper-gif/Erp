import type { NonConformanceReport, QualityInspection } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import type { ITransactionalParticipant } from '../../shared/kernel/unitOfWork';
import { INITIAL_NCRS, INITIAL_QUALITY_INSPECTIONS } from '../../lib/mockData';

export interface IQualityRepository extends ITransactionalParticipant {
  listInspections(): QualityInspection[];
  findInspectionById(id: string): QualityInspection | undefined;
  saveInspection(inspection: QualityInspection): QualityInspection;
  listNcrs(): NonConformanceReport[];
  findNcrById(id: string): NonConformanceReport | undefined;
  saveNcr(ncr: NonConformanceReport): NonConformanceReport;
  listOpenNcrs(): NonConformanceReport[];
  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}

export function createQualityRepository(
  initialInspections: QualityInspection[] = INITIAL_QUALITY_INSPECTIONS,
  initialNcrs: NonConformanceReport[] = INITIAL_NCRS
): IQualityRepository {
  const inspectionCollection: ErpCollectionRepository<QualityInspection> = createErpCollectionRepository<QualityInspection>(
    'qualityinspections',
    initialInspections
  );

  const ncrCollection: ErpCollectionRepository<NonConformanceReport> = createErpCollectionRepository<NonConformanceReport>(
    'ncrs',
    initialNcrs
  );

  return {
    listInspections: () => inspectionCollection.list(),
    findInspectionById: (id: string) => inspectionCollection.get(id),
    saveInspection: (inspection: QualityInspection) => inspectionCollection.upsert(inspection, 'id'),
    listNcrs: () => ncrCollection.list(),
    findNcrById: (id: string) => ncrCollection.get(id),
    saveNcr: (ncr: NonConformanceReport) => ncrCollection.upsert(ncr, 'id'),
    listOpenNcrs: () => ncrCollection.list().filter((n) => n.status === 'OPEN'),
    createSnapshot: () => ({
      inspections: inspectionCollection.createSnapshot(),
      ncrs: ncrCollection.createSnapshot(),
    }),
    restoreSnapshot: (snapshot: unknown) => {
      if (snapshot && typeof snapshot === 'object') {
        const s = snapshot as { inspections?: unknown; ncrs?: unknown };
        if (s.inspections) inspectionCollection.restoreSnapshot(s.inspections);
        if (s.ncrs) ncrCollection.restoreSnapshot(s.ncrs);
      }
    },
  };
}
