// agy-permissions.mjs — infra layer: real settings.json I/O for wiring the
// `agy` (Antigravity Cli) executor's command-permission denylist (tsk-1xm,
// docs/history/agy-permission-capability-allowlist/). Mirrors git-hooks.mjs's
// two-entry-point shape:
//   - fixAgyPermissionsConfigured: the writer, run by `fgos doctor --fix`
//     and unconditionally by `fgos setup` (registerFix, same as every other
//     registered fix).
//   - checkAgyPermissionsConfigured: the read-only check, used by `fgos
//     doctor`.
//
// RESEARCH.md Round 4 (live-proven, 2026-08-18): `agy`'s `--dangerously-
// skip-permissions` flag is NOT replaceable by a true default-deny
// ALLOWLIST in headless (`-p`) mode -- `toolPermission: "strict"` and the
// settings.json default `"request-review"` both blanket-deny every
// `command`-type tool call regardless of `permissions.allow` content (6
// rule shapes tried, 0 successes). The one mode that lets commands run at
// all, `toolPermission: "always-proceed"`, runs every command BY DEFAULT
// (confirmed: an unlisted `whoami` probe succeeded) and only
// `permissions.deny` changes that outcome (confirmed: a denied pattern was
// refused with a named reason). This module therefore provisions a
// DENYLIST, not an allowlist -- default-allow, explicit-deny -- which is
// strictly narrower than today's unconditional `--dangerously-skip-
// permissions` (zero boundary at all) but not the default-deny surface the
// item's own framing originally assumed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { mergeConfigDefaults } from './config-merge.mjs';
import { readSharedConfig } from '../config/shared-config-file.mjs';

/**
 * Deny-rules chosen to mirror this repo's own already-documented incident
 * history (AGENTS.md's "Never run a raw git reset --hard.../Never git
 * stash..." guidance -- tsk-3au, tsk-56u) plus the other classes of
 * irreversible or exfiltration-prone commands a headless worker should
 * never run unattended: destructive recursive deletes, privilege
 * escalation, force-pushing, and raw network egress. `regex:` prefix
 * matches agy's own documented opt-in syntax (RESEARCH.md Round 1's
 * changelog citation) -- bare-token/exact-literal deny rules were never
 * tested as thoroughly, and a regex lets each rule target the dangerous
 * shape specifically rather than the whole command family.
 */
export const AGY_PERMISSIONS_DENYLIST = [
  'command(regex:^rm .*-rf)',
  'command(regex:^sudo )',
  'command(regex:^git push .*(--force|-f\\b))',
  'command(regex:^git reset .*--hard)',
  'command(regex:^git stash)',
  'command(regex:^curl )',
  'command(regex:^wget )',
];

/**
 * The fill-only default shape merged into agy's settings.json
 * (`mergeConfigDefaults` semantics: a key already present -- including an
 * empty array -- is left byte-identical, never touched or topped up).
 */
export const AGY_PERMISSIONS_DEFAULT = {
  toolPermission: 'always-proceed',
  permissions: {
    deny: AGY_PERMISSIONS_DENYLIST,
  },
};

/**
 * Absolute path to agy's one real on-disk settings file (RESEARCH.md
 * Round 1: confirmed the only agy settings file on this machine, shared
 * across every workspace/session, no per-project override exists).
 */
export function agySettingsPath(homeDir = os.homedir()) {
  return path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
}

/**
 * Reads and parses agy's settings.json for the given home directory
 * (defaults to real $HOME). Never throws: a missing file reads as `{}`
 * (nothing configured yet), and an unparseable file also reads as `{}`
 * rather than crashing `doctor`/`setup` on a file this module does not
 * own the shape of.
 */
