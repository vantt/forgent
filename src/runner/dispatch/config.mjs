// dispatch/config.mjs — runner config load/validate/bootstrap + the frozen
// vocabularies every other dispatch/* module reads (D7, tsk-2uf-1): the
// `RunnerConfigError` type, `.fgos/config.json`'s `runner` section
// load/validate/bootstrap (`loadRunnerConfig`/`loadRunnerConfigFromDir`/
// `ensureRunnerConfigForDir`), every `validate*Shape` gate, and the frozen
// enums (`EXECUTOR_KINDS`/`EXECUTOR_CARRIES`/`CLAUDE_CLI_COMMANDS`/
// `MODEL_POLICY_TIERS`/`INVOCATION_VIA`). Split out of the former
// `src/runner/dispatch.mjs` (2204 lines, 6 concerns in one file) — pure
// move, no behavior change; `src/runner/dispatch.mjs` re-exports every name
// below unchanged as a barrel. See `docs/history/dispatch-activation-and-
// handoff-redesign/CONTEXT.md` D7 for the split rationale.
//
// TRUSTED-CONFIG NOTE (security panel, unchanged from the pre-split file):
// the shared config file's `runner` section (`.fgos/config.json`) is an
// EXECUTABLE config, not passive data — whoever can edit it controls what
// process `dispatch/transport.mjs` spawns and with what arguments. It is
// committed (per D2's durability policy) so it is reviewable like any other
// source file, but that also means it carries the same trust level as code:
// only apply it from a checkout you already trust.

import fs from 'node:fs';
import path from 'node:path';
import { TIERS } from '../../state/work.mjs';
import { mergeConfigDefaults } from '../../setup/config-merge.mjs';
import { sharedConfigFilePath } from '../../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../../config/global-config.mjs';
import { findExecutableOnPath } from '../../state/tool-registry.mjs';
// EXECUTOR_ADAPTERS lives in ./transport.mjs (the adapter registry is a
// transport-layer concern) but validateExecutorShape below still needs its
// key set to validate a config-declared `adapter` name — same cross-module
// need `dispatch/resolve.mjs`'s `resolveExecutorConfig` has for it. Safe
// despite the resulting config.mjs <-> transport.mjs cycle: every read of
// EXECUTOR_ADAPTERS here happens inside a function body invoked well after
// both modules finish evaluating, never at module-eval time.
import { EXECUTOR_ADAPTERS } from './transport.mjs';

/** Raised for malformed runner config or an unresolvable tier -> model
 * lookup. `category` follows the same CLI-facing vocabulary as
 * WorkValidationError/StoreError (R4) — this is an input-shape problem, not
 * a runtime dispatch failure. */
export class RunnerConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RunnerConfigError';
    this.category = 'validation';
  }
}

/**
 * Read and validate a runner config file at `configPath`. Throws
 * `RunnerConfigError` for anything short of the minimal committed shape:
 * `executor.command` (string), `executor.args` (array of strings),
 * `models` (object), `timeoutMs` (positive number).
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
    cfg = JSON.parse(raw);
  } catch (err) {
    throw new RunnerConfigError(`runner config at "${configPath}" is not valid JSON: ${err.message}`);
  }

  validateRunnerConfigShape(cfg, configPath);
  return cfg;
}

/**
 * CLI names this module knows how to recognize when auto-detecting an
 * assistant CLI on PATH for a fresh runner config (str82). Order
 * matters: earlier names win when more than one is present on PATH. `codex`
 * is listed here for a clearer "found X, but no verified template" message
 * only — it has no entry in `SUPPORTED_EXECUTOR_TEMPLATES` below (no
 * verified working argv shape for this dispatch path).
 */
export const KNOWN_ASSISTANT_CLI_NAMES = ['claude', 'codex'];

/**
 * Pure, side-effect-free PATH scan (str82): does an executable file named
 * one of `candidateNames` exist in one of `pathEnv`'s directories? Never
 * spawns or execs the candidate — this is a filesystem check only. Returns
 * the first matching candidate name (in `candidateNames` order, so an
 * earlier name wins over a later one found elsewhere on PATH) or `null`
 * when none is found. `candidateNames`/`pathEnv` are both injectable so
 * callers (and tests) never have to mutate the real environment to control
 * the result.
 *
 * D5 (tsk-62v): this was a second, independent implementation of the exact
 * PATH-scan `tool-registry.mjs`'s `commandExistsOnPath` already did — both
 * now call the one shared `findExecutableOnPath` (accessSync X_OK +
 * platform-aware PATHEXT, tool-registry.mjs owns it since it already
 * exported the kind vocabulary this scan is used alongside).
 */
