// store.mjs — the single write door onto `.fgos/` (per D3/D5).
//
// This is the sole module that resolves `.fgos/` paths; byte-level append is
// delegated to events.mjs. Every other module here is a pure lib that takes
// an explicit path (events.mjs) or no path at all (fsm.mjs, replay.mjs,
// work.mjs) — this module is what wires "some directory" to the two files
// that live in it: `events.jsonl` (truth, per D3) and `state.json` (view,
// per D4).
//
// Write order, always: append the event to the log FIRST, then rebuild and
// overwrite the view SECOND. If a crash lands between the two, the log (the
// only truth) already has the event — the view is merely stale, and
// `rebuild()` below is the documented recovery path (per the plan's risk
// map). The view is never written before the event that produced it exists.
//
// This module is also the CLI's single facade for the error-classification
// contract (R4): EXIT_CODES + categoryOf are the one source for
// category -> exit code, and the four error classes raised anywhere in the
// state layer are re-exported from here so bin/fgos.mjs never needs to
// import fsm.mjs/work.mjs/events.mjs directly.
//
// SIBLING FACADE (D3, worker-dispatch-log): `.fgos/logs/` is written by a
// separate narrow facade, worker-log.mjs — NOT this door. This module's
// single-write-door scope stays exactly `events.jsonl` + `state.json` (the
// event-sourced FSM truth and its view); unstructured worker dispatch output
// is a different concern and never flows through moveWork/appendEvent.

import fs from 'node:fs';
import path from 'node:path';
import { appendEvent, readEvents, withEventsLock, appendEventLocked } from './events.mjs';
import { rebuildView, viewRevision } from './replay.mjs';
import { graphMetrics as computeGraphMetrics, whatIf as computeWhatIf, classifyStaleDoing, footprintOverlap } from './graph-metrics.mjs';
import { transitionWork, FsmError } from './fsm.mjs';
import { transitionStage } from './stage.mjs';
import { getDomain, stageForStep } from './domains.mjs';
import { validateWork, WorkValidationError, DEFAULTS } from './work.mjs';
import { EventLogError } from './events.mjs';
import { frontier } from './frontier.mjs';
import { assertNoCycle, assertNoUnifiedCycle } from './dep-graph.mjs';

export { FsmError, WorkValidationError, EventLogError };

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

/**
 * The one category -> exit-code map (R4). Values 2-5 unchanged from the
 * prior duplicate in bin/fgos.mjs. 'lock-timeout' (events.mjs), 'session-fail'
 * (session.mjs) and 'merge-fail' (merge.mjs) are distinct-on-purpose
 * categories that were previously unmapped here, so any error carrying them
 * fell through categoryOf's undefined-exitCode path and was treated as an
 * uncategorized bug: the whole runOnce drain-run aborted (throw, not a
 * graceful per-item halt) instead of returning its structured
 * dispatched/parked result with an accurate exit code (review-unreviewed-260717,
 * corroborated by two independent reviewers). 6 is reserved for loop.mjs's
 * EXIT_BUSY — skip it here.
 */
export const EXIT_CODES = Object.freeze({
  precondition: 2,
  conflict: 3,
  validation: 4,
  'corrupt-log': 5,
  'lock-timeout': 7,
  'session-fail': 8,
  'merge-fail': 9,
});

/**
 * Classify any error raised by this module's domain (StoreError, FsmError,
 * WorkValidationError, EventLogError all set `.category`) by reading the
 * property directly rather than an instanceof-chain — a new error class only
 * needs to set `.category` to participate, nothing here has to change.
 * Anything without a recognized `.category` falls back to 'unexpected'
 * (callers map that to exit 1).
 */
export function categoryOf(err) {
  return err && typeof err.category === 'string' ? err.category : 'unexpected';
}

function paths(dir) {
  return { logPath: path.join(dir, 'events.jsonl'), viewPath: path.join(dir, 'state.json') };
}

