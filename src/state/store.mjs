// store.mjs — the single write door onto `.fgos/` (per D3/D5).
//
// This is the sole module that resolves `.fgos/` paths; byte-level append is
// delegated to events.mjs. Every other module here is a pure lib that takes
// an explicit path (events.mjs) or no path at all (status-fsm.mjs, replay.mjs,
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
// import status-fsm.mjs/work.mjs/events.mjs directly.
//
// SIBLING FACADE (D3, worker-dispatch-log): `.fgos/logs/` is written by a
// separate narrow facade, worker-log.mjs — NOT this door. This module's
// single-write-door scope stays exactly `events.jsonl` + `state.json` (the
// event-sourced FSM truth and its view); unstructured worker dispatch output
// is a different concern and never flows through moveWork/appendEvent.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withEventsLock, appendEventLocked } from './events.mjs';
import { viewRevision, serializeView, readAllEventsFromDir, rebuildViewFromDir, buildSnapshotFromDir } from './replay.mjs';
import { graphMetrics as computeGraphMetrics, whatIf as computeWhatIf, classifyStaleDoing, classifyStalePostDelivery, footprintOverlapAmong, goalScopedCriticalPath, goalScopedGreedyTopUnblock, computeSchedule, detectCycles } from './graph-metrics.mjs';
import { transitionWork, FsmError } from './status-fsm.mjs';
import { transitionStage } from './stage-fsm.mjs';
import { validateWork, validateDomainFields, checkAcceptanceEvidenceTraceable, WorkValidationError, DEFAULTS, GOAL_TIERS, truncateTitle } from './work.mjs';
import { getDomain, statusCategoryFor, parkReasonForStatus, roleGraphFor, effectiveStage } from './workflow-stage-graphs.mjs';
import { evaluateHandoff } from './handoff.mjs';
import { EventLogError } from './events.mjs';
import { frontier, frontierAcrossSteps, isDepsAndLineageReady as depsAndLineageReadyView } from './frontier.mjs';
import { assertNoCycle, assertNoUnifiedCycle } from './dep-graph.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { resolveFgosFile, FGOS_FILE } from './fgos-file-registry.mjs';
import { readClaim, readClaims, releaseClaim, buildEffectiveView, getItemDurableRevision } from './runtime-coordination.mjs';

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
  return { logPath: path.join(dir, 'events.jsonl'), viewPath: resolveFgosFile(dir, FGOS_FILE.STATE) };
}

// Tầng A / T2 (TA-D2, TA-D11, TA-D14): new writes go under `.fgos/events/`,
// one open file per writer, instead of the single top-level `events.jsonl`.
// `paths(dir).logPath` (above) is untouched and stays load-bearing for two
// unrelated things: it is baseline-0, the pre-cutover log frozen in place
// (TA-D12, read but never appended to below), and its OWN dirname is what
// `withEventsLockAndRefresh` derives the cross-process lock from — passing
// it there keeps `events.lock` scoped to the whole `.fgos/` dir exactly as
// before (TA-D14: a per-file lock would no longer serialize the CAS
// preconditions every mutation here depends on).
const EVENTS_SUBDIR = 'events';

function eventsDirOf(dir) {
  return path.join(dir, EVENTS_SUBDIR);
}

// TA-D11 naming: `<writer-id>-<openTs>.jsonl`, openTs compact
// `YYYYMMDDTHHMMSSmmmZ` (no separators) so a writer's second file after a
// future compaction never collides with its first.
function formatCompactTs(date) {
  return date.toISOString().replace(/[-:]/g, '').replace('.', '');
}

// Resolves the ONE currently-open file for this writer under
// `.fgos/events/` (TA-D2/TA-D11): reuse it if a prior write in this same
// writer identity already opened one, otherwise open a new one now. Never
// writes to `paths(dir).logPath` (baseline-0 is frozen, TA-D12).
export function resolveWriterLogPath(dir) {
  const dirPath = eventsDirOf(dir);
  fs.mkdirSync(dirPath, { recursive: true });
  const writerId = String(resolveWriterIdentity(dir).id);
  const prefix = `${writerId}-`;
  let existing = [];
  try {
    existing = fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.startsWith(prefix) && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name)
      .sort(); // the compact ts suffix sorts lexicographically -> last = newest = the open one
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (existing.length > 0) {
    return path.join(dirPath, existing[existing.length - 1]);
  }
  return path.join(dirPath, `${prefix}${formatCompactTs(new Date())}.jsonl`);
}

// Tầng A/T3: the multi-file discovery + total-order + dedupe step now
// lives in replay.mjs (`readAllEventsFromDir`/`rebuildViewFromDir`) — this
// module only ever passes `dir` through. `readAllEvents`/`currentView` are
// the ONE pair of names every reader below still calls, unchanged from T2,
// so this handoff touched no call site.
function readAllEvents(dir) {
  return readAllEventsFromDir(dir);
}

function currentView(dir) {
  return rebuildViewFromDir(dir);
}

function writeView(viewPath, view, snapshot) {
  fs.mkdirSync(path.dirname(viewPath), { recursive: true });
  // work-graph-intelligence S3: stamp a deterministic revision-hash onto the
  // ON-DISK derived view only. `view` (what refreshView returns to store
  // callers) stays the pure fold shape rebuildView produces — the revision is
  // a sibling field written to state.json, never folded back into the view a
  // rebuild returns. Determinism (same log -> same revision) keeps the
  // rebuild-determinism e2e's before/after deep-equal green.
  // tsk-49e: `snapshot` ({size, mtimeMs, lastLine} of events.jsonl as of
  // this write) is the same kind of additive sibling field — read back only
  // by replay.mjs's own incremental-rebuild fast path, never folded into the
  // view a rebuild returns.
  // tsk-37d: reuse the once-serialized view string to derive the revision hash
  // and construct the persisted JSON without a second JSON.stringify pass over
  // view.
  const { viewStr, revision } = serializeView(view);
  const snapshotPart = snapshot !== undefined ? `,"snapshot":${JSON.stringify(snapshot)}` : '';
  const persistedContent = `${viewStr.slice(0, -1)},"revision":${JSON.stringify(revision)}${snapshotPart}}\n`;
  // tsk-4mx: write to a uniquely-named temp file, then rename(2) it onto
  // viewPath -- an atomic replace on POSIX, so a reader can never observe a
  // truncated/partial state.json, same pattern as main-checkout-lock.mjs's
  // own writeAtomicReplace.
  const tmpPath = `${viewPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmpPath, persistedContent, 'utf8');
  fs.renameSync(tmpPath, viewPath);
}

// Shared tail of every mutation: rebuild the view fresh from the (now
// updated) log and overwrite state.json. Always called AFTER the event that
// caused the change has already been appended — never before.
function refreshView(dir) {
  const { viewPath } = paths(dir);
  const view = currentView(dir); // tries T4's incremental fast path first, falls back to a full multi-file fold
  // T4's per-file anchor ({files: {name: {size, lastLine}}, maxTs}) --
  // cheap stat + tail-read per file, never a full-content read. Safe to
  // build here uncontended: refreshView always runs inside
  // withEventsLockAndRefresh's held lock (tsk-1q5), so no concurrent append
  // can land between currentView's own read above and this snapshot build.
  const snapshot = buildSnapshotFromDir(dir);
  writeView(viewPath, view, snapshot);
  return view;
}

// tsk-1q5: every mutation below used to call `refreshView(dir)` AFTER
// releasing `withEventsLock` (append-then-refresh, per the header comment
// above, but as two SEPARATE critical sections). Two processes finishing
// their own correctly-locked appends close together could then race their
// unlocked `refreshView` calls: whichever one's whole-file `state.json`
// write happened to land last won, even if its own log read was captured
// before the other process's append — silently overwriting a fresher view
// with a staler one (a lost-update on the derived cache, not the log
// itself). Folding `refreshView` into the SAME held lock as the append
// closes that window structurally, the same way `withEventsLock`'s own doc
// comment already describes for a precondition read ahead of an append.
function withEventsLockAndRefresh(dir, logPath, fn) {
  let view;
  const event = withEventsLock(logPath, () => {
    const result = fn();
    view = refreshView(dir);
    return result;
  });
  return { event, view };
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
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);

    if (before.work[work?.id]) {
      throw new StoreError('validation', `work "${work.id}" already exists.`);
    }

    // Per D6/D7b: every NEW work.add event carries `tier` explicitly — the
    // caller's own value, or work.mjs's declared DEFAULTS.tier when omitted —
    // so the event log itself (not only replay.mjs's fold) states what tier
    // was in effect at write time. `??` only fills in when `tier` is missing
    // or nullish; an explicit (even invalid) value passes through unchanged
    // so validateWork below still rejects it as validation.
    //
    // Per work-item-title-contract D2/D5, the title bound is applied HERE, on
    // the same normalize step as tier and before validateWork — so the
    // truncated title is what the appended event carries, and every caller
    // reaching this door (submit and add in bin/fgos.mjs, decompose's children,
    // the runner loop) obeys one rule without any of them repeating it.
    const item = { ...work, tier: work?.tier ?? DEFAULTS.tier, title: truncateTitle(work?.title) };
    validateWork(item, Object.keys(before.work));
    // domainFields fieldSchema (decision record 0027, D6): a separate,
    // narrower check than validateWork's own domainFields shape rule above
    // (work.mjs) — validates ONLY the namespace matching item's own domain
    // against that domain's declared fieldSchema, if any. Run right after
    // validateWork (which already confirmed item.domain is a real DOMAINS
    // key or absent) so getDomain's lookup below can never miss.
    validateDomainFields(item, getDomain(item.domain));
    // statusCategory (decision record 0027, D2/D3): computed AFTER
    // validateWork above confirms `item.domain` is either absent or a real
    // DOMAINS key — deliberately not folded into the tier/title normalize
    // step above it, because `getDomain` falls back to DEFAULT_DOMAIN with
    // a `console.warn` for a genuinely unrecognized domain (workflow-stage-
    // graphs.mjs's `resolveDomainName`), and an invalid `item.domain` must
    // still fail validation with exactly the same single stderr line as
    // before this cell existed (test/cli/fgos.test.mjs's `submit --domain
    // <bad>` stderr-parity assertion) — never a stray "folding to coding"
    // warning for an item that is about to be rejected anyway. So the very
    // first event a work item ever gets already carries its frozen
    // category, with no from-scratch window a derive-on-read model would
    // leave open (see STATUS_CATEGORIES's own doc comment, work.mjs, for
    // the L3 replay-from-zero reasoning this avoids), but only once the
    // item is known-valid. `statusCategoryFor` returns `undefined` (never
    // stamped, per the same "don't invent one" rule moveWork below
    // follows) unless `item.status` — almost always the caller's default
    // `todo`, but a caller-declared `status` on `add` is legal and honored
    // here too — falls in the six front-segment statuses `item`'s own
    // domain declares a `statusLabels` entry for.
    const addCategory = statusCategoryFor(getDomain(item.domain), item.status);
    if (addCategory !== undefined) {
      item.statusCategory = addCategory;
    }
    // tsk-48i D1: same write-time-stamp shape as statusCategory above, for
    // the domain-owned parkReason table (parkReasonForStatus,
    // workflow-stage-graphs.mjs) -- lets a domain-agnostic reader (e.g.
    // herdr-plugin) tell "actively worked" apart from "parked on a person"
    // or "parked on a system error" without learning the domain's own
    // literal status strings.
    const addParkReason = parkReasonForStatus(getDomain(item.domain), item.status);
    if (addParkReason !== undefined) {
      item.parkReason = addParkReason;
    }
    // tsk-5q5-2 (D1/D3): narrow write-time check on any acceptance clause
    // supplying text+evidence together — see checkAcceptanceEvidenceTraceable's
    // own doc comment (work.mjs) for what this does and does not prove.
    checkAcceptanceEvidenceTraceable(item, path.dirname(dir));
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

    return appendEventLocked(resolveWriterLogPath(dir), { type: 'work.add', payload: item }, dir);
  });
}

