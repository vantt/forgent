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

const FINAL_STATUSES = new Set(['proposed', 'blocked', 'done']);

// Weights modeled on the consult report's sample scheme (L107 — cited, not
// reused verbatim: that scheme scored distillery's unsealed/backfill/broken
// surface; the quantities below are this repo's own work-state signals,
// chosen per this cell's action). Heavier weight for the two signals that
// mean the predicted->actual loop itself went silent (a final-status item
// with no actual half, or work sitting in `doing` with nothing to show for
// it) than for signals that are merely "still waiting" (awaiting-human,
// stage clarify, an unsettled friction).
export const WEIGHTS = Object.freeze({
  missingActual: 5,
  staleDoing: 5,
  stageClarify: 3,
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

function countStageClarify(view) {
  return Object.values(view.work ?? {}).filter((w) => w.stage === 'clarify').length;
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
    { label: 'stage-clarify', count: countStageClarify(view), weight: WEIGHTS.stageClarify },
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