function writeView(viewPath, view) {
  fs.mkdirSync(path.dirname(viewPath), { recursive: true });
  // work-graph-intelligence S3: stamp a deterministic revision-hash onto the
  // ON-DISK derived view only. `view` (what refreshView returns to store
  // callers) stays the pure fold shape rebuildView produces — the revision is
  // a sibling field written to state.json, never folded back into the view a
  // rebuild returns. Determinism (same log -> same revision) keeps the
  // rebuild-determinism e2e's before/after deep-equal green.
  const persisted = { ...view, revision: viewRevision(view) };
  fs.writeFileSync(viewPath, `${JSON.stringify(persisted, null, 2)}\n`, 'utf8');
}

// Shared tail of every mutation: rebuild the view fresh from the (now
// updated) log and overwrite state.json. Always called AFTER the event that
// caused the change has already been appended — never before.
function refreshView(dir) {
  const { logPath, viewPath } = paths(dir);
  const view = rebuildView(logPath);
  writeView(viewPath, view);
  return view;
}

/**
 * Create `dir` (e.g. `.fgos/`) if missing, ensure the event log file exists,
 * and (re)write the view from it. Safe to call on an already-initialized
 * dir — idempotent.
 */
export function initStore(dir) {
  const { logPath } = paths(dir);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '', 'utf8');
  }
  return refreshView(dir);
}

/**
 * Add a new work item. Validates shape + deps against the log's own current
 * ids (read fresh, never off the possibly-stale view) BEFORE writing
 * anything — an invalid item never reaches the log.
 *
 * The existence check through the append is one held `events.lock` critical
 * section (via `withEventsLock`/`appendEventLocked`, not the bare
 * `appendEvent`): two processes racing `addWork` on the same id can no
 * longer both read "id not present yet" and both append a `work.add` — the
 * second to acquire the lock re-reads with the first's event already in the
 * log, so its own existence check now correctly fails.
 */
export function addWork(dir, work) {
  const { logPath } = paths(dir);
  const event = withEventsLock(logPath, () => {
    const before = rebuildView(logPath);

    if (before.work[work?.id]) {
      throw new StoreError('validation', `work "${work.id}" already exists.`);
    }

    // Per D6/D7b: every NEW work.add event carries `tier` explicitly — the
    // caller's own value, or work.mjs's declared DEFAULTS.tier when omitted —
    // so the event log itself (not only replay.mjs's fold) states what tier
    // was in effect at write time. `??` only fills in when `tier` is missing
    // or nullish; an explicit (even invalid) value passes through unchanged
    // so validateWork below still rejects it as validation.
    const item = { ...work, tier: work?.tier ?? DEFAULTS.tier };
    validateWork(item, Object.keys(before.work));
    // work-graph-intelligence S1 (D f176c18a): the acyclic invariant on `deps`
    // is enforced at this SAME write door, right after shape/existence
    // validation — never a second validation path. assertNoCycle throws
    // WorkValidationError (category='validation'), already mapped to exit 4 by
    // categoryOf below; it is never wrapped or re-classified here.
    //
    // S2a (record 0012) extends that guarantee from the deps-only graph to the
    // UNIFIED blocking graph (`deps` as `blocks` edges + `parent` as
    // `parent-child` edges). The deps-only check runs FIRST so a pure-deps cycle
    // keeps its S1 "dependency cycle" message; assertNoUnifiedCycle then catches
    // any cycle that a `parent` edge participates in (a MIXED or pure
    // parent-child cycle the deps-only walk cannot see — a parent id is never
    // existence-checked, so a dangling forward parent makes such a cycle
    // reachable today) and reports it as a "graph cycle". Same
    // WorkValidationError / category='validation' / exit-4 contract; no schema
    // change, SCHEMA_VERSION unchanged, legacy events replay untouched (R11).
    assertNoCycle(item, before.work);
    assertNoUnifiedCycle(item, before.work);

    return appendEventLocked(logPath, { type: 'work.add', payload: item });
  });
  const view = refreshView(dir);
  return { event, view };
}