export function detectAssistantCli(candidateNames = KNOWN_ASSISTANT_CLI_NAMES, pathEnv = process.env.PATH) {
  return findExecutableOnPath(candidateNames, pathEnv);
}

/**
 * D1's baked-in default runner payload — mirrors this repo's own tracked
 * `.fgos/config.json`'s `runner` section verbatim, so the auto-generated
 * default is provably identical to what already works in this repo's own
 * dogfood loop.
 */
export const DEFAULT_RUNNER_CONFIG = {
  executor: {
    command: 'claude',
    args: [
      '-p',
      '{prompt}',
      '--model',
      '{model}',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git add:*),Bash(git commit:*)',
    ],
  },
  // tsk-5tm-5 D9: modelPolicies replaces the old flat `models` map --
  // provider-keyed, each provider's own 5-tier vocab (MODEL_POLICY_TIERS
  // below). Default here stays Claude-only (matching the default
  // `executor.command: 'claude'` above); a project adds its own
  // `modelPolicies.<providerModel>` block when it configures a
  // non-Claude executor (this repo's own committed config does, for
  // `agy`/gemini). `creative`/`analytical` default to `sonnet` (no real
  // consumer differentiates them from `standard` yet); `critical`
  // defaults to `opus`, matching `heavy`'s pre-D9 model unchanged.
  modelPolicies: {
    claude: {
      lightweight: 'haiku',
      standard: 'sonnet',
      creative: 'sonnet',
      analytical: 'sonnet',
      critical: 'opus',
    },
  },
  timeoutMs: 900000,
  parallel: {
    maxRoots: 4,
    maxLeavesPerRoot: 4,
  },
};

/**
 * Executor templates this module has actually verified for the missing-path
 * bootstrap in `ensureRunnerConfigForDir` (str82). Only `claude` has one — it is
 * literally `DEFAULT_RUNNER_CONFIG.executor`, so detecting `claude` on PATH
 * writes a byte-identical config to today's unconditional default. There is
 * deliberately no `codex` (or other) entry: no verified working argv shape
 * exists for this dispatch path yet, and fabricating one would silently
 * break a user's first run instead of loudly asking them to fill it in by
 * hand.
 */
export const SUPPORTED_EXECUTOR_TEMPLATES = { claude: DEFAULT_RUNNER_CONFIG.executor };

/**
 * tsk-5tm-5 D9: `models`/`modelPolicies` are mutually-substitutable — either
 * alone satisfies `validateRunnerConfigShape`, and `modelForTier` prefers
 * `modelPolicies` when present. A project's runner section that intends
 * `models` alone (no `modelPolicies` of its own) must not have a
 * `modelPolicies` key silently attached by ANY missing-key-fill merge this
 * module runs — not just the `DEFAULT_RUNNER_CONFIG` merge in
 * `ensureRunnerConfigForDir`, but also the separate `mergeWithGlobalConfig`
 * merge both `loadRunnerConfigFromDir` and `ensureRunnerConfigForDir` run
 * afterward, which can inject `~/.fgos/config.json`'s own `modelPolicies`
 * just as silently. `preRunner` is the project's own runner section as it
 * stood right before the merge being guarded; `mergedRunner` is that merge's
 * result.
 */
function dropModelPoliciesInjectedOverModels(preRunner, mergedRunner) {
  if (preRunner && preRunner.models !== undefined && preRunner.modelPolicies === undefined && mergedRunner.modelPolicies !== undefined) {
    const { modelPolicies, ...rest } = mergedRunner;
    return rest;
  }
  return mergedRunner;
}

/**
 * Resolve+validate the runner section of the shared project config file at
 * `dir` (`.fgos/config.json`'s `runner` key, the sole config source since
 * tsk-5hv D1 retired the legacy fallback). Its content is merged against
 * `~/.fgos/config.json` via `mergeWithGlobalConfig` (project wins any key
 * present in both, tsk-5vf D2's "global config has real runtime effect"
 * half of the gap) before the `runner` section is extracted and validated.
 * Throws `RunnerConfigError` when the shared file itself does not exist —
 * `ensureRunnerConfigForDir` below is the bootstrap-if-missing wrapper
 * around this.
 */
