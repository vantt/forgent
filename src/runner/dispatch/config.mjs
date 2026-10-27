// dispatch/config.mjs — runner config load/validate + the frozen
// vocabularies every other dispatch/* module reads (D7, tsk-2uf-1): the
// `RunnerConfigError` type, the read-only loaders of the `runner` section
// (`loadRunnerConfigForDir` over the config door, `loadRunnerConfig` for a
// named file), every `validate*Shape` gate, and the frozen
// enums (`EXECUTOR_KINDS`/`EXECUTOR_CARRIES`/`CLAUDE_CLI_COMMANDS`/
// `MODEL_POLICY_TIERS`/`INVOCATION_VIA`). Split out of the former
// `src/runner/dispatch.mjs` (2204 lines, 6 concerns in one file) — pure
// move, no behavior change; `src/runner/dispatch.mjs` re-exports every name
// below unchanged as a barrel. See `docs/history/dispatch-activation-and-
// handoff-redesign/CONTEXT.md` D7 for the split rationale.
//
// TRUSTED-CONFIG NOTE (security panel, unchanged from the pre-split file):
// the shared config file's `runner` section (`.fgos/config.yaml`) is an
// EXECUTABLE config, not passive data — whoever can edit it controls what
// process `dispatch/transport.mjs` spawns and with what arguments. It is
// committed (per D2's durability policy) so it is reviewable like any other
// source file, but that also means it carries the same trust level as code:
// only apply it from a checkout you already trust.
import { CHECKER_SEATS, SEAT_ROLES, LOOP_NAMES, checkDeclaredSeats } from '../execution/seat-resolver.mjs';
import { isSeatId } from '../../convention/seat-id.mjs';
import { definitionFileName } from '../../convention/definition-names.mjs';
import { RIGOR_VALUES } from '../rigor.mjs';
import { canonicalizeWriteEntry } from './write-scope.mjs';
import { RUN_TIMEOUT_MIN_MS, RUN_TIMEOUT_MAX_MS, runTimeoutProblem } from './run-timeout.mjs';
import { parseTierCell, isExtendedTierCell, REASONING_EFFORT_VALUES } from './tier-cell.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ConfigDoorError, readConfig, readStandardValue } from '../../config/facade.mjs';
import { describeYamlError, parseYaml } from '../../util/yaml.mjs';
import { validateProviderAccountInventory } from './provider-capacity.mjs';
// EXECUTOR_ADAPTERS lives in ./adapters.mjs (leaf module) so config loading
// can validate adapter names without importing transport.mjs (cutting the
// prior config.mjs <-> transport.mjs import cycle).
import { EXECUTOR_ADAPTERS } from './adapters.mjs';
import { assertNoRetiredKeys, checkDoorRefusalsForRetiredKeys } from './retired-config-keys.mjs';
import { credentialStoreProblem } from './provider-capacity.mjs';
import {
  BUILTIN_POLICIES,
  BUILTIN_POLICY_IDS,
  validateConfinementPolicyShape,
  validateCapabilityConfinementShape,
  validateOverrideConfinementShape,
  normalizeLegacyConfinement,
} from './confinement/policies.mjs';
import {
  rejectProjectBackendOverride,
  validateBackendRegistryShape,
  loadMachineBackendRegistry,
  createBackendRegistrySnapshot,
} from './confinement/backend-registry.mjs';

export {
  BUILTIN_POLICIES,
  BUILTIN_POLICY_IDS,
  validateConfinementPolicyShape,
  validateCapabilityConfinementShape,
  validateOverrideConfinementShape,
  normalizeLegacyConfinement,
} from './confinement/policies.mjs';
export {
  rejectProjectBackendOverride,
  validateBackendRegistryShape,
  loadMachineBackendRegistry,
  createBackendRegistrySnapshot,
} from './confinement/backend-registry.mjs';


/** Layer the legacy default `runner.executor` ({command, args}) onto the
 * executor registry. The default fills `claude` and the entry named by its
 * command. When the default runs the same program as the registered entry
 * (command basename equals the executor id), the entry keeps its
 * `invocations`, `identity`, `supports` and the rest, and only
 * `command`/`args` come from the default; when it runs another program, the
 * entry's invocations describe a different CLI and the default replaces it. */
export function withDefaultExecutor(rawCfg) {
  const cfg = { ...rawCfg };
  const defaultExec = rawCfg.executor;
  if (!defaultExec) return cfg;
  const executors = { ...(rawCfg.executors || {}) };
  const ids = new Set(['claude', ...(defaultExec.command ? [defaultExec.command] : [])]);
  const program = defaultExec.command ? path.basename(String(defaultExec.command)) : null;
  for (const id of ids) {
    executors[id] = program === id ? { ...(executors[id] || {}), ...defaultExec } : { ...defaultExec };
  }
  cfg.executor = { ...defaultExec };
  cfg.executors = executors;
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

export class RunnerConfigError extends Error {
  constructor(message, { code, phase } = {}) {
    super(message);
    this.name = 'RunnerConfigError';
    this.category = 'validation';
    if (code !== undefined) this.code = code;
    if (phase !== undefined) this.phase = phase;
  }
}

/**
 * Read and validate a runner config file at `configPath`. Throws
 * `RunnerConfigError` for anything short of the minimal committed shape:
 * `executor.command` (string), `executor.args` (array of strings),
 * `models` (object), `timeoutMs` (positive number).
 */
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
    ({ value: { runner }, origins } = readConfig({ projectRoot: dir, sections: ['runner'], origins: ['runner.modelPolicies', 'runner.rigorToTier'] }));
  } catch (err) {
    if (err instanceof ConfigDoorError) {
      checkDoorRefusalsForRetiredKeys(err);
      throw new RunnerConfigError(err.message, { code: err.code });
    }
    throw err;
  }
  // The facade's objects have no prototype; the runner code and its callers take ordinary objects (a JSON round trip
  // keeps every key an own key, `__proto__` included).
  const cfg = JSON.parse(JSON.stringify(runner));
  refuseGlobalRigorToTier(origins);
  dropGlobalExtendedTierCells(cfg, origins);
  validateRunnerConfigShape(cfg, `${path.join(dir, '.fgos')} runner`);
  return normalizeConfigConfinement(cfg);
}

/**
 * Reads and validates the runner config file at `configPath` (the `--config <path>` input of discover and
 * plan): a named input, not project config, so no layer and no standard apply. JSON is YAML. Throws
 * `RunnerConfigError` for anything short of the minimal shape: `executor.command` (string),
 * `executor.args` (array of strings), `timeoutMs` (positive number).
 */
export function loadRunnerConfig(configPath) {
  let raw;
  try {
    raw = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new RunnerConfigError(`cannot read runner config at "${configPath}": ${err.message}`);
  }

  let cfg;
  try {
    cfg = parseYaml(raw, { filename: configPath });
  } catch (err) {
    throw new RunnerConfigError(`runner config at "${configPath}" is not valid YAML: ${describeYamlError(err)}`);
  }

  assertNoRetiredKeys(cfg.runner ?? cfg, configPath);
  validateRunnerConfigShape(cfg, configPath);
  normalizeConfigConfinement(cfg);
  return cfg;
}

/** The capability entry keys that choose tier or taste per seat; they exist in the project config only. */
const SEAT_BINDING_CAPABILITY_KEYS = Object.freeze(['tier', 'maxTier', 'roles', 'personas', 'seats']);

/** The values of `runner.patterns.seatBinding.schema` this release reads. */
export const SEAT_BINDING_SCHEMA_VERSION = 2;
export const READABLE_SEAT_BINDING_SCHEMA_VERSIONS = Object.freeze(new Set([1, 2]));
/**
 * Shape-check one executor block ({command, args[], adapter?}) — shared by
 * the required global `cfg.executor` and every `executors.<executorId>`
 * entry naming its own `command`/`args` (P41/C9 v2). An `adapter` field,
 * when present, must name a registered `EXECUTOR_ADAPTERS` key; absent
 * defaults to `DEFAULT_ADAPTER` at resolve time, not validated here.
 * (The per-tier `executors` override block, distinct from `executors`,
 * was retired at tsk-in1-2 D6: 0 live entries, had already caused a real
 * bug, per tsk-5tm D10.)
 */
function validateExecutorEnvShape(env, label) {
  if (!env || typeof env !== 'object' || Array.isArray(env)) {
    throw new RunnerConfigError(`runner config (${label}) "env" must be an object mapping ENV_NAME to string when present.`);
  }
  for (const [k, v] of Object.entries(env)) {
    if (typeof k !== 'string' || !k.trim()) {
      throw new RunnerConfigError(`runner config (${label}) "env" key must be a non-empty string.`);
    }
    if (typeof v !== 'string') {
      throw new RunnerConfigError(`runner config (${label}) "env.${k}" must be a string.`);
    }
  }
}

function validateExecutorShape(executor, label) {
  if (
    !executor ||
    typeof executor !== 'object' ||
    Array.isArray(executor) ||
    typeof executor.command !== 'string' ||
    !executor.command.trim() ||
    !Array.isArray(executor.args) ||
    !executor.args.every((arg) => typeof arg === 'string')
  ) {
    throw new RunnerConfigError(
      `runner config (${label}) must declare "command" (non-empty string) and "args" (array of strings).`,
    );
  }
  if (executor.adapter !== undefined && (typeof executor.adapter !== 'string' || !(executor.adapter in EXECUTOR_ADAPTERS))) {
    throw new RunnerConfigError(
      `runner config (${label}) "adapter" must be one of: ${Object.keys(EXECUTOR_ADAPTERS).join(', ')}.`,
    );
  }
  if (executor.env !== undefined) {
    validateExecutorEnvShape(executor.env, label);
  }
}

/** kind vocabulary `executors.<id>.kind` may take (D5, tsk-in1-4): the
 * BAN CHAT axis — is this executor an `agent` (a live persona, potentially
 * native-Task-dispatchable, e.g. `agy`) or a `tool` (presence-only,
 * mechanical, never actually spawned through `resolveExecutorConfig`, e.g.
 * `gitnexus`/`herdr`)? Replaces the old, doubly-overloaded vocabulary that
 * reused `tool-registry.mjs`'s own presence-probe `KINDS` (`cli`/`binary`/
 * `mcp`/`skill`) plus `'task'` — that vocabulary conflated WHAT a executor
 * is with HOW it is invoked, which is exactly what forced `gitnexus`'s
 * `kind:"mcp"` and `herdr`'s `kind:"cli"` to mean two unrelated things at
 * once (tool-registry's own probe mechanism AND dispatch's cross-provider/
 * native-mechanism gates). The invocation MECHANISM now lives entirely in
 * `invocations[].via` (`INVOCATION_VIA`, D8) — `tool-registry.mjs`'s own
 * presence-probe kind is read from there too (`toolsFromExecutors`,
 * `src/state/tool-registry.mjs`), never from this field anymore.
 */
export const EXECUTOR_KINDS = Object.freeze(['agent', 'tool']);

/** value vocabulary `executors.<id>.carries` may take (D15, `tsk-5td`,
 * first real consumer `tsk-2ie5`/`tsk-2c1`): the content class a executor
 * is permitted to receive. `user-text` = pure user-typed text only;
 * `repo-content` = may also carry repo file paths/content — the wider,
 * riskier class (a executor declaring this accepts either class, since
 * `repo-content` covers `user-text` plus more). `secrets`/credentials is
 * deliberately never a legal value here (D15: not a rung on this ladder,
 * a forbidden thing).
 */
