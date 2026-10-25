// `dispatch.gateKillGraceMs`: how long the gate waits between SIGTERM and SIGKILL when it stops an
// agent, and `dispatch.cancelWaitMs`: how long a controller that was asked to stop waits for the
// receipts of its attempts (its default is the grace plus a slack, so both keys have one reader).
// Read through the config facade (project over global). Setup never writes either key
// into a config file (a key an older release does not know would make that release refuse the
// whole file); an absent key is the default.

import path from 'node:path';
import { isConfigRefusal, readConfig, readMachineConfig } from '../config/facade.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

export const GATE_KILL_GRACE_KEY = 'dispatch.gateKillGraceMs';
export const DEFAULT_GATE_KILL_GRACE_MS = 10_000;
/** Below one second a CLI agent cannot write its session before it is killed. */
export const MIN_GATE_KILL_GRACE_MS = 1000;

/** Why `value` is not a usable grace, or `null`. */
export function gateKillGraceProblem(value) {
  if (Number.isInteger(value) && value >= MIN_GATE_KILL_GRACE_MS) return null;
  return `${GATE_KILL_GRACE_KEY} must be an integer of at least ${MIN_GATE_KILL_GRACE_MS} ms, got ${JSON.stringify(value)}`;
}

/**
 * The `dispatch` section of the effective config with the layer of each key: `{ value, origins }` as the facade
 * returns it. Without `projectRoot` it is the machine alone; `globalConfigPath` names a global config file whose
 * directory replaces `~/.fgos`. A config file the door refuses throws.
 */
export function readDispatchConfig({ projectRoot, globalConfigPath } = {}) {
  const options = { globalDir: globalConfigPath ? path.dirname(globalConfigPath) : undefined, sections: ['dispatch'], origins: ['dispatch'] };
  return projectRoot ? readConfig({ projectRoot, ...options }) : readMachineConfig(options);
}

/** `{ value, source }` of a `dispatch` key a project or the machine set, else `undefined` (nothing sets a default for it). */
function dispatchSetting(snapshot, key) {
  const layer = snapshot?.origins?.find((origin) => origin.path === `dispatch.${key}`)?.layer;
  return layer === 'project' || layer === 'global' ? { value: snapshot.value.dispatch[key], source: layer } : undefined;
}

/** The value and where it came from, from a `readDispatchConfig` result. */
export function resolveGateKillGrace(snapshot) {
  return dispatchSetting(snapshot, 'gateKillGraceMs') ?? { value: DEFAULT_GATE_KILL_GRACE_MS, source: 'default' };
}

/** `resolve` applied to the effective `dispatch` config of `projectRoot`; a refused config file reads as "nothing configured" (doctor reports it). */
function readOrUnset(projectRoot, resolve) {
  let snapshot;
  try {
    snapshot = readDispatchConfig({ projectRoot });
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
  }
  return resolve(snapshot);
}

/**
 * The grace for the project rooted at `projectRoot`. A refused config file reads as "nothing
 * configured" (doctor reports it); a present but unusable value throws a named validation error (`RunnerConfigError`, the same message the doctor check prints), never guessed around.
 */
export function readGateKillGraceMs({ projectRoot } = {}) {
  const { value } = readOrUnset(projectRoot, resolveGateKillGrace);
  const problem = gateKillGraceProblem(value);
  if (problem) throw new RunnerConfigError(problem, { code: 'invalid-gate-kill-grace' });
  return value;
}

export const CANCEL_WAIT_KEY = 'dispatch.cancelWaitMs';
export const MIN_CANCEL_WAIT_MS = 1000;
/** Slack past the kill grace: the supervisor's own domain sweep and the steps after the receipt. */
const CANCEL_WAIT_SLACK_MS = 5000;

/** Why `value` is not a usable cancel wait, or `null`. */
export function cancelWaitProblem(value) {
  if (Number.isInteger(value) && value >= MIN_CANCEL_WAIT_MS) return null;
  return `${CANCEL_WAIT_KEY} must be an integer of at least ${MIN_CANCEL_WAIT_MS} ms, got ${JSON.stringify(value)}`;
}

/**
 * The cancel wait and where it came from, from a `readDispatchConfig` result: the configured value, else
 * the effective kill grace plus the slack (`source: 'default'`). `grace` is the grace that default used.
 */
export function resolveCancelWait(snapshot) {
  const grace = resolveGateKillGrace(snapshot).value;
  const configured = dispatchSetting(snapshot, 'cancelWaitMs');
  if (configured) return { ...configured, grace };
  return { value: (Number.isInteger(grace) ? grace : DEFAULT_GATE_KILL_GRACE_MS) + CANCEL_WAIT_SLACK_MS, source: 'default', grace };
}

/** `dispatch.cancelWaitMs` of the project rooted at `projectRoot`; a present but unusable value throws. */
export function readCancelWaitMs({ projectRoot } = {}) {
  const { value } = readOrUnset(projectRoot, resolveCancelWait);
  const problem = cancelWaitProblem(value);
  if (problem) throw new RunnerConfigError(problem, { code: 'invalid-cancel-wait' });
  return value;
}
