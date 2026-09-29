// dispatch/prepare.mjs — payload assembly (D7, tsk-2uf-1): `buildPrompt`
// (the worker prompt assembled from a work item's own fields) and
// `prepareDispatch` (a new, small, named concept — D7's own note: "a named
// concept in the middle"). Split out of the former `src/runner/dispatch.mjs`
// (2204 lines, 6 concerns in one file) — pure move, no behavior change for
// `buildPrompt`; `src/runner/dispatch.mjs` re-exports every name below
// unchanged as a barrel. See `docs/history/dispatch-activation-and-handoff-
// redesign/CONTEXT.md` D7 for the split rationale.
//
// TRUST INVARIANT (security panel, restored — dropped from the pre-split
// banner during the D7 move, review-caught): `buildPrompt` below assumes
// the `work` item it is given (title, kind, refs, and especially `verify`)
// was authored by the repo's own user, not ingested from an untrusted
// external source. `verify` is run by the runner as a shell command
// (goal-check, a deliberately different and separate trust boundary from
// `dispatch/transport.mjs`'s spawn calls); a work item from an unvetted
// source is an injection vector before it ever reaches dispatch. Never
// wire an external/untrusted intake path into `work` without a review
// gate in between.
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
export { buildPrompt } from '../work-compat.mjs';

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
