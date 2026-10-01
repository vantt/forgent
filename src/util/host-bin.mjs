import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveWorkspaceInstallationBin } from '../setup/bin-discovery.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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
  const fullArgs = [...args, '--dir', mainRoot];

  let stdout;
  try {
    stdout = execFileSync(hostBin, fullArgs, {
      input,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString('utf8') : '';
    if (stderr.includes('unknown') && stderr.includes('subcommand')) {
      const mismatchErr = new Error(`Host version mismatch: ${stderr.trim()}`);
      mismatchErr.code = 'host-version-mismatch';
      mismatchErr.stderr = stderr;
      mismatchErr.status = err.status;
      throw mismatchErr;
    }
    const hostErr = new Error(stderr.trim() || err.message);
    hostErr.code = err.code || 'host-exec-error';
    hostErr.status = err.status;
    hostErr.stderr = stderr;
    throw hostErr;
  }

  try {
    const envelope = JSON.parse(stdout);
    if (envelope && typeof envelope === 'object' && 'data' in envelope) {
      return envelope.data;
    }
    return envelope;
  } catch (parseErr) {
    const err = new Error(`Failed to parse host envelope JSON: ${parseErr.message}\nRaw stdout: ${stdout}`);
    err.code = 'host-invalid-envelope';
    throw err;
  }
}
