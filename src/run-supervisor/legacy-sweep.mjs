// Runs from before the run supervisor that were left `running`: nobody finishes them (no attempt lock, no
// supervisor to adopt them), so they stay open for ever. This module finds them and settles one as
// `abandoned-legacy` only when it can prove nothing of the run is alive: every process the run recorded
// judges `dead` and no version-1 private home still points at it. Anything alive or not provable is kept
// and the reason named. Nothing is deleted; the settle goes through the recover door (`abandon-legacy`),
// which re-judges inside its own lock. The door is a use case above this layer, so the caller passes it in
// as `door: {observe, apply}` (`recoverObserveUseCase`, `recoverApplyUseCase`).

import fs from 'node:fs';
import path from 'node:path';
import { judge } from '../runner/dispatch/process-identity.mjs';
import { resolveConfinementTempRoot } from '../runner/dispatch/confinement/cleanup.mjs';
import { listOpenAttemptDirs } from './client.mjs';

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

function listJson(dir, { suffix = '.json', exclude } = {}) {
  let names;
  try { names = fs.readdirSync(dir); } catch { return []; }
  return names
    .filter((name) => name.endsWith(suffix) && !(exclude && exclude.test(name)))
    .sort()
    .map((name) => path.join(dir, name));
}

/**
 * The process records a run left behind, each in the shape `judge` reads: controller (control generations),
 * old Node supervisor and its worker (supervisor bindings), the herdr pane worker (launch command).
 */
function recordedProcesses(runDir) {
  const found = [];
  for (const file of listJson(path.join(runDir, 'control', 'generations'))) {
    const holder = readJson(file)?.holder;
    if (holder) found.push({ role: 'controller', record: holder });
  }
  const bindings = path.join(runDir, 'protected', 'supervisor-binding');
  for (const file of listJson(bindings, { exclude: /\.worker\.json$/ })) {
    const binding = readJson(file);
    if (!binding?.supervisor) continue;
    const { host, bootId } = binding;
    found.push({ role: 'supervisor', record: { ...binding.supervisor, host, bootId: binding.supervisor.bootId ?? bootId } });
    const worker = readJson(file.replace(/\.json$/, '.worker.json'))?.worker;
    if (worker) found.push({ role: 'worker', record: { ...worker, host, bootId } });
  }
  for (const file of listJson(bindings, { suffix: '.worker.json' })) {
    if (fs.existsSync(file.replace(/\.worker\.json$/, '.json'))) continue;
    const worker = readJson(file)?.worker;
    if (worker) found.push({ role: 'worker', record: worker });
  }
  for (const file of listJson(path.join(runDir, 'controller', 'commands'))) {
    const incarnation = readJson(file)?.resourceIncarnation;
    if (!incarnation) continue;
    if (Number.isInteger(incarnation.workerPid)) {
      found.push({ role: 'pane-worker', record: { pid: incarnation.workerPid, startTime: incarnation.processStartTime } });
    }
    // The shell's start time was never recorded: while it exists it stays `unknown` and keeps the run.
    if (Number.isInteger(incarnation.shellPid)) found.push({ role: 'pane-shell', record: { pid: incarnation.shellPid } });
  }
  return found;
}

/** Private homes of this run that still exist: where its confinement-finalization descriptors put them. */
function presentHomes(runDir, confinementRoot) {
  const homes = new Set();
  for (const file of listJson(path.join(runDir, 'protected', 'confinement-finalization'))) {
    const descriptor = readJson(file);
    if (!descriptor) continue;
    for (const resource of descriptor.resources ?? []) {
      if (typeof resource.pathRef === 'string' && path.isAbsolute(resource.pathRef)) homes.add(resource.pathRef);
    }
    if (typeof descriptor.dispatchId === 'string' && /^[\w.-]+$/.test(descriptor.dispatchId)) {
      homes.add(path.join(confinementRoot, descriptor.dispatchId, 'home'));
    }
  }
  return [...homes].filter((home) => fs.existsSync(home));
}

/**
 * Whether every process a legacy run recorded is dead and no version-1 home is left for it.
 * @returns {{allDead: boolean, reason: string|null}} `reason` names the first thing that keeps the run
 *   (`pid-alive`, `pid-unknown`, `home-present`, `no-recorded-holders`); never a guess.
 */