export const EXECUTOR_CARRIES = Object.freeze(['user-text', 'repo-content']);

// Canonical reasoningEffort vocabulary, validated here for `supports.reasoningEffort` and at dispatch time.
// The vocabulary itself lives in tier-cell.mjs (a leaf), because a tier cell names an effort too.
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
 * CLI commands recognized as staying within the Claude ecosystem for
 * cross-provider governance (D2, tsk-32n). Deliberately not the list of
 * assistant CLIs the config door detects on PATH: that one includes `'codex'`
 * (OpenAI's own CLI, not Claude), so it is the wrong list for a
 * Claude-vs-non-Claude check.
 */
export const CLAUDE_CLI_COMMANDS = Object.freeze(['claude']);

/**
 * `cfg.modelPolicies.<providerModel>` tier vocabulary (tsk-5tm-5 D9,
 * model-tier vocabulary migration 2026-09-17) — deliberately its OWN
 * 6-value cross-provider equivalence vocab (`plans/260916-account-rotator/
 * design.md`'s "Tier vocabulary"). The names, weakest first, come from the Seat Binding contract file the
 * Rust crate embeds, so the two sides cannot drift.
 */
const TIER_LADDER_URL = new URL('../../../packages/seat-binding/contracts/seat-binding.tier-ladder.v1.json', import.meta.url);
export const MODEL_POLICY_TIERS = Object.freeze(JSON.parse(fs.readFileSync(TIER_LADDER_URL, 'utf8')).tiers.map((tier) => tier.name));

/**
 * `executors.<id>.invocations[].via` vocabulary (tsk-5tm-4 D11, widened
 * D8 tsk-in1-4, `'api'` restored D13 tsk-in1-5): the CO CHE GOI axis,
 * orthogonal to `kind` (D5, the BAN CHAT axis) — `'cli'` (spawns a real
 * subprocess via `cli-spawn`, e.g. `agy`), `'task'` (native in-session
 * Agent/Task dispatch, no subprocess argv), `'mcp'` (presence/identifier-
 * only, e.g. `gitnexus` — never actually spawned through
 * `resolveExecutorConfig`, D2), `'api'` (a real HTTP call via the `http`
 * adapter — D8 dropped this value for 0 historical producers; D13 brings
 * it back now that a real adapter backs it, `httpAdapter` below). Matches
 * real event-log evidence for `cli`/`mcp`/`task`; `'binary'`/`'skill'`
 * stay dropped (0 real usage, merged from `tool-registry.mjs`'s own
 * separate `KINDS` vocabulary). `resolveExecutorConfig` only ever
 * dispatches a `via:"cli"` invocation (gate B2/B3 below) — `'api'` is a
 * real, independently-testable adapter (D13's pluggability precedent, see
 * `httpAdapter`'s own doc comment) with 0 producer wired into that
 * pipeline yet, same as `'mcp'`/`'task'` were before any executor used
 * them for real.
 */
export const INVOCATION_VIA = Object.freeze(['cli', 'task', 'mcp', 'api']);

/**
 * Shape-check one `executors.<id>` entry (D1/D2, tsk-62v; `allowCrossProvider`
 * D1, tsk-32n): requires `kind` (one of `EXECUTOR_KINDS`). `command`/`args`,
 * when either is present, must satisfy the same shape `validateExecutorShape`
 * already requires for an executor block — a executor entry naming its own
 * executor is shaped exactly like one. A executor entry naming neither is
 * valid too: it carries only `kind`/`tier`/`target` metadata and falls
 * through to `executor` (global) for the actual command (D4; tsk-in1-2 D6
 * retired the intermediate `executors.<tier>` rung).
 * `allowCrossProvider`, when present, must be a boolean — absent or `false`
 * means blocked (restrictive-by-default, D1, tsk-32n); the actual refusal
 * happens in `resolveExecutorConfig` below, not here (validation-time can't
 * know the final resolved command).
 *
 * `model`, when present, must be a non-empty string (tsk-2yp follow-up):
 * `cfg.models.<tier>` is a single vocabulary shared with the Claude
 * executor's own tier dispatch (`spawnWorker`), so a cross-provider
 * executor whose backend uses a different model-name vocabulary (e.g.
 * `agy`'s Gemini model strings vs. Claude's `haiku`/`sonnet`/`opus`)
 * cannot borrow that shared table without breaking Claude's own
 * tier-to-model resolution. This field lets `executeExecutorCli`
 * (task-dispatch only, below) substitute a executor-specific model instead.
 *
 * `agentType`, when present, must be a non-empty string (D1/D2, tsk-3sw):
 * names a Claude Code agent definition (`.claude/agents/<name>.md`) an
 * `agent`-kind executor with no own `command`/`args` resolves into a real
 * `claude --agent <agentType>` invocation via, `buildAgentTypeExecutor`
 * below.
 *
 * `forceCliSpawn`, when present, must be a boolean (tsk-3ik-1, Native-First
 * Dispatch Doctrine rule 4, `docs/decisions/0026-...md`): the valid
 * "config forces cli/spawn anyway" exception (isolation, a separate
 * process/worktree/cwd) for an `agent`-kind executor that would otherwise
 * be native-eligible — read by `decideDispatchMechanism`/
 * `decideExecutorDispatchMechanism` below, never by `resolveExecutorConfig`
 * itself (which stays cli/spawn-only and unaware this field exists).
 *
 * `invocations`, when present, must be a non-empty array (tsk-5tm-4 D11,
 * executor-registry.yaml-shaped, marketing-cockpit; shape widened D9
 * tsk-in1-4, "gate B1" below): each entry names its own `via` (one of
 * `INVOCATION_VIA`) — a `via:"cli"` entry must satisfy the same
 * `command`/`args`[/`adapter`] shape `validateExecutorShape` already
 * requires for a real spawn; a `via:"mcp"` entry only requires a non-empty
 * `command` IDENTIFIER (never spawned, never needs `args`); a `via:"task"`
 * entry requires neither (native dispatch carries no subprocess argv at
 * all); a `via:"api"` entry (D13, tsk-in1-5) requires a non-empty `url`
 * instead of `command`/`args` — shaped for `httpAdapter`, not `cli-spawn`.
 * Forcing every invocation through the cli-shaped check regardless
 * of `via` is exactly "bẫy B1" this gate exists to close — `gitnexus`'s
 * own `via:"mcp"` invocation is not spawnable and was never meant to be,
 * same reasoning D13 applied to `'api'`'s own shape.
 * An ADDITIVE alternative to the flat `command`/`args` above, never a
 * replacement (a executor with neither, or with the flat shape, keeps
 * resolving exactly as before this field existed). `resolveExecutorConfig`
 * below selects the invocation whose `via` is `"cli"` specifically — never
 * blindly `invocations[0]` (gate B2) — and throws when `invocations` is
 * present but none is `via:"cli"` (gate B3), rather than silently falling
 * through to the global executor as if the executor were metadata-only.
 * The top-level `executors` field name itself is unchanged (D11) — the
 * tier-keyed per-tier override block (strictly validated, `tsk-4eu`;
 * retired since, tsk-in1-2 D6) already occupied the obvious `executors`
 * name at the time, so reusing it here would have collided.
 *
 * `for`, when present, must be a non-empty array of strings, each one a
 * name (or alias) already declared in `cfg.capabilities` (D15, tsk-in1-4;
 * `capabilities` itself is D4/D14, tsk-in1-3) — an executor now serves
 * MULTIPLE capabilities at once (`agy` could plausibly serve both
 * `judge`-shaped dispatch AND something else later), replacing the old
 * single-value `EXECUTOR_PURPOSES` enum (`['judge']`, retired here: it was
 * exactly the closed, dispatch-only half of the vocab this item's own D4
 * unifies with tool-registry's free-text `capability`). Validated against
 * the SAME curated catalog `capability` on a tool-registry entry answers
 * to — never a separate, narrower enum — so "what can this executor
 * promise" has exactly one place to look, for either tầng.
 */
// Gate B1 (D9, tsk-in1-4): shape-check ONE invocation according to its own
// `via` — never force the cli-spawn executor shape (`command` string +
// `args` array) onto a `via` that was never going to be spawned that way.
// `via:"cli"` is the only one `resolveExecutorConfig` ever actually
// dispatches (gate B2/B3), but `mcp`/`task` invocations still get their own
// real shape check, not a free pass — an empty/malformed `mcp` identifier
// is still a config bug worth catching at load time.
/**
 * `capabilities.<name>.prefer` (executor-id-consolidation Step 2.2): accepts
 * either the legacy single executor-id string, or a non-empty array naming
 * an ORDERED candidate pool (account-rotator-style cascade: try the first,
 * fall to the next only when the first is not usable). Each array element is either a
 * bare executor-id string (no invocation pin — Gate B2's legacy default
 * applies) or `{executor, invocation?}` — `invocation` names a specific
 * `invocations[].id` on that executor (Step 2.1), e.g. to require the
 * confined variant specifically. Always returns a normalized array, even
 * for the single-string legacy case (a 1-element array), so every caller
 * has exactly one shape to handle. Throws on any malformed entry; does
 * NOT check that a named executor/invocation actually exists — that
 * cross-check needs the already-validated `cfg.executors` block, done by
 * the caller once every entry's OWN shape is confirmed sane.
 */
export function normalizePreferCandidates(prefer, label) {
  if (typeof prefer === 'string') {
    if (!prefer.trim()) {
      throw new RunnerConfigError(`runner config (${label}) must be a non-empty string or a non-empty array when present.`);
    }
    return [{ executor: prefer, invocation: undefined }];
  }
  if (Array.isArray(prefer)) {
    if (prefer.length === 0) {
      throw new RunnerConfigError(`runner config (${label}) array must not be empty.`);
    }
    return prefer.map((entry, index) => {
      const entryLabel = `${label}[${index}]`;
      if (typeof entry === 'string') {
        if (!entry.trim()) {
          throw new RunnerConfigError(`runner config (${entryLabel}) must be a non-empty string.`);
        }
        return { executor: entry, invocation: undefined };
      }
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        if (typeof entry.executor !== 'string' || !entry.executor.trim()) {
          throw new RunnerConfigError(`runner config (${entryLabel}) "executor" must be a non-empty string.`);
        }
        if (entry.invocation !== undefined && (typeof entry.invocation !== 'string' || !entry.invocation.trim())) {
          throw new RunnerConfigError(`runner config (${entryLabel}) "invocation" must be a non-empty string when present.`);
        }
        if (entry.crossProvider !== undefined && typeof entry.crossProvider !== 'boolean') {
          throw new RunnerConfigError(`runner config (${entryLabel}) "crossProvider" must be a boolean when present.`);
        }
        const ALLOWED_PREFER_ENTRY_KEYS = ['executor', 'invocation', 'crossProvider'];
        for (const key of Object.keys(entry)) {
          if (!ALLOWED_PREFER_ENTRY_KEYS.includes(key)) {
            throw new RunnerConfigError(`runner config (${entryLabel}) contains unknown key "${key}". Allowed keys: ${ALLOWED_PREFER_ENTRY_KEYS.join(', ')}.`);
          }
        }
        return {
          executor: entry.executor,
          invocation: entry.invocation,
          ...(entry.crossProvider !== undefined ? { crossProvider: entry.crossProvider } : {}),
        };
      }
      throw new RunnerConfigError(`runner config (${entryLabel}) must be a non-empty string or an object {executor, invocation?, crossProvider?}.`);
    });
  }
  throw new RunnerConfigError(`runner config (${label}) must be a non-empty string (a executor id) or a non-empty array of candidates when present.`);
}