// D4/D5: the exact field set `edit` may patch. `id`, `status`, `stage`, and
// `domain` are deliberately absent — each already has its own dedicated
// write path (identity is immutable; `status` is `move`'s; `stage` is
// `moveStage`'s) and mixing them into `edit` would open a second door onto
// the same field.
const EDITABLE_FIELDS = new Set(['title', 'description', 'kind', 'risk', 'verify', 'tier', 'refs', 'deps', 'acceptance', 'priority', 'intent', 'docsRef', 'parent', 'urgent', 'impact', 'effort', 'footprint', 'action', 'mergeAfter', 'supersededBy', 'duplicates', 'domainFields', 'goalTier']);

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
export function editWork(dir, { id, patch, role } = {}) {
  const { logPath } = paths(dir);
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
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
    // tsk-2t9c D16: `kind` selects which workflow's stage graph an item
    // follows (`resolveWorkflow`, `src/state/workflow-stage-graphs.mjs`).
    // `status: 'todo'` is the ONLY status a claimed item's `stage` is still
    // free to move through discovery/exploring/planning under -- claim
    // (`todo` -> `doing`) happens right before the FIRST invocation of the
    // `executing`-stage skill, never earlier (fgos-coding-driving's own
    // hard rule), so every stage-graph-consuming call an item makes while
    // still `todo` already reflects `kind`'s CURRENT value at read time.
    // Refusing this edit once `status` has left `todo` means `kind` can
    // never drift out from under a stage graph the item is actively
    // walking -- no separate frozen `workflow` field needed, no second
    // write door, no validated-change verb to get subtly wrong: `kind`
    // itself simply stops being a live variable once it would matter.
    if (patch.kind !== undefined && work.status !== 'todo') {
      throw new StoreError(
        'validation',
        `edit cannot change "kind" on work "${id}" -- status is "${work.status}", not "todo". `
        + `kind selects the item's workflow/stage graph; it can only change while status is still todo, `
        + `before a claim lets the item start walking that graph.`,
      );
    }

    // Per work-item-title-contract D2/D5, the same title bound addWork applies,
    // applied to the PATCH rather than to the candidate: the event this door
    // appends carries `patch` verbatim (see payload below), so bounding only
    // the candidate would leave replay rebuilding the untruncated title and the
    // view disagreeing with its own log. A patch that does not carry a title is
    // passed through untouched, so an unrelated edit never silently reshapes a
    // title that was already stored.
    const normalizedPatch = typeof patch.title === 'string'
      ? { ...patch, title: truncateTitle(patch.title) }
      : patch;

    const candidate = { ...work, ...normalizedPatch };
    // tsk-1ne D1/D2: re-validate only the fields this patch actually
    // touches, not the whole merged candidate — a legacy item can carry a
    // field that predates a since-tightened rule (e.g. a `stage` value no
    // longer in the enum, an over-length `id`) and was never rejected by
    // this door before this check existed; re-validating it on every
    // UNRELATED edit blocked that item from being edited AT ALL. `id`/
    // `stage`/`status`/`domain` can never be in `patch` in the first place
    // (rejected by the EDITABLE_FIELDS loop above), so this only ever
    // grandfathers a field the patch could never have touched anyway —
    // never a field the patch is actually trying to change.
    const touchedFields = new Set(Object.keys(patch));
    validateWork(candidate, Object.keys(before.work), touchedFields);
    // domainFields fieldSchema (decision record 0027, D6): same narrower
    // per-domain check addWork runs above — only actually reachable when
    // `patch.domainFields` is present, same tsk-1ne scoping as validateWork
    // above (no domain declares a fieldSchema today, so this is dormant
    // either way — gated for the same general reason, not observed impact).
    if (touchedFields.has('domainFields')) {
      validateDomainFields(candidate, getDomain(candidate.domain));
    }
    // tsk-5q5-2 (D1/D3): same narrow check addWork applies above — gated to
    // only run when `patch.acceptance` is present (tsk-1ne D1/D2): an item
    // with a pre-existing non-traceable `acceptance` clause would otherwise
    // block every unrelated edit the same way the stage/id bug did.
    if (touchedFields.has('acceptance')) {
      checkAcceptanceEvidenceTraceable(candidate, path.dirname(dir));
    }
    // Same guard pair as addWork above. deps-only first (work-graph-intelligence
    // S1) — this is the gap that used to close silently: a patch introducing an
    // A<->B cycle through `deps` (an EDITABLE_FIELDS entry) went straight
    // through, since validateDeps only checks existence, never acyclicity — and
    // it keeps the S1 "dependency cycle" message for that pure-deps case. Then
    // the UNIFIED check (S2a, record 0012) catches a cycle that a `parent` edge
    // participates in — now including a cycle closed by a `parent` patch
    // itself (parent-flag-cli D1): `assertNoUnifiedCycle` revalidates the
    // whole merged candidate unconditionally, so allowing `parent` into
    // EDITABLE_FIELDS needed no new guard code, only the new allowed key.
    // Both the deps-patch-against-a-fixed-parent-edge case (the original gap)
    // and the parent-patch-itself case are caught by this one call, reported
    // as a "graph cycle". Same validation/exit-4 contract; no schema change
    // (R11).
    assertNoCycle(candidate, before.work);
    assertNoUnifiedCycle(candidate, before.work);

    const payload = { id, patch: normalizedPatch };
    if (role !== undefined) {
      payload.role = role;
    }
    // Writer provenance (D8/D15/D17/D18, str46-io-contract): stamped
    // post-transition exactly like role above, but unconditional -- every
    // event through this door records who wrote it. resolveWriterIdentity
    // never throws and never blocks the mutation (D18); no validator sits on
    // this path.
    payload.writer = resolveWriterIdentity(dir);
    return appendEventLocked(resolveWriterLogPath(dir), { type: 'work.edit', payload }, dir);
  });
}

/**
 * Clear/annotate a stale reason/parkReason on a done or wontfix work item.
 * Appends a 'work.resolve-park-reason' event carrying { id, note, role, writer }.
 */
export function resolveParkReason(dir, { id, note, role } = {}) {
  const { logPath } = paths(dir);
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }
    if (!note || typeof note !== 'string' || note.trim() === '') {
      throw new StoreError('validation', 'resolve-park-reason requires a non-empty --note.');
    }
    if (work.status !== 'done' && work.status !== 'wontfix') {
      throw new StoreError(
        'validation',
        `resolve-park-reason can only clear reason/parkReason on terminal items (status "done" or "wontfix"); work "${id}" has status "${work.status}".`,
      );
    }
    if (role !== undefined && role !== 'human' && role !== 'session') {
      throw new StoreError('validation', `resolve-park-reason role must be "human" or "session" (got "${role}").`);
    }

    const payload = { id, note: note.trim() };
    if (role !== undefined) {
      payload.role = role;
    }
    payload.writer = resolveWriterIdentity(dir);
    return appendEventLocked(resolveWriterLogPath(dir), { type: 'work.resolve-park-reason', payload }, dir);
  });
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
    const key = `${record.kind}/${record.role ?? 'unknown'}`;
    settlements[key] = (settlements[key] ?? 0) + 1;
  }

  return { outcome, frictions, settlements };
}

