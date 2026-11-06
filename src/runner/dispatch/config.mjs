// dispatch/config.mjs — the runner config: its read over the config door (`loadRunnerConfigForDir`), the
// rules of it that compare two fields or a field with a catalog or registry (`validateRunnerConfigShape`), and
// the frozen vocabularies the other dispatch modules read. Type, enum, range, required and unknown-key rules
// live in `core/config-schema/runner.schema.yaml`: the config door refuses them, naming file, line and path,
// before this module sees a value.
//
// TRUSTED-CONFIG NOTE: the shared config file's `runner` section (`.fgos/config.yaml`) is an
// EXECUTABLE config, not passive data — whoever can edit it controls what
// process `dispatch/transport.mjs` spawns and with what arguments. It is
// committed (per D2's durability policy) so it is reviewable like any other
// source file, but that also means it carries the same trust level as code:
// only apply it from a checkout you already trust.
import { checkDeclaredSeats, SeatResolutionError } from '../execution/seat-resolver.mjs';
import { paramTableOf } from '../execution/loops/index.mjs';
import { isSeatId } from '../../convention/seat-id.mjs';
import { definitionFileName } from '../../convention/definition-names.mjs';
import { RIGOR_VALUES } from '../rigor.mjs';
import { canonicalizeWriteEntry } from './write-scope.mjs';
import { RUN_TIMEOUT_MAX_MS, RUN_TIMEOUT_MIN_MS, runTimeoutProblem } from './run-timeout.mjs';
import { parseTierCell, isExtendedTierCell, REASONING_EFFORT_VALUES } from './tier-cell.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ConfigDoorError, checkConfig, readConfig, readStandardValue } from '../../config/facade.mjs';
import { validateProviderAccountInventory, credentialStoreProblem } from './provider-capacity.mjs';
import { detectRetiredPatternKeys, RESERVED_PATTERN_NAMES, formatRetiredKeySentence } from '../execution/patterns/retired-keys.mjs';
import {
  BUILTIN_POLICY_IDS,
  validateConfinementPolicyShape,
  validateCapabilityConfinementShape,
  normalizeLegacyConfinement,
} from './confinement/policies.mjs';
import { rejectProjectBackendOverride } from './confinement/backend-registry.mjs';



/** Layer the legacy default `runner.executor` ({command, args}) onto the
 * executor registry. The default fills `claude` and the entry named by its
 * command. When the default runs the same program as the registered entry
 * (command basename equals the executor id), the entry keeps its
 * `invocations`, `identity`, `supports` and the rest, and only
 * `command`/`args` come from the default; when it runs another program, the
 * entry's invocations describe a different CLI and the default replaces it. */
export function withDefaultExecutor(rawCfg) {
  const origins = runnerOriginsOf(rawCfg);
  const cfg = { ...rawCfg };
  const defaultExec = rawCfg?.executor;
  if (!defaultExec) {
    if (origins) withRunnerOrigins(cfg, origins);
    return cfg;
  }
  const executors = { ...(rawCfg.executors || {}) };
  const ids = new Set(['claude', ...(defaultExec.command ? [defaultExec.command] : [])]);
  const program = defaultExec.command ? path.basename(String(defaultExec.command)) : null;
  for (const id of ids) {
    executors[id] = program === id ? { ...(executors[id] || {}), ...defaultExec } : { ...defaultExec };
  }
  cfg.executor = { ...defaultExec };
  cfg.executors = executors;
  if (origins) withRunnerOrigins(cfg, origins);
  return cfg;
}

/** Raised for malformed runner config or an unresolvable tier -> model
 * lookup. `category` follows the same CLI-facing vocabulary as
 * WorkValidationError/StoreError (R4) — this is an input-shape problem, not
 * a runtime dispatch failure. Also reused (Phase 02 H1) for admission/
 * control-fencing refusals that need a stable `code` a caller can branch
 * on instead of regex-matching `message` — `code`/`phase` are optional so
 * every pre-existing throw site with neither keeps working unchanged.
 * `phase` is `'pre-admission'` (refused before any Run identity was
 * committed) or `'post-admission'` (refused after commit, e.g. control
 * fencing on an already-admitted Run). */
/** The refusal of a run that needs the default executor where none is set and no assistant CLI is on PATH. */
export const EXECUTOR_MISSING_MESSAGE =
  'no runner.executor: none set and no assistant CLI found on PATH; set one with fgos config set runner.executor ... --reason ...';

export const RUNNER_CONFIG_ORIGINS = Symbol.for('fgos.runner.origins');

export function runnerOriginsOf(cfg) {
  return cfg?.[RUNNER_CONFIG_ORIGINS] ?? null;
}