function validateInvocationShape(invocation, label, capabilityNames, executorConfinement) {
  if (!invocation || typeof invocation !== 'object' || Array.isArray(invocation)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object.`);
  }
  // `id` names this invocation within its own executor's `invocations[]` array
  // so a caller can ask for a SPECIFIC one (executor-id-consolidation, Step
  // 2.1) instead of always getting Gate B2's legacy "first via:cli" pick.
  // Optional: an executor with a single invocation, or one relying on the
  // legacy default, never needs to name any.
  if (invocation.id !== undefined && (typeof invocation.id !== 'string' || !invocation.id.trim())) {
    throw new RunnerConfigError(`runner config (${label}) "id" must be a non-empty string when present.`);
  }
  if (typeof invocation.via !== 'string' || !INVOCATION_VIA.includes(invocation.via)) {
    throw new RunnerConfigError(
      `runner config (${label}) "via" must be one of ${INVOCATION_VIA.join('/')}, got: ${JSON.stringify(invocation.via)}.`,
    );
  }
  if (invocation.via === 'cli') {
    validateExecutorShape(invocation, label);
  } else if (invocation.via === 'mcp') {
    if (typeof invocation.command !== 'string' || !invocation.command.trim()) {
      throw new RunnerConfigError(`runner config (${label}) "command" must be a non-empty string identifier when "via" is "mcp".`);
    }
    // tsk-45f D10/piece 3: an optional capability->tool map, read only by
    // `decideExecutorCli`'s MCP hand-back (D10) -- never by
    // `resolveExecutorConfig`, which still never selects an mcp invocation
    // at all (Gate B2/B3 unchanged). Each key must already be a name in
    // `cfg.capabilities`, same discipline `executor.for`/`executor.capability`
    // already carry; each value is an opaque MCP tool identifier string,
    // never validated against a live MCP server (this module has no MCP
    // client of its own, by design -- decide/execute self-execute what they
    // can and hand back what they structurally can't).
    if (invocation.tools !== undefined) {
      if (!invocation.tools || typeof invocation.tools !== 'object' || Array.isArray(invocation.tools)) {
        throw new RunnerConfigError(`runner config (${label}) "tools" must be an object mapping a capability name to an MCP tool identifier when present.`);
      }
      for (const [capabilityName, toolId] of Object.entries(invocation.tools)) {
        if (!capabilityNames.has(capabilityName)) {
          throw new RunnerConfigError(
            `runner config (${label}) "tools" key "${capabilityName}" is not declared in "capabilities" — add it there first (D4/D14/D15).`,
          );
        }
        if (typeof toolId !== 'string' || !toolId.trim()) {
          throw new RunnerConfigError(`runner config (${label}) "tools.${capabilityName}" must be a non-empty string when present.`);
        }
      }
    }
  } else if (invocation.via === 'api') {
    // D13: an 'api' invocation is shaped for `httpAdapter`, never
    // `command`/`args` — the whole point of generalizing `EXECUTOR_
    // ADAPTERS`' signature was to stop forcing a non-CLI invocation
    // through that mold ("bẫy B1"). Only `url` is required; `method`/
    // `headers`/`body` stay optional, read straight off the invocation by
    // `httpAdapter` itself at dispatch time.
    if (typeof invocation.url !== 'string' || !invocation.url.trim()) {
      throw new RunnerConfigError(`runner config (${label}) "url" must be a non-empty string when "via" is "api".`);
    }
  }
  if (invocation.interactiveMode !== undefined) {
    validateInteractiveModeShape(invocation.interactiveMode, `${label} "interactiveMode"`);
  }
  // The login store a confined invocation reads. Only a confined launch has a private home to hand it;
  // an unconfined one reads its store in place through "env".
  if (invocation.credentialStore !== undefined) {
    const problem = credentialStoreProblem(invocation.credentialStore);
    if (problem) throw new RunnerConfigError(`runner config (${label}) "credentialStore" ${problem}.`);
    if (invocation.via !== 'cli' || !(invocation.confinement ?? executorConfinement)?.backend) {
      throw new RunnerConfigError(`runner config (${label}) declares "credentialStore" without a confinement backend. A store is handed to the launch through its private home, so only a confined "cli" invocation can read one; an unconfined invocation reads its store through "env".`);
    }
  }
  // Same vocabulary as the executor-level declaration: an invocation may
  // override how the prompt reaches its worker, and both spellings are
  // checked against one list so they cannot drift apart.
  if (invocation.promptDelivery !== undefined && !PROMPT_DELIVERIES.includes(invocation.promptDelivery)) {
    throw new RunnerConfigError(
      `runner config (${label}) "promptDelivery" must be one of ${PROMPT_DELIVERIES.join('/')}, got: ${JSON.stringify(invocation.promptDelivery)}.`,
    );
  }
  if (invocation.liveOutput !== undefined) {
    if (!invocation.liveOutput || typeof invocation.liveOutput !== 'object' || Array.isArray(invocation.liveOutput)) {
      throw new RunnerConfigError(`runner config (${label}) "liveOutput" must be an object when present.`);
    }
    if (!Array.isArray(invocation.liveOutput.streamFlags) || !invocation.liveOutput.streamFlags.every((flag) => typeof flag === 'string')) {
      throw new RunnerConfigError(`runner config (${label}) "liveOutput.streamFlags" must be an array of strings when present.`);
    }
    if (typeof invocation.liveOutput.renderer !== 'string' || !invocation.liveOutput.renderer.trim()) {
      throw new RunnerConfigError(`runner config (${label}) "liveOutput.renderer" must be a non-empty string when present.`);
    }
  }
  // via: 'task' needs neither `command` nor `args` — native in-session
  // Task/Agent dispatch carries no subprocess argv at all.
}