/**
 * Set the persisted "focus" pointer (per str67-goal-directed-planning
 * D3/D4/D7) to `id` — the SINGLE write door for focus, mirroring
 * addWork/editWork's exact shape: resolve paths, rebuild the view fresh
 * inside the held lock, validate, append, refresh. Rejects an id that does
 * not exist, or whose item has no declared `goalTier` (D7: "must target an
 * actual goal item"). No CAS/precondition beyond those two checks — setting
 * focus to an id that is already the current focus is a harmless no-op
 * re-write (idempotent, per plan.md's edge-dimension note).
 */
export function setFocus(dir, { id, role } = {}) {
  const { logPath } = paths(dir);
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }
    if (!GOAL_TIERS.includes(work.goalTier)) {
      throw new StoreError(
        'validation',
        `work "${id}" has no declared goal tier — "goal set" requires goalTier to be one of ${GOAL_TIERS.join(', ')}.`,
      );
    }
    const payload = role !== undefined ? { id, role } : { id };
    return appendEventLocked(resolveWriterLogPath(dir), { type: 'goal.focus', payload }, dir);
  });
}

/**
 * RUL58 acceptance-evidence gate: throws if `work` has opted into
 * `acceptance` clauses (per work.mjs's optional-additive shape) and any
 * populated clause still lacks evidence. `acceptance` absent, null, or an
 * empty array is a complete no-op (D4) — an item that never opted in is
 * unaffected. Pure — no I/O, no event append.
 *
 * Extracted out of `moveWork`'s inline `to === 'delivered'` check (tsk-396
 * D1) so `approve` (bin/fgos.mjs) can also call this directly, as a
 * pre-flight check before any merge mutation — the merge-then-gate
 * ordering gap tsk-396 exists to close. `moveWork` still calls this itself
 * below, unchanged, as the backstop for the doors into `delivered` that
 * don't go through that pre-flight (`return`'s `doing -> delivered`, the
 * mechanical `blocked -> delivered` retry).
 */
export function assertAcceptanceEvidence(id, work) {
  if (!Array.isArray(work.acceptance) || work.acceptance.length === 0) return;
  for (const clause of work.acceptance) {
    if (typeof clause?.text !== 'string' || !clause.text.trim()) continue;
    if (typeof clause.evidence !== 'string' || !clause.evidence.trim()) {
      throw new StoreError(
        'precondition',
        `work "${id}" cannot move to "delivered" — acceptance clause "${clause.text}" has no evidence yet; edit --acceptance must supply it before "delivered".`,
      );
    }
  }
}

/**
 * tsk-2p6: a risk:heavy item reaching `delivered` with no `plan.md` in its
 * own docs history means its risk map was never written down for evidence
 * to be checked against (found live: tsk-4ax/tsk-55p, docs/history/<id>/
 * carrying only iron-law-evidence.md). Same shape as
 * `assertAcceptanceEvidence` (RUL58) immediately above — a small assert
 * called from both `moveWork`'s `to === 'delivered'` backstop and
 * `approve`'s pre-flight call sites (`bin/fgos.mjs`) — but NOT pure: it
 * checks the item's own `fgw/<id>` branch via `git cat-file -e`, never a
 * plain `fs.existsSync` on the caller's current working tree, so the same
 * function is correct both before a merge (pre-flight, branch not yet in
 * `repoRoot`'s checkout) and after (backstop, already merged).
 *
 * `risk === 'heavy'` only, not a live re-derivation of "touches an
 * Iron-Law-gated module" — that classification is the separate, existing
 * Iron Law gate's own job; `heavy` is this codebase's own established
 * mechanical proxy for "this needed a written risk map" (same trigger
 * `fgos-coding-validating`'s own heavy-risk human-confirmation gate uses).
 *
 * Deliberately never re-evaluates an item that reached `delivered` before
 * this gate existed (tsk-4ax/tsk-55p stay untouched) — this only fires at
 * the moment of a NEW transition into `delivered`, never as a standing
 * scan over history a retroactive plan.md could never honestly satisfy.
 */
