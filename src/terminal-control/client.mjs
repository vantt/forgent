// client.mjs -- thin Node client of `fgos internal terminal-control`.
//
// One process per operation: the request goes to the host binary on stdin,
// one JSON line comes back. Every decision (grouping, placement, what may be
// closed) lives in the Rust core; this module only carries the call. A port
// result (`unsupported`, `unknown` included) is returned as the route gave it.

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';
import { resolveTerminalConfig } from './config.mjs';

const PROTOCOL = 1;
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export class TerminalControlError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'TerminalControlError';
    this.code = code;
    Object.assign(this, extra);
  }
}

let resolvedHostBin = null;

/** The host binary, resolved once per process (the S6 rule): the active
 * release, or FGOS_HOST_BIN. */
function activeHostBin() {
  if (resolvedHostBin) return resolvedHostBin;
  const { bin, tried } = resolveActiveHostBin();
  if (!bin) {
    throw new TerminalControlError(
      'terminal-control-no-host-binary',
      `no fgos host binary found (tried: ${tried.join('; ')}); run through an activated workspace or set FGOS_HOST_BIN`,
      { tried },
    );
  }
  resolvedHostBin = bin;
  return bin;
}

function interpret({ status, signal, stdout, stderr, error, timedOut }, bin, op) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw new TerminalControlError('terminal-control-no-host-binary', `cannot run ${bin} (${error.code})`);
  }
  if (timedOut || (error && error.code === 'ETIMEDOUT')) {
    throw new TerminalControlError('terminal-control-route-timeout', `${bin} terminal-control ${op} did not answer in time and was killed`);
  }
  if (error) {
    throw new TerminalControlError('terminal-control-route-error', `${bin} terminal-control ${op} failed to run: ${error.message}`);
  }
  const text = String(stdout ?? '').trim();
  const err = String(stderr ?? '').trim();
  if (text === '') {
    if (/unknown verb "internal"/.test(err) || /unknown internal route/.test(err)) {
      throw new TerminalControlError('host-version-mismatch', `${bin} has no terminal-control route: the active release is older than this payload; restage/activate it or set FGOS_HOST_BIN to a host built from this checkout`);
    }
    const how = signal ? `signal ${signal}` : `exit ${status}`;
    throw new TerminalControlError('terminal-control-route-bad-output', `${bin} terminal-control ${op} printed nothing (${how})${err ? `: ${err.slice(0, 300)}` : ''}`);
  }
  let line;
  try {
    line = JSON.parse(text.split('\n').filter(Boolean).pop());
  } catch {
    throw new TerminalControlError('terminal-control-route-bad-output', `${bin} terminal-control ${op} answered non-JSON: ${text.slice(0, 200)}`);
  }
  if (line.result === 'error') {
    // The route's own refusal codes keep their name; everything else it refuses is a usage error.
    const code = line.code === 'host-version-mismatch' || String(line.code).startsWith('terminal-config-') ? line.code : 'terminal-control-route-usage';
    throw new TerminalControlError(code, `${bin} terminal-control ${op}: ${line.message}`, { routeMessage: line.message });
  }
  const { v, protocol, op: _op, ...result } = line;
  if (typeof result.result !== 'string') {
    throw new TerminalControlError('terminal-control-route-bad-output', `${bin} terminal-control ${op} answered without a result: ${text.slice(0, 200)}`);
  }
  return result;
}

/**
 * createTerminalControl({ hostBin, herdrBin, env, config, timeoutMs }) ->
 *   { allocate, attach, read, inspect, focus, release, capabilities, reconcileScan }
 *
 * `hostBin` defaults to the active release's host (resolved on first call).
 * `herdrBin` is the caller's resolved herdr binary; `env` the driver's
 * environment overrides (HERDR_SESSION, HERDR_SOCKET_PATH of a confined
 * round); `config` the optional core settings the route accepts
 * (minCols, minRows, maxPanesPerTab, policy, allocationGraceMs,
 * launchIdentifyTimeoutMs).
 */