function validateInteractiveModeShape(interactiveMode, label) {
  if (!interactiveMode || typeof interactiveMode !== 'object' || Array.isArray(interactiveMode)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object when present.`);
  }
  if (typeof interactiveMode.exitCommand !== 'string' || !interactiveMode.exitCommand.trim()) {
    throw new RunnerConfigError(`runner config (${label}) "exitCommand" must be a non-empty string when present.`);
  }
  // `kind` names which interactive agent herdr should start. The set of legal
  // kinds belongs to herdr, not here -- duplicating its list would go stale
  // silently, and herdr already refuses an unknown one by name. All this can
  // check is the shape it must have to be passed at all.
  if (interactiveMode.kind !== undefined) {
    if (typeof interactiveMode.kind !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(interactiveMode.kind)) {
      throw new RunnerConfigError(
        `runner config (${label}) "kind" must be a lowercase agent-kind name when present, got: ${JSON.stringify(interactiveMode.kind)}.`,
      );
    }
  }
  // `trustStore` is validated here rather than on the executor because here is
  // where the adapter reads it. It used to be declared at the executor level
  // with one legal kind and read from `interactiveMode` with no validation at
  // all, so the live config's `codex-toml` was simultaneously rejected by the
  // validator nobody consulted and accepted by the reader nobody checked.
  //
  // `null` is a real value: this executor needs no trust store. Only an object
  // with an unknown kind is an error.
  if (interactiveMode.trustStore !== undefined && interactiveMode.trustStore !== null) {
    const t = interactiveMode.trustStore;
    if (typeof t !== 'object' || Array.isArray(t) || !TRUST_STORE_KINDS.includes(t.kind)) {
      throw new RunnerConfigError(
        `runner config (${label}) "trustStore" must be null or an object whose "kind" is one of ${TRUST_STORE_KINDS.join('/')}.`,
      );
    }
    if (t.path !== undefined && (typeof t.path !== 'string' || !t.path.trim())) {
      throw new RunnerConfigError(`runner config (${label}) "trustStore.path" must be a non-empty string when present.`);
    }
  }

  // Four transport deadlines used to be declarable here -- readyTimeoutMs,
  // promptTimeoutMs, resendAfterMs, maxResends. They are gone. Every one was a
  // property of the herdr transport rather than of an executor: how long herdr
  // may take to bring an agent to ready, how long it may take to accept a
  // submission, how patient to be with a brief nobody acknowledged. No executor
  // ever set one, and nobody configuring an executor had any basis to pick a
  // different value. They now live as constants in `herdr-round.mjs`, next to
  // the poll interval and the exit drain, which were always constants for the
  // same reason. What is left for a person to decide is `timeoutMs` and
  // `idleTimeoutMs`: how long the WORK may take.
}

/**
 * Advisory-only, config-load-time warning: an `executors.<id>` entry that
 * declares neither `providerModel` nor `provider`, and for which
 * the dispatch policy's own pre-spawn command extraction
 * (`invocations[].find((inv) => inv.via === 'cli')?.command` — mirrored
 * here EXACTLY, since that's the only signal that call site ever reads)
 * yields no usable command, has no reliable way to name its own provider
 * family there — `deriveProviderFamily` falls straight to its `'claude'`
 * default. That's SAFE only when a genuine `via:"cli"` invocation with a
 * real command exists (`resolve.mjs`'s `resolveExecutorConfig` reads the
 * exact same signal for that shape, e.g. `codex-cli` — both call sites
 * already agree, nothing to flag). It's UNSAFE for every other shape that
 * still lacks `providerModel`/`provider`: a bare (non-`invocations[]`)
 * entry with a real non-Claude flat `.command` (resolve.mjs correctly
 * reads that bare command; the dispatch policy never does), and an
 * `invocations[]`-shaped entry with no `via:"cli"` entry at all — e.g. this
 * repo's own live `gitnexus` (`invocations: [{via:'mcp', ...}]`, MCP-only)
 * — where the dispatch policy has literally nothing to extract and
 * silently defaults to `'claude'` while other call sites resolve a
 * different (or no) provider family. Never throws — this must not break a
 * config that currently loads fine; it only recommends declaring
 * `providerModel` explicitly so every call site agrees.
 */
function warnIfProviderFamilyUnreliable(executorId, executor) {
  if (executor.providerModel !== undefined || executor.provider !== undefined) return;
  // Skip warning when every declared invocation is non-CLI (e.g. mcp-only or http-only).
  if (Array.isArray(executor.invocations) && executor.invocations.length > 0 && executor.invocations.every((inv) => inv.via !== 'cli')) {
    return;
  }
  const cliInvocationCommand = Array.isArray(executor.invocations)
    ? executor.invocations.find((inv) => inv.via === 'cli')?.command
    : undefined;
  if (typeof cliInvocationCommand === 'string' && cliInvocationCommand.trim()) return;
  // NOTE (unresolved, deliberately left as-is): warning on this shape is a
  // tested decision -- `dispatch.test.mjs`'s "gitnexus shape: mcp-only" case
  // asserts it fires exactly once and does not throw. It is also NOISY in
  // practice: `loadRunnerConfig` runs several times per dispatching process,
  // so a real advisory session prints it repeatedly for an entry that
  // `dispatch.mjs decide gitnexus` resolves `{"mechanism":"in-process",
  // "mcpTool":"mcp__gitnexus__impact"}` -- never a cli-spawn, so the
  // cross-call-site provider disagreement it warns about cannot arise on
  // that path. That observation does NOT by itself refute the reason named
  // in the test's own title (the dispatch policy has no command to extract
  // for this shape and defaults the family), so the behaviour is not
  // reversed here on one agent's judgment. Decide it deliberately: either
  // declare a truthful provider on the entry, narrow the warning to shapes
  // that can actually reach a CLI dispatch, or make it once-per-process.
  const command = executor.command;
  if (typeof command === 'string' && command.trim() && CLAUDE_CLI_COMMANDS.includes(command)) return;
  const commandDescription = typeof command === 'string' && command.trim() ? JSON.stringify(command) : 'none resolvable from its config';
  console.warn(
    `fgos: executor "${executorId}" declares no "providerModel"/"provider" and its command ` +
      `(${commandDescription}) is not a recognized Claude CLI command — its resolved provider ` +
      `family may be unreliable/inconsistent across dispatch code paths. Declare "providerModel" explicitly.`,
  );
}

/**
 * `capabilityNames` (D15, tsk-in1-4): the Set of valid `for` targets —
 * every key of `cfg.capabilities` (D4/D14) plus every declared `aliases[]`
 * entry, built once by `validateRunnerConfigShape` from the ALREADY-
 * validated `cfg.capabilities` block and threaded through here, since this
 * function has no other way to see a sibling top-level field.
 */
/** Vocabularies for the execution profile an executor may declare about itself
 * (Phase 01 group A of plans/260906-1831-dispatch-visibility-v0). Each is a
 * closed set rather than a free string for the same reason `for`/`carries`
 * already are: a typo must fail at load, where it names itself, instead of at
 * dispatch, where it looks like the agent misbehaving. */
const PERMISSION_MODES = ['ask', 'bypass'];
const PROMPT_DELIVERIES = ['file-pointer', 'inline'];
/**
 * Declarations that no longer mean anything, and why -- so a config carrying
 * one gets an answer instead of silence.
 */
const REMOVED_EXECUTOR_FIELDS = Object.freeze({
  receipt: 'It had one legal value and no reader anywhere in the repo. The rule it stood for -- a round concludes only from a file the receiver wrote -- is not configurable and never was; it is what the herdr round does unconditionally.',
   trustStore: 'Declare it on "interactiveMode" instead, which is where the adapter reads it. It used to be declared at the executor level and read from interactiveMode, so its one validated kind guarded a field nothing consulted.',
  readOnlyRedirect: 'readOnlyRedirect was retired. Read-only posture is enforced by OS confinement (Phase 6).',
 });

/** All are real: claude keeps trust in `~/.claude.json`, codex in a
 * `[projects."<abs>"]` block of its `config.toml`, and agy in `settings.json`'s
 * `trustedWorkspaces`. `codex-toml` was live in this repo's own config while
 * this list still refused it -- because the list guarded a field the adapter
 * did not read. */
const TRUST_STORE_KINDS = ['claude-json', 'codex-toml', 'agy', 'agy-json'];
const CONFINEMENT_FLAGS = ['privateHome', 'isolatedSession', 'ownWorktree'];

/**
 * The execution profile, and the one invariant binding two of its fields (C5).
 *
 * `permissionMode: 'bypass'` hands the worker an agent that will not ask before
 * acting. That is only defensible when the worker is confined, so the config door
 * refuses the combination rather than trusting a reviewer to notice it. The
 * refusal names the missing flag, because "confinement incomplete" sends a reader
 * looking through three booleans for the one that is false.
 *
 * Why a door and not a comment: on a real machine this posture was supplied by a
 * shell alias and a settings key that fgOS could not see, so nothing in any
 * executor profile described what an agent would actually do. See
 * docs/architect/agent-coordination/verification/visibility-herdr/proofs/
 *   2026-09-06-isolation/permission-posture-findings.md
 */
function validateExecutionProfileShape(executor, label) {
  if (executor.permissionMode !== undefined && !PERMISSION_MODES.includes(executor.permissionMode)) {
    throw new RunnerConfigError(
      `runner config (${label}) "permissionMode" must be one of ${PERMISSION_MODES.join('/')}, got: ${JSON.stringify(executor.permissionMode)}.`,
    );
  }
  if (executor.promptDelivery !== undefined && !PROMPT_DELIVERIES.includes(executor.promptDelivery)) {
    throw new RunnerConfigError(
      `runner config (${label}) "promptDelivery" must be one of ${PROMPT_DELIVERIES.join('/')}, got: ${JSON.stringify(executor.promptDelivery)}.`,
    );
  }
  // Fields that were removed rather than deprecated. A config still carrying
  // one is told, because the alternative -- accepting it and doing nothing --
  // is exactly the failure that got them removed: a declaration that looks
  // like a contract and is read by nobody.
  for (const [field, why] of Object.entries(REMOVED_EXECUTOR_FIELDS)) {
    if (executor[field] !== undefined) {
      throw new RunnerConfigError(`runner config (${label}) "${field}" was removed. ${why}`);
    }
  }
  if (executor.confinement !== undefined) {
    const c = executor.confinement;
    if (!c || typeof c !== 'object' || Array.isArray(c)) {
      throw new RunnerConfigError(`runner config (${label}) "confinement" must be an object when present.`);
    }
    for (const flag of CONFINEMENT_FLAGS) {
      if (c[flag] !== undefined && typeof c[flag] !== 'boolean') {
        throw new RunnerConfigError(`runner config (${label}) "confinement.${flag}" must be a boolean when present.`);
      }
    }
    if (c.backend !== undefined && (typeof c.backend !== 'string' || !c.backend.trim())) {
      throw new RunnerConfigError(`runner config (${label}) "confinement.backend" must be a non-empty string when present.`);
    }
    // Unknown keys are refused rather than ignored. `sessionName` used to be
    // accepted here and used to pick the herdr session a worker landed in --
    // which meant a config could name the operator's own cockpit, if the
    // cockpit had a name and the dispatch ran outside herdr where there is no
    // `HERDR_SESSION` to compare against. There is one worker session now and
    // it is not configurable. A config still carrying the key must be told,
    // not quietly obeyed in a way it no longer means.
    const LEGAL_CONFINEMENT_KEYS = [...CONFINEMENT_FLAGS, 'backend', 'contract', 'controls', 'grants', 'networkFilter'];
    for (const key of Object.keys(c)) {
      if (!LEGAL_CONFINEMENT_KEYS.includes(key)) {
        throw new RunnerConfigError(
          `runner config (${label}) "confinement.${key}" is not a confinement flag. Legal flags: ${CONFINEMENT_FLAGS.join(', ')}, backend.` +
          (key === 'sessionName'
            ? ' "sessionName" was removed: a worker always goes to the one fgOS worker session, so that this field can never name the operator\'s own.'
            : ''),
        );
      }
    }
  }

  // C5, the invariant. Checked after the shapes above so its message can trust
  // the values it reads.
  if (executor.permissionMode === 'bypass') {
    const c = executor.confinement ?? {};
    const hasPrivateHome = c.privateHome === true || c.controls?.home === 'private';
    const hasIsolatedSession = c.isolatedSession === true || c.controls?.session === 'isolated';
    const hasOwnWorktree = c.ownWorktree === true || c.controls?.workspace === 'own';
    if (!hasPrivateHome || !hasIsolatedSession || !hasOwnWorktree) {
      const missing = [];
      if (!hasPrivateHome) missing.push('privateHome');
      if (!hasIsolatedSession) missing.push('isolatedSession');
      if (!hasOwnWorktree) missing.push('ownWorktree');
      throw new RunnerConfigError(
        `runner config (${label}) declares "permissionMode": "bypass" without full confinement -- missing ${missing.join(', ')}. ` +
        'A worker that never asks before acting is only defensible when it is confined, so bypass requires ' +
        `${CONFINEMENT_FLAGS.join(', ')} to all be true.`,
      );
    }
  }
}

function validateExecutorEntryShape(executor, label, capabilityNames) {
  if (!executor || typeof executor !== 'object' || Array.isArray(executor)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object.`);
  }
  if (typeof executor.kind !== 'string' || !EXECUTOR_KINDS.includes(executor.kind)) {
    throw new RunnerConfigError(
      `runner config (${label}) "kind" must be one of ${EXECUTOR_KINDS.join('/')}, got: ${JSON.stringify(executor.kind)}.`,
    );
  }
  if (executor.command !== undefined || executor.args !== undefined) {
    validateExecutorShape(executor, label);
  }
  if (executor.env !== undefined) {
    validateExecutorEnvShape(executor.env, label);
  }
  if (executor.model !== undefined && (typeof executor.model !== 'string' || executor.model.length === 0)) {
    throw new RunnerConfigError(`runner config (${label}) "model" must be a non-empty string when present.`);
  }
  if (executor.allowCrossProvider !== undefined && typeof executor.allowCrossProvider !== 'boolean') {
    throw new RunnerConfigError(`runner config (${label}) "allowCrossProvider" must be a boolean when present.`);
  }
  if (executor.agentType !== undefined && (typeof executor.agentType !== 'string' || executor.agentType.length === 0)) {
    throw new RunnerConfigError(`runner config (${label}) "agentType" must be a non-empty string when present.`);
  }
  if (executor.forceCliSpawn !== undefined && typeof executor.forceCliSpawn !== 'boolean') {
    throw new RunnerConfigError(`runner config (${label}) "forceCliSpawn" must be a boolean when present.`);
  }
  // tsk-5tm-1 D1: `needs` retired (was resolveExecutorConfig's own presence
  // gate's match key, itself removed — see that function's doc comment).
  // No longer validated; a stray `needs` on a executor is now inert, never
  // rejected, since the field carries no meaning to consume it.
  //
  // D15: `for` is now a non-empty string ARRAY (was a single value) — one
  // executor can serve multiple capabilities. Each element must already be
  // a name (or alias) declared in `cfg.capabilities` — replaces the old,
  // narrower `EXECUTOR_PURPOSES` enum (retired) with the SAME curated
  // catalog a tool-registry entry's own `capability` answers to.
  //
  // `for` describes `kind: "tool"` executors only. On an agent executor it is
  // inert: an agent can do any kind of work, so the dispatch names the
  // capability (`--for`), and `resolveCapabilityDetailsFromHints` never reads
  // an agent's `for`. Config that still carries one keeps loading; `fgos
  // doctor` names it (`executor-profile-warnings`) so it can be removed.
  if (executor.for !== undefined) {
    if (!Array.isArray(executor.for) || executor.for.length === 0 || !executor.for.every((f) => typeof f === 'string' && f.trim())) {
      throw new RunnerConfigError(`runner config (${label}) "for" must be a non-empty array of non-empty strings when present.`);
    }
    for (const purpose of executor.for) {
      if (!capabilityNames.has(purpose)) {
        throw new RunnerConfigError(
          `runner config (${label}) "for" entry "${purpose}" is not declared in "capabilities" — add it there first (D4/D14/D15).`,
        );
      }
    }
  }
  // D15/tsk-5td: the content-permission layer, alongside for/needs above.
  // Optional (a executor naming no `carries` skips resolveExecutorConfig's
  // own carries gate entirely, byte-identical to every pre-D15 executor) —
  // but when present it must be one of EXECUTOR_CARRIES, never a free
  // string (D15's own "TAP GIA TRI phai khai ro" rule, same enum-not-
  // free-string treatment `for` already gets above).
  if (executor.interactiveMode !== undefined) {
    validateInteractiveModeShape(executor.interactiveMode, `${label} "interactiveMode"`);
  }
  validateExecutionProfileShape(executor, label);
  if (executor.carries !== undefined && !EXECUTOR_CARRIES.includes(executor.carries)) {
    throw new RunnerConfigError(`runner config (${label}) "carries" must be one of ${EXECUTOR_CARRIES.join('/')}, got: ${JSON.stringify(executor.carries)}.`);
  }
  if (executor.invocations !== undefined) {
    if (!Array.isArray(executor.invocations) || executor.invocations.length === 0) {
      throw new RunnerConfigError(`runner config (${label}) "invocations" must be a non-empty array when present.`);
    }
    executor.invocations.forEach((invocation, index) => {
      validateInvocationShape(invocation, `${label} invocations[${index}]`, capabilityNames, executor.confinement);
    });
    const seenInvocationIds = new Set();
    for (const invocation of executor.invocations) {
      if (invocation.id === undefined) continue;
      if (seenInvocationIds.has(invocation.id)) {
        throw new RunnerConfigError(`runner config (${label}) "invocations" declares "id": "${invocation.id}" more than once — each invocation id must be unique within one executor.`);
      }
      seenInvocationIds.add(invocation.id);
    }
  }
  // tsk-5tm-5 D9: `providerModel` names which `cfg.modelPolicies` table
  // this executor's tier resolution reads from (absent defaults to "claude").
  if (executor.providerModel !== undefined && (typeof executor.providerModel !== 'string' || !executor.providerModel.trim())) {
    throw new RunnerConfigError(`runner config (${label}) "providerModel" must be a non-empty string when present.`);
  }
  const RETIRED_RIGOR_OVERRIDES = ['rigor', 'Overrides'].join('');
  if (executor[RETIRED_RIGOR_OVERRIDES] !== undefined) {
    const provider = executor.providerModel || 'provider';
    throw new RunnerConfigError(
      `${label}.${RETIRED_RIGOR_OVERRIDES} was removed; express per-tier models in runner.modelPolicies.${provider}.`,
    );
  }
  // Phase C (executor-profile-schema-migration): `identity`/`supports` are
  // the ExecutorProfile target vocabulary (design.md §3.7, previously
  // documented-only in docs/specs/runner.md's "target vocabulary" section)
  // made real, additive config fields. Both optional -- a executor naming
  // neither resolves exactly as it did before this phase existed. No
  // resolution/dispatch code reads either field yet (this phase proves the
  // shape is expressible/resolvable, not that anything consumes it); adding
  // them is inert metadata for any executor that declares them.
  if (executor.identity !== undefined) {
    validateExecutorIdentityShape(executor.identity, `${label} "identity"`);
  }
  if (executor.supports !== undefined) {
    validateExecutorSupportsShape(executor.supports, `${label} "supports"`);
  }
}

/**
 * Shape-check `executors.<id>.identity` (Phase C, executor-profile-schema-
 * migration; design.md §3.7): "which principal/backend/trust boundary is
 * this?" -- a stable runtime boundary, never a policy choice. Unlike
 * `supports` below, `identity` is all-or-nothing when declared at all: a
 * partial identity (e.g. a `principalRef` with no `trustDomain`) does not
 * answer the question it exists to answer, so all four fields are required
 * together. None of the four is validated against a closed enum --
 * design.md's own worked example is the only vocabulary this track has
 * ever specified, not an exhaustive list -- each is checked only for
 * "non-empty string", the same floor `providerModel`/`agentType`/etc.
 * already apply elsewhere in this function.
 */
function validateExecutorIdentityShape(identity, label) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object.`);
  }
  for (const field of ['principalRef', 'runtimeBackendRef', 'trustDomain', 'egressClass']) {
    if (typeof identity[field] !== 'string' || !identity[field].trim()) {
      throw new RunnerConfigError(`runner config (${label}) "${field}" must be a non-empty string.`);
    }
  }
}

/**
 * Shape-check `executors.<id>.supports` (Phase C, executor-profile-schema-
 * migration; design.md §3.7): "what can one invocation of this profile
 * actually do?" -- a capability manifest, not identity. Every field is
 * independently optional (unlike `identity` above): a executor may declare
 * only the subset it has real evidence for.
 */
function validateExecutorSupportsShape(supports, label) {
  if (!supports || typeof supports !== 'object' || Array.isArray(supports)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object.`);
  }
  if (supports.providerFamilies !== undefined) {
    if (!Array.isArray(supports.providerFamilies) || supports.providerFamilies.length === 0 || !supports.providerFamilies.every((p) => typeof p === 'string' && p.trim())) {
      throw new RunnerConfigError(`runner config (${label}) "providerFamilies" must be a non-empty array of non-empty strings when present.`);
    }
  }
  if (supports.reasoningEffort !== undefined) {
    if (!Array.isArray(supports.reasoningEffort) || supports.reasoningEffort.length === 0 || !supports.reasoningEffort.every((e) => REASONING_EFFORT_VALUES.includes(e))) {
      throw new RunnerConfigError(`runner config (${label}) "reasoningEffort" must be a non-empty array whose entries are each one of ${REASONING_EFFORT_VALUES.join('/')} when present.`);
    }
  }
  if (supports.skills !== undefined) {
    if (!Array.isArray(supports.skills) || supports.skills.length === 0 || !supports.skills.every((skill) => typeof skill === 'string' && skill.trim())) {
      throw new RunnerConfigError(`runner config (${label}) "skills" must be a non-empty array of non-empty skill names when present.`);
    }
  }
  if (supports.systemPrompt !== undefined && typeof supports.systemPrompt !== 'boolean') {
    throw new RunnerConfigError(`runner config (${label}) "systemPrompt" must be a boolean when present.`);
  }
  if (supports.toolGating !== undefined && (typeof supports.toolGating !== 'string' || !supports.toolGating.trim())) {
    throw new RunnerConfigError(`runner config (${label}) "toolGating" must be a non-empty string when present.`);
  }
}