export function loadRunnerConfigFromDir(dir) {
  const sharedPath = sharedConfigFilePath(dir);
  if (!fs.existsSync(sharedPath)) {
    throw new RunnerConfigError(`cannot read runner config at "${sharedPath}": no such file`);
  }
  const raw = fs.readFileSync(sharedPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new RunnerConfigError(`shared config at "${sharedPath}" is not valid JSON: ${err.message}`);
  }
  const withGlobal = mergeWithGlobalConfig(parsed);
  const runnerCfg = dropModelPoliciesInjectedOverModels(parsed.runner, withGlobal.runner ?? {});
  validateRunnerConfigShape(runnerCfg, `${sharedPath}#runner`);
  return runnerCfg;
}

/**
 * Build the default executor block for a fresh runner-config bootstrap
 * (str82's `detectAssistantCli` logic, factored out of `ensureRunnerConfigForDir`
 * below so a future second bootstrap wrapper could reuse the identical
 * shape/messages for the same detected CLI — `pathHint` is the literal
 * string named in the placeholder command / stderr message when no
 * verified template exists).
 */
function bootstrapDefaultExecutor(pathHint) {
  const detected = detectAssistantCli();
  const executor =
    detected && detected in SUPPORTED_EXECUTOR_TEMPLATES
      ? SUPPORTED_EXECUTOR_TEMPLATES[detected]
      : {
          command: detected
            ? `NO_VERIFIED_TEMPLATE_FOR_${detected.toUpperCase()}__edit_${pathHint}`
            : `NO_ASSISTANT_CLI_FOUND__edit_${pathHint}`,
          args: ['{prompt}'],
        };
  return { detected, executor };
}

/**
 * Bootstrap wrapper (retargeted per tsk-2ta D1 amended / tsk-5vf D1/D2/D4;
 * legacy fallback removed per tsk-5hv D1) around `loadRunnerConfigFromDir`.
 *
 * - Shared file (`.fgos/config.json`) already exists: fills any default
 *   key its `runner` section is missing, rewrites only when a key was
 *   actually added, merges the result against `~/.fgos/config.json` via
 *   `mergeWithGlobalConfig` (project wins), and validates the merged
 *   `runner` section.
 * - Shared file absent (true first run): bootstraps straight into it.
 */
export function ensureRunnerConfigForDir(dir) {
  const sharedPath = sharedConfigFilePath(dir);

  if (fs.existsSync(sharedPath)) {
    const parsed = JSON.parse(fs.readFileSync(sharedPath, 'utf8'));
    const existingRunner = parsed.runner ?? {};
    // tsk-5tm-5 D9: `models`/`modelPolicies` are mutually-substitutable —
    // either alone satisfies validateRunnerConfigShape's requirement, and
    // modelForTier prefers modelPolicies when present. Auto-filling
    // modelPolicies from DEFAULT_RUNNER_CONFIG onto a config that already
    // has its own `models` map would silently SHADOW that map (nothing
    // was actually missing) — skip that one default key in exactly this
    // case, same "don't touch what's already satisfied" spirit every
    // other field in this merge already follows.
    const effectiveDefaults =
      existingRunner.models !== undefined && existingRunner.modelPolicies === undefined
        ? Object.fromEntries(Object.entries(DEFAULT_RUNNER_CONFIG).filter(([key]) => key !== 'modelPolicies'))
        : DEFAULT_RUNNER_CONFIG;
    const { merged, addedKeys } = mergeConfigDefaults(existingRunner, effectiveDefaults);
    let projectShared = parsed;
    if (addedKeys.length > 0) {
      projectShared = { ...parsed, runner: merged };
      fs.writeFileSync(sharedPath, `${JSON.stringify(projectShared, null, 2)}\n`);
      process.stderr.write(
        `fgos: added missing default config keys to ${sharedPath}#runner: ${addedKeys.join(', ')}\n`,
      );
    }
    const withGlobal = mergeWithGlobalConfig(projectShared);
    const runnerCfg = dropModelPoliciesInjectedOverModels(projectShared.runner, withGlobal.runner ?? {});
    validateRunnerConfigShape(runnerCfg, `${sharedPath}#runner`);
    return runnerCfg;
  }

  const { detected, executor } = bootstrapDefaultExecutor('.fgos/config.json');
  const runnerConfig = { ...DEFAULT_RUNNER_CONFIG, executor };
  fs.mkdirSync(path.dirname(sharedPath), { recursive: true });
  fs.writeFileSync(sharedPath, `${JSON.stringify({ runner: runnerConfig }, null, 2)}\n`);
  process.stderr.write(
    `fgos: no runner config found — ${
      detected ? `detected "${detected}" on PATH` : 'no known assistant CLI found on PATH'
    }; wrote a default (executor: ${executor.command}) at ${sharedPath}#runner; edit .fgos/config.json by hand to change.\n`,
  );
  return runnerConfig;
}

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

