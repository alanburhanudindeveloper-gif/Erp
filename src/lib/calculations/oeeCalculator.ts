export interface OeeMetrics {
  availability: number; // percentage (0 - 100)
  performance: number;  // percentage (0 - 100)
  quality: number;      // percentage (0 - 100)
  oee: number;          // percentage (0 - 100)
}

export function calculateOEE(
  plannedOperatingTimeMinutes: number,
  unplannedDowntimeMinutes: number,
  idealCycleTimeSeconds: number,
  totalUnitsProduced: number,
  goodUnitsProduced: number
): OeeMetrics {
  const operatingTimeMinutes = Math.max(0, plannedOperatingTimeMinutes - unplannedDowntimeMinutes);
  const availability = plannedOperatingTimeMinutes > 0 ? (operatingTimeMinutes / plannedOperatingTimeMinutes) * 100 : 0;

  const operatingTimeSeconds = operatingTimeMinutes * 60;
  const theoreticalOutput = idealCycleTimeSeconds > 0 ? operatingTimeSeconds / idealCycleTimeSeconds : 0;
  const performance = theoreticalOutput > 0 ? Math.min(100, (totalUnitsProduced / theoreticalOutput) * 100) : 0;

  const quality = totalUnitsProduced > 0 ? (goodUnitsProduced / totalUnitsProduced) * 100 : 100;

  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    availability: Number(availability.toFixed(1)),
    performance: Number(performance.toFixed(1)),
    quality: Number(quality.toFixed(1)),
    oee: Number(oee.toFixed(1)),
  };
}
