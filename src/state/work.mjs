// work.mjs — schema and validation for `work` (the single flat work-item
// entity, per D4). Thin lib: no CLI, no FSM transitions (those land in
// phase-1-state-layer-3), no view/state.json writes.
//
// Minimal field set that still answers the six R6 questions:
//   read_first -> refs   | kind of work -> kind        | contract touched -> refs
//   risk       -> risk   | proof of done -> verify      | learning left    -> learn (optional)
// plus id/title/status/deps to identify, name, place-in-FSM, and link work.

import fs from 'node:fs';
import path from 'node:path';
import { DOMAINS, DEFAULT_DOMAIN, getDomain, classificationVocabulary, roleGraphFor } from './workflow-stage-graphs.mjs';

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

// Per long-work-item-ids D2: `fgos add` took a caller-typed id straight
// through with no length bound, so callers slugified the whole title into
// the id (e.g. "choke-point-createworktree-callsite-wrapper", 43 chars).
// 30 sits in the gap between the longest observed legitimate id (26 chars)
// and the shortest observed offending one (41 chars) — see plan.md for the
// full data. Only checked at write time (addWork/patch); replay never
// calls validateWorkShape, so existing longer ids keep replaying untouched.
const MAX_ID_LENGTH = 30;

// Per work-item-title-contract D2/D5: a title is bounded at write time, and
// the bound TRUNCATES rather than rejects — an over-length title arriving from
// a script or an agent must not break the call that carried it. 100 sits above
// every title a human writes by hand and below the run-on blobs a whole
// submitted paragraph produced (32 of 54 stored titles were past it when this
// was measured); see CONTEXT.md for the distribution.
//
// The bound is applied at the store's own normalize points (addWork/editWork
// in store.mjs), which every write door passes through, and reused by
// deriveTitle so a submitted title is already within bounds by the time
// generateId hashes it. Deliberately NOT enforced in validateWorkShape: that
// function only ever throws or returns, so a bound placed there could only
// reject — the one behavior this contract rules out.
export const MAX_TITLE_LENGTH = 100;

/**
 * Bound a title to MAX_TITLE_LENGTH, cutting at a word edge when one exists
 * within the bound and falling back to a hard cut when a single token runs
 * past it. Anything already short enough — and any non-string, which
 * validateWorkShape is still the one to reject — is returned untouched, so
 * this is safe to apply ahead of validation on every path.
 *
 * When truncation actually fires, a trailing '…' marks the cut so a title
 * never reads as if it finished naturally — reserved out of the bound
 * itself (not appended on top of it), so the result stays <= MAX_TITLE_LENGTH.
 */
