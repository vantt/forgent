// dispatch/prepare.mjs — payload assembly (D7, tsk-2uf-1): `prepareDispatch`
// (a new, small, named concept — D7's own note: "a named concept in the
// middle"). the worker prompt assembled from a Work item's own
// fields lives in the Work layer, src/runner/work-compat.mjs, along with its
// trust invariant: it assumes the Work item was authored by the repo's own user
// (`verify` is run by the runner as a shell command), never ingested from an
// untrusted external source.
//
// `prepareDispatch` scope for THIS item (tsk-2uf-1) is deliberately narrow:
// it validates call legality only — that `unit` is a real, addressable
// dispatch target (a non-empty `id`) — never the dispatch MECHANISM
// (`tsk-5tm-3` D5 forbids re-deciding that; `dispatch/mechanism.mjs`'s
// `decideDispatchMechanism`/`decideExecutorDispatchMechanism` already own
// that judgment and are untouched here). It is additive: no existing
// caller (`spawnWorker`, `executeExecutorCli`, `decideExecutorCli`) is
// wired to call it in this item — introducing that wiring would be a
// behavior change, out of this item's consolidation-only scope. A future
// item widens its body (claim-ownership/footprint refusal, executor.dispatch
// auto-logging, `kind`-aware lifecycle-bearing vs. ephemeral routing per D5)
// once a real caller needs it.

import { RunnerConfigError } from './config.mjs';

/**
 * Validate that a dispatch call is legal BEFORE any payload is built for
 * it — the "named concept in the middle" D7 introduces (`docs/history/
 * dispatch-activation-and-handoff-redesign/CONTEXT.md`). Deliberately
 * narrow for this item: checks call legality only (`unit` is a real,
 * addressable dispatch target — a non-empty `id`), never the dispatch
 * MECHANISM (`tsk-5tm-3` D5 forbids re-deciding that here; `decide`'s own
 * judgment in `dispatch/mechanism.mjs` is untouched and unconsulted by this
 * function). Throws `RunnerConfigError` — the same error vocabulary every
 * other call-legality gate in this module family already uses — for a
 * `unit` with no `id`, rather than silently building a payload for nothing.
 * `opts` is accepted and returned unchanged: no options are validated yet,
 * kept for forward compatibility with the fuller shape a later item may
 * grow into (claim-ownership/footprint refusal, `kind`-aware routing per
 * D5) without changing this function's own call signature again.
 */
export function prepareDispatch(unit, opts = {}) {
  if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
    throw new RunnerConfigError('prepareDispatch requires a "unit" object (the work item, or ad-hoc task, this dispatch is for).');
  }
  const id = unit.id || unit.assignmentId;
  if (typeof id !== 'string' || !id.trim()) {
    throw new RunnerConfigError('prepareDispatch requires "unit.id" (a non-empty string) — the dispatch target must be addressable.');
  }
  return { unit, opts };
}
