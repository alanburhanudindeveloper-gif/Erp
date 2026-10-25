import type { DowntimeEvent } from '../../types';

export interface MachineDowntimeResult {
  event: DowntimeEvent;
  workCenterStatus: 'DOWN' | 'AVAILABLE';
}

export function reportMachineBreakdown(
  workCenterCode: string,
  reason: string,
  equipmentName: string,
  durationMinutes: number
): MachineDowntimeResult {
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const event: DowntimeEvent = {
    id: `dt-${Date.now()}`,
    workCenterCode,
    equipmentName,
    status: 'DOWN',
    startTime: timeStr,
    durationMinutes,
    reason,
    maintenanceTicketNo: `MT-2026-${Math.floor(100 + Math.random() * 900)}`,
    productionImpact: `Capacity loss of ${durationMinutes} mins recorded. Machine flagged DOWN.`,
  };

  return {
    event,
    workCenterStatus: 'DOWN',
  };
}

export function resolveMachineBreakdown(event: DowntimeEvent): MachineDowntimeResult {
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const updatedEvent: DowntimeEvent = {
    ...event,
    status: 'RESOLVED',
    endTime: timeStr,
    productionImpact: `${event.productionImpact} Repair completed and machine restored to service.`,
  };

  return {
    event: updatedEvent,
    workCenterStatus: 'AVAILABLE',
  };
}
