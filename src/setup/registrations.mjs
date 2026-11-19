import { checkWorkflowCaseBindingSentinel, checkWorkflowCaseBindings, fixWorkflowCaseBindings } from './workflow-case-checks.mjs';
// registrations.mjs — the doctor-check / fix registry (CONTEXT.md D1/D2,
// docs/history/setup-doctor-config-registry/): the one place a module declares
// a doctor check and/or a fix. `checks.mjs` never needs editing again to pick
// up a new entry — it only re-exports `DOCTOR_CHECKS` from here (D1). A new
// module registers by importing `registerCheck`/`registerFix` from this file
// and calling them at its own module-load time, or — for the handful of
// checks fgOS ships with — by being registered directly below.
//
// `check` and `fix` registrations are independent (D2): a module may register
// only a check, only a fix, or both — never a forced pairing. Config is not
// registered here: the standard (core/config-standard) holds every default and
// the schemas (core/config-schema) every shape rule, both read through the
// config door. A check below reads the effective value through the facade only
// when it enforces a rule a schema cannot state; the rows over the config files
// themselves are the Rust host's (the config crate's rows, judged in process).
//
// `fgos doctor --fix` (bin/fgos.mjs) runs every registered fix via `runFixes`
// below; `doctor` without `--fix` writes nothing.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { domainCatalog } from '../util/domain-dirs.mjs';
import { fgosDirFromRoot } from '../util/fgos-file-registry.mjs';
import { checkCompiledDomains } from '../util/domain-compile.mjs';
import { loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { INSTALL_ROOT, agentShapeProblem, findAgentDuplicates, readAgentDefinition, scanAgentTiers } from '../runner/agent-definitions.mjs';
import { isWithinDir } from '../runner/dispatch/assignment-layout.mjs';
import { ownedSkillNames } from './skill-wrappers.mjs';
import { agentRenderWarnings, listAgents } from '../runner/agent-listing.mjs';
import { declaredActivities, readWorkflowCatalog, withUnreadableDefinitions } from './workflow-catalog-reader.mjs';
import { checkBlindStepsUseProvenPools } from './blind-steps-proven-pools.mjs';

import { validateRunnerLoopsShape, attributeRunnerConfigError } from '../runner/dispatch/config.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { shippedCatalog } from '../runner/dispatch/shipped-catalog.mjs';
import { checkCatalog } from '../runner/execution/patterns/catalog.mjs';
import { deepEqual } from '../runner/execution/patterns/catalog-entries.mjs';
import { detectRetiredPatternKeys, RESERVED_PATTERN_NAMES, SEAT_BINDING_MARKER_PATH, formatRetiredKeySentence } from '../runner/execution/patterns/retired-keys.mjs';
import { isCommandAvailable, resolveMainCheckoutRoot } from '../runner/paths.mjs';
import {
  capabilityNamesOf,
  ownMinCheckersOf,
} from '../runner/capability-config.mjs';
import { detectTrunk } from '../runner/worktree.mjs';
import { listWork } from '../state/store.mjs';
import { driftStatus, unmergedDeliveries } from '../state/drift-status.mjs';
import { isResolvedStatus } from '../state/frontier.mjs';
import { getDomain, resolveDomainName, effectiveStep, domainSteps } from '../state/domain-registry.mjs';
import { unservedToolAbilityOf } from '../runner/dispatch/tool-providers.mjs';
import { checkConfig, globalFgosDir, readConfig, readMachineConfig, readProjectConfigSource } from '../config/facade.mjs';
import { parseYaml } from '../util/yaml.mjs';
import { foldEvents } from '../state/replay.mjs';
import { checkSeatBindingDryBind } from './seat-binding-checks.mjs';
export { mainCheckoutHookWired } from './git-hooks.mjs';

/** The door's findings for a project: one read per doctor run, shared by every bridged row that asks. A row called without a run reads for itself. */
const checkConfigOnce = (cwd, run) => (run
  ? run.once(`config-check:${cwd}`, () => checkConfig({ projectRoot: cwd }))
  : checkConfig({ projectRoot: cwd }));

// Live, mutated-in-place arrays (never reassigned) so a registration added
// after this module first evaluates — e.g. from a test, or from another
// module imported later in the same process — is visible through every
// existing import of `DOCTOR_CHECKS`,
// including `checks.mjs`'s own re-export (ESM re-exports are live bindings
// to the same array object, not a snapshot).
export const DOCTOR_CHECKS = [];
export const FIX_REGISTRATIONS = [];

/**
 * The effective value of one config section for the project at `cwd` (project over global over the standard),
 * as ordinary objects: the facade's results have no prototype, which the check code below does not expect. A
 * refused file throws a ConfigDoorError, which `registerCheck` turns into a failed row.
 */
export function effectiveSection(cwd, section) {
  const value = readConfig({ projectRoot: cwd, sections: [section] }).value[section];
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/** The effective `runner` section of the machine alone (global file, accounts, standard). */
function machineRunner() {
  return JSON.parse(JSON.stringify(readMachineConfig({ sections: ['runner'] }).value.runner ?? {}));
}

/**
 * Register a doctor check (D1/D2). `id` must be unique among registered
 * checks — a duplicate is a programming error (two modules picked the same
 * name), not a runtime condition to degrade gracefully on, so it throws.
 */
export function registerCheck({ id, check }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerCheck requires a non-empty id');
  }
  if (DOCTOR_CHECKS.some((entry) => entry.id === id)) {
    throw new Error(`registerCheck: "${id}" is already registered`);
  }
  if (typeof check !== 'function') {
    throw new Error(`registerCheck("${id}") requires a check function`);
  }
  // A check that throws (an unreadable store, a refused clone) fails its own row; it never stops the rest of the run.
  DOCTOR_CHECKS.push({ id, check(cwd, run) {
    const failed = error => ({ passed: false, message: error.message });
    try {
      const result = check(cwd, run);
      return result && typeof result.then === 'function' ? result.catch(failed) : result;
    } catch (error) { return failed(error); }
  } });
}

/**
 * One doctor run. Rows that need the same expensive fact (the Work view) ask the run for it: the first row
 * computes it, the rest reuse it, and a failure is remembered too, so a store that cannot be read is tried once.
 * A row called without a run (a test, a one-off) gets a private one and shares nothing.
 */
export function createDoctorRun() {
  const facts = new Map();
  return {
    once(key, compute) {
      if (!facts.has(key)) {
        try { facts.set(key, { value: compute() }); } catch (error) { facts.set(key, { error }); }
      }
      const fact = facts.get(key);
      if (fact.error) throw fact.error;
      return fact.value;
    },
  };
}

/**
 * The Work view a doctor row judges, read through the Event Store facade once per run, or null when this project
 * has no Work store to read (no `.fgos`, or not a Git repository). Any other failure (a refused clone, damaged
 * history) throws and fails the rows that asked.
 */
function doctorWorkView(root, run = createDoctorRun()) {
  return run.once(`work-view:${root}`, () => {
    const fgosDir = fgosDirFromRoot(root);
    if (!fs.existsSync(fgosDir)) return null;
    try {
      return listWork(fgosDir);
    } catch (error) {
      if (error.code === 'event-store-no-repository') return null;
      throw error;
    }
  });
}

/**
 * Register a fix (D3, docs/history/doctor-fix-gate-bypass/CONTEXT.md):
 * `fix` is a function `(cwd) => { changed, message }` that repairs whatever
 * this entry's own `check` (if any) reports as failing — idempotent, and
 * scoped only to this entry's own concern, never another entry's. `fix`
 * registration is independent of `check`/`configDefault` (same D2 style
 * those two already follow) — a module may register any subset of the
 * three.
 *
 * Which rows a fix repairs is the registry's (`repairs` in doctor-registry.v1.json); this module keeps the body.
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
 * Run registered fixes against `cwd`: every one, or the `fixes` given. Each fix's own `{changed, message}` is
 * reported per entry. The order is the caller's: the host runs them in the registry's order
 * (packages/distribution/contracts/doctor-registry.v1.json) through `runBridged`.
 */
export function runFixes(cwd, fixes = FIX_REGISTRATIONS) {
  return fixes.map(({ id, fix }) => {
    try {
      const { changed, message } = fix(cwd);
      return { id, changed, message };
    } catch (error) { return { id, changed: false, message: error.message }; }
  });
}

/**
 * One call of the host's Node rows bridge (src/setup/doctor-bridge.mjs): the bodies of the rows or fixes the
 * registry still gives to Node, run in the order the host asked and nothing else. `phase` is `fix` (every id is a
 * fix id; `onResult` gets `{ id, changed, message }` per fix) or `check` (every id is a row id; `onResult` gets
 * `{ id, passed, status?, message, fixCommand?, detail?, elapsedMs }` per row, judged with one shared run so rows that read
 * the same fact read it once). The level, the fix command of a failing row, `ok` and `next` are the host's: this
 * function derives none of them. An id with no body here is a refusal of the whole call, never a silent skip.
 */
export async function runBridged({ phase, ids, dir }, onResult) {
  if (phase === 'fix') {
    const bodies = ids.map((id) => FIX_REGISTRATIONS.find((entry) => entry.id === id) ?? null);
    const missing = ids.filter((_, at) => bodies[at] === null);
    if (missing.length > 0) throw new Error(`no fix body for ${missing.join(', ')}`);
    for (const result of runFixes(dir, bodies)) onResult(result);
    return;
  }
  if (phase !== 'check') throw new Error(`unknown phase "${phase}"`);
  const bodies = ids.map((id) => DOCTOR_CHECKS.find((entry) => entry.id === id) ?? null);
  const missing = ids.filter((_, at) => bodies[at] === null);
  if (missing.length > 0) throw new Error(`no row body for ${missing.join(', ')}`);
  const run = createDoctorRun();
  for (const { id, check } of bodies) {
    // A check may return its result directly or as a promise (one drives promise-based runner code). One that
    // returns nothing usable fails its own row, as one that throws does, and never ends the call.
    let result;
    const started = performance.now();
    try { result = await check(dir, run); } catch (error) { result = { passed: false, message: error.message }; }
    if (typeof result?.passed !== 'boolean') result = { passed: false, message: `the row returned no verdict (${id})` };
    onResult({
      id,
      passed: result.passed,
      ...(result.status !== undefined && { status: result.status }),
      ...(result.message !== undefined && { message: result.message }),
      ...(result.fixCommand !== undefined && { fixCommand: result.fixCommand }),
      ...(result.detail !== undefined && { detail: result.detail }),
      elapsedMs: Math.round(performance.now() - started),
    });
  }
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
 * line and `uninstall` recognises the line the checkout's script was sourced by.
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

// The retired runner.patterns keys a legacy JSON config document still holds, as data (empty when none).
function retiredJsonAdvice(parsed) {
  const runner = parsed?.runner ?? parsed;
  const patterns = runner?.patterns ?? {};
  return parsed ? detectRetiredPatternKeys(patterns) : [];
}

export function checkRunnerPatternsConfig(cwd, run) {
  const globalDir = globalFgosDir();
  const display = (file) => {
    if (file?.startsWith('global:')) return path.join(globalDir, file.slice('global:'.length));
    if (file?.startsWith('project:')) return path.join(fgosDirFromRoot(cwd), file.slice('project:'.length));
    return file ?? '<file>';
  };

  // The legacy JSON format itself is the door row's finding (config-format-legacy-json); this row adds what that row
  // cannot say: which retired pattern key to change and what replaces it, in a YAML or a legacy JSON file alike.
  const findings = checkConfigOnce(cwd, run).findings ?? [];
  const legacy = findings.filter((f) => f.row === 'config-format-legacy-json');
  const legacyScopes = new Set(legacy.map((f) => f.file?.split(':')[0]));
  const problems = [];
  const note = (msg) => { if (!problems.includes(msg)) problems.push(msg); };
  for (const f of legacy) {
    const targetPath = display(f.file);
    try {
      // The facade's one raw source read, for the scope the finding names (the global directory's parent holds `.fgos`).
      // readProjectConfigSource reads `<dir>/.fgos/`, so the global scope passes the parent of the global directory;
      // this holds because globalFgosDir() always ends in `.fgos`.
      const scopeDir = f.file?.startsWith('global:') ? path.dirname(globalDir) : cwd;
      const source = readProjectConfigSource(scopeDir);
      if (source?.format !== 'json') throw new Error(`${targetPath}: cannot read the legacy JSON config file`);
      const retired = retiredJsonAdvice(parseYaml(source.text, { filename: source.path }));
      if (retired.length > 0) {
        const editsText = retired.map((r) => formatRetiredKeySentence(r)).join('; ');
        note(`${targetPath}: config-format-legacy-json: ${editsText}; edit ${targetPath}, then run \`fgos config migrate\``);
      }
    } catch (err) {
      note(err.message.startsWith(targetPath) ? err.message : `${targetPath}: ${err.message}`);
    }
  }
  for (const f of findings) {
    if (f.row === 'config-format-legacy-json' || legacyScopes.has(f.file?.split(':')[0])) continue;
    for (const item of f.path ? detectRetiredPatternKeys(f.path) : []) {
      note(`${display(f.file)}${f.line ? `:${f.line}` : ''}: ${formatRetiredKeySentence(item)}.`);
    }
  }
  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  if (legacy.length > 0) {
    return { passed: true, message: 'not evaluated: a legacy JSON config file is reported by config-format-legacy-json' };
  }

  let cfg;
  try {
    cfg = readConfig({
      projectRoot: cwd,
      sections: ['runner'],
      origins: ['runner.patterns', 'runner.loops'],
    });
  } catch (err) {
    return { passed: false, message: err.message };
  }

  const runner = cfg?.value?.runner ?? {};
  const effectivePatterns = runner.patterns ?? {};
  const effectiveLoops = runner.loops ?? {};

  try {
    validateRunnerLoopsShape(effectiveLoops, 'runner.loops');
  } catch (err) {
    const attributed = attributeRunnerConfigError(err, cfg?.origins ?? [], cwd);
    return { passed: false, message: attributed ? attributed.message : err.message };
  }

  const shipped = shippedCatalog();
  const origins = cfg?.origins ?? [];
  const { entries, problems: catalogProblems } = checkCatalog({
    shipped: shipped.patterns,
    effective: effectivePatterns,
    origins,
  });
  if (catalogProblems.length > 0) {
    const formatted = catalogProblems.map((p) => {
      const adapter = new RunnerConfigError(p.message, { code: p.code, path: p.path, detail: p.detail });
      const attributed = attributeRunnerConfigError(adapter, origins, cwd);
      return attributed ? attributed.message : p.message;
    });
    return { passed: false, message: formatted.join('; ') };
  }

  const warnings = [];
  const info = [];
  const hints = [];

  // Warn if project defines runner.loops.* but marker runner.patterns.seatBinding.schema is below 2 or absent
  const hasProjectLoops = (cfg?.origins ?? []).some((o) => o.layer === 'project' && o.path.startsWith('runner.loops'));
  if (hasProjectLoops) {
    const markerOrigin = (cfg?.origins ?? []).find((o) => o.path === SEAT_BINDING_MARKER_PATH && o.layer === 'project');
    const markerValue = markerOrigin ? cfg?.value?.runner?.patterns?.seatBinding?.schema : undefined;
    if (!markerOrigin || typeof markerValue !== 'number' || markerValue < 2) {
      warnings.push(`set \`${SEAT_BINDING_MARKER_PATH}\` to 2 so older releases refuse this file`);
    }
  }
  // 1. Warnings: defaults beyond bounds
  for (const [loopName, loopCfg] of Object.entries(effectiveLoops)) {
    const bounds = loopCfg?.bounds;
    if (!bounds || typeof bounds !== 'object') continue;
    for (const [paramName, bound] of Object.entries(bounds)) {
      if (!bound || typeof bound !== 'object') continue;
      const { min, max } = bound;
      for (const [patName, patEntry] of Object.entries(entries)) {
        if (patEntry.loop === loopName && patEntry.defaults) {
          const val = patEntry.defaults[paramName];
          if (typeof val === 'number') {
            if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
              warnings.push(`pattern "${patName}" default ${paramName}=${val} is beyond loop "${loopName}" bounds [${min ?? '-inf'}, ${max ?? '+inf'}] (runs unclamped)`);
            }
          }
        }
      }
      try {
        for (const entry of readWorkflowCatalog(cwd).catalog.values()) {
          const wf = entry.workflow;
          for (const activity of declaredActivities(entry)) {
            const u = activity?.unit;
            if (!u || typeof u !== 'object') continue;
            const patName = typeof u.pattern === 'string' ? u.pattern : null;
            if (!patName) continue;
            const patEntry = entries[patName] ?? shipped.patterns?.[patName];
            const actLoop = patEntry?.loop ?? 'solo';
            if (actLoop === loopName && u.params) {
              const val = u.params[paramName];
              if (typeof val === 'number') {
                if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
                  warnings.push(`workflow "${wf.id}" activity "${activity.id}" default ${paramName}=${val} is beyond loop "${loopName}" bounds [${min ?? '-inf'}, ${max ?? '+inf'}] (runs unclamped)`);
                }
              }
            }
          }
        }
      } catch {
        // workflow loading skipped if not present
      }
    }
  }

  // 2. Warnings: catalog entries or runner.loops in global file
  try {
    const machine = readMachineConfig({ origins: ['runner.patterns', 'runner.loops'] });
    const hasGlobal = (machine.origins ?? []).some(
      (o) => o.layer === 'global' && (
        o.path.startsWith('runner.loops.') ||
        (o.path.startsWith('runner.patterns.') &&
          !RESERVED_PATTERN_NAMES.has(o.path.slice('runner.patterns.'.length)) &&
          o.path !== SEAT_BINDING_MARKER_PATH)
      )
    );
    if (hasGlobal) {
      let olderNote;
      try {
        if (!isCommandAvailable('fgctl')) {
          olderNote = 'older releases may refuse that file (compatibility with older releases was not established)';
        } else {
          const out = execFileSync('fgctl', ['status', '--json'], {
            cwd,
            encoding: 'utf8',
            timeout: 3000,
            stdio: ['ignore', 'pipe', 'ignore'],
          });
          const parsed = JSON.parse(out);
          const releases = Array.isArray(parsed)
            ? parsed
            : (Array.isArray(parsed?.releases) ? parsed.releases : null);
          if (releases && releases.length > 1) {
            olderNote = 'older releases installed here may refuse that file (compatibility with older releases was not established)';
          } else if (releases && releases.length <= 1) {
            olderNote = 'older releases may refuse that file if installed (compatibility with older releases was not established)';
          } else {
            olderNote = 'older releases may refuse that file (compatibility with older releases was not established)';
          }
        }
      } catch {
        olderNote = 'older releases may refuse that file (compatibility with older releases was not established)';
      }
      warnings.push(`global config declares pattern catalog entries or runner.loops; ${olderNote}`);
    }
  } catch {
    // ignore machine read failures if any
  }

  // 3. Information: capability minCheckers omitting red-team for code/code:*
  for (const capName of capabilityNamesOf(runner)) {
    if (capName === 'code' || capName.startsWith('code:')) {
      const minCheckers = ownMinCheckersOf(runner, capName);
      if (Array.isArray(minCheckers) && !minCheckers.includes('red-team')) {
        info.push(`capability "${capName}" minCheckers explicitly omits red-team`);
      }
    }
  }

  // 4. Hints: two patterns with identical loop, params and invariants
  const patternNames = Object.keys(entries).filter((n) => !RESERVED_PATTERN_NAMES.has(n));
  for (let i = 0; i < patternNames.length; i++) {
    for (let j = i + 1; j < patternNames.length; j++) {
      const a = entries[patternNames[i]];
      const b = entries[patternNames[j]];
      if (
        a.loop === b.loop &&
        deepEqual(a.defaults ?? {}, b.defaults ?? {}) &&
        deepEqual(a.invariants ?? {}, b.invariants ?? {})
      ) {
        hints.push(`patterns "${patternNames[i]}" and "${patternNames[j]}" have identical loop, params, and invariants`);
      }
    }
  }

  const notes = [];
  if (warnings.length > 0) {
    notes.push(`warning: ${warnings.join('; ')}`);
  }
  if (info.length > 0) {
    notes.push(`info: ${info.join('; ')}`);
  }
  if (hints.length > 0) {
    notes.push(`hint: ${hints.join('; ')}`);
  }

  if (warnings.length > 0) {
    return { passed: true, message: notes.join('; ') };
  }
  if (info.length > 0) {
    return { passed: true, message: notes.join('; ') };
  }
  if (hints.length > 0) {
    return { passed: true, message: `runner patterns configuration is valid; ${notes.join('; ')}` };
  }
  return { passed: true, message: 'runner patterns configuration is valid and cumulative' };
}