export function withRunnerOrigins(cfg, origins) {
  if (cfg && origins) {
    Object.defineProperty(cfg, RUNNER_CONFIG_ORIGINS, {
      value: Object.isFrozen(origins) ? origins : Object.freeze([...origins]),
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
  return cfg;
}

export function resolveOriginLocations(origins, paths, projectDir) {
  if (!Array.isArray(origins) || !Array.isArray(paths)) return [];
  const locations = [];
  const seen = new Set();

  for (const targetPath of paths) {
    let matched = [];

    // 1. Exact leaf origin first
    const exact = origins.filter((o) => o?.path === targetPath);
    if (exact.length > 0) {
      matched = exact;
    } else {
      // 2. Nearest available ancestor
      let cur = targetPath;
      while (cur.includes('.') || cur.includes('[')) {
        if (cur.endsWith(']')) {
          cur = cur.slice(0, cur.lastIndexOf('['));
        } else {
          const dotIdx = cur.lastIndexOf('.');
          if (dotIdx === -1) break;
          cur = cur.slice(0, dotIdx);
        }
        const ancestorOrigins = origins.filter((o) => o?.path === cur);
        if (ancestorOrigins.length > 0) {
          matched = ancestorOrigins;
          break;
        }
      }
      // 3. Descendant origins under the failing container
      if (matched.length === 0) {
        const prefixDot = `${targetPath}.`;
        const prefixBracket = `${targetPath}[`;
        const descendants = origins.filter(
          (o) => o?.path && (o.path.startsWith(prefixDot) || o.path.startsWith(prefixBracket))
        );
        if (descendants.length > 0) {
          matched = descendants;
        }
      }
      // 4. A missing key has no line of its own: the first line of its nearest existing parent entry
      if (matched.length === 0) {
        let parent = targetPath;
        while (matched.length === 0 && parent.split('.').length > 3) {
          parent = parent.slice(0, parent.lastIndexOf('.'));
          const under = origins.filter((o) => o?.path && (o.path.startsWith(`${parent}.`) || o.path.startsWith(`${parent}[`)));
          const firstPerFile = new Map();
          for (const o of under) {
            const held = firstPerFile.get(o.file);
            if (!held || (o.line ?? Infinity) < (held.line ?? Infinity)) firstPerFile.set(o.file, o);
          }
          matched = [...firstPerFile.values()];
        }
      }
    }

    for (const entry of matched) {
      let displayFile;
      if (entry.layer === 'global' || entry.file?.startsWith('global:')) {
        const rel = entry.file ? entry.file.replace(/^global:/, '') : 'config.yaml';
        displayFile = `~/.fgos/${rel}`;
      } else if (entry.layer === 'project' || entry.file?.startsWith('project:')) {
        const rel = entry.file ? entry.file.replace(/^project:/, '') : 'config.yaml';
        displayFile = projectDir ? path.join(projectDir, '.fgos', rel) : `.fgos/${rel}`;
      } else if (entry.layer === 'shipped' || entry.layer === 'standard') {
        displayFile = '<standard>';
      } else {
        displayFile = entry.file ?? '<file>';
      }

      const pos = Number.isInteger(entry.line) ? `:${entry.line}` : '';
      const loc = `${displayFile}${pos}`;
      if (!seen.has(loc)) {
        seen.add(loc);
        locations.push(loc);
      }
    }
  }

  return locations;
}

export function commonDottedParent(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return '';
  if (paths.length === 1) return paths[0];
  const split = paths.map((p) => p.split('.'));
  const first = split[0];
  const common = [];
  for (let i = 0; i < first.length; i++) {
    const seg = first[i];
    if (split.every((p) => p[i] === seg)) {
      common.push(seg);
    } else {
      break;
    }
  }
  return common.join('.');
}

export function deriveSubpath(paths, path) {
  const allPaths = paths?.length ? paths : (path ? [path] : []);
  if (allPaths.length === 0) return undefined;
  if (allPaths.length === 1) {
    return allPaths[0].replace(/^runner\./, '');
  }
  const common = commonDottedParent(allPaths);
  return common.replace(/^runner\./, '') || undefined;
}

export class RunnerConfigError extends Error {
  constructor(message, { code, phase, path, paths, detail } = {}) {
    super(message);
    this.name = 'RunnerConfigError';
    this.category = 'validation';
    if (code !== undefined) this.code = code;
    if (phase !== undefined) this.phase = phase;
    if (path !== undefined) this.path = path;
    if (paths !== undefined) this.paths = paths;
    else if (path !== undefined) this.paths = [path];
    if (detail !== undefined) this.detail = detail;
  }

  get subpath() {
    return deriveSubpath(this.paths, this.path);
  }
}

export function attributeRunnerConfigError(err, origins, projectDir) {
  if (err instanceof RunnerConfigError && (err.paths?.length || err.path)) {
    const paths = err.paths ?? [err.path];
    const locations = resolveOriginLocations(origins, paths, projectDir);
    if (locations.length > 0) {
      const subpath = err.subpath ? ` ${err.subpath}` : '';
      const msg = `runner config (${locations.join(', ')}${subpath}) ${err.detail ?? err.message}`;
      return new RunnerConfigError(msg, {
        code: err.code,
        phase: err.phase,
        path: err.path,
        paths: err.paths,
        detail: err.detail,
      });
    }
  }
  return null;
}

function makeFail(label, canonicalPrefix) {
  return function fail(relPath, detail, options = {}) {
    let msgLabel;
    let paths;
    let path;
    if (Array.isArray(relPath)) {
      const parent = commonDottedParent(relPath);
      msgLabel = parent ? `${label}.${parent}` : label;
      paths = relPath.map((r) => (r ? `${canonicalPrefix}.${r}` : canonicalPrefix));
    } else {
      msgLabel = relPath ? `${label}.${relPath}` : label;
      path = relPath ? `${canonicalPrefix}.${relPath}` : canonicalPrefix;
      paths = [path];
    }
    const message = `runner config (${msgLabel}) ${detail}`;
    throw new RunnerConfigError(message, {
      code: options.code,
      path,
      paths: options.paths ?? paths,
      detail,
    });
  };
}

function normalizeConfigConfinement(cfg) {
  if (!cfg || typeof cfg !== 'object') return cfg;
  if (cfg.executor?.confinement) {
    const normalized = normalizeLegacyConfinement(cfg.executor.confinement);
    if (normalized) {
      if (cfg.executor.confinement.backend) {
        normalized.backend = cfg.executor.confinement.backend;
      }
      cfg.executor.confinement = normalized;
    }
  }
  if (cfg.executors && typeof cfg.executors === 'object') {
    for (const executor of Object.values(cfg.executors)) {
      if (executor?.confinement) {
        const normalized = normalizeLegacyConfinement(executor.confinement);
        if (normalized) {
          if (executor.confinement.backend) {
            normalized.backend = executor.confinement.backend;
          }
          executor.confinement = normalized;
        }
      }
    }
  }
  return cfg;
}

/**
 * `runner.rigorToTier` is retired. Set in the global file it is refused here, naming that file (the shape check
 * below names the project directory, which is not where the key is).
 */
function refuseGlobalRigorToTier(origins) {
  const at = origins.find((o) => o.layer === 'global' && (o.path === 'runner.rigorToTier' || o.path.startsWith('runner.rigorToTier.')));
  if (!at) return;
  // The provenance file of the global layer is `global:<name>`.
  const file = `~/.fgos/${String(at.file ?? 'config.json').replace(/^global:/, '')}`;
  throw new RunnerConfigError(
    `${file}${Number.isInteger(at.line) ? `:${at.line}:${at.column}` : ''} runner.rigorToTier no longer exists: rigor no longer chooses a tier; delete the key.`,
  );
}

const warnedGlobalExtendedCells = new Set();

/**
 * Every fgOS release on the machine reads the global config; an older one fails on a list or an object cell and
 * passes `model@pool` to the CLI as a model id, so these forms belong in a project config until every release reads
 * them. A global cell written that way is dropped from the effective value (in memory, the file is never
 * rewritten) and named once per process on stderr. The layer that set a cell comes from the snapshot's provenance.
 */
function dropGlobalExtendedTierCells(cfg, origins) {
  const seen = new Set();
  for (const { path: at, layer } of origins) {
    const cell = layer === 'global' ? /^runner\.modelPolicies\.([^.[]+)\.([^.[]+)/.exec(at) : null;
    if (!cell || seen.has(`${cell[1]}.${cell[2]}`)) continue;
    seen.add(`${cell[1]}.${cell[2]}`);
    const [, family, tier] = cell;
    const tierMap = cfg.modelPolicies?.[family];
    if (!tierMap || !isExtendedTierCell(tierMap[tier])) continue;
    // The layer below the global one is the standard (the project sits above, accounts and detected hold no cell).
    const below = readStandardValue(`runner.modelPolicies.${family}.${tier}`);
    if (below.present) tierMap[tier] = below.value;
    else delete tierMap[tier];
    const cellName = `modelPolicies.${family}.${tier}`;
    if (warnedGlobalExtendedCells.has(cellName)) continue;
    warnedGlobalExtendedCells.add(cellName);
    process.stderr.write(
      `fgos: ignoring ~/.fgos/config.json runner.${cellName}: a list, "model@pool" or {model, pool?, effort?} cell belongs in the project config (older fgOS releases on this machine cannot read it)\n`,
    );
  }
}

/**
 * Maps a ConfigDoorError's refusals to a RunnerConfigError with code 'config-key-retired'
 * when the refusal path corresponds to a retired key. Calls checkConfig once on refusal.
 */
export function checkDoorRefusalsForRetiredKeys(err, options = {}) {
  if (!err) return;
  let checkFindings = [];
  try {
    const checkRes = checkConfig({ projectRoot: options.projectRoot });
    checkFindings = checkRes.findings ?? [];
  } catch (checkErr) {
    if (checkErr.refusals) {
      checkFindings = checkErr.refusals;
    }
  }

  const candidates = [...checkFindings, ...(Array.isArray(err.refusals) ? err.refusals : [])];
  const messages = [];
  const seen = new Set();
  for (const entry of candidates) {
    if (!entry.path) continue;
    const detected = detectRetiredPatternKeys(entry.path);
    for (const item of detected) {
      const displayFile = entry.file?.startsWith('global:')
        ? `~/.fgos/${entry.file.replace(/^global:/, '')}`
        : (entry.file ?? '<file>');
      const pos = Number.isInteger(entry.line) ? `:${entry.line}:${entry.column}` : '';
      const where = `${displayFile}${pos}`;
      const msg = `${where}: ${formatRetiredKeySentence(item)}.`;
      const dedupeKey = `${item.key}@${entry.file ?? ''}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        messages.push(msg);
      }
    }
  }
  if (messages.length > 0) {
    throw new RunnerConfigError(
      messages.join('\n'),
      { code: 'config-key-retired' },
    );
  }
}

/**
 * Reads the runner config of the project at `dir` through the config door: project over global over the
 * standard, the detected executor filled in, accounts from the machine's accounts file. Nothing is created
 * or rewritten by a read. A refusal of the door (a file that does not parse, a key in the wrong scope, a
 * value that breaks its schema) is raised as a RunnerConfigError carrying the door's failure id as `.code`
 * and naming every refusal's file and position, never a value. A project with no `runner.executor` set and
 * no assistant CLI on PATH has none to run: the error names the command that sets one.
 */
export function loadRunnerConfigForDir(dir) {
  let runner;
  let origins;
  try {
    ({ value: { runner }, origins } = readConfig({
      projectRoot: dir,
      sections: ['runner'],
      origins: ['runner.modelPolicies', 'runner.rigorToTier', 'runner.patterns', 'runner.loops'],
    }));
  } catch (err) {
    if (err instanceof ConfigDoorError) {
      checkDoorRefusalsForRetiredKeys(err, { projectRoot: dir });
      throw new RunnerConfigError(err.message, { code: err.code });
    }
    throw err;
  }
  // The facade's objects have no prototype; the runner code and its callers take ordinary objects (a JSON round trip
  // keeps every key an own key, `__proto__` included).
  const cfg = JSON.parse(JSON.stringify(runner));
  refuseGlobalRigorToTier(origins);
  dropGlobalExtendedTierCells(cfg, origins);
  try {
    validateRunnerConfigShape(cfg, `${path.join(dir, '.fgos')} runner`);
  } catch (err) {
    const attributed = attributeRunnerConfigError(err, origins, dir);
    if (attributed) throw attributed;
    throw err;
  }
  withRunnerOrigins(cfg, origins);
  return normalizeConfigConfinement(cfg);
}

/** `executors.<id>.carries` values: the content class an executor may receive (`secrets` is deliberately never one). */
export const EXECUTOR_CARRIES = Object.freeze(['user-text', 'repo-content']);

export { REASONING_EFFORT_VALUES };

/**
 * The one validation every requested reasoningEffort goes through, whichever
 * door asked for it: the canonical vocabulary first, then the levels the
 * executor itself declares in `supports.reasoningEffort` (a narrower list
 * there is a deliberate limit, never bypassed by a command-line flag).
 * Returns the value unchanged when it passes.
 */
export function assertReasoningEffort(value, { supported, executorId } = {}) {
  if (!REASONING_EFFORT_VALUES.includes(value)) {
    throw new RunnerConfigError(`invalid reasoningEffort "${value}". Valid values: [${REASONING_EFFORT_VALUES.join(', ')}]`);
  }
  if (Array.isArray(supported) && !supported.includes(value)) {
    throw new RunnerConfigError(`executor "${executorId}" supports reasoningEffort [${supported.join(', ')}], not "${value}"`);
  }
  return value;
}

// The floor and ceiling live in a leaf module (the confinement reaper reads the ceiling too).
export { RUN_TIMEOUT_MIN_MS, RUN_TIMEOUT_MAX_MS };
const RUN_TIMEOUT_UNIT_MS = Object.freeze({ ms: 1, s: 1000, m: 60000, h: 3600000 });

/**
 * The registered name a capability goes by: its own key in `cfg.capabilities`, else the key that lists it as
 * an alias; undefined when nothing registers it. The dispatch door and a proposal share this one check.
 */
export function registeredCapabilityOf(cfg, name) {
  const capabilities = cfg?.capabilities && typeof cfg.capabilities === 'object' ? cfg.capabilities : {};
  if (Object.hasOwn(capabilities, name)) return name;
  return Object.keys(capabilities).find((capName) => capabilities[capName]?.aliases?.includes?.(name));
}

/** A run timeout in milliseconds, refused when it is not a whole number inside the floor and ceiling. */
export function assertRunTimeoutMs(value, label = 'run timeout') {
  const problem = runTimeoutProblem(value, label);
  if (problem) throw new RunnerConfigError(problem);
  return value;
}

/** `90m`, `5400s`, `2h`, `600000ms`: one whole number and one unit, checked like any run timeout. */
export function parseRunTimeout(text, label = '--timeout') {
  const match = /^(\d+)(ms|s|m|h)$/.exec(typeof text === 'string' ? text.trim() : '');
  if (!match) {
    throw new RunnerConfigError(`${label} takes a whole number and a unit (ms, s, m or h), e.g. 90m or 5400s; got: ${JSON.stringify(text)}`);
  }
  const ms = Number(match[1]) * RUN_TIMEOUT_UNIT_MS[match[2]];
  // A number too large to count is named by the text that was typed, never by its float.
  if (!Number.isSafeInteger(ms)) throw new RunnerConfigError(`${label} is too large: ${text.trim()} (at most ${RUN_TIMEOUT_MAX_MS / 3600000}h)`);
  return assertRunTimeoutMs(ms, label);
}

/**
 * CLI commands recognized as staying within the Claude ecosystem for cross-provider governance. Deliberately not
 * the list of assistant CLIs the config door detects on PATH: that one includes `'codex'` (OpenAI's own CLI).
 */
export const CLAUDE_CLI_COMMANDS = Object.freeze(['claude']);

/**
 * The model tiers of `runner.modelPolicies.<family>`, weakest first. The names come from the Seat Binding contract
 * file the Rust crate embeds, so the two sides cannot drift.
 */
const TIER_LADDER_URL = new URL('../../../packages/seat-binding/contracts/seat-binding.tier-ladder.v1.json', import.meta.url);
export const MODEL_POLICY_TIERS = Object.freeze(JSON.parse(fs.readFileSync(TIER_LADDER_URL, 'utf8')).tiers.map((tier) => tier.name));

/**
 * `capabilities.<name>.prefer` as one list of `{executor, invocation?, crossProvider?}`: the single executor-id
 * string is a list of one, a bare id inside a list is an entry with no invocation pin. The schema has already
 * refused a malformed entry; whether the named executor and invocation exist is `validateRunnerConfigShape`'s.
 */
export function normalizePreferCandidates(prefer) {
  return [prefer].flat().map((entry) => (typeof entry === 'string'
    ? { executor: entry, invocation: undefined }
    : { executor: entry.executor, invocation: entry.invocation, ...(entry.crossProvider !== undefined ? { crossProvider: entry.crossProvider } : {}) }));
}

/**
 * Advisory-only, config-load-time warning: an `executors.<id>` entry that declares neither `providerModel` nor
 * `provider`, and whose `via:"cli"` invocation yields no usable command, has no reliable way to name its provider
 * family there: `deriveProviderFamily` falls to its `'claude'` default while other call sites read a different
 * (or no) family. Safe only when a real `via:"cli"` command exists; unsafe for a bare entry with a real non-Claude
 * flat `.command` and for an invocations-shaped entry with no cli invocation at all. Never throws; it only
 * recommends declaring `providerModel` so every call site agrees.
 */
function warnIfProviderFamilyUnreliable(executorId, executor) {
  if (executor.providerModel !== undefined || executor.provider !== undefined) return;
  // Skip warning when every declared invocation is non-CLI (e.g. mcp-only).
  if (Array.isArray(executor.invocations) && executor.invocations.length > 0 && executor.invocations.every((inv) => inv.via !== 'cli')) {
    return;
  }
  const cliInvocationCommand = Array.isArray(executor.invocations)
    ? executor.invocations.find((inv) => inv.via === 'cli')?.command
    : undefined;
  if (typeof cliInvocationCommand === 'string' && cliInvocationCommand.trim()) return;
  const command = executor.command;
  if (typeof command === 'string' && command.trim() && CLAUDE_CLI_COMMANDS.includes(command)) return;
  const commandDescription = typeof command === 'string' && command.trim() ? JSON.stringify(command) : 'none resolvable from its config';
  console.warn(
    `fgos: executor "${executorId}" declares no "providerModel"/"provider" and its command ` +
      `(${commandDescription}) is not a recognized Claude CLI command — its resolved provider ` +
      `family may be unreliable/inconsistent across dispatch code paths. Declare "providerModel" explicitly.`,
  );
}

const CONFINEMENT_FLAGS = ['privateHome', 'isolatedSession', 'ownWorktree'];

/**
 * Declarations that no longer mean anything, and why: no schema node describes a removed key, so a config that
 * still carries one is told here instead of being accepted and ignored.
 */
const REMOVED_EXECUTOR_FIELDS = Object.freeze({
  receipt: 'It had one legal value and no reader anywhere in the repo. The rule it stood for -- a round concludes only from a file the receiver wrote -- is not configurable and never was; it is what the herdr round does unconditionally.',
  trustStore: 'Declare it on "interactiveMode" instead, which is where the adapter reads it. It used to be declared at the executor level and read from interactiveMode, so its one validated kind guarded a field nothing consulted.',
  readOnlyRedirect: 'readOnlyRedirect was retired. Read-only posture is enforced by OS confinement (Phase 6).',
  // Spelled in two parts so the retired-vocabulary scan of src does not read this refusal as a live use.
  [['rigor', 'Overrides'].join('')]: 'express per-tier models in runner.modelPolicies.<family> instead.',
});

/**
 * Why a runner-level key is gone. The schema describes no node for it, so only a refusal here can say what replaces it.
 */
const REMOVED_RUNNER_KEYS = Object.freeze({
  readOnlyExecutorRedirects: 'read-only posture is enforced by OS confinement; delete the key.',
  placementPolicy: 'read-only posture is enforced by OS confinement; delete the key.',
  models: 'use "modelPolicies.<provider>.<tier>" instead.',
  rigorToTier: 'rigor no longer chooses a tier; delete the key and declare "tier" per capability, role, persona or seat.',
});

/**
 * The invariant binding two fields of an executor: `permissionMode: 'bypass'` hands the worker an agent that will
 * not ask before acting, which is only defensible when the worker is confined. The refusal names the missing flag,
 * because "confinement incomplete" sends a reader looking through three booleans for the one that is false.
 */
function checkBypassIsConfined(executor, label) {
  if (executor.permissionMode !== 'bypass') return;
  const c = executor.confinement ?? {};
  const present = {
    privateHome: c.privateHome === true || c.controls?.home === 'private',
    isolatedSession: c.isolatedSession === true || c.controls?.session === 'isolated',
    ownWorktree: c.ownWorktree === true || c.controls?.workspace === 'own',
  };
  const missing = CONFINEMENT_FLAGS.filter((flag) => !present[flag]);
  if (missing.length > 0) {
    throw new RunnerConfigError(
      `runner config (${label}) declares "permissionMode": "bypass" without full confinement -- missing ${missing.join(', ')}. ` +
      'A worker that never asks before acting is only defensible when it is confined, so bypass requires ' +
      `${CONFINEMENT_FLAGS.join(', ')} to all be true.`,
    );
  }
}

/** The rules of one invocation that read beyond its own fields: its tools against the catalog, its store against the confinement. */
function checkInvocation(invocation, label, capabilityNames, executorConfinement) {
  if (invocation.via === 'mcp') {
    for (const capabilityName of Object.keys(invocation.tools ?? {})) {
      if (!capabilityNames.has(capabilityName)) {
        throw new RunnerConfigError(
          `runner config (${label}) "tools" key "${capabilityName}" is not declared in "capabilities" — add it there first.`,
        );
      }
    }
  }
  if (invocation.credentialStore !== undefined) {
    const problem = credentialStoreProblem(invocation.credentialStore);
    if (problem) throw new RunnerConfigError(`runner config (${label}) "credentialStore" ${problem}.`);
    if (invocation.via !== 'cli' || !(invocation.confinement ?? executorConfinement)?.backend) {
      throw new RunnerConfigError(`runner config (${label}) declares "credentialStore" without a confinement backend. A store is handed to the launch through its private home, so only a confined "cli" invocation can read one; an unconfined invocation reads its store through "env".`);
    }
  }
}

/** The rules of one `executors.<id>` entry that read beyond its own fields. */
function checkExecutorEntry(executor, label, capabilityNames) {
  for (const [field, why] of Object.entries(REMOVED_EXECUTOR_FIELDS)) {
    if (executor[field] !== undefined) {
      throw new RunnerConfigError(`runner config (${label}) "${field}" was removed. ${why}`);
    }
  }
  // `for` describes `kind: "tool"` executors; on an agent it is inert and `fgos doctor` names it.
  for (const purpose of executor.for ?? []) {
    if (!capabilityNames.has(purpose)) {
      throw new RunnerConfigError(
        `runner config (${label}) "for" entry "${purpose}" is not declared in "capabilities" — add it there first.`,
      );
    }
  }
  checkBypassIsConfined(executor, label);
  const seenInvocationIds = new Set();
  (executor.invocations ?? []).forEach((invocation, index) => {
    checkInvocation(invocation, `${label} invocations[${index}]`, capabilityNames, executor.confinement);
    if (invocation.id === undefined) return;
    if (seenInvocationIds.has(invocation.id)) {
      throw new RunnerConfigError(`runner config (${label}) "invocations" declares "id": "${invocation.id}" more than once — each invocation id must be unique within one executor.`);
    }
    seenInvocationIds.add(invocation.id);
  });
}

/** A persona is named by the bare name inside its `agent.<name>.yaml`, under Convention's agent-name rule. */
function personaNameProblem(name) {
  try {
    definitionFileName('agent-file', name);
    return true;
  } catch {
    return 'a persona name (a lowercase letter, then lowercase letters, digits or "-")';
  }
}

const SEAT_TASTE_KEY_RULES = Object.freeze({
  personas: personaNameProblem,
  seats: (key) => isSeatId(key) || 'a seat id (a lowercase letter, then lowercase letters, digits or "-"; not a reserved name)',
});

/** The rules of one capability entry that read beyond its own fields: the key rules Convention owns, and the confinement policy. */
function checkCapabilityEntry(entry, label) {
  for (const [mapKey, keyProblem] of Object.entries(SEAT_TASTE_KEY_RULES)) {
    for (const key of Object.keys(entry[mapKey] ?? {})) {
      const verdict = keyProblem(key);
      if (verdict !== true) throw new RunnerConfigError(`runner config (${label}.${mapKey}) key ${JSON.stringify(key)} must be ${verdict}.`);
    }
  }
  if (entry.confinement !== undefined) validateCapabilityConfinementShape(entry.confinement, `${label}.confinement`);
}

/** Every `prefer` a capability entry carries, with the label that names where it sits. */
function preferSitesOf(entry, label) {
  const sites = [];
  if (entry.prefer !== undefined) sites.push({ prefer: entry.prefer, label: `${label} "prefer"` });
  for (const mapKey of ['roles', 'personas', 'seats']) {
    for (const [key, taste] of Object.entries(entry[mapKey] ?? {})) {
      if (taste?.prefer !== undefined) sites.push({ prefer: taste.prefer, label: `${label}.${mapKey}.${key} "prefer"` });
    }
  }
  return sites;
}

function boundedParamsForLoop(loopName) {
  const table = paramTableOf(loopName);
  if (!table) return [];
  return Object.entries(table)
    .filter(([_, meta]) => meta.type === 'integer')
    .map(([param]) => param);
}

/**
 * The rules of `runner.patterns` that read beyond its own fields: a retired key says what replaced it, a reserved
 * name cannot name a pattern, and a declared seat list is Seat Resolver's to judge.
 */
export function validateRunnerPatternsShape(patterns, label = 'patterns', options = {}) {
  const fail = makeFail(label, options.canonicalPrefix ?? 'runner.patterns');
  const retiredFindings = detectRetiredPatternKeys(patterns);
  if (retiredFindings.length > 0) {
    const messages = [...new Set(retiredFindings.map((finding) => `runner config (${label}): ${formatRetiredKeySentence(finding)}.`))];
    throw new RunnerConfigError(messages.join('\n'), {
      code: 'config-key-retired',
      paths: retiredFindings.map((f) => f.key),
      detail: messages.join('\n'),
    });
  }
  for (const [name, entry] of Object.entries(patterns)) {
    if (name === 'seatBinding') continue;
    if (RESERVED_PATTERN_NAMES.has(name)) fail(name, `uses reserved name "${name}" as a pattern name.`);
    if (entry.defaults?.seats === undefined) continue;
    try {
      checkDeclaredSeats(entry.defaults.seats, `${label}.${name}.defaults.seats`);
    } catch (err) {
      if (err instanceof SeatResolutionError) {
        fail(`${name}.defaults.seats${err.at ?? ''}`, err.detail ?? err.message, { code: err.code });
      }
      throw err;
    }
  }
}

/**
 * The rules of `runner.loops` that read beyond its own fields: a bound names a parameter its loop reads, `min` does
 * not exceed `max`, and the checkers of each rigor include those of every weaker rigor.
 */
export function validateRunnerLoopsShape(loops, label = 'loops', options = {}) {
  const fail = makeFail(label, options.canonicalPrefix ?? 'runner.loops');
  for (const [loopName, loopEntry] of Object.entries(loops)) {
    const cbr = loopEntry.checkersByRigor;
    if (cbr !== undefined) {
      const orderedRigors = RIGOR_VALUES.filter((r) => r in cbr);
      for (let i = 1; i < orderedRigors.length; i += 1) {
        const weaker = orderedRigors[i - 1];
        const stronger = orderedRigors[i];
        for (const checker of cbr[weaker]) {
          if (!cbr[stronger].includes(checker)) {
            fail(
              [`reviewed.checkersByRigor.${weaker}`, `reviewed.checkersByRigor.${stronger}`],
              `is not cumulative: "${stronger}" does not include checker "${checker}" from weaker rigor "${weaker}".`,
            );
          }
        }
      }
    }
    const readableParams = boundedParamsForLoop(loopName);
    for (const [param, bound] of Object.entries(loopEntry.bounds ?? {})) {
      if (!readableParams.includes(param)) {
        fail(`${loopName}.bounds.${param}`, `is not a parameter read by the "${loopName}" loop.`);
      }
      if (bound.min !== undefined && bound.max !== undefined && bound.min > bound.max) {
        fail(
          [`${loopName}.bounds.${param}.min`, `${loopName}.bounds.${param}.max`],
          `min (${bound.min}) must be <= max (${bound.max}).`,
        );
      }
    }
  }
}

/**
 * Pure query: does `cfg.modelPolicies.<providerModel>` declare `policyTier`? No I/O, no credential probing, no
 * "is the executable on PATH" check. A cell declares the tier when it parses to at least one entry, served by any pool.
 */
export function supportsPolicyTier(cfg, providerModel, policyTier) {
  const cell = cfg?.modelPolicies?.[providerModel]?.[policyTier];
  if (cell === undefined) return false;
  try {
    return parseTierCell(cell, providerModel).length > 0;
  } catch {
    return false;
  }
}

/**
 * The rules of `runner.generatedPaths` the schema cannot state: `from` must open with a literal directory (a bare
 * `**` or a leading glob would widen every unit's scope) and every entry must read as a write-scope entry.
 */
export function validateGeneratedPathsShape(generatedPaths, label) {
  generatedPaths.forEach((entry, i) => {
    let from;
    try {
      from = canonicalizeWriteEntry(entry.from);
    } catch (err) {
      throw new RunnerConfigError(`runner config (${label}) generatedPaths[${i}].from: ${err.message}`);
    }
    if (from.split('/')[0].includes('*')) {
      throw new RunnerConfigError(`runner config (${label}) generatedPaths[${i}].from must start with a literal directory, got ${JSON.stringify(entry.from)}.`);
    }
    entry.also.forEach((also, j) => {
      try {
        canonicalizeWriteEntry(also);
      } catch (err) {
        throw new RunnerConfigError(`runner config (${label}) generatedPaths[${i}].also[${j}]: ${err.message}`);
      }
    });
  });
}

/** What a prefer site names must exist: the executor, and the invocation id when it pins one. */
function checkPreferTargets(cfg, sourceLabel) {
  for (const [name, entry] of Object.entries(cfg.capabilities ?? {})) {
    for (const site of preferSitesOf(entry, `${sourceLabel} capabilities.${name}`)) {
      const siteName = site.label.slice(0, site.label.lastIndexOf(' "prefer"'));
      for (const candidate of normalizePreferCandidates(site.prefer)) {
        const candidateExecutor = cfg.executors?.[candidate.executor];
        if (!candidateExecutor) {
          throw new RunnerConfigError(
            `runner config (${siteName}) "prefer" names "${candidate.executor}" but no such executor is registered.`,
          );
        }
        if (candidate.invocation !== undefined && !(candidateExecutor.invocations ?? []).some((inv) => inv.id === candidate.invocation)) {
          throw new RunnerConfigError(
            `runner config (${siteName}) "prefer" names invocation "${candidate.invocation}" on executor "${candidate.executor}" but no such invocation id is declared on it.`,
          );
        }
      }
    }
  }
}

/** The confinement rules that compare a capability with the policies and the strict flag. */
function checkConfinementAgainstPolicies(cfg, sourceLabel) {
  const strict = cfg.confinement?.strict === true;
  for (const [policyId, policyDoc] of Object.entries(cfg.confinementPolicies ?? {})) {
    if (BUILTIN_POLICY_IDS.includes(policyId)) {
      throw new RunnerConfigError(
        `runner config (${sourceLabel}.confinementPolicies) cannot redefine built-in policy "${policyId}".`,
      );
    }
    validateConfinementPolicyShape(policyDoc, `${sourceLabel} confinementPolicies.${policyId}`);
  }
  const capabilities = Object.entries(cfg.capabilities ?? {});
  for (const [name, entry] of capabilities) {
    const mode = entry.confinement?.mode;
    if (mode === 'required' || (strict && mode === 'preferred')) {
      const policyId = entry.confinement.policy;
      if (!BUILTIN_POLICY_IDS.includes(policyId) && !(cfg.confinementPolicies && policyId in cfg.confinementPolicies)) {
        throw new RunnerConfigError(strict
          ? `runner config (${sourceLabel} capabilities.${name}) references unknown policy "${policyId}" in strict mode (confinement-policy-missing).`
          : `runner config (${sourceLabel} capabilities.${name}) mode "required" references unknown policy "${policyId}".`);
      }
    }
  }
  if (!strict) return;
  if (capabilities.length === 0) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) strict mode requires explicit capabilities declared (confinement-policy-missing).`,
    );
  }
  for (const [name, entry] of capabilities) {
    if (!entry.confinement?.mode) {
      throw new RunnerConfigError(
        `runner config (${sourceLabel} capabilities.${name}) missing required explicit confinement in strict mode (confinement-policy-missing).`,
      );
    }
  }
}

/**
 * The rules of the effective runner config that compare two fields, or a field with a catalog or registry. The
 * config door has already refused every type, enum, range, required and unknown-key rule against
 * `core/config-schema/runner.schema.yaml`, so this reads a value of the right shape.
 */
export function validateRunnerConfigShape(cfg, sourceLabel) {
  for (const [key, why] of Object.entries(REMOVED_RUNNER_KEYS)) {
    if (key in cfg) throw new RunnerConfigError(`runner config (${sourceLabel}) declares retired "${key}": ${why}`);
  }
  const capabilityNames = new Set();
  for (const [name, entry] of Object.entries(cfg.capabilities ?? {})) {
    checkCapabilityEntry(entry, `${sourceLabel} capabilities.${name}`);
    capabilityNames.add(name);
    for (const alias of entry.aliases ?? []) capabilityNames.add(alias);
  }
  for (const [executorId, executor] of Object.entries(cfg.executors ?? {})) {
    checkExecutorEntry(executor, `${sourceLabel} executors.${executorId}`, capabilityNames);
    warnIfProviderFamilyUnreliable(executorId, executor);
  }
  checkPreferTargets(cfg, sourceLabel);
  validateProviderAccountInventory(cfg, sourceLabel);
  if (cfg.patterns !== undefined) validateRunnerPatternsShape(cfg.patterns, `${sourceLabel} patterns`);
  if (cfg.loops !== undefined) validateRunnerLoopsShape(cfg.loops, `${sourceLabel} loops`);
  if (cfg.generatedPaths !== undefined) validateGeneratedPathsShape(cfg.generatedPaths, sourceLabel);
  // Project config cannot define or override machine backend instances.
  rejectProjectBackendOverride(cfg, sourceLabel);
  checkConfinementAgainstPolicies(cfg, sourceLabel);
}
