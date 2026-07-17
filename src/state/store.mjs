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

import fs from 'node:fs';
import path from 'node:path';
import { appendEvent, readEvents } from './events.mjs';
import { rebuildView } from './replay.mjs';
import { transitionWork, FsmError } from './fsm.mjs';
import { transitionStage } from './stage.mjs';
import { validateWork, WorkValidationError, DEFAULTS } from './work.mjs';
import { EventLogError } from './events.mjs';
import { frontier } from './frontier.mjs';

export { FsmError, WorkValidationError, EventLogError };

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

/** The one category -> exit-code map (R4). Values unchanged from the prior duplicate in bin/fgos.mjs. */
export const EXIT_CODES = Object.freeze({
  precondition: 2,
  conflict: 3,
  validation: 4,
  'corrupt-log': 5,
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
  fs.writeFileSync(viewPath, `${JSON.stringify(view, null, 2)}\n`, 'utf8');
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
 */
export function addWork(dir, work) {
  const { logPath } = paths(dir);
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

  const event = appendEvent(logPath, { type: 'work.add', payload: item });
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
 */
export function moveWork(dir, { id, to, expectedStatus, reason, ask, answer, actor, headAtTake, headAtReturn, branchHeadAtTake, branchHeadAtReturn } = {}) {
  const { logPath } = paths(dir);
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
  const event = appendEvent(logPath, rawEvent); // captures the real seq; rawEvent itself has none
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Park a work item into `awaiting-human`, carrying the question it is
 * waiting on (per D2/D5). Thin wrapper over `moveWork` — same
 * append-then-refresh tail, same CAS/validation errors — fsm.mjs requires a
 * non-empty `ask` on this edge.
 */
export function putInAwaiting(dir, { id, ask, expectedStatus } = {}) {
  return moveWork(dir, { id, to: 'awaiting-human', expectedStatus, ask });
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
 */
export function moveStage(dir, { id, to, expectedStage, verify, actor } = {}) {
  const { logPath } = paths(dir);
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
  const event = appendEvent(logPath, rawEvent);
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

/**
 * Log a work-outcome event (predicted at claim, actual at close — per plan
 * Approach S1). No FSM/work validation beyond requiring the `id` the fold
 * merges on; unlike `addDecision`, payload shape (predicted-only vs
 * actual-only) is the caller's (runner's) concern, not this facade's — this
 * is still the single write door (D3), same append-then-refresh tail as
 * every other mutation here.
 */
export function addOutcome(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new StoreError('validation', 'outcome requires a non-empty "id".');
  }
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
 */
export function addFriction(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new StoreError('validation', 'friction requires a non-empty "id".');
  }
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
