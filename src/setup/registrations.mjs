// registrations.mjs — the doctor-check / config-default registry (CONTEXT.md
// D1/D2, docs/history/setup-doctor-config-registry/): the one place a module
// declares a doctor check and/or a config-default shape. `checks.mjs` never
// needs editing again to pick up a new entry — it only re-exports
// `DOCTOR_CHECKS` from here (D1). A new module registers by importing
// `registerCheck`/`registerConfigDefault` from this file and calling them at
// its own module-load time, or — for the handful of checks fgOS ships with —
// by being registered directly below, next to the built-ins.
//
// `check` and `configDefault` registrations are independent (D2): a module
// may register only a check, only a config-default, or both — never a
// forced pairing. 4 of the 5 built-in checks below have no config-default at
// all, which is exactly why D2 rejected a mandatory pair.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { detectRcFiles, hasSourceLine, deadSourceLines } from './shell-rc.mjs';
import { mergeConfigDefaults } from './config-merge.mjs';
import { mainCheckoutHookWired } from './git-hooks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../runner/dispatch.mjs';
import { listWork } from '../state/store.mjs';
import { readLocalStatus, classifyRegistryPosture } from '../state/tool-registry.mjs';
import { describeConfigAwareness } from '../config/global-config.mjs';
import { sharedConfigFilePath, legacyRunnerConfigPath, readSharedConfig, writeSharedConfig } from '../config/shared-config-file.mjs';

export { mainCheckoutHookWired } from './git-hooks.mjs';

const MIN_NODE_MAJOR = 18;

// How many distinct dead paths the shell-integration check names before
// falling back to a count. Observed real profiles carry over a hundred.
const DEAD_LINE_SAMPLE_SIZE = 3;

// Live, mutated-in-place arrays (never reassigned) so a registration added
// after this module first evaluates — e.g. from a test, or from another
// module imported later in the same process — is visible through every
// existing import of `DOCTOR_CHECKS`/`CONFIG_DEFAULT_REGISTRATIONS`,
// including `checks.mjs`'s own re-export (ESM re-exports are live bindings
// to the same array object, not a snapshot).
export const DOCTOR_CHECKS = [];
export const CONFIG_DEFAULT_REGISTRATIONS = [];

/**
 * Register a doctor check (D1/D2). `id` must be unique among registered
 * checks — a duplicate is a programming error (two modules picked the same
 * name), not a runtime condition to degrade gracefully on, so it throws.
 */
export function registerCheck({ id, description, check }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerCheck requires a non-empty id');
  }
  if (DOCTOR_CHECKS.some((entry) => entry.id === id)) {
    throw new Error(`registerCheck: "${id}" is already registered`);
  }
  if (typeof check !== 'function') {
    throw new Error(`registerCheck("${id}") requires a check function`);
  }
  DOCTOR_CHECKS.push({ id, description, check });
}

/**
 * Register a config-default shape (D2/D3): `key` is this module's own
 * top-level section name in the eventual shared config file (D3 — "one file,
 * each module its own entry"); `shape` is the default object merged into
 * that section via the existing, unmodified `mergeConfigDefaults`. Config-
 * default registration is independent of check registration (D2) — a module
 * may call only this, only `registerCheck`, or both.
 */
export function registerConfigDefault({ id, key, shape }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerConfigDefault requires a non-empty id');
  }
  if (typeof key !== 'string' || !key.trim()) {
    throw new Error(`registerConfigDefault("${id}") requires a non-empty key`);
  }
  if (CONFIG_DEFAULT_REGISTRATIONS.some((entry) => entry.id === id)) {
    throw new Error(`registerConfigDefault: "${id}" is already registered`);
  }
  if (shape === null || typeof shape !== 'object' || Array.isArray(shape)) {
    throw new Error(`registerConfigDefault("${id}") requires a plain-object shape`);
  }
  CONFIG_DEFAULT_REGISTRATIONS.push({ id, key, shape });
}