function allTaskSpecs(cwd) {
  const specs = [];
  for (const { name: domain, taskSpecsDir } of domainCatalog({ payloadRoot: cwd }).domains) {
    if (!fs.existsSync(taskSpecsDir)) continue;
    for (const file of fs.readdirSync(taskSpecsDir)) {
      if (file.endsWith('.md')) {
        specs.push({
          domain,
          specId: file.slice(0, -'.md'.length),
          filePath: path.join(taskSpecsDir, file),
        });
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

// The definition files the one door resolves for `cwd`, in its tier order. A name is listed once: the first tier
// that holds it wins, as listAgents resolves it. A name defined twice inside one tier is the duplicate check's finding.
export function allAgentYamlFiles(cwd) {
  const seen = new Set();
  return scanAgentTiers({ projectRoot: cwd }).flatMap((tier) => tier.entries)
    .filter(({ name }) => !seen.has(name) && seen.add(name));
}

// Reads every agent file once and maps agent name to the skills it declares. A file that cannot be
// read or is not valid YAML is left out of the map and named in `problems`, never skipped silently.
export function readAgentSkills(agentFiles) {
  const agentSkillsMap = new Map();
  const problems = [];
  for (const file of agentFiles) {
    const rel = file.rel;
    let text;
    try {
      text = fs.readFileSync(file.file, 'utf8');
    } catch (error) {
      problems.push(`${rel}: cannot be read (${error.message})`);
      continue;
    }
    const { error, name: declared, skills } = readAgentDefinition(text, { filename: rel });
    if (error) {
      problems.push(`${rel}: ${error}`);
      continue;
    }
    agentSkillsMap.set(declared ?? file.name, new Set(skills));
  }
  return { agentSkillsMap, problems };
}

// Task-spec declares agent/requires-skill, agent-type declares skills. A requires-skill claim
// resolves only when both sides hold: at least one agent-type provides it and the name is a skill
// fgOS owns (a skill source under core/skills or domains/<domain>/skills). Every pinned agent exists.
export function checkAgentClaimsResolve(cwd) {
  const agentFiles = allAgentYamlFiles(cwd);
  const { agentSkillsMap, problems: agentFileProblems } = readAgentSkills(agentFiles);

  const allProvidedSkills = new Set();
  for (const skillsSet of agentSkillsMap.values()) {
    for (const s of skillsSet) allProvidedSkills.add(s);
  }

  const taskSpecs = allTaskSpecs(cwd);
  const ownedSkills = ownedSkillNames(cwd);
  const problems = [...agentFileProblems];

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
        const unprovided = agentSkillsMap.size > 0 && !allProvidedSkills.has(reqSkill);
        const unowned = !ownedSkills.has(reqSkill);
        if (unprovided || unowned) {
          const failed = [unprovided && 'no agent-type provides it', unowned && 'it is not an owned skill'].filter(Boolean).join(' and ');
          problems.push(`task-spec "${spec.specId}" requires skill "${reqSkill}" but ${failed}`);
        }
      }
    }
  }

  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: 'every task-spec\'s requires-skill/agent eligibility declaration resolves to real agent skills' };
}

