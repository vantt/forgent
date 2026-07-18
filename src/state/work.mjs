// work.mjs — schema and validation for `work` (the single flat work-item
// entity, per D4). Thin lib: no CLI, no FSM transitions (those land in
// phase-1-state-layer-3), no view/state.json writes.
//
// Minimal field set that still answers the six R6 questions:
//   read_first -> refs   | kind of work -> kind        | contract touched -> refs
//   risk       -> risk   | proof of done -> verify      | learning left    -> learn (optional)
// plus id/title/status/deps to identify, name, place-in-FSM, and link work.

import { DOMAINS, DEFAULT_DOMAIN } from './domains.mjs';

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class WorkValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkValidationError';
    this.category = 'validation';
  }
}

// Stable, file/CLI-safe id: lowercase kebab-case, starting with a letter.
const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * The full status domain for `work` (per D4's single flat FSM, extended by
 * D5 with `proposed`: a goal-check pass sitting on a branch, awaiting
 * approval/merge before it becomes `done`; extended by async-human-gate D1/D3
 * with `awaiting-human`: a single generic human-gate state, separate from
 * `blocked`, that a work item parks in while waiting for a person to answer
 * a question — see fsm.mjs for its transition edges). Owned here (schema
 * owns domain) — fsm.mjs imports and re-exports this rather than defining
 * its own copy, so there is exactly one list of legal statuses.
 */
export const STATUSES = Object.freeze(['todo', 'doing', 'blocked', 'proposed', 'done', 'awaiting-human']);

/**
 * Tier domain for `work.tier` (per D6) — the cost/cognitive weight a work
 * item self-declares; the runner (Epic 3) maps tier -> model via a config
 * table at dispatch time. PROVISIONAL: this is the minimal placeholder set
 * for Phase 2's substrate slice. It must reconcile with the tier->model
 * config table introduced alongside the runner — that config becomes the
 * single source of truth for what a tier *means*; this list only bounds what
 * a work item is allowed to *say*. Do not let the two drift apart.
 */
export const TIERS = Object.freeze(['light', 'standard', 'heavy']);

/**
 * Stage domain for `work.stage` (per stage-clarify D1/D2/D8, extended by
 * stage-decompose D2) — the macro-level lifecycle stage of a work item
 * (clarify -> decompose -> executing), orthogonal to the FSM's micro-level
 * `status` (fsm.mjs's TRANSITIONS is unchanged by this field). `stage` is
 * OPTIONAL and NOT in DEFAULTS (D8): a missing `stage` reads as `executing`
 * lazily wherever it is consumed (frontier.mjs, store.mjs), never injected
 * onto the record itself — this keeps every existing add/submit/legacy path
 * byte-for-byte unchanged.
 *
 * Sourced from the 'coding' domain's registry entry (base-workflow-model
 * D2/D3, src/state/domains.mjs) rather than declared inline — this keeps
 * exactly one definition of coding's stage list, but the exported value
 * (and every existing consumer of it) is unchanged.
 */
export const STAGES = DOMAINS[DEFAULT_DOMAIN].stages;

/**
 * Domain field domain for `work.domain` (per base-workflow-model D1-D3) —
 * which domain's stage semantics (list + step-mapping + transition edges,
 * `src/state/domains.mjs`) govern this item's `stage` value. OPTIONAL and
 * NOT in DEFAULTS — same D8 lazy-default shape as `stage` itself: a missing
 * `domain` reads as `'coding'` lazily wherever it is consumed (frontier.mjs,
 * loop.mjs, stage.mjs, and this module's own `validateWork`), never injected
 * onto the record — every existing (100% coding) item needs zero migration.
 */

/**
 * Current schema/event version (per D7c): every event appended from Phase 2
 * onward carries this as `v` (see src/state/events.mjs). Events committed
 * before Phase 2 carry no `v` at all — absence of the field, not a lower
 * number, is how a pre-Phase-2 event is recognized; backward-compatible
 * replay for those events is cell phase-2-routing-2's concern, not this
 * module's.
 */
export const SCHEMA_VERSION = 2;

/**
 * Declared defaults for optional fields (per D7b). This module only
 * declares the values — applying them (to a newly-added item, or while
 * folding a legacy event missing the field) is the caller's job, never
 * this module's.
 */