/**
 * Assemble the shared config file's DEFAULT shape from every registered
 * entry (tsk-5vf D4): `{ [entry.key]: entry.shape, ... }`. Registry-driven
 * -- a new `registerConfigDefault` call is automatically picked up here,
 * never requiring an edit to this function.
 */
function assembleRegistryDefaults() {
  const defaults = {};
  for (const { key, shape } of CONFIG_DEFAULT_REGISTRATIONS) {
    defaults[key] = shape;
  }
  return defaults;
}

/**
 * Registry-driven bootstrap for the shared config file (tsk-5vf D4): reads
 * whatever is currently at `dir` (the new file, or its legacy
 * `.fgos-runner.json` fallback wrapped as `{runner: ...}` -- `readSharedConfig`),
 * fills in any key any registered entry's default shape has that the
 * current content is missing, at any depth, and writes back only when a
 * key was actually added or the shared file did not exist yet. Never
 * deletes the legacy file. This is the write path `fgos setup` calls
 * (RUL9: doctor checks stay read-only; `setup` is the one write verb).
 */
export function ensureSharedConfigDefaults(dir) {
  const existing = readSharedConfig(dir);
  const defaults = assembleRegistryDefaults();
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  const sharedExisted = fs.existsSync(sharedConfigFilePath(dir));
  if (sharedExisted && addedKeys.length === 0) {
    return { config: existing, addedKeys: [] };
  }
  writeSharedConfig(dir, merged);
  return { config: merged, addedKeys };
}

/**
 * The main checkout that owns `dir` — the directory holding the real `.git` —
 * or `null` when `dir` is not inside a git checkout at all.
 *
 * `--show-toplevel` is deliberately not used: inside a linked worktree it
 * returns that worktree's own root, and treating that as the shell
 * integration's home is what made every worktree earn its own `source` line,
 * one dead line left behind per removed worktree. `--git-common-dir` points
 * at the main checkout's `.git` from anywhere in the repo, so its parent is
 * the one location stable enough for a user's rc file to name. Same
 * resolution `scripts/fgos-shell-integration.sh` already uses, and the same
 * common-dir-parent shape as `merge.mjs`'s `isMainWorktree`.
 */
export function resolveMainCheckout(dir) {
  let commonDir;
  try {
    commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd: dir,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
  return commonDir ? path.dirname(commonDir) : null;
}

/**
 * Absolute path to the sourceable shell-integration script, canonicalized to
 * the main checkout, or `null` when no stable location exists for it.
 *
 * Starts from this file's own on-disk location via `import.meta.url` — that
 * is the copy actually being executed, and the only one guaranteed to exist.
 * When that copy sits inside a linked worktree, the equivalent path in the
 * main checkout is returned instead, so a worktree never earns its own rc
 * line and `checkShellIntegrationSourced` stops reporting a working setup as
 * unconfigured.
 *
 * The `existsSync` guard keeps the canonical rewrite honest for a checkout
 * that is not fgOS's own — fgOS installed under another repo's
 * `node_modules/` resolves that repo as its main checkout, which has no
 * `scripts/` of its own; the executing copy's real path is correct there.
 *
 * `null` means the executing copy is not inside a git checkout at all (an
 * unpacked tarball, an npx cache, a bare temp copy). Such a location is
 * ephemeral by nature, so there is no path worth writing into a shell
 * profile that will outlive it.
 */
export function integrationScriptPath() {
  const executingCopy = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../scripts/fgos-shell-integration.sh',
  );
  const mainCheckout = resolveMainCheckout(path.dirname(executingCopy));
  if (mainCheckout === null) {
    return null;
  }
  const canonical = path.join(mainCheckout, 'scripts', 'fgos-shell-integration.sh');
  return fs.existsSync(canonical) ? canonical : executingCopy;
}

function checkNodeAndGit() {
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    return { passed: false, message: `node ${process.version} — need >=${MIN_NODE_MAJOR}` };
  }
  try {
    execFileSync('git', ['--version'], { encoding: 'utf8' });
  } catch (err) {
    return { passed: false, message: `git not available: ${err.message}` };
  }
  return { passed: true, message: `node ${process.version}, git available` };
}

