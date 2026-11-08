// Thin client of the adopt door: `fgos internal adopt` does the work; this module lists attempt
// directories, calls the route and names what went wrong. It never touches an attempt's state itself.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveHostBin } from '../util/host-bin.mjs';
import { RUN_SUPERVISOR_PROTOCOL as PROTOCOL, ATTEMPT_STEP_TIMEOUT_MS, MAX_ATTEMPT_STEPS } from './protocol.mjs';
import { removeOrphanAttemptSockets } from './runtime-dir.mjs';

// Strictly above the steps one attempt can run back to back, so a slow step ends itself first.
const ROUTE_TIMEOUT_MS = ATTEMPT_STEP_TIMEOUT_MS * MAX_ATTEMPT_STEPS + 60 * 1000;
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

export class RunSupervisorError extends Error {
  constructor(code, message, detail = {}) {
    super(`${code}: ${message}`);
    this.name = 'RunSupervisorError';
    this.code = code;
    Object.assign(this, detail);
  }
}

let cachedHostBin;

/** The host binary, resolved once per process. */
export function resolveRouteHostBin() {
  if (cachedHostBin === undefined) cachedHostBin = resolveHostBin() ?? null;
  if (!cachedHostBin) {
    throw new RunSupervisorError('host-unavailable', 'Rust host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)');
  }
  return cachedHostBin;
}

function runAdopt(args, { input, hostBin, killWaitMs } = {}) {
  const bin = hostBin ?? resolveRouteHostBin();
  const argv = ['internal', 'adopt', '--protocol', String(PROTOCOL), ...args];
  if (killWaitMs !== undefined) argv.push('--kill-wait-ms', String(killWaitMs));
  const res = spawnSync(bin, argv, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: ROUTE_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
  });
  const lines = String(res.stdout ?? '').split('\n').filter(Boolean).map((text) => {
    try { return JSON.parse(text); } catch { return null; }
  });
  const failure = lines.find((line) => line?.result === 'error');
  if (failure?.code === 'host-version-mismatch') {
    throw new RunSupervisorError('host-version-mismatch', `${bin} refused protocol ${PROTOCOL}: the active release is older than this payload`);
  }
  const stderr = String(res.stderr ?? '').trim().slice(0, 300);
  if (res.error || res.status !== 0 || failure || lines.includes(null)) {
    const how = res.error ? res.error.message : res.signal ? `signal ${res.signal}` : `exit ${res.status}`;
    throw new RunSupervisorError('adopt-route-failed', `${bin} internal adopt: ${how}${failure ? ` (${failure.code})` : ''}${stderr ? `: ${stderr}` : ''}`, { status: res.status, stderr });
  }
  return lines;
}

/** Judge one attempt directory (and adopt it unless `probeOnly`): `{attemptDir, state, outcome?, pendingStep?, reason?}`. */
export function adoptRun(runDir, { probeOnly = false, ...options } = {}) {
  const lines = runAdopt(['--run-dir', path.resolve(runDir), ...(probeOnly ? ['--probe-only'] : [])], options);
  if (lines.length !== 1) {
    throw new RunSupervisorError('adopt-route-failed', `adopt answered ${lines.length} lines for one run directory`);
  }
  return lines[0];
}

// Attempt directories (`runs/<name>` under `assignmentsRoot`) with no `closed.json`.
export function listOpenAttemptDirs(assignmentsRoot) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = path.join(dir, entry.name);
      if (entry.name !== 'runs') { walk(child); continue; }
      let attempts;
      try { attempts = fs.readdirSync(child, { withFileTypes: true }); } catch { continue; }
      for (const attempt of attempts) {
        if (!attempt.isDirectory()) continue;
        const attemptDir = path.join(child, attempt.name);
        if (!fs.existsSync(path.join(attemptDir, 'closed.json'))) found.push(attemptDir);
      }
    }
  };
  walk(assignmentsRoot);
  return found.sort();
}

/** Judge every attempt directory that is not closed, in one route process: one verdict per directory, in listing order. */
export function adoptScan({ assignmentsRoot, probeOnly = false, ...options }) {
  const dirs = listOpenAttemptDirs(assignmentsRoot);
  if (dirs.length === 0) return [];
  const lines = runAdopt(['--scan', ...(probeOnly ? ['--probe-only'] : [])], { ...options, input: `${dirs.join('\n')}\n` });
  if (lines.length !== dirs.length) {
    throw new RunSupervisorError('adopt-route-failed', `adopt answered ${lines.length} lines for ${dirs.length} run directories`);
  }
  return lines;
}

/**
 * The one door that cleans up after attempts nobody finished: adopt judges every attempt directory that
 * is not closed and finishes the steps a dead supervisor left. Only adopt's finalize-home step removes a
 * private home, and only while the attempt's lock is free and its process domain is empty.
 * `assignmentsRoot` absent: no attempt directories are looked at. The attempt sockets no supervisor holds any
 * more are removed too (`socketOptions` names the runtime directory's environment for a caller that owns one).
 * An adopt or cleanup failure never throws.
 * @returns {{adopt: Array<object>|null, adoptError: string|null}}
 */
export function sweepAttempts({ assignmentsRoot, adoptOptions = {}, socketOptions } = {}) {
  let adopt = null;
  let adoptError = null;
  if (assignmentsRoot) {
    try {
      adopt = adoptScan({ assignmentsRoot, ...adoptOptions });
    } catch (err) {
      adoptError = err?.code ?? String(err?.message ?? err);
    }
  }
  try {
    removeOrphanAttemptSockets(socketOptions);
  } catch {
    // a socket that cannot be removed is harmless until an attempt reuses its name
  }
  return { adopt, adoptError };
}