export function truncateTitle(title) {
  if (typeof title !== 'string' || title.length <= MAX_TITLE_LENGTH) return title;
  const budget = MAX_TITLE_LENGTH - 1;
  const cut = title.slice(0, budget);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * The full status domain for `work` (per D4's single flat FSM, extended by
 * D5 with `proposed`/`awaiting-approval`: a goal-check pass sitting on a
 * branch, awaiting approval/merge; extended by async-human-gate D1/D3 with
 * `awaiting-human`: a single generic human-gate state, separate from
 * `blocked`, that a work item parks in while waiting for a person to answer
 * a question; extended by fsm-wontfix-terminal-status D1/D2 with `wontfix`:
 * a second terminal state alongside `done`, for an item deliberately closed
 * without being built (superseded, duplicate, admin decision) rather than
 * completed. Extended by work-item-status-delivered-retrospective-cleanup
 * D1/D2 with `delivered`/`retrospective`/`cleanup`, inserted between
 * `awaiting-approval` and `done`: `delivered` means "code accepted into the
 * main tree" (the sole trigger for RUL12 dependent-open); `retrospective`
 * is the batched learning-synthesis step (formerly the `compound-learn`
 * stage, now retired); `cleanup` is a TTL-bounded worktree-reclaim park —
 * see status-fsm.mjs for the full transition edges). Extended by
 * work-item-backlog-status D1/D3 with `backlog`, placed FIRST, ahead of
 * `todo`: an idea not yet committed to work, as opposed to `todo`'s
 * "committed, ready to start". Like the four tail-segment statuses, it is a
 * universal, domain-agnostic status no domain may relabel (0027's own
 * framing, applied at the front of the lifecycle instead of the tail); it
 * carries its own `statusCategory` (`'backlog'`, already reserved in
 * STATUS_CATEGORIES below), which is what keeps it out of frontier's `ready`
 * filter without any frontier-side code. Owned here (schema owns
 * domain) — status-fsm.mjs imports and re-exports this rather than defining its
 * own copy, so there is exactly one list of legal statuses.
 */
export const STATUSES = Object.freeze([
  'backlog',
  'todo',
  'doing',
  'blocked',
  'awaiting-approval',
  'delivered',
  'retrospective',
  'cleanup',
  'done',
  'awaiting-human',
  'wontfix',
]);

/**
 * The fixed `statusCategory` domain (per decision record 0027, D2/D3 —
 * `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-
 * base-workflow-model-d1-d3.md`; pinned terms in `docs/history/phase-2-
 * status-category-schema/CONTEXT.md`) — a lossy compression of the six
 * front-segment statuses (`todo`/`doing`/`blocked`/`awaiting-human`/
 * `awaiting-approval`/`wontfix`; see `DOMAINS[domain].statusLabels`,
 * `workflow-stage-graphs.mjs`) that lets every domain-agnostic mechanism of
 * fgOS (frontier's `ready` filter, rollup, outcome/friction,
 * discovery-judge — none of them migrated yet, that is tsk-38t-4's own
 * scope) read "which bucket is this item in" without learning a domain's
 * own status vocabulary. Frozen onto the event payload at write time
 * (`store.mjs`'s `addWork`/`moveWork`), NEVER derived on read: `docs/
 * platform-foundations.md`'s L3 replay-from-zero law requires that
 * replaying the same log twice always yields the same view, and a value
 * computed at read time from `DOMAINS[domain].statusLabels` (itself
 * ordinary, editable code) could replay differently after that table
 * changes — an outcome L3 forbids.
 *
 * The full six-value set was declared upfront, Linear-style, back when
 * `backlog` and `completed` had no status mapped into either of them —
 * `backlog` now does (work-item-backlog-status D3 mapped the `backlog`
 * status into it); `completed` still has none. 0027's own reasoning is
 * exactly why that slot was already here to use: match Linear's pattern of a closed
 * category set defined up front, not "add a category only once a status
 * needs it" (which would make the set an implementation detail of whichever
 * domain happens to exist today, rather than a stable contract other
 * domains and domain-agnostic readers can rely on). The four tail-segment
 * statuses (`delivered`/`retrospective`/`cleanup`/`done`) never map into
 * any of these six — D1 holds literal status is sufficient for them
 * forever — so a move into one of those four carries no `statusCategory`
 * at all, rather than being forced into `completed` or any other value.
 */
export const STATUS_CATEGORIES = Object.freeze([
  'backlog',
  'todo',
  'in-progress',
  'review',
  'completed',
  'canceled',
]);

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
 * Urgency domain for `work.urgent` (per work-item-priority-matrix D2) —
 * human-entered, optional. Absent reads as `medium` at the consuming
 * formula, never stored as a default here (same absent-stays-absent shape
 * as tier/domain above).
 */
export const URGENCY_LEVELS = Object.freeze(['low', 'medium', 'high', 'critical']);

/**
 * Goal-tier domain for `work.goalTier` (per str67-goal-directed-planning D1)
 * — marks a work item as a declared goal. A goal is not a new entity: it is
 * an ordinary work item carrying this optional field, always set at `add`
 * time (never retrofitted onto an existing item — see store.mjs's
 * EDITABLE_FIELDS, which excludes it).
 */
export const GOAL_TIERS = Object.freeze(['mvp', 'milestone']);

/**
 * Stage domain for `work.stage` (per stage-clarify D1/D2/D8, extended by
 * stage-decompose D2) — the macro-level lifecycle stage of a work item
 * (clarify -> decompose -> executing), orthogonal to the FSM's micro-level
 * `status` (status-fsm.mjs's TRANSITIONS is unchanged by this field). `stage` is
 * OPTIONAL and NOT in DEFAULTS (D8): a missing `stage` reads as `executing`
 * lazily wherever it is consumed (frontier.mjs, store.mjs), never injected
 * onto the record itself — this keeps every existing add/submit/legacy path
 * byte-for-byte unchanged.
 *
 * Sourced from the 'coding' domain's registry entry (base-workflow-model
 * D2/D3, src/state/workflow-stage-graphs.mjs) rather than declared inline — this keeps
 * exactly one definition of coding's stage list, but the exported value
 * (and every existing consumer of it) is unchanged.
 */
export const STAGES = DOMAINS[DEFAULT_DOMAIN].stages;

/**
 * Domain field domain for `work.domain` (per base-workflow-model D1-D3) —
 * which domain's stage semantics (list + step-mapping + transition edges,
 * `src/state/workflow-stage-graphs.mjs`) govern this item's `stage` value. OPTIONAL and
 * NOT in DEFAULTS — same D8 lazy-default shape as `stage` itself: a missing
 * `domain` reads as `'coding'` lazily wherever it is consumed (frontier.mjs,
 * loop.mjs, stage-fsm.mjs, and this module's own `validateWork`), never injected
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
export const SCHEMA_VERSION = 3;

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
 * Hold `work[field]` (`kind` or `risk`) to the vocabulary this item's own
 * domain declares — the per-domain half of what `TIERS` already does globally
 * for `tier`. A domain that declares no vocabulary for the field imposes
 * nothing, so this is a no-op for every domain but `coding` today and the
 * pre-existing non-empty-string rule remains the only constraint.
 *
 * Domain resolution swallows the unrecognized-name warning on purpose: an
 * invalid `work.domain` is `touched('domain')`'s own error to raise a few
 * lines below, with a message naming the real problem. Warning here first
 * would just add noise ahead of it.
 */
function requireDeclaredClassification(work, field) {
  const domain = getDomain(work.domain, { onUnrecognized: () => {} });
  const allowed = classificationVocabulary(domain, field);
  if (!allowed) return;
  if (!allowed.includes(work[field])) {
    throw new WorkValidationError(
      `work.${field} must be one of ${JSON.stringify(allowed)} for domain `
        + `"${work.domain ?? DEFAULT_DOMAIN}", got: ${JSON.stringify(work[field])}`,
    );
  }
}

/**
 * Validate the shape of a single work item: required fields, id format, and
 * that deps is an array of non-empty strings with no self-reference. Does
 * NOT check that deps point at ids that actually exist — that is
 * `validateDeps`, which needs the rest of the store to answer.
 *
 * `touchedFields` (optional, tsk-1ne D1/D2): a Set of top-level field names
 * to check — every other field is grandfathered, its already-stored value
 * left unvalidated regardless of whether it would pass today's rules.
 * Omitted (the default, `addWork`'s own call) means "check everything,"
 * byte-for-byte the original behavior. `editWork` (store.mjs) is the one
 * caller that ever passes a real Set: an edit patch can only ever contain
 * `EDITABLE_FIELDS` keys (id/status/stage/domain are never among them, so
 * their checks below can never fire for an edit either way), and
 * re-rejecting an UNCHANGED field's pre-existing value on every edit — the
 * bug this parameter fixes — blocked 65/112 items from being edited at all
 * for legacy shape that predates a since-tightened rule (stage enum,
 * id-length cap). This never widens what a NEW value in the patch must
 * satisfy — every check below still runs in full for any field actually
 * present in `touchedFields`.
 */
export function validateWorkShape(work, touchedFields) {
  if (!work || typeof work !== 'object' || Array.isArray(work)) {
    throw new WorkValidationError('work item must be an object.');
  }
  const touched = (field) => !touchedFields || touchedFields.has(field);

  if (touched('id')) {
    if (typeof work.id !== 'string' || !ID_PATTERN.test(work.id)) {
      throw new WorkValidationError(
        `work.id must be a stable kebab-case identifier (e.g. "add-login-form"), got: ${JSON.stringify(work.id)}`,
      );
    }
    if (work.id.length > MAX_ID_LENGTH) {
      throw new WorkValidationError(
        `work.id must be at most ${MAX_ID_LENGTH} characters (got ${work.id.length}): ${JSON.stringify(work.id)} — pick a short descriptive id, not a slugified title.`,
      );
    }
  }
  if (touched('title')) requireNonEmptyString(work, 'title');
  if (touched('kind')) {
    requireNonEmptyString(work, 'kind');
    requireDeclaredClassification(work, 'kind');
  }
  if (touched('status')) {
    requireNonEmptyString(work, 'status');
    if (!STATUSES.includes(work.status)) {
      throw new WorkValidationError(
        `work.status must be one of ${JSON.stringify(STATUSES)}, got: ${JSON.stringify(work.status)}`,
      );
    }
  }
  if (touched('deps')) {
    requireArray(work, 'deps');
    for (const dep of work.deps) {
      if (typeof dep !== 'string' || !dep) {
        throw new WorkValidationError(`work.deps entries must be non-empty strings, got: ${JSON.stringify(dep)}`);
      }
    }
  }
  // mergeAfter (D4/D5, docs/history/tsk-3bn-merge-conductor-harness-v2/):
  // OPTIONAL and NOT in DEFAULTS (same lazy-additive shape as parent/stage
  // above) — a weak, merge-order-only edge read ONLY by mergeReadiness's
  // waiting gate, never by frontier.mjs. Shape mirrors `deps` (array of
  // non-empty strings); self-reference check mirrors `parent`'s. Existence
  // of referenced ids IS enforced (validateMergeAfter below, mirroring
  // validateDeps) — unlike `parent`/`discoveredFrom`, which deliberately
  // leave dangling ids unchecked.
  if (touched('mergeAfter') && work.mergeAfter !== undefined && work.mergeAfter !== null) {
    if (!Array.isArray(work.mergeAfter)) {
      throw new WorkValidationError(`work.mergeAfter must be an array of non-empty strings when present, got: ${JSON.stringify(work.mergeAfter)}`);
    }
    for (const target of work.mergeAfter) {
      if (typeof target !== 'string' || !target) {
        throw new WorkValidationError(`work.mergeAfter entries must be non-empty strings, got: ${JSON.stringify(target)}`);
      }
      if (target === work.id) {
        throw new WorkValidationError(`work "${work.id}" cannot list itself in its own mergeAfter.`);
      }
    }
  }
  // supersededBy / duplicates (tsk-2ie, docs/history/
  // tsk-2ie-duplicate-superseded-guard/): two non-blocking, knowledge-only
  // relations mirroring bd's own `supersedes`/`duplicates` dependency-type
  // split (D1). `supersededBy` is directed and singular — the id of the ONE
  // item that replaces this one — shape mirrors `parent` (self-reference
  // check) but, like `mergeAfter`, has its target's EXISTENCE enforced
  // (validateSupersededBy below) rather than left dangling like `parent`.
  // `duplicates` is undirected and array-shaped, mirroring `mergeAfter`'s
  // shape exactly (including existence enforcement, validateDuplicates
  // below) — informational only (D4): read by nothing in mergeReadiness
  // except via `supersededBy`. Neither participates in the unified
  // blocking-cycle graph (dep-graph.mjs) or frontier.mjs start-eligibility
  // — both OPTIONAL and NOT in DEFAULTS, same lazy-additive shape as
  // mergeAfter/parent above.
  if (touched('supersededBy') && work.supersededBy !== undefined && work.supersededBy !== null) {
    if (typeof work.supersededBy !== 'string' || !work.supersededBy) {
      throw new WorkValidationError(`work.supersededBy must be a non-empty string when present, got: ${JSON.stringify(work.supersededBy)}`);
    }
    if (work.supersededBy === work.id) {
      throw new WorkValidationError(`work "${work.id}" cannot list itself as its own supersededBy.`);
    }
  }
  if (touched('duplicates') && work.duplicates !== undefined && work.duplicates !== null) {
    if (!Array.isArray(work.duplicates)) {
      throw new WorkValidationError(`work.duplicates must be an array of non-empty strings when present, got: ${JSON.stringify(work.duplicates)}`);
    }
    for (const dupId of work.duplicates) {
      if (typeof dupId !== 'string' || !dupId) {
        throw new WorkValidationError(`work.duplicates entries must be non-empty strings, got: ${JSON.stringify(dupId)}`);
      }
      if (dupId === work.id) {
        throw new WorkValidationError(`work "${work.id}" cannot list itself in its own duplicates.`);
      }
    }
  }
  if (touched('risk')) {
    requireNonEmptyString(work, 'risk');
    requireDeclaredClassification(work, 'risk');
  }
  if (touched('refs')) requireArray(work, 'refs');
  if (touched('verify')) requireNonEmptyString(work, 'verify');
  if (touched('learn') && work.learn !== undefined && work.learn !== null && typeof work.learn !== 'string') {
    throw new WorkValidationError('work.learn must be a string when present (it is optional).');
  }
  if (touched('tier') && work.tier !== undefined && !TIERS.includes(work.tier)) {
    throw new WorkValidationError(
      `work.tier must be one of ${JSON.stringify(TIERS)} when present, got: ${JSON.stringify(work.tier)}`,
    );
  }
  if (touched('domain') && work.domain !== undefined && !Object.hasOwn(DOMAINS, work.domain)) {
    throw new WorkValidationError(
      `work.domain must be one of ${JSON.stringify(Object.keys(DOMAINS))} when present, got: ${JSON.stringify(work.domain)}`,
    );
  }
  // Priority (per str7-str8-priority-intent D1): OPTIONAL additive integer —
  // ascending sort, human/agent-set via `fgos edit --priority`. Validated
  // only when present (same optional-additive shape as tier/domain above);
  // must be a non-negative integer — negative priorities are rejected here
  // so the frontier comparator never has to special-case a sign. NOT in
  // DEFAULTS (D1): absent stays absent, sorts after every item that has an
  // explicit priority.
  if (touched('priority') && work.priority !== undefined && !(Number.isInteger(work.priority) && work.priority >= 0)) {
    throw new WorkValidationError(
      `work.priority must be a non-negative integer when present, got: ${JSON.stringify(work.priority)}`,
    );
  }
  // Intent (per str7-str8-priority-intent D4/D6): OPTIONAL additive integer
  // score, computed by the clarify-stage LLM judge. Descending sort,
  // absent-last (D6) — no sign/bound constraint is locked (the concrete
  // scale is Slice 2's discretion), so only integer-ness is checked here.
  // NOT in DEFAULTS: absent stays absent.
  if (touched('intent') && work.intent !== undefined && !Number.isInteger(work.intent)) {
    throw new WorkValidationError(
      `work.intent must be an integer when present, got: ${JSON.stringify(work.intent)}`,
    );
  }
  // Urgent (per work-item-priority-matrix D2): OPTIONAL additive string,
  // human-entered via `fgos add/edit --urgent`. Same optional-additive
  // shape as tier/domain above; absent stays absent (the "medium" default
  // is applied by the priority formula that reads it, never stored here).
  if (touched('urgent') && work.urgent !== undefined && !URGENCY_LEVELS.includes(work.urgent)) {
    throw new WorkValidationError(
      `work.urgent must be one of ${JSON.stringify(URGENCY_LEVELS)} when present, got: ${JSON.stringify(work.urgent)}`,
    );
  }
  // Impact (per work-item-priority-matrix D3): OPTIONAL additive number,
  // computed (blocking fan-out + semantic scan, refined with a de-risk
  // bonus at decompose per D8) — never human-entered directly. Same
  // non-negative-number shape priority/intent already use; absent stays
  // absent.
  if (touched('impact') && work.impact !== undefined && !(typeof work.impact === 'number' && Number.isFinite(work.impact) && work.impact >= 0)) {
    throw new WorkValidationError(
      `work.impact must be a non-negative number when present, got: ${JSON.stringify(work.impact)}`,
    );
  }
  // Effort (per work-item-priority-matrix D5): OPTIONAL additive number,
  // computed at decompose from fgos-coding-planning's own mode/flag-count — never
  // human-entered directly. Same non-negative-number shape as impact;
  // absent stays absent.
  if (touched('effort') && work.effort !== undefined && !(typeof work.effort === 'number' && Number.isFinite(work.effort) && work.effort >= 0)) {
    throw new WorkValidationError(
      `work.effort must be a non-negative number when present, got: ${JSON.stringify(work.effort)}`,
    );
  }
  if (touched('stage') && work.stage !== undefined) {
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
  // holder (tsk-2t9c D1): THIRD orthogonal axis (status x stage x
  // role/holder), opt-in per-domain -- never in EDITABLE_FIELDS
  // (store.mjs), moves only through the handoff verb, same exclusion
  // stage/status/domain already get. A domain with no roleGraph must
  // carry no holder at all (the compatibility path for every existing
  // item and every non-role-aware domain); a domain WITH a roleGraph
  // constrains holder to its declared roles list.
  if (touched('holder') && work.holder !== undefined) {
    const domain = DOMAINS[work.domain ?? DEFAULT_DOMAIN];
    const roleGraph = roleGraphFor(domain);
    if (!roleGraph) {
      throw new WorkValidationError(
        `work.holder is set but domain "${work.domain ?? DEFAULT_DOMAIN}" declares no roleGraph.`,
      );
    }
    if (!roleGraph.roles.includes(work.holder)) {
      throw new WorkValidationError(
        `work.holder must be one of ${JSON.stringify(roleGraph.roles)} for domain "${work.domain ?? DEFAULT_DOMAIN}", got: ${JSON.stringify(work.holder)}`,
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
  if (touched('parent') && work.parent !== undefined && work.parent !== null) {
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
  if (touched('discoveredFrom') && work.discoveredFrom !== undefined && work.discoveredFrom !== null) {
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
  if (touched('footprint') && work.footprint !== undefined && work.footprint !== null) {
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

  // Condition-of-Satisfaction clauses (per str73-done-flip-cos-check D1-D4):
  // OPTIONAL additive array of `{text, evidence}` clauses standing alongside
  // the single `verify` command — mirrors bee's own per-clause CoS check.
  // Same optional-additive validation as `footprint` immediately above:
  // shape-checked only when present, null treated as absent. Never defaults
  // to an empty array — absence stays absence (per D4), matching
  // `docsRef`/`footprint`'s own convention. This cell only adds the shape
  // check; the done-gate enforcement of these clauses is a separate cell.
  if (touched('acceptance') && work.acceptance !== undefined && work.acceptance !== null) {
    if (!Array.isArray(work.acceptance)) {
      throw new WorkValidationError(
        `work.acceptance must be an array of {text, evidence} clauses when present, got: ${JSON.stringify(work.acceptance)}`,
      );
    }
    for (const clause of work.acceptance) {
      if (!clause || typeof clause !== 'object' || Array.isArray(clause)) {
        throw new WorkValidationError(`work.acceptance entries must be objects, got: ${JSON.stringify(clause)}`);
      }
      if (typeof clause.text !== 'string' || !clause.text.trim()) {
        throw new WorkValidationError(`work.acceptance entries must have a non-empty "text", got: ${JSON.stringify(clause)}`);
      }
      if (clause.evidence !== undefined && clause.evidence !== null
        && (typeof clause.evidence !== 'string' || !clause.evidence.trim())) {
        throw new WorkValidationError(`work.acceptance entry "evidence" must be a non-empty string when present, got: ${JSON.stringify(clause)}`);
      }
    }
  }

  // Full-text intake description (per discovery-context P30): OPTIONAL
  // additive field carrying the submitter's original free text, so the
  // discovery engine's prompt does not lose it to title truncation/
  // classification. `submit` sets it; `add` never does — this validator
  // only enforces shape when the field is actually present, same
  // optional-additive rule as `parent` above (null treated as absent).
  if (touched('description') && work.description !== undefined && work.description !== null) {
    if (typeof work.description !== 'string' || !work.description.trim()) {
      throw new WorkValidationError('work.description must be a non-empty string when present.');
    }
  }

  // Ceremony decision-doc pointer (per p50-workflow-induct D7): OPTIONAL
  // additive field naming the relative path to the feature's own
  // docs/history/<feature>/ directory, where its CONTEXT.md/plan.md actually
  // live. The item carries only the pointer -- decision content itself stays
  // in that git-versioned markdown file (D7's "docs is content, field is a
  // pointer" shape; C2 is unchanged, no new event kind). Same
  // optional-additive validation as `description` immediately above:
  // shape-checked only when present, null treated as absent. Deliberately NO
  // existence-on-disk check at this write door -- a docsRef pointing at a
  // not-yet-created or since-moved path degrades gracefully, the same norm
  // `parent`/`discoveredFrom` already apply to a dangling id.
  if (touched('docsRef') && work.docsRef !== undefined && work.docsRef !== null) {
    if (typeof work.docsRef !== 'string' || !work.docsRef.trim()) {
      throw new WorkValidationError('work.docsRef must be a non-empty string when present.');
    }
  }

  // Directive prose for a decompose-generated child (tsk-3xd D1/D2,
  // docs/history/tsk-3xd-decompose-child-directive-prose/CONTEXT.md):
  // OPTIONAL additive field carrying the concrete action a worker must take
  // and the locked decision it satisfies. `title` alone is a short label
  // ("đối tượng + hành động + phạm vi"); `action` is the longer-form
  // why/what a blind executor needs, mirroring bee's own cell.action. Same
  // optional-additive validation as `description`/`docsRef` above:
  // shape-checked only when present, null treated as absent. Rides
  // SCHEMA_VERSION 3 unchanged, same precedent every prior additive field
  // (footprint, domain, docsRef) already established.
  if (touched('action') && work.action !== undefined && work.action !== null) {
    if (typeof work.action !== 'string' || !work.action.trim()) {
      throw new WorkValidationError('work.action must be a non-empty string when present.');
    }
  }

  // Goal tier (per str67-goal-directed-planning D1): OPTIONAL additive field
  // marking a work item as a declared goal -- 'mvp' or 'milestone'. Same
  // lazy-additive shape as tier/domain above: absent means "not a goal", no
  // DEFAULTS entry, no item migration. A goal item is always created fresh
  // with goalTier set at add time (see store.mjs's EDITABLE_FIELDS, which
  // excludes it) -- never retrofitted onto an existing item.
  if (touched('goalTier') && work.goalTier !== undefined && !GOAL_TIERS.includes(work.goalTier)) {
    throw new WorkValidationError(
      `work.goalTier must be one of ${JSON.stringify(GOAL_TIERS)} when present, got: ${JSON.stringify(work.goalTier)}`,
    );
  }

  // Goal targets (per str67-goal-directed-planning D2): OPTIONAL additive
  // list of ids -- existing or not-yet-created -- that this goal item
  // considers "part of" it (an MVP's targets are milestone ids; a
  // milestone's targets are ordinary work ids). Mirrors deps' array-of-
  // non-empty-strings shape and parent/discoveredFrom's self-reference
  // guard; unlike deps, target ids are NOT required to already exist (see
  // validateDeps, which never checks targets -- targets may point at
  // not-yet-created ids). null is treated the same as absent, same as
  // parent/discoveredFrom.
  if (touched('targets') && work.targets !== undefined && work.targets !== null) {
    if (!Array.isArray(work.targets)) {
      throw new WorkValidationError(
        `work.targets must be an array of non-empty strings when present, got: ${JSON.stringify(work.targets)}`,
      );
    }
    for (const target of work.targets) {
      if (typeof target !== 'string' || !target) {
        throw new WorkValidationError(`work.targets entries must be non-empty strings, got: ${JSON.stringify(target)}`);
      }
      if (target === work.id) {
        throw new WorkValidationError(`work "${work.id}" cannot list itself in its own targets.`);
      }
    }
  }

  // domainFields (per decision record 0027, D6 — "Ngoài phạm vi supersede
  // D1-D3"; full design in docs/history/phase-2-status-category-schema/
  // DISCUSSION.md §task-domain-fields): OPTIONAL additive nested object
  // carrying per-domain data alongside the domain-agnostic fields above —
  // shape `{ [domainName]: {...} }`. Same optional-additive convention as
  // acceptance/footprint above: shape-checked only when present, null
  // treated as absent (RUL11 zero-migration — absent on every item that
  // predates this field, replays byte-for-byte unchanged). Only the SHAPE
  // is checked here — a plain object whose own values are themselves plain
  // objects (arrays, primitives, and null values for a domain key are all
  // rejected). Whether `work.domainFields[work.domain]` actually matches
  // the fieldSchema that domain declared (if any) is a SEPARATE, narrower
  // concern handled by `validateDomainFields` below — mirroring how this
  // function checks `work.stage` is one of `DOMAINS[domain].stages` above
  // without opening a per-stage schema engine of its own.
  if (touched('domainFields') && work.domainFields !== undefined && work.domainFields !== null) {
    if (typeof work.domainFields !== 'object' || Array.isArray(work.domainFields)) {
      throw new WorkValidationError(
        `work.domainFields must be a plain object ({ [domainName]: {...} }) when present, got: ${JSON.stringify(work.domainFields)}`,
      );
    }
    for (const [domainName, fields] of Object.entries(work.domainFields)) {
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
        throw new WorkValidationError(
          `work.domainFields.${domainName} must be a plain object when present, got: ${JSON.stringify(fields)}`,
        );
      }
    }
  }

  // Self-dep check reads both `deps` and `id`, but `id` never changes via a
  // patch (never in EDITABLE_FIELDS, store.mjs) — gating on `deps` alone is
  // complete: a self-reference can only be newly introduced by a `deps` edit.
  if (touched('deps') && work.deps.includes(work.id)) {
    throw new WorkValidationError(`work "${work.id}" cannot list itself as a dep.`);
  }

  return true;
}

/**
 * Validate `work.domainFields[work.domain]` against the item's OWN domain's
 * declared `fieldSchema` (per decision record 0027, D6) — kept deliberately
 * separate from `validateWorkShape` above, which only confirms
 * `domainFields` as a whole is well-formed, never that any particular
 * namespace matches its owning domain's rules (that split is the task's own
 * point 1 vs point 3). A domain that declares no `fieldSchema` — every real
 * domain today; `coding` has no need for one, this is purely infrastructure
 * for a FUTURE domain — makes this a no-op, safe to call unconditionally.
 *
 * `fieldSchema` is kept deliberately SIMPLE, per D6's own bound (this item
 * is infrastructure, not a schema DSL): a flat map of
 * `{ [key]: 'string' | 'number' | 'boolean' }` primitive-type declarations,
 * checked only for keys that are actually PRESENT in the item's own
 * namespace — a fieldSchema declares what a key must be *if given*, not
 * that it is required (D6 does not ask for required-field enforcement, and
 * inventing one here would be scope creep past what was locked).
 *
 * Only the namespace matching `work`'s OWN `work.domain` (or `DEFAULT_DOMAIN`
 * when `work.domain` is absent, mirroring every other domain-aware lookup in
 * this file) is ever read or validated — any OTHER domain's namespace
 * present in `work.domainFields` is left untouched, never stripped or
 * rejected, per the DISCUSSION.md design ("other domains' namespaces, if
 * present, are left alone").
 */
export function validateDomainFields(work, domain) {
  const fieldSchema = domain?.fieldSchema;
  if (!fieldSchema || typeof fieldSchema !== 'object') return true;
  const ownDomain = work.domain ?? DEFAULT_DOMAIN;
  const ownFields = work.domainFields?.[ownDomain];
  if (ownFields === undefined) return true;
  for (const [key, type] of Object.entries(fieldSchema)) {
    if (!Object.hasOwn(ownFields, key)) continue;
    const value = ownFields[key];
    if (typeof value !== type) {
      throw new WorkValidationError(
        `work.domainFields.${ownDomain}.${key} must be of type "${type}" per its domain's fieldSchema, got: ${JSON.stringify(value)}`,
      );
    }
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
 * Validate that every `mergeAfter` target of `work` points at an id present
 * in `existingIds` — mirrors `validateDeps` exactly, for the same reason
 * (D5, docs/history/tsk-3bn-merge-conductor-harness-v2/CONTEXT.md): a
 * dangling merge-order target is a real, catchable mistake, unlike
 * `parent`/`discoveredFrom`'s deliberately-unchecked dangling case. A
 * no-op when `mergeAfter` is absent.
 */
export function validateMergeAfter(work, existingIds) {
  if (!Array.isArray(work.mergeAfter)) return true;
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  for (const target of work.mergeAfter) {
    if (!known.has(target)) {
      throw new WorkValidationError(`work "${work.id}" has mergeAfter target "${target}", which is not a known id.`);
    }
  }
  return true;
}

/**
 * Validate that `work.supersededBy`, when present, points at an id present
 * in `existingIds` — mirrors `validateMergeAfter` exactly (tsk-2ie D3): a
 * dangling supersession target fails loud here rather than silently no-op'ing
 * later inside `mergeReadiness`. A no-op when `supersededBy` is absent.
 */
export function validateSupersededBy(work, existingIds) {
  if (typeof work.supersededBy !== 'string') return true;
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  if (!known.has(work.supersededBy)) {
    throw new WorkValidationError(`work "${work.id}" has supersededBy target "${work.supersededBy}", which is not a known id.`);
  }
  return true;
}

/**
 * Validate that every `duplicates` entry of `work` points at an id present
 * in `existingIds` — mirrors `validateMergeAfter` exactly, applied to
 * `duplicates` for the same loud-failure reasoning `validateSupersededBy`
 * gives its sibling field (tsk-2ie CONTEXT.md assumptions). A no-op when
 * `duplicates` is absent.
 */
export function validateDuplicates(work, existingIds) {
  if (!Array.isArray(work.duplicates)) return true;
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  for (const dupId of work.duplicates) {
    if (!known.has(dupId)) {
      throw new WorkValidationError(`work "${work.id}" has duplicates target "${dupId}", which is not a known id.`);
    }
  }
  return true;
}

/**
 * Full validation entry point: shape first, then dep-existence when
 * `existingIds` is supplied (omit it to validate shape only, e.g. before the
 * store is known).
 *
 * `touchedFields` (optional, tsk-1ne D1/D2): forwarded to `validateWorkShape`
 * as-is, and used here to gate the four existence-checks the same way —
 * each already reads exactly one field (`deps`/`mergeAfter`/`supersededBy`/
 * `duplicates`), so skipping one when its field is absent from
 * `touchedFields` never widens what a NEW value in that field must satisfy,
 * only stops re-checking a field the caller's patch never touched. Omitted
 * (the default, `addWork`'s own call) means every check still runs, exactly
 * as before this parameter existed.
 */
export function validateWork(work, existingIds, touchedFields) {
  validateWorkShape(work, touchedFields);
  const touched = (field) => !touchedFields || touchedFields.has(field);
  if (existingIds !== undefined) {
    if (touched('deps')) validateDeps(work, existingIds);
    if (touched('mergeAfter')) validateMergeAfter(work, existingIds);
    if (touched('supersededBy')) validateSupersededBy(work, existingIds);
    if (touched('duplicates')) validateDuplicates(work, existingIds);
  }
  return true;
}

// Path-like substring: at least one "/" separator and a file extension,
// e.g. "docs/history/foo/CONTEXT.md" or "src/state/work.mjs". Deliberately
// excludes a bare filename with no directory separator (e.g. "work.mjs"
// alone) -- requiring a directory segment cuts down on false positives
// against ordinary prose ("e.g.", "v1.2", etc.).
const PATH_LIKE_TOKEN = /[\w.-]+(?:\/[\w.-]+)+\.[\w-]+/g;

/**
 * tsk-5q5-2 (D1/D3, docs/history/judge-verdict-evidence-discipline/): a
 * narrow write-time check on `work.acceptance` clauses that supply `text`
 * AND `evidence` TOGETHER in the same write — never a clause with `text`
 * only (RUL58 D4's existing "evidence added later" allowance is untouched,
 * since such a clause never enters the loop below). Confirmed failure this
 * backstops: `tsk-d3c`'s own acceptance array asserted a root cause and an
 * evidence citation for it at the same time, both wrong.
 *
 * "Traceable" here is MECHANICAL, not semantic: at least one path-like
 * substring in `evidence` must resolve to a real file under `repoRoot`. This
 * catches an evidence string that cites nothing checkable at all — it does
 * NOT verify the cited file actually says what the clause claims, which is
 * a judgment call this item's own CONTEXT.md D3 leaves open, not something
 * a pure shape validator can prove.
 *
 * Throws `WorkValidationError` (category='validation', same contract as
 * every other shape rule in this file) naming the offending clause. A
 * clause with `text` only (no `evidence`), a missing `work.acceptance`, or
 * an omitted `repoRoot` all leave this a no-op — opt-in, called only from
 * store.mjs's `addWork`/`editWork`, the only callers with a real repo root
 * to check against.
 */
export function checkAcceptanceEvidenceTraceable(work, repoRoot) {
  if (!Array.isArray(work?.acceptance) || typeof repoRoot !== 'string' || !repoRoot) {
    return true;
  }
  for (const clause of work.acceptance) {
    const hasText = typeof clause?.text === 'string' && clause.text.trim();
    const hasEvidence = typeof clause?.evidence === 'string' && clause.evidence.trim();
    if (!hasText || !hasEvidence) continue;

    const candidates = clause.evidence.match(PATH_LIKE_TOKEN) ?? [];
    const traceable = candidates.some((candidate) => {
      try {
        return fs.existsSync(path.join(repoRoot, candidate));
      } catch {
        return false;
      }
    });
    if (!traceable) {
      throw new WorkValidationError(
        `work.acceptance clause with both "text" and "evidence" must cite a real, existing path in ` +
          `"evidence" — none found/resolved in: ${JSON.stringify(clause.evidence)}`,
      );
    }
  }
  return true;
}
