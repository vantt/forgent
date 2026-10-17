// `dispatch.gateKillGraceMs`: how long the gate waits between SIGTERM and SIGKILL when it stops an
// agent. Read through the project-over-global reader `fgos setup` uses. Setup never writes the key
// into a config file (a key an older release does not know would make that release refuse the
// whole file); an absent key is the default.

import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';

export const GATE_KILL_GRACE_KEY = 'dispatch.gateKillGraceMs';
export const DEFAULT_GATE_KILL_GRACE_MS = 10_000;
/** Below one second a CLI agent cannot write its session before it is killed. */
export const MIN_GATE_KILL_GRACE_MS = 1000;

/** Why `value` is not a usable grace, or `null`. */
export function gateKillGraceProblem(value) {
  if (Number.isInteger(value) && value >= MIN_GATE_KILL_GRACE_MS) return null;
  return `${GATE_KILL_GRACE_KEY} must be an integer of at least ${MIN_GATE_KILL_GRACE_MS} ms, got ${JSON.stringify(value)}`;
}

function graceOf(config) {
  const section = config?.dispatch;
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  return section.gateKillGraceMs;
}

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
 * configured" (doctor reports it); a present but unusable value throws, never guessed around.
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
  if (problem) throw new Error(problem);
  return value;
}
