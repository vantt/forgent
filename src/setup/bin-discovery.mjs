// bin-discovery.mjs — 3-tier deterministic fgos bin resolution (tsk-2qc-1,
// D2/D4 of docs/history/install-setup-external-project-reliability/
// CONTEXT.md).
//
// Tier 1 (dev-checkout self-hosting) and tier 2 (project-local install) are
// cheap file-checks, re-run on every call -- no caching needed. Tier 3
// (global install) is the only tier that needs a PATH lookup (a real
// subprocess spawn), so it is config-cached (D4): `fgos setup`/`doctor
// --fix` populate the global config's `bin.globalFgosPath` once via
// `refreshGlobalBinCache`; every other caller reads that cached path first
// and only falls back to a live PATH probe when the cached path no longer
// exists on disk (self-heal via a cheap `existsSync` check) or the cache
// was never populated at all.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadGlobalConfig, writeGlobalConfig } from '../config/global-config.mjs';
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

/**
 * Tier 3, cache-first (D4): the cached path, only if it still exists on
 * disk. Never spawns a subprocess -- a stale/missing cache resolves to
 * `null` here, letting the caller fall back to `probeGlobalBin`.
 */
export function cachedGlobalBin(globalConfigPath = undefined) {
  const cached = loadGlobalConfig(globalConfigPath)?.bin?.globalFgosPath;
  return typeof cached === 'string' && cached && fs.existsSync(cached) ? cached : null;
}

/**
 * Populate (or refresh) the global config's cached tier-3 path. The one
 * write this module performs -- called only from `fgos setup`/`doctor
 * --fix` (D4: "multi-tier probing is a one-time populate/repair step",
 * never run on every call). Clears the cached key when nothing resolves,
 * rather than leaving a stale path behind.
 *
 * Only writes when the resolved value actually differs from what is
 * already cached (`fgos setup` calls every registered fix unconditionally
 * on every run, `bin/fgos.mjs`'s own `runFixes(repoRoot)` call -- an
 * unconditional write here would break `fgos setup`'s own idempotency
 * guarantee, "run twice does not rewrite an already-complete config",
 * the same discipline `ensureSharedConfigDefaults`/`insertSourceLine`
 * already apply to their own write paths).
 */
export function refreshGlobalBinCache(globalConfigPath = undefined) {
  const resolved = probeGlobalBin();
  const existing = loadGlobalConfig(globalConfigPath);
  const currentCached = existing.bin?.globalFgosPath ?? null;
  if ((resolved ?? null) === currentCached) {
    return { resolved, changed: false };
  }
  const bin = { ...(existing.bin ?? {}) };
  if (resolved) {
    bin.globalFgosPath = resolved;
  } else {
    delete bin.globalFgosPath;
  }
  writeGlobalConfig({ ...existing, bin }, globalConfigPath);
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
export function resolveFgosBin(cwd, { globalConfigPath = undefined } = {}) {
  const workspaceBin = resolveWorkspaceInstallationBin(cwd);
  if (workspaceBin) return { tier: 0, path: workspaceBin };
  const devBin = resolveDevCheckoutBin(cwd);
  if (devBin) return { tier: 1, path: devBin };
  const projectLocalBin = resolveProjectLocalBin(cwd);
  if (projectLocalBin) return { tier: 2, path: projectLocalBin };
  const cached = cachedGlobalBin(globalConfigPath);
  if (cached) return { tier: 3, path: cached };
  const live = probeGlobalBin();
  if (live) return { tier: 3, path: live };
  return null;
}
