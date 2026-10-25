export type CapacityLoadState = 'UNDER_CAPACITY' | 'BALANCED' | 'OVERLOADED';

export interface CapacityLoadResult {
  availableMinutes: number;
  requiredMinutes: number;
  utilizationPct: number;
  capacityGapMinutes: number;
  state: CapacityLoadState;
  isOverloaded: boolean;
}

export function evaluateCapacityLoad(
  availableMinutes: number,
  requiredMinutes: number,
): CapacityLoadResult {
  if (!Number.isFinite(availableMinutes) || availableMinutes <= 0) {
    return {
      availableMinutes: 0,
      requiredMinutes,
      utilizationPct: 0,
      capacityGapMinutes: 0,
      state: 'UNDER_CAPACITY',
      isOverloaded: false,
    };
  }

  const utilizationPct = Number(((requiredMinutes / availableMinutes) * 100).toFixed(1));
  const capacityGapMinutes = Math.max(0, requiredMinutes - availableMinutes);
  const isOverloaded = utilizationPct > 100;

  let state: CapacityLoadState = 'UNDER_CAPACITY';
  if (isOverloaded) {
    state = 'OVERLOADED';
  } else if (utilizationPct >= 90) {
    state = 'BALANCED';
  }

  return {
    availableMinutes,
    requiredMinutes,
    utilizationPct,
    capacityGapMinutes,
    state,
    isOverloaded,
  };
}
