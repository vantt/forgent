import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolveMainCheckoutRoot, fgosDirFromRoot } from '../runner/paths.mjs';
import { resolveActiveHostBin } from './host-bin-path.mjs';

const HOST_TIMEOUT_MS = 5_000;
const CONVENTION_UNKNOWN_VERB =
  'fgos: unknown verb "convention". Usage: fgos <command> [args...]';

/**
 * The host binary of the project `dir` sits in, through the one activation reader
 * (`resolveActiveHostBin`): FGOS_HOST_BIN, else the activation of the main checkout's
 * `.fgos/installation`, else the nearest activation above `dir`. Never another
 * checkout's host, never `target/` or `$PATH`. Returns an absolute path or null.
 */
export function resolveHostBin(dir = process.cwd()) {
  const cleanDir = typeof dir === 'string' && dir.endsWith('.fgos') ? path.dirname(dir) : dir;
  const mainRoot = resolveMainCheckoutRoot(cleanDir) || cleanDir;
  return resolveActiveHostBin({ fgosDir: fgosDirFromRoot(mainRoot), cwd: cleanDir }).bin;
}

/**
 * Hands `args` to the host unchanged, with the terminal and the whole environment inherited, for a call the host
 * answers itself (help). The environment keeps the recursion guard of a host that started this process: a host
 * too old to answer help itself forwards it back to Node, and with the guard still set it refuses the second hop
 * instead of starting Node again without end. A host that answers help never reads the guard. Returns `{ status }`
 * with the host's exit code, `{ code: 'host-unavailable' }` when no host resolves, or
 * `{ code: 'host-exec-error', message }` when it cannot run.
 */
export function runHostInherited(args, { dir = process.cwd() } = {}) {
  const hostBin = resolveHostBin(dir);
  if (!hostBin) return { code: 'host-unavailable' };
  const child = spawnSync(hostBin, args, { stdio: 'inherit' });
  if (child.error) return { code: 'host-exec-error', message: child.error.message };
  return { status: child.status ?? 1 };
}

/**
 * Invokes the Rust host binary with `args`. Store clients default to the main
 * checkout; tree-local readers explicitly select `dirScope: 'caller'`.
 *
 * @param {string[]} args CLI arguments for fgos (e.g. ['metrics', 'ping'])
 * @param {object} [options]
 * @param {string|Buffer} [options.input] stdin payload
 * @param {string} [options.dir] starting directory (defaults to process.cwd())
 * @param {'main-checkout'|'caller'} [options.dirScope] root to measure (default main-checkout)
 * @returns {object} data field from the returned fgos.v1 envelope
 */
export function invokeHost(args, { input, dir = process.cwd(), dirScope = 'main-checkout' } = {}) {
  const hostBin = resolveHostBin(dir);
  if (!hostBin) {
    const err = new Error('Rust host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)');
    err.code = 'host-unavailable';
    throw err;
  }

  const cleanDir = typeof dir === 'string' && dir.endsWith('.fgos') ? path.dirname(dir) : dir;
  const mainRoot = dirScope === 'caller' ? path.resolve(cleanDir) : resolveMainCheckoutRoot(cleanDir) || cleanDir;
  const separator = args.indexOf('--');
  const fullArgs = separator === -1
    ? [...args, '--dir', mainRoot]
    : [...args.slice(0, separator), '--dir', mainRoot, ...args.slice(separator)];

  let stdout;
  try {
    stdout = execFileSync(hostBin, fullArgs, {
      input,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
      timeout: HOST_TIMEOUT_MS,
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString('utf8') : '';
    const versionMismatch =
      (err.status === 4 && stderr.trim() === CONVENTION_UNKNOWN_VERB)
      || (
        err.status === 4
        && args[0] === 'metrics'
        && args[1] === 'coverage'
        && stderr.trim().startsWith('fgos: unknown metrics subcommand "coverage". Available:')
      );
    if (versionMismatch) {
      const mismatchErr = new Error(`Host version mismatch: ${stderr.trim()}`);
      mismatchErr.code = 'host-version-mismatch';
      mismatchErr.stderr = stderr;
      mismatchErr.status = err.status;
      throw mismatchErr;
    }
    const timedOut = err.code === 'ETIMEDOUT';
    const hostErr = new Error(
      timedOut
        ? `Rust host timed out after ${HOST_TIMEOUT_MS}ms`
        : (stderr.trim() || err.message)
    );
    hostErr.code = 'host-exec-error';
    hostErr.causeCode = err.code;
    hostErr.timedOut = timedOut;
    hostErr.status = err.status;
    hostErr.stderr = stderr;
    throw hostErr;
  }

  let envelope;
  try {
    envelope = JSON.parse(stdout);
  } catch (parseErr) {
    const err = new Error(`Failed to parse host envelope JSON: ${parseErr.message}\nRaw stdout: ${stdout}`);
    err.code = 'host-invalid-envelope';
    throw err;
  }
  if (
    !envelope
    || typeof envelope !== 'object'
    || envelope.contract !== 'fgos.v1'
    || !Object.hasOwn(envelope, 'data')
  ) {
    const err = new Error('Host returned an invalid fgos.v1 envelope');
    err.code = 'host-invalid-envelope';
    throw err;
  }
  return envelope.data;
}