// D4/D5: the exact field set `edit` may patch. `id`, `status`, `stage`, and
// `domain` are deliberately absent — each already has its own dedicated
// write path (identity is immutable; `status` is `move`'s; `stage` is
// `moveStage`'s) and mixing them into `edit` would open a second door onto
// the same field.
const EDITABLE_FIELDS = new Set(['title', 'kind', 'risk', 'verify', 'tier', 'refs', 'deps']);

/**
 * Patch fields on an existing work item, through the SAME single write door
 * as `addWork`/`moveWork` (per D3). Unlike `addWork` (a full new record),
 * `patch` is a PARTIAL set of fields — only the D4 allowlist above may
 * appear in it; anything else (including a stray `id`/`status`/`stage`/
 * `domain`) is rejected as `validation` before the merge even happens, so an
 * over-broad patch never silently no-ops instead of failing loud. The merged
 * candidate is validated by the SAME `validateWork` entry point `addWork`
 * uses — no field rule is re-implemented here. The appended event carries
 * only `{ id, patch }` (additive, per D3/R11) — never the full record — so
 * replay can fold exactly the changed keys onto the item.
 */
// Same held-lock critical section as addWork above (existence + validation
// check through the append, one withEventsLock/appendEventLocked scope): two
// processes racing editWork on the same id, or racing editWork against
// addWork/moveWork/moveStage on ids that would collide (e.g. a deps/parent
// cycle only the second writer's patch creates), can no longer both read a
// precondition that the other's not-yet-visible write is about to invalidate.
export function editWork(dir, { id, patch, actor } = {}) {
  const { logPath } = paths(dir);
  const event = withEventsLock(logPath, () => {
    const before = rebuildView(logPath);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }
    if (!patch || typeof patch !== 'object' || Array.isArray(patch) || Object.keys(patch).length === 0) {
      throw new StoreError('validation', 'edit requires at least one field to change.');
    }
    for (const key of Object.keys(patch)) {
      if (!EDITABLE_FIELDS.has(key)) {
        throw new StoreError(
          'validation',
          `edit cannot change "${key}" — allowed fields are: ${[...EDITABLE_FIELDS].join(', ')}.`,
        );
      }
    }

    const candidate = { ...work, ...patch };
    validateWork(candidate, Object.keys(before.work));
    // Same guard pair as addWork above. deps-only first (work-graph-intelligence
    // S1) — this is the gap that used to close silently: a patch introducing an
    // A<->B cycle through `deps` (an EDITABLE_FIELDS entry) went straight
    // through, since validateDeps only checks existence, never acyclicity — and
    // it keeps the S1 "dependency cycle" message for that pure-deps case. Then
    // the UNIFIED check (S2a, record 0012) catches a cycle that a `parent` edge
    // participates in: `parent` is NOT editable, so an edit closes such a cycle
    // only by patching `deps` into a loop against a parent edge fixed at add
    // time (a MIXED cycle the deps-only walk cannot see), reported as a "graph
    // cycle". Same validation/exit-4 contract; no schema change (R11).
    assertNoCycle(candidate, before.work);
    assertNoUnifiedCycle(candidate, before.work);

    const payload = { id, patch };
    if (actor !== undefined) {
      payload.actor = actor;
    }
    return appendEventLocked(logPath, { type: 'work.edit', payload });
  });
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Compose a câu-6 ("learning gì để lại?") record MECHANICALLY from data
 * already folded for `id` in `view` (the PRE-transition view — see moveWork
 * below), plus the settlement this very transition is about to create (not
 * yet in `view`, so passed in explicitly) — per Phase 3 S3-closeout (c) /
 * six-questions L5. Zero-effort (D3 of this cell): only object/array
 * bookkeeping, never a model call, never a spawn. An item with none of the
 * three channels still gets a minimal-but-real record (empty groups, null
 * outcome) — per this cell's action (2), "không nổ, không im lặng bỏ qua".
 * PURE: no fs, no Date.now() — mirrors replay.mjs's own purity discipline.
 */
