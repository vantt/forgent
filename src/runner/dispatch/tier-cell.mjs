// One cell of `runner.modelPolicies.<family>.<tier>`: a model, a model served by a
// named pool (`model@pool`), or an ordered list of those. A pool is the service
// provider that bills for the call; a cell entry without `@` belongs to the pool
// named after its family. The split is at the last `@`, so a model id that itself
// contains `@` names its pool explicitly (`claude-opus-4@20250514@vertex`).

/**
 * @param {unknown} cell
 * @returns {boolean} true when the cell uses the list or `@pool` form, which a
 *   release that only reads a single model string cannot understand.
 */
export function isExtendedTierCell(cell) {
  return Array.isArray(cell) || (typeof cell === 'string' && cell.includes('@'));
}

/**
 * Parse one tier cell into its ordered entries.
 *
 * @param {unknown} cell
 * @param {string} family the provider family the cell belongs to; an entry
 *   without `@` is served by the pool of the same name.
 * @returns {{model: string, pool: string, explicitPool: boolean}[]}
 * @throws {Error} on an empty list, a non-string entry, or an empty model or pool.
 */
export function parseTierCell(cell, family) {
  const entries = Array.isArray(cell) ? cell : [cell];
  if (entries.length === 0) throw new Error('a tier cell list must name at least one model');
  return entries.map((entry) => {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new Error(`a tier cell entry must be a non-empty string, got ${JSON.stringify(entry)}`);
    }
    const at = entry.lastIndexOf('@');
    if (at < 0) return { model: entry, pool: family, explicitPool: false };
    const model = entry.slice(0, at).trim();
    const pool = entry.slice(at + 1).trim();
    if (!model) throw new Error(`tier cell entry ${JSON.stringify(entry)} names no model before "@"`);
    if (!pool) throw new Error(`tier cell entry ${JSON.stringify(entry)} names no pool after "@"`);
    return { model, pool, explicitPool: true };
  });
}
