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
//
// `fix` is a third, equally independent registration capability
// (docs/history/doctor-fix-gate-bypass/CONTEXT.md D3, tsk-2qz): a module may
// register a `fix` function alongside its `check`/`configDefault`, or none
// of the above three together — same "independent, not forced pairing"
// style D2 already established. `fgos doctor --fix` (bin/fgos.mjs) runs
// every registered fix via `runFixes` below; `doctor` without `--fix` stays
// exactly as before (D2 of the gate-bypass item — no default-behavior
// change).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { detectRcFiles, hasSourceLine, deadSourceLines } from './shell-rc.mjs';
import { mergeConfigDefaults } from './config-merge.mjs';
import { mainCheckoutHookWired } from './git-hooks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../runner/dispatch.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { listWork } from '../state/store.mjs';
import { driftStatus } from '../state/drift-status.mjs';
import { computeEnduserDocsIndex, generateEnduserDocsIndex, manifestPathFor } from '../report/enduser-index-generate.mjs';
import { isResolvedStatus } from '../state/frontier.mjs';
import { getDomain } from '../state/workflow-stage-graphs.mjs';
import { readLocalStatus, classifyRegistryPosture } from '../state/tool-registry.mjs';
import { describeConfigAwareness } from '../config/global-config.mjs';
import { sharedConfigFilePath, readSharedConfig, writeSharedConfig } from '../config/shared-config-file.mjs';
import { DEFAULT_LEVEL, LEVELS } from '../state/gate-bypass.mjs';

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
export const FIX_REGISTRATIONS = [];

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
 * Register a fix (D3, docs/history/doctor-fix-gate-bypass/CONTEXT.md):
 * `fix` is a function `(cwd) => { changed, message }` that repairs whatever
 * this entry's own `check` (if any) reports as failing — idempotent, and
 * scoped only to this entry's own concern, never another entry's. `fix`
 * registration is independent of `check`/`configDefault` (same D2 style
 * those two already follow) — a module may register any subset of the
 * three.
 */
export function registerFix({ id, fix }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerFix requires a non-empty id');
  }
  if (FIX_REGISTRATIONS.some((entry) => entry.id === id)) {
    throw new Error(`registerFix: "${id}" is already registered`);
  }
  if (typeof fix !== 'function') {
    throw new Error(`registerFix("${id}") requires a fix function`);
  }
  FIX_REGISTRATIONS.push({ id, fix });
}

/**
 * Run every registered fix against `cwd` (`fgos doctor --fix`'s own write
 * path — the one place doctor writes, gated behind the explicit `--fix`
 * flag; without it doctor stays exactly as before). Each fix's own
 * `{changed, message}` is reported per entry, mirroring `DOCTOR_CHECKS`'
 * per-entry `{passed, message}` report shape.
 */
export function runFixes(cwd) {
  return FIX_REGISTRATIONS.map(({ id, fix }) => {
    const { changed, message } = fix(cwd);
    return { id, changed, message };
  });
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
 * whatever is currently at `dir` (`readSharedConfig`), fills in any key any
 * registered entry's default shape has that the current content is
 * missing, at any depth, and writes back only when a key was actually
 * added or the shared file did not exist yet. This is the write path
 * `fgos setup` calls (RUL9: doctor checks stay read-only; `setup` is the
 * one write verb).
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
 * common-dir-parent shape as `merge.mjs`'s `isMainWorktree`. Delegates to
 * `paths.mjs`'s `resolveMainCheckoutRoot` (tsk-5hv: extracted there so
 * `dispatch.mjs`/`scripts/project-agents.mjs` can reuse the identical
 * resolution without a circular import back into this module) — this
 * export's own name/signature stay unchanged for its existing callers.
 */
