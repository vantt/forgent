// agy-permissions.mjs — infra layer: agy's (Antigravity Cli) command-permission settings
// (tsk-1xm, docs/history/agy-permission-capability-allowlist/). What stays here is the sub-HOME reading the
// executor config's agy rows need (`agy-sub-homes-configured`, and the agent CLI trust row): the same settings in
// each agy sub-HOME the executor config names. The row over the person's own settings file and the settings
// `fgos wire-agents` shows are `packages/distribution/rust/src/agent_config.rs`'s; fgOS never writes the
// person's file: always-proceed widens what agy may do in the person's own sessions too.
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
      if (Array.isArray(exec.invocations)) {
        for (const inv of exec.invocations) {
          if (inv && typeof inv === 'object') {
            checkEnv(inv.env, {
              executorId,
              invocationId: inv.id,
              command: inv.command,
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
