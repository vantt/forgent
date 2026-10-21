// src/runner/execution/seat-policy.mjs — stage 1 of Seat Binding for Node callers: "which tier does this
// seat run at, which executors may serve it in which order, and why".
//
// The decision is the Rust crate's (`fgos internal seat-binding`, through the fail-closed client). This
// module only builds the request: the slice of the runner config seat choice reads, a digest of it, and
// the ask. Stage 1 is pure over (ask, config), so an answer is cached per ask and config digest for the
// life of the process; a repeated bind of the same seat (a walk, a lease conflict, a replay) costs no
// exec. The digest is recomputed on every call (a config object may change between calls). No JS policy path exists: a host that does not answer is an error, never a silent fallback.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**.

import crypto from 'node:crypto';
import { bindSeat } from '../../seat-binding/client.mjs';

/** The runner config keys seat choice reads; everything else in `runner` is not part of the digest. */
const SEAT_CONFIG_KEYS = Object.freeze(['defaults', 'maxTier', 'tierFallback', 'modelPolicies']);
const SCOPE_GROUPS = Object.freeze(['roles', 'personas', 'seats']);
const MAX_CACHED = 2000;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** `prefer` in the shape the crate reads: a list of executor ids and `{executor, invocation}` pins. */
const preferList = (prefer) => (typeof prefer === 'string' ? [prefer] : prefer);

function scopeOf(entry) {
  const out = {};
  if (entry.tier !== undefined) out.tier = entry.tier;
  if (entry.prefer !== undefined) out.prefer = preferList(entry.prefer);
  return out;
}

function capabilityOf(entry) {
  const out = {};
  for (const key of ['tier', 'maxTier']) if (entry[key] !== undefined) out[key] = entry[key];
  if (entry.prefer !== undefined) out.prefer = preferList(entry.prefer);
  for (const group of SCOPE_GROUPS) {
    if (!isObject(entry[group])) continue;
    out[group] = Object.fromEntries(Object.entries(entry[group]).filter(([, scope]) => isObject(scope)).map(([name, scope]) => [name, scopeOf(scope)]));
  }
  return out;
}

/** The slice of a runner config the crate reads: tier vocabulary, cells, fallback order and the per-capability taste. */
export function seatConfigOf(runnerConfig) {
  const runner = runnerConfig?.runner && !runnerConfig.modelPolicies ? runnerConfig.runner : (runnerConfig ?? {});
  const config = {};
  for (const key of SEAT_CONFIG_KEYS) if (runner[key] !== undefined) config[key] = runner[key];
  config.capabilities = Object.fromEntries(
    Object.entries(runner.capabilities ?? {}).filter(([, entry]) => isObject(entry)).map(([name, entry]) => [name, capabilityOf(entry)]),
  );
  return config;
}

/** JSON with every object's keys sorted, so equal configs digest equal whatever order they were written in. */
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** The semantic config slice and its digest. `$comment` never reaches either. */
export function seatConfigDigestOf(runnerConfig) {
  const config = stripComments(seatConfigOf(runnerConfig));
  return { config, digest: `sha256:${crypto.createHash('sha256').update(canonicalJson(config)).digest('hex')}` };
}

function stripComments(value) {
  if (Array.isArray(value)) return value.map(stripComments);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$comment').map(([key, child]) => [key, stripComments(child)]));
}

const answers = new Map();

/**
 * Stage 1 for one seat.
 *
 * @param {object} ask the crate's ask (capability, seat, role, persona, workflow, selectors, raiseAuthorized,
 *   override, posture, effectiveRigor, label)
 * @param {object} runnerConfig the merged runner section
 * @returns {{policy: object}|{refused: {reason: string, detail: string, config?: string}}} a refusal is a decision
 */
export function seatPolicy(ask, runnerConfig) {
  const { config, digest } = seatConfigDigestOf(runnerConfig);
  const key = `${digest}\u0000${canonicalJson(ask)}`;
  const cached = answers.get(key);
  if (cached) return cached;
  const out = bindSeat({ ask, config, configDigest: digest, now: Date.now() });
  const answer = out.policy ? { policy: out.policy } : { refused: out.refusal ?? { reason: 'seat-binding-no-policy', detail: 'the seat binding route answered with neither a policy nor a refusal' } };
  if (answers.size >= MAX_CACHED) answers.clear();
  answers.set(key, answer);
  return answer;
}

/**
 * Both stages for one seat in one exec: the crate's whole answer (policy, ranked candidates, refusal and
 * explanation). Unlike stage 1 alone, the answer depends on the peers, the walk and the machine facts the
 * caller collected, so nothing is cached.
 *
 * @param {object} request ask, runnerConfig, peers, walk, accountView, launchView
 * @returns {object} the crate's BindOutput plus `hostVersion`
 */
export function seatBinding({ ask, runnerConfig, peers = [], walk = {}, accountView = { pools: {} }, launchView = { executors: {} } }) {
  const { config, digest } = seatConfigDigestOf(runnerConfig);
  const accountViewDigest = `sha256:${crypto.createHash('sha256').update(canonicalJson(accountView)).digest('hex')}`;
  return bindSeat({ ask, config, configDigest: digest, peers, walk, accountView, accountViewDigest, launchView, now: Date.now() });
}

/** For tests: forget every cached answer. */
export function resetSeatPolicyCache() {
  answers.clear();
}