export function resolveMainCheckout(dir) {
  return resolveMainCheckoutRoot(dir);
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
// Targeted at the shared config file (`.fgos/config.json`) alone (tsk-5hv
// D1: the legacy runner config file was retired, no fallback), made generic over every
// registered entry (tsk-5vf D4/D5) — the `registerConfigDefault` follow-up
// `docs/history/setup-doctor-config-registry/plan.md`'s "Real blast radius"
// note deferred to once the shared file was real.
function checkConfigNotStale(cwd) {
  const sharedPath = sharedConfigFilePath(cwd);
  if (!fs.existsSync(sharedPath)) {
    return { passed: false, message: 'not yet configured -- run fgos setup' };
  }
  const existingConfig = readSharedConfig(cwd);
  const defaults = assembleRegistryDefaults();
  const { addedKeys } = mergeConfigDefaults(existingConfig, defaults);
  if (addedKeys.length > 0) {
    return { passed: false, message: `stale config — missing keys: ${addedKeys.join(', ')} — run fgos setup` };
  }
  return { passed: true, message: `config up to date at ${sharedPath}` };
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
  description: '.fgos/config.json exists and has every current registered default key',
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

// tsk-5m7 (docs/history/tsk-3bn-merge-conductor-harness-v2/): a real
// actionable problem, same class as the hook/config checks above — a root
// branch that's drifted ahead of its target with nothing having synced it
// is exactly the failure mode tsk-3bn's own origin incident reproduced.
// `passed: false` (not just an informational message) so it surfaces the
// same way a stale-config or unwired-hook check does.
function checkRootDrift(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const drift = driftStatus(mainCheckout, view);
  const needsSync = Object.entries(drift).filter(([, status]) => status.needsSync);
  if (needsSync.length === 0) {
    return { passed: true, message: 'no root branch is drifted ahead of its target' };
  }
  const summary = needsSync
    .map(([id, status]) => `${id} (${status.branch} is ${status.aheadOfTarget} commit(s) ahead of ${status.target})`)
    .join(', ');
  return {
    passed: false,
    message: `drifted root branch(es) need syncing: ${summary} — run fgos sync-root <root-id>`,
  };
}

// tsk-6ax: tsk-5wz declared the coding domain's risk/kind vocabulary
// (DOMAINS.coding.classification) and enforced it at the write door
// (validateWorkShape's touchedFields grandfathering), but that only blocks
// NEW writes — 68 items already on disk kept a pre-vocabulary risk value
// (low/medium/high), silently degrading decompose.mjs's heavy-risk gate and
// priority-formula.mjs's risk discount. This check makes that class of
// drift visible to `fgos doctor` going forward, same as root-drift above.
// Scoped to OPEN items only (`!isResolvedStatus`, the one shared open/
// closed definition frontier.mjs already exports) — a resolved item's
// stale classification no longer feeds any live gate or formula, so
// flagging it here would just be noise.
function checkWorkClassificationVocabulary(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const violations = [];
  for (const item of Object.values(view.work)) {
    if (isResolvedStatus(item)) continue;
    const classification = getDomain(item.domain).classification;
    if (!classification) continue;
    if (classification.kind && !classification.kind.includes(item.kind)) {
      violations.push(`${item.id} (kind: "${item.kind}")`);
    }
    if (classification.risk && !classification.risk.includes(item.risk)) {
      violations.push(`${item.id} (risk: "${item.risk}")`);
    }
  }
  if (violations.length === 0) {
    return { passed: true, message: "every open item's risk/kind matches its domain's classification vocabulary" };
  }
  return {
    passed: false,
    message: `${violations.length} open item(s) outside their domain's classification vocabulary: ${violations.join(', ')} — run fgos edit <id> --risk/--kind <value>`,
  };
}

registerCheck({
  id: 'work-classification-vocabulary',
  description: "every open item's risk/kind matches its domain's declared classification vocabulary (tsk-6ax)",
  check: (cwd) => checkWorkClassificationVocabulary(cwd),
});

registerCheck({
  id: 'root-drift',
  description: 'every fgw/<root> branch is in sync with its real target — no unsynced drift left over from a leaf merge (tsk-3bn)',
  check: (cwd) => checkRootDrift(cwd),
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

// tsk-slq D6 (AGENTS.md's install/setup/doctor gate — a new infra
// dependency must register into doctor's check registry, not stand alone
// undiscoverable by doctor): forgent had zero npm dependencies until tsk-slq
// added `yaml` (D4) as the first one. A bare checkout (e.g. a fresh clone,
// or a disposable worktree like `fgos return`'s own goal-check checkout)
// never runs `npm install` on its own — this check makes that gap visible
// to a human/session running `fgos doctor`, the same "absent capability =
// clean skip, never hidden" contract `checkToolRegistryConfigured` already
// gives tool-registry posture. READ-ONLY by construction (same as every
// other check here) — only fs.existsSync, doctor never writes.
function checkDependenciesInstalled(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const packageJsonPath = path.join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { passed: true, message: 'no package.json — nothing to check' };
  }
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {});
  if (deps.length === 0) {
    return { passed: true, message: 'no runtime dependencies declared — nothing to check' };
  }
  const nodeModulesPath = path.join(root, 'node_modules');
  const missing = deps.filter((dep) => !fs.existsSync(path.join(nodeModulesPath, dep)));
  if (missing.length > 0) {
    return { passed: false, message: `missing from node_modules: ${missing.join(', ')} — run npm install` };
  }
  return { passed: true, message: `${deps.length} dependenc${deps.length === 1 ? 'y' : 'ies'} installed` };
}

registerCheck({
  id: 'dependencies-installed',
  description: 'package.json dependencies are present in node_modules (tsk-slq D6)',
  check: (cwd) => checkDependenciesInstalled(cwd),
});

// gate-bypass.json's real registry entry (docs/history/doctor-fix-gate-bypass/
// CONTEXT.md D1/D3, tsk-2qz-2) -- the registry's first consumer to register
// all three independent capabilities (check + configDefault + fix), per
// tsk-2cs's own D5 ("gate-bypass is the registry's first real consumer").
// `checkConfigNotStale` above already detects a MISSING `gateBypass` key
// generically via `assembleRegistryDefaults()` once the configDefault below
// is registered; this dedicated check adds the one thing that generic
// staleness check cannot: whether a PRESENT `level` value is actually one of
// `LEVELS`, since a malformed-but-present value is never "missing" from
// `mergeConfigDefaults`' point of view.
function checkGateBypassConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const level = shared?.gateBypass?.level;
  if (typeof level !== 'string' || !LEVELS.includes(level)) {
    return {
      passed: false,
      message: `gateBypass.level missing or not a recognized level (${LEVELS.join('/')}) -- run fgos doctor --fix`,
    };
  }
  return { passed: true, message: `gateBypass.level = "${level}"` };
}

// Idempotent (D3 of the parent CONTEXT.md's pinned "fix" term): a
// already-valid level is left untouched and reported unchanged, mirroring
// `ensureSharedConfigDefaults`'s own "only write when something was actually
// added" discipline.
function fixGateBypassConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const currentLevel = shared?.gateBypass?.level;
  if (typeof currentLevel === 'string' && LEVELS.includes(currentLevel)) {
    return { changed: false, message: `gateBypass.level already "${currentLevel}"` };
  }
  const existingGateBypass =
    shared.gateBypass && typeof shared.gateBypass === 'object' && !Array.isArray(shared.gateBypass)
      ? shared.gateBypass
      : {};
  const merged = { ...shared, gateBypass: { ...existingGateBypass, level: DEFAULT_LEVEL } };
  writeSharedConfig(cwd, merged);
  return { changed: true, message: `wrote gateBypass.level = "${DEFAULT_LEVEL}" to ${sharedConfigFilePath(cwd)}` };
}

