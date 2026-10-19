// `dispatch.gateKillGraceMs`: how long the gate waits between SIGTERM and SIGKILL when it stops an
// agent, and `dispatch.cancelWaitMs`: how long a controller that was asked to stop waits for the
// receipts of its attempts (its default is the grace plus a slack, so both keys have one reader).
// Read through the project-over-global reader `fgos setup` uses. Setup never writes either key
// into a config file (a key an older release does not know would make that release refuse the
// whole file); an absent key is the default.

import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
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

function dispatchValue(config, key) {
  const section = config?.dispatch;
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  return section[key];
}

const graceOf = (config) => dispatchValue(config, 'gateKillGraceMs');

/** The value and where it came from, from already-read project and global config objects. */
export function resolveGateKillGrace({ project, global } = {}) {
  const fromProject = graceOf(project);
  if (fromProject !== undefined) return { value: fromProject, source: 'project' };
  const fromGlobal = graceOf(global);
  if (fromGlobal !== undefined) return { value: fromGlobal, source: 'global' };
  return { value: DEFAULT_GATE_KILL_GRACE_MS, source: 'default' };
}

/**
 * The grace for the project rooted at `projectRoot`. A half-typed config reads as "nothing
 * configured" (doctor reports it); a present but unusable value throws a named validation error (`RunnerConfigError`, the same message the doctor check prints), never guessed around.
 */
export function readGateKillGraceMs({ projectRoot } = {}) {
  let merged;
  try {
    merged = mergeWithGlobalConfig(projectRoot ? readSharedConfigOrEmpty(projectRoot) : {});
  } catch {
    merged = {};
  }
  const { value } = resolveGateKillGrace({ project: merged });
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
 * The cancel wait and where it came from, from already-read config objects: the configured value, else
 * the effective kill grace plus the slack (`source: 'default'`). `grace` is the grace that default used.
 */
export function resolveCancelWait({ project, global } = {}) {
  const grace = resolveGateKillGrace({ project, global }).value;
  const fromProject = dispatchValue(project, 'cancelWaitMs');
  if (fromProject !== undefined) return { value: fromProject, source: 'project', grace };
  const fromGlobal = dispatchValue(global, 'cancelWaitMs');
  if (fromGlobal !== undefined) return { value: fromGlobal, source: 'global', grace };
  return { value: (Number.isInteger(grace) ? grace : DEFAULT_GATE_KILL_GRACE_MS) + CANCEL_WAIT_SLACK_MS, source: 'default', grace };
}

/** `dispatch.cancelWaitMs` of the project rooted at `projectRoot`; a present but unusable value throws. */
export function readCancelWaitMs({ projectRoot } = {}) {
  let merged;
  try {
    merged = mergeWithGlobalConfig(projectRoot ? readSharedConfigOrEmpty(projectRoot) : {});
  } catch {
    merged = {};
  }
  const { value } = resolveCancelWait({ project: merged });
  const problem = cancelWaitProblem(value);
  if (problem) throw new RunnerConfigError(problem, { code: 'invalid-cancel-wait' });
  return value;
}