// A name is unique within a tier (fgos/agents, domains/*/agents, core/agents); a higher tier shadows a
// lower one by whole-file replacement (RUL13). The customer's own tier is also checked for shape.
// `projectTiersOnly` leaves out every tier read from inside the release (a project without its own
// domains/ or core/agents/ reads the installed ones); npm test judges those with the option off.
export function checkAgentTypeNamesUnique(cwd, { projectTiersOnly = false, installRoot } = {}) {
  const fullScan = scanAgentTiers({ projectRoot: cwd, ...(installRoot && { installRoot }) });
  const scan = projectTiersOnly
    ? fullScan.filter((tier) => !tier.dirs.some((dir) => isWithinDir(INSTALL_ROOT, dir)))
    : fullScan;
  const problems = findAgentDuplicates(scan).map(({ label, name, files }) => `duplicate agent-type name "${name}" in ${label} (${files.join(', ')})`);

  const tierLabels = Object.fromEntries(fullScan.map((tier) => [tier.tier, tier.label]));
  const workspace = scan.find((tier) => tier.tier === 'workspace') ?? { entries: [], ignored: [] };
  const lowerEntries = fullScan.filter((tier) => tier.tier !== 'workspace').flatMap((tier) => tier.entries);
  const customizations = [];
  const notes = [];
  for (const entry of workspace.entries) {
    let text;
    try {
      text = fs.readFileSync(entry.file, 'utf8');
    } catch (error) {
      problems.push(`${entry.rel}: cannot be read (${error.message})`);
      continue;
    }
    const problem = agentShapeProblem(entry.name, text);
    if (problem) problems.push(`${entry.rel}: ${problem}`);
    // Keys the renderer drops are not an error (the file still seats); they are said here because
    // nothing else says it, and a persona that silently loses its voice or boundary is a failure.
    for (const warning of agentRenderWarnings(text)) notes.push(`${entry.rel}: ${warning}`);
    const shadowed = lowerEntries.find((lower) => lower.name === entry.name);
    customizations.push(shadowed ? `${entry.name} (replaces ${shadowed.rel})` : entry.name);
  }
  for (const rel of workspace.ignored) problems.push(`${rel} is ignored: only .yaml files are read`);

  // A project that ships its own core/agents/ is read there instead of the install, so the
  // installed core definitions it lacks cannot be seated; this is reported, not failed, because a project may
  // choose that.
  for (const hidden of listAgents({ projectRoot: cwd }).masked) {
    notes.push(`installed persona "${hidden.name}" (${hidden.source}) is hidden by ${hidden.hiddenBy}; copy it there or into ${tierLabels.workspace} to seat it`);
  }

  if (problems.length > 0) {
    return { passed: false, message: `agent definitions: ${problems.join('; ')}` };
  }
  const tail = notes.length > 0 ? `; warning: ${notes.join('; ')}` : '';
  return {
    passed: true,
    message: (customizations.length > 0
      ? `agent-type names are unique within each tier; ${tierLabels.workspace} holds ${customizations.join(', ')}`
      : `agent-type names are unique within each tier (${fullScan.map((tier) => tier.label).join(', ')})`) + tail,
  };
}