registerConfigDefault({
  id: 'gateBypass',
  key: 'gateBypass',
  shape: { level: DEFAULT_LEVEL },
});

// work-item-status-delivered-retrospective-cleanup D7: the cleanup-stage
// TTL is global config, not per-item/per-domain (YAGNI — no demonstrated
// need yet). cleanup-harness.mjs's checkCleanupTTLElapsed reads this via
// readSharedConfig; the value here is only the doctor/setup-visible
// default, same shape as gateBypass's own registration immediately above.
export const DEFAULT_CLEANUP_TTL_DAYS = 7;

// tsk-59x D1: supersedes D7's global-only premise for the leaf/root axis
// specifically, now that the demonstrated need D7 flagged as missing
// exists (25% of open list is children, 0/99 cleanup-pool items ever
// elapse the 7-day TTL). A leaf's own content already lives on its
// still-alive root branch the moment it merges, so reclaiming its
// worktree/branch immediately loses nothing. Root items are unaffected —
// they keep DEFAULT_CLEANUP_TTL_DAYS above.
export const DEFAULT_CLEANUP_LEAF_TTL_DAYS = 0;

registerConfigDefault({
  id: 'cleanup',
  key: 'cleanup',
  shape: { ttlDays: DEFAULT_CLEANUP_TTL_DAYS, leafTtlDays: DEFAULT_CLEANUP_LEAF_TTL_DAYS },
});

registerCheck({
  id: 'gate-bypass-configured',
  description: 'gateBypass.level in the shared config file is present and a recognized level',
  check: (cwd) => checkGateBypassConfigured(cwd),
});