function composeLearning(view, id, closingSettlement) {
  const actual = view.outcomes?.[id]?.actual ?? null;
  const outcome = actual
    ? { disposition: actual.outcome ?? null, attempts: actual.attempts ?? null, errorClass: actual.errorClass ?? null }
    : null;

  const frictions = {};
  for (const record of view.frictions?.[id] ?? []) {
    const layer = record.layer ?? 'unknown';
    frictions[layer] = (frictions[layer] ?? 0) + 1;
  }

  const settlementRecords = [...(view.settlements?.[id] ?? []), closingSettlement];
  const settlements = {};
  for (const record of settlementRecords) {
    const key = `${record.kind}/${record.actor ?? 'unknown'}`;
    settlements[key] = (settlements[key] ?? 0) + 1;
  }

  return { outcome, frictions, settlements };
}

/**
 * Move a work item to a new status. Looks the item up fresh from the log,
 * delegates the precondition/CAS decision to fsm.mjs (pure — never writes),
 * and only then appends the event it returns.
 *
 * The lookup, the CAS decision, and the append are one held `events.lock`
 * critical section (via `withEventsLock`/`appendEventLocked`): two processes
 * racing `moveWork` on the same id with the same `expectedStatus` can no
 * longer both pass the CAS check against a status that's about to change out
 * from under one of them — the second to acquire the lock re-reads with the
 * first's event already in the log, so its own `expectedStatus` compare
 * correctly conflicts.
 */
