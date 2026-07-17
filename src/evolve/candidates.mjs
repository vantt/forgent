// candidates.mjs — Gate A candidate ranking for the self-improve (evolving)
// loop (P13 Slice 1, CONTEXT.md D4/D6/D10/D12). PURE: takes a work-state view
// (as returned by store.mjs's listWork/rebuildView) and returns a ranked list
// of improvement candidates — one per work-item id that still carries at least
// one unsettled friction record. No fs, no Date.now(), no event append, no
// state mutation of any kind; a read never writes (D6).
//
// The "unsettled friction" definition and its weight are NOT redefined here:
// both come from entropy.mjs (D12) — `listUnsettledFrictionsByWork` owns the
// settled-after comparison, and `WEIGHTS.frictionUnsettled` owns the weight.
// This module never re-implements the comparison and never hardcodes the
// weight, so the measurable-outcome signal stays the single one entropy
// already reports (D4).

import { listUnsettledFrictionsByWork, WEIGHTS } from '../report/entropy.mjs';

// Pick the record that describes the candidate's current state: the LATEST by
// `ts` (D12). Friction records append per id in log order, so on equal `ts`
// the later log entry wins — deterministic either way.
function latestByTs(records) {
  return records.reduce((latest, record) => (record.ts > latest.ts ? record : latest));
}

/**
 * Rank open friction into evolve-loop candidates, highest score first.
 *
 * One candidate per work-item id that has ≥1 unsettled friction record. A
 * candidate's `score` sums ALL of that id's unsettled records — count ×
 * `WEIGHTS.frictionUnsettled` (D12: the whole cluster's weight, not just the
 * latest record). Its displayed fields (disposition, errorClass, layer,
 * detail, attempts) come from the LATEST record by `ts` (D12), so the human
 * sees the freshest attribution while the score still reflects how often the
 * id has tripped. Ranking is deterministic: score descending, ties broken by
 * ascending id.
 */
export function rankCandidates(view) {
  const unsettledByWork = listUnsettledFrictionsByWork(view);
  const candidates = Object.entries(unsettledByWork).map(([id, records]) => {
    const latest = latestByTs(records);
    return {
      id,
      disposition: latest.disposition ?? null,
      errorClass: latest.errorClass ?? null,
      layer: latest.layer ?? null,
      detail: latest.detail ?? null,
      attempts: latest.attempts ?? null,
      score: records.length * WEIGHTS.frictionUnsettled,
    };
  });
  candidates.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return candidates;
}