registerFix({
  id: 'gate-bypass-configured',
  fix: (cwd) => fixGateBypassConfigured(cwd),
});

// tsk-4xg (docs/history/tsk-4xg-plugin-marketplace-doctor-check/): a new
// project set up via `fgos setup` never got the fgOS Claude Code plugin
// (`.claude-plugin/marketplace.json`, `plugins/fgOS`) registered or
// installed, so it had no `/fgOS:*` skills available -- and `doctor` never
// flagged the gap. Same registerCheck/registerFix registry every other
// doctor check/fix already uses (tsk-2cs) -- a new consumer, no new
// plumbing.
//
// D3 (CONTEXT.md): the fix always adds the marketplace by its GitHub
// source (`vantt/forgent`), never a local path -- `package.json`'s own
// `"files"` list does not ship `plugins/`/`.claude-plugin/`, so a local
// path would only ever work from a dev-checkout of this repo, never for
// the actual npm-global-install target audience. The CHECK, in contrast,
// accepts a marketplace entry under this name regardless of its source
// (github, directory, or otherwise) -- a dev-checkout's own directory-
// sourced entry (this exact repo's own self-hosting case, per
// docs/distribution-vision.md's "context 3") is just as valid a pass as a
// github-sourced one; only the FIX, which only ever runs on a genuinely
// missing entry, needs to pick one source to add.
const CLAUDE_PLUGIN_MARKETPLACE_NAME = 'fgos-plugins';
const CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE = 'vantt/forgent';
const CLAUDE_PLUGIN_ID_PREFIX = 'fgOS@';

// The `claude` binary this check/fix shells out to. Tests substitute a fake
// executable through FGOS_CLAUDE_COMMAND -- same test-only seam
// bin/fgos.mjs's own ghCommandOpts() already gives FGOS_GH_COMMAND for the
// `gh` binary -- so this fix (the first one to reach outside `.fgos/`/the
// repo into a real, mutating external CLI) never actually runs
// `claude plugin marketplace add`/`install` for real against a test's own
// machine. Production leaves it unset and the real `claude` on PATH is used.
function claudeCommand() {
  return process.env.FGOS_CLAUDE_COMMAND || 'claude';
}