export function moveWork(dir, { id, to, expectedStatus, reason, ask, answer, actor, headAtTake, headAtReturn, branchHeadAtTake, branchHeadAtReturn, parentSnapshotAtAsk } = {}) {
  const { logPath } = paths(dir);
  const event = withEventsLock(logPath, () => {
  const before = rebuildView(logPath);
  const work = before.work[id];
  if (!work) {
    throw new StoreError('validation', `work "${id}" not found.`);
  }

  // `reason`/`ask`/`answer` are each only meaningful on their own edge
  // (per D5 for `reason`; async-human-gate D2/D5 for `ask`/`answer`);
  // fsm.mjs enforces those requirements and ignores whichever of the three
  // doesn't apply to the edge being taken — this facade never branches on
  // `to` itself, it just forwards what the caller gave it.
  const rawEvent = transitionWork({ work, to, expectedStatus, reason, ask, answer }); // FsmError: precondition | conflict
  // Settlement actor attribution (per Phase 3 S3-closeout, vision §8):
  // stamped onto the payload AFTER the pure transition already returned it —
  // passing `actor` INTO transitionWork would be silently dropped, since
  // fsm.mjs rebuilds `payload` itself from only the fields it knows about.
  // Additive + optional: a caller that never supplies `actor` gets the
  // exact payload shape transitionWork already produced, byte-for-byte.
  if (actor !== undefined) {
    rawEvent.payload.actor = actor;
  }
  // Pull-door claim marker (stage-decompose S2-pull D1): the host repo's HEAD
  // at claim time, additive on the SAME `to === 'doing'` move `take` writes —
  // never a separate event (single write door, D3). Ignored by fsm.mjs (pure,
  // only knows the fields it destructures itself) exactly like `actor` above,
  // so this is stamped post-transition the same way.
  if (headAtTake !== undefined) {
    rawEvent.payload.headAtTake = headAtTake;
  }
  // Pull-door return marker (pr-lifecycle D3/D4, mirrors headAtTake above):
  // the host repo's HEAD at return time, additive on the SAME `to ===
  // 'proposed'` move `return` writes when it goes green — never a separate
  // event (single write door, D3). Together with the claim's own
  // `headAtTake`, this gives the review gate an honest `headAtTake ->
  // headAtReturn` diff range for a pull-door proposal, without depending on
  // a live branch the way a runner proposal's `fgw/<id>` diff does. Ignored
  // by fsm.mjs (pure, only knows the fields it destructures itself) exactly
  // like `headAtTake`/`actor` above, so this is stamped post-transition the
  // same way.
  if (headAtReturn !== undefined) {
    rawEvent.payload.headAtReturn = headAtReturn;
  }
  // Branch-source take/return markers (human-rounds D2): the SAME
  // post-transition stamp pattern as headAtTake/headAtReturn above, on the
  // SAME edges (`to === 'doing'` for the claim, `to === 'proposed'` for the
  // return) — a branch-source take/return never writes headAtTake/
  // headAtReturn (those are the main-based discriminator; mixing the two
  // would give the review gate a meaningless diff range), so this is a
  // strict addition, never a rewrite of the main-based pull-door shape.
  if (branchHeadAtTake !== undefined) {
    rawEvent.payload.branchHeadAtTake = branchHeadAtTake;
  }
  if (branchHeadAtReturn !== undefined) {
    rawEvent.payload.branchHeadAtReturn = branchHeadAtReturn;
  }
  // Parent-anchor snapshot at ask-time (str61 D2/D3): the same post-transition
  // additive stamp pattern as headAtTake/headAtReturn above — a snapshot of
  // the item's parent `{id, title, status}` taken at the moment this
  // `to === 'awaiting-human'` move parks it, so a later read can tell what
  // changed on the parent since. Ignored by fsm.mjs (pure, only knows the
  // fields it destructures itself) exactly like headAtTake/actor above, so
  // this is stamped post-transition the same way. Never set on any other
  // edge — putInAwaiting is the only caller that ever passes it.
  if (parentSnapshotAtAsk !== undefined) {
    rawEvent.payload.parentSnapshotAtAsk = parentSnapshotAtAsk;
  }
  // Compound-learn done-gate: a work item whose domain declares a
  // Compound-learn stage can never reach `done` without first passing through
  // that stage — the synthesis layer is FSM-enforced, never left to a reflex
  // that can be silently lost. Placed AFTER transitionWork's CAS + precondition
  // checks (line above) so a stale caller still gets 'conflict' first, and
  // BEFORE the append below so a refused close persists nothing (the whole
  // block runs under the held events.lock). Both doors into `done` — the
  // proposed->done approval and the doing->done hand-move — converge on this
  // one call, so gating here covers both. Domains that declare no
  // Compound-learn stage (e.g. synthetic) are exempt: coding-only enforcement.
  // The current stage is read lazily, exactly as stage.mjs does — a missing
  // `stage` reads as the domain's Execute stage — so a coding item that never
  // moved past execution is correctly refused.
  if (to === 'done') {
    const domain = getDomain(work.domain);
    const compoundLearnStage = stageForStep(domain, 'Compound-learn');
    if (compoundLearnStage !== undefined) {
      const currentStage = work.stage ?? stageForStep(domain, 'Execute');
      if (currentStage !== compoundLearnStage) {
        throw new StoreError(
          'precondition',
          `work "${id}" cannot move to "done" from stage "${currentStage}" — it must pass through the "${compoundLearnStage}" stage first so the compound-learn synthesis is never silently skipped.`,
        );
      }
    }
  }

  // Câu-6 tự động (per Phase 3 S3-closeout (c), six-questions L5): BOTH doors
  // into `done` (doing->done and proposed->done) converge on this one
  // `moveWork` call, so gating on `to === 'done'` here — rather than at each
  // caller — covers both without duplication (must_haves truth 1).
  //
  // Deviation from the plan's illustrative "append a SEPARATE event" shape
  // (recorded in this cell's trace.decisions): the learning record is
  // attached as an ADDITIVE `learning` field on THIS SAME work.move event's
  // payload instead — composed from `before` (the pre-transition view,
  // already in hand) plus the close settlement this transition is about to
  // create. A second appendEvent here would become the new "last event"
  // after every `move --to done`, which the settlement-actor-attribution
  // tests (phase-3-compound-learning-5) already assert IS the move event
  // itself — an existing, unmodifiable test. One event, one extra field,
  // is still exactly one write door (must_haves truth 3), just a tighter
  // reading of it than the plan's illustration.
  //
  // Fail-safe (must_haves prohibition — mirrors discovery.mjs's
  // judgeDiscovery fail-safe model-call pattern): a compose failure here
  // must NEVER block the transition below. Best-effort, silently swallowed.
  if (to === 'done') {
    try {
      rawEvent.payload.learning = composeLearning(before, id, { kind: 'close', actor: actor ?? null });
    } catch {
      // best-effort — see comment above.
    }
  }
  return appendEventLocked(logPath, rawEvent); // captures the real seq; rawEvent itself has none
  });
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Park a work item into `awaiting-human`, carrying the question it is
 * waiting on (per D2/D5). Thin wrapper over `moveWork` — same
 * append-then-refresh tail, same CAS/validation errors — fsm.mjs requires a
 * non-empty `ask` on this edge.
 */
export function putInAwaiting(dir, { id, ask, expectedStatus, parentSnapshotAtAsk } = {}) {
  return moveWork(dir, { id, to: 'awaiting-human', expectedStatus, ask, parentSnapshotAtAsk });
}

/**
 * Resume a work item out of `awaiting-human` back to `todo`, carrying the
 * answer it was waiting on (per D2/D5). Thin wrapper over `moveWork` — same
 * append-then-refresh tail, same CAS/validation errors — fsm.mjs requires a
 * non-empty `answer` on this edge.
 */
export function answerAwaiting(dir, { id, answer, expectedStatus, actor } = {}) {
  return moveWork(dir, { id, to: 'todo', expectedStatus, answer, actor });
}

/**
 * Move a work item to a new stage (per stage-clarify D1/D10/D12). Mirrors
 * `moveWork` exactly, one dimension up: looks the item up fresh from the
 * log, delegates the precondition/CAS decision to stage.mjs (pure — never
 * writes), and only then appends the event it returns.
 *
 * Same held-lock critical section as moveWork above — the lookup, the
 * `expectedStage` CAS decision, and the append all run inside one
 * `withEventsLock`/`appendEventLocked` scope.
 */
export function moveStage(dir, { id, to, expectedStage, verify, actor } = {}) {
  const { logPath } = paths(dir);
  const event = withEventsLock(logPath, () => {
    const before = rebuildView(logPath);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }

    const rawEvent = transitionStage({ work, to, expectedStage, verify }); // FsmError: precondition | conflict
    // Same post-transition actor stamp as moveWork above — stage.mjs is pure
    // and only ever returns the fields it knows about.
    if (actor !== undefined) {
      rawEvent.payload.actor = actor;
    }
    return appendEventLocked(logPath, rawEvent);
  });
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Log a context-discovery verdict event (per stage-clarify D3/D6). Mirrors
 * `addFriction` exactly: no FSM/work validation beyond requiring the `id`
 * the fold appends by; each verdict is its own occurrence (pass or not) —
 * the fold APPENDS per id, a later record never erases an earlier one. Same
 * single write door + append-then-refresh tail as every mutation here.
 */
export function addDiscovery(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new StoreError('validation', 'discovery requires a non-empty "id".');
  }
  const event = appendEvent(logPath, { type: 'work.discovery', payload });
  const view = refreshView(dir);
  return { event, view };
}