function checkShellIntegrationSourced() {
  const scriptPath = integrationScriptPath();
  const rcFiles = detectRcFiles(os.homedir());
  if (rcFiles.length === 0) {
    return { passed: true, message: 'no shell rc file(s) detected — nothing to check' };
  }
  if (scriptPath === null) {
    return {
      passed: true,
      message: 'this copy of fgos is not inside a git checkout — no stable path to check for',
    };
  }
  // Reported even when the integration itself is correctly sourced: each dead
  // line makes an interactive shell emit its own `no such file or directory`
  // error on open, which is the failure a user actually sees. Reported per rc
  // file because setup writes to every rc file it detects, so they drift apart.
  const dead = rcFiles.flatMap((rcFile) =>
    deadSourceLines(rcFile).map((target) => ({ rcFile, target })),
  );
  const missing = rcFiles.filter((rcFile) => !hasSourceLine(rcFile, scriptPath));
  const problems = [];
  if (missing.length > 0) {
    problems.push(`not sourced in: ${missing.join(', ')} — run fgos setup`);
  }
  if (dead.length > 0) {
    const byFile = new Map();
    for (const { rcFile, target } of dead) {
      byFile.set(rcFile, (byFile.get(rcFile) ?? 0) + 1);
    }
    const counts = [...byFile].map(([rcFile, count]) => `${rcFile} (${count})`).join(', ');
    // Only a sample of the paths: these accumulate into the hundreds, and a
    // check message that prints every one of them scrolls the rest of the
    // report off the screen. The counts above are the actionable part.
    const unique = [...new Set(dead.map(({ target }) => target))];
    const sample = unique.slice(0, DEAD_LINE_SAMPLE_SIZE).join(', ');
    const rest = unique.length - DEAD_LINE_SAMPLE_SIZE;
    problems.push(
      `${dead.length} dead fgos source line(s) in ${counts} — each one errors on every shell open; ` +
        `delete them by hand (fgos never edits your shell profile to remove a line). ` +
        `e.g. ${sample}${rest > 0 ? ` (+${rest} more path(s))` : ''}`,
    );
  }
  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: `sourced in: ${rcFiles.join(', ')}` };
}

// config-not-stale is READ-ONLY by construction: `readSharedConfig` only
// calls fs.existsSync/readFileSync, never `ensureSharedConfigDefaults` or
// `ensureRunnerConfig` — doctor never writes.
//
// Retargeted at the shared config file (`.fgos/config.json`, tsk-2ta D1
// amended) with a legacy-`.fgos-runner.json` read fallback baked into
// `readSharedConfig` itself, and made generic over every registered entry
// (tsk-5vf D4/D5) — the `registerConfigDefault` follow-up
// `docs/history/setup-doctor-config-registry/plan.md`'s "Real blast radius"
// note deferred to once the shared file was real.
function checkConfigNotStale(cwd) {
  const sharedPath = sharedConfigFilePath(cwd);
  const legacyPath = legacyRunnerConfigPath(cwd);
  if (!fs.existsSync(sharedPath) && !fs.existsSync(legacyPath)) {
    return { passed: false, message: 'not yet configured -- run fgos setup' };
  }
  const existingConfig = readSharedConfig(cwd);
  const defaults = assembleRegistryDefaults();
  const { addedKeys } = mergeConfigDefaults(existingConfig, defaults);
  if (addedKeys.length > 0) {
    return { passed: false, message: `stale config — missing keys: ${addedKeys.join(', ')} — run fgos setup` };
  }
  return { passed: true, message: `config up to date at ${fs.existsSync(sharedPath) ? sharedPath : legacyPath}` };
}

function checkMainCheckoutHookWired(cwd) {
  if (mainCheckoutHookWired(cwd)) {
    return { passed: true, message: 'core.hooksPath = .githooks — main-checkout lock guards every commit here' };
  }
  return { passed: false, message: 'core.hooksPath not wired to .githooks — commits here are NOT guarded against concurrent-writer clobbering (str65) — run fgos setup' };
}