/**
 * Shape-check `runner.placementPolicy` (Phase D correction,
 * executor-profile-schema-migration): PlacementPolicy's own declarative
 * config surface, deliberately NOT nested on any `executors.<id>` entry.
 *
 * The first-round Phase D relocated the retired top-level
 * `runner.readOnlyExecutorRedirects.<sourceExecutorId>` map onto
 * `executors.<sourceExecutorId>.readOnlyRedirect` -- self-verified safe (zero
 * behavior change, full test gate green) but architecturally wrong: "for a
 * read-only OPERATION, which executor to substitute" is a POLICY/ranking
 * decision (design.md §3.6: "PlacementPolicy owns provider/model/executor
 * ranking"), not a fact about the source executor's own identity --
 * the exact same category of mistake as baking a persona
 * ("claude-reviewer") into an executor id, just one layer removed. Design.md
 * §7 step 9 is explicit: "Retire readOnlyExecutorRedirects only after
 * production PlacementPolicy proof" -- meaning PlacementPolicy itself must
 * own the declaration, not merely the selection algorithm among an opaque
 * pool handed to it (which Phase 08's `resolveVerifiedRedirectExecutor`
 * already did, unchanged by this correction).
/**
 * Shape-check `runner.placementPolicy`: retired in Phase 6.
 */
function validatePlacementPolicyShape(placementPolicy, label) {
  if (placementPolicy !== undefined) {
    throw new RunnerConfigError(`runner config (${label}) "placementPolicy" was retired. Posture is enforced via OS confinement.`);
  }
}
/**
 * tool-registry entry (`toolsFromExecutors`, `src/state/tool-registry.mjs`)
 * and `executors.<id>.for` (a executor's declared purpose, D15 — its own
 * validation against this catalog is a later task's scope, not this one's).
 * An object mapping an arbitrary capability name to `{description?,
 * aliases?}` — both fields optional (a bare `{}` entry is valid, naming
 * only the key itself). `description` inherits the free-text
 * `description`/`responsibility` spirit the old tool-registry provider
 * shape carried; `aliases` (a string array, when present) names other
 * spellings that resolve to this same catalog entry, distinct from
 * `normalizeCapability`'s own automatic kebab-case folding (which handles
 * spelling/casing variance of the SAME name, not a genuinely different
 * alias name).
 */

// `serves` (core/skills/_shared/capability-matching.md): a capability entry's
// own machine-readable demand promise.
// Entry with no `serves` stays valid (still selectable by explicit name)
// -- an old config predating this key must keep loading.
const CAPABILITY_SERVES_BOOLEAN_KEYS = Object.freeze([
  'mutates',
  'behaviorPreserving',
  'needsIndependentReview',
  'hasPlanOrTrack',
]);
const CAPABILITY_SERVES_KEYS = Object.freeze(['outputKind', 'domain', ...CAPABILITY_SERVES_BOOLEAN_KEYS]);

export function validateCapabilityServesShape(serves, label) {
  if (!serves || typeof serves !== 'object' || Array.isArray(serves)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping a serves attribute -> a scalar or array value when present.`);
  }
  for (const [key, rawValue] of Object.entries(serves)) {
    if (!CAPABILITY_SERVES_KEYS.includes(key)) {
      throw new RunnerConfigError(`runner config (${label}) key "${key}" is not one of ${CAPABILITY_SERVES_KEYS.join('/')}.`);
    }
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    if (values.length === 0) {
      throw new RunnerConfigError(`runner config (${label}."${key}") must be a non-empty scalar or array value.`);
    }
    if (CAPABILITY_SERVES_BOOLEAN_KEYS.includes(key)) {
      if (!values.every((value) => typeof value === 'boolean')) {
        throw new RunnerConfigError(`runner config (${label}."${key}") must be a boolean, or an array of booleans, when present.`);
      }
    } else if (!values.every((value) => typeof value === 'string' && value.trim())) {
      throw new RunnerConfigError(`runner config (${label}."${key}") must be a non-empty string, or an array of non-empty strings, when present.`);
    }
  }
}

function validateTierName(value, label) {
  if (!MODEL_POLICY_TIERS.includes(value)) {
    throw new RunnerConfigError(`runner config (${label}) must be one of ${MODEL_POLICY_TIERS.join('/')}, got: ${JSON.stringify(value)}.`);
  }
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

/**
 * `roles`, `personas` and `seats` of a capability entry: a map from a key of the given kind to
 * `{tier?, prefer?}`. `keyProblem` returns true for a good key, else a phrase saying what a good one is.
 */
function validateSeatTasteMap(map, label, kind, keyProblem) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping a ${kind} -> {tier?, prefer?} when present.`);
  }
  for (const [key, taste] of Object.entries(map)) {
    const keyLabel = `${label}.${key}`;
    const verdict = keyProblem(key);
    if (verdict !== true) throw new RunnerConfigError(`runner config (${label}) key ${JSON.stringify(key)} must be ${verdict}.`);
    if (!taste || typeof taste !== 'object' || Array.isArray(taste)) {
      throw new RunnerConfigError(`runner config (${keyLabel}) must be an object {tier?, prefer?}.`);
    }
    for (const field of Object.keys(taste)) {
      if (field !== 'tier' && field !== 'prefer') {
        throw new RunnerConfigError(`runner config (${keyLabel}) contains unknown key "${field}". Allowed keys: tier, prefer.`);
      }
    }
    if (taste.tier !== undefined) validateTierName(taste.tier, `${keyLabel} "tier"`);
    if (taste.prefer !== undefined) normalizePreferCandidates(taste.prefer, `${keyLabel} "prefer"`);
  }
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