/** Log a decision event (no FSM/work validation — decisions are freeform). */
export function addDecision(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new StoreError('validation', 'decision requires a non-empty "text".');
  }
  const event = appendEvent(logPath, { type: 'decision', payload });
  const view = refreshView(dir);
  return { event, view };
}

// Diataxis doc-type axis (per CONTEXT D5/D6): an OPTIONAL, additive tag on
// the compound-learn capture payload, orthogonal to the engineer type-axis
// (pattern/decision/failure). Exactly the four Diataxis quadrants — no
// audience/type beyond these four is valid when the field is present at
// all; absent/null stays untagged (never required). Defined once here and
// shared by `addOutcome`/`addFriction` below.
const DIATAXIS_DOC_TYPES = new Set(['tutorial', 'how-to', 'reference', 'explanation']);

// Shared optional-shape check for `payload.docType` (mirrors the `docsRef`
// idiom in work.mjs: validated only when present, `null` treated as
// absent/untagged, per D6). Throws the same `StoreError('validation', …)`
// shape every other capture-door check in this file uses. Exported (slice-3
// P1 fix) so a caller — `bin/fgos.mjs`'s `compound --doc-type` — can
// pre-validate a quadrant BEFORE any write, reusing this single
// `DIATAXIS_DOC_TYPES` set rather than duplicating the enum at the CLI
// layer. `addOutcome`/`addFriction` below still call it too, so validation
// stays identical whichever door the payload comes through.
export function assertValidDocType(payload) {
  if (payload.docType === undefined || payload.docType === null) {
    return;
  }
  if (typeof payload.docType !== 'string' || !DIATAXIS_DOC_TYPES.has(payload.docType)) {
    throw new StoreError(
      'validation',
      `docType, when present, must be one of: ${[...DIATAXIS_DOC_TYPES].join(', ')}.`,
    );
  }
}