// tsk-1dj (tool-registry-capability port), CONTEXT.md D1: reports the tool
// registry's posture (inactive/degraded/full), never a hard failure — an
// empty or partially-present registry is never itself a problem (the core
// "absent capability = clean skip" contract this whole item ports), so
// `passed` is always `true` here; only the message carries the posture.
// Reports across every registered tool, never a single hardcoded capability
// (e.g. "impact-analysis") — the registry itself never names one.
function checkToolRegistryConfigured(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const fgosDir = path.join(mainCheckout, '.fgos');
  const view = listWork(fgosDir);
  const localStatus = readLocalStatus(fgosDir);
  const { posture, registeredCount, presentCount, missingCount, unknownCount } = classifyRegistryPosture(view.tools, localStatus);
  if (posture === 'inactive') {
    return { passed: true, message: 'inactive — no tools registered (fgos tool register to add one)' };
  }
  if (posture === 'full') {
    return { passed: true, message: `full — ${presentCount}/${registeredCount} registered tool(s) present` };
  }
  return {
    passed: true,
    message: `degraded — ${presentCount}/${registeredCount} registered tool(s) present (${missingCount} missing, ${unknownCount} never checked — run fgos tool check)`,
  };
}

registerCheck({
  id: 'node-version-and-git',
  description: `Node >=${MIN_NODE_MAJOR} and git available`,
  check: (cwd) => checkNodeAndGit(cwd),
});

registerCheck({
  id: 'shell-integration-sourced',
  description: 'shell-integration source line present in detected rc file(s)',
  check: (cwd) => checkShellIntegrationSourced(cwd),
});

registerCheck({
  id: 'config-not-stale',
  description: '.fgos/config.json (or its legacy .fgos-runner.json fallback) exists and has every current registered default key',
  check: (cwd) => checkConfigNotStale(cwd),
});

registerCheck({
  id: 'main-checkout-hook-wired',
  description: 'core.hooksPath wired to .githooks (str65 main-checkout lock guards every commit)',
  check: (cwd) => checkMainCheckoutHookWired(cwd),
});

registerCheck({
  id: 'tool-registry-configured',
  description: 'tool registry posture — inactive/degraded/full (tsk-1dj)',
  check: (cwd) => checkToolRegistryConfigured(cwd),
});

// docs/history/global-project-config-awareness/CONTEXT.md D1: reports which
// config level is currently active (project always wins when present) and
// whether the other level is also on disk, so "aware" means visible in
// `fgos doctor` output, not just correct-but-silent precedence at runtime.
// READ-ONLY by construction (same as every other check here) —
// describeConfigAwareness only calls fs.existsSync, never writes.
function checkGlobalProjectAwareness(cwd) {
  const { active, globalPresent, projectPresent, globalConfigPath, projectConfigPath } =
    describeConfigAwareness(cwd);
  if (active === 'none') {
    return {
      passed: true,
      message: `no config at either level yet — project: ${projectConfigPath}, global: ${globalConfigPath}`,
    };
  }
  const other = active === 'project' ? 'global' : 'project';
  const otherPresent = active === 'project' ? globalPresent : projectPresent;
  return {
    passed: true,
    message: `active: ${active} (${active === 'project' ? projectConfigPath : globalConfigPath}) — ${other} config ${otherPresent ? 'also present' : 'not present'}`,
  };
}

registerCheck({
  id: 'config-awareness',
  description: 'which config level (global/project) is active, and whether the other is also present (tsk-2ta-2)',
  check: (cwd) => checkGlobalProjectAwareness(cwd),
});

// The runner's own config-default, registered under its key in the shared
// file (tsk-2cs D6) — `checkConfigNotStale`/`ensureSharedConfigDefaults`
// above are both driven by this registration generically (tsk-5vf D4), not
// a hardcoded reference to `DEFAULT_RUNNER_CONFIG`'s shape.
registerConfigDefault({
  id: 'runner',
  key: 'runner',
  shape: DEFAULT_RUNNER_CONFIG,
});
