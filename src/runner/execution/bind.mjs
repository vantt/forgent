// src/runner/execution/bind.mjs — Seat Binding for Node callers: one seat, one answer.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**
// Every decision (tier, ranking, independence, pins, effort, continuity, the walk, the binding and its provenance)
// is the Rust bind's, asked through the host route (`fgos internal seat-binding`, src/seat-binding/client.mjs). This
// module only carries what the route cannot read itself (the caller's runner snapshot, the session, the walk and,
// for a run, Dispatch's read of the lease state) and hands the answer back; it derives no binding fact.

import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';
import { readAccountStateOverlay } from '../dispatch/provider-capacity.mjs';
import { seatBindingClient } from '../../seat-binding/client.mjs';
import { workflowTierOf } from './seat-resolver.mjs';

const identityKey = (executor, invocation, pool, model, effort) => [executor, invocation ?? '', pool ?? '', model ?? '', effort ?? ''].join('\u0000');

/** What names one candidate of a seat's walk: executor, invocation, pool, model and effort. */
export const bindingIdentity = (binding) => identityKey(binding?.executor, binding?.invocation, binding?.pool, binding?.model, binding?.reasoningEffort);

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The runner section of a config that nests it as `runner` (and carries neither executors nor cells of its own). */
const runnerSectionOf = (runnerConfig) => (isPlainObject(runnerConfig?.runner) && runnerConfig.executors === undefined && runnerConfig.modelPolicies === undefined
  ? runnerConfig.runner
  : (runnerConfig ?? {}));

/** The session facts the route takes: what the caller states, and the PATH its programs are looked up on. */
const sessionOf = (session = {}) => ({
  headless: session.headless === true,
  hasNativeAgent: session.hasNativeAgent === true,
  postureAtLaunch: session.postureAtLaunch === true,
  herdrPresent: session.herdrPresent === true,
  pathEnv: session.pathEnv ?? process.env.PATH ?? '',
});

/** Dispatch's read of the lease state, keyed by the lease document's provider keys: what the bind ranks accounts by. */
const accountStateOf = ({ runtimeDir, assignmentId }, now) => readAccountStateOverlay({ runtimeDir, now, ...(assignmentId ? { assignmentId } : {}) });

/** The request of one seat: the ask, the runner snapshot, the session, the walk and, for a run, the lease state. */
function requestOf(ask, ctx, walk) {
  const { runnerConfig, session, accounts } = ctx ?? {};
  const now = Date.now();
  return {
    runner: runnerSectionOf(runnerConfig),
    ask: ask ?? {},
    session: sessionOf(session),
    walk: walk ?? {},
    ...(accounts ? { accountState: accountStateOf(accounts, now) } : {}),
    now,
  };
}

/**
 * The ask of one seat, built alike by the run and the dry bind from what the pattern hands its seat runner.
 * Independence and spread are read from the seat ledger now, so they see exactly the seats bound before this
 * one; independence is symmetric (a seat bound earlier that must differ from this one holds it to that too).
 */
export function askFor({ seat, unit, independentOf = [], preferIndependentOf = [] }, ledger, { overrides = [], workflowId, raiseAuthorized, blind } = {}) {
  const workflowTier = workflowTierOf(seat, unit, workflowId);
  return {
    unit,
    seat: seat.seat,
    role: seat.role,
    posture: seat.posture,
    ...(seat.persona ? { persona: seat.persona } : {}),
    ...(workflowTier ? { workflowTier } : {}),
    raiseAuthorized: raiseAuthorized === true,
    readOnly: seat.posture.readOnly,
    independentOf: [...ledger.resolve(independentOf), ...ledger.dependentExecutors(seat.seat)],
    ...(preferIndependentOf.length > 0 ? { preferIndependentOf: ledger.seats(preferIndependentOf) } : {}),
    overrides,
    ...(blind ? { blind: true } : {}),
  };
}

/**
 * The binding of one seat (one host call), or `{ refused: { reason, detail, ... } }`; execution admission
 * belongs to the calling door. An override naming a tier no seat could take throws RunnerConfigError.
 *
 * @param {object} ask what `askFor` builds
 * @param {object} ctx { runnerConfig, session, accounts? } (`accounts`: { runtimeDir, assignmentId? }, the lease
 *   state a run binds against; without it the binding reads the config alone, as replay and explain do)
 * @param {object} [options.walk] where the seat stands after a failure: `tried` (earlier bindings, oldest
 *   first), `excludePools`, `continuity` (a binding whose executor, model and effort the seat keeps, else
 *   `seat-continuity-unavailable`), `from` (the binding left, default the last tried; recorded as
 *   `fallbackFrom`), `rotation` (same candidate, another account), `detail`, `reason` (default `provider-limit`)
 */