/**
 * CLI commands recognized as staying within the Claude ecosystem for
 * cross-provider governance (D2, tsk-32n). Deliberately NOT
 * `KNOWN_ASSISTANT_CLI_NAMES` (above) — that list is "assistant CLIs this
 * module can auto-bootstrap for a fresh config" and wrongly includes
 * `'codex'` (OpenAI's own CLI, not Claude), so it is the wrong list for a
 * Claude-vs-non-Claude check.
 */
export const CLAUDE_CLI_COMMANDS = Object.freeze(['claude']);

/**
 * `cfg.modelPolicies.<providerModel>` tier vocabulary (tsk-5tm-5 D9,
 * matching marketing-cockpit's `tier_policy_path`) — deliberately its OWN
 * 5-value vocab, distinct from `work.mjs`'s `TIERS` (`light/standard/
 * heavy`, D9's own pinned scope boundary: that export stays untouched,
 * shared with `work.risk`). `DEFAULT_TIER_TO_POLICY` is the default
 * mapping from a work item's own tier onto one of these five, used
 * whenever a executor names no `rigorOverrides` entry for that tier —
 * `light`/`standard` map onto their same-named policy tier directly;
 * `heavy` maps to `critical`, the highest-rigor policy tier, matching
 * `heavy`'s own framing elsewhere (`HEAVY_RISK`) as the most
 * scrutiny-demanding classification. `creative`/`analytical` have no
 * default work-tier mapped onto them yet — they exist for a executor's
 * own `rigorOverrides` to select explicitly (e.g. a executor whose work
 * is better served by a creative-leaning model even at `standard` rigor),
 * not because this item invents a use for them.
 */
