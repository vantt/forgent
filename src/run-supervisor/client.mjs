// Thin client of the adopt door: `fgos internal adopt` does the work, this
// module lists attempt directories, calls the route and names what went wrong.
// It never reads or writes an attempt directory's state itself.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveHostBin } from '../util/host-bin.mjs';

const PROTOCOL = 1;
const ROUTE_TIMEOUT_MS = 10 * 60 * 1000;
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

/**
 * Judge one attempt directory (and adopt it unless `probeOnly`).
 * @returns {{attemptDir:string,state:string,outcome?:string,pendingStep?:string,reason?:string}}
 */
export function adoptRun(runDir, { probeOnly = false, ...options } = {}) {
  const lines = runAdopt(['--run-dir', path.resolve(runDir), ...(probeOnly ? ['--probe-only'] : [])], options);
  if (lines.length !== 1) {
    throw new RunSupervisorError('adopt-route-failed', `adopt answered ${lines.length} lines for one run directory`);
  }
  return lines[0];
}

// Attempt directories (`runs/<name>`, anywhere under `assignmentsRoot`) that have no `closed.json`.
export function listOpenAttemptDirs(assignmentsRoot) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = path.join(dir, entry.name);
      if (entry.name !== 'runs') { walk(child); continue; }
      for (const attempt of fs.readdirSync(child, { withFileTypes: true })) {
        if (!attempt.isDirectory()) continue;
        const attemptDir = path.join(child, attempt.name);
        if (!fs.existsSync(path.join(attemptDir, 'closed.json'))) found.push(attemptDir);
      }
    }
  };
  walk(assignmentsRoot);
  return found.sort();
}

/**
 * Judge every attempt directory that is not closed, in one route process.
 * @returns {Array<object>} one verdict per directory, in listing order
 */
export function adoptScan({ assignmentsRoot, probeOnly = false, ...options }) {
  const dirs = listOpenAttemptDirs(assignmentsRoot);
  if (dirs.length === 0) return [];
  const lines = runAdopt(['--scan', ...(probeOnly ? ['--probe-only'] : [])], { ...options, input: `${dirs.join('\n')}\n` });
  if (lines.length !== dirs.length) {
    throw new RunSupervisorError('adopt-route-failed', `adopt answered ${lines.length} lines for ${dirs.length} run directories`);
  }
  return lines;
}
