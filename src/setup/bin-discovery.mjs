// bin-discovery.mjs — 3-tier deterministic fgos bin resolution (tsk-2qc-1,
// D2/D4 of docs/history/install-setup-external-project-reliability/
// CONTEXT.md).
//
// Tier 1 (dev-checkout self-hosting) and tier 2 (project-local install) are
// cheap file-checks, re-run on every call -- no caching needed. Tier 3
// (global install) is the only tier that needs a PATH lookup (a real
// subprocess spawn), so it is cached (D4): `fgos setup`/`doctor --fix`
// populate `~/.fgos/runtime/bin-cache.json` (a cache, never config) once via
// `refreshGlobalBinCache`; every other caller reads that cached path first
// and only falls back to a live PATH probe when the cached path no longer
// exists on disk (self-heal via a cheap `existsSync` check) or the cache
// was never populated at all.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { replaceDurably } from '../native/door.mjs';
import { hostBinFromActivation } from '../util/host-bin-path.mjs';

/**
 * Tier 0: the Rust host binary the workspace's fgctl activation runs, by the
 * same rule as the fgctl shim (src/util/host-bin-path.mjs): a ready
 * `<cwd>/.fgos/installation/activation.json`, binary at
 * `<releasePath>/bin/fgos`, executable and really inside the release (a
 * symlink escaping it is refused).
 */
export function resolveWorkspaceInstallationBin(cwd) {
  return hostBinFromActivation(path.join(cwd, '.fgos', 'installation'));
}

/**
 * Tier 1: dev-checkout self-hosting -- `cwd` itself is a forgent checkout.
 */
export function resolveDevCheckoutBin(cwd) {
  const candidate = path.join(cwd, 'bin', 'fgos.mjs');
  return fs.existsSync(candidate) ? candidate : null;
}

/**
 * Tier 2: project-local install (`node_modules/.bin/fgos`, kept as a real
 * mode for cross-project version pinning per D2). Walks up from `startDir`
 * the same way Node's own module resolution does -- bounded by the
 * filesystem root, never infinite.
 */
export function resolveProjectLocalBin(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, 'node_modules', '.bin', 'fgos');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Tier 3, live: a real `command -v fgos` PATH probe (a subprocess spawn --
 * never called on a hot path without the cache-first check below first).
 */
export function probeGlobalBin() {
  const dirs = typeof process.env.PATH === 'string' && process.env.PATH
    ? process.env.PATH.split(path.delimiter).filter(Boolean)
    : [];
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').filter(Boolean)
    : [''];
  for (const dir of dirs) {
    const candidates = process.platform === 'win32' ? ['', ...exts] : [''];
    for (const ext of candidates) {
      const candidatePath = path.join(dir, `fgos${ext}`);
      try {
        fs.accessSync(candidatePath, fs.constants.X_OK);
        return candidatePath;
      } catch {
        // keep scanning
      }
    }
  }
  return null;
}

const BIN_CACHE_DIR = 'runtime';
const BIN_CACHE_NAME = 'bin-cache.json';
const defaultGlobalDir = () => path.join(os.homedir(), '.fgos');
const binCachePath = (globalDir) => path.join(globalDir, BIN_CACHE_DIR, BIN_CACHE_NAME);

/** The cached path, or null when the cache is absent, unreadable or not a path string: a cache never fails its reader. */
function readBinCache(globalDir) {
  try {
    const cached = JSON.parse(fs.readFileSync(binCachePath(globalDir), 'utf8'))?.globalFgosPath;
    return typeof cached === 'string' && cached ? cached : null;
  } catch {
    return null;
  }
}

/**
 * Tier 3, cache-first (D4): the cached path, only if it still exists on
 * disk. Never spawns a subprocess -- a stale/missing cache resolves to
 * `null` here, letting the caller fall back to `probeGlobalBin`.
 */
export function cachedGlobalBin({ globalDir = defaultGlobalDir() } = {}) {
  const cached = readBinCache(globalDir);
  return cached && fs.existsSync(cached) ? cached : null;
}

/**
 * Populate (or refresh) the cached tier-3 path in
 * `<globalDir>/runtime/bin-cache.json` (`{ "globalFgosPath": "<abs>" }`,
 * mode 0600). The one write this module performs -- called only from
 * `fgos setup`/`doctor --fix` (D4: "multi-tier probing is a one-time
 * populate/repair step", never run on every call). Deletes the file when
 * nothing resolves, rather than leaving a stale path behind.
 *
 * Only writes when the resolved value actually differs from what is
 * already cached (`fgos setup` runs every registered fix unconditionally,
 * so an unconditional write would break its idempotency guarantee).
 */
export function refreshGlobalBinCache({ globalDir = defaultGlobalDir() } = {}) {
  const resolved = probeGlobalBin();
  if ((resolved ?? null) === readBinCache(globalDir)) {
    return { resolved, changed: false };
  }
  if (resolved) {
    const dir = path.join(globalDir, BIN_CACHE_DIR);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    replaceDurably(dir, BIN_CACHE_NAME, `${JSON.stringify({ globalFgosPath: resolved })}\n`, 0o600);
  } else {
    fs.rmSync(binCachePath(globalDir), { force: true });
  }
  return { resolved, changed: true };
}

/**
 * The full 4-tier resolution (D2 plus the tier-0 workspace-installation
 * shim), in priority order:
 * workspace installation (tier 0) > dev-checkout (tier 1) >
 * project-local (tier 2) > global (tier 3, cache-first with a live
 * fallback so a cold cache never hard-fails). Returns `{ tier, path }` or
 * `null` when nothing resolves at any tier.
 */
export function resolveFgosBin(cwd, { globalDir = defaultGlobalDir() } = {}) {
  const workspaceBin = resolveWorkspaceInstallationBin(cwd);
  if (workspaceBin) return { tier: 0, path: workspaceBin };
  const devBin = resolveDevCheckoutBin(cwd);
  if (devBin) return { tier: 1, path: devBin };
  const projectLocalBin = resolveProjectLocalBin(cwd);
  if (projectLocalBin) return { tier: 2, path: projectLocalBin };
  const cached = cachedGlobalBin({ globalDir });
  if (cached) return { tier: 3, path: cached };
  const live = probeGlobalBin();
  if (live) return { tier: 3, path: live };
  return null;
}
