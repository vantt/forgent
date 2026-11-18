// agy-permissions.mjs — infra layer: agy's (Antigravity Cli) command-permission settings
// (tsk-1xm, docs/history/agy-permission-capability-allowlist/). What stays here is the sub-HOME reading the
// executor config's agy rows need (`agy-sub-homes-configured`, and the agent CLI trust row): the sub-HOMEs the
// executor config and the `gemini` pool of `runner.llmAccounts` name. The row over the person's own settings file and the settings
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

  // The credential homes of the accounts of the `gemini` pool of `runner.llmAccounts`. A confined (herdr or bwrap)
  // invocation runs as the account the capacity layer picks for the pool, so these homes matter as much as the
  // HOME an invocation names.
  const geminiAccounts = runner.llmAccounts?.gemini;
  if (geminiAccounts && typeof geminiAccounts === 'object') {
    for (const [accountId, account] of Object.entries(geminiAccounts)) {
      const rawPath = account?.credentialStore?.agy;
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
 * Doctor check: verifies that each agy sub-HOME referenced in the executor configs and in the `gemini` pool of
 * `runner.llmAccounts` is a directory that exists. The settings a run needs (always-proceed and the deny list) are
 * passed to agy per invocation as a session-only `--settings`, so no sub-HOME's own settings.json is read on a run
 * and none is demanded here.
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
      message: 'no agy sub-HOMEs referenced in executor configs or the gemini accounts — nothing to check',
    };
  }

  const missing = subHomes.filter(({ resolvedPath }) => !fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory());
  if (missing.length > 0) {
    return {
      passed: false,
      message: `agy sub-HOME check failed (not a directory: ${missing.map(({ rawPath, resolvedPath }) => `${rawPath} (${resolvedPath})`).join(', ')}) — each sub-HOME an executor or a gemini account names must exist`,
    };
  }

  return {
    passed: true,
    message: `all ${subHomes.length} agy sub-HOME(s) exist (${subHomes.map(({ rawPath }) => rawPath).join(', ')})`,
  };
}