export const MODEL_POLICY_TIERS = Object.freeze(['lightweight', 'standard', 'creative', 'analytical', 'critical']);
// Exported (additive, D7 module split): `dispatch/resolve.mjs`'s
// `modelForTier` needs this default map too, now that it lives in a sibling
// module — was a bare same-file `const` before the split (byte-identical
// value/behavior, only newly reachable from outside this file).
export const DEFAULT_TIER_TO_POLICY = Object.freeze({ light: 'lightweight', standard: 'standard', heavy: 'critical' });

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
function validateInvocationShape(invocation, label, capabilityNames) {
  if (!invocation || typeof invocation !== 'object' || Array.isArray(invocation)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object.`);
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
}

/**
 * Advisory-only, config-load-time warning: an `executors.<id>` entry that
 * declares neither `providerModel` nor `provider`, and for which
 * `assignment-policy.mjs`'s own pre-spawn command extraction
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
 * reads that bare command; assignment-policy.mjs never does), and an
 * `invocations[]`-shaped entry with no `via:"cli"` entry at all — e.g. this
 * repo's own live `gitnexus` (`invocations: [{via:'mcp', ...}]`, MCP-only)
 * — where assignment-policy.mjs has literally nothing to extract and
 * silently defaults to `'claude'` while other call sites resolve a
 * different (or no) provider family. Never throws — this must not break a
 * config that currently loads fine; it only recommends declaring
 * `providerModel` explicitly so every call site agrees.
 */
function warnIfProviderFamilyUnreliable(executorId, executor) {
  if (executor.providerModel !== undefined || executor.provider !== undefined) return;
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

/**
 * `capabilityNames` (D15, tsk-in1-4): the Set of valid `for` targets —
 * every key of `cfg.capabilities` (D4/D14) plus every declared `aliases[]`
 * entry, built once by `validateRunnerConfigShape` from the ALREADY-
 * validated `cfg.capabilities` block and threaded through here, since this
 * function has no other way to see a sibling top-level field.
 */
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
  if (executor.carries !== undefined && !EXECUTOR_CARRIES.includes(executor.carries)) {
    throw new RunnerConfigError(`runner config (${label}) "carries" must be one of ${EXECUTOR_CARRIES.join('/')}, got: ${JSON.stringify(executor.carries)}.`);
  }
  if (executor.invocations !== undefined) {
    if (!Array.isArray(executor.invocations) || executor.invocations.length === 0) {
      throw new RunnerConfigError(`runner config (${label}) "invocations" must be a non-empty array when present.`);
    }
    executor.invocations.forEach((invocation, index) => {
      validateInvocationShape(invocation, `${label} invocations[${index}]`, capabilityNames);
    });
  }
  // tsk-5tm-5 D9: `providerModel` names which `cfg.modelPolicies` table
  // this executor's tier resolution reads from (absent defaults to
  // "claude", `modelForTier`'s own default) — the field `agy` needs so
  // its tier resolution reads the "gemini" table instead of silently
  // borrowing Claude's model names.
  if (executor.providerModel !== undefined && (typeof executor.providerModel !== 'string' || !executor.providerModel.trim())) {
    throw new RunnerConfigError(`runner config (${label}) "providerModel" must be a non-empty string when present.`);
  }
  // `rigorOverrides` (D9): per-work-tier override of the DEFAULT_TIER_TO_
  // POLICY mapping, for a executor with a real reason to deviate (e.g.
  // prefers "creative" over the default "standard" policy tier even at
  // work-tier "standard"). Optional and additive — a executor naming none
  // resolves through the default mapping unchanged.
  if (executor.rigorOverrides !== undefined) {
    validateRigorOverridesShape(executor.rigorOverrides, `${label} "rigorOverrides"`);
  }
}

// Extracted (D2, docs/history/capability-capacity-remodel/CONTEXT.md) so
// `capabilities.<name>.overrides.rigorOverrides` (validateCapabilitiesShape
// below) validates against the exact same rule a executor's own
// `rigorOverrides` already does, never a second, drifting copy of it.
function validateRigorOverridesShape(rigorOverrides, label) {
  if (!rigorOverrides || typeof rigorOverrides !== 'object' || Array.isArray(rigorOverrides)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping a work tier to a policy tier when present.`);
  }
  for (const [workTier, policyTier] of Object.entries(rigorOverrides)) {
    if (!TIERS.includes(workTier)) {
      throw new RunnerConfigError(`runner config (${label}) key must be one of ${TIERS.join('/')}, got: ${JSON.stringify(workTier)}.`);
    }
    if (!MODEL_POLICY_TIERS.includes(policyTier)) {
      throw new RunnerConfigError(
        `runner config (${label}.${workTier}) must be one of ${MODEL_POLICY_TIERS.join('/')}, got: ${JSON.stringify(policyTier)}.`,
      );
    }
  }
}