export function assertPlanEvidence(id, work, repoRoot) {
  if (work.risk !== 'heavy') return;
  const branch = `fgw/${id}`;
  const candidates = [];
  if (typeof work.docsRef === 'string' && work.docsRef.trim()) {
    candidates.push(path.posix.join(work.docsRef.replace(/\/+$/, ''), 'plan.md'));
  }
  candidates.push(`docs/history/${id}/plan.md`);
  const hasPlan = candidates.some((candidate) => {
    try {
      execFileSync('git', ['cat-file', '-e', `${branch}:${candidate}`], { cwd: repoRoot, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
  if (!hasPlan) {
    throw new StoreError(
      'precondition',
      `work "${id}" cannot move to "delivered" — risk:heavy but no plan.md found on branch "${branch}" (checked ${candidates.join(', ')}); write one before landing.`,
    );
  }
}

/**
 * Move a work item to a new status. Looks the item up fresh from the log,
 * delegates the precondition/CAS decision to status-fsm.mjs (pure — never writes),
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
export function moveWork(dir, { id, to, expectedStatus, reason, ask, answer, role, headAtTake, headAtReturn, branchHeadAtTake, branchHeadAtReturn, parentSnapshotAtAsk, claimTrigger, statusAtAsk, releaseTrigger, rationale, alternatives, source, askRationale, askAlternatives, askSource, mergedSha, mergedInto } = {}) {
  const { logPath } = paths(dir);
  const result = withEventsLockAndRefresh(dir, logPath, () => {
  const before = currentView(dir);
  const work = before.work[id];
  if (!work) {
    throw new StoreError('validation', `work "${id}" not found.`);
  }

  // `reason`/`ask`/`answer` are each only meaningful on their own edge
  // (per D5 for `reason`; async-human-gate D2/D5 for `ask`/`answer`);
  // status-fsm.mjs enforces those requirements and ignores whichever of the three
  // doesn't apply to the edge being taken — this facade never branches on
  // `to` itself, it just forwards what the caller gave it.
  const rawEvent = transitionWork({ work, to, expectedStatus, reason, ask, answer }); // FsmError: precondition | conflict
  // Settlement role attribution (per Phase 3 S3-closeout, vision §8):
  // stamped onto the payload AFTER the pure transition already returned it —
  // passing `role` INTO transitionWork would be silently dropped, since
  // status-fsm.mjs rebuilds `payload` itself from only the fields it knows about.
  // Additive + optional: a caller that never supplies `role` gets the
  // exact payload shape transitionWork already produced, byte-for-byte.
  if (role !== undefined) {
    rawEvent.payload.role = role;
  }
  // statusCategory (decision record 0027, D2/D3): stamped AFTER the pure
  // transition already returned it, same post-transition pattern as `role`
  // immediately above and `writer` immediately below — status-fsm.mjs never
  // sees or validates this field (it stays domain-agnostic-consumer-only,
  // never a move-legality input; see DOMAINS.coding.statusLabels's own
  // comment on why category-level validation would be wrong). Computed
  // from `work`'s OWN domain (never a global table), so a future
  // second production domain with a different statusLabels map gets its
  // own categories automatically, no branch here. Present only for the six
  // front-segment statuses `to`'s domain actually declares a `statusLabels`
  // entry for; the four tail-segment statuses (`delivered`/`retrospective`/
  // `cleanup`/`done`) have none there by design (D1), so `category` is
  // `undefined` and nothing is stamped — never invented, and never
  // recomputed later at replay time (replay.mjs's work.move case only
  // folds whatever this event actually carries).
  const category = statusCategoryFor(getDomain(work.domain), to);
  if (category !== undefined) {
    rawEvent.payload.statusCategory = category;
  }
  // tsk-48i D1: same write-time-stamp shape as statusCategory above, for
  // the domain-owned parkReason table (parkReasonForStatus,
  // workflow-stage-graphs.mjs).
  const parkReason = parkReasonForStatus(getDomain(work.domain), to);
  if (parkReason !== undefined) {
    rawEvent.payload.parkReason = parkReason;
  }
  // Writer provenance (D8/D15/D17/D18, str46-io-contract) -- same
  // post-transition stamp as role/headAtTake above, but unconditional:
  // every moveWork call records who wrote it, never blocking on a
  // malformed identity (D18).
  rawEvent.payload.writer = resolveWriterIdentity(dir);
  // Pull-door claim marker (stage-decompose S2-pull D1): the host repo's HEAD
  // at claim time, additive on the SAME `to === 'doing'` move `take` writes —
  // never a separate event (single write door, D3). Ignored by status-fsm.mjs (pure,
  // only knows the fields it destructures itself) exactly like `role` above,
  // so this is stamped post-transition the same way.
  if (headAtTake !== undefined) {
    rawEvent.payload.headAtTake = headAtTake;
  }
  // Pull-door return marker (pr-lifecycle D3/D4, mirrors headAtTake above):
  // the host repo's HEAD at return time, additive on the SAME `to ===
  // 'awaiting-approval'` move `return` writes when it goes green — never a separate
  // event (single write door, D3). Together with the claim's own
  // `headAtTake`, this gives the review gate an honest `headAtTake ->
  // headAtReturn` diff range for a pull-door proposal, without depending on
  // a live branch the way a runner proposal's `fgw/<id>` diff does. Ignored
  // by status-fsm.mjs (pure, only knows the fields it destructures itself) exactly
  // like `headAtTake`/`role` above, so this is stamped post-transition the
  // same way.
  if (headAtReturn !== undefined) {
    rawEvent.payload.headAtReturn = headAtReturn;
  }
  // Branch-source take/return markers (human-rounds D2): the SAME
  // post-transition stamp pattern as headAtTake/headAtReturn above, on the
  // SAME edges (`to === 'doing'` for the claim, `to === 'awaiting-approval'` for the
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
  // Merge-evidence provenance (tsk-5dk): the same additive, fsm-ignored
  // post-transition stamp pattern as branchHeadAtTake/branchHeadAtReturn
  // above, carried only by `approve`'s real merge/GitHub-merge call sites
  // on the SAME `to === 'delivered'` move — a hand-typed `fgos move --to
  // delivered` or a verify-only pull-door delivery never supplies these,
  // so their absence from an event is itself evidence, not a gap.
  if (mergedSha !== undefined) {
    rawEvent.payload.mergedSha = mergedSha;
  }
  if (mergedInto !== undefined) {
    rawEvent.payload.mergedInto = mergedInto;
  }
  // Claim-trigger marker (claim-lock §7, additive, NOT `claimRole`): who/what
  // dispatched this claim (e.g. `'herdr'`) — audit-only, never a safety
  // mechanism (claimRole/loop.mjs's reclaim-guard are unaffected). Stamped
  // post-transition on the SAME `to === 'doing'` move `pick` writes, exactly
  // like headAtTake above; ignored by status-fsm.mjs, which never destructures it.
  if (claimTrigger !== undefined) {
    rawEvent.payload.claimTrigger = claimTrigger;
  }
  // Parent-anchor snapshot at ask-time (str61 D2/D3): the same post-transition
  // additive stamp pattern as headAtTake/headAtReturn above — a snapshot of
  // the item's parent `{id, title, status}` taken at the moment this
  // `to === 'awaiting-human'` move parks it, so a later read can tell what
  // changed on the parent since. Ignored by status-fsm.mjs (pure, only knows the
  // fields it destructures itself) exactly like headAtTake/role above, so
  // this is stamped post-transition the same way. Never set on any other
  // edge — putInAwaiting is the only caller that ever passes it.
  if (parentSnapshotAtAsk !== undefined) {
    rawEvent.payload.parentSnapshotAtAsk = parentSnapshotAtAsk;
  }
  // Status-at-ask snapshot (claim-lock §5.1): the item's OWN status right
  // before this same `to === 'awaiting-human'` move parks it — `doing` when a
  // pick claim is held mid-clarify/decompose, `todo` otherwise. answerAwaiting
  // reads this back (via view.gates) to resume to the SAME status instead of
  // hardcoding `todo`, so answering a gate never silently drops a live claim.
  // Same additive, fsm-ignored stamp pattern as parentSnapshotAtAsk — never
  // set on any edge but the awaiting-human entry.
  if (statusAtAsk !== undefined) {
    rawEvent.payload.statusAtAsk = statusAtAsk;
  }
  // rationale/alternatives/source (tsk-63c D1, decision-schema-rationale-
  // alternatives-source): the same additive, fsm-ignored post-transition
  // stamp pattern as parentSnapshotAtAsk/statusAtAsk above, carried on the
  // `ask`/`answer` gate edges via putInAwaiting/answerAwaiting — ported
  // from bee's decisions.jsonl shape (docs/distillery/deep-dives/
  // fgos-capture-gaps-vs-bee.md) so `gates[id]` gains the same
  // who/why/what-was-rejected fields `addDecision` gets below, one schema
  // for both surfaces.
  if (rationale !== undefined) {
    rawEvent.payload.rationale = rationale;
  }
  if (alternatives !== undefined) {
    rawEvent.payload.alternatives = alternatives;
  }
  if (source !== undefined) {
    rawEvent.payload.source = source;
  }
  // askRationale/askAlternatives/askSource (tsk-19zm D2): the agent's
  // checkpoint distillate as of THIS ask, distinct from rationale/
  // alternatives/source above (the human's answer, still authoritative) —
  // same additive, fsm-ignored stamp pattern, carried only via putInAwaiting
  // (never answerAwaiting, which keeps using the plain field names above).
  if (askRationale !== undefined) {
    rawEvent.payload.askRationale = askRationale;
  }
  if (askAlternatives !== undefined) {
    rawEvent.payload.askAlternatives = askAlternatives;
  }
  if (askSource !== undefined) {
    rawEvent.payload.askSource = askSource;
  }
  // Release-trigger marker (claim-lock §3b, tsk-2zv): what released this
  // specific `doing -> todo` move — additive, fsm-ignored, same
  // post-transition stamp pattern as claimTrigger above. Only
  // `releaseClaimOnExecuting` (decompose.mjs) ever passes this, so a
  // reader can positively identify "this todo-entry came from a claim-lock
  // §3b release" instead of inferring it from status/branch-existence
  // alone, which reject (`awaiting-approval -> todo`) and a verify-fail park also
  // produce without deleting the branch.
  if (releaseTrigger !== undefined) {
    rawEvent.payload.releaseTrigger = releaseTrigger;
  }
  // Compound-learn done-gate RETIRED (work-item-status-delivered-
  // retrospective-cleanup D1/D4/D11, supersedes RUL49/RUL50/RUL51): `done`
  // is no longer reached directly from `doing`/`awaiting-approval` at all
  // (those now target `delivered`), so a stage-based gate on `to==='done'`
  // no longer makes sense here — the real "has retrospective/cleanup
  // actually completed" check moves to a dedicated harness gating
  // `cleanup -> done` (D8), not this inline block.

  // Per-clause CoS done-gate (str73-done-flip-cos-check D2/D3, retargeted
  // by work-item-status-delivered-retrospective-cleanup D3): a work item
  // that has opted into `acceptance` clauses (per work.mjs's optional-
  // additive shape) can never reach `delivered` while any populated clause
  // still lacks evidence — mirrors bee's own per-clause CoS discipline
  // (D1), mechanically checking only *presence* of evidence, never its
  // truth. Placed AFTER transitionWork's CAS + precondition checks so a
  // stale caller still gets 'conflict' first, and BEFORE the append below
  // so a refused close persists nothing. All three doors into `delivered`
  // (`doing`, `awaiting-approval`, and the mechanical `blocked` retry)
  // converge on this one `moveWork` call, so gating on `to==='delivered'`
  // here covers all three — a dependent that opens on `delivered` (RUL12)
  // is exactly as protected as it was when `done` was the trigger, never
  // less. Extracted to `assertAcceptanceEvidence` (tsk-396 D1) so `approve`
  // (bin/fgos.mjs) can also run it as a pre-flight check, before any merge
  // mutation, instead of only catching it here after the merge has already
  // landed — this call site is unchanged, still the backstop for the doors
  // that don't go through that pre-flight.
  if (to === 'delivered') {
    assertAcceptanceEvidence(id, work);
    assertPlanEvidence(id, work, path.dirname(dir));
  }

  // Câu-6 tự động (per Phase 3 S3-closeout (c), six-questions L5): BOTH doors
  // into `done` (doing->done and awaiting-approval->done) converge on this one
  // `moveWork` call, so gating on `to === 'done'` here — rather than at each
  // caller — covers both without duplication (must_haves truth 1).
  //
  // Deviation from the plan's illustrative "append a SEPARATE event" shape
  // (recorded in this cell's trace.decisions): the learning record is
  // attached as an ADDITIVE `learning` field on THIS SAME work.move event's
  // payload instead — composed from `before` (the pre-transition view,
  // already in hand) plus the close settlement this transition is about to
  // create. A second appendEvent here would become the new "last event"
  // after every `move --to done`, which the settlement-role-attribution
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
      rawEvent.payload.learning = composeLearning(before, id, { kind: 'close', role: role ?? null });
    } catch {
      // best-effort — see comment above.
    }
  }
  return appendEventLocked(resolveWriterLogPath(dir), rawEvent, dir); // captures the real seq; rawEvent itself has none
  });
  // tsk-2t9c D16: `delivered` is a terminal state for the role/holder axis
  // -- no stage skill ever re-enters an item past this point (every wired
  // reclaim lives at a stage-skill's own entry point), so an async call
  // left open on it (most commonly D14's own `review` handoff on the
  // approve path: nothing calls `handoff-return` between `awaiting-
  // approval` and `delivered`) would sit "open" forever. A read-time
  // consumer of `callThreads` (compound-learn, retrospective) would then
  // misread every delivered item as carrying unresolved work rather than
  // settled history. Close every still-open frame the exact same way a
  // live reclaim would -- one `recordCallReturn` per frame, deepest first
  // (the LIFO order `openCallStack` already enforces) -- never inventing a
  // second closing mechanism. Runs AFTER the lock above releases (this
  // function is fully synchronous, so there is no nesting risk), and only
  // when the domain actually declares a `roleGraph` -- a domain with none
  // never opens a call in the first place, so there is nothing to close.
  if (result.event.payload.to === 'delivered') {
    try {
      const domain = getDomain(result.view.work[id]?.domain);
      if (roleGraphFor(domain)) {
        let stack = openCallStack(result.view.callThreads?.[id]);
        while (stack.length > 0) {
          const closeResult = recordCallReturn(dir, { id, note: 'auto-closed at delivered (tsk-2t9c D16)' });
          stack = openCallStack(closeResult.view.callThreads?.[id]);
        }
      }
    } catch {
      // Best-effort, same fail-safe discipline as the `learning` compose
      // above: the item already reached `delivered` -- that transition is
      // what matters and must never be undone or reported as failed over a
      // cleanup step that is not itself correctness-critical.
    }
  }
  // tsk-2t9c D18: found via a real end-to-end run (a fresh agent following
  // fgos-coding-implement's own Return-step prose, verbatim, top to
  // bottom, on a real item) that never fired `handoff --to reviewer
  // --reason review` even though the item genuinely reached `awaiting-
  // approval` -- the instruction is imperative and unmissable in
  // isolation, but sits trailing after several paragraphs of blocked/
  // catchup caveats, is duplicated once per door into this status
  // (`return`, `catchup`, and any future one), and nothing gates on it:
  // skipping it produces no error, no red test, no symptom the skipping
  // agent would ever notice. Same class of gap D16 already fixed for
  // `delivered` (a skill-remembered side effect vs. an engine-guaranteed
  // one) -- and the same fix: every door into `awaiting-approval`
  // converges on this one `moveWork` call, so firing the review handoff
  // HERE covers `return`/`catchup`/anything else at once, where the
  // prose needed a copy per door and still wasn't reliably read. This
  // does not change what the prose already prescribes -- it relocates
  // who is responsible for making it actually happen. `recordCall` runs
  // its own `evaluateHandoff` guard internally (fromRole read off the
  // item's live `holder`, defaulting to the role graph's `defaultRole`),
  // so a domain/stage/holder combination where this edge is not legal
  // (or that already carries a role other than the review edge's `from`)
  // simply refuses, caught and ignored below -- same "must never block
  // the transition" fail-safe as every sibling block in this function.
  if (result.event.payload.to === 'awaiting-approval') {
    try {
      const domain = getDomain(result.view.work[id]?.domain);
      if (roleGraphFor(domain)) {
        recordCall(dir, { id, toRole: 'reviewer', reason: 'review', note: 'auto-fired on reaching awaiting-approval (tsk-2t9c D18)' });
      }
    } catch {
      // Best-effort -- see the block's own comment above.
    }
  }
  return result;
}

/**
 * Settle an active runtime claim on item `id`, transitioning it to `finalStatus` (D2).
 * Validates active runtime claim ownership (claimId) and durable revision (preClaimRevision),
 * writes the full segment [work.move(preClaimStatus->doing), work.attempt, work.move(doing->finalStatus)]
 * in ONE held events.lock critical section, then releases the runtime claim.
 */
export function settleClaim(dir, {
  id,
  claimId,
  finalStatus,
  reason,
  ask,
  answer,
  role,
  headAtReturn,
  branchHeadAtReturn,
  parentSnapshotAtAsk,
  claimTrigger,
  statusAtAsk,
  releaseTrigger,
  rationale,
  alternatives,
  source,
  askRationale,
  askAlternatives,
  askSource,
  mergedSha,
  mergedInto,
  phase = 'execute',
  result,
} = {}) {
  if (!id || typeof id !== 'string') {
    throw new StoreError('validation', 'settleClaim: "id" is required.');
  }

  const { logPath } = paths(dir);
  const claim = readClaim(dir, id);

  if (claim) {
    // tsk-40m code-review finding (blocker): an active claim exists for
    // `id` — the caller MUST name it. Silently settling "whatever claim is
    // active right now" when the caller omits claimId let a stale actor
    // (its own claim already released/reclaimed) settle a DIFFERENT actor's
    // live claim (D2's ownership check has nothing to check against).
    if (!claimId) {
      throw new StoreError('validation', `settleClaim: "claimId" is required for "${id}" — an active claim exists ("${claim.claimId}") and the caller must name it.`);
    }
    if (claim.claimId !== claimId) {
      throw new StoreError('conflict', `settleClaim: claimId mismatch for "${id}": active claim is "${claim.claimId}", got "${claimId}".`);
    }
    const targetClaimId = claim.claimId;

    try {
      const res = withEventsLockAndRefresh(dir, logPath, () => {
        const before = currentView(dir);
        const work = before.work[id];
        if (!work) {
          throw new StoreError('validation', `settleClaim: work "${id}" not found.`);
        }

        const preClaimStatus = claim.preClaimStatus || work.status;
        if (claim.preClaimStatus && work.status !== claim.preClaimStatus) {
          throw new StoreError('conflict', `settleClaim: item "${id}" status changed from preClaimStatus "${claim.preClaimStatus}" to "${work.status}".`);
        }

        if (claim.preClaimRevision) {
          const curRev = getItemDurableRevision(before, id);
          if (curRev !== claim.preClaimRevision) {
            throw new StoreError('conflict', `settleClaim: item "${id}" durable revision changed from "${claim.preClaimRevision}" to "${curRev}".`);
          }
        }

        const writer = resolveWriterIdentity(dir);
        const writerLogPath = resolveWriterLogPath(dir);

        // Event 1: work.move (preClaimStatus -> 'doing')
        const move1Raw = transitionWork({ work, to: 'doing', expectedStatus: preClaimStatus });
        move1Raw.payload.writer = writer;
        if (claim.claimRole || role) move1Raw.payload.role = claim.claimRole || role;
        if (claim.headAtTake) move1Raw.payload.headAtTake = claim.headAtTake;
        if (claim.branchHeadAtTake) move1Raw.payload.branchHeadAtTake = claim.branchHeadAtTake;
        if (claim.claimTrigger) move1Raw.payload.claimTrigger = claim.claimTrigger;
        const cat1 = statusCategoryFor(getDomain(work.domain), 'doing');
        if (cat1 !== undefined) move1Raw.payload.statusCategory = cat1;
        const pr1 = parkReasonForStatus(getDomain(work.domain), 'doing');
        if (pr1 !== undefined) move1Raw.payload.parkReason = pr1;

        appendEventLocked(writerLogPath, move1Raw, dir);

        // Event 2: work.attempt
        const attemptResult = result || (finalStatus === 'awaiting-approval' || finalStatus === 'delivered' || finalStatus === 'done' ? 'success' : 'failed');
        const attemptPayload = {
          id,
          phase,
          result: attemptResult,
          claimId: targetClaimId,
          actor: claim.actor || role || 'unknown',
          endedAt: new Date().toISOString(),
        };
        appendEventLocked(writerLogPath, { type: 'work.attempt', payload: attemptPayload }, dir);

        // Event 3: work.move ('doing' -> finalStatus)
        const intermediateWork = { ...work, status: 'doing' };
        const move3Raw = transitionWork({
          work: intermediateWork,
          to: finalStatus,
          expectedStatus: 'doing',
          reason,
          ask,
          answer,
        });
        move3Raw.payload.writer = writer;
        if (role !== undefined) move3Raw.payload.role = role;
        const cat3 = statusCategoryFor(getDomain(work.domain), finalStatus);
        if (cat3 !== undefined) move3Raw.payload.statusCategory = cat3;
        const pr3 = parkReasonForStatus(getDomain(work.domain), finalStatus);
        if (pr3 !== undefined) move3Raw.payload.parkReason = pr3;
        if (headAtReturn !== undefined) move3Raw.payload.headAtReturn = headAtReturn;
        if (releaseTrigger !== undefined) move3Raw.payload.releaseTrigger = releaseTrigger;
        if (branchHeadAtReturn !== undefined) move3Raw.payload.branchHeadAtReturn = branchHeadAtReturn;
        if (mergedSha !== undefined) move3Raw.payload.mergedSha = mergedSha;
        if (mergedInto !== undefined) move3Raw.payload.mergedInto = mergedInto;
        if (reason !== undefined) move3Raw.payload.reason = reason;

        const event3 = appendEventLocked(writerLogPath, move3Raw, dir);
        const afterView = rebuildViewFromDir(dir);

        return { event: event3, view: afterView };
      });

      if (finalStatus === 'delivered') {
        try {
          const closeResult = recordCallReturn(dir, { id, note: 'auto-closed at delivered (tsk-2t9c D16)' });
          if (closeResult) res.view = closeResult.view;
        } catch {
          // Best-effort
        }
      }

      if (finalStatus === 'awaiting-approval') {
        try {
          const domain = getDomain(res.view.work[id]?.domain);
          if (roleGraphFor(domain)) {
            recordCall(dir, { id, toRole: 'reviewer', reason: 'review', note: 'auto-fired on reaching awaiting-approval (tsk-2t9c D18)' });
          }
        } catch {
          // Best-effort
        }
      }

      return res;
    } finally {
      releaseClaim(dir, { id, claimId: targetClaimId });
    }
  }

  // Fallback for legacy items (durable status was 'doing' before migration, with no active runtime claim record)
  return moveWork(dir, {
    id,
    to: finalStatus,
    expectedStatus: 'doing',
    reason,
    ask,
    answer,
    role,
    headAtReturn,
    branchHeadAtReturn,
    parentSnapshotAtAsk,
    claimTrigger,
    statusAtAsk,
    releaseTrigger,
    rationale,
    alternatives,
    source,
    askRationale,
    askAlternatives,
    askSource,
    mergedSha,
    mergedInto,
  });
}

/**
 * Park a work item into `awaiting-human`, carrying the question it is
 * waiting on (per D2/D5). Thin wrapper over `moveWork` — same
 * append-then-refresh tail, same CAS/validation errors — status-fsm.mjs requires a
 * non-empty `ask` on this edge.
 *
 * tsk-19zm D2: `rationale`/`alternatives`/`source` here are the AGENT's
 * checkpoint distillate as of this `ask` — kept a caller-facing param name
 * matching `answerAwaiting`'s below (same CLI flag names either side), but
 * written into the payload as `askRationale`/`askAlternatives`/`askSource`
 * so a later `answer` on the same item never overwrites this checkpoint —
 * the two snapshots live side by side in `gates[id]` (replay.mjs's fold).
 */
export function putInAwaiting(dir, { id, ask, expectedStatus, parentSnapshotAtAsk, statusAtAsk, rationale, alternatives, source } = {}) {
  return moveWork(dir, {
    id,
    to: 'awaiting-human',
    expectedStatus,
    ask,
    parentSnapshotAtAsk,
    statusAtAsk,
    askRationale: rationale,
    askAlternatives: alternatives,
    askSource: source,
  });
}

/**
 * Resume a work item out of `awaiting-human`, carrying the answer it was
 * waiting on (per D2/D5). Thin wrapper over `moveWork` — same
 * append-then-refresh tail, same CAS/validation errors — status-fsm.mjs requires a
 * non-empty `answer` on this edge.
 *
 * Resume target (claim-lock §5.1): reads the gate's own `statusAtAsk`
 * snapshot (stamped by the `ask` that parked this item) and resumes there —
 * `doing` when a pick claim was held at ask-time, `todo` otherwise (also the
 * default for pre-existing logs/gates with no `statusAtAsk`, preserving the
 * historical hardcoded-`todo` behavior byte for byte).
 */
export function answerAwaiting(dir, { id, answer, expectedStatus, role, rationale, alternatives, source } = {}) {
  const view = listWork(dir);
  const to = view.gates?.[id]?.statusAtAsk ?? 'todo';
  return moveWork(dir, { id, to, expectedStatus, answer, role, rationale, alternatives, source });
}

/**
 * Move a work item to a new stage (per stage-clarify D1/D10/D12). Mirrors
 * `moveWork` exactly, one dimension up: looks the item up fresh from the
 * log, delegates the precondition/CAS decision to stage-fsm.mjs (pure — never
 * writes), and only then appends the event it returns.
 *
 * Same held-lock critical section as moveWork above — the lookup, the
 * `expectedStage` CAS decision, and the append all run inside one
 * `withEventsLock`/`appendEventLocked` scope.
 */
export function moveStage(dir, { id, to, expectedStage, verify, role } = {}) {
  const { logPath } = paths(dir);
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }

    const rawEvent = transitionStage({ work, to, expectedStage, verify }); // FsmError: precondition | conflict
    // Same post-transition role stamp as moveWork above — stage-fsm.mjs is pure
    // and only ever returns the fields it knows about.
    if (role !== undefined) {
      rawEvent.payload.role = role;
    }
    // Writer provenance (D8/D15/D17/D18, str46-io-contract) -- same
    // post-transition stamp as role above, but unconditional: every
    // moveStage call records who wrote it, never blocking on a malformed
    // identity (D18).
    rawEvent.payload.writer = resolveWriterIdentity(dir);
    return appendEventLocked(resolveWriterLogPath(dir), rawEvent, dir);
  });
}

/**
 * Rebuild the stack of currently-open async calls on `id`'s own
 * call-thread, purely from the log (tsk-2t9c D8/R7 — never a stored
 * counter, which can drift; a fold cannot). A plain `handoff` (`returning`
 * falsy) PUSHES itself as newly open; a `handoff` written by
 * `recordCallReturn` (`returning: true`) POPS the most recently opened
 * one — a genuine LIFO stack, not a flag compared against the current
 * holder, which cannot tell an open call from the very return event that
 * just closed it (both can carry the same `to`). `call-summary` entries
 * never touch the stack — sync calls do not nest against the async
 * callstack cap (handoff.mjs's own contract).
 */
function openCallStack(callThreadEntries) {
  if (!Array.isArray(callThreadEntries)) return [];
  const stack = [];
  for (const entry of callThreadEntries) {
    if (entry.kind !== 'handoff') continue;
    if (entry.returning) {
      stack.pop();
    } else {
      stack.push(entry);
    }
  }
  return stack;
}

/**
 * The single door for a role/holder call (tsk-2t9c D1/D4/D5/D8/D9): guards
 * the proposed call through handoff.mjs's pure `evaluateHandoff`, then
 * appends exactly the event kind the matched edge's own `mode` calls for —
 * never a caller choice. `mode: 'async'` writes `work.handoff` (holder
 * changes, full checkpoint); `mode: 'sync'` writes `work.call-summary`
 * (holder untouched, compact record) — same fresh-lookup -> guard ->
 * append shape every other mutation in this file already uses, one held
 * lock, one critical section.
 *
 * A REFUSED call throws `StoreError('validation', ...)` carrying the
 * refusal reason AND the legal edges as JSON — "chặn và dạy tại chỗ"
 * (D1): the caller can read the legal edges straight out of the error
 * message without a second round trip.
 *
 * `openSyncDepth` (D28, wired review finding H2/tsk-397): unlike
 * `openCallDepth`, this is NEVER derived from `callThreads` here — a
 * `work.call-summary` event commits atomically at the exact instant this
 * function's own door opens (see the `appendEventLocked` call below), so
 * by the time a genuinely NESTED sync call (the callee's own work needing
 * a further sync consult before it finishes) would call `recordCall`
 * again, the outer call's event is already fully committed to the log —
 * indistinguishable, from replay alone, from two purely sequential sync
 * calls. Only the CALLER (a skill already inside its own sync-consult
 * work, about to make a further nested one) knows its real current
 * depth; it must track and pass that depth itself. Every existing
 * caller passes none, defaulting to `0` — identical behavior to before
 * this parameter existed — this only makes the cap genuinely reachable
 * for a future caller that does track its own nesting, instead of being
 * permanently unreachable dead code.
 */
export function recordCall(dir, { id, toRole, reason, note, outcome, openSyncDepth = 0 } = {}) {
  const { logPath } = paths(dir);
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }
    const domain = getDomain(work.domain);
    const roleGraph = roleGraphFor(domain);
    const fromRole = work.holder ?? roleGraph?.defaultRole;
    // effectiveStage, not raw work.stage (tsk-2t9c bugfix, found in
    // self-review): a work item's `stage` is legitimately absent under
    // D8's lazy-default rule (workflow-stage-graphs.mjs's own
    // effectiveStage/stage-fsm.mjs precedent) -- reading work.stage
    // directly here made every handoff attempt on an item that never had
    // an explicit moveStage refuse with "stage: undefined", including
    // split children born straight at 'executing' without ever calling
    // moveStage (src/intake/plan.mjs's normalizeChild path).
    const stage = effectiveStage(work, domain);
    const openCallDepth = openCallStack(before.callThreads?.[id]).length;

    const result = evaluateHandoff({ domain, stage, fromRole, toRole, reason, openCallDepth, openSyncDepth });
    if (!result.ok) {
      throw new StoreError(
        'validation',
        `handoff refused: ${result.refusal} -- legal edges: ${JSON.stringify(result.legalEdges)}`,
      );
    }

    const rawEvent = result.edge.mode === 'async'
      ? { type: 'work.handoff', payload: { id, from: fromRole, to: toRole, reason, mode: 'async', note } }
      : { type: 'work.call-summary', payload: { id, calleeRole: toRole, reason, outcome } };
    rawEvent.payload.writer = resolveWriterIdentity(dir);
    return appendEventLocked(resolveWriterLogPath(dir), rawEvent, dir);
  });
}