registerCheck({
  id: 'runner-patterns-config',
  check: (cwd, run) => checkRunnerPatternsConfig(cwd, run),
});

// The definition tiers of a shipped release cannot change after build, so `npm test` judges them
// (test/setup/packaged-definitions.test.mjs, test/setup/registrations.test.mjs). No doctor row judges task-spec
// claims: a project supplies no task-specs or domain agents (decision 79 Q4), only `fgos/agents`.

// The Work lifecycle reads each domain's compiled.json (scripts/build-domain-registry.mjs) at
// import time. A missing or unreadable file breaks every command that resolves a domain; a stale
// one (YAML edited, not rebuilt) silently serves old steps; a YAML file that cannot be parsed
// cannot be compiled at all. This check names each of those per domain, compiling from the YAML
// with the same function the build uses.
export function checkDomainRegistryCompiled({ payloadRoot } = {}) {
  const { checked, problems } = checkCompiledDomains(payloadRoot);
  if (problems.length > 0) return { passed: false, message: problems.join('; ') };
  return { passed: true, message: `${checked} domain registr${checked === 1 ? 'y' : 'ies'} compiled, readable and in step with their YAML` };
}

registerCheck({
  id: 'domain-registry-compiled',
  check: () => checkDomainRegistryCompiled(),
});

