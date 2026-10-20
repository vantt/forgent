// One cell of `runner.modelPolicies.<family>.<tier>`: a model, a model served by a
// named pool (`model@pool`), a model object `{model, pool?, effort?}`, or an ordered
// list of those. A pool is the service provider that bills for the call; a cell entry
// without a pool belongs to the pool named after its family. The split of the string
// form is at the last `@`, so a model id that itself contains `@` names its pool
// explicitly (`claude-opus-4@20250514@vertex`).

/** The reasoning effort levels a tier cell or a request may name. */
export const REASONING_EFFORT_VALUES = Object.freeze(['low', 'medium', 'high', 'max']);

const OBJECT_ENTRY_KEYS = Object.freeze(['model', 'pool', 'effort']);

/**
 * @param {unknown} cell
 * @returns {boolean} true when the cell uses the list, `@pool` or object form, which a
 *   release that only reads a single model string cannot understand.
 */
export function isExtendedTierCell(cell) {
  return Array.isArray(cell) || (typeof cell === 'string' && cell.includes('@')) || (cell !== null && typeof cell === 'object');
}

/**
 * Parse one tier cell into its ordered entries.
 *
 * @param {unknown} cell
 * @param {string} family the provider family the cell belongs to; an entry
 *   without a pool is served by the pool of the same name.
 * @returns {{model: string, pool: string, explicitPool: boolean, effort?: string}[]}
 *   `effort` is present only when the cell declares one.
 * @throws {Error} on an empty list, an entry that is neither a string nor a model object, an empty
 *   model or pool, an unknown object key, or an effort outside REASONING_EFFORT_VALUES.
 */
export function parseTierCell(cell, family) {
  const entries = Array.isArray(cell) ? cell : [cell];
  if (entries.length === 0) throw new Error('a tier cell list must name at least one model');
  return entries.map((entry) => (entry !== null && typeof entry === 'object' && !Array.isArray(entry)
    ? parseObjectEntry(entry, family)
    : parseStringEntry(entry, family)));
}

function parseStringEntry(entry, family) {
  if (typeof entry !== 'string' || !entry.trim()) {
    throw new Error(`a tier cell entry must be a non-empty string or a {model, pool?, effort?} object, got ${JSON.stringify(entry)}`);
  }
  const at = entry.lastIndexOf('@');
  if (at < 0) return { model: entry, pool: family, explicitPool: false };
  const model = entry.slice(0, at).trim();
  const pool = entry.slice(at + 1).trim();
  if (!model) throw new Error(`tier cell entry ${JSON.stringify(entry)} names no model before "@"`);
  if (!pool) throw new Error(`tier cell entry ${JSON.stringify(entry)} names no pool after "@"`);
  return { model, pool, explicitPool: true };
}

function parseObjectEntry(entry, family) {
  for (const key of Object.keys(entry)) {
    if (!OBJECT_ENTRY_KEYS.includes(key)) {
      throw new Error(`tier cell object ${JSON.stringify(entry)} has unknown key "${key}"; allowed keys: ${OBJECT_ENTRY_KEYS.join(', ')}`);
    }
  }
  if (typeof entry.model !== 'string' || !entry.model.trim()) {
    throw new Error(`tier cell object ${JSON.stringify(entry)} must name a non-empty string "model"`);
  }
  if (entry.pool !== undefined && (typeof entry.pool !== 'string' || !entry.pool.trim())) {
    throw new Error(`tier cell object ${JSON.stringify(entry)} "pool" must be a non-empty string when present`);
  }
  if (entry.effort !== undefined && !REASONING_EFFORT_VALUES.includes(entry.effort)) {
    throw new Error(`tier cell object ${JSON.stringify(entry)} "effort" must be one of ${REASONING_EFFORT_VALUES.join('/')}`);
  }
  const parsed = entry.pool === undefined
    ? { model: entry.model, pool: family, explicitPool: false }
    : { model: entry.model, pool: entry.pool, explicitPool: true };
  return entry.effort === undefined ? parsed : { ...parsed, effort: entry.effort };
}