/**
 * Close the most recently opened async call on `id`'s own call-thread,
 * returning the ball to whoever opened it (tsk-2t9c D4: "call = round-trip,
 * ball returns to sender" -- a return is completing a call the guard
 * ALREADY approved when it was opened, never a fresh outbound call, so it
 * deliberately does NOT run back through `evaluateHandoff`/`roleGraph`
 * edge-legality. Requiring a matching reverse edge for every return would
 * double the roleGraph's own size for no real legality question -- the
 * open call already answered "was this allowed".
 *
 * Refuses only when there is genuinely no open call to close (nothing in
 * `callThreads[id]` is a `handoff` the item's current `holder` could be
 * returning from) -- same StoreError('validation', ...) shape as every
 * other refusal in this file.
 */
export function recordCallReturn(dir, { id, note } = {}) {
  const { logPath } = paths(dir);
  return withEventsLockAndRefresh(dir, logPath, () => {
    const before = currentView(dir);
    const work = before.work[id];
    if (!work) {
      throw new StoreError('validation', `work "${id}" not found.`);
    }
    const stack = openCallStack(before.callThreads?.[id]);
    const openCall = stack.at(-1);
    if (!openCall || openCall.to !== work.holder) {
      throw new StoreError('validation', `work "${id}" has no open call for its current holder to return from.`);
    }
    const rawEvent = {
      type: 'work.handoff',
      payload: { id, from: work.holder, to: openCall.from, reason: openCall.reason, mode: 'async', returning: true, note },
    };
    rawEvent.payload.writer = resolveWriterIdentity(dir);
    return appendEventLocked(resolveWriterLogPath(dir), rawEvent, dir);
  });
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
  return withEventsLockAndRefresh(dir, logPath, () => appendEventLocked(resolveWriterLogPath(dir), { type: 'work.discovery', payload }, dir));
}

