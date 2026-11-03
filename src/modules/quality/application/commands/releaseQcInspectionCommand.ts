import type { NonConformanceReport, QualityInspection, StockMovement } from '../../../../types';
import type { IQualityRepository } from '../../qualityRepository';
import type { IInventoryRepository } from '../../../inventory';
import type { IUnitOfWork } from '../../../../shared/kernel/unitOfWork';
import { ok, fail, type Result } from '../../../../shared/kernel/result';
import { NotFoundError, ValidationError, type DomainError } from '../../../../shared/kernel/errors';

export interface ReleaseQcInspectionCommand {
  inspectionId: string;
  decision: 'PASS' | 'FAIL';
  disposition: 'UNRESTRICTED' | 'HOLD' | 'REJECT' | 'REWORK';
  notes?: string;
  actor: string;
  role?: string;
}

export interface ReleaseQcInspectionResult {
  inspection: QualityInspection;
  movement?: StockMovement;
  ncr?: NonConformanceReport;
  message: string;
}

export class ReleaseQcInspectionHandler {
  constructor(
    private readonly qualityRepo: IQualityRepository,
    private readonly inventoryRepo?: IInventoryRepository,
    private readonly uow?: IUnitOfWork
  ) {}

  execute(command: ReleaseQcInspectionCommand): Result<ReleaseQcInspectionResult, DomainError> {
    const inspection = this.qualityRepo.findInspectionById(command.inspectionId);
    if (!inspection) {
      return fail(new NotFoundError('QualityInspection', command.inspectionId));
    }

    const runWork = (): Result<ReleaseQcInspectionResult, DomainError> => {
      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      let recordedMovement: StockMovement | undefined;
      let generatedNcr: NonConformanceReport | undefined;

      if (command.decision === 'PASS' && command.disposition === 'UNRESTRICTED') {
        // Transfer stock from HOLD to AVAILABLE in inventory
        if (this.inventoryRepo) {
          const movement: StockMovement = {
            id: `mov-${Date.now()}-rel`,
            movementNo: `MATDOC-REL-${Date.now().toString().slice(-6)}`,
            timestamp: timeStr,
            productId: inspection.productId,
            sku: inspection.sku,
            quantity: inspection.sampleSize,
            uom: 'PCS',
            fromLocation: 'PLANT01-RM-WH-HOLD',
            toLocation: 'PLANT01-RM-WH-AVAILABLE',
            lotNumber: inspection.lotNumber,
            sourceDocument: inspection.inspectionNo,
            movementType: 'TRANSFER',
            stockBucket: 'AVAILABLE',
          };
          recordedMovement = this.inventoryRepo.recordMovement(movement);
        }
      } else if (command.decision === 'FAIL') {
        // Spawn Non-Conformance Report
        const ncrNo = `NCR-${Date.now().toString().slice(-6)}`;
        generatedNcr = {
          id: `ncr-${Date.now()}`,
          ncrNo,
          orderNumber: inspection.sourceRef,
          lotNumber: inspection.lotNumber,
          productSku: inspection.sku,
          defectDescription: command.notes || 'Material failed QC inspection criteria.',
          rootCause: 'Under investigation',
          quantityAffected: inspection.sampleSize,
          disposition: command.disposition === 'REWORK' ? 'REWORK' : 'SCRAP',
          status: 'OPEN',
          createdAt: timeStr,
        };
        this.qualityRepo.saveNcr(generatedNcr);

        if (this.inventoryRepo && command.disposition === 'REJECT') {
          const scrapMovement: StockMovement = {
            id: `mov-${Date.now()}-rej`,
            movementNo: `MATDOC-REJ-${Date.now().toString().slice(-6)}`,
            timestamp: timeStr,
            productId: inspection.productId,
            sku: inspection.sku,
            quantity: inspection.sampleSize,
            uom: 'PCS',
            fromLocation: 'QUARANTINE-AREA',
            toLocation: 'SCRAP-YARD',
            lotNumber: inspection.lotNumber,
            sourceDocument: ncrNo,
            movementType: 'SCRAP',
            stockBucket: 'REJECTED',
          };
          recordedMovement = this.inventoryRepo.recordMovement(scrapMovement);
        }
      }

      const updatedInspection: QualityInspection = {
        ...inspection,
        result: command.decision,
        disposition: command.disposition,
        inspector: command.actor,
        notes: command.notes
          ? `${inspection.notes || ''} [Decision: ${command.decision}/${command.disposition}] ${command.notes}`
          : inspection.notes,
      };

      const savedInspection = this.qualityRepo.saveInspection(updatedInspection);

      const message =
        command.decision === 'PASS'
          ? `Inspection ${savedInspection.inspectionNo} released to AVAILABLE.`
          : `Inspection ${savedInspection.inspectionNo} marked FAIL (${command.disposition}). NCR ${generatedNcr?.ncrNo || ''} logged.`;

      return ok({
        inspection: savedInspection,
        movement: recordedMovement,
        ncr: generatedNcr,
        message,
      });
    };

    if (this.uow && typeof this.uow.executeSync === 'function') {
      try {
        return this.uow.executeSync(runWork);
      } catch (err: unknown) {
        return fail(new ValidationError(err instanceof Error ? err.message : String(err)));
      }
    }

    return runWork();
  }
}
