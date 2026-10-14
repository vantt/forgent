// Shared fixture for runner-loop tests whose workers run as Unit runs (`runUnit`).
//
// A loop worker runs confined: it can write only its own worktree, never git, never the main
// checkout's `.fgos/`, never a file elsewhere on disk. `runUnit` reads the runner config from the
// main checkout's `.fgos/config.json`, never from the caller's memory. So a test that hands the
// loop a runner config also has to put it on disk, with executors the Unit can bind: each one
// with a bwrap-confined cli invocation, and a capability pool for each step the loop dispatches.

import fs from 'node:fs';
import path from 'node:path';

const CONFINED_INVOCATION_ID = 'cli';

// The executor id each loop step resolves to (executorIdForWork) and the capability its Unit
// asks for (workUnitFor): the executing step and the discovery sweep.
export const LOOP_STEP_EXECUTORS = Object.freeze({
  'code:implement': 'fgos-coding-implement',
  discover: 'fgos-coding-discovering',
});

function confinedEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  if (Array.isArray(entry.invocations) && entry.invocations.length > 0) return entry;
  return {
    kind: 'agent',
    allowCrossProvider: true,
    ...entry,
    invocations: [{
      id: CONFINED_INVOCATION_ID,
      via: 'cli',
      adapter: 'cli-spawn',
      confinement: { backend: 'bwrap' },
      command: entry.command,
      args: entry.args ?? [],
    }],
  };
}

/**
 * The runner config a confined loop worker can bind with. A config that names only the global
 * `executor` gets that executor registered under each loop step's executor id; every executor
 * without invocations gets a bwrap-confined cli one; each loop step's capability gets a pool
 * naming its executor unless the config already declares it.
 */
export function confinedRunnerConfig(config = {}) {
  const executors = { ...(config.executors ?? {}) };
  for (const executorId of Object.values(LOOP_STEP_EXECUTORS)) {
    if (!executors[executorId] && config.executor) executors[executorId] = { ...config.executor };
  }
  for (const [id, entry] of Object.entries(executors)) executors[id] = confinedEntry(entry);
  const capabilities = { ...(config.capabilities ?? {}) };
  for (const [capability, executorId] of Object.entries(LOOP_STEP_EXECUTORS)) {
    if (!capabilities[capability] && executors[executorId]) capabilities[capability] = { prefer: [{ executor: executorId }] };
  }
  return { ...config, executors, capabilities };
}

/** Write `config` as the runner block of `<repoRoot>/.fgos/config.json`, keeping other blocks. */
export function persistRunnerConfig(repoRoot, config) {
  const file = path.join(repoRoot, '.fgos', 'config.json');
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* none yet */ }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ ...existing, runner: config }, null, 2));
}

/** The Unit runs the loop started in this repo, oldest first, each with its unit.json record. */
export function unitRuns(repoRoot) {
  const dir = path.join(repoRoot, '.fgos', 'assignments');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.startsWith('unit-run-'))
    .sort()
    .flatMap((unitRunId) => {
      try {
        return [{ unitRunId, record: JSON.parse(fs.readFileSync(path.join(dir, unitRunId, 'unit.json'), 'utf8')) }];
      } catch {
        return [];
      }
    });
}

/** How many worker processes the loop actually launched in this repo: one settled run each. */
export function countWorkerRuns(repoRoot) {
  let n = 0;
  for (const { unitRunId } of unitRuns(repoRoot)) {
    const roleDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId, 'producer');
    if (!fs.existsSync(roleDir)) continue;
    for (const attempt of fs.readdirSync(roleDir)) {
      const runs = path.join(roleDir, attempt, 'runs');
      if (fs.existsSync(runs)) n += fs.readdirSync(runs).length;
    }
  }
  return n;
}

/**
 * Worker-side source for a script body: how many Unit runs of this repo existed before this one
 * (the current run's own directory is already there when the worker starts).
 */
export function priorUnitRunsSource(repoRoot) {
  const dir = JSON.stringify(path.join(repoRoot, '.fgos', 'assignments'));
  return `(() => { try { return Math.max(0, fs.readdirSync(${dir}).filter((n) => n.startsWith('unit-run-')).length - 1); } catch { return 0; } })()`;
}