// Gate approve record shape (tsk-19j D1/D11): the 3 skill-embedded Gates
// this schema covers — one per stage in the clarify->decompose sequence —
// and the only 2 actors a real approve record can name (a person, or the
// gate-bypass mechanism auto-approving on the person's behalf).
const GATE_APPROVE_GATES = new Set(['contextApprove', 'planApprove', 'validateApprove']);
const GATE_APPROVE_ACTORS = new Set(['human', 'bypass']);

/**
 * Log a structured gate-approve event (tsk-19j D1/D11) — an explicit,
 * durable record that a skill-embedded Gate was approved, separate from the
 * `awaiting-human` ask/answer mechanism (putInAwaiting/answerAwaiting
 * above). No FSM/work validation beyond requiring `id`; each call is its own
 * occurrence, folded by `gate` into `gates[id]` in replay.mjs (a later
 * approve on the SAME gate overwrites that gate's own field, never the other
 * two). Mirrors `addDiscovery`'s shape exactly: single write door,
 * append-then-refresh tail, no CAS — an approve record never itself moves
 * the item.
 */
export function recordGateApprove(dir, { id, gate, actor, verify } = {}) {
  const { logPath } = paths(dir);
  if (typeof id !== 'string' || !id.trim()) {
    throw new StoreError('validation', 'gate-approve requires a non-empty "id".');
  }
  if (typeof gate !== 'string' || !GATE_APPROVE_GATES.has(gate)) {
    throw new StoreError('validation', `gate-approve requires "gate" to be one of: ${[...GATE_APPROVE_GATES].join(', ')}.`);
  }
  if (typeof actor !== 'string' || !GATE_APPROVE_ACTORS.has(actor)) {
    throw new StoreError('validation', `gate-approve requires "actor" to be one of: ${[...GATE_APPROVE_ACTORS].join(', ')}.`);
  }
  if (typeof verify !== 'string' || !verify.trim()) {
    throw new StoreError('validation', 'gate-approve requires a non-empty "verify".');
  }
  return withEventsLockAndRefresh(dir, logPath, () =>
    appendEventLocked(resolveWriterLogPath(dir), { type: 'work.gate-approve', payload: { id, gate, actor, verify } }, dir));
}

