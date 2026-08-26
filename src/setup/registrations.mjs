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

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { detectRcFiles, hasSourceLine, deadSourceLines, probeShellIntegrationInvocation } from './shell-rc.mjs';
import { mergeConfigDefaults } from './config-merge.mjs';
import { mainCheckoutHookWired } from './git-hooks.mjs';
import { claudeCodeHookWired } from './claude-code-hooks.mjs';
import { checkAgyPermissionsConfigured, fixAgyPermissionsConfigured } from './agy-permissions.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../runner/dispatch.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { resolveFgosFile, FGOS_FILE } from '../state/fgos-file-registry.mjs';
import { detectTrunk } from '../runner/worktree.mjs';
import { listWork, StoreError } from '../state/store.mjs';
import { driftStatus, unmergedDeliveries } from '../state/drift-status.mjs';
import { postLandDrift } from '../state/postland-drift.mjs';
import { computeEnduserDocsIndex, generateEnduserDocsIndex, manifestPathFor } from '../report/enduser-index-generate.mjs';
import { computeDecisionIndex, generateDecisionIndex, indexPathFor } from '../report/decision-index.mjs';
import { isResolvedStatus } from '../state/frontier.mjs';
import { DOMAINS, getDomain, resolveDomainName, effectiveStage, resolveTaskSpecPath } from '../state/workflow-stage-graphs.mjs';
import { readLocalStatus, classifyRegistryPosture, toolsFromExecutors } from '../state/tool-registry.mjs';
import { resolveCliVersionInfo } from '../cli/version.mjs';
import { describeConfigAwareness } from '../config/global-config.mjs';
import { resolveFgosBin, refreshGlobalBinCache } from './bin-discovery.mjs';
import {
  sharedConfigFilePath,
  readSharedConfig,
  writeSharedConfig,
  readInvariantCheckCommands,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
} from '../config/shared-config-file.mjs';
import { DEFAULT_LEVEL, LEVELS } from '../state/gate-bypass.mjs';
import { DEFAULT_WORKER_SLOT_CEILING } from '../state/worker-slots.mjs';
import { advanceEventsJsonlTruncationGuard, DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC } from '../state/events-jsonl-truncation-guard.mjs';
import { verifyCompactionCandidate } from '../state/events-compaction.mjs';
import { readMainCheckoutGuardWarnings } from '../state/main-checkout-guard-warnings.mjs';
import { computeKnowledgeProjection } from '../report/knowledge-projection.mjs';
import { rebuild } from '../state/store.mjs';
import { resolveDocPath } from '../report/knowledge-resolver.mjs';
import { findDuplicateAuthoritativeClaims } from '../report/authoritative-match.mjs';
import { parseFrontmatter } from '../report/frontmatter.mjs';

export { mainCheckoutHookWired } from './git-hooks.mjs';
export { claudeCodeHookWired } from './claude-code-hooks.mjs';

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
 * common-dir-parent shape as `worktree.mjs`'s `isMainWorktree`. Delegates to
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

