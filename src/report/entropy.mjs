// entropy.mjs — pure entropy score for the work-state view (per Phase 3
// S3-closeout, plan Slice 3 (b) / CONTEXT.md D3/D6): a weighted signal over
// the SAME work-state surface `fgos check` already reports (status,
// outcomes, frictions, settlements, stage) — never the distillery's own
// unsealed/backfill vocabulary, which is a lab concept over a different
// surface (this cell's prohibitions).
//
// PURE: takes a view (as returned by store.mjs's listWork/rebuildView) and
// returns a score plus its parts — no fs import, no Date.now(), no side
// effects of any kind. Reading/writing the trend history
// (entropy-history.jsonl) and formatting the seal-digest are both a
// CLI-layer concern (bin/fgos.mjs's `check` verb) — this module never
// resolves a data dir and never writes.

import { isResolvedStatus } from '../state/frontier.mjs';
import { getDomain } from '../state/workflow-stage-graphs.mjs';

// FINAL_STATUSES: statuses at which a goal-check attempt has already run (or
// been bypassed by a mechanical reconcile — bin/fgos.mjs's sync-root/catchup
// paths, §3 of decision record 0027's audit) such that `outcomes[id].actual`
// SHOULD already be recorded. This is a THIRD concept, distinct from both
// `statusCategory` (frontier's `ready` filter) and `isResolvedStatus`
// (frontier.mjs's dep-resolution/lineage check): `blocked` belongs here
// (a failed goal-check attempt) but NOT in frontier's `ready`/`isResolvedStatus`
// checks, even though `blocked` shares the same `statusCategory: 'in-progress'`
// as plain `doing`/`awaiting-human` (0027's own DISCUSSION.md §6: category is a
// lossy compression, and this is exactly a case that needs the finer, literal
// distinction — "cơ chế nào cần mịn hơn vẫn đọc status literal", same stance
// retro-pool.mjs's `isRetrospectiveReady` already takes). Reading category
// here could never tell "blocked because a goal-check just failed" apart from
// "doing"/"awaiting-human", so this stays a literal-status set, not a
// category-based one.
//
// Before this cell, `entropy.mjs` and `bin/fgos.mjs` each hand-rolled their
// OWN local `FINAL_STATUSES` and had silently drifted apart (0027's audit,
// §2): this file's version omitted the four tail-segment statuses
// (`delivered`/`retrospective`/`cleanup`/`done`) entirely, even though this
// file's own `countMissingActual` doc comment claims to mirror
// `bin/fgos.mjs`'s `formatMissingOutcomeNag` rule — which already included
// them. `bin/fgos.mjs`'s superset is the correct, complete one (an item can
// reach `delivered` via the sync-root/catchup mechanical reconcile path
// without ever going through the normal `doing -> awaiting-approval` outcome
// stamp — CONTEXT §3 of 0027's audit — so it still needs to be flagged
// missing-actual even after it moves past `awaiting-approval`/`blocked`).
// Reconciled here as the single shared export; `bin/fgos.mjs` now imports
// this instead of declaring its own copy. Widening entropy.mjs's set only
// ADDS coverage (a strict superset of what it flagged before), never removes
// a case it used to catch — the safe direction for a bug fix.
export const FINAL_STATUSES = new Set(['awaiting-approval', 'blocked', 'delivered', 'retrospective', 'cleanup', 'done']);

// Weights modeled on the consult report's sample scheme (L107 — cited, not
// reused verbatim: that scheme scored distillery's unsealed/backfill/broken
// surface; the quantities below are this repo's own work-state signals,
// chosen per this cell's action). Heavier weight for the two signals that
// mean the predicted->actual loop itself went silent (a final-status item
// with no actual half, or work sitting in `doing` with nothing to show for
// it) than for signals that are merely "still waiting" (awaiting-human, an
// item still parked at its domain's entry stage, an unsettled friction).
export const WEIGHTS = Object.freeze({
  missingActual: 5,
  staleDoing: 5,
  stageEntry: 3,
  frictionUnsettled: 2,
  awaitingHuman: 2,
});

// Mirrors formatMissingOutcomeNag's rule in bin/fgos.mjs (porting lesson
// porting-outcome-lifecycle): a work item that reached a final status
// without ever recording the `actual` half of its predicted->actual pair.
function countMissingActual(view) {
  const outcomes = view.outcomes ?? {};
  return Object.values(view.work ?? {}).filter(
    (w) => FINAL_STATUSES.has(w.status) && !outcomes[w.id]?.actual,
  ).length;
}