/**
 * Log a decision event (no FSM/work validation — decisions are freeform).
 *
 * Schema per tsk-63c D1-D3 (decision-schema-rationale-alternatives-source,
 * ported from bee's live `.bee/decisions.jsonl` shape): `rationale` is
 * required (mirrors bee's own throw-if-blank rule); `alternatives` is
 * optional free text; `source` is optional free text (no enum, per D3),
 * defaulting to `'session'` when omitted since fgOS calls are
 * agent-initiated unless a human types the CLI directly; `id` is optional
 * (seq 1206, renumbered by tsk-n4i-1; was 1190) and, when present,
 * additionally folds this decision into a
 * per-item view alongside the existing global log (replay.mjs).
 *
 * `kind` (tsk-1ud D7 step 1): `'engine' | 'design'`, optional free text (no
 * enum, same posture as `source`), defaulting to `'design'` when omitted —
 * lets a consumer separate the engine's own bookkeeping records
 * (`resolveDiscovery`/`resolvePlan`, which pass `kind: 'engine'`
 * explicitly) from real design decisions without matching on `text`
 * prefixes.
 *
 * `scope` (tsk-1lv-2 D4): optional free text (no enum, same posture as
 * `source`/`kind`) — an area slug (e.g. `'repo'`, or one matching
 * `docs/specs/<area>.md`) marking a PLATFORM/repo-wide decision, as
 * opposed to `id`'s per-item scoping. Absent entirely for an item-scoped
 * or unscoped decision; `src/report/decision-index.mjs`'s
 * `buildDecisionIndexMarkdown` is the one reader that filters on its
 * presence to build `docs/decisions/index.md`. This function never
 * validates or defaults it — same "CLI validates, store persists"
 * split `relation` already established (see the CLI-layer comment above
 * `parseDecisionRelation` below).
 */
export function addDecision(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new StoreError('validation', 'decision requires a non-empty "text".');
  }
  if (typeof payload.rationale !== 'string' || !payload.rationale.trim()) {
    throw new StoreError('validation', 'decision requires a non-empty "rationale".');
  }
  const eventPayload = { ...payload, source: payload.source ?? 'session', kind: payload.kind ?? 'design' };
  return withEventsLockAndRefresh(dir, logPath, () => {
    // tsk-37t: unlike every neighbouring id-taking verb (editWork/moveWork
    // both throw `work "<id>" not found` first), this used to accept any
    // id at all — a decision scoped to a nonexistent item wrote a success
    // envelope and a durable event that `fgos show <id>` could never
    // retrieve (it refuses an unknown id), silently losing the record.
    // `id` stays optional here (a global decision not scoped to one item is
    // legitimate, e.g. `fgos decision` with no --id) — only validated when
    // present.
    if (payload.id !== undefined && payload.id !== null) {
      const before = currentView(dir);
      if (!before.work[payload.id]) {
        throw new StoreError('validation', `work "${payload.id}" not found.`);
      }
    }
    return appendEventLocked(resolveWriterLogPath(dir), { type: 'decision', payload: eventPayload }, dir);
  });
}

// tsk-1lv-1 (D2/D8): `--relation` is a CLI-surface requirement, not an
// `addDecision` one — enforcing it inside `addDecision` itself would also
// require every internal engine bookkeeping call (`resolveDiscovery`/
// `resolvePlan`, `kind: 'engine'`) and every existing test fixture calling
// `addDecision` directly to start passing it, which CONTEXT.md D4 pins as
// explicitly unchanged ("bookkeeping máy → kind:engine, đã có, không
// đổi"). `bin/fgos.mjs`'s `decision` case is the one CLI surface D1/D2
// actually target ("mọi write khai quan hệ tường minh" is about the
// human/skill-facing verb, not every programmatic writer of this event
// type) — it calls `parseDecisionRelation`/`decisionTextLooksLikeSupersession`
// below before calling `addDecision`, and `addDecision` itself stores
// whatever `relation` string it is handed (or none) as a plain optional
// payload field, same posture as `source`/`alternatives` above.

const SUPERSESSION_PROSE_PATTERN = /\b(supersedes?|superseded|replaces?|overrides?|no longer applies|instead of the previous)\b/i;

/**
 * Pure: does `text` read like a supersession statement (STR72's own root
 * cause — bee v2.7.0 audited 70 decide events that narrated a supersession
 * in prose without declaring the relation flag, vs only 29 that declared it
 * correctly)? Used to refuse a `fgos decision` write that narrates a
 * supersession without `--relation supersedes:<id>`.
 */
export function decisionTextLooksLikeSupersession(text) {
  return typeof text === 'string' && SUPERSESSION_PROSE_PATTERN.test(text);
}

/**
 * Pure: parse `fgos decision`'s `--relation` value into a structured
 * relation (D2: "supersedes:<id>|touches:<id>|none", every write declares
 * one explicitly — no default, no inference). Throws `StoreError('validation', …)`
 * on anything else, the same error shape every other CLI-facing parse in
 * this module uses.
 */
export function parseDecisionRelation(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new StoreError(
      'validation',
      'decision requires --relation none|supersedes:<id>|touches:<id>.',
    );
  }
  const trimmed = raw.trim();
  if (trimmed === 'none') return { kind: 'none' };
  const supersedesMatch = /^supersedes:(.+)$/.exec(trimmed);
  if (supersedesMatch && supersedesMatch[1].trim()) {
    return { kind: 'supersedes', id: supersedesMatch[1].trim() };
  }
  const touchesMatch = /^touches:(.+)$/.exec(trimmed);
  if (touchesMatch && touchesMatch[1].trim()) {
    return { kind: 'touches', id: touchesMatch[1].trim() };
  }
  throw new StoreError(
    'validation',
    `decision --relation "${raw}" is not one of none|supersedes:<id>|touches:<id>.`,
  );
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
  return withEventsLockAndRefresh(dir, logPath, () => appendEventLocked(resolveWriterLogPath(dir), { type: 'work.outcome', payload }, dir));
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
  return withEventsLockAndRefresh(dir, logPath, () => appendEventLocked(resolveWriterLogPath(dir), { type: 'work.friction', payload }, dir));
}