export function bind(ask, ctx, { walk = {} } = {}) {
  return seatBindingClient().bind(requestOf(ask, ctx, walk)).binding;
}

/**
 * The seat a Work operation or a raw dispatch runs: one headless producer seat by the same crate call a unit
 * run makes, its posture judged at launch (so the ask names no writes); a stated executor, tier or effort is
 * one override, and a refusal throws, named. `unit` is `{ id, capability, rigor }`.
 */
export function bindWorkSeat({ runnerConfig, unit, role = 'producer', readOnly = false, overrides = [] }) {
  const bound = bind(
    { unit: { ...unit, writes: [] }, seat: 'producer', role, readOnly, overrides, raiseAuthorized: false },
    { runnerConfig, session: { headless: true, postureAtLaunch: true } },
  );
  if (bound.refused) throw new RunnerConfigError(`${bound.refused.reason}: ${bound.refused.detail}${bound.refused.fix ? `; ${bound.refused.fix}` : ''}`, { code: bound.refused.reason });
  return bound;
}

/**
 * Why a seat lands where it does, read-only (nothing leased, spawned or written): the binding, the crate's
 * ranked candidates, skip reasons and explanation, the launch view, and the walk a failure would take, one
 * binding per step, all from one host call.
 * @returns {{ binding: object, policy?: object, ranked?: object, explain?: {lines: string[]}, launchView?: object, walk: object[] }}
 */
export function explainSeat(ask, ctx, { walk = {} } = {}) {
  const { binding, policy, ranked, explain, launchView, walk: chain } = seatBindingClient().explain(requestOf(ask, ctx, walk));
  return { binding, policy, ranked, explain, launchView, walk: chain };
}

/**
 * What serves a purpose (`dispatch decide --for`), in one host call: the executor registered under that name,
 * else the tools serving it (probed live under `repoRoot`), else the seat Seat Binding binds for a capability with
 * a `prefer` pool of its own, else nothing. The answer is `purposeSeatOf`'s shape (src/runner/dispatch/plan.mjs).
 */
export function purposeSeatFromHost(runnerConfig, purpose, { repoRoot } = {}) {
  return seatBindingClient().plan({
    runner: runnerSectionOf(runnerConfig),
    purpose: purpose ?? null,
    repoRoot: repoRoot ?? process.cwd(),
    session: sessionOf({ headless: true, postureAtLaunch: true }),
    now: Date.now(),
  }).seat;
}

/**
 * The refusal for a machine on which no agent executor can start, or null when one can: every agent executor
 * of the config runs programs and none of them is installed. It names the programs looked for and what to do.
 */
export function agentCliMissingRefusal(runnerConfig, session = {}) {
  const { preflight } = seatBindingClient().preflight({ runner: runnerSectionOf(runnerConfig), session: sessionOf(session), now: Date.now() });
  return preflight.agentCliMissing ?? null;
}

/**
 * When the pinned account `{ pool, id }` is quarantined now ends (epoch milliseconds, the largest safe integer
 * when only a person clears it), or null when the bind's account view offers it: the judgement the bind ranks by,
 * so a pinned account is refused for the reason a ranked one is passed over. The lease re-checks it under its
 * lock at the time of use.
 */
export function accountQuarantineOf(runnerConfig, { pool, id }, { runtimeDir, now = Date.now() } = {}) {
  const { preflight } = seatBindingClient().preflight({
    runner: runnerSectionOf(runnerConfig),
    session: sessionOf({}),
    pin: { pool, id },
    accountState: accountStateOf({ runtimeDir }, now),
    now,
  });
  return preflight.pinQuarantinedUntil ?? null;
}

/** The seat config slice a binding records the digest of, and that digest: what a replay compares before it rebinds. */
export function seatConfigDigestOf(runnerConfig) {
  const { config, digest } = seatBindingClient().digest({ runner: runnerConfig ?? {} });
  return { config, digest };
}
