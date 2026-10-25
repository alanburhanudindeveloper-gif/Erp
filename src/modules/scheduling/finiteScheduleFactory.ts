import {
  ChangeoverRule,
  DemandRecord,
  EmployeeManpower,
  FiniteScheduledSlot,
  MachineMaster,
  Product,
  Routing,
} from '../../types';
import { generateFiniteScheduleSlots } from './schedulingService';

export interface BuildFiniteScheduleRequest {
  demand: DemandRecord;
  product: Product;
  routing: Routing;
  machines: MachineMaster[];
  employees: EmployeeManpower[];
  changeoverRules: ChangeoverRule[];
  startDate?: string;
  shiftStartTime?: string;
  shiftHours?: number;
}

export function buildFiniteScheduleFromDemand({
  demand,
  product,
  routing,
  machines,
  employees,
  changeoverRules,
  startDate = '2026-10-26',
  shiftStartTime = '07:00',
  shiftHours = 8,
}: BuildFiniteScheduleRequest): FiniteScheduledSlot[] {
  return generateFiniteScheduleSlots(
    demand,
    product,
    routing,
    machines,
    employees,
    changeoverRules,
    {
      startDate,
      shiftStartTime,
      shiftHours,
    }
  );
}