/**
 * Log a work-outcome event (predicted at claim, actual at close — per plan
 * Approach S1). No FSM/work validation beyond requiring the `id` the fold
 * merges on; unlike `addDecision`, payload shape (predicted-only vs
 * actual-only) is the caller's (runner's) concern, not this facade's — this
 * is still the single write door (D3), same append-then-refresh tail as
 * every other mutation here. `payload.docType` is an OPTIONAL Diataxis tag
 * (D5/D6): shape-checked only when present via `assertValidDocType` above;
 * the payload is still appended RAW (no destructure/allowlist) so it rides
 * replay's existing spread-fold with zero mechanism change.
 */
export function addOutcome(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new StoreError('validation', 'outcome requires a non-empty "id".');
  }
  assertValidDocType(payload);
  const event = appendEvent(logPath, { type: 'work.outcome', payload });
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Log a work-friction event — the friction channel of the 2-channel capture
 * (per Phase 3 plan Slice 2 / lifecycle-vision §8): the runner writes one at
 * the park/halt choke-point, self-attributed to a failure layer. Unlike
 * `work.outcome` (two halves MERGED by id), frictions are occurrences — the
 * fold APPENDS per id, a later record never erases an earlier one. Same
 * single write door + append-then-refresh tail as every mutation here.
 * `payload.docType` is the same OPTIONAL Diataxis tag as `addOutcome` above
 * (D5/D6) — same shape check, same raw-append-for-fold-survival contract.
 */
export function addFriction(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new StoreError('validation', 'friction requires a non-empty "id".');
  }
  assertValidDocType(payload);
  const event = appendEvent(logPath, { type: 'work.friction', payload });
  const view = refreshView(dir);
  return { event, view };
}

/** Read-only: the current view, rebuilt fresh from the log (never off a stale file). */
export function listWork(dir) {
  const { logPath } = paths(dir);
  return rebuildView(logPath);
}