registerCheck({
  id: 'agent-type-names-unique',
  check: (cwd) => checkAgentTypeNamesUnique(cwd, { projectTiersOnly: true }),
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

function checkRootDrift(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
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
function checkWorkClassificationVocabulary(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
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
  check: (cwd, run) => checkWorkClassificationVocabulary(cwd, run),
});

// tsk-64h: the step-axis sibling of the risk/kind check above, and the
// same class of drift — a domain may retire a step (coding dropped
// `clarify` outright, tsk-qod D1/D2) while items still sit on it. Unlike
// risk/kind, there is no write door to grandfather against: `workflowStep` is
// not in `EDITABLE_FIELDS` (store.mjs) and only `moveStep` may change it, so
// a stranded item cannot be corrected by an edit at all — it has to be
// drained forward through a registered transition or migrated. That makes
// the drift quieter, not rarer.
//
// `effectiveStep`, not a bare `item.workflowStep`, so the lazy default
// (an item that never had a step written) reads as the step every
// other consumer already treats it as, instead of being flagged as
// out-of-vocabulary for being absent. OPEN items only (`!isResolvedStatus`,
// the one shared open/closed definition), same reasoning as the check
// above: a resolved item's step no longer routes anything.
function checkWorkStepVocabulary(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
  const violations = [];
  for (const item of Object.values(view.work)) {
    if (isResolvedStatus(item)) continue;
    const domainName = resolveDomainName(item.domain, { onUnrecognized: () => {} });
    const domain = getDomain(domainName);
    const step = effectiveStep(item, domain);
    if (!domainSteps(domain, item.kind).includes(step)) {
      violations.push(`${item.id} (step: "${step}", domain: "${domainName}")`);
    }
  }
  if (violations.length === 0) {
    return { passed: true, message: 'every open item sits at a step still registered by its domain' };
  }
  return {
    passed: false,
    message: `${violations.length} open item(s) at a step their domain no longer registers: ${violations.join(', ')} — no verb can relabel a live item's step; drain each one forward through a registered transition or migrate it`,
  };
}

registerCheck({
  id: 'work-step-vocabulary',
  check: (cwd, run) => checkWorkStepVocabulary(cwd, run),
});

// Events acknowledged on one machine whose precondition a concurrent event from another machine made false are
// recorded as conflicts and never applied. Nothing resolves them yet, so this row is how a person finds out; it
// warns and never fails, because a recorded conflict is a finished fold and not a broken store.
function checkWorkRecordedConflicts(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const conflicts = (doctorWorkView(mainCheckout, run) ?? foldEvents([])).conflicts ?? [];
  if (conflicts.length === 0) return { passed: true, message: 'no recorded cross-machine conflicts in the Work view' };
  const ids = [...new Set(conflicts.map((conflict) => conflict.id))].sort();
  return {
    passed: true,
    message: `warning: ${conflicts.length} recorded cross-machine conflict(s) on ${ids.length} item(s): ${ids.join(', ')} — each is an acknowledged change that another machine's concurrent change kept from applying; \`fgos show <id>\` lists them`,
  };
}

registerCheck({
  id: 'work-recorded-conflicts',
  check: (cwd, run) => checkWorkRecordedConflicts(cwd, run),
});


registerCheck({
  id: 'root-drift',
  check: (cwd, run) => checkRootDrift(cwd, run),
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
function checkDeliveredNotOnTrunk(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
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
  check: (cwd, run) => checkDeliveredNotOnTrunk(cwd, run),
});

// Run supervisor (docs/platform/run-supervisor/spec.md): the host routes with the containment driver agents
// run in, the runtime socket directory, attempts nobody holds (and the units awaiting resume) and the
// gate's kill grace with the cancel wait.
// `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` take their values from the dispatch section of the standard and are never written by setup.
// A capability a core/domain Workflow unit names is a label unless a kind: tool executor declares it in `for`: a
// label's seats bind through the role, persona and tier tables. A tool ability whose tool is not present is
// refused at run time with no earlier signal, so this row names it.
// Definitions come from the Workflow loader's one catalog (readWorkflowCatalog): the one that runs for each
// id, project before shipped. Every string under a key named `capability`, at any depth, is a use. A file
// that cannot be read, parsed or validated is reported by name, never skipped.
function workflowCapabilityUses(catalog) {
  const uses = new Map();
  for (const [id, { raw, source }] of catalog) {
    for (const capability of capabilityValues(raw)) {
      if (!uses.has(capability)) uses.set(capability, new Set());
      uses.get(capability).add(`${id} from ${source.root}`);
    }
  }
  return uses;
}

// Every string stored under a key named `capability`, at any depth. Iterative with a visited set:
// a YAML alias can make a document reference itself, and a recursive walk would never end.
function capabilityValues(root) {
  const found = [];
  const visited = new Set();
  const queue = [root];
  for (let next = 0; next < queue.length; next += 1) {
    const node = queue[next];
    if (node === null || typeof node !== 'object' || visited.has(node)) continue;
    visited.add(node);
    for (const [key, value] of Array.isArray(node) ? node.entries() : Object.entries(node)) {
      if (key === 'capability' && typeof value === 'string' && value.trim() !== '') found.push(value.trim());
      else queue.push(value);
    }
  }
  return found;
}

function checkWorkflowCapabilitiesConfigured(cwd) {
  const { catalog, unreadable } = readWorkflowCatalog(cwd);
  return withUnreadableDefinitions(evaluateWorkflowCapabilities(cwd, workflowCapabilityUses(catalog)), unreadable);
}

function evaluateWorkflowCapabilities(cwd, uses) {
  const runner = effectiveSection(cwd, 'runner');
  const unserved = [...uses].filter(([capability]) => unservedToolAbilityOf(runner, capability, { repoRoot: cwd }) !== undefined);
  if (unserved.length > 0) {
    const list = unserved.map(([cap, ids]) => `${cap} (${[...ids].join(', ')})`).join('; ');
    return {
      passed: false,
      message: `Workflow units name tool abilities whose tool is not present: ${list} -- install the tool its kind: tool executor names, or fix that executor's invocation`,
    };
  }
  return { passed: true, message: `every capability a Workflow unit names (${uses.size}) is a label or a tool ability whose tool is present` };
}

registerCheck({
  id: 'workflow-capabilities-configured',
  check: (cwd) => checkWorkflowCapabilitiesConfigured(cwd),
});

// `workerSlots.ceiling` counts worker seats per machine and is enforced where a
// top-level seat starts. A value that is not a positive integer (null, 0, -1)
// would leave the seat pool without a usable size, so it fails here. The schema
// refuses a string or `8.5`; `0`, `-1` and a null written by hand land here.
function checkWorkerSlotsCeiling(cwd) {
  const { ceiling } = effectiveSection(cwd, 'workerSlots');
  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    return {
      passed: false,
      message: `workerSlots.ceiling is ${JSON.stringify(ceiling)}, which is not a usable seat count -- expected a positive integer (worker seats per machine)`,
    };
  }
  return { passed: true, message: `workerSlots.ceiling = ${ceiling} worker seat(s) per machine` };
}

registerCheck({
  id: 'worker-slots-ceiling-usable',
  check: (cwd) => checkWorkerSlotsCeiling(cwd),
});

// The levels of ironLaw.level and the one an unreadable value degrades to at the gate itself
// (src/verbs/merge/iron-law-level.mjs): a project that never sets it gets the refusing behavior, not the
// permissive one. The schema (core/config-schema/ironLaw.schema.yaml) holds the same enum.
export const IRON_LAW_LEVELS = Object.freeze(['ask', 'warn']);
export const DEFAULT_IRON_LAW_LEVEL = 'ask';


// Phase 01 group D (plans/260906-1831-dispatch-visibility-v0): the three things
// that must hold before an interactive dispatch can work at all, each turned from
// a runtime surprise into a doctor line.
//
// The confinement check is the odd one of the three, and the most important. The
// config door already refuses `permissionMode: "bypass"` without full
// confinement, so in principle this can never fire — but "in principle" is how a
// permission posture ends up decided by something nobody can see, which is
// exactly what was measured on 2026-09-06: the bypass flag reached agents through
// a shell alias and its acceptance screen was suppressed by a settings key,
// neither of them visible to any executor profile. A second, independent reading
// of the same invariant is cheap, and it catches a config that arrived by some
// route the loader never saw.

// Async: the check drives the runner's own pattern code, which is promise-based. `fgos doctor`
// awaits every check, so a check may return its result directly or as a promise.
registerCheck({
  id: 'seat-binding-dry-bind',
  check: (cwd) => checkSeatBindingDryBind(cwd, {
    loadRunnerConfig: loadRunnerConfigForDir,
  }),
});

registerCheck({
  id: 'blind-steps-use-proven-pools',
  check: (cwd) => checkBlindStepsUseProvenPools(cwd, {
    loadRunnerConfig: loadRunnerConfigForDir,
  }),
});

// Workflow case bindings (docs/platform/workflow/spec.md#6-business-rules RUL-WF-27): the binding records are a view of each
// case's ledger. Bodies live in workflow-case-checks.mjs.
registerCheck({
  id: 'workflow-case-binding-sentinel',
  check: (cwd) => checkWorkflowCaseBindingSentinel(cwd),
});
registerCheck({
  id: 'workflow-case-bindings',
  check: (cwd) => checkWorkflowCaseBindings(cwd),
});
registerFix({ id: 'workflow-case-bindings', fix: (cwd) => fixWorkflowCaseBindings(cwd) });