function validateCapabilitiesShape(capabilities, label) {
  if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping a capability name -> {description?, aliases?, prefer?, overrides?, confinement?, serves?} when present.`);
  }
  for (const [name, entry] of Object.entries(capabilities)) {
    const entryLabel = `${label}.${name}`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new RunnerConfigError(`runner config (${entryLabel}) must be an object.`);
    }
    if (entry.description !== undefined && (typeof entry.description !== 'string' || !entry.description.trim())) {
      throw new RunnerConfigError(`runner config (${entryLabel}) "description" must be a non-empty string when present.`);
    }
    if (entry.aliases !== undefined) {
      if (!Array.isArray(entry.aliases) || !entry.aliases.every((alias) => typeof alias === 'string' && alias.trim())) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "aliases" must be an array of non-empty strings when present.`);
      }
    }
    if (entry.prefer !== undefined) {
      normalizePreferCandidates(entry.prefer, `${entryLabel} "prefer"`);
    }
    if (entry.overrides !== undefined) {
      throw new RunnerConfigError(
        `capabilities.${name}.overrides was removed; use "capabilities.${name}.rigor" for floor rigor or configure executors directly.`,
      );
    }
    if (entry.rigor !== undefined) {
      if (!RIGOR_VALUES.includes(entry.rigor)) {
        throw new RunnerConfigError(
          `runner config (${entryLabel}) "rigor" must be one of ${RIGOR_VALUES.join('/')}, got: ${JSON.stringify(entry.rigor)}.`,
        );
      }
    }
    if (entry.persona !== undefined) {
      if (typeof entry.persona !== 'string' || !entry.persona.trim()) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "persona" must be a non-empty string when present.`);
      }
    }
    if (entry.minCheckers !== undefined) {
      if (!Array.isArray(entry.minCheckers) || !entry.minCheckers.every((c) => VALID_CHECKER_SEATS.has(c))) {
        throw new RunnerConfigError(
          `runner config (${entryLabel}) "minCheckers" must be an array of strings in [${Array.from(VALID_CHECKER_SEATS).join(', ')}] when present.`,
        );
      }
    }
    if (entry.verify !== undefined) {
      if (typeof entry.verify !== 'string' || !entry.verify.trim()) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "verify" must be a non-empty string command when present.`);
      }
    }
    if (entry.serves !== undefined) {
      validateCapabilityServesShape(entry.serves, `${entryLabel}.serves`);
    }
    if (entry.tier !== undefined) validateTierName(entry.tier, `${entryLabel} "tier"`);
    if (entry.maxTier !== undefined) validateTierName(entry.maxTier, `${entryLabel} "maxTier"`);
    if (entry.roles !== undefined) validateSeatTasteMap(entry.roles, `${entryLabel}.roles`, 'role', (key) => SEAT_ROLES.includes(key) || `one of ${SEAT_ROLES.join('/')}`);
    if (entry.personas !== undefined) validateSeatTasteMap(entry.personas, `${entryLabel}.personas`, 'persona', personaNameProblem);
    if (entry.seats !== undefined) validateSeatTasteMap(entry.seats, `${entryLabel}.seats`, 'seat', (key) => isSeatId(key) || 'a seat id (a lowercase letter, then lowercase letters, digits or "-"; not a reserved name)');
    const ALLOWED_CAPABILITY_ENTRY_KEYS = ['description', 'aliases', 'prefer', 'rigor', 'confinement', 'serves', 'persona', 'minCheckers', 'verify', ...SEAT_BINDING_CAPABILITY_KEYS];
    for (const key of Object.keys(entry)) {
      if (!ALLOWED_CAPABILITY_ENTRY_KEYS.includes(key)) {
        if (key === 'unconfined') {
          throw new RunnerConfigError(
            `runner config (${entryLabel}) boolean "unconfined" is deprecated/disallowed; use "confinement: { mode: 'unconfined' }" instead.`,
          );
        }
        throw new RunnerConfigError(
          `runner config (${entryLabel}) contains unknown key "${key}". Allowed keys: ${ALLOWED_CAPABILITY_ENTRY_KEYS.join(', ')}.`,
        );
      }
    }
    if (entry.confinement !== undefined) {
      validateCapabilityConfinementShape(entry.confinement, `${entryLabel}.confinement`);
    }
  }
}

export { CHECKER_SEATS };

export const VALID_CHECKER_SEATS = Object.freeze(new Set(Object.keys(CHECKER_SEATS)));

export function validateRunnerPatternsShape(patterns, label) {
  if (!patterns || typeof patterns !== 'object' || Array.isArray(patterns)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object when present.`);
  }

  // Schema marker
  if (patterns.seatBinding !== undefined) {
    const marker = patterns.seatBinding;
    if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
      throw new RunnerConfigError(`runner config (${label}.seatBinding) must be an object {schema: ${SEAT_BINDING_SCHEMA_VERSION}}.`);
    }
    for (const key of Object.keys(marker)) {
      if (key !== 'schema') {
        throw new RunnerConfigError(`runner config (${label}.seatBinding) contains unknown key "${key}". Allowed keys: schema.`);
      }
    }
    if (!READABLE_SEAT_BINDING_SCHEMA_VERSIONS.has(marker.schema)) {
      throw new RunnerConfigError(
        `runner config (${label}.seatBinding.schema) must be one of [${Array.from(READABLE_SEAT_BINDING_SCHEMA_VERSIONS).join(', ')}], got: ${JSON.stringify(marker.schema)}.`,
      );
    }
  }

  // Retired keys
  if (patterns.defaultRule !== undefined) {
    throw new RunnerConfigError(
      `runner config (${label}.defaultRule) was retired; delete the key.`,
      { code: 'config-key-retired' },
    );
  }
  if (patterns['research-fan-out-gated'] !== undefined) {
    throw new RunnerConfigError(
      `runner config (${label}.research-fan-out-gated) was retired; use runner.patterns.research-fan-out instead.`,
      { code: 'config-key-retired' },
    );
  }

  const RESERVED_PATTERN_NAMES = new Set(['seatBinding', 'defaultRule']);

  for (const [name, entry] of Object.entries(patterns)) {
    if (name === 'seatBinding') continue;

    if (name === 'reviewed') {
      const hasTuning = entry && typeof entry === 'object' && !Array.isArray(entry) && ('maxRounds' in entry || 'checkersByRigor' in entry);
      const hasCatalog = entry && typeof entry === 'object' && !Array.isArray(entry) && ('loop' in entry || 'defaults' in entry || 'promise' in entry || 'invariants' in entry);
      if (hasTuning && hasCatalog) {
        throw new RunnerConfigError(
          `runner config (${label}.reviewed) cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.reviewed.`,
        );
      }
      if (hasTuning && !hasCatalog) {
        throw new RunnerConfigError(
          `runner config (${label}.reviewed) was retired; use runner.loops.reviewed instead.`,
          { code: 'config-key-retired' },
        );
      }
    }

    if (RESERVED_PATTERN_NAMES.has(name)) {
      throw new RunnerConfigError(`runner config (${label}.${name}) uses reserved name "${name}" as a pattern name.`);
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new RunnerConfigError(`runner config (${label}.${name}) must be an object.`);
    }

    const ALLOWED_ENTRY_KEYS = ['promise', 'loop', 'defaults', 'invariants'];
    for (const key of Object.keys(entry)) {
      if (!ALLOWED_ENTRY_KEYS.includes(key)) {
        throw new RunnerConfigError(
          `runner config (${label}.${name}) contains unknown key "${key}". Allowed keys: ${ALLOWED_ENTRY_KEYS.join(', ')}.`,
        );
      }
    }

    if (entry.promise !== undefined && (typeof entry.promise !== 'string' || !entry.promise.trim())) {
      throw new RunnerConfigError(`runner config (${label}.${name}.promise) must be a non-empty string when present.`);
    }

    if (entry.loop !== undefined) {
      if (!LOOP_NAMES.includes(entry.loop)) {
        throw new RunnerConfigError(
          `runner config (${label}.${name}.loop) must be one of ${LOOP_NAMES.join('/')}, got: ${JSON.stringify(entry.loop)}.`,
        );
      }
    }

    if (entry.defaults !== undefined) {
      if (!entry.defaults || typeof entry.defaults !== 'object' || Array.isArray(entry.defaults)) {
        throw new RunnerConfigError(`runner config (${label}.${name}.defaults) must be an object when present.`);
      }
      const ALLOWED_DEFAULT_KEYS = ['maxRounds', 'minCheckers', 'seats', 'roleTasks', 'rebuttal'];
      for (const dKey of Object.keys(entry.defaults)) {
        if (!ALLOWED_DEFAULT_KEYS.includes(dKey)) {
          throw new RunnerConfigError(
            `runner config (${label}.${name}.defaults) contains unknown key "${dKey}". Allowed keys: ${ALLOWED_DEFAULT_KEYS.join(', ')}.`,
          );
        }
      }
      if (entry.defaults.maxRounds !== undefined) {
        if (!Number.isInteger(entry.defaults.maxRounds) || entry.defaults.maxRounds <= 0) {
          throw new RunnerConfigError(`runner config (${label}.${name}.defaults.maxRounds) must be a positive integer.`);
        }
      }
      if (entry.defaults.minCheckers !== undefined) {
        if (!Array.isArray(entry.defaults.minCheckers) || !entry.defaults.minCheckers.every((c) => VALID_CHECKER_SEATS.has(c))) {
          throw new RunnerConfigError(
            `runner config (${label}.${name}.defaults.minCheckers) must be an array of strings in [${Array.from(VALID_CHECKER_SEATS).join(', ')}].`,
          );
        }
      }
      if (entry.defaults.seats !== undefined) {
        if (!Array.isArray(entry.defaults.seats)) {
          throw new RunnerConfigError(`runner config (${label}.${name}.defaults.seats) must be an array.`);
        }
        try {
          checkDeclaredSeats(entry.defaults.seats, `${label}.${name}.defaults.seats`);
        } catch (err) {
          throw new RunnerConfigError(err.message);
        }
      }
      if (entry.defaults.roleTasks !== undefined) {
        if (!entry.defaults.roleTasks || typeof entry.defaults.roleTasks !== 'object' || Array.isArray(entry.defaults.roleTasks)) {
          throw new RunnerConfigError(`runner config (${label}.${name}.defaults.roleTasks) must be an object.`);
        }
        for (const [k, v] of Object.entries(entry.defaults.roleTasks)) {
          if (typeof v !== 'string' || !v.trim()) {
            throw new RunnerConfigError(`runner config (${label}.${name}.defaults.roleTasks.${k}) must be a non-empty string.`);
          }
        }
      }
      if (entry.defaults.rebuttal !== undefined && typeof entry.defaults.rebuttal !== 'boolean') {
        throw new RunnerConfigError(`runner config (${label}.${name}.defaults.rebuttal) must be a boolean.`);
      }
    }

    if (entry.invariants !== undefined) {
      if (!entry.invariants || typeof entry.invariants !== 'object' || Array.isArray(entry.invariants)) {
        throw new RunnerConfigError(`runner config (${label}.${name}.invariants) must be an object when present.`);
      }
      for (const [param, inv] of Object.entries(entry.invariants)) {
        const invLabel = `${label}.${name}.invariants.${param}`;
        if (!inv || typeof inv !== 'object' || Array.isArray(inv)) {
          throw new RunnerConfigError(`runner config (${invLabel}) must be an object.`);
        }
        const hasAtLeast = inv.atLeast !== undefined;
        const hasFixed = inv.fixed !== undefined;
        if ((hasAtLeast && hasFixed) || (!hasAtLeast && !hasFixed)) {
          throw new RunnerConfigError(`runner config (${invLabel}) must declare exactly one of "atLeast" or "fixed".`);
        }
        const ALLOWED_INV_KEYS = ['atLeast', 'fixed'];
        for (const k of Object.keys(inv)) {
          if (!ALLOWED_INV_KEYS.includes(k)) {
            throw new RunnerConfigError(`runner config (${invLabel}) contains unknown key "${k}". Allowed keys: atLeast, fixed.`);
          }
        }
        if (hasAtLeast) {
          if (!Array.isArray(inv.atLeast) || !inv.atLeast.every((item) => typeof item === 'string' && item.trim())) {
            throw new RunnerConfigError(`runner config (${invLabel}.atLeast) must be an array of non-empty strings.`);
          }
        }
      }
    }
  }
}

export function validateRunnerLoopsShape(loops, label) {
  if (!loops || typeof loops !== 'object' || Array.isArray(loops)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object when present.`);
  }

  for (const [loopName, loopEntry] of Object.entries(loops)) {
    if (!LOOP_NAMES.includes(loopName)) {
      throw new RunnerConfigError(
        `runner config (${label}) contains unknown loop "${loopName}". Allowed loops: ${LOOP_NAMES.join(', ')}.`,
      );
    }
    if (!loopEntry || typeof loopEntry !== 'object' || Array.isArray(loopEntry)) {
      throw new RunnerConfigError(`runner config (${label}.${loopName}) must be an object.`);
    }

    const allowedKeys = loopName === 'reviewed' ? ['maxRounds', 'checkersByRigor', 'bounds'] : ['bounds'];
    for (const key of Object.keys(loopEntry)) {
      if (!allowedKeys.includes(key)) {
        throw new RunnerConfigError(
          `runner config (${label}.${loopName}) contains unknown key "${key}". Allowed keys: ${allowedKeys.join(', ')}.`,
        );
      }
    }

    if (loopName === 'reviewed') {
      if (loopEntry.maxRounds !== undefined) {
        const maxRounds = loopEntry.maxRounds;
        if (!Number.isInteger(maxRounds) || maxRounds <= 0) {
          throw new RunnerConfigError(`runner config (${label}.reviewed.maxRounds) must be a positive integer.`);
        }
      }
      if (loopEntry.checkersByRigor !== undefined) {
        const cbr = loopEntry.checkersByRigor;
        if (!cbr || typeof cbr !== 'object' || Array.isArray(cbr)) {
          throw new RunnerConfigError(`runner config (${label}.reviewed.checkersByRigor) must be an object.`);
        }
        for (const [rigor, checkers] of Object.entries(cbr)) {
          if (!RIGOR_VALUES.includes(rigor)) {
            throw new RunnerConfigError(`runner config (${label}.reviewed.checkersByRigor) contains unknown rigor "${rigor}".`);
          }
          if (!Array.isArray(checkers) || !checkers.every((c) => VALID_CHECKER_SEATS.has(c))) {
            throw new RunnerConfigError(
              `runner config (${label}.reviewed.checkersByRigor.${rigor}) must be an array of strings in [${Array.from(VALID_CHECKER_SEATS).join(', ')}].`,
            );
          }
        }
        const orderedRigors = ['low', 'standard', 'high', 'critical'].filter((r) => r in cbr);
        for (let i = 1; i < orderedRigors.length; i += 1) {
          const weaker = orderedRigors[i - 1];
          const stronger = orderedRigors[i];
          const weakerSet = new Set(cbr[weaker]);
          const strongerSet = new Set(cbr[stronger]);
          for (const checker of weakerSet) {
            if (!strongerSet.has(checker)) {
              throw new RunnerConfigError(
                `runner config (${label}.reviewed.checkersByRigor) is not cumulative: "${stronger}" does not include checker "${checker}" from weaker rigor "${weaker}".`,
              );
            }
          }
        }
      }
    }

    if (loopEntry.bounds !== undefined) {
      const bounds = loopEntry.bounds;
      if (!bounds || typeof bounds !== 'object' || Array.isArray(bounds)) {
        throw new RunnerConfigError(`runner config (${label}.${loopName}.bounds) must be an object.`);
      }
      const loopReadableParams = loopName === 'reviewed' ? ['maxRounds'] : [];
      for (const [param, bound] of Object.entries(bounds)) {
        if (!loopReadableParams.includes(param)) {
          throw new RunnerConfigError(
            `runner config (${label}.${loopName}.bounds.${param}) is not a parameter read by the "${loopName}" loop.`,
          );
        }
        if (!bound || typeof bound !== 'object' || Array.isArray(bound)) {
          throw new RunnerConfigError(`runner config (${label}.${loopName}.bounds.${param}) must be an object {min?, max?}.`);
        }
        const ALLOWED_BOUND_KEYS = ['min', 'max'];
        for (const k of Object.keys(bound)) {
          if (!ALLOWED_BOUND_KEYS.includes(k)) {
            throw new RunnerConfigError(
              `runner config (${label}.${loopName}.bounds.${param}) contains unknown key "${k}". Allowed keys: min, max.`,
            );
          }
        }
        if (bound.min !== undefined && !Number.isInteger(bound.min)) {
          throw new RunnerConfigError(`runner config (${label}.${loopName}.bounds.${param}.min) must be an integer.`);
        }
        if (bound.max !== undefined && !Number.isInteger(bound.max)) {
          throw new RunnerConfigError(`runner config (${label}.${loopName}.bounds.${param}.max) must be an integer.`);
        }
        if (bound.min !== undefined && bound.max !== undefined && bound.min > bound.max) {
          throw new RunnerConfigError(
            `runner config (${label}.${loopName}.bounds.${param}) min (${bound.min}) must be <= max (${bound.max}).`,
          );
        }
      }
    }
  }
}

