import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveWorkspaceInstallationBin } from '../setup/bin-discovery.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const HOST_TIMEOUT_MS = 5_000;
const CONVENTION_UNKNOWN_VERB =
  'fgos: unknown verb "convention". Usage: fgos <command> [args...]';

/**
 * Resolves the host binary path according to the precedence:
 * 1. process.env.FGOS_HOST_BIN (if set, exists, and is a file).
 * 2. Active release manifest in <mainCheckoutRoot>/.fgos/installation (resolveWorkspaceInstallationBin).
 * 3. Never falls back to searching target/ or $PATH.
 *
 * Returns absolute path to binary or null.
 */
export function resolveHostBin(dir = process.cwd(), options = {}) {
  if (process.env.FGOS_HOST_BIN) {
    const candidate = path.resolve(process.env.FGOS_HOST_BIN);
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {}
  }

  const cleanDir = typeof dir === 'string' && dir.endsWith('.fgos') ? path.dirname(dir) : dir;
  const mainRoot = resolveMainCheckoutRoot(cleanDir) || cleanDir;
  try {
    const bin = resolveWorkspaceInstallationBin(mainRoot);
    if (bin && fs.existsSync(bin) && fs.statSync(bin).isFile()) {
      return bin;
    }
  } catch {}

  // Hermetic resolution support: when packageRoot is specified via options
  // or FGOS_PACKAGE_ROOT env, search only that root instead of falling back to
  // developer workstation's process.cwd() or PACKAGE_ROOT.
  const customPackageRoot = options?.packageRoot !== undefined
    ? options.packageRoot
    : (process.env.FGOS_PACKAGE_ROOT ? path.resolve(process.env.FGOS_PACKAGE_ROOT) : undefined);

  const fallbackDirs = customPackageRoot !== undefined
    ? (customPackageRoot ? [customPackageRoot] : [])
    : [process.cwd(), PACKAGE_ROOT];

  // If dir was a temporary directory (e.g. in tests) with no installation,
  // check the active workspace installation of fallback directories
  for (const fallbackDir of fallbackDirs) {
    try {
      const root = resolveMainCheckoutRoot(fallbackDir);
      if (root && root !== mainRoot) {
        const bin = resolveWorkspaceInstallationBin(root);
        if (bin && fs.existsSync(bin) && fs.statSync(bin).isFile()) {
          return bin;
        }
      }
    } catch {}
  }
  return null;
}

/**
 * Invokes the Rust host binary with `args`, forwarding `--dir <mainCheckoutRoot>`.
 *
 * @param {string[]} args CLI arguments for fgos (e.g. ['metrics', 'ping'])
 * @param {object} [options]
 * @param {string|Buffer} [options.input] stdin payload
 * @param {string} [options.dir] starting directory (defaults to process.cwd())
 * @returns {object} data field from the returned fgos.v1 envelope
 */
export function invokeHost(args, { input, dir = process.cwd(), packageRoot } = {}) {
  const hostBin = resolveHostBin(dir, { packageRoot });
  if (!hostBin) {
    const err = new Error('Rust host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)');
    err.code = 'host-unavailable';
    throw err;
  }

  const cleanDir = typeof dir === 'string' && dir.endsWith('.fgos') ? path.dirname(dir) : dir;
  const mainRoot = resolveMainCheckoutRoot(cleanDir) || cleanDir;
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