// A friction record counts as "unsettled" when no settlement recorded for
// the SAME id has a `ts` later than the friction's own `ts` — i.e. nothing
// on that id resolved since the friction happened. An id with no
// settlements at all counts every one of its friction records; a
// settlement that happened BEFORE the friction (an earlier resolution,
// unrelated to this occurrence) does not count as having settled it.
//
// The single owner of that settled-after comparison: every consumer that
// needs "which frictions are still open" (this module's own entropy count,
// and the evolve-loop candidate ranking) reads it from here instead of
// re-deriving it. Returns a map of only the ids that still carry at least
// one unsettled record, each mapped to that id's unsettled records (in log
// order); an id whose every friction has since settled is omitted entirely.
export function listUnsettledFrictionsByWork(view) {
  const frictions = view.frictions ?? {};
  const settlements = view.settlements ?? {};
  const result = {};
  for (const [id, records] of Object.entries(frictions)) {
    const settlementTimes = (settlements[id] ?? []).map((s) => s.ts);
    const unsettled = records.filter(
      (record) => !settlementTimes.some((ts) => ts > record.ts),
    );
    if (unsettled.length > 0) result[id] = unsettled;
  }
  return result;
}

function countFrictionUnsettled(view) {
  return Object.values(listUnsettledFrictionsByWork(view)).reduce(
    (count, records) => count + records.length,
    0,
  );
}

function countStaleDoing(view) {
  return Object.values(view.work ?? {}).filter((w) => w.status === 'doing').length;
}

function countAwaitingHuman(view) {
  return Object.values(view.work ?? {}).filter((w) => w.status === 'awaiting-human').length;
}

// Work still parked at the very front of its lifecycle: an unresolved item
// sitting at its own domain's ENTRY stage, i.e. `stages[0]` — the same
// "domain's own entry point" `src/runner/loop.mjs` falls back to when it
// creates a runner-discovered item. This used to compare against the
// literal stage name `clarify`, which the coding domain retired entirely
// (gone from `stages`, `stepMap` and `skillMap`, per tsk-qod D1/D2 in
// workflow-stage-graphs.mjs). After that retirement the literal matched
// nothing that could still move, so the signal silently reported 0 while
// every open item genuinely waiting at coding's real entry stage
// (`discovery`) went uncounted — precisely the "not yet quality-checked"
// backlog this signal exists to measure. It never threw, so nothing caught
// it. Resolving `stages[0]` per item's OWN domain (never a second hardcoded
// literal) also keeps the count honest for a domain that names its entry
// stage differently — `triage` still legitimately calls its entry stage
// `triage`, and `fixture-marketing` still calls its own `clarify`.
//
// Compares `w.stage` literally rather than through `effectiveStage`: an
// item that never had a stage written lazily defaults to the Execute-mapped
// stage (D8), i.e. explicitly NOT the entry stage — so it is not waiting
// here, exactly as under the previous literal comparison.
//
// wontfix-terminal-status-filter-consistency D3: `stage` is never reset by
// any status transition (replay.mjs's `work.move` only ever writes
// `item.status`; only a dedicated move-stage event touches `item.stage`) —
// so an item closed `done`/`wontfix` while still carrying the entry stage
// from before it was ever explored would otherwise inflate this signal
// forever. A RESOLVED item is no longer "waiting" at any stage; its stage
// field is a historical artifact, not a live entropy signal.
function countStageEntry(view) {
  return Object.values(view.work ?? {}).filter((w) => {
    if (isResolvedStatus(w)) return false;
    // Swallow the unrecognized-domain diagnostic: this module is PURE (see
    // the file header) and getDomain's default reporter is a console.warn.
    // Folding to the default domain is still the registry's own behavior.
    const domain = getDomain(w.domain, { onUnrecognized: () => {} });
    return w.stage === domain.stages[0];
  }).length;
}

/**
 * Pure entropy score over a work-state view: `{ score, parts }`. `parts` is
 * an array of `{ label, count, weight, points }`, one row per contributing
 * signal — the score is always explainable from `parts` alone (D3: no bare
 * number, per this cell's must_haves), including rows whose count is 0.
 */
export function computeEntropy(view) {
  const rows = [
    { label: 'missing-actual', count: countMissingActual(view), weight: WEIGHTS.missingActual },
    { label: 'stale-doing', count: countStaleDoing(view), weight: WEIGHTS.staleDoing },
    { label: 'stage-entry', count: countStageEntry(view), weight: WEIGHTS.stageEntry },
    { label: 'friction-unsettled', count: countFrictionUnsettled(view), weight: WEIGHTS.frictionUnsettled },
    { label: 'awaiting-human', count: countAwaitingHuman(view), weight: WEIGHTS.awaitingHuman },
  ];
  const parts = rows.map((r) => ({ ...r, points: r.count * r.weight }));
  const score = parts.reduce((sum, p) => sum + p.points, 0);
  return { score, parts };
}

/**
 * Pure counts over the same view, for the seal-digest (per this cell's
 * action (3)): total outcomes with an `actual` half recorded (a
 * predicted-only entry does not count as compounded yet), total friction
 * occurrences, total settlement occurrences — flat counts across every id,
 * the same three channels `check` already reports elsewhere.
 */
export function computeCounts(view) {
  const outcomes = view.outcomes ?? {};
  const frictions = view.frictions ?? {};
  const settlements = view.settlements ?? {};
  return {
    outcomes: Object.values(outcomes).filter((o) => o?.actual).length,
    frictions: Object.values(frictions).reduce((sum, records) => sum + records.length, 0),
    settlements: Object.values(settlements).reduce((sum, records) => sum + records.length, 0),
  };
}