export function judgeLegacyHolders(runDir, { confinementRoot = resolveConfinementTempRoot(), judgeRecord = judge } = {}) {
  const processes = recordedProcesses(runDir);
  if (processes.length === 0) return { allDead: false, reason: 'no-recorded-holders' };
  const verdicts = processes.map(({ role, record }) => ({ role, pid: record.pid, verdict: judgeRecord(record) }));
  const alive = verdicts.find((entry) => entry.verdict === 'alive');
  if (alive) return { allDead: false, reason: `pid-alive (${alive.role} ${alive.pid})` };
  const unknown = verdicts.find((entry) => entry.verdict !== 'dead');
  if (unknown) return { allDead: false, reason: `pid-unknown (${unknown.role} ${unknown.pid})` };
  const homes = presentHomes(runDir, confinementRoot);
  if (homes.length > 0) return { allDead: false, reason: `home-present (${homes[0]})` };
  return { allDead: true, reason: null };
}

/**
 * Attempt directories under `assignmentsRoot` that are not closed, have no attempt lock or no v3 envelope (so no
 * supervisor can adopt them) and whose run record still says `running`.
 * @returns {Array<{runDir: string, runId: string}>}
 */
export function findLegacyStuck({ assignmentsRoot }) {
  const stuck = [];
  for (const runDir of listOpenAttemptDirs(assignmentsRoot)) {
    // The host's own rule for `legacy-run`: no attempt lock, or an envelope that is not version 3.
    if (fs.existsSync(path.join(runDir, 'attempt.lock')) && readJson(path.join(runDir, 'envelope.json'))?.v === 3) continue;
    const run = readJson(path.join(runDir, 'run.json'));
    if (run?.status === 'running' && typeof run.runId === 'string') stuck.push({ runDir, runId: run.runId });
  }
  return stuck;
}

const repoRootOf = (assignmentsRoot) => path.dirname(path.dirname(path.resolve(assignmentsRoot)));

/**
 * Settle one legacy run as `abandoned-legacy` through the recover door, only on proof of death.
 * @param {string} runDir
 * @param {{repoRoot: string, door: {observe: Function, apply: Function}, confinementRoot?: string, judgeRecord?: Function}} options
 * @returns {{settled: boolean, reason: string|null}}
 */
export function settleLegacy(runDir, { repoRoot, door, ...judgeOptions }) {
  const run = readJson(path.join(runDir, 'run.json'));
  if (typeof run?.runId !== 'string') return { settled: false, reason: 'run-record-unreadable' };
  const ctx = { cwd: repoRoot, repoRoot, judgeLegacyHolders: (dir) => judgeLegacyHolders(dir, judgeOptions) };
  const rec = door.observe(ctx, { runId: run.runId, intent: 'abandon-legacy' });
  if (rec.kind !== 'recommendation') return { settled: false, reason: rec.reason ?? rec.kind };
  const applied = door.apply(ctx, {
    runId: run.runId,
    action: rec.action,
    expectedSnapshot: rec.snapshotHash,
    expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
  });
  if (applied.outcome === 'applied' || applied.outcome === 'already-applied') return { settled: true, reason: null };
  return { settled: false, reason: applied.reason ?? applied.outcome };
}

/**
 * Find every stuck legacy run and settle those provably dead. The cheap in-process judgement runs first,
 * so only runs that can be settled reach the recover door (which asks the host for one adopt probe each).
 * @returns {{settled: string[], kept: Array<{runDir: string, runId: string, reason: string}>}}
 */
export function sweepLegacy({ assignmentsRoot, door, repoRoot = repoRootOf(assignmentsRoot), ...judgeOptions }) {
  const settled = [];
  const kept = [];
  for (const { runDir, runId } of findLegacyStuck({ assignmentsRoot })) {
    const verdict = judgeLegacyHolders(runDir, judgeOptions);
    if (!verdict.allDead) { kept.push({ runDir, runId, reason: verdict.reason }); continue; }
    const result = settleLegacy(runDir, { repoRoot, door, ...judgeOptions });
    if (result.settled) settled.push(runDir);
    else kept.push({ runDir, runId, reason: result.reason });
  }
  return { settled, kept };
}
