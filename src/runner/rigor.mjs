// src/runner/rigor.mjs — canonical demand-side rigor scale and rank
// Single leaf module for rigor vocabulary (Phase 2 D1/D19)

export const RIGOR_VALUES = Object.freeze(['low', 'standard', 'high', 'critical']);

export const RIGOR_RANK = Object.freeze({
  low: 1,
  standard: 2,
  high: 3,
  critical: 4,
});

export function resolveStrongerRigor(a, b) {
  for (const value of [a, b]) {
    if (value !== undefined && value !== null && !RIGOR_VALUES.includes(value)) {
      throw new RangeError(`invalid rigor "${value}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
    }
  }
  if (a === undefined || a === null) return b;
  if (b === undefined || b === null) return a;
  return RIGOR_RANK[b] > RIGOR_RANK[a] ? b : a;
}