function claudeBinaryAvailable() {
  try {
    execFileSync(claudeCommand(), ['--version'], { encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

// Both `claude plugin marketplace list --json` and `claude plugin list
// --json` exit 0 with a JSON array on success (confirmed by running them
// directly, not assumed from --help alone) -- a non-zero exit or unparsable
// stdout folds to `null` here, the same fail-closed shape this file's other
// checks already use for a subprocess that could not be trusted.
function claudePluginJson(args) {
  try {
    const stdout = execFileSync(claudeCommand(), args, { encoding: 'utf8' });
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function fgosPluginEnabled(plugins) {
  return plugins.some((p) => typeof p?.id === 'string' && p.id.startsWith(CLAUDE_PLUGIN_ID_PREFIX) && p.enabled === true);
}

function checkClaudePluginMarketplace() {
  if (!claudeBinaryAvailable()) {
    return {
      passed: true,
      message: 'claude CLI not found on PATH — nothing to check (Claude Code plugin surface not applicable here)',
    };
  }
  const marketplaces = claudePluginJson(['plugin', 'marketplace', 'list', '--json']);
  if (marketplaces === null) {
    return { passed: false, message: '"claude plugin marketplace list --json" failed to run or parse — run fgos doctor --fix' };
  }
  if (!marketplaces.some((m) => m?.name === CLAUDE_PLUGIN_MARKETPLACE_NAME)) {
    return {
      passed: false,
      message: `Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" not configured — run fgos doctor --fix`,
    };
  }
  const plugins = claudePluginJson(['plugin', 'list', '--json']);
  if (plugins === null) {
    return { passed: false, message: '"claude plugin list --json" failed to run or parse — run fgos doctor --fix' };
  }
  if (!fgosPluginEnabled(plugins)) {
    return { passed: false, message: 'fgOS Claude Code plugin not installed/enabled — run fgos doctor --fix' };
  }
  return {
    passed: true,
    message: `Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" configured, fgOS plugin enabled`,
  };
}

// Idempotent, same "only write when something was actually missing"
// discipline fixGateBypassConfigured above already uses.
function fixClaudePluginMarketplace() {
  if (!claudeBinaryAvailable()) {
    return { changed: false, message: 'claude CLI not found on PATH — nothing to fix' };
  }
  const messages = [];
  let changed = false;

  const marketplaces = claudePluginJson(['plugin', 'marketplace', 'list', '--json']) ?? [];
  if (!marketplaces.some((m) => m?.name === CLAUDE_PLUGIN_MARKETPLACE_NAME)) {
    try {
      execFileSync(claudeCommand(), ['plugin', 'marketplace', 'add', CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE], { encoding: 'utf8' });
    } catch (err) {
      return { changed, message: `"claude plugin marketplace add ${CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE}" failed: ${err.message}` };
    }
    changed = true;
    messages.push(`added marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" from ${CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE}`);
  }

  const plugins = claudePluginJson(['plugin', 'list', '--json']) ?? [];
  if (!fgosPluginEnabled(plugins)) {
    const pluginRef = `fgOS@${CLAUDE_PLUGIN_MARKETPLACE_NAME}`;
    try {
      execFileSync(claudeCommand(), ['plugin', 'install', pluginRef], { encoding: 'utf8' });
    } catch (err) {
      return { changed, message: `"claude plugin install ${pluginRef}" failed: ${err.message}` };
    }
    changed = true;
    messages.push('installed and enabled fgOS plugin');
  }

  if (!changed) {
    return { changed: false, message: `marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" and fgOS plugin already configured` };
  }
  return { changed: true, message: messages.join('; ') };
}

registerCheck({
  id: 'claude-plugin-marketplace',
  description: 'fgOS Claude Code plugin marketplace is registered and the fgOS plugin is installed/enabled',
  check: (cwd) => checkClaudePluginMarketplace(cwd),
});

registerFix({
  id: 'claude-plugin-marketplace',
  fix: (cwd) => fixClaudePluginMarketplace(cwd),
});

// tsk-1no D3: the plugin skill layer (`plugins/fgOS/skills/*/SKILL.md`)
// resolves its own CLI independently of this file's other checks -- a
// local `bin/fgos.mjs` first, else a PATH-resolved `fgos` (same fallback
// `scripts/fgos-shell-integration.sh:29-46` already proves correct for the
// shell-function surface). No shared PATH-lookup helper exists elsewhere in
// this file to reuse (checkNodeAndGit's own `git` check is a one-off
// execFileSync try/catch, not a generic utility) -- this check follows that
// same try/catch shape rather than inventing a new one.
function checkPluginSkillCliReachable(cwd) {
  const localBin = path.join(cwd, 'bin', 'fgos.mjs');
  if (fs.existsSync(localBin)) {
    return { passed: true, message: `local bin/fgos.mjs found at ${localBin}` };
  }
  try {
    const onPath = execFileSync('sh', ['-c', 'command -v fgos'], { encoding: 'utf8' }).trim();
    return { passed: true, message: `fgos resolved from PATH at ${onPath}` };
  } catch {
    return {
      passed: false,
      message: `no bin/fgos.mjs at ${cwd} and no global fgos install on PATH -- every /fgOS:* slash command will fail on first use (run: npm install -g github:vantt/forgent)`,
    };
  }
}

registerCheck({
  id: 'plugin-skill-cli-reachable',
  description: 'a fgos CLI is reachable from this project (local bin/fgos.mjs or a global PATH install)',
  check: (cwd) => checkPluginSkillCliReachable(cwd),
});

// tsk-3ip (docs/history/automated-changelog-compound-learn/DISCUSSION.md
// §6.1/§6.4): observe/remind only -- never judges whether a change
// deserved an entry, never blocks merge (R2, tsk-28x §6.4). Exported so
// `bin/fgos.mjs`'s `collectChangelogNag` can reuse the identical
// extraction/detection logic rather than duplicating it (the doctor check
// here and the `fgos check` nag both need the same "does Unreleased have
// a real entry" read).
//
// Purely structural: looks for a `- ` bullet line inside the `##
// [Unreleased]` section, never judges the bullet's content. The exact
// heading string (with brackets) matches what the sibling bootstrap task
// (tsk-469) writes into CHANGELOG.md.
export function extractUnreleasedSection(content) {
  const heading = '## [Unreleased]';
  const idx = content.indexOf(heading);
  if (idx === -1) return '';
  const rest = content.slice(idx + heading.length);
  const nextHeadingIdx = rest.search(/\n## /);
  return nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
}

export function unreleasedHasEntries(content) {
  return /^-\s+\S/m.test(extractUnreleasedSection(content));
}

// READ-ONLY by construction (same as every other check here) -- only
// fs.existsSync/readFileSync, never writes. A missing CHANGELOG.md is a
// normal state (a fresh fgOS consumer hasn't adopted one yet), never an
// error -- same "absent capability = clean skip" contract
// `checkToolRegistryConfigured`/`checkDependenciesInstalled` already give
// their own missing-prerequisite cases.
function checkChangelogUnreleasedStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const changelogPath = path.join(root, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    return { passed: true, message: 'CHANGELOG.md not found -- nothing to check (project has not adopted a changelog yet)' };
  }
  const content = fs.readFileSync(changelogPath, 'utf8');
  if (unreleasedHasEntries(content)) {
    return { passed: true, message: '## [Unreleased] has pending entr(ies) -- up to date' };
  }
  return {
    passed: false,
    message: '## [Unreleased] has no pending entries -- reminder only: add a line here when your next user-visible change merges (never blocks merge)',
  };
}

registerCheck({
  id: 'changelog-unreleased-stale',
  description: 'CHANGELOG.md ## [Unreleased] section has at least one pending entry (observe/remind only, never blocks merge -- tsk-3ip)',
  check: (cwd) => checkChangelogUnreleasedStale(cwd),
});

// tsk-1m0 (docs/history/doctor-check-enduser-docs-index-stale/CONTEXT.md):
// the fgos-indexing skill's whole job is regenerating
// docs/enduser-docs-index.json after every compound-learn doc write, but
// nothing ever verified it actually ran -- real measurement showed drift
// growing from 32% to 36% of on-disk end-user docs missing from the index
// in one day, unflagged. READ-ONLY by construction (same as every other
// check here): `computeEnduserDocsIndex` enumerates docs/ and folds the
// event log but never writes -- it is the read-only half of the same
// generation path `fgos docs-index` and `fixEnduserDocsIndexStale` below
// both use, so this check never reimplements or diverges from what a real
// `docs-index` run would compute. One-directional (CONTEXT.md D2): reports
// on-disk docs missing from the index, never the reverse (a stale index
// entry whose doc was deleted) -- real measured drift has always been zero
// of the latter, out of scope for this item. A missing manifest or missing
// quadrant dir is a normal, common state (CONTEXT.md D5) -- same
// "absent capability = clean skip" contract `checkChangelogUnreleasedStale`
// already gives a missing CHANGELOG.md.
function checkEnduserDocsIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const { entries, previousContent } = computeEnduserDocsIndex(root, fgosDir);
  if (previousContent === undefined) {
    return {
      passed: true,
      message: `${manifestPathFor(root)} not found -- nothing to check (project has not generated an end-user doc index yet)`,
    };
  }
  const indexedPaths = new Set(JSON.parse(previousContent).map((e) => e.docPath));
  const total = entries.length;
  const missing = entries.filter((e) => !indexedPaths.has(e.docPath)).length;
  if (missing === 0) {
    return { passed: true, message: `${total}/${total} tài liệu end-user có trong index -- up to date` };
  }
  return {
    passed: false,
    message: `${missing}/${total} tài liệu end-user chưa có trong index -- chạy fgos docs-index`,
  };
}

// Idempotent (same discipline `fixGateBypassConfigured` already uses):
// reuses `generateEnduserDocsIndex` -- the exact same generation path
// `fgos docs-index` runs -- so fix output is byte-identical to running
// that verb directly (CONTEXT.md D4), never a reimplementation.
function fixEnduserDocsIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const { path: manifestRelPath, count, changed } = generateEnduserDocsIndex(root, fgosDir);
  if (!changed) {
    return { changed: false, message: `${manifestRelPath} already up to date (${count} tài liệu)` };
  }
  return { changed: true, message: `regenerated ${manifestRelPath} (${count} tài liệu)` };
}

registerCheck({
  id: 'enduser-docs-index-stale',
  description: 'docs/enduser-docs-index.json covers every on-disk end-user doc (tsk-1m0)',
  check: (cwd) => checkEnduserDocsIndexStale(cwd),
});

registerFix({
  id: 'enduser-docs-index-stale',
  fix: (cwd) => fixEnduserDocsIndexStale(cwd),
});