/**
 * Read-only (per D1 request-class: a read never writes): the work items
 * ready to start right now — `todo` with every dep `done` (per D5, R5 —
 * frontier is always derived, never a stored list). Same read shape as
 * `listWork` above: rebuild the view fresh from the log, then derive.
 * A missing log rebuilds to an empty view (`{ work: {}, decisions: [] }`),
 * so `frontier` on it returns `[]` — never an error, exit 0, exactly like
 * `listWork` on an uninitialized dir. A corrupt log throws the same
 * `EventLogError('corrupt-log')` `rebuildView`/`listWork` already throw.
 */
export function readyWork(dir) {
  const { logPath } = paths(dir);
  return frontier(rebuildView(logPath));
}

/**
 * Read-only (work-graph-intelligence S5): the mechanical graph-metrics surface
 * the `fgos graph` verb emits. Same read contract as `readyWork`/`listWork` —
 * rebuild the view fresh from the log, then hand it to the Domain compute core
 * (`graph-metrics.mjs`). Entry (`bin/fgos.mjs`) reads through this facade and
 * never imports the Domain graph module directly, exactly as the `ready` verb
 * reaches `frontier` only through `readyWork`.
 */
export function graphMetrics(dir) {
  const { logPath } = paths(dir);
  return computeGraphMetrics(rebuildView(logPath));
}

/**
 * Read-only (work-graph-intelligence S7): the what-if answer for a single item
 * — "if I complete `id`, what does it unblock?". Same read contract/facade
 * shape as graphMetrics; the Domain compute core decides the answer.
 */
export function graphWhatIf(dir, id) {
  const { logPath } = paths(dir);
  return computeWhatIf(rebuildView(logPath), id);
}

/**
 * Read-only (work-graph-intelligence S8): the stale-doing advisory. Extracts
 * each `doing` item's latest claim timestamp from the raw log (the ts of its
 * most recent `work.move` to `doing`) and its `claimActor` from the view, then
 * hands them to the pure classifier. Advisory only — it reads, classifies, and
 * suggests; it never moves or reclaims anything.
 */
export function staleDoingAdvisory(dir, opts = {}) {
  const { logPath } = paths(dir);
  const view = rebuildView(logPath);
  const claimedAt = new Map();
  for (const event of readEvents(logPath)) {
    if (event.type === 'work.move' && event.payload?.to === 'doing' && typeof event.payload?.id === 'string') {
      const ts = Date.parse(event.ts);
      if (!Number.isNaN(ts)) claimedAt.set(event.payload.id, ts); // in-order iteration -> latest claim wins
    }
  }
  const entries = [];
  for (const id of Object.keys(view.work)) {
    if (view.work[id].status !== 'doing') continue;
    entries.push({ id, claimActor: view.work[id].claimActor, claimedAt: claimedAt.get(id) });
  }
  return classifyStaleDoing(entries, opts);
}

/**
 * Read-only (work-graph-intelligence S9): the footprint-intersection advisory —
 * pairs of ready items whose declared file footprints overlap, so a parallel
 * dispatch would risk a file conflict. Same read-facade shape as graphMetrics;
 * the Domain core finds the overlaps and suggests resolutions.
 */
export function footprintConflicts(dir) {
  const { logPath } = paths(dir);
  return footprintOverlap(rebuildView(logPath));
}

/**
 * Read-only: the raw event array from the log, in append order (decision
 * 14396a5c). This exists so the runner's anti-loop can derive visit counts
 * from raw events WITHOUT resolving `.fgos/` paths itself — this module
 * stays the one place that maps a dir to its files, and the single write
 * door is untouched (this accessor never appends, never rebuilds the view).
 * Same failure surface as any read here: a missing log reads as `[]`, a
 * corrupt log throws EventLogError('corrupt-log').
 */
export function readRawEvents(dir) {
  const { logPath } = paths(dir);
  return readEvents(logPath);
}

/**
 * Rebuild `state.json` from the log alone — the recovery path for a
 * missing, deleted, or stale view (per D3: the view is always derivable from
 * zero, and never itself the truth).
 */
export function rebuild(dir) {
  return refreshView(dir);
}
