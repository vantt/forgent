// dispatch/placement-policy.mjs — PlacementPolicy redirect selection
// (Shadow binder and candidates retired in Phase 1 tier/rigor consolidation).

import crypto from 'node:crypto';
// ─── Phase 08 (executor-policy-dispatch-seams): read-only redirect executor
// ranking/selection ────────────────────────────────────────────────────────
//
// EXECUTOR selection among a declared candidate pool is a deterministic,
// assignment-seeded stable-hash distribution across the pool.
//
// Phase D correction (executor-profile-schema-migration): this module now
// owns the candidate POOL DECLARATION too, not just the selection
// algorithm -- `readOnlyRedirectPool` below reads
// `runner.placementPolicy.readOnlyRedirects.<sourceExecutorId>` directly.
// The field moved twice: originally a top-level `runner.readOnlyExecutorRedirects`
// map (pre-track); a first Phase D pass relocated it onto
// `executors.<id>.readOnlyRedirect` (self-verified safe, but architecturally
// wrong -- "which executor substitutes for a read-only operation" is a
// PlacementPolicy ranking decision, design.md §3.6, not a fact about the
// source executor's own identity, the same category of mistake as baking a
// persona into an executor id); this corrected placement matches design.md
// §7 step 9 literally ("Retire readOnlyExecutorRedirects only after
// production PlacementPolicy proof") -- PlacementPolicy owning the
// declaration IS that proof, not merely self-verified selection over an
// opaque pool someone else handed it.
export function readOnlyRedirectPool(cfg, sourceExecutorId, operation) {
  // executor-id-consolidation Step 2: a pool entry may be `{executor,
  // invocation?}` (config.mjs's `normalizePreferCandidates` shape) as well
  // as a bare string -- this function's own OUTPUT stays exactly the array
  // of executor-id strings it always returned (a tested, public contract:
  // `selectPlacementPolicyRedirectExecutor`'s hash-based DISTRIBUTION
  // selection keys off those strings, unchanged). An object entry's own
  // `invocation` pin, when present, is recovered separately by
  // `readOnlyRedirectInvocationFor` below, once the executor id has
  // already been chosen -- never folded into this array's own shape.
  const normalize = (value) => {
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (typeof entry === 'string') return entry.trim();
          if (entry && typeof entry === 'object' && !Array.isArray(entry) && typeof entry.executor === 'string') return entry.executor.trim();
          return undefined;
        })
        .filter((id) => typeof id === 'string' && id);
    }
    return [];
  };
  const configured = cfg?.placementPolicy?.readOnlyRedirects?.[sourceExecutorId];
  if (configured === undefined) {
    // Default-safety fallback, unchanged since before this field existed at
    // all: an unconfigured "claude" still redirects to "claude-reviewer"
    // when that executor is registered.
    return sourceExecutorId === 'claude' && cfg?.executors?.['claude-reviewer'] ? ['claude-reviewer'] : [];
  }
  if (configured && typeof configured === 'object' && !Array.isArray(configured)) {
    return normalize(configured.operations?.[operation] ?? configured.default);
  }
  return normalize(configured);
}

/**
 * Look up the raw pool entry descriptor declared for `executorId` within
 * `runner.placementPolicy.readOnlyRedirects.<sourceExecutorId>` for `operation`.
 * Returns `{ executor, invocation, crossProvider: boolean }` or `null` if not found.
 */
export function readOnlyRedirectEntryFor(cfg, sourceExecutorId, operation, executorId) {
  const configured = cfg?.placementPolicy?.readOnlyRedirects?.[sourceExecutorId];
  const raw = configured && typeof configured === 'object' && !Array.isArray(configured)
    ? (configured.operations?.[operation] ?? configured.default)
    : configured;
  const rawArray = Array.isArray(raw) ? raw : (raw !== undefined ? [raw] : []);
  const match = rawArray.find((entry) => {
    if (typeof entry === 'string') return entry.trim() === executorId;
    return entry && typeof entry === 'object' && !Array.isArray(entry) && entry.executor === executorId;
  });
  if (!match) return null;
  if (typeof match === 'string') {
    return { executor: match.trim(), invocation: undefined, crossProvider: false };
  }
  return {
    executor: match.executor,
    invocation: match.invocation,
    crossProvider: match.crossProvider === true,
  };
}

/**
 * executor-id-consolidation Step 2: the invocation pin (if any) declared
 * for `executorId` within the SAME raw `readOnlyRedirects` pool
 * `readOnlyRedirectPool` above already read for this exact
 * (sourceExecutorId, operation) pair -- a bare-string pool entry, or no
 * matching entry at all, both mean "no pin" (`undefined`, Gate B2's own
 * default applies). Deliberately a SEPARATE lookup rather than folded into
 * `readOnlyRedirectPool`'s own return value: that array's shape (string[])
 * is a tested, public contract this function does not disturb.
 */
export function readOnlyRedirectInvocationFor(cfg, sourceExecutorId, operation, executorId) {
  const entry = readOnlyRedirectEntryFor(cfg, sourceExecutorId, operation, executorId);
  return entry?.invocation;
}

/**
 * Deterministic index into a size-`size` pool from `seed`. Canonical
 * implementation shared with assignment-runner.mjs (which imports this
 * function directly, deduplicating the selection logic per R7 / Disposition 1).
 */
export function stablePoolIndex(seed, size) {
  if (!Number.isInteger(size) || size <= 0) return 0;
  const hash = crypto.createHash('sha256').update(String(seed)).digest();
  return hash.readUInt32BE(0) % size;
}

/**
 * PlacementPolicy's own read-only redirect selection: filter the declared
 * candidate pool to admissible entries (not the source executor itself,
 * and actually registered), then pick deterministically by `seed`. Returns
 * `sourceExecutorId` unchanged when nothing is admissible -- same
 * "no candidate, no redirect" fallback the legacy function already uses.
 */
export function selectPlacementPolicyRedirectExecutor({ cfg, sourceExecutorId, candidatePool, seed }) {
  const executors = cfg?.executors && typeof cfg.executors === 'object' ? cfg.executors : {};
  const admissible = (Array.isArray(candidatePool) ? candidatePool : [])
    .filter((candidate) => candidate !== sourceExecutorId && executors[candidate]);
  if (admissible.length === 0) return sourceExecutorId;
  return admissible[stablePoolIndex(seed, admissible.length)];
}