// tsk-2ej: not a staleness detector -- `doctor` can only ever report on
// whatever build is actually running it, so it structurally cannot tell
// itself apart from a newer release. What this check gives is the thing
// that friction was missing: the running build's own version/commit made
// legible on demand, the first thing to compare when a verb comes back
// "unknown" on some other machine, without needing to read node_modules
// directly (blocked by this repo's own scout-block hook).
function checkCliVersionVisible() {
  const info = resolveCliVersionInfo();
  if (!info.packageVersion || !Array.isArray(info.verbs) || info.verbs.length === 0) {
    return { passed: false, message: 'fgos version did not resolve a packageVersion/verbs -- src/cli/version.mjs is broken' };
  }
  const commitPart = info.gitCommit ? ` (${info.gitCommit})` : ' (no git commit -- not a git checkout)';
  return { passed: true, message: `fgos ${info.packageVersion}${commitPart} — ${info.verbs.length} verbs` };
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

// tsk-2qc-1 D3: an npm-installed, non-git copy has no `fgos-shell-
// integration.sh` rc line to check for at all -- npm's own global install
// already links a real `fgos` binary onto PATH, no rc sourcing needed. The
// PRE-tsk-2qc-1 behavior silently reported "nothing to check" regardless of
// whether that PATH link (or a dev/project-local bin) actually resolved --
// the fail-open gap D3 exists to close. What actually matters for this
// case is whether SOME tier of `resolveFgosBin` resolves; extracted as its
// own function so it is unit-testable without needing a genuinely
// non-git `import.meta.url` (`integrationScriptPath()` always resolves
// inside this repo's own git checkout when its OWN test suite runs it).
export function describeNonGitShellIntegration(cwd) {
  const resolved = resolveFgosBin(cwd);
  if (resolved) {
    return {
      passed: true,
      message: `not inside a git checkout — no rc sourcing needed; fgos resolved via tier ${resolved.tier} at ${resolved.path}`,
    };
  }
  return {
    passed: false,
    message: 'not inside a git checkout and no fgos bin reachable at any of the 3 tiers (dev-checkout, project-local, global PATH) -- run "npm install -g github:vantt/forgent"',
  };
}

function checkShellIntegrationSourced(cwd) {
  const scriptPath = integrationScriptPath();
  if (scriptPath === null) {
    return describeNonGitShellIntegration(cwd);
  }
  const rcFiles = detectRcFiles(os.homedir());
  if (rcFiles.length === 0) {
    return { passed: true, message: 'no shell rc file(s) detected — nothing to check' };
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
  // tsk-2wpi: a source line can be textually present and correct while the
  // function it defines is dead (e.g. a harness snapshot dropping an
  // underscore-prefixed helper the function depends on) -- the checks
  // above can't tell the difference, since neither ever actually invokes
  // the resulting shell function. Only probe once integration is active
  // somewhere (missing.length < rcFiles.length) -- the failure mode lives
  // in the shared script itself, not in which rc file references it, so
  // one probe against scriptPath covers every rc file that sources it.
  if (missing.length < rcFiles.length) {
    // FGOS_SHELL_INTEGRATION_PROBE_SCRIPT (test-only seam, mirrors
    // FGOS_CLAUDE_COMMAND/FGOS_GH_COMMAND below): lets a test probe a
    // disposable fixture script instead of this repo's own real, live
    // scripts/fgos-shell-integration.sh -- needed because integrationScriptPath()
    // always resolves to the real file (derived from import.meta.url, not
    // cwd), so a passing-case test would otherwise couple its own
    // assertion to whatever state that real file happens to be in.
    const probeTarget = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT || scriptPath;
    const { ok, strippedFunctions } = probeShellIntegrationInvocation(probeTarget);
    if (!ok) {
      const helperNote = strippedFunctions.length > 0
        ? ` after stripping ${strippedFunctions.join(', ')} (an underscore-prefixed helper a harness shell-function snapshot can drop)`
        : '';
      problems.push(
        `sourced correctly, but "fgos --help" fails${helperNote} -- the source line being present is not proof the command actually works`,
      );
    }
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

// tsk-2t9c (multi-role team harness, D6/D9 task-spec A-lite convention;
// AGENTS.md's install/setup/doctor gate): every domain's `taskSpecMap`
// (src/state/workflow-stage-graphs.mjs) names task-spec ids a stage-skill
// will read as read-first material at runtime -- a missing file degrades
// that skill silently, so this makes the gap visible. Read-only (RUL9):
// never writes, never scaffolds a stub (a stub contract is worse than an
// absent one -- it looks authoritative while saying nothing).
function checkTaskSpecsResolve(cwd) {
  const missing = [];
  for (const [domainName, domain] of Object.entries(DOMAINS)) {
    const taskSpecMap = domain.taskSpecMap;
    if (!taskSpecMap) continue;
    for (const [stage, specId] of Object.entries(taskSpecMap)) {
      const specPath = resolveTaskSpecPath(domainName, specId, cwd);
      if (!fs.existsSync(specPath)) {
        missing.push(`${domainName}.taskSpecMap.${stage} -> "${specId}" (${path.relative(cwd, specPath)} not found)`);
      }
    }
  }
  const CORE_TASK_SPECS = [
    'fgos-routing',
    'fgos-clarifying',
    'fgos-researching',
    'fgos-unlock',
    'fgos-fanout',
    'fgos-indexing',
    'distill',
  ];
  for (const specId of CORE_TASK_SPECS) {
    const specPath = resolveTaskSpecPath('core', specId, cwd);
    if (!fs.existsSync(specPath)) {
      missing.push(`core.taskSpec -> "${specId}" (${path.relative(cwd, specPath)} not found)`);
    }
  }
  if (missing.length > 0) {
    return { passed: false, message: `missing task-spec file(s): ${missing.join('; ')} -- run fgos-coding-implement's own task-spec item, or docs/how-to/write-a-task-spec.md` };
  }
  return { passed: true, message: 'every domain\'s taskSpecMap entry resolves to a real domains/<domain>/task-specs/ file and core/task-specs/ contains all domain-agnostic task-specs' };
}

function allTaskSpecs(cwd) {
  const specs = [];
  const root = path.join(cwd, 'domains');
  if (fs.existsSync(root)) {
    for (const domainEntry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!domainEntry.isDirectory()) continue;
      const taskSpecsDir = path.join(root, domainEntry.name, 'task-specs');
      if (!fs.existsSync(taskSpecsDir)) continue;
      for (const file of fs.readdirSync(taskSpecsDir)) {
        if (file.endsWith('.md')) {
          specs.push({
            domain: domainEntry.name,
            specId: file.slice(0, -'.md'.length),
            filePath: path.join(taskSpecsDir, file),
          });
        }
      }
    }
  }
  const coreRoot = path.join(cwd, 'core', 'task-specs');
  if (fs.existsSync(coreRoot)) {
    for (const file of fs.readdirSync(coreRoot)) {
      if (file.endsWith('.md')) {
        specs.push({
          domain: 'core',
          specId: file.slice(0, -'.md'.length),
          filePath: path.join(coreRoot, file),
        });
      }
    }
  }
  return specs;
}

// Extracts a `skills:` list's own item strings from raw yaml SOURCE TEXT,
// without a yaml parser dependency. Doctor (`src/setup/registrations.mjs`)
// must keep loading in a plain unpacked copy with no `node_modules/` yet
// (test/setup/checks-setup-rc-line.test.mjs's own "setup from a copy of
// fgos that is not in a git checkout" case proves this is a real,
// exercised scenario) -- a static top-level `import ... from 'yaml'`
// would break module load there even though 'yaml' is a real dependency
// used elsewhere (scripts/project-agents.mjs, run only after `npm
// install`, well after this constraint applies). Supports both block-list
// (`skills:\n  - a\n  - b`) and inline flow (`skills: [a, b]`) styles,
// enough for a diagnostic -- the real authority on whether a source yaml
// is well-formed is project-agents.mjs's own full parse at projection
// time, never this heuristic.
function extractSkillsFromYamlText(text) {
  const inlineMatch = text.match(/^skills:\s*\[([^\]]*)\]\s*$/m);
  if (inlineMatch) {
    return inlineMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  const lines = text.split('\n');
  const skills = [];
  let inBlock = false;
  for (const line of lines) {
    if (/^skills:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    const item = line.match(/^\s+-\s*(\S+)\s*$/);
    if (item) {
      skills.push(item[1]);
      continue;
    }
    if (line.trim() === '') continue;
    break;
  }
  return skills;
}

function parseTaskSpecHeaderFields(headerLine) {
  if (!headerLine) return {};
  const parts = headerLine.split('|').map((p) => p.trim());
  const res = {};
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.slice(0, colonIdx).trim();
    const valStr = part.slice(colonIdx + 1).trim();
    if (key === 'requires-skill' || key === 'agent') {
      if (valStr.startsWith('[') && valStr.endsWith(']')) {
        res[key] = valStr.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      } else if (valStr.includes(',')) {
        res[key] = valStr.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (valStr) {
        res[key] = [valStr];
      } else {
        res[key] = [];
      }
    } else {
      res[key] = valStr;
    }
  }
  return res;
}

// D32 "deterministic, never random": readdirSync's own order is
// filesystem-dependent, not a stable ordering guarantee -- sorted so
// D33's own duplicate-name scan (the caller) reports the same "first
// occurrence wins" file on every machine/run (review finding M2).
function sortedReaddir(dir) {
  return fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));
}

function allAgentYamlFiles(cwd) {
  const files = [];
  const coreDir = path.join(cwd, 'core', 'agents');
  if (fs.existsSync(coreDir)) {
    for (const f of sortedReaddir(coreDir)) {
      if (f.endsWith('.yaml') || f.endsWith('.yml')) {
        files.push({ source: 'core/agents', filePath: path.join(coreDir, f), fileName: f });
      }
    }
  }
  const domainsDir = path.join(cwd, 'domains');
  if (fs.existsSync(domainsDir)) {
    const domainEntries = fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const domainEntry of domainEntries) {
      if (domainEntry.isDirectory()) {
        const domainAgentsDir = path.join(domainsDir, domainEntry.name, 'agents');
        if (fs.existsSync(domainAgentsDir)) {
          for (const f of sortedReaddir(domainAgentsDir)) {
            if (f.endsWith('.yaml') || f.endsWith('.yml')) {
              files.push({ source: `domains/${domainEntry.name}/agents`, filePath: path.join(domainAgentsDir, f), fileName: f });
            }
          }
        }
      }
    }
  }
  const legacyDir = path.join(cwd, 'agents');
  if (fs.existsSync(legacyDir)) {
    for (const f of sortedReaddir(legacyDir)) {
      if (f.endsWith('.yaml') || f.endsWith('.yml')) {
        const fp = path.join(legacyDir, f);
        if (!files.some((item) => item.filePath === fp)) {
          files.push({ source: 'agents', filePath: fp, fileName: f });
        }
      }
    }
  }
  return files;
}

// tsk-397 D20: eligibility direction inverted -- task-spec declares agent/requires-skill,
// agent-type declares skills. Check validates every requires-skill is provided by at least
// one agent-type, and every pinned agent exists.
function checkAgentClaimsResolve(cwd) {
  const agentFiles = allAgentYamlFiles(cwd);
  const agentSkillsMap = new Map();
  for (const file of agentFiles) {
    try {
      const text = fs.readFileSync(file.filePath, 'utf8');
      const nameMatch = text.match(/^name:\s*(\S+)/m);
      const name = nameMatch ? nameMatch[1] : file.fileName.replace(/\.yaml$|\.yml$/, '');
      const skills = extractSkillsFromYamlText(text);
      agentSkillsMap.set(name, new Set(skills));
    } catch {
      continue;
    }
  }

  const allProvidedSkills = new Set();
  for (const skillsSet of agentSkillsMap.values()) {
    for (const s of skillsSet) allProvidedSkills.add(s);
  }

  const taskSpecs = allTaskSpecs(cwd);
  const problems = [];

  for (const spec of taskSpecs) {
    let text;
    try {
      text = fs.readFileSync(spec.filePath, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    const headerLine = lines.find((l) => l.startsWith('domain:'));
    const parsed = parseTaskSpecHeaderFields(headerLine);

    if (Array.isArray(parsed.agent)) {
      for (const agentName of parsed.agent) {
        if (agentSkillsMap.size > 0 && !agentSkillsMap.has(agentName)) {
          problems.push(`task-spec "${spec.specId}" names unknown agent "${agentName}"`);
        }
      }
    }

    if (Array.isArray(parsed['requires-skill'])) {
      for (const reqSkill of parsed['requires-skill']) {
        if (agentSkillsMap.size > 0 && !allProvidedSkills.has(reqSkill)) {
          problems.push(`task-spec "${spec.specId}" requires skill "${reqSkill}" but no agent-type provides it`);
        }
      }
    }
  }

  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: 'every task-spec\'s requires-skill/agent eligibility declaration resolves to real agent skills' };
}

function checkAgentTypeNamesUnique(cwd) {
  const agentFiles = allAgentYamlFiles(cwd);
  const nameToFiles = new Map();
  for (const file of agentFiles) {
    try {
      const text = fs.readFileSync(file.filePath, 'utf8');
      const nameMatch = text.match(/^name:\s*(\S+)/m);
      const name = nameMatch ? nameMatch[1] : file.fileName.replace(/\.yaml$|\.yml$/, '');
      if (!nameToFiles.has(name)) {
        nameToFiles.set(name, []);
      }
      const relPath = path.relative(cwd, file.filePath);
      nameToFiles.get(name).push(relPath);
    } catch {
      continue;
    }
  }

  const duplicates = [];
  for (const [name, paths] of nameToFiles.entries()) {
    if (paths.length > 1) {
      duplicates.push(`"${name}" (${paths.join(', ')})`);
    }
  }

  if (duplicates.length > 0) {
    return {
      passed: false,
      message: `duplicate agent-type name(s) found across core/agents/ and domains/*/agents/: ${duplicates.join('; ')} (D33)`,
    };
  }
  return {
    passed: true,
    message: 'every agent-type name across core/agents/ and domains/*/agents/ is globally unique (D33)',
  };
}

function checkMainCheckoutHookWired(cwd) {
  if (mainCheckoutHookWired(cwd)) {
    return { passed: true, message: 'core.hooksPath = .githooks — main-checkout lock guards every commit here' };
  }
  return { passed: false, message: 'core.hooksPath not wired to .githooks — commits here are NOT guarded against concurrent-writer clobbering (str65) — run fgos setup' };
}

function checkDispatchDecideHookWired(cwd) {
  if (claudeCodeHookWired(cwd)) {
    return { passed: true, message: 'PreToolUse hook wired — every Agent/Task call is routed through dispatch.mjs decide first' };
  }
  return { passed: false, message: '.claude/settings.json has no PreToolUse dispatch-decide hook wired — Agent/Task calls can bypass the decide-first enforcement — run fgos setup' };
}

// tsk-1dj (tool-registry-capability port), CONTEXT.md D1: reports the tool
// registry's posture (inactive/degraded/full), never a hard failure — an
// empty or partially-present registry is never itself a problem (the core
// "absent capability = clean skip" contract this whole item ports), so
// `passed` is always `true` here; only the message carries the posture.
// Reports across every registered tool, never a single hardcoded capability
// (e.g. "impact-analysis") — the registry itself never names one.
//
// tsk-in1-1 D1: tools are no longer event-sourced (`view.tools`) — reads
// `runner.executors` straight from `.fgos/config.json` (via `readSharedConfig`,
// the same raw-read every other doctor check in this file already uses),
// same as `fgos tool check/query` (bin/fgos.mjs) now does.
function checkToolRegistryConfigured(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const fgosDir = path.join(mainCheckout, '.fgos');
  const executors = readSharedConfig(mainCheckout)?.runner?.executors;
  const tools = toolsFromExecutors(executors);
  const localStatus = readLocalStatus(fgosDir);
  const { posture, registeredCount, presentCount, missingCount, unknownCount } = classifyRegistryPosture(tools, localStatus);
  if (posture === 'inactive') {
    return { passed: true, message: 'inactive — no tool-capable executors declared (add one to runner.executors in .fgos/config.json)' };
  }
  if (posture === 'full') {
    return { passed: true, message: `full — ${presentCount}/${registeredCount} registered tool(s) present` };
  }
  // tsk-3oa2: degraded used to report passed:true, the same as full --
  // meaning AGENTS.md's impact-analysis capability gate's own "Degraded"
  // branch (a tool registered but not present, or present but stale) had
  // no doctor signal a person would ever see flagged. A registered tool
  // that is missing or was never checked here is a real gap, not a clean
  // skip the way "nothing registered at all" (inactive) is.
  return {
    passed: false,
    message: `degraded — ${presentCount}/${registeredCount} registered tool(s) present (${missingCount} missing, ${unknownCount} never checked — run fgos tool check)`,
  };
}

registerCheck({
  id: 'node-version-and-git',
  description: `Node >=${MIN_NODE_MAJOR} and git available`,
  check: (cwd) => checkNodeAndGit(cwd),
});

registerCheck({
  id: 'cli-version-visible',
  description: 'this build\'s own package version/commit/verb-set resolve cleanly via `fgos version` (tsk-2ej)',
  check: () => checkCliVersionVisible(),
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
  id: 'task-specs-resolve',
  description: 'every domain\'s taskSpecMap entry resolves to a real domains/<domain>/task-specs/ file (tsk-2t9c D6/D9)',
  check: (cwd) => checkTaskSpecsResolve(cwd),
});

registerCheck({
  id: 'agent-claims-resolve',
  description: 'every agent-type\'s claims list (agents/*.yaml) names real task-specs (tsk-2t9c D12)',
  check: (cwd) => checkAgentClaimsResolve(cwd),
});

registerCheck({
  id: 'agent-type-names-unique',
  description: 'every agent-type name across core/agents/ and domains/*/agents/ is globally unique (D33)',
  check: (cwd) => checkAgentTypeNamesUnique(cwd),
});

registerCheck({
  id: 'main-checkout-hook-wired',
  description: 'core.hooksPath wired to .githooks (str65 main-checkout lock guards every commit)',
  check: (cwd) => checkMainCheckoutHookWired(cwd),
});

registerCheck({
  id: 'dispatch-decide-hook-wired',
  description: '.claude/settings.json PreToolUse hook enforces dispatch.mjs decide on every Agent/Task call',
  check: (cwd) => checkDispatchDecideHookWired(cwd),
});

registerCheck({
  id: 'tool-registry-configured',
  description: 'tool registry posture — inactive/degraded/full (tsk-1dj)',
  check: (cwd) => checkToolRegistryConfigured(cwd),
});

registerCheck({
  id: 'agy-permissions-configured',
  description: 'agy settings.json has a working command denylist instead of relying only on --dangerously-skip-permissions (tsk-1xm)',
  check: () => checkAgyPermissionsConfigured(),
});

registerFix({
  id: 'agy-permissions-configured',
  fix: () => fixAgyPermissionsConfigured(),
});

// tsk-5m7 (docs/history/tsk-3bn-merge-conductor-harness-v2/): a real
// actionable problem, same class as the hook/config checks above — a root
// branch that's drifted ahead of its target with nothing having synced it
// is exactly the failure mode tsk-3bn's own origin incident reproduced.
// `passed: false` (not just an informational message) so it surfaces the
// same way a stale-config or unwired-hook check does.
// tsk-4qu: a SECOND drift class this check used to stay silent about. A leaf
// always merges into `fgw/<root>` (graph-harness.mjs's mergeTier reads
// `item.parent` alone, never the root's status), so a leaf approved after its
// root already reached delivered/retrospective/cleanup/done lands its work on
// a branch nothing will carry forward: driftStatus deliberately reports
// `needsSync: false` for a resolved root (drift-status.mjs:93), which keeps it
// out of mergeReadiness's `blockedOnSync` bucket, which is the only thing
// `fgos merge next` auto-syncs (bin/fgos.mjs's merge-next branch). Observed
// live twice before anyone noticed — tsk-4ns onto fgw/tsk-5wz, and tsk-53n
// onto fgw/tsk-1o7 — with `fgos merge list` reporting every bucket empty
// while real delivered work sat outside main.
//
// `needsSync` is deliberately NOT widened to cover this: `merge next` acts on
// it by running a real `sync-root` git mutation unattended, and auto-merging
// the branch of an item that is already closed out is a behavior change
// nobody asked for on the riskiest path here. driftStatus already computes
// the honest `aheadOfTarget` for these roots, so surfacing them is a filter
// change, not new measurement.
//
// `wontfix` is excluded on purpose: an abandoned item's branch is SUPPOSED to
// sit outside its target forever, so reporting it would be pure noise (a
// repo-wide scan at the time of writing found 4 such branches, all
// legitimate). `isResolvedStatus` alone cannot express this — it folds
// `wontfix` in with the completed statuses by design — so the completed set
// is spelled out here rather than widening frontier.mjs's exported surface
// for one caller.
const COMPLETED_ROOT_STATUSES = new Set(['delivered', 'retrospective', 'cleanup', 'done']);

function checkRootDrift(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const drift = driftStatus(mainCheckout, view, { trunk: detectTrunk(mainCheckout) });

  const describe = ([id, status]) =>
    `${id} (${status.branch} is ${status.aheadOfTarget} commit(s) ahead of ${status.target})`;

  const needsSync = [];
  const strandedAfterClose = [];
  for (const entry of Object.entries(drift)) {
    const [id, status] = entry;
    // tsk-1l9 follow-up: `aheadOfTarget` answers "how many commits", not "is
    // anything stranded". A root that only merged its target back into itself
    // is many commits ahead carrying nothing, and a branch whose commits all
    // landed by another route is a stale ref. Both were reported here as
    // drift needing a sync, forever, with no sync able to clear them --
    // fgw/tsk-4n7 and fgw/tsk-19y are exactly that shape today. Skipping them
    // is a REPORTING change only: `needsSync` itself is untouched, so `fgos
    // merge next`'s auto-sync path behaves exactly as before.
    if (status.carriesContent === false) continue;
    if (status.needsSync) {
      needsSync.push(entry);
    } else if (status.aheadOfTarget > 0 && COMPLETED_ROOT_STATUSES.has(view.work[id]?.status)) {
      strandedAfterClose.push(entry);
    }
  }

  if (needsSync.length === 0 && strandedAfterClose.length === 0) {
    return { passed: true, message: 'no root branch is drifted ahead of its target' };
  }

  const parts = [];
  if (needsSync.length > 0) {
    parts.push(`drifted root branch(es) need syncing: ${needsSync.map(describe).join(', ')}`);
  }
  if (strandedAfterClose.length > 0) {
    parts.push(
      'root branch(es) closed out with work still outside their target — nothing will sync these '
        + `automatically: ${strandedAfterClose.map(describe).join(', ')}`,
    );
  }
  return {
    passed: false,
    message: `${parts.join('; ')} — run fgos sync-root <root-id>`,
  };
}

function checkLeafNotifyDrift(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const drift = postLandDrift(mainCheckout, view, { trunk: detectTrunk(mainCheckout) });
  const entries = Object.entries(drift);
  if (entries.length === 0) {
    return { passed: true, message: 'no live session branch has post-land drift against its target' };
  }

  const describe = ([id, info]) =>
    `${id} (${info.branch} overlaps ${info.shared.join(', ')} with ${info.target})`;

  return {
    passed: false,
    message: `live session branch(es) have post-land drift against their target: ${entries.map(describe).join(', ')}`,
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

// tsk-64h: the stage-axis sibling of the risk/kind check above, and the
// same class of drift — a domain may retire a stage (coding dropped
// `clarify` outright, tsk-qod D1/D2) while items still sit on it. Unlike
// risk/kind, there is no write door to grandfather against: `stage` is not
// in `EDITABLE_FIELDS` (store.mjs) and only `moveStage` may change it, so
// a stranded item cannot be corrected by an edit at all — it has to be
// drained forward through a registered transition or migrated. That makes
// the drift quieter, not rarer: three items sat at retired `clarify` with
// nothing surfacing them until a migration script tripped over them.
//
// `effectiveStage`, not a bare `item.stage`, so the lazy Execute default
// (D8 — an item that never had `stage` written) reads as the stage every
// other consumer already treats it as, instead of being flagged as
// out-of-vocabulary for being absent. OPEN items only (`!isResolvedStatus`,
// the one shared open/closed definition), same reasoning as the check
// above: a resolved item's stage no longer routes anything.
function checkWorkStageVocabulary(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const violations = [];
  for (const item of Object.values(view.work)) {
    if (isResolvedStatus(item)) continue;
    const domainName = resolveDomainName(item.domain, { onUnrecognized: () => {} });
    const domain = getDomain(domainName);
    const stage = effectiveStage(item, domain);
    if (!domain.stages.includes(stage)) {
      violations.push(`${item.id} (stage: "${stage}", domain: "${domainName}")`);
    }
  }
  if (violations.length === 0) {
    return { passed: true, message: 'every open item sits at a stage still registered by its domain' };
  }
  return {
    passed: false,
    message: `${violations.length} open item(s) at a stage their domain no longer registers: ${violations.join(', ')} — no verb can relabel a live item's stage; drain each one forward through a registered transition or migrate it (see scripts/migrate-clarify-split.mjs)`,
  };
}

registerCheck({
  id: 'work-stage-vocabulary',
  description: "every open item sits at a stage its own domain still registers — no item stranded on a retired stage (tsk-64h)",
  check: (cwd) => checkWorkStageVocabulary(cwd),
});

// tsk-ogx: the registry-shape sibling of the two domain-vocabulary checks
// above -- those two catch a work ITEM drifting from its domain's declared
// vocabulary; this one catches the domain's own DECLARATION drifting
// internally. `skillMap` stays domain-level by design, never per-workflow
// (tsk-2t9c D7/D16/D17 -- see docs/history/domain-workflow-skillmap-
// coverage-check/RESEARCH.md), so the real risk once a second workflow
// registers is a stage name with no skillMap owner at all -- silent at
// runtime (`skillForStage`, workflow-stage-graphs.mjs, deliberately folds
// "declared null" and "key absent" to the same `null` for its own hot-path
// caller), loud here instead.
//
// `domain.workflows` does not exist on `main` yet (tsk-2t9c is unmerged) --
// a domain with no `workflows` field falls back to its own `stages` array
// as the one implicit workflow it has today, so this check is real and
// green on `main` right now, and automatically covers every workflow a
// domain registers later with zero further change to this check.
//
// Exported (not just a private closure) so its fail branch is testable
// against a synthetic `domains` map -- the real `DOMAINS` is
// `Object.freeze`d top to bottom and can never carry a deliberately-broken
// fixture the way a work-item store can.
export function findDomainWorkflowSkillMapGaps(domains = DOMAINS) {
  const gaps = [];
  for (const [domainName, domain] of Object.entries(domains)) {
    if (!domain.skillMap) continue;
    const stages = domain.workflows
      ? [...new Set(Object.values(domain.workflows).flatMap((workflow) => workflow.stages ?? []))]
      : (domain.stages ?? []);
    for (const stage of stages) {
      if (!Object.hasOwn(domain.skillMap, stage)) {
        gaps.push(`${domainName}.${stage}`);
      }
    }
  }
  return gaps;
}

function checkDomainWorkflowSkillMapCoverage() {
  const gaps = findDomainWorkflowSkillMapGaps();
  if (gaps.length === 0) {
    return {
      passed: true,
      message: "every stage across every domain's registered workflow(s) resolves to a real skillMap entry (explicit null allowed)",
    };
  }
  return {
    passed: false,
    message: `${gaps.length} stage(s) missing a skillMap entry entirely (explicit null is fine, a missing key is not): ${gaps.join(', ')}`,
  };
}

registerCheck({
  id: 'domain-workflow-skillmap-coverage',
  description: "every stage name across all of a domain's registered workflows resolves to a real skillMap entry, explicit null allowed (tsk-ogx)",
  check: () => checkDomainWorkflowSkillMapCoverage(),
});

registerCheck({
  id: 'root-drift',
  description: 'every fgw/<root> branch is in sync with its real target — no unsynced drift left over from a leaf merge (tsk-3bn)',
  check: (cwd) => checkRootDrift(cwd),
});

registerCheck({
  id: 'leaf-notify-drift',
  description: 'every live session branch has no post-land drift against its target (tsk-1el)',
  check: (cwd) => checkLeafNotifyDrift(cwd),
});

// tsk-1l9: the LEAF-inclusive sibling of root-drift above. `root-drift` only
// walks items that some other item calls `parent`, so an ordinary leaf marked
// handed-over with its branch still off trunk is invisible to it — and
// `delivered` is reachable through a bare `fgos move`, which merges nothing
// and demands no proof that anything merged. Nothing else closes the gap:
// `fgos stale`'s post-delivery bucket waits a three-day TTL and then reports
// "forgotten", never "unmerged". It happened three times before this check
// existed — tsk-4b2, then tsk-64h and tsk-2t5 together — each time losing
// real, tested, reviewed work outside main until someone read the graph by
// hand.
//
// Mechanical, no judgment: `git merge-base --is-ancestor fgw/<id> <trunk>`,
// then a patch-id comparison to separate "this ref was never merged" from
// "this work is missing". An item with no local branch is skipped rather than
// flagged, since the branch is often cleaned up after a genuine merge; so is
// a branch whose every commit already has a patch-equivalent on trunk, which
// carried its content in by some other route and is only a stale ref.
function checkDeliveredNotOnTrunk(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = listWork(path.join(mainCheckout, '.fgos'));
  const stranded = unmergedDeliveries(mainCheckout, view, { trunk: detectTrunk(mainCheckout) });
  const entries = Object.entries(stranded);
  if (entries.length === 0) {
    return { passed: true, message: "every handed-over item's content is on the trunk" };
  }

  // Two causes, two fixes — see unmergedDeliveries' own comment. Reported
  // separately so the reader is not sent to re-merge a leaf that already
  // merged correctly into a root that simply has not synced yet.
  const neverMerged = entries.filter(([, s]) => s.landedOn === null);
  const awaitingRootSync = entries.filter(([, s]) => s.landedOn !== null);
  const parts = [];
  if (neverMerged.length > 0) {
    parts.push(
      `${neverMerged.length} item(s) marked handed-over whose branch merged nowhere: `
        + `${neverMerged.map(([id, s]) => `${id} (${s.status}, ${s.branch}, ${s.unmatched} commit(s) not on trunk by patch-id)`).join(', ')}`
        + ' — land the content through a new item, never by re-driving the closed item\'s status backward',
    );
  }
  if (awaitingRootSync.length > 0) {
    parts.push(
      `${awaitingRootSync.length} item(s) landed on a root branch that has not reached the trunk: `
        + `${awaitingRootSync.map(([id, s]) => `${id} (${s.status}, on ${s.landedOn})`).join(', ')}`
        + ' — run fgos sync-root on the root, not on these',
    );
  }
  return { passed: false, message: parts.join('; ') };
}

registerCheck({
  id: 'delivered-not-on-trunk',
  description: "every item whose status says its work was handed over has its fgw/<id> branch reachable from the trunk (tsk-1l9)",
  check: (cwd) => checkDeliveredNotOnTrunk(cwd),
});

// events-jsonl-not-truncated (tsk-cgg, docs/history/events-jsonl-git-
// tracked-truncation/CONTEXT.md D1): catches a stash/checkout/reset/clean-
// style silent truncation of the shared, git-tracked .fgos/events.jsonl --
// a failure class a seq-contiguity check is structurally blind to, since
// a truncate-then-reappend renumbers forward and stays perfectly
// contiguous. See src/state/events-jsonl-truncation-guard.mjs's own
// header for the full detection mechanism. No matching registerFix: a
// break here means real data is already gone -- auto-repairing would
// erase the loud signal before a human ever saw it, defeating the
// reason this check exists. The
// re-baseline-after-acknowledgment step is a deliberate, documented
// manual command (docs/how-to/resolve-an-events-jsonl-truncation.md), not
// a blanket `doctor --fix` sweep.
// Tầng A/T5 (TA-D10): checks baseline-0 AND every per-writer file under
// .fgos/events/, each against its OWN entry in the shared guard sidecar
// (the same `events/<name>` fileKey scheme `runOpportunisticMainCheckout
// Checks` uses, so the two never disagree about which mark belongs to
// which file). Per-session files stay git-tracked (TA-D2 only removes the
// NEED for merge=union, not git tracking itself), so they carry the exact
// same git reset/checkout/stash truncation risk baseline-0 always has
// (tsk-cgg) — leaving this check baseline-only would be Tầng A quietly
// opening a new observability gap.
function checkEventsJsonlNotTruncated(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const fgosDir = path.join(mainCheckout, '.fgos');
  const guardPath = resolveFgosFile(fgosDir, FGOS_FILE.GUARD_MARK);
  const filesToCheck = [{ fileKey: 'events.jsonl', logPath: path.join(fgosDir, 'events.jsonl') }];
  const eventsDirPath = path.join(fgosDir, 'events');
  try {
    const names = fs
      .readdirSync(eventsDirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name);
    for (const name of names) filesToCheck.push({ fileKey: `events/${name}`, logPath: path.join(eventsDirPath, name) });
  } catch {
    // .fgos/events/ doesn't exist yet -- baseline-0 alone is still checked below
  }

  const existingFiles = filesToCheck.filter(({ logPath }) => fs.existsSync(logPath));
  if (existingFiles.length === 0) {
    return { passed: true, message: 'no .fgos/events.jsonl yet — nothing to check' };
  }

  const broken = [];
  for (const { fileKey, logPath } of existingFiles) {
    const report = advanceEventsJsonlTruncationGuard(logPath, guardPath, fileKey);
    if (!report.ok) broken.push({ fileKey, message: report.message });
  }

  if (broken.length === 0) {
    return {
      passed: true,
      message: `truncation guard holds across events.jsonl${existingFiles.length > 1 ? ` + ${existingFiles.length - 1} per-writer file(s)` : ''}`,
    };
  }
  return {
    passed: false,
    message: `truncation detected in ${broken.map((b) => b.fileKey).join(', ')}: ${broken[0].message} — see docs/how-to/resolve-an-events-jsonl-truncation.md`,
  };
}

registerCheck({
  id: 'events-jsonl-not-truncated',
  description: 'shared .fgos/events.jsonl has not been silently reverted by a git stash/checkout/reset/clean (tsk-cgg)',
  check: (cwd) => checkEventsJsonlNotTruncated(cwd),
});

// events-compaction-verified (Tầng A/T6, TA-D6): retroactively re-proves
// every past compaction recorded in .fgos/events/archive/*.manifest.json
// still holds -- re-reads the manifest's own `baseline` (still a live file
// under .fgos/events/) and its `originals` (now under archive/) and re-runs
// the SAME verify gate compactColdWriterFiles ran before archiving anything
// (deep-equal view + count + hash-set, src/state/events-compaction.mjs).
// No matching registerFix, same posture as events-jsonl-not-truncated above:
// a break here means the compacted baseline and its own archived originals
// have drifted apart after the fact (tampering, partial restore, a bug) --
// real data may be at stake, so this only ever surfaces the finding for a
// human to investigate (docs/how-to/... none yet; the manifest + both file
// sets are still on disk for manual inspection), never auto-repairs.
function checkEventsCompactionVerified(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const eventsDirPath = path.join(mainCheckout, '.fgos', 'events');
  const archiveDirPath = path.join(eventsDirPath, 'archive');
  let manifestNames = [];
  try {
    manifestNames = fs
      .readdirSync(archiveDirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.manifest.json'))
      .map((entry) => entry.name);
  } catch {
    return { passed: true, message: 'no compactions recorded yet — nothing to verify' };
  }
  if (manifestNames.length === 0) {
    return { passed: true, message: 'no compactions recorded yet — nothing to verify' };
  }

  // Never throws (same contract events-jsonl-not-truncated above already
  // keeps): a corrupt line in an archived original
  // or the baseline itself is exactly the "tampering, partial restore, a
  // bug" shape this check exists to catch, per its own doc comment above --
  // it must surface as a normal `broken` finding, never crash the rest of
  // `fgos doctor` (bin/fgos.mjs's doctor handler runs every check in one
  // .map(), with no per-check try/catch of its own).
  const broken = [];
  for (const manifestName of manifestNames) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(archiveDirPath, manifestName), 'utf8'));
      const baselinePath = path.join(eventsDirPath, manifest.baseline);
      if (!fs.existsSync(baselinePath)) {
        broken.push({ manifest: manifestName, reason: `baseline "${manifest.baseline}" is missing` });
        continue;
      }
      const originalEntries = [];
      let missingOriginal = null;
      for (const name of manifest.originals ?? []) {
        const originalPath = path.join(archiveDirPath, name);
        if (!fs.existsSync(originalPath)) {
          missingOriginal = name;
          break;
        }
        originalEntries.push({ name, events: readEventsJsonLines(originalPath) });
      }
      if (missingOriginal) {
        broken.push({ manifest: manifestName, reason: `archived original "${missingOriginal}" is missing` });
        continue;
      }
      const candidateEvents = readEventsJsonLines(baselinePath);
      const verify = verifyCompactionCandidate(originalEntries, candidateEvents);
      if (!verify.ok) {
        broken.push({ manifest: manifestName, reason: verify.reason });
      }
    } catch (err) {
      broken.push({ manifest: manifestName, reason: `could not verify: ${err.message}` });
    }
  }

  if (broken.length === 0) {
    return { passed: true, message: `${manifestNames.length} past compaction(s) verified — baseline still matches its archived originals` };
  }
  return {
    passed: false,
    message: `compaction verify gate no longer holds for ${broken.map((b) => `${b.manifest} (${b.reason})`).join(', ')}`,
  };
}

function readEventsJsonLines(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line));
}