/**
 * Shape-check `cfg.modelPolicies` (tsk-5tm-5 D9): an object mapping an
 * arbitrary provider name (`"claude"`, `"gemini"`, ...) to a tier map,
 * each tier map's keys drawn from `MODEL_POLICY_TIERS` and values tier
 * cells: a model, `model@pool`, a `{model, pool?, effort?}` object, or a non-empty list of those (`parseTierCell`). Partial coverage (a provider naming fewer
 * than all 6 tiers) is valid at load time, same lenient-at-load/strict-
 * at-bind philosophy — a missing tier is refused (`tier-cell-missing`) only once
 * a seat actually asks for it.
 */
function validateModelPoliciesShape(modelPolicies, label) {
  if (!modelPolicies || typeof modelPolicies !== 'object' || Array.isArray(modelPolicies)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping provider -> tier -> model when present.`);
  }
  for (const [providerModel, tierMap] of Object.entries(modelPolicies)) {
    if (!tierMap || typeof tierMap !== 'object' || Array.isArray(tierMap)) {
      throw new RunnerConfigError(`runner config (${label}.${providerModel}) must be an object mapping policy tier -> model.`);
    }
    for (const [policyTier, model] of Object.entries(tierMap)) {
      if (!MODEL_POLICY_TIERS.includes(policyTier)) {
        throw new RunnerConfigError(
          `runner config (${label}.${providerModel}) tier key must be one of ${MODEL_POLICY_TIERS.join('/')}, got: ${JSON.stringify(policyTier)}.`,
        );
      }
      try {
        parseTierCell(model, providerModel);
      } catch (err) {
        throw new RunnerConfigError(
          `runner config (${label}.${providerModel}.${policyTier}) must be a model, "model@pool", a {model, pool?, effort?} object, or a non-empty list of those: ${err.message}.`,
        );
      }
    }
  }
}

/**
 * Shape-check `cfg.tierFallback`: a tier -> ordered list of families (`modelPolicies` keys) a seat walks
 * after a failure. The shape is checked at load; whether a listed family has a cell at that tier, or an
 * executor, is a doctor warning, because the walk skips such a family and records it.
 */
function validateTierFallbackShape(tierFallback, label) {
  if (!tierFallback || typeof tierFallback !== 'object' || Array.isArray(tierFallback)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping tier -> list of families when present.`);
  }
  for (const [tier, families] of Object.entries(tierFallback)) {
    if (!MODEL_POLICY_TIERS.includes(tier)) {
      throw new RunnerConfigError(
        `runner config (${label}) tier key must be one of ${MODEL_POLICY_TIERS.join('/')}, got: ${JSON.stringify(tier)}.`,
      );
    }
    if (!Array.isArray(families) || families.length === 0) {
      throw new RunnerConfigError(`runner config (${label}.${tier}) must be a non-empty list of family names.`);
    }
    const seen = new Set();
    for (const family of families) {
      if (typeof family !== 'string' || !family.trim()) {
        throw new RunnerConfigError(`runner config (${label}.${tier}) holds ${JSON.stringify(family)}; each entry must be a non-empty family name.`);
      }
      if (seen.has(family)) {
        throw new RunnerConfigError(`runner config (${label}.${tier}) lists family "${family}" more than once.`);
      }
      seen.add(family);
    }
  }
}

