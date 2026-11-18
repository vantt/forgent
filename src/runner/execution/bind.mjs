// src/runner/execution/bind.mjs — Seat Binding for Node callers: one seat, one answer.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**
// Every decision (tier, ranking, independence, pins, effort, continuity, the walk, the launch and account
// views, the pre-admission facts) is the host's, asked through the fail-closed route client. This module is
// the facade: it builds the ask, collects the session and the lease-state overlay the host must not read,
// and carries the host's answer back; it never ranks, filters or derives a binding fact.

import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';
import { readAccountStateOverlay } from '../dispatch/provider-capacity.mjs';
import { workflowTierOf } from './seat-resolver.mjs';
import { SeatBindingError, bind as routeBind, explain as routeExplain, preflight as routePreflight } from '../../seat-binding/client.mjs';

export const BIND_CONTRACT_VERSION = 'v1alpha1';

const identityKey = (executor, invocation, pool, model, effort) => [executor, invocation ?? '', pool ?? '', model ?? '', effort ?? ''].join('\u0000');

/** What names one candidate of a seat's walk: executor, invocation, pool, model and effort. */
export const bindingIdentity = (binding) => identityKey(binding?.executor, binding?.invocation, binding?.pool, binding?.model, binding?.reasoningEffort);

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
 * What the host is asked besides the ask: the run's runner section, the session, the lease state read here
 * (and not under the lock) when `ctx.accounts` ({ runtimeDir, assignmentId }) is given, and the clock. Without
 * `accounts` the host binds from the config alone, as replay and explain read it.
 */
function requestOf(ctx, now) {
  const { runnerConfig = {}, session = {}, accounts = null } = ctx ?? {};
  return {
    runner: runnerConfig,
    session,
    ...(accounts ? { accountState: readAccountStateOverlay({ assignmentId: accounts.assignmentId, runtimeDir: accounts.runtimeDir, now }) } : {}),
    now,
  };
}

/** A derivation the host refused as a model error comes back under the class Node callers catch. */
function asModelError(err) {
  if (!(err instanceof SeatBindingError) || err.code !== 'seat-binding-failed') return err;
  const { name, code, message } = err.failure ?? {};
  if (name === 'RunnerConfigError') return new RunnerConfigError(message, code ? { code } : {});
  const mapped = name === 'RangeError' ? new RangeError(message) : new Error(message);
  if (code) mapped.code = code;
  return mapped;
}

/** The binding with the version of the host that decided it, kept next to what it was decided from. */
const withHostVersion = (binding, hostVersion) => (binding.bindingInput ? { ...binding, bindingInput: { ...binding.bindingInput, hostVersion } } : binding);

/** One host call whose model-error refusal comes back under the class Node callers catch. */
export function viaSeatRoute(call) {
  try {
    return call();
  } catch (err) {
    throw asModelError(err);
  }
}

/**
 * The binding of one seat (one host call), or `{ refused: { reason, detail } }`; execution admission
 * belongs to the calling door.
 *
 * @param {object} ask what `askFor` builds
 * @param {object} ctx { runnerConfig, session, accounts? }
 * @param {object} [options.walk] where the seat stands after a failure: `tried` (earlier bindings, oldest
 *   first), `excludePools`, `failedAccounts`, `continuity` (a binding whose executor, model and effort the seat
 *   keeps, else `seat-continuity-unavailable`), `from` (the binding left, default the last tried; recorded as
 *   `fallbackFrom`), `rotation` (same candidate, another account), `detail`, `reason` (default `provider-limit`)
 */
export function bind(ask, ctx, { walk = {} } = {}) {
  const { binding, hostVersion } = viaSeatRoute(() => routeBind({ ask: ask ?? {}, walk, ...requestOf(ctx, Date.now()) }));
  return withHostVersion(binding, hostVersion);
}

/**
 * The seat a Work operation or a raw dispatch runs: one headless producer seat by the same host call a unit
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
 * binding per step. The whole walk chain is one host call.
 * @returns {{ binding: object, policy?: object, ranked?: object, explain?: {lines: string[]}, launchView?: object, walk: object[] }}
 */
export function explainSeat(ask, ctx, { walk = {} } = {}) {
  const { binding, output, launchView, walk: chain, hostVersion } = viaSeatRoute(() => routeExplain({ ask: ask ?? {}, walk, ...requestOf(ctx, Date.now()) }));
  return {
    binding: withHostVersion(binding, hostVersion),
    policy: output?.policy,
    ranked: output?.ranked,
    explain: output?.explain,
    launchView,
    walk: (chain ?? []).map((step) => withHostVersion(step, hostVersion)),
  };
}

/**
 * The pre-admission facts of a run start, before any bind: `agentCliMissing` (the refusal for a machine on which
 * no agent executor can start) and `pinQuarantinedUntil` (when a pinned account `pin` ({ pool, id }) is
 * quarantined until, epoch milliseconds, the largest safe integer when only a person clears it). The account
 * state is read here from `accounts` ({ runtimeDir, assignmentId }) when a pin is named.
 */
export function preflightOf(runnerConfig, { session = {}, pin = null, accounts = null, now = Date.now() } = {}) {
  return viaSeatRoute(() => routePreflight({
    runner: runnerConfig,
    session,
    ...(pin ? { pin: { pool: pin.pool, id: pin.id } } : {}),
    ...(pin && accounts ? { accountState: readAccountStateOverlay({ assignmentId: accounts.assignmentId, runtimeDir: accounts.runtimeDir, now }) } : {}),
    now,
  }));
}