/**
 * Append a standalone durable `work.attempt` record for a claim that ends
 * WITHOUT a status transition — a stale runtime claim reclaimed by a new
 * claimant (claim-port.mjs's stale-claim-reclaim path). `settleClaim`
 * already folds a `work.attempt` into its own full segment when a claim
 * settles through a real status transition; this is the sibling for the
 * other way a claim ends (tsk-40m code-review finding, high, D4/D8) — kept
 * separate from `settleClaim` since a reclaim never transitions the item's
 * own status.
 *
 * `attemptCount`/`lastAttempt` (replay.mjs) rely on `work.attempt`
 * existing at all to tell "started then reclaimed" apart from "never
 * started" — without this, releasing/reclaiming a runtime claim (which
 * only ever deletes the `.fgos/runtime/claims/<id>.json` file, never a
 * durable event) left no trace an attempt ever happened.
 */
export function recordClaimAttempt(dir, { id, phase, result, claimId, actor, endedAt } = {}) {
  const { logPath } = paths(dir);
  if (!id || typeof id !== 'string') {
    throw new StoreError('validation', 'recordClaimAttempt: "id" is required.');
  }
  if (!phase || typeof phase !== 'string') {
    throw new StoreError('validation', 'recordClaimAttempt: "phase" is required.');
  }
  const payload = { id, phase, result, claimId, actor: actor || 'unknown', endedAt: endedAt || new Date().toISOString() };
  return withEventsLockAndRefresh(dir, logPath, () => appendEventLocked(resolveWriterLogPath(dir), { type: 'work.attempt', payload }, dir));
}

export function currentEffectiveView(dir) {
  const durableView = currentView(dir);
  const claims = readClaims(dir);
  return buildEffectiveView(durableView, claims);
}

/** Read-only: the current effective view (durable view + active runtime claims). */
export function listWork(dir) {
  return currentEffectiveView(dir);
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
 * `step` (tsk-4so, optional): which domain step counts as "ready to start"
 * — passed straight through to `frontier`'s own `step` option
 * (`'Clarify'`/`'Divide'`/`'Execute'`); omitted, `frontier`'s own default
 * (`'Execute'`) applies, byte-identical to every pre-existing caller.
 */
export function readyWork(dir, { step } = {}) {
  return frontier(currentEffectiveView(dir), step ? { step } : undefined);
}

/**
 * Read-only stage-independent readiness check (choke-point-take-vs-pick-
 * claim-eligibility): true when `id` has every dep done and no open
 * decomposed child, regardless of its `stage` — see frontier.mjs's
 * `isDepsAndLineageReady` for the full rationale. `take`'s explicit `--id`
 * branch uses this instead of `readyWork` so it can claim a clarify/decompose
 * item without losing the deps/lineage guard.
 */
export function isDepsAndLineageReady(dir, id) {
  return depsAndLineageReadyView(currentEffectiveView(dir), id);
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
  return computeGraphMetrics(currentEffectiveView(dir));
}

/**
 * Read-only (work-graph-intelligence S7): the what-if answer for a single item
 * — "if I complete `id`, what does it unblock?". Same read contract/facade
 * shape as graphMetrics; the Domain compute core decides the answer.
 */
export function graphWhatIf(dir, id) {
  // tsk-40m code-review finding (high, D4): effective view, not durable-only
  // -- an actively-claimed dependent (durable status still 'todo' post-
  // migration) must not read as newly-ready idle work.
  return computeWhatIf(currentEffectiveView(dir), id);
}

/**
 * Read-only (str67-goal-directed-planning D3): the goal-focus facade the
 * new `fgos goal show` verb reads. Same read contract/facade shape as
 * graphMetrics/graphWhatIf — Entry never imports graph-metrics.mjs directly,
 * it always reads through this door. Does NOT validate that `view.focus`
 * still names a real goal item (D7: a focus is never auto-cleared) — it just
 * reads whatever is persisted and computes over it; the goal-scoped metrics
 * functions already degrade gracefully (empty scope) on an unknown/stale id.
 */
export function goalFocusShow(dir) {
  const view = currentView(dir);
  if (view.focus === undefined) {
    return { focus: null };
  }
  return {
    focus: view.focus,
    criticalPath: goalScopedCriticalPath(view, view.focus),
    topUnblock: goalScopedGreedyTopUnblock(view, view.focus),
  };
}

/**
 * Read-only (work-graph-intelligence S8): the stale-doing advisory. Extracts
 * each `doing` item's latest claim timestamp from the raw log (the ts of its
 * most recent `work.move` to `doing`) and its `claimRole` from the view, then
 * hands them to the pure classifier. Advisory only — it reads, classifies, and
 * suggests; it never moves or reclaims anything.
 */
export function staleDoingAdvisory(dir, opts = {}) {
  // tsk-40m code-review finding (high, D4): claim-time no longer writes a
  // durable work.move(->doing) event for an active runtime claim (only
  // settle-time does, retroactively) -- an item still under an active claim
  // has NO such event yet, so the raw-event-derived `claimedAt` this used to
  // rely on is blind to every post-migration claim (this advisory would
  // always report zero of them, no matter how stale). An active claim's own
  // `acquiredAt` is the real "claimed at" timestamp; the raw-event scan
  // stays as the fallback for a legacy pre-migration item (durable status
  // still 'doing', no active runtime claim record at all).
  const claims = readClaims(dir);
  const view = buildEffectiveView(currentView(dir), claims);
  const claimedAt = new Map();
  for (const event of readAllEvents(dir)) {
    if (event.type === 'work.move' && event.payload?.to === 'doing' && typeof event.payload?.id === 'string') {
      const ts = Date.parse(event.ts);
      if (!Number.isNaN(ts)) claimedAt.set(event.payload.id, ts); // in-order iteration -> latest claim wins
    }
  }
  const entries = [];
  for (const id of Object.keys(view.work)) {
    if (view.work[id].status !== 'doing') continue;
    const claim = claims[id];
    const claimTs = claim ? Date.parse(claim.acquiredAt) : claimedAt.get(id);
    entries.push({
      id,
      claimRole: claim ? (claim.claimRole || claim.actor) : view.work[id].claimRole,
      claimedAt: Number.isNaN(claimTs) ? undefined : claimTs,
    });
  }
  return classifyStaleDoing(entries, opts);
}

/**
 * Read-only (work-graph-intelligence S10, tsk-1bl CONTEXT.md D4/D7): the
 * post-delivery staleness advisory — closes the observability gap
 * `staleDoingAdvisory` above leaves for `delivered`/`retrospective`/
 * `cleanup`. Rebuilds the view and raw event log the same way
 * `staleDoingAdvisory` does, then hands both straight to the pure
 * classifier (which reads its own entry-into-status events directly, no
 * intermediate `entries` extraction needed here since `classifyStalePost
 * Delivery` takes `rawEvents` itself). `opts.ttlDays` must be supplied by
 * the caller — same requirement `checkCleanupTTLElapsed`/
 * `pickNextCleanupItem` already have, since the real TTL is a per-repo
 * shared-config value this read-only facade never guesses.
 */
export function stalePostDeliveryAdvisory(dir, opts = {}) {
  const view = currentView(dir);
  const rawEvents = readAllEvents(dir);
  return classifyStalePostDelivery(view, rawEvents, opts);
}

/**
 * Read-only (work-graph-intelligence S9): the footprint-intersection advisory —
 * pairs of ready items whose declared file footprints overlap, so a parallel
 * dispatch would risk a file conflict. Same read-facade shape as graphMetrics;
 * the Domain core finds the overlaps and suggests resolutions.
 * Candidates come from `frontierAcrossSteps` (tsk-4so D1, docs/history/
 * execution-fanout/CONTEXT-tsk-4so.md), not the single-step `frontier` —
 * two items at DIFFERENT steps (e.g. one at `decompose`, one at
 * `executing`) sharing a footprint is a real risk this advisory must catch,
 * not just two items both currently at `executing`. `footprintOverlap`
 * (the Execute-only single-step wrapper other decision docs already cite
 * by name as its contract) is intentionally left untouched — this reuses
 * the underlying `footprintOverlapAmong` pairwise comparison directly
 * instead.
 */
export function footprintConflicts(dir) {
  // tsk-40m code-review finding (high, D4): effective view -- an actively-
  // claimed item is not an idle-and-ready candidate for a parallel-dispatch
  // collision.
  return footprintOverlapAmong(frontierAcrossSteps(currentEffectiveView(dir)));
}

/**
 * Read-only (tsk-3c7): computed-parallel-wave-schedule — which frontier
 * items can dispatch in parallel right now, packed into waves by
 * declared-footprint conflict, plus a dep-graph cycle check over the
 * whole work map (never just the frontier — a cycle anywhere is a
 * graph-integrity defect regardless of which items in it are ready).
 * Same read-facade shape as `footprintConflicts`; the Domain core
 * (`graph-metrics.mjs`) computes both, this just rebuilds the view.
 */
export function computedSchedule(dir, candidateIds) {
  // tsk-40m code-review finding (high, D4): effective view -- an actively-
  // claimed item must not be scheduled into a new dispatch wave.
  const view = currentEffectiveView(dir);
  return { ...computeSchedule(view, candidateIds), cycles: detectCycles(view) };
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
  return readAllEvents(dir);
}

/**
 * Rebuild `state.json` from the log alone — the recovery path for a
 * missing, deleted, or stale view (per D3: the view is always derivable from
 * zero, and never itself the truth).
 */
export function rebuild(dir) {
  return refreshView(dir);
}