export const DEFAULTS = Object.freeze({ tier: 'standard' });

function requireNonEmptyString(work, field) {
  if (typeof work[field] !== 'string' || !work[field].trim()) {
    throw new WorkValidationError(`work.${field} is required and must be a non-empty string.`);
  }
}

function requireArray(work, field) {
  if (!Array.isArray(work[field])) {
    throw new WorkValidationError(`work.${field} must be an array.`);
  }
}

/**
 * Validate the shape of a single work item: required fields, id format, and
 * that deps is an array of non-empty strings with no self-reference. Does
 * NOT check that deps point at ids that actually exist — that is
 * `validateDeps`, which needs the rest of the store to answer.
 */
export function validateWorkShape(work) {
  if (!work || typeof work !== 'object' || Array.isArray(work)) {
    throw new WorkValidationError('work item must be an object.');
  }

  if (typeof work.id !== 'string' || !ID_PATTERN.test(work.id)) {
    throw new WorkValidationError(
      `work.id must be a stable kebab-case identifier (e.g. "add-login-form"), got: ${JSON.stringify(work.id)}`,
    );
  }
  requireNonEmptyString(work, 'title');
  requireNonEmptyString(work, 'kind');
  requireNonEmptyString(work, 'status');
  if (!STATUSES.includes(work.status)) {
    throw new WorkValidationError(
      `work.status must be one of ${JSON.stringify(STATUSES)}, got: ${JSON.stringify(work.status)}`,
    );
  }
  requireArray(work, 'deps');
  for (const dep of work.deps) {
    if (typeof dep !== 'string' || !dep) {
      throw new WorkValidationError(`work.deps entries must be non-empty strings, got: ${JSON.stringify(dep)}`);
    }
  }
  requireNonEmptyString(work, 'risk');
  requireArray(work, 'refs');
  requireNonEmptyString(work, 'verify');
  if (work.learn !== undefined && work.learn !== null && typeof work.learn !== 'string') {
    throw new WorkValidationError('work.learn must be a string when present (it is optional).');
  }
  if (work.tier !== undefined && !TIERS.includes(work.tier)) {
    throw new WorkValidationError(
      `work.tier must be one of ${JSON.stringify(TIERS)} when present, got: ${JSON.stringify(work.tier)}`,
    );
  }
  if (work.domain !== undefined && !Object.hasOwn(DOMAINS, work.domain)) {
    throw new WorkValidationError(
      `work.domain must be one of ${JSON.stringify(Object.keys(DOMAINS))} when present, got: ${JSON.stringify(work.domain)}`,
    );
  }
  if (work.stage !== undefined) {
    // Domain-aware per base-workflow-model D2/D3: look up the item's own
    // domain's stage list instead of the flat STAGES constant, so a future
    // Slice-2 domain's own stage names validate too. work.domain was already
    // confirmed to be a real DOMAINS key (or absent) just above, so this
    // lookup can never miss.
    const domain = DOMAINS[work.domain ?? DEFAULT_DOMAIN];
    if (!domain.stages.includes(work.stage)) {
      throw new WorkValidationError(
        `work.stage must be one of ${JSON.stringify(domain.stages)} when present, got: ${JSON.stringify(work.stage)}`,
      );
    }
  }
  // Lineage (per stage-decompose D5, inherited verbatim from stage-clarify
  // D11): a child work item carries `parent` — the id of the item it was
  // decomposed from. `parent` stays its own stored field, NOT a `deps` entry;
  // frontier.mjs derives the parent-blocking rule from it alone. But `deps`
  // and `parent` are no longer separate for the acyclic guarantee: since S2a
  // (record 0012, superseding the "deliberately separate relations" design of
  // record 0002) both are projected into ONE derived typed-edge graph — `deps`
  // as `blocks` edges, `parent` as `parent-child` edges (direction
  // parent -> child: a parent waits for its descendants) — and the single
  // write door (store.mjs) rejects any add/edit that would close a cycle in
  // that unified graph, so `parent` now participates in acyclicity alongside
  // `deps`. This is a read-projection only: zero stored `edges[]` field, no
  // schema change, SCHEMA_VERSION unchanged. OPTIONAL and NOT in DEFAULTS,
  // same additive shape as `stage` — absent on every item that predates this
  // field or was never decomposed.
  if (work.parent !== undefined && work.parent !== null) {
    if (typeof work.parent !== 'string' || !work.parent.trim()) {
      throw new WorkValidationError(
        `work.parent must be a non-empty string when present, got: ${JSON.stringify(work.parent)}`,
      );
    }
    if (work.parent === work.id) {
      throw new WorkValidationError(`work "${work.id}" cannot list itself as its own parent.`);
    }
  }

  // Discovery provenance (per work-graph-intelligence S2b, decision
  // b5c0ba0c/0012): an item a worker reported finding mid-task carries
  // `discoveredFrom` — the id of the item that was being worked when it was
  // discovered. Mirrors `parent` immediately above: its own stored field,
  // OPTIONAL and NOT in DEFAULTS (same lazy-additive shape as parent/stage/
  // domain), rides SCHEMA_VERSION 2 unchanged (no bump — precedent: every
  // prior additive field stayed on v2). Existence of the referenced id is
  // deliberately NOT enforced here, exactly like parent — a dangling
  // provenance id degrades gracefully rather than blocking the add. It is
  // non-blocking by design: dep-graph.mjs's buildUnifiedEdges reads only
  // `deps`/`parent`, so `discoveredFrom` never enters the cycle-check.
  if (work.discoveredFrom !== undefined && work.discoveredFrom !== null) {
    if (typeof work.discoveredFrom !== 'string' || !work.discoveredFrom.trim()) {
      throw new WorkValidationError(
        `work.discoveredFrom must be a non-empty string when present, got: ${JSON.stringify(work.discoveredFrom)}`,
      );
    }
    if (work.discoveredFrom === work.id) {
      throw new WorkValidationError(`work "${work.id}" cannot list itself as its own discoveredFrom.`);
    }
  }

  // File footprint (work-graph-intelligence S9): OPTIONAL additive list of the
  // file paths/globs this item is expected to touch — the concrete content for
  // C3's named-but-empty forbidden_paths/required_outputs. When present it must
  // be an array of non-empty strings (same entry rule as `refs`); absent (or
  // null) on every item that predates the field or never declared one. Rides
  // SCHEMA_VERSION 2 (folds via the work.add spread) and is NON-BLOCKING: it
  // feeds only the footprint-intersection advisory, never the cycle-check or
  // the frontier.
  if (work.footprint !== undefined && work.footprint !== null) {
    if (!Array.isArray(work.footprint)) {
      throw new WorkValidationError(
        `work.footprint must be an array of non-empty strings when present, got: ${JSON.stringify(work.footprint)}`,
      );
    }
    for (const path of work.footprint) {
      if (typeof path !== 'string' || !path.trim()) {
        throw new WorkValidationError(`work.footprint entries must be non-empty strings, got: ${JSON.stringify(path)}`);
      }
    }
  }

  // Full-text intake description (per discovery-context P30): OPTIONAL
  // additive field carrying the submitter's original free text, so the
  // discovery engine's prompt does not lose it to title truncation/
  // classification. `submit` sets it; `add` never does — this validator
  // only enforces shape when the field is actually present, same
  // optional-additive rule as `parent` above (null treated as absent).
  if (work.description !== undefined && work.description !== null) {
    if (typeof work.description !== 'string' || !work.description.trim()) {
      throw new WorkValidationError('work.description must be a non-empty string when present.');
    }
  }

  if (work.deps.includes(work.id)) {
    throw new WorkValidationError(`work "${work.id}" cannot list itself as a dep.`);
  }

  return true;
}

/**
 * Validate that every dep of `work` points at an id present in `existingIds`
 * (an Set, or an iterable of ids, already known to the store). Self-reference
 * is already rejected by `validateWorkShape` and is not re-checked here.
 */
export function validateDeps(work, existingIds) {
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  for (const dep of work.deps) {
    if (!known.has(dep)) {
      throw new WorkValidationError(`work "${work.id}" depends on unknown id "${dep}".`);
    }
  }
  return true;
}

/**
 * Full validation entry point: shape first, then dep-existence when
 * `existingIds` is supplied (omit it to validate shape only, e.g. before the
 * store is known).
 */
export function validateWork(work, existingIds) {
  validateWorkShape(work);
  if (existingIds !== undefined) {
    validateDeps(work, existingIds);
  }
  return true;
}