registerCheck({
  id: 'events-compaction-verified',
  description: 'every past .fgos/events/ compaction (archive/*.manifest.json) still deep-equal/count/hash-set matches its archived originals (Tầng A/T6)',
  check: (cwd) => checkEventsCompactionVerified(cwd),
});

// main-checkout-guard-warnings (tsk-1vc-3 D6, docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md):
// surfaces recordMainCheckoutGuardWarning's write-only output (main-checkout-guard-warnings.jsonl)
// to fgos doctor.
function checkMainCheckoutGuardWarnings(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const warnings = readMainCheckoutGuardWarnings(mainCheckout);
  if (warnings.length === 0) {
    return { passed: true, message: 'no main checkout guard warnings recorded' };
  }
  const latest = warnings[warnings.length - 1];
  return {
    passed: false,
    message: `${warnings.length} main checkout guard warning(s) recorded — latest: [${latest.ts}] ${latest.reason}: ${latest.message}`,
  };
}

registerCheck({
  id: 'main-checkout-guard-warnings',
  description: 'main checkout eventlog guard warnings log has no recorded regression or truncation warnings (D6)',
  check: (cwd) => checkMainCheckoutGuardWarnings(cwd),
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

// tsk-2uf-3 (docs/history/dispatch-activation-and-handoff-redesign/
// CONTEXT.md D2): the two role-by-intelligence capability slots --
// `advise` (value comes from disagreement, never changes state, one
// question/one answer) and `execute` (value comes from compliance,
// changes files, must pass verify). `decide --for <purpose>` already
// validates a `--for` name against `runner.capabilities` (dispatch.mjs's
// `validateCapabilitiesShape`/`resolveExecutorAndOverrides`), but the
// shared config's `capabilities` map shipped with neither name declared,
// so neither purpose could ever resolve. Layered onto the SAME `runner`
// config-default below (never a second, colliding `key: 'runner'`
// registration -- `assembleRegistryDefaults` combines registrations by
// flat per-key assignment, not a deep merge across entries sharing a
// key) so `DEFAULT_RUNNER_CONFIG` itself (src/runner/dispatch.mjs,
// tsk-2uf-1's own footprint) stays untouched -- this only ADDS a
// `capabilities` key that constant has never declared. Deliberately no
// `prefer`/`aliases`/`overrides`: naming which executor serves a purpose
// is a dispatch-mechanism decision, and tsk-5tm-3 D5 forbids `execute`
// (or, by the same reasoning, this registration) re-deciding that.
export const DEFAULT_CAPABILITY_SLOTS = Object.freeze({
  advise: {
    description:
      'Async product-decision consult -- value comes from disagreement, never changes state, one question/one answer (D2, docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md)',
  },
  execute: {
    description:
      'Compliance-driven work -- value comes from following the plan, changes files, must pass verify (D2, docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md)',
  },
});

// tsk-47r: `pi` as a second `agent`-kind executor, layered onto this SAME
// `runner` config-default for the same reason `capabilities` above is (a
// second `key: 'runner'` registration would silently overwrite this one,
// never merge with it). `executors.pi` mirrors `executors.agy`'s live
// shape exactly (`.fgos/config.json`, hand-authored, not itself sourced
// from this registration) — `mergeConfigDefaults`'s fill-missing-only
// recursion (`config-merge.mjs`) adds `runner.executors.pi` and
// `runner.modelPolicies["openai-codex"]` on the next `fgos setup` run
// without touching the live `executors.agy`/`modelPolicies.claude`/
// `modelPolicies.gemini` entries. `--provider openai-codex --model
// gpt-5.5` and the `read,write,edit,bash,grep,find,ls` allowlist are the
// EXACT invocation a live D4 proof-test dispatch ran and confirmed GREEN
// (worker contract followed: layered skill-pointer chain read natively,
// footprint honored, correct `[BLOCKED]`/`[DONE]` two-token reporting) —
// see docs/history/pi-executor-runtime-capacity/RESEARCH.md Round 4.
// Exported (mirrors `DEFAULT_CAPABILITY_SLOTS` below it) so the ripple
// tests assert this exact shape instead of duplicating the literal.
export const PI_EXECUTOR_DEFAULT = Object.freeze({
  kind: 'agent',
  description: 'pi coding agent (openai-codex/gpt-5.5) -- reference runtime for the coding-worker-contract, D4 proof-test GREEN (tsk-47r)',
  allowCrossProvider: true,
  invocations: [
    {
      via: 'cli',
      adapter: 'cli-spawn',
      command: 'pi',
      args: [
        '--provider',
        'openai-codex',
        '--model',
        '{model}',
        '--tools',
        'read,write,edit,bash,grep,find,ls',
        '--mode',
        'json',
        '--approve',
        '-p',
        '{prompt}',
      ],
    },
  ],
  providerModel: 'openai-codex',
  rigorOverrides: {
    light: 'lightweight',
    standard: 'lightweight',
    heavy: 'lightweight',
  },
});

registerConfigDefault({
  id: 'runner',
  key: 'runner',
  shape: {
    ...DEFAULT_RUNNER_CONFIG,
    capabilities: DEFAULT_CAPABILITY_SLOTS,
    modelPolicies: {
      ...DEFAULT_RUNNER_CONFIG.modelPolicies,
      'openai-codex': { lightweight: 'gpt-5.5' },
    },
    executors: { pi: PI_EXECUTOR_DEFAULT },
  },
});

// `checkConfigNotStale` above already catches `runner.capabilities` (or
// either slot inside it) being wholly ABSENT, generically, via
// `assembleRegistryDefaults`'s merge -- same "generic scan covers missing,
// a dedicated check covers present-but-malformed" split every other
// present-but-unusable check in this file already follows (gateway/
// workerSlots/invariantChecks above). What slips past the generic scan is
// a slot present as the wrong shape (a string, an array, `null`) -- never
// "missing", so `mergeConfigDefaults` has nothing to add, and `decide
// --for advise`/`--for execute` would still fail validateCapabilitiesShape
// with no doctor signal pointing at why.
function checkAdviseExecuteCapabilitiesConfigured(cwd) {
  const capabilities = readSharedConfig(cwd)?.runner?.capabilities;
  if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
    return {
      passed: false,
      message: 'runner.capabilities section missing -- run fgos setup (decide --for advise/execute cannot resolve until it exists)',
    };
  }
  const missing = ['advise', 'execute'].filter(
    (name) => !capabilities[name] || typeof capabilities[name] !== 'object' || Array.isArray(capabilities[name]),
  );
  if (missing.length > 0) {
    return {
      passed: false,
      message: `runner.capabilities is missing or has a malformed slot for: ${missing.join(', ')} -- run fgos setup`,
    };
  }
  return { passed: true, message: 'runner.capabilities declares both "advise" and "execute"' };
}

registerCheck({
  id: 'advise-execute-capabilities-configured',
  description: 'runner.capabilities declares the "advise" and "execute" purpose slots decide --for resolves against (tsk-2uf-3)',
  check: (cwd) => checkAdviseExecuteCapabilitiesConfigured(cwd),
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

// docs/history/orchestrator-worker-slots/plan.md §Shape T1: the worker-slot
// ceiling is project config, not a runner constant -- registered here so
// `fgos setup` writes the section and `fgos doctor` can see it at all, per
// AGENTS.md's install/setup/doctor gate.
//
// `ceiling` ships as `null` -- present but unarmed -- and that is the whole
// point of this entry (tsk-1oz). Shipping the recommended NUMBER here would
// arm the gate the moment anyone runs `fgos setup`, and `fgos doctor` asks
// every project to run exactly that ("stale config — missing keys ... — run
// fgos setup") as routine maintenance, never as an opt-in. A repo already
// running more items than the recommended number would then have its very
// next `take`/`pick` refused, freezing the whole backlog until a person
// parked enough work by hand. `worker-slots.mjs` already refuses to treat
// silence as a reason to start refusing work; writing a live number here
// would have re-introduced that same trap one command away from the nag
// that points at it. A person arms the gate by replacing `null` with a real
// count (see DEFAULT_WORKER_SLOT_CEILING for the recommended starting
// value), which is the only moment the intent is unambiguous.
//
// `adminReservation` is deliberately NOT a key here. The admin lane
// (merge/retro/cleanup loops plus one spare) is a FIXED reservation whose
// size is constant by definition, not a project knob -- it never claims a
// work item, so nothing counts it and nothing could enforce a different
// number. It lives as `ADMIN_LANE_RESERVATION` in `worker-slots.mjs` and is
// reported by `fgos slots`; offering it as config would have been a dial
// wired to nothing.
registerConfigDefault({
  id: 'workerSlots',
  key: 'workerSlots',
  shape: { ceiling: null },
});

// A present-but-unusable `ceiling` is the misconfiguration that actually
// bites, and it fails SILENTLY: `hasWorkerSlotRoom` treats anything that is
// not a positive integer as "no ceiling configured" and allows every claim,
// so a project that believes it is capped runs uncapped. `"8"` (a string,
// the easiest hand-edit slip), `8.5`, `0` and `-1` all land there. The
// generic `checkConfigNotStale` above only catches a wholly-missing section,
// exactly the same blind spot `checkInvariantChecksConfigured` was written
// to cover for `invariantChecks`. `null` is the one non-number that is not a
// mistake: it is what `fgos setup` writes to mean "deliberately unarmed".
function checkWorkerSlotsCeiling(cwd) {
  // Deliberately NOT the fail-soft reader the claim paths use: those want an
  // unreadable file to read as "no ceiling", but naming a broken config is
  // this check's entire job, and degrading to `{}` would report the file as
  // merely unconfigured while every claim silently ran uncapped.
  let section;
  try {
    section = readSharedConfig(cwd).workerSlots;
  } catch (err) {
    return { passed: false, message: `shared config cannot be parsed, so no worker-slot ceiling can be read: ${err.message}` };
  }
  if (section === undefined) {
    return {
      passed: false,
      message: 'workerSlots section missing -- run fgos setup (no worker-slot ceiling is enforced until it exists)',
    };
  }
  const { ceiling } = section;
  if (ceiling === null || ceiling === undefined) {
    return {
      passed: true,
      message: `workerSlots.ceiling is unarmed (null) -- no claim is refused; set a positive integer (recommended: ${DEFAULT_WORKER_SLOT_CEILING}) to enforce a ceiling`,
    };
  }
  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    return {
      passed: false,
      message: `workerSlots.ceiling is ${JSON.stringify(ceiling)}, which enforces NOTHING -- expected a positive integer (recommended: ${DEFAULT_WORKER_SLOT_CEILING}) or null to mean deliberately unarmed`,
    };
  }
  return { passed: true, message: `workerSlots.ceiling = ${ceiling} running work item(s)` };
}

registerCheck({
  id: 'worker-slots-ceiling-usable',
  description: 'workerSlots.ceiling is either a positive integer or explicitly null (a malformed value silently enforces nothing)',
  check: (cwd) => checkWorkerSlotsCeiling(cwd),
});

// docs/history/tsk-516-approve-reverify-scope/CONTEXT.md D6: the invariant
// check commands are project config, not a hardcoded runner constant --
// registered here so `fgos setup`'s config-merge writes the default and
// `fgos doctor` can see the section at all, the same registry every other
// module's config already goes through.
registerConfigDefault({
  id: 'invariantChecks',
  key: 'invariantChecks',
  shape: { commands: DEFAULT_INVARIANT_CHECK_COMMANDS },
});

registerConfigDefault({
  id: 'checkpoint',
  key: 'checkpoint',
  shape: { fallbackIntervalSec: DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC },
});

// Deliberately does NOT execute the configured commands. `doctor` is a
// cheap, side-effect-free diagnosis (RUL9's doctor-never-writes discipline),
// and these are arbitrary project-supplied shell strings -- running them
// here would let a config entry turn `fgos doctor` into an unbounded, and
// potentially destructive, command. What this check CAN answer without
// executing anything is the misconfiguration that actually bites: a present
// but malformed `invariantChecks` section reads as zero commands at
// return/merge, silently disabling the gate while looking configured.
// `checkConfigNotStale` already covers the wholly-missing case generically
// via the registration above; this covers present-but-unusable.
function checkInvariantChecksConfigured(cwd) {
  const section = readSharedConfig(cwd).invariantChecks;
  if (section === undefined) {
    return {
      passed: false,
      message: 'invariantChecks section missing -- run fgos setup (no invariant check runs at return/merge until it exists)',
    };
  }
  const commands = readInvariantCheckCommands(cwd);
  if (commands.length === 0) {
    return {
      passed: false,
      message: 'invariantChecks is present but yields no runnable command -- expected { "commands": ["<shell command>", ...] } with at least one non-empty string',
    };
  }
  return { passed: true, message: `invariantChecks.commands = ${commands.length} command(s): ${commands.join(' && ')}` };
}

registerCheck({
  id: 'invariant-checks-configured',
  description: 'invariantChecks.commands in the shared config file yields at least one runnable command',
  check: (cwd) => checkInvariantChecksConfigured(cwd),
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

// ironLaw.level (docs/history/iron-law-gate-human-ux/CONTEXT.md D3/D7) — its
// OWN key, modeled on gateBypass's three registrations immediately above but
// deliberately never folded into that section: gateBypass's floor is
// documented as never touching Iron Law (docs/explanation/gate-bypass-
// design.md), and reusing its level vocabulary here would erase that line.
//
// `ask` is both the default this fix writes and what every unreadable value
// degrades to at the gate itself (src/verbs/merge/iron-law-level.mjs's
// readIronLawLevel), so a project that never runs `fgos setup` gets the
// refusing behavior, not the permissive one.
export const IRON_LAW_LEVELS = Object.freeze(['ask', 'warn']);
export const DEFAULT_IRON_LAW_LEVEL = 'ask';

function checkIronLawConfigured(cwd) {
  const level = readSharedConfig(cwd)?.ironLaw?.level;
  if (typeof level !== 'string' || !IRON_LAW_LEVELS.includes(level)) {
    return {
      passed: false,
      message: `ironLaw.level missing or not a recognized level (${IRON_LAW_LEVELS.join('/')}) -- run fgos doctor --fix`,
    };
  }
  return { passed: true, message: `ironLaw.level = "${level}"` };
}

function fixIronLawConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const currentLevel = shared?.ironLaw?.level;
  if (typeof currentLevel === 'string' && IRON_LAW_LEVELS.includes(currentLevel)) {
    return { changed: false, message: `ironLaw.level already "${currentLevel}"` };
  }
  const existingIronLaw =
    shared.ironLaw && typeof shared.ironLaw === 'object' && !Array.isArray(shared.ironLaw)
      ? shared.ironLaw
      : {};
  const merged = { ...shared, ironLaw: { ...existingIronLaw, level: DEFAULT_IRON_LAW_LEVEL } };
  writeSharedConfig(cwd, merged);
  return { changed: true, message: `wrote ironLaw.level = "${DEFAULT_IRON_LAW_LEVEL}" to ${sharedConfigFilePath(cwd)}` };
}

registerConfigDefault({
  id: 'ironLaw',
  key: 'ironLaw',
  shape: { level: DEFAULT_IRON_LAW_LEVEL },
});

registerCheck({
  id: 'iron-law-configured',
  description: 'ironLaw.level in the shared config file is present and a recognized level',
  check: (cwd) => checkIronLawConfigured(cwd),
});

registerFix({
  id: 'iron-law-configured',
  fix: (cwd) => fixIronLawConfigured(cwd),
});

// tsk-4r1 (found by the gateway audit, plans/reports/gateway-audit-
// 260814-2110-fable-hidden-bugs-report.md Finding 9): `gateway.token`/
// `gateway.port` (herdr-plugin/src/gateway.rs's `load_gateway_config`,
// D4/D5) lived nowhere in this registry -- a fresh machine's `fgos setup`
// never provisioned the section, and `fgos doctor` had no way to notice,
// violating AGENTS.md's own install/setup/doctor gate.
//
// This reads/writes `os.homedir()` explicitly, NOT the `cwd` every other
// check/fix in this file receives -- `load_gateway_config` reads
// `~/.fgos/config.json` specifically (a machine-level secret, not a
// per-project one), so checking/fixing `cwd`'s own `.fgos/config.json`
// would silently target the wrong file entirely.
const GATEWAY_HOME_CONFIG_DIR = () => os.homedir();

// Matches herdr-plugin/src/gateway.rs's own `DEFAULT_PORT`.
const DEFAULT_GATEWAY_PORT = 4170;

function checkGatewayTokenConfigured() {
  const home = GATEWAY_HOME_CONFIG_DIR();
  const shared = readSharedConfig(home);
  const token = shared?.gateway?.token;
  if (typeof token !== 'string' || token.trim() === '') {
    return {
      passed: false,
      message: `gateway.token missing from ${sharedConfigFilePath(home)} -- run fgos doctor --fix`,
    };
  }
  return { passed: true, message: 'gateway.token present' };
}

// Idempotent (same discipline fixGateBypassConfigured above already uses):
// an already-present token is left untouched and reported unchanged, never
// rotated out from under a client that already has it.
function fixGatewayTokenConfigured() {
  const home = GATEWAY_HOME_CONFIG_DIR();
  const shared = readSharedConfig(home);
  const existingToken = shared?.gateway?.token;
  if (typeof existingToken === 'string' && existingToken.trim() !== '') {
    return { changed: false, message: 'gateway.token already present' };
  }
  const existingGateway =
    shared.gateway && typeof shared.gateway === 'object' && !Array.isArray(shared.gateway) ? shared.gateway : {};
  // 256 bits, not crypto.randomUUID()'s 122 -- this is a bearer secret,
  // not a non-secret session id (session.mjs's own use of randomUUID is a
  // different kind of value).
  const token = crypto.randomBytes(32).toString('hex');
  const merged = {
    ...shared,
    gateway: { port: existingGateway.port ?? DEFAULT_GATEWAY_PORT, ...existingGateway, token },
  };
  writeSharedConfig(home, merged);
  return { changed: true, message: `wrote a new gateway.token to ${sharedConfigFilePath(home)}` };
}

registerConfigDefault({
  id: 'gateway',
  key: 'gateway',
  // `token: null` -- present but unarmed, the same shape `workerSlots`'s
  // own `ceiling: null` registration already uses below: shipping a real
  // value here would mean every fresh install gets the SAME shared,
  // predictable secret, defeating D4's whole point. A real token only
  // ever comes from fixGatewayTokenConfigured's own crypto.randomBytes
  // call, run explicitly via `fgos doctor --fix`.
  shape: { port: DEFAULT_GATEWAY_PORT, token: null },
});

registerCheck({
  id: 'gateway-token-configured',
  description: 'gateway.token in ~/.fgos/config.json (home, not project) is present and non-empty',
  check: () => checkGatewayTokenConfigured(),
});

registerFix({
  id: 'gateway-token-configured',
  fix: () => fixGatewayTokenConfigured(),
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

// tsk-1no D3 (tsk-2qc-1 D2 widened): the plugin skill layer (`plugins/fgOS/
// skills/*/SKILL.md`) resolves its own CLI independently of this file's
// other checks, via the same 3-tier resolution (dev-checkout > project-
// local > global, cache-first) `bin-discovery.mjs` gives every other
// caller -- this check is now a thin reporting wrapper over
// `resolveFgosBin`, not its own separate local-bin/PATH try/catch.
function checkPluginSkillCliReachable(cwd) {
  const resolved = resolveFgosBin(cwd);
  if (resolved) {
    const tierLabel = resolved.tier === 1 ? 'local bin/fgos.mjs found' : resolved.tier === 2 ? 'project-local install found' : 'fgos resolved from PATH';
    return { passed: true, message: `${tierLabel} at ${resolved.path}` };
  }
  return {
    passed: false,
    message: `no bin/fgos.mjs at ${cwd}, no project-local node_modules/.bin/fgos, and no global fgos install on PATH -- every /fgOS:* slash command will fail on first use (run: npm install -g github:vantt/forgent)`,
  };
}

registerCheck({
  id: 'plugin-skill-cli-reachable',
  description: 'a fgos CLI is reachable from this project (local bin/fgos.mjs, project-local install, or a global PATH install)',
  check: (cwd) => checkPluginSkillCliReachable(cwd),
});

// tsk-2qc-1 D4: the tier-3 (global) config-cache is populated/refreshed
// only here, from `fgos doctor --fix` -- never on every `resolveFgosBin`
// call, which is the whole point of caching the PATH probe instead of
// re-running it. Idempotent and always safe to re-run: a stale cached
// path is simply overwritten with whatever `probeGlobalBin` finds now
// (or cleared, if nothing resolves).
function fixBinDiscoveryCache() {
  const { resolved, changed } = refreshGlobalBinCache();
  if (!changed) {
    return { changed: false, message: resolved ? `global bin-discovery cache already up to date: ${resolved}` : 'global bin-discovery cache already empty (no fgos on PATH)' };
  }
  return resolved
    ? { changed: true, message: `global bin-discovery cache refreshed: ${resolved}` }
    : { changed: true, message: 'global bin-discovery cache cleared (no fgos on PATH)' };
}

registerFix({
  id: 'bin-discovery-cache',
  fix: () => fixBinDiscoveryCache(),
});

// tsk-32b: `plugin-skill-cli-reachable` above only confirms the `fgos` CLI
// binary is reachable -- it says nothing about whether the coding-domain
// dev-skills the plugin's own slash-command skills (cook/discover/plan/
// pick) dispatch into via the Skill tool are actually shipped in
// plugins/fgOS/skills/ (they were not, before tsk-32b's own fix -- a
// plugin-only consumer got "Unknown skill: fgos-coding-driving" the first
// time cook/discover/plan/pick tried to dispatch into one, with the CLI
// itself fully reachable the whole time). This check only ever fires
// against THIS repo's own source tree -- it derives the expected dev-skill
// set from `.claude/skills/fgos-*` and confirms each one also exists under
// `plugins/fgOS/skills/`, catching a maintainer who adds/renames a
// coding-domain dev-skill and forgets to re-copy it into the plugin before
// a release ships (test/skills/fgos-mirror.test.mjs enforces the same
// byte-identical content once both sides exist; this check only checks
// presence, for a fast doctor-level signal). A downstream consumer running
// doctor against their own project (no `.claude/skills/` of this repo's
// own shape at their `cwd`) has nothing for this check to compare, so it
// passes cleanly -- same "absent capability = clean skip" contract every
// other optional check in this file already follows.
function checkPluginDevSkillsPackaged(cwd) {
  const claudeSkillsRoot = path.join(cwd, '.claude', 'skills');
  const pluginSkillsRoot = path.join(cwd, 'plugins', 'fgOS', 'skills');
  if (!fs.existsSync(claudeSkillsRoot) || !fs.existsSync(pluginSkillsRoot)) {
    return { passed: true, message: 'not a forgent checkout (no .claude/skills or plugins/fgOS/skills at this project) -- nothing to check' };
  }
  const devSkillNames = fs
    .readdirSync(claudeSkillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('fgos-'))
    .map((entry) => entry.name)
    .sort();
  const missing = devSkillNames.filter((name) => !fs.existsSync(path.join(pluginSkillsRoot, name, 'SKILL.md')));
  if (missing.length === 0) {
    return { passed: true, message: `all ${devSkillNames.length} coding-domain dev-skills are packaged in plugins/fgOS/skills/` };
  }
  return {
    passed: false,
    message: `${missing.length} coding-domain dev-skill(s) missing from plugins/fgOS/skills/ (present in .claude/skills/): ${missing.join(', ')} -- any repo installing fgOS only as a plugin will hit "Unknown skill" dispatching into these`,
  };
}

registerCheck({
  id: 'plugin-dev-skills-packaged',
  description: 'every coding-domain dev-skill under .claude/skills/fgos-* is also packaged in plugins/fgOS/skills/, so a plugin-only consumer can dispatch into it',
  check: (cwd) => checkPluginDevSkillsPackaged(cwd),
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

// tsk-2t8: README.md's own "## Install" section recommends `npm install -g
// github:vantt/forgent#vX.Y.Z`, a specific pinned tag -- if that tag was
// never actually cut (tag-cutting is a deliberate manual act by design,
// tsk-jtb D1/D2, never automated here), every new external user's
// recommended install command fails outright. Read-only, same "absent =
// clean skip" convention as changelog-unreleased-stale above: no
// README.md, or no pinned-tag line found in it, is not itself a problem
// this check reports on.
const README_INSTALL_TAG_PATTERN = /npm install -g github:[^#\s]+#(v\d+\.\d+\.\d+)/;

function checkReadmeInstallTagExists(cwd) {
  const mainCheckout = resolveMainCheckoutRoot(cwd) ?? cwd;
  const readmePath = path.join(mainCheckout, 'README.md');
  if (!fs.existsSync(readmePath)) {
    return { passed: true, message: 'README.md not found -- nothing to check' };
  }
  const content = fs.readFileSync(readmePath, 'utf8');
  const match = content.match(README_INSTALL_TAG_PATTERN);
  if (!match) {
    return { passed: true, message: 'README.md has no pinned-tag install command -- nothing to check' };
  }
  const tag = match[1];
  let existingTags;
  try {
    existingTags = execFileSync('git', ['tag', '-l', tag], { cwd: mainCheckout, encoding: 'utf8' }).trim();
  } catch {
    return { passed: true, message: `could not list git tags -- nothing to check for "${tag}"` };
  }
  if (existingTags === tag) {
    return { passed: true, message: `README.md's pinned install tag "${tag}" exists` };
  }
  return {
    passed: false,
    message: `README.md recommends installing tag "${tag}", which does not exist -- cut it per docs/how-to/cut-a-fgos-release-tag.md, or update README.md to a tag that does exist`,
  };
}

registerCheck({
  id: 'readme-install-tag-exists',
  description: 'README.md\'s recommended install command pins a git tag that actually exists (tsk-2t8)',
  check: (cwd) => checkReadmeInstallTagExists(cwd),
});

// tsk-2m5 (docs/history/stage-status-driving-coordination/): the
// herdr-launcher's own auto-launch toggles, read fail-closed from Rust
// (herdr-plugin/src/settings.rs). Mirrors gateBypass's own shape exactly
// (config-default + a dedicated check for a present-but-malformed value --
// `checkConfigNotStale` above already catches the section being entirely
// MISSING via `assembleRegistryDefaults()`, same as it does for
// `gateBypass`). No `fix` registration: unlike `gateBypass.level` (a
// single enum value with one obvious correct default), a malformed
// individual boolean here has no demonstrated real-world incident yet
// (YAGNI) -- `ensureSharedConfigDefaults` already fills in a full
// safe-OFF section the first time a project adopts it.
export const DEFAULT_HERDR_ORCHESTRATOR_SETTINGS = {
  autoDiscover: false,
  autoMerge: false,
  autoRetro: false,
  autoCleanup: false,
};

function checkHerdrOrchestratorConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const settings = shared?.herdrOrchestrator;
  if (settings === undefined) {
    return { passed: false, message: 'herdrOrchestrator section missing -- run fgos setup' };
  }
  const badKeys = Object.keys(DEFAULT_HERDR_ORCHESTRATOR_SETTINGS).filter(
    (key) => typeof settings[key] !== 'boolean',
  );
  if (badKeys.length > 0) {
    return {
      passed: false,
      message: `herdrOrchestrator has non-boolean value(s) for: ${badKeys.join(', ')}`,
    };
  }
  return {
    passed: true,
    message: `herdrOrchestrator: ${Object.keys(DEFAULT_HERDR_ORCHESTRATOR_SETTINGS)
      .map((key) => `${key}=${settings[key]}`)
      .join(', ')}`,
  };
}

registerConfigDefault({
  id: 'herdrOrchestrator',
  key: 'herdrOrchestrator',
  shape: DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
});

registerCheck({
  id: 'herdr-launcher-configured',
  description: 'herdrOrchestrator toggles in the shared config file are present and boolean (tsk-2m5)',
  check: (cwd) => checkHerdrOrchestratorConfigured(cwd),
});

// tsk-48w (D14 of docs/history/herdr-web-dashboard-plan-realignment/
// CONTEXT.md, carrying forward D10 of the original cluster's own
// CONTEXT.md): the web dashboard's static-serving toggle, read fail-OPEN
// from Rust (herdr-plugin/src/settings.rs's `WebDashboardSettings` --
// `static_serving: true` when the section/file is missing). Same
// registerConfigDefault + registerCheck shape as `herdrOrchestrator`
// immediately above, deliberately with the opposite default value -- this
// toggle exists to gate the "máy được chọn" (D2) serving the bundle it
// already carries, out of the box, not an auto-launch toggle needing an
// opt-in.
export const DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS = {
  staticServing: true,
};

function checkHerdrWebDashboardConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const settings = shared?.herdrWebDashboard;
  if (settings === undefined) {
    return { passed: false, message: 'herdrWebDashboard section missing -- run fgos setup' };
  }
  if (typeof settings.staticServing !== 'boolean') {
    return { passed: false, message: 'herdrWebDashboard.staticServing is not a boolean' };
  }
  return { passed: true, message: `herdrWebDashboard: staticServing=${settings.staticServing}` };
}

registerConfigDefault({
  id: 'herdrWebDashboard',
  key: 'herdrWebDashboard',
  shape: DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
});

registerCheck({
  id: 'herdr-web-dashboard-configured',
  description: 'herdrWebDashboard.staticServing in the shared config file is present and boolean (tsk-48w)',
  check: (cwd) => checkHerdrWebDashboardConfigured(cwd),
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
  const parsedIndex = JSON.parse(previousContent);
  const indexedPaths = new Set(parsedIndex.map((e) => e.docPath));
  const freshPaths = new Set(entries.map((e) => e.docPath));
  const total = entries.length;
  const missing = entries.filter((e) => !indexedPaths.has(e.docPath)).length;
  const orphans = parsedIndex.filter((e) => !freshPaths.has(e.docPath)).length;
  if (missing === 0 && orphans === 0) {
    return { passed: true, message: `${total}/${total} tài liệu end-user có trong index -- up to date` };
  }
  const parts = [];
  if (missing > 0) {
    parts.push(`${missing}/${total} tài liệu end-user chưa có trong index`);
  }
  if (orphans > 0) {
    parts.push(`${orphans} tài liệu dư thừa trong index`);
  }
  return {
    passed: false,
    message: `${parts.join(', ')} -- chạy fgos docs-index`,
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

// tsk-1lv review-fix F10: `fgos decision-index --check` (tsk-1lv-2)
// existed as a CLI verb but nothing ever called it -- not `npm test`, not
// `fgos doctor` -- so docs/decisions/index.md could drift silently from
// state.decisions the exact same way docs/enduser-docs-index.json used to
// (tsk-1m0, the direct precedent this check/fix pair mirrors: read-only
// `computeDecisionIndex` shared by both the check and the real generate
// path, so this can never diverge from what `fgos decision-index` itself
// would compute). A missing docs/decisions/index.md is a normal state for
// any project with zero platform-scoped decisions logged yet -- same
// "absent capability = clean skip" contract as the enduser-index check.
// tsk-1lv round-2 review, H2: `previousContent === undefined` used to
// always mean "nothing to check" regardless of whether real decisions
// exist to index -- so "the index was deleted (or never generated) while
// 36 real scope-carrying decisions sit in state.decisions" (the exact
// drift this check exists to catch) reported passed:true, with a message
// that asserted "no platform-scoped decisions logged yet" without ever
// looking at whether that was true. Reproduced against the live repo,
// not assumed. Fixed: "nothing to check" now requires BOTH the file
// being absent AND the freshly-computed content having no real rows --
// a missing file with real content to index is the same failure as a
// stale one, just worded for the "never generated" case specifically.
function checkDecisionIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const { previousContent, nextContent, changed } = computeDecisionIndex(root, fgosDir);
  const nextHasRows = /^\|.+\|.*\|\s*$/m.test(nextContent);
  if (previousContent === undefined) {
    if (!nextHasRows) {
      return {
        passed: true,
        message: `${indexPathFor(root)} not found -- nothing to check (no platform-scoped decisions logged yet)`,
      };
    }
    return {
      passed: false,
      message: `${indexPathFor(root)} not found, but state.decisions has platform-scoped decisions to index -- run fgos decision-index`,
    };
  }
  if (!changed) {
    return { passed: true, message: `${indexPathFor(root)} up to date` };
  }
  return {
    passed: false,
    message: `${indexPathFor(root)} is stale relative to state.decisions -- run fgos decision-index`,
  };
}

// tsk-1lv round-2 review, B3: generateDecisionIndex's own F12 safety
// refusal (never overwrite real rows with an empty regenerate) escaped
// uncaught here, and `runFixes` (src/setup/checks.mjs) maps over every
// registered fix with no try/catch of its own -- so the throw aborted the
// ENTIRE `fgos doctor --fix` run, discarding every other fix's result.
// Reproduced directly: a directory with a committed, row-carrying
// docs/decisions/index.md and no readable .fgos store (this repo's own
// merged-to-main future state on a fresh clone before .fgos exists) hit
// this and returned exit 4 with no report at all. A refusal here is a
// real, legitimate "this fix can't run safely right now" outcome, not a
// crash -- report it through the same {changed, message} contract every
// other fix already promises, so one fix's refusal never takes down the
// rest of `doctor --fix`'s run.
function fixDecisionIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  let result;
  try {
    result = generateDecisionIndex(root, fgosDir);
  } catch (err) {
    if (err instanceof StoreError) {
      return { changed: false, message: `skipped -- ${err.message}` };
    }
    throw err;
  }
  if (!result.changed) {
    return { changed: false, message: `${result.path} already up to date` };
  }
  return { changed: true, message: `regenerated ${result.path}` };
}

registerCheck({
  id: 'decision-index-stale',
  description: 'docs/decisions/index.md matches every scope-carrying decision in state.decisions (tsk-1lv-2/tsk-1lv)',
  check: (cwd) => checkDecisionIndexStale(cwd),
});

registerFix({
  id: 'decision-index-stale',
  fix: (cwd) => fixDecisionIndexStale(cwd),
});

const DEFAULT_DOC_REGISTRY_SETTINGS = Object.freeze({
  enforce: false,
});

function checkDocRegistryEnforce(cwd) {
  const shared = readSharedConfig(cwd);
  const settings = shared.docRegistry;
  if (settings === undefined) {
    return { passed: false, message: 'docRegistry section missing -- run fgos setup' };
  }
  if (typeof settings.enforce !== 'boolean') {
    return { passed: false, message: 'docRegistry.enforce is not a boolean' };
  }
  return { passed: true, message: `docRegistry: enforce=${settings.enforce}` };
}

registerConfigDefault({
  id: 'docRegistry',
  key: 'docRegistry',
  shape: DEFAULT_DOC_REGISTRY_SETTINGS,
});

registerCheck({
  id: 'doc-registry-enforce',
  description: 'docRegistry.enforce in the shared config file is present and boolean',
  check: (cwd) => checkDocRegistryEnforce(cwd),
});

function checkDocRegistryStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) {
    return { passed: true, message: 'knowledge registry check skipped -- no events log' };
  }
  const view = rebuild(fgosDir);
  const { jsonContent, mdContent } = computeKnowledgeProjection(view);
  const mdPath = path.join(root, 'docs/doc-registry.md');
  const jsonPath = path.join(root, 'docs/doc-registry.json');
  const mdOk = fs.existsSync(mdPath) && fs.readFileSync(mdPath, 'utf8') === mdContent;
  const jsonOk = fs.existsSync(jsonPath) && fs.readFileSync(jsonPath, 'utf8') === jsonContent;

  if (mdOk && jsonOk) {
    return { passed: true, message: 'doc-registry projections up to date' };
  }
  return { passed: false, message: 'docs/doc-registry.md or docs/doc-registry.json is stale -- run fgos doc-registry' };
}

function fixDocRegistryStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) {
    return { changed: false, message: 'skipped -- no events log' };
  }
  let view;
  try {
    view = rebuild(fgosDir);
  } catch (err) {
    if (err instanceof StoreError || err.code === 'ENOENT') {
      return { changed: false, message: `skipped -- ${err.message}` };
    }
    throw err;
  }
  const { jsonContent, mdContent } = computeKnowledgeProjection(view);
  const mdPath = path.join(root, 'docs/doc-registry.md');
  const jsonPath = path.join(root, 'docs/doc-registry.json');

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');
  return { changed: true, message: 'regenerated docs/doc-registry.md and docs/doc-registry.json' };
}

// tsk-28x code review finding: this used to treat "no file on disk at the
// alias path" as broken -- but D-tsk28x-9 defines an alias as a doc's OLD
// path, kept purely as a historical lookup key (never a live location);
// after a real migration (`fgos doc move-path`), the file legitimately no
// longer exists there, which is the correct, expected post-migration
// state, not a defect. That made this check fail every doc a migration
// had already moved. The real "broken" shape (per resolveDocPath, this
// same file's own resolver) is an alias that resolves AMBIGUOUSLY: two or
// more non-retired docs claiming the identical alias string, or an alias
// that collides with a DIFFERENT doc's own currentPath.
function checkDocAliasBroken(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) return { passed: true, message: 'skipped' };
  const view = rebuild(fgosDir);
  const docs = Object.values(view.docs || {}).filter((d) => d.docLifecycle !== 'retired');
  const aliasOwners = new Map();
  for (const doc of docs) {
    for (const alias of doc.aliases || []) {
      if (!aliasOwners.has(alias)) aliasOwners.set(alias, []);
      aliasOwners.get(alias).push(doc.docId);
    }
  }
  const currentPaths = new Map(docs.map((d) => [d.currentPath, d.docId]));
  const broken = [];
  for (const [alias, owners] of aliasOwners) {
    if (owners.length > 1) {
      broken.push(`${alias}: claimed by ${owners.length} docs (${owners.join(', ')})`);
    } else if (currentPaths.has(alias) && currentPaths.get(alias) !== owners[0]) {
      broken.push(`${alias}: alias of ${owners[0]} but also the currentPath of ${currentPaths.get(alias)}`);
    }
  }
  if (broken.length === 0) return { passed: true, message: 'no broken doc aliases' };
  return { passed: false, message: `found ${broken.length} broken doc aliases: ${broken.join('; ')}` };
}

function checkDocActiveDuplicate(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) return { passed: true, message: 'skipped' };
  const view = rebuild(fgosDir);
  const counts = {};
  for (const doc of Object.values(view.docs || {})) {
    if (doc.docLifecycle === 'active') {
      const key = `${doc.topicId}:${doc.role}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const dupes = Object.entries(counts).filter(([, c]) => c > 1);
  if (dupes.length === 0) return { passed: true, message: 'no duplicate active docs' };
  return { passed: false, message: `active duplicate docs found for: ${dupes.map(([k]) => k).join(', ')}` };
}

// tsk-28x code review finding: this used to pass `docsDir` (a bare string
// path) straight to findDuplicateAuthoritativeClaims, which expects an
// ARRAY of `{path, authoritativeFor}` candidates -- iterating a string
// yields its individual characters, none of which ever carry an
// `authoritativeFor` property, so the check always reported zero groups
// regardless of real duplicates. Also scoped to `docs/how-to` only, a
// layout assumption the knowledge-registry migration retires (docs move to
// a flat `docs/<purposeSlug>/<role>.md` layout, no quadrant subfolders).
// Fixed: walk the whole `docs/` tree, read each file's real frontmatter,
// and build the candidate array the function actually expects.
function checkDocNearDuplicate(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const docsDir = path.join(root, 'docs');
  if (!fs.existsSync(docsDir)) return { passed: true, message: 'skipped' };
  const candidates = [];
  for (const relPath of fs.readdirSync(docsDir, { recursive: true })) {
    if (!relPath.endsWith('.md')) continue;
    const absPath = path.join(docsDir, relPath);
    if (!fs.statSync(absPath).isFile()) continue;
    const { meta } = parseFrontmatter(fs.readFileSync(absPath, 'utf8'));
    const authoritativeFor = Array.isArray(meta.authoritative_for) ? meta.authoritative_for[0] : meta.authoritative_for;
    if (typeof authoritativeFor === 'string' && authoritativeFor.trim()) {
      candidates.push({ path: path.join('docs', relPath), authoritativeFor });
    }
  }
  const groups = findDuplicateAuthoritativeClaims(candidates);
  if (groups.length === 0) return { passed: true, message: 'no near-duplicate authoritative claims' };
  return { passed: false, message: `found ${groups.length} near-duplicate claim groups: ${groups.map((g) => g.map((c) => c.path).join(' ~ ')).join('; ')}` };
}

function checkDocProvisionalAged(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) return { passed: true, message: 'skipped' };
  const view = rebuild(fgosDir);
  const now = Date.now();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  const aged = [];
  for (const doc of Object.values(view.docs || {})) {
    if (doc.docLifecycle === 'provisional' && doc.updatedAt && (now - doc.updatedAt > maxAgeMs)) {
      aged.push(doc.docId);
    }
  }
  if (aged.length === 0) return { passed: true, message: 'no aged provisional docs' };
  return { passed: false, message: `provisional docs aged >7 days: ${aged.join(', ')}` };
}

function checkDocTopicOversized(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) return { passed: true, message: 'skipped' };
  const view = rebuild(fgosDir);
  const shared = readSharedConfig(cwd);
  const maxDocs = shared.docRegistry?.topicMaxDocs ?? 10;
  const oversized = [];
  for (const topic of Object.values(view.topics || {})) {
    const count = Object.values(view.docs || {}).filter((d) => d.topicId === topic.topicId).length;
    if (count > maxDocs) oversized.push(`${topic.topicId} (${count} docs)`);
  }
  if (oversized.length === 0) return { passed: true, message: 'no oversized topics' };
  return { passed: false, message: `oversized topics: ${oversized.join(', ')}` };
}

function checkDocRoleUnderused(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) return { passed: true, message: 'skipped' };
  const view = rebuild(fgosDir);
  const roleCounts = {};
  for (const doc of Object.values(view.docs || {})) {
    roleCounts[doc.role] = (roleCounts[doc.role] || 0) + 1;
  }
  const underused = Object.entries(roleCounts).filter(([, c]) => c === 1);
  if (underused.length === 0) return { passed: true, message: 'no underused roles' };
  return { passed: true, message: `${underused.length} roles used by single doc: ${underused.map(([r]) => r).join(', ')}` };
}

function checkDocSourceConservation(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  if (!fs.existsSync(path.join(fgosDir, 'events.jsonl'))) return { passed: true, message: 'skipped' };
  const view = rebuild(fgosDir);
  const outcomes = view.outcomes || {};
  let missingCount = 0;
  for (const outcome of Object.values(outcomes)) {
    if (outcome.docPath) {
      const resolved = resolveDocPath(view, outcome.docPath);
      if (!resolved) missingCount++;
    }
  }
  if (missingCount === 0) return { passed: true, message: 'all source captures reachable' };
  return { passed: false, message: `${missingCount} source captures unresolvable` };
}

registerCheck({ id: 'doc-registry-stale', description: 'docs/doc-registry.md and doc-registry.json up to date', check: checkDocRegistryStale });
registerFix({ id: 'doc-registry-stale', fix: fixDocRegistryStale });
registerCheck({ id: 'doc-alias-broken', description: 'doc aliases point to valid paths', check: checkDocAliasBroken });
registerCheck({ id: 'doc-active-duplicate', description: 'no duplicate active docs for same topic and role', check: checkDocActiveDuplicate });
registerCheck({ id: 'doc-near-duplicate', description: 'near-duplicate authoritative claims check', check: checkDocNearDuplicate });
registerCheck({ id: 'doc-provisional-aged', description: 'provisional docs age check', check: checkDocProvisionalAged });
registerCheck({ id: 'doc-topic-oversized', description: 'topic size check against ceiling', check: checkDocTopicOversized });
registerCheck({ id: 'doc-role-underused', description: 'role usage frequency check', check: checkDocRoleUnderused });
registerCheck({ id: 'doc-source-conservation', description: 'source captures conservation check', check: checkDocSourceConservation });

function getMergeHeadSha(mainCheckout) {
  try {
    const stdout = execFileSync('git', ['rev-parse', '--verify', 'MERGE_HEAD'], {
      cwd: mainCheckout,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function checkNoStuckMergeAbort(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const sha = getMergeHeadSha(mainCheckout);
  if (sha !== null) {
    return {
      passed: false,
      message: `merge in progress or stuck (MERGE_HEAD=${sha}) — run fgos main-checkout-reset --sha ${sha} --confirm`,
    };
  }
  return { passed: true, message: 'no merge in progress or stuck MERGE_HEAD' };
}

// Unattended automation must never mutate the shared main checkout's git
// plumbing without a human reviewing real `git status` first (plan.md).
// Therefore, this fix always returns changed: false and names the manual
// recovery command `fgos main-checkout-reset --sha <sha> --confirm`.
function fixNoStuckMergeAbort(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { changed: false, message: 'not inside a git checkout — nothing to fix' };
  }
  const sha = getMergeHeadSha(mainCheckout);
  if (sha === null) {
    return { changed: false, message: 'no merge in progress — nothing to fix' };
  }
  return {
    changed: false,
    message: `merge in progress or stuck (MERGE_HEAD=${sha}) — run fgos main-checkout-reset --sha ${sha} --confirm`,
  };
}

registerCheck({
  id: 'no-stuck-merge-abort',
  description: 'main checkout has no lingering MERGE_HEAD from an in-progress or stuck merge abort (tsk-40a)',
  check: (cwd) => checkNoStuckMergeAbort(cwd),
});

registerFix({
  id: 'no-stuck-merge-abort',
  fix: (cwd) => fixNoStuckMergeAbort(cwd),
});