/**
 * Shape-check `cfg.capabilities` (D4/D14, tsk-in1-3): the curated catalog
 * of capability names both layers now share — free-text `capability` on a
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
// Only 4 fields are ever eligible for capabilities.<name>.overrides (D2,
// docs/history/capability-capacity-remodel/CONTEXT.md): a capability can
// retune HOW strongly its resolved executor works, never WHAT command
// actually runs -- command/args/adapter/invocations stay owned by the
// executor alone, never override-able from a capability.
const CAPABILITY_OVERRIDE_FIELDS = Object.freeze(['rigorOverrides', 'providerModel', 'tier', 'model']);

function validateCapabilitiesShape(capabilities, label) {
  if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping a capability name -> {description?, aliases?, prefer?, overrides?} when present.`);
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
    if (entry.prefer !== undefined && (typeof entry.prefer !== 'string' || !entry.prefer.trim())) {
      throw new RunnerConfigError(`runner config (${entryLabel}) "prefer" must be a non-empty string (a executor id) when present.`);
    }
    if (entry.overrides !== undefined) {
      if (!entry.overrides || typeof entry.overrides !== 'object' || Array.isArray(entry.overrides)) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "overrides" must be an object when present.`);
      }
      for (const key of Object.keys(entry.overrides)) {
        if (!CAPABILITY_OVERRIDE_FIELDS.includes(key)) {
          throw new RunnerConfigError(`runner config (${entryLabel}) "overrides" key "${key}" is not one of ${CAPABILITY_OVERRIDE_FIELDS.join('/')} — command/args/adapter/invocations are never override-able from a capability (D2).`);
        }
      }
      if (entry.overrides.providerModel !== undefined && (typeof entry.overrides.providerModel !== 'string' || !entry.overrides.providerModel.trim())) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "overrides.providerModel" must be a non-empty string when present.`);
      }
      if (entry.overrides.tier !== undefined && (typeof entry.overrides.tier !== 'string' || !entry.overrides.tier.trim())) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "overrides.tier" must be a non-empty string when present.`);
      }
      if (entry.overrides.model !== undefined && (typeof entry.overrides.model !== 'string' || !entry.overrides.model.trim())) {
        throw new RunnerConfigError(`runner config (${entryLabel}) "overrides.model" must be a non-empty string when present.`);
      }
      if (entry.overrides.rigorOverrides !== undefined) {
        validateRigorOverridesShape(entry.overrides.rigorOverrides, `${entryLabel}.overrides.rigorOverrides`);
      }
    }
  }
}

/**
 * Shape-check `cfg.modelPolicies` (tsk-5tm-5 D9): an object mapping an
 * arbitrary provider name (`"claude"`, `"gemini"`, ...) to a tier map,
 * each tier map's keys drawn from `MODEL_POLICY_TIERS` and values
 * non-empty model-name strings. Partial coverage (a provider naming fewer
 * than all 5 tiers) is valid at load time, same lenient-at-load/strict-
 * at-resolve philosophy the old flat `models` map already used (per
 * `modelForTier`'s own doc comment) — a missing tier only throws once
 * something actually asks for it.
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
      if (typeof model !== 'string' || !model.trim()) {
        throw new RunnerConfigError(`runner config (${label}.${providerModel}.${policyTier}) must be a non-empty string.`);
      }
    }
  }
}

/**
 * Pure query (Phase 00 R8): does `cfg.modelPolicies.<providerModel>` declare
 * `policyTier`? No I/O, no credential probing, no "is the executable on
 * PATH" check — a provider table naming fewer than all 5
 * `MODEL_POLICY_TIERS` (valid per `validateModelPoliciesShape` above) simply
 * answers `false` for the tiers it omits. Read by `resolve.mjs`'s
 * `resolvePolicyTierModel` and available to a future Cohort-Planner-facing
 * caller that needs to exclude an executor for an activity's tier floor
 * without triggering the resolver's own throw.
 */
export function supportsPolicyTier(cfg, providerModel, policyTier) {
  return typeof cfg?.modelPolicies?.[providerModel]?.[policyTier] === 'string';
}

function validateRunnerConfigShape(cfg, sourceLabel) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must be an object.`);
  }
  validateExecutorShape(cfg.executor, `${sourceLabel} executor`);
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
      if (entry.prefer === undefined) continue;
      if (!cfg.executors?.[entry.prefer]) {
        throw new RunnerConfigError(
          `runner config (${sourceLabel} capabilities.${name}) "prefer" names "${entry.prefer}" but no such executor is registered.`,
        );
      }
    }
  }
  // tsk-5tm-5 D9: `modelPolicies` (provider-keyed, 5-tier) is the new
  // preferred shape -- when present, it satisfies this requirement on its
  // own; the legacy flat `models` map is only required when a project
  // hasn't migrated. Both may coexist (modelForTier prefers modelPolicies
  // when present); neither being present is the one invalid state.
  if (cfg.modelPolicies !== undefined) {
    validateModelPoliciesShape(cfg.modelPolicies, `${sourceLabel} modelPolicies`);
  } else if (!cfg.models || typeof cfg.models !== 'object' || Array.isArray(cfg.models)) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) must declare a "models" object mapping tier -> model, or a "modelPolicies" object mapping provider -> tier -> model (tsk-5tm-5 D9).`,
    );
  }
  if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must declare a positive numeric "timeoutMs".`);
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
}
