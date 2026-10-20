import { isDeepStrictEqual } from 'node:util';

/** Consumer-owned entity diff, shared by migration and rollback. */
export function entityDifferences(legacyView, v4View) {
  const differences = [];
  for (const collection of new Set([...Object.keys(legacyView), ...Object.keys(v4View)])) {
    const left = legacyView[collection], right = v4View[collection];
    if (isDeepStrictEqual(left, right)) continue;
    if (left && right && !Array.isArray(left) && !Array.isArray(right) && typeof left === 'object' && typeof right === 'object') {
      for (const id of new Set([...Object.keys(left), ...Object.keys(right)])) if (!isDeepStrictEqual(left[id], right[id])) differences.push({ collection, id, legacy: left[id] ?? null, v4: right[id] ?? null });
    } else if (Array.isArray(left) && Array.isArray(right)) {
      for (let index = 0; index < Math.max(left.length, right.length); index++) {
        if (!isDeepStrictEqual(left[index], right[index])) differences.push({ collection, index, id: left[index]?.id ?? right[index]?.id ?? null, legacy: left[index] ?? null, v4: right[index] ?? null });
      }
    } else differences.push({ collection, legacy: left ?? null, v4: right ?? null });
  }
  return differences;
}