export function createTerminalControl({ hostBin, herdrBin, env, config, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const bin = () => hostBin ?? activeHostBin();

  const prepare = (op, request) => {
    const envelope = { v: PROTOCOL, driver: 'herdr', timeoutMs, request };
    if (herdrBin) envelope.herdrBin = herdrBin;
    if (env) envelope.env = env;
    if (config) envelope.config = config;
    const hostPath = bin();
    return {
      hostPath,
      argv: ['internal', 'terminal-control', op, '--protocol', String(PROTOCOL), '--json'],
      input: JSON.stringify(envelope),
    };
  };

  const callSync = (op, request = {}) => {
    const { hostPath, argv, input } = prepare(op, request);
    const res = spawnSync(hostPath, argv, {
      input,
      env: routeEnv(),
      encoding: 'utf8',
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
    });
    return interpret({ ...res, timedOut: res.error?.code === 'ETIMEDOUT' }, hostPath, op);
  };

  const client = {
    allocate: (request) => callSync('allocate', request),
    attach: (request) => callSync('attach', request),
    read: (request) => callSync('read', request),
    inspect: (request) => callSync('inspect', request),
    /** Bring the pane of a key this client allocated or attached to the front: `focused`, `unsupported` or `unknown`. */
    focus: (request) => callSync('focus', request),
    release: (request) => callSync('release', request),
    capabilities: (request = {}) => callSync('capabilities', request),
    reconcileScan: (request) => callSync('reconcile-scan', request),
  };
  return client;
}

const FINDING_TEXT = {
  'allocated-not-launched-bare-shell': 'a slot was allocated but never launched and its pane is a bare shell',
  'retain-expired': 'a retained pane is past its retain time',
  'stale-incarnation': 'a record belongs to a herdr server that is gone',
  unknown: 'a record could not be judged',
};

/**
 * What the terminal-control scan finds past `terminal.allocationGraceMs`: slots allocated but never launched,
 * retained panes past their time, records of a herdr server that is gone. Reads only; nothing is closed (the
 * repair stays adopt). `{ state: 'scanned', graceMs, findings }` with each finding's `key`, `paneId`, `kind`,
 * `text` and `detail`, or `{ state: 'not-scanned', level: 'warning'|'info', reason }` when the route did not
 * answer or the terminal config cannot be read.
 */
export function scanTerminalAllocations(repoRoot, { globalConfigPath, terminalControl } = {}) {
  const notScanned = (level, reason) => ({ state: 'not-scanned', level, reason });
  let defaults;
  try {
    ({ defaults } = terminalControl.capabilities());
  } catch (err) {
    return notScanned('warning', `the terminal-control route did not answer, allocations not scanned (${err.message})`);
  }
  let graceMs;
  try {
    graceMs = resolveTerminalConfig(path.resolve(repoRoot), { globalConfigPath, defaults }).values.allocationGraceMs;
  } catch (err) {
    return notScanned('warning', `terminal.* unreadable, allocations not scanned: ${err.message}`);
  }
  if (!Number.isInteger(graceMs) || graceMs < 0) return notScanned('warning', 'terminal.allocationGraceMs is invalid (see terminal-control), allocations not scanned');
  let scan;
  try {
    scan = terminalControl.reconcileScan({ olderThanMs: graceMs });
  } catch (err) {
    return notScanned('warning', `the terminal-control route did not answer, allocations not scanned (${err.message})`);
  }
  if (scan.result === 'unsupported') return notScanned('info', `allocations not scanned: terminal mode is unsupported here (${scan.detail ?? scan.capability})`);
  if (scan.result !== 'scan') return notScanned('warning', `allocation scan answered ${scan.result}${scan.reason ? ` (${scan.reason})` : ''}`);
  return {
    state: 'scanned',
    graceMs,
    findings: scan.findings.map((f) => ({ key: f.key, paneId: f.paneId ?? null, kind: f.kind, text: FINDING_TEXT[f.kind] ?? f.kind, detail: f.detail ?? null })),
  };
}
