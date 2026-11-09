// agy-permissions.mjs — infra layer: agy's (Antigravity Cli) command-permission settings
// (tsk-1xm, docs/history/agy-permission-capability-allowlist/).
//   - checkAgyPermissionsConfigured: the read-only doctor row over the person's own
//     ~/.gemini/antigravity-cli/settings.json. fgOS never writes that file: always-proceed widens
//     what agy may do in the person's own sessions too, so the row only reports it (as a warning)
//     and `fgos wire-agents` shows the edit (src/setup/agent-wiring.mjs).
//   - checkAgySubHomesConfigured: the same settings in each agy sub-HOME the executor config names.
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
// refused with a named reason). The settings shown are therefore a
// DENYLIST, not an allowlist -- default-allow, explicit-deny.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { isConfigRefusal, readConfig } from '../config/facade.mjs';
import { firstOnPath } from './project-launcher.mjs';

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

/** The settings `fgos wire-agents` shows a person who wants agy to run commands headless; fgOS
 * never writes them into the person's own settings file. */
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
 * Read-only doctor row over the person's own agy settings. Passes when agy is not on PATH (nothing
 * of the person's to judge) or when `toolPermission` is `"always-proceed"` with a non-empty
 * `permissions.deny` (a customized deny list is the person's choice). Otherwise it warns: agy run
 * under this HOME refuses every command headless, and the only setting that changes that widens
 * agy's permissions, which fgOS never sets for the person.
 */
export function checkAgyPermissionsConfigured(homeDir = os.homedir(), { agyPresent = firstOnPath('agy') !== null } = {}) {
  if (!agyPresent) return { passed: true, configured: false, message: 'agy not found on PATH — nothing to check' };
  const settings = readAgySettings(homeDir);
  const denyList = settings.permissions?.deny;
  if (settings.toolPermission === 'always-proceed' && Array.isArray(denyList) && denyList.length > 0) {
    return { passed: true, configured: true, message: `agy settings.json: toolPermission=always-proceed, ${denyList.length} deny rule(s) configured` };
  }
  return {
    passed: true,
    configured: false,
    message: `warning: ${agySettingsPath(homeDir)} has no toolPermission "always-proceed" with a deny list, so agy run under this HOME refuses every command headless (RESEARCH.md Round 4). That setting widens what agy may do, so fgOS never sets it for you; \`fgos wire-agents\` shows the exact edit`,
  };
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
      cfg = readConfig({ projectRoot: cwd, sections: ['runner'] }).value;
    } catch (err) {
      if (!isConfigRefusal(err)) throw err;
      return []; // a config the door refuses names no sub-home; `fgos doctor` reports the refusal itself
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

  // The credential homes of the declared gemini accounts. A confined (herdr or bwrap) invocation
  // runs as the account the capacity layer picks for the provider, so these homes matter as much as
  // the HOME an invocation names.
  const geminiAccounts = runner.providers?.gemini?.accounts;
  if (geminiAccounts && typeof geminiAccounts === 'object') {
    for (const [accountId, account] of Object.entries(geminiAccounts)) {
      // One store for every CLI, or the agy store of an account that keeps one per CLI.
      const rawPath = (account?.credentialSources ? account.credentialSources.agy : account?.credentialSource)?.home;
      if (typeof rawPath !== 'string' || !rawPath.trim()) continue;
      const resolved = path.resolve(resolveSubHomePath(rawPath.trim(), homeDir));
      if (seenPaths.has(resolved)) continue;
      seenPaths.add(resolved);
      results.push({ rawPath: rawPath.trim(), resolvedPath: resolved, executorId: 'gemini', invocationId: `account:${accountId}` });
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