export function readAgySettings(homeDir = os.homedir()) {
  const settingsPath = agySettingsPath(homeDir);
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Read-only check (RUL9: doctor never writes) — passes once
 * `toolPermission` is `"always-proceed"` and `permissions.deny` is a
 * non-empty array. Does not require every `AGY_PERMISSIONS_DENYLIST`
 * entry to be present verbatim: a user who already customized the deny
 * list has made a deliberate choice `fixAgyPermissionsConfigured`'s own
 * fill-only merge would never overwrite, and re-flagging that as a
 * failure would fight the same "never touch a value the user already
 * has" contract the fix follows.
 */
export function checkAgyPermissionsConfigured(homeDir = os.homedir()) {
  const settings = readAgySettings(homeDir);
  const toolPermission = settings.toolPermission;
  const denyList = settings.permissions?.deny;
  const denyConfigured = Array.isArray(denyList) && denyList.length > 0;
  if (toolPermission === 'always-proceed' && denyConfigured) {
    return {
      passed: true,
      message: `agy settings.json: toolPermission=always-proceed, ${denyList.length} deny rule(s) configured`,
    };
  }
  return {
    passed: false,
    message:
      'agy settings.json missing a working command denylist (toolPermission must be "always-proceed" with a non-empty permissions.deny — RESEARCH.md Round 4: "strict"/"request-review" blanket-deny every command in headless mode, and permissions.allow has no effect) — run fgos doctor --fix or fgos setup',
  };
}

/**
 * Fill-only writer (RUL9: `setup` is the one write verb). Merges
 * `AGY_PERMISSIONS_DEFAULT` into whatever agy's settings.json already
 * has via the same `mergeConfigDefaults` every other config-default in
 * this repo uses — `trustedWorkspaces` and any other existing key (or an
 * already-customized `toolPermission`/`permissions.deny`) is kept
 * byte-identical. Idempotent: a second run makes no further change once
 * both keys are present.
 */
export function fixAgyPermissionsConfigured(homeDir = os.homedir()) {
  const settingsPath = agySettingsPath(homeDir);
  const existing = readAgySettings(homeDir);
  const { merged, addedKeys } = mergeConfigDefaults(existing, AGY_PERMISSIONS_DEFAULT);
  if (addedKeys.length === 0) {
    return { changed: false, message: 'agy settings.json already has toolPermission + permissions.deny — nothing to fix' };
  }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(merged, null, 2)}\n`);
  return { changed: true, message: `agy settings.json: added ${addedKeys.join(', ')}` };
}

/**
 * Resolves a raw HOME path (e.g. "${HOME}/.agy-homes/mucdong" or "~/.agy-homes/mucdong")
 * using the provided home directory.
 */
export function resolveSubHomePath(rawPath, homeDir = process.env.HOME || os.homedir()) {
  if (typeof rawPath !== 'string') return '';
  return rawPath
    .replace(/\$\{HOME\}/g, homeDir)
    .replace(/\$HOME\b/g, homeDir)
    .replace(/^~(?=\/|$)/, homeDir);
}

/**
 * Finds all agy sub-HOMEs referenced in executor configs (from `.fgos/config.json` env.HOME fields).
 *
 * Scans `runner.executor` and `runner.executors.*` (including their `invocations`), looking for
 * `env.HOME` declared on agy invocations or pointing to agy-homes directories.
 *
 * @param {string} [cwd] Working directory containing `.fgos/config.json`
 * @param {object} [opts]
 * @param {string} [opts.homeDir] Base home directory for expanding `${HOME}` (defaults to real $HOME)
 * @param {object} [opts.config] Pre-loaded config object (if already read)
 * @returns {Array<{ rawPath: string, resolvedPath: string, executorId?: string, invocationId?: string }>}
 */
export function findAgySubHomes(cwd = process.cwd(), { homeDir = process.env.HOME || os.homedir(), config = null } = {}) {
  let cfg = config;
  if (!cfg) {
    try {
      cfg = readSharedConfig(cwd);
    } catch {
      return [];
    }
  }

  const results = [];
  const seenPaths = new Set();

  function checkEnv(env, { executorId, invocationId, command }) {
    if (!env || typeof env !== 'object' || typeof env.HOME !== 'string') return;
    const rawPath = env.HOME.trim();
    if (!rawPath) return;

    const isAgy = command === 'agy' ||
      executorId === 'agy' ||
      (typeof invocationId === 'string' && invocationId.includes('agy')) ||
      rawPath.includes('agy-homes');

    if (!isAgy) return;

    const resolved = path.resolve(resolveSubHomePath(rawPath, homeDir));
    if (!seenPaths.has(resolved)) {
      seenPaths.add(resolved);
      results.push({
        rawPath,
        resolvedPath: resolved,
        executorId,
        invocationId,
      });
    }
  }

  const runner = cfg?.runner;
  if (!runner) return results;

  // Single executor format: runner.executor
  if (runner.executor && typeof runner.executor === 'object') {
    checkEnv(runner.executor.env, {
      executorId: 'executor',
      command: runner.executor.command,
    });
    if (Array.isArray(runner.executor.invocations)) {
      for (const inv of runner.executor.invocations) {
        if (inv && typeof inv === 'object') {
          checkEnv(inv.env, {
            executorId: 'executor',
            invocationId: inv.id,
            command: inv.command ?? runner.executor.command,
          });
        }
      }
    }
  }

  // Multi-executor format: runner.executors
  if (runner.executors && typeof runner.executors === 'object') {
    for (const [executorId, exec] of Object.entries(runner.executors)) {
      if (!exec || typeof exec !== 'object') continue;
      checkEnv(exec.env, {
        executorId,
        command: exec.command,
      });
      if (Array.isArray(exec.invocations)) {
        for (const inv of exec.invocations) {
          if (inv && typeof inv === 'object') {
            checkEnv(inv.env, {
              executorId,
              invocationId: inv.id,
              command: inv.command ?? exec.command,
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Doctor check: verifies that each agy sub-HOME referenced in executor configs
 * has its own settings.json with toolPermission: "always-proceed".
 *
 * @param {string} [cwd] Working directory containing `.fgos/config.json`
 * @param {object} [opts]
 * @param {string} [opts.homeDir] Base home directory for expanding `${HOME}`
 * @param {object} [opts.config] Pre-loaded config object
 * @returns {{ passed: boolean, message: string }}
 */
export function checkAgySubHomesConfigured(cwd = process.cwd(), { homeDir = process.env.HOME || os.homedir(), config = null } = {}) {
  const subHomes = findAgySubHomes(cwd, { homeDir, config });
  if (subHomes.length === 0) {
    return {
      passed: true,
      message: 'no agy sub-HOMEs referenced in executor configs — nothing to check',
    };
  }

  const missing = [];
  const misconfigured = [];
  const passed = [];

  for (const { rawPath, resolvedPath } of subHomes) {
    const settingsPath = agySettingsPath(resolvedPath);
    if (!fs.existsSync(settingsPath)) {
      missing.push(`${rawPath} (${settingsPath} not found)`);
      continue;
    }
    const settings = readAgySettings(resolvedPath);
    if (settings.toolPermission !== 'always-proceed') {
      misconfigured.push(
        `${rawPath} (${settingsPath}: toolPermission is "${settings.toolPermission ?? 'missing'}", must be "always-proceed")`,
      );
      continue;
    }
    passed.push(rawPath);
  }

  if (missing.length > 0 || misconfigured.length > 0) {
    const problems = [];
    if (missing.length > 0) {
      problems.push(`missing settings.json: ${missing.join(', ')}`);
    }
    if (misconfigured.length > 0) {
      problems.push(`misconfigured settings.json: ${misconfigured.join(', ')}`);
    }
    return {
      passed: false,
      message: `agy sub-HOME check failed (${problems.join('; ')}) — each sub-HOME must have .gemini/antigravity-cli/settings.json with toolPermission: "always-proceed"`,
    };
  }

  return {
    passed: true,
    message: `all ${subHomes.length} agy sub-HOME(s) configured (${passed.join(', ')}) with toolPermission=always-proceed`,
  };
}