/** `runner.defaults`: the system default a seat runs at when nothing else names a tier. */
function validateRunnerDefaultsShape(defaults, label) {
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object when present.`);
  }
  for (const key of Object.keys(defaults)) {
    if (key !== 'tier') throw new RunnerConfigError(`runner config (${label}) contains unknown key "${key}". Allowed keys: tier.`);
  }
  if (defaults.tier !== undefined) validateTierName(defaults.tier, `${label}.tier`);
}

/**
 * Pure query (Phase 00 R8): does `cfg.modelPolicies.<providerModel>` declare
 * `policyTier`? No I/O, no credential probing, no "is the executable on
 * PATH" check — a provider table naming fewer than all 5
 * `MODEL_POLICY_TIERS` (valid per `validateModelPoliciesShape` above) simply
 * answers `false` for the tiers it omits. Available to a future
 * Cohort-Planner-facing caller that needs to exclude an executor for an
 * activity's tier floor without a refusal. A cell
 * declares the tier when it parses to at least one entry, served by any pool.
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

const GENERATED_PATH_KEYS = ['from', 'also'];

/**
 * Shape of runner.generatedPaths. `from` must open with a literal directory (a bare `**` or a
 * leading glob would widen every unit's scope); every entry must read as a write-scope entry.
 */
export function validateGeneratedPathsShape(generatedPaths, label) {
  if (!Array.isArray(generatedPaths)) {
    throw new RunnerConfigError(`runner config (${label}) generatedPaths must be an array of {from, also} entries.`);
  }
  generatedPaths.forEach((entry, i) => {
    const at = label;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new RunnerConfigError(`runner config (${at}) generatedPaths[${i}] must be an object {from, also}.`);
    }
    for (const key of Object.keys(entry)) {
      if (!GENERATED_PATH_KEYS.includes(key)) {
        throw new RunnerConfigError(`runner config (${at}) generatedPaths[${i}] contains unknown key "${key}". Allowed keys: ${GENERATED_PATH_KEYS.join(', ')}.`);
      }
    }
    let from;
    try {
      from = canonicalizeWriteEntry(entry.from);
    } catch (err) {
      throw new RunnerConfigError(`runner config (${at}) generatedPaths[${i}].from: ${err.message}`);
    }
    if (from.split('/')[0].includes('*')) {
      throw new RunnerConfigError(`runner config (${at}) generatedPaths[${i}].from must start with a literal directory, got ${JSON.stringify(entry.from)}.`);
    }
    if (!Array.isArray(entry.also) || entry.also.length === 0) {
      throw new RunnerConfigError(`runner config (${at}) generatedPaths[${i}].also must be a non-empty array of write-scope entries.`);
    }
    entry.also.forEach((also, j) => {
      try {
        canonicalizeWriteEntry(also);
      } catch (err) {
        throw new RunnerConfigError(`runner config (${at}) generatedPaths[${i}].also[${j}]: ${err.message}`);
      }
    });
  });
}

function validateRunnerConfigShape(cfg, sourceLabel) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must be an object.`);
  }
  if (cfg.readOnlyExecutorRedirects !== undefined || cfg?.placementPolicy !== undefined) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) "readOnlyExecutorRedirects" / "placementPolicy" was removed. Read-only posture is enforced by OS confinement.`,
    );
  }
  if (cfg.placementPolicy !== undefined) {
    validatePlacementPolicyShape(cfg.placementPolicy, `${sourceLabel} placementPolicy`);
  }
  // The default executor is optional: none set and no assistant CLI on PATH still loads, so a caller
  // that names its executor runs; resolving the default refuses where it is used (resolveExecutorConfig).
  if (cfg.executor !== undefined) validateExecutorShape(cfg.executor, `${sourceLabel} executor`);
  // OPTIONAL cfg.capabilities catalog (D4/D14, tsk-in1-3): additive, same
  // style as `executors` below — absent keeps today's behavior byte-
  // identical. Deliberately a DIFFERENT field from `executors` (D3 kept
  // that name for the executor registry) — `capabilities` is the curated
  // catalog of WHAT a executor can promise, `executors` is the registry
  // of HOW one is actually implemented. Validated FIRST, ahead of
  // `executors` below (tsk-in1-4 D15): a executor's own `for` array
  // validates against this catalog's names, so the catalog itself must
  // already be known-good before any `executors` entry can check against
  // it — `capabilityNames` is built here once and threaded through.
  const capabilityNames = new Set();
  if (cfg.capabilities !== undefined) {
    validateCapabilitiesShape(cfg.capabilities, `${sourceLabel} capabilities`);
    for (const [name, entry] of Object.entries(cfg.capabilities)) {
      capabilityNames.add(name);
      for (const alias of entry.aliases ?? []) capabilityNames.add(alias);
    }
  }
  // OPTIONAL cfg.executors.<executorId> map (D1, tsk-62v): additive, same
  // style as `executors` above — absent keeps today's behavior byte-
  // identical.
  if (cfg.executors !== undefined) {
    if (!cfg.executors || typeof cfg.executors !== 'object' || Array.isArray(cfg.executors)) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "executors" must be an object mapping executorId -> executor entry when present.`);
    }
    for (const [executorId, executor] of Object.entries(cfg.executors)) {
      validateExecutorEntryShape(executor, `${sourceLabel} executors.${executorId}`, capabilityNames);
      warnIfProviderFamilyUnreliable(executorId, executor);
    }
  }
  // `prefer` names a real executor (D5, docs/history/capability-capacity-
  // remodel/CONTEXT.md, supersedes D2's own "for"-symmetry requirement —
  // the reverse check forced a second config edit per wiring decision
  // without a proportional safety benefit). Checked here, AFTER both
  // `capabilities` and `executors` are individually known-good — a
  // capability's own shape and a executor's own shape can each be
  // malformed independently, and this cross-check should never be the
  // first (confusing) error a caller sees for an unrelated shape mistake.
  // Catches a typo'd `prefer` at config-load time, ahead of
  // `resolveExecutorAndOverrides`'s own resolve-time throw for a `cfg`
  // built by hand (e.g. in a test) without going through this loader at
  // all.
  if (cfg.capabilities !== undefined) {
    for (const [name, entry] of Object.entries(cfg.capabilities)) {
      for (const site of preferSitesOf(entry, `${sourceLabel} capabilities.${name}`)) {
        const siteName = site.label.slice(0, site.label.lastIndexOf(' "prefer"'));
        for (const candidate of normalizePreferCandidates(site.prefer, site.label)) {
          const candidateExecutor = cfg.executors?.[candidate.executor];
          if (!candidateExecutor) {
            throw new RunnerConfigError(
              `runner config (${siteName}) "prefer" names "${candidate.executor}" but no such executor is registered.`,
            );
          }
          if (candidate.invocation !== undefined) {
            const invocations = Array.isArray(candidateExecutor.invocations) ? candidateExecutor.invocations : [];
            if (!invocations.some((inv) => inv.id === candidate.invocation)) {
              throw new RunnerConfigError(
                `runner config (${siteName}) "prefer" names invocation "${candidate.invocation}" on executor "${candidate.executor}" but no such invocation id is declared on it.`,
              );
            }
          }
        }
      }
    }
  }
  if ('models' in cfg) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) declares retired "models" map; use "modelPolicies.<provider>.<tier>" instead.`,
    );
  }
  if (!cfg.modelPolicies || typeof cfg.modelPolicies !== 'object' || Array.isArray(cfg.modelPolicies)) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) must declare a "modelPolicies" object mapping provider -> tier -> model.`,
    );
  }
  validateModelPoliciesShape(cfg.modelPolicies, `${sourceLabel} modelPolicies`);
  if (cfg.tierFallback !== undefined) validateTierFallbackShape(cfg.tierFallback, `${sourceLabel} tierFallback`);
  if (cfg.maxTier !== undefined) validateTierName(cfg.maxTier, `${sourceLabel} maxTier`);
  if (cfg.defaults !== undefined) validateRunnerDefaultsShape(cfg.defaults, `${sourceLabel} defaults`);
  if ('rigorToTier' in cfg) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) declares retired "rigorToTier": rigor no longer chooses a tier; delete the key and declare "tier" per capability, role, persona or seat.`,
    );
  }
  validateProviderAccountInventory(cfg, sourceLabel);
  if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must declare a positive numeric "timeoutMs".`);
  }
  // The default run timeout obeys the same ceiling as one run's own: the confinement reaper keeps a
  // live run's private home only up to it.
  if (cfg.timeoutMs > RUN_TIMEOUT_MAX_MS) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) "timeoutMs" must be at most ${RUN_TIMEOUT_MAX_MS / 3600000}h, got ${cfg.timeoutMs}ms.`);
  }
  // OPTIONAL `idleTimeoutMs` (dispatch-execute optimization pass): absent
  // entirely keeps `cliSpawnAdapter`'s idle-timeout disarmed, byte-identical
  // to before this field existed — same additive-optional shape as
  // `parallel` below. When present, kills a worker that has gone
  // completely silent for this long, distinct from `timeoutMs`'s
  // unconditional absolute ceiling.
  if (cfg.idleTimeoutMs !== undefined) {
    if (typeof cfg.idleTimeoutMs !== 'number' || !Number.isFinite(cfg.idleTimeoutMs) || cfg.idleTimeoutMs <= 0) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "idleTimeoutMs" must be a positive number when present.`);
    }
  }
  // OPTIONAL `parallel` block (fan-out-parallel D10) — validated the same
  // additive-optional way every field above is: absent entirely is fine (the
  // runner falls back to in-code defaults), but when present it must be an
  // object whose `maxRoots`/`maxLeavesPerRoot`, if given, are positive
  // integers. This keeps every existing runner config valid untouched.
  if (cfg.parallel !== undefined) {
    if (!cfg.parallel || typeof cfg.parallel !== 'object' || Array.isArray(cfg.parallel)) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "parallel" must be an object when present.`);
    }
    for (const key of ['maxRoots', 'maxLeavesPerRoot']) {
      const value = cfg.parallel[key];
      if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
        throw new RunnerConfigError(`runner config (${sourceLabel}) "parallel.${key}" must be a positive integer when present.`);
      }
    }
  }
  if (cfg.patterns !== undefined) {
    validateRunnerPatternsShape(cfg.patterns, `${sourceLabel} patterns`);
  }
  if (cfg.loops !== undefined) {
    validateRunnerLoopsShape(cfg.loops, `${sourceLabel} loops`);
  }
  if (cfg.generatedPaths !== undefined) {
    validateGeneratedPathsShape(cfg.generatedPaths, sourceLabel);
  }

  // Phase 01 R1/R5: Project config cannot define or override machine backend instances.
  rejectProjectBackendOverride(cfg, sourceLabel);

  // Phase 01 R1: Capability-level and runner-level confinement validation.
  if (cfg.confinement !== undefined) {
    if (!cfg.confinement || typeof cfg.confinement !== 'object' || Array.isArray(cfg.confinement)) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "confinement" must be an object when present.`);
    }
    const ALLOWED_CONFINEMENT_KEYS = ['strict'];
    for (const k of Object.keys(cfg.confinement)) {
      if (!ALLOWED_CONFINEMENT_KEYS.includes(k)) {
        throw new RunnerConfigError(
          `runner config (${sourceLabel}.confinement) contains unknown key "${k}". Allowed keys: ${ALLOWED_CONFINEMENT_KEYS.join(', ')}.`,
        );
      }
    }
    if (cfg.confinement.strict !== undefined && typeof cfg.confinement.strict !== 'boolean') {
      throw new RunnerConfigError(`runner config (${sourceLabel}.confinement) "strict" must be a boolean when present.`);
    }
  }

  // Phase 01 R3: Custom confinementPolicies validation.
  if (cfg.confinementPolicies !== undefined) {
    if (!cfg.confinementPolicies || typeof cfg.confinementPolicies !== 'object' || Array.isArray(cfg.confinementPolicies)) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "confinementPolicies" must be an object when present.`);
    }
    for (const [policyId, policyDoc] of Object.entries(cfg.confinementPolicies)) {
      if (typeof policyId !== 'string' || !policyId.trim()) {
        throw new RunnerConfigError(`runner config (${sourceLabel}.confinementPolicies) policy id must be a non-empty string.`);
      }
      if (BUILTIN_POLICY_IDS.includes(policyId)) {
        throw new RunnerConfigError(
          `runner config (${sourceLabel}.confinementPolicies) cannot redefine built-in policy "${policyId}".`,
        );
      }
      validateConfinementPolicyShape(policyDoc, `${sourceLabel} confinementPolicies.${policyId}`);
    }
  }

  // L6 / R1: Validate capability confinement policies exist
  if (cfg.capabilities && typeof cfg.capabilities === 'object') {
    for (const [name, entry] of Object.entries(cfg.capabilities)) {
      if (!entry || typeof entry !== 'object') continue;
      const isRequired = entry.confinement?.mode === 'required';
      const isPreferred = entry.confinement?.mode === 'preferred';
      if (isRequired || (cfg.confinement?.strict === true && isPreferred)) {
        const policyId = entry.confinement?.policy;
        const exists = BUILTIN_POLICY_IDS.includes(policyId) || (cfg.confinementPolicies && policyId in cfg.confinementPolicies);
        if (!exists) {
          if (cfg.confinement?.strict === true) {
            throw new RunnerConfigError(
              `runner config (${sourceLabel} capabilities.${name}) references unknown policy "${policyId}" in strict mode (confinement-policy-missing).`,
            );
          } else {
            throw new RunnerConfigError(
              `runner config (${sourceLabel} capabilities.${name}) mode "required" references unknown policy "${policyId}".`,
            );
          }
        }
      }
    }
  }

  // Phase 01 R1: Strict mode requires every declared capability to have an explicit confinement policy.
  if (cfg.confinement?.strict === true) {
    if (!cfg.capabilities || typeof cfg.capabilities !== 'object' || Object.keys(cfg.capabilities).length === 0) {
      throw new RunnerConfigError(
        `runner config (${sourceLabel}) strict mode requires explicit capabilities declared (confinement-policy-missing).`,
      );
    }
    for (const [name, entry] of Object.entries(cfg.capabilities)) {
      if (!entry || typeof entry !== 'object' || !entry.confinement) {
        throw new RunnerConfigError(
          `runner config (${sourceLabel} capabilities.${name}) missing required explicit confinement in strict mode (confinement-policy-missing).`,
        );
      }
      if (!entry.confinement.mode) {
        throw new RunnerConfigError(
          `runner config (${sourceLabel} capabilities.${name}) missing required explicit confinement in strict mode (confinement-policy-missing).`,
        );
      }
    }
  }
}
