// dispatch.mjs — the runner's executor dispatch (per D2/D3/D6, reliability +
// security + feasibility panel revisions on phase-2-routing-7): builds the
// worker prompt from a work item, resolves tier -> model via the committed
// runner config, and spawns the headless executor.
//
// TRUSTED-CONFIG NOTE (security panel): the shared config file's `runner`
// section (`.fgos/config.json`) is an EXECUTABLE config, not passive data —
// whoever can edit it controls what process this module spawns and with
// what arguments. It is committed (per D2's durability policy) so it is
// reviewable like any other source file, but that also means it carries
// the same trust level as code: only apply it from a checkout you already
// trust.
//
// TRUST INVARIANT: this module assumes the `work` item it is given (title,
// kind, refs, and especially `verify`) was authored by the repo's own user,
// not ingested from an untrusted external source. `verify` is run by the
// runner as a shell command (goal-check, a deliberately different and
// separate trust boundary from this module's spawn calls); a work item from
// an unvetted source is an injection vector before it ever reaches dispatch.
// Never wire an external/untrusted intake path into `work` without a review
// gate in between.
//
// SECURITY: the executor is always spawned via an argv array with
// `shell: false` (spawnSync's default) — the prompt and model are
// substituted per-array-element into `executor.args`, never concatenated
// into a single shell string. This is what keeps arbitrary shell metachars
// inside a work item's title/refs/verify text inert here (they still reach
// the child process as literal argv, never interpreted by a shell).
//
// GRANDCHILD-SIGTERM CAVEAT: `spawnSync`'s `timeout` option kills the
// directly-spawned child on expiry, not any grandchild process tree the
// executor itself may have started (e.g. a headless agent CLI that shells
// out further). Phase 2 accepts this as a known limitation — upgrading to a
// process-group kill (e.g. `detached: true` + killing `-pid`) is deferred
// until real operation shows it is needed.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { DEFAULTS, TIERS } from '../state/work.mjs';
import { DOMAINS, resolveDomainName, skillForStage } from '../state/workflow-stage-graphs.mjs';
import { selectTemplate, renderTemplate, hashTemplate } from './prompt-templates.mjs';
import { mergeConfigDefaults } from '../setup/config-merge.mjs';
import { sharedConfigFilePath } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
import { findExecutableOnPath } from '../state/tool-registry.mjs';
import { listWork } from '../state/store.mjs';
import { appendEvent } from '../state/events.mjs';
import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from './paths.mjs';

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

/** Raised when spawning or running the executor itself fails at runtime.
 * `errorClass` deliberately reuses the vocabulary declared in
 * `recovery.mjs`'s `ERROR_CLASSES` (per the cell's key_link) so the runner
 * can feed it straight into `resolveAction` without a translation layer. */
export class DispatchError extends Error {
  constructor(errorClass, message, details = {}) {
    super(message);
    this.name = 'DispatchError';
    this.errorClass = errorClass;
    Object.assign(this, details);
  }
}

/**
 * Build the worker prompt from a work item's own fields (title/kind/refs/
 * verify, per D3) — the five framing sections are a fixed contract (tests
 * pin their presence): Goal, Description, Worktree boundary, Expected
 * proof, and Constraints (the D3 "never call fgos yourself" rule).
 * Description is the work item's full-text intake description (per P30),
 * reproduced verbatim — never truncated — with "(không có)" when absent.
 *
 * The literal prompt TEXT lives in `prompt-templates/*.txt` (P49) — this
 * function only computes the varying pieces (refs/feedbackSection/
 * description/domain/skillPath, each still pure JS conditional logic, never
 * moved into a template) and selects+renders the template via
 * `selectTemplate`/`renderTemplate`. Nothing here reads or writes `.fgos/` —
 * this stays pure string assembly, still returning a plain string (unchanged
 * signature).
 *
 * str91-runner-skill-convergence (D6/D7): `domain`/`skillPath` are two new
 * `renderTemplate` vars, resolved via `workflow-stage-graphs.mjs`'s own
 * domain->skill registry (never a hardcoded path) — they only render for
 * templates that declare the `{domain}`/`{skillPath}` placeholders
 * (currently `worker-prompt-skill-pointer.txt`); an extra unused var is
 * harmless for every other template, per `renderTemplate`'s own per-key
 * substitution loop. `selectTemplate`'s own call below keeps passing the
 * item's raw `work.domain` unchanged — the domain fold lives ONLY inside
 * `selectTemplate` itself (D7), so this function's call site can never
 * diverge from `spawnWorker`'s identical call.
 *
 * `stage` (tsk-5mj D1/D6/D7): which of the item's own domain stages this
 * dispatch is FOR — defaults to `'executing'`, byte-identical to every
 * pre-tsk-5mj call site (none of which ever passed a third argument).
 * Resolves `skillPath` via `skillForStage(domainObj, stage)` instead of the
 * old hardcoded `'executing'` literal, and threads `stage` into
 * `selectTemplate` so a non-executing dispatch (today: `'discovery'`) picks
 * its own template instead of the executing-flavored one.
 */
export function buildPrompt(work, feedback, stage = 'executing') {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';

  // Human feedback (worker-feedback): when the item carries a human answer
  // (clarify gate) or the latest reject/park reason, the worker must see it —
  // a reject loop can only converge if the objection reaches the next round.
  // With no feedback at all the section is omitted entirely, keeping the
  // prompt byte-identical to the pre-feedback shape for every other item.
  let feedbackSection = '';
  const answer = feedback && typeof feedback.answer === 'string' && feedback.answer.trim() ? feedback.answer : null;
  const reason = feedback && typeof feedback.reason === 'string' && feedback.reason.trim() ? feedback.reason : null;
  if (answer || reason) {
    const lines = [];
    if (answer) lines.push(`Human answer (binding decision):\n${answer}`);
    if (reason) lines.push(`Latest human rejection/park reason (fix THIS before anything else):\n${reason}`);
    feedbackSection = `\n# Human feedback\n${lines.join('\n\n')}\n`;
  }
  const description = work.description ?? '(không có)';

  // Directive prose (tsk-3xd D1/D3, docs/history/tsk-3xd-decompose-child-
  // directive-prose/CONTEXT.md): `action` is the item's own new optional
  // field (tầng 3 fix — decompose.mjs's addWork now passes it through for a
  // decompose-generated child). `readFirst` is NOT a stored field (D1: "no
  // new mechanism") — it is derived here, at render time, straight from the
  // item's existing `footprint` (work-graph-intelligence S9), same
  // "(không có)" absent-placeholder convention as `description` above.
  const action = typeof work.action === 'string' && work.action.trim() ? work.action : '(không có)';
  const readFirst =
    Array.isArray(work.footprint) && work.footprint.length ? work.footprint.join(', ') : '(không có)';

  // Skill-pointer vars (str91-runner-skill-convergence D6/D7): resolved once
  // here via the SAME domain registry `fgos-routing`/STR89 already use, never
  // a hardcoded literal — `resolveDomainName` folds an absent/unrecognized
  // domain to `DEFAULT_DOMAIN` exactly like `selectTemplate`'s own internal
  // fold does, so this call site's single console.warn (when the domain is
  // genuinely unrecognized) is the only one buildPrompt triggers.
  const domainName = resolveDomainName(work.domain);
  const domainObj = DOMAINS[domainName];
  const skillName = skillForStage(domainObj, stage);
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;

  const templateName = selectTemplate({ kind: work.kind, tier: work.tier ?? DEFAULTS.tier, domain: work.domain, stage });
  return renderTemplate(templateName, {
    title: work.title,
    kind: work.kind,
    description,
    feedbackSection,
    action,
    readFirst,
    refs,
    verify: work.verify,
    domain: domainName,
    skillPath,
  });
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
  // non-Claude capacity (this repo's own committed config does, for
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
 * the required global `cfg.executor` and every `capacities.<capacityId>`
 * entry naming its own `command`/`args` (P41/C9 v2). An `adapter` field,
 * when present, must name a registered `EXECUTOR_ADAPTERS` key; absent
 * defaults to `DEFAULT_ADAPTER` at resolve time, not validated here.
 * (The per-tier `executors` override block, distinct from `capacities`,
 * was retired at tsk-in1-2 D6: 0 live entries, had already caused a real
 * bug, per tsk-5tm D10.)
 */
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
}

/** kind vocabulary `capacities.<id>.kind` may take (D5, tsk-in1-4): the
 * BAN CHAT axis — is this executor an `agent` (a live persona, potentially
 * native-Task-dispatchable, e.g. `agy`) or a `tool` (presence-only,
 * mechanical, never actually spawned through `resolveExecutorConfig`, e.g.
 * `gitnexus`/`herdr`)? Replaces the old, doubly-overloaded vocabulary that
 * reused `tool-registry.mjs`'s own presence-probe `KINDS` (`cli`/`binary`/
 * `mcp`/`skill`) plus `'task'` — that vocabulary conflated WHAT a capacity
 * is with HOW it is invoked, which is exactly what forced `gitnexus`'s
 * `kind:"mcp"` and `herdr`'s `kind:"cli"` to mean two unrelated things at
 * once (tool-registry's own probe mechanism AND dispatch's cross-provider/
 * native-mechanism gates). The invocation MECHANISM now lives entirely in
 * `invocations[].via` (`INVOCATION_VIA`, D8) — `tool-registry.mjs`'s own
 * presence-probe kind is read from there too (`toolsFromCapacities`,
 * `src/state/tool-registry.mjs`), never from this field anymore.
 */
export const CAPACITY_KINDS = Object.freeze(['agent', 'tool']);

/** value vocabulary `capacities.<id>.carries` may take (D15, `tsk-5td`,
 * first real consumer `tsk-2ie5`/`tsk-2c1`): the content class a capacity
 * is permitted to receive. `user-text` = pure user-typed text only;
 * `repo-content` = may also carry repo file paths/content — the wider,
 * riskier class (a capacity declaring this accepts either class, since
 * `repo-content` covers `user-text` plus more). `secrets`/credentials is
 * deliberately never a legal value here (D15: not a rung on this ladder,
 * a forbidden thing).
 */
export const CAPACITY_CARRIES = Object.freeze(['user-text', 'repo-content']);

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
 * whenever a capacity names no `rigorOverrides` entry for that tier —
 * `light`/`standard` map onto their same-named policy tier directly;
 * `heavy` maps to `critical`, the highest-rigor policy tier, matching
 * `heavy`'s own framing elsewhere (`HEAVY_RISK`) as the most
 * scrutiny-demanding classification. `creative`/`analytical` have no
 * default work-tier mapped onto them yet — they exist for a capacity's
 * own `rigorOverrides` to select explicitly (e.g. a capacity whose work
 * is better served by a creative-leaning model even at `standard` rigor),
 * not because this item invents a use for them.
 */
export const MODEL_POLICY_TIERS = Object.freeze(['lightweight', 'standard', 'creative', 'analytical', 'critical']);
const DEFAULT_TIER_TO_POLICY = Object.freeze({ light: 'lightweight', standard: 'standard', heavy: 'critical' });

/**
 * `capacities.<id>.invocations[].via` vocabulary (tsk-5tm-4 D11, widened
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
 * pipeline yet, same as `'mcp'`/`'task'` were before any capacity used
 * them for real.
 */
export const INVOCATION_VIA = Object.freeze(['cli', 'task', 'mcp', 'api']);

/**
 * Shape-check one `capacities.<id>` entry (D1/D2, tsk-62v; `allowCrossProvider`
 * D1, tsk-32n): requires `kind` (one of `CAPACITY_KINDS`). `command`/`args`,
 * when either is present, must satisfy the same shape `validateExecutorShape`
 * already requires for an executor block — a capacity entry naming its own
 * executor is shaped exactly like one. A capacity entry naming neither is
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
 * capacity whose backend uses a different model-name vocabulary (e.g.
 * `agy`'s Gemini model strings vs. Claude's `haiku`/`sonnet`/`opus`)
 * cannot borrow that shared table without breaking Claude's own
 * tier-to-model resolution. This field lets `executeCapacityCli`
 * (task-dispatch only, below) substitute a capacity-specific model instead.
 *
 * `agentType`, when present, must be a non-empty string (D1/D2, tsk-3sw):
 * names a Claude Code agent definition (`.claude/agents/<name>.md`) an
 * `agent`-kind capacity with no own `command`/`args` resolves into a real
 * `claude --agent <agentType>` invocation via, `buildAgentTypeExecutor`
 * below.
 *
 * `forceCliSpawn`, when present, must be a boolean (tsk-3ik-1, Native-First
 * Dispatch Doctrine rule 4, `docs/decisions/0026-...md`): the valid
 * "config forces cli/spawn anyway" exception (isolation, a separate
 * process/worktree/cwd) for an `agent`-kind capacity that would otherwise
 * be native-eligible — read by `decideDispatchMechanism`/
 * `decideCapacityDispatchMechanism` below, never by `resolveExecutorConfig`
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
 * replacement (a capacity with neither, or with the flat shape, keeps
 * resolving exactly as before this field existed). `resolveExecutorConfig`
 * below selects the invocation whose `via` is `"cli"` specifically — never
 * blindly `invocations[0]` (gate B2) — and throws when `invocations` is
 * present but none is `via:"cli"` (gate B3), rather than silently falling
 * through to the global executor as if the capacity were metadata-only.
 * The top-level `capacities` field name itself is unchanged (D11) — the
 * tier-keyed per-tier override block (strictly validated, `tsk-4eu`;
 * retired since, tsk-in1-2 D6) already occupied the obvious `executors`
 * name at the time, so reusing it here would have collided.
 *
 * `for`, when present, must be a non-empty array of strings, each one a
 * name (or alias) already declared in `cfg.capabilities` (D15, tsk-in1-4;
 * `capabilities` itself is D4/D14, tsk-in1-3) — an executor now serves
 * MULTIPLE capabilities at once (`agy` could plausibly serve both
 * `judge`-shaped dispatch AND something else later), replacing the old
 * single-value `CAPACITY_PURPOSES` enum (`['judge']`, retired here: it was
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
    // `decideCapacityCli`'s MCP hand-back (D10) -- never by
    // `resolveExecutorConfig`, which still never selects an mcp invocation
    // at all (Gate B2/B3 unchanged). Each key must already be a name in
    // `cfg.capabilities`, same discipline `capacity.for`/`capacity.capability`
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
  // via: 'task' needs neither `command` nor `args` — native in-session
  // Task/Agent dispatch carries no subprocess argv at all.
}

/**
 * `capabilityNames` (D15, tsk-in1-4): the Set of valid `for` targets —
 * every key of `cfg.capabilities` (D4/D14) plus every declared `aliases[]`
 * entry, built once by `validateRunnerConfigShape` from the ALREADY-
 * validated `cfg.capabilities` block and threaded through here, since this
 * function has no other way to see a sibling top-level field.
 */
function validateCapacityShape(capacity, label, capabilityNames) {
  if (!capacity || typeof capacity !== 'object' || Array.isArray(capacity)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object.`);
  }
  if (typeof capacity.kind !== 'string' || !CAPACITY_KINDS.includes(capacity.kind)) {
    throw new RunnerConfigError(
      `runner config (${label}) "kind" must be one of ${CAPACITY_KINDS.join('/')}, got: ${JSON.stringify(capacity.kind)}.`,
    );
  }
  if (capacity.command !== undefined || capacity.args !== undefined) {
    validateExecutorShape(capacity, label);
  }
  if (capacity.model !== undefined && (typeof capacity.model !== 'string' || capacity.model.length === 0)) {
    throw new RunnerConfigError(`runner config (${label}) "model" must be a non-empty string when present.`);
  }
  if (capacity.allowCrossProvider !== undefined && typeof capacity.allowCrossProvider !== 'boolean') {
    throw new RunnerConfigError(`runner config (${label}) "allowCrossProvider" must be a boolean when present.`);
  }
  if (capacity.agentType !== undefined && (typeof capacity.agentType !== 'string' || capacity.agentType.length === 0)) {
    throw new RunnerConfigError(`runner config (${label}) "agentType" must be a non-empty string when present.`);
  }
  if (capacity.forceCliSpawn !== undefined && typeof capacity.forceCliSpawn !== 'boolean') {
    throw new RunnerConfigError(`runner config (${label}) "forceCliSpawn" must be a boolean when present.`);
  }
  // tsk-5tm-1 D1: `needs` retired (was resolveExecutorConfig's own presence
  // gate's match key, itself removed — see that function's doc comment).
  // No longer validated; a stray `needs` on a capacity is now inert, never
  // rejected, since the field carries no meaning to consume it.
  //
  // D15: `for` is now a non-empty string ARRAY (was a single value) — one
  // executor can serve multiple capabilities. Each element must already be
  // a name (or alias) declared in `cfg.capabilities` — replaces the old,
  // narrower `CAPACITY_PURPOSES` enum (retired) with the SAME curated
  // catalog a tool-registry entry's own `capability` answers to.
  if (capacity.for !== undefined) {
    if (!Array.isArray(capacity.for) || capacity.for.length === 0 || !capacity.for.every((f) => typeof f === 'string' && f.trim())) {
      throw new RunnerConfigError(`runner config (${label}) "for" must be a non-empty array of non-empty strings when present.`);
    }
    for (const purpose of capacity.for) {
      if (!capabilityNames.has(purpose)) {
        throw new RunnerConfigError(
          `runner config (${label}) "for" entry "${purpose}" is not declared in "capabilities" — add it there first (D4/D14/D15).`,
        );
      }
    }
  }
  // tsk-45f D11: `capability` (the tool-registry's own free-text field,
  // `toolsFromCapacities`) gets the same catalog check `for` already has
  // above -- previously unvalidated entirely, so a typo'd/undeclared value
  // silently made a tool invisible to `fgos tool query --capability ...`
  // with no error anywhere. Never required alongside `for`: a capacity
  // migrated to `for` (D11's own tolerant-fallback shape) may omit
  // `capability` entirely.
  if (capacity.capability !== undefined) {
    if (typeof capacity.capability !== 'string' || !capacity.capability.trim()) {
      throw new RunnerConfigError(`runner config (${label}) "capability" must be a non-empty string when present.`);
    }
    if (!capabilityNames.has(capacity.capability)) {
      throw new RunnerConfigError(
        `runner config (${label}) "capability" entry "${capacity.capability}" is not declared in "capabilities" — add it there first (D4/D14/D15).`,
      );
    }
  }
  // D15/tsk-5td: the content-permission layer, alongside for/needs above.
  // Optional (a capacity naming no `carries` skips resolveExecutorConfig's
  // own carries gate entirely, byte-identical to every pre-D15 capacity) —
  // but when present it must be one of CAPACITY_CARRIES, never a free
  // string (D15's own "TAP GIA TRI phai khai ro" rule, same enum-not-
  // free-string treatment `for` already gets above).
  if (capacity.carries !== undefined && !CAPACITY_CARRIES.includes(capacity.carries)) {
    throw new RunnerConfigError(`runner config (${label}) "carries" must be one of ${CAPACITY_CARRIES.join('/')}, got: ${JSON.stringify(capacity.carries)}.`);
  }
  if (capacity.invocations !== undefined) {
    if (!Array.isArray(capacity.invocations) || capacity.invocations.length === 0) {
      throw new RunnerConfigError(`runner config (${label}) "invocations" must be a non-empty array when present.`);
    }
    capacity.invocations.forEach((invocation, index) => {
      validateInvocationShape(invocation, `${label} invocations[${index}]`, capabilityNames);
    });
  }
  // tsk-5tm-5 D9: `providerModel` names which `cfg.modelPolicies` table
  // this capacity's tier resolution reads from (absent defaults to
  // "claude", `modelForTier`'s own default) — the field `agy` needs so
  // its tier resolution reads the "gemini" table instead of silently
  // borrowing Claude's model names.
  if (capacity.providerModel !== undefined && (typeof capacity.providerModel !== 'string' || !capacity.providerModel.trim())) {
    throw new RunnerConfigError(`runner config (${label}) "providerModel" must be a non-empty string when present.`);
  }
  // `rigorOverrides` (D9): per-work-tier override of the DEFAULT_TIER_TO_
  // POLICY mapping, for a capacity with a real reason to deviate (e.g.
  // prefers "creative" over the default "standard" policy tier even at
  // work-tier "standard"). Optional and additive — a capacity naming none
  // resolves through the default mapping unchanged.
  if (capacity.rigorOverrides !== undefined) {
    if (!capacity.rigorOverrides || typeof capacity.rigorOverrides !== 'object' || Array.isArray(capacity.rigorOverrides)) {
      throw new RunnerConfigError(`runner config (${label}) "rigorOverrides" must be an object mapping a work tier to a policy tier when present.`);
    }
    for (const [workTier, policyTier] of Object.entries(capacity.rigorOverrides)) {
      if (!TIERS.includes(workTier)) {
        throw new RunnerConfigError(`runner config (${label}) "rigorOverrides" key must be one of ${TIERS.join('/')}, got: ${JSON.stringify(workTier)}.`);
      }
      if (!MODEL_POLICY_TIERS.includes(policyTier)) {
        throw new RunnerConfigError(
          `runner config (${label}) "rigorOverrides.${workTier}" must be one of ${MODEL_POLICY_TIERS.join('/')}, got: ${JSON.stringify(policyTier)}.`,
        );
      }
    }
  }
}

/**
 * Shape-check `cfg.capabilities` (D4/D14, tsk-in1-3): the curated catalog
 * of capability names both layers now share — free-text `capability` on a
 * tool-registry entry (`toolsFromCapacities`, `src/state/tool-registry.mjs`)
 * and `capacities.<id>.for` (a capacity's declared purpose, D15 — its own
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
function validateCapabilitiesShape(capabilities, label) {
  if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
    throw new RunnerConfigError(`runner config (${label}) must be an object mapping a capability name -> {description?, aliases?} when present.`);
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

function validateRunnerConfigShape(cfg, sourceLabel) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must be an object.`);
  }
  validateExecutorShape(cfg.executor, `${sourceLabel} executor`);
  // OPTIONAL cfg.capabilities catalog (D4/D14, tsk-in1-3): additive, same
  // style as `capacities` below — absent keeps today's behavior byte-
  // identical. Deliberately a DIFFERENT field from `capacities` (D3 kept
  // that name for the executor registry) — `capabilities` is the curated
  // catalog of WHAT a capacity can promise, `capacities` is the registry
  // of HOW one is actually implemented. Validated FIRST, ahead of
  // `capacities` below (tsk-in1-4 D15): a capacity's own `for` array
  // validates against this catalog's names, so the catalog itself must
  // already be known-good before any `capacities` entry can check against
  // it — `capabilityNames` is built here once and threaded through.
  const capabilityNames = new Set();
  if (cfg.capabilities !== undefined) {
    validateCapabilitiesShape(cfg.capabilities, `${sourceLabel} capabilities`);
    for (const [name, entry] of Object.entries(cfg.capabilities)) {
      capabilityNames.add(name);
      for (const alias of entry.aliases ?? []) capabilityNames.add(alias);
    }
  }
  // OPTIONAL cfg.capacities.<capacityId> map (D1, tsk-62v): additive, same
  // style as `executors` above — absent keeps today's behavior byte-
  // identical.
  if (cfg.capacities !== undefined) {
    if (!cfg.capacities || typeof cfg.capacities !== 'object' || Array.isArray(cfg.capacities)) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "capacities" must be an object mapping capacityId -> capacity entry when present.`);
    }
    for (const [capacityId, capacity] of Object.entries(cfg.capacities)) {
      validateCapacityShape(capacity, `${sourceLabel} capacities.${capacityId}`, capabilityNames);
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

/**
 * Resolve `tier` (per D6; falls back to `work.mjs`'s declared default when a
 * work item omits `tier`, per D7b) to a model name. An unknown tier — one
 * work.mjs's `TIERS` allows but the resolved table does not cover, or any
 * other string — is a validation error: dispatch time is where that drift
 * would first bite (per D6's own original reasoning, unchanged by D9).
 *
 * tsk-5tm-5 D9: `cfg.modelPolicies` (provider-keyed, 5-tier) is preferred
 * when present — `providerModel` (default `"claude"`, every pre-D9 call
 * site) selects which provider's table to read, and `tier` maps onto one
 * of `MODEL_POLICY_TIERS` via `DEFAULT_TIER_TO_POLICY`, unless
 * `rigorOverrides` (a capacity's own override map, threaded in by the
 * caller) names a different policy tier for this specific work tier.
 * Falls back to the legacy flat `cfg.models[tier]` lookup, byte-identical
 * to every pre-D9 caller, when `cfg.modelPolicies` is absent — this
 * signature's first two positional params are UNCHANGED (D9's own
 * constraint): `loop.mjs`'s `modelForTier(config, tier)` call site keeps
 * working exactly as before, options object omitted entirely.
 */
export function modelForTier(cfg, tier, { providerModel = 'claude', rigorOverrides } = {}) {
  const policies = cfg && cfg.modelPolicies;
  if (policies) {
    const providerPolicy = policies[providerModel];
    if (!providerPolicy || typeof providerPolicy !== 'object') {
      throw new RunnerConfigError(`no modelPolicies configured for provider "${providerModel}".`);
    }
    const policyTier = (rigorOverrides && rigorOverrides[tier]) || DEFAULT_TIER_TO_POLICY[tier];
    if (!policyTier || typeof providerPolicy[policyTier] !== 'string') {
      throw new RunnerConfigError(`no model configured for tier "${tier}" (policy tier "${policyTier}") under provider "${providerModel}".`);
    }
    return providerPolicy[policyTier];
  }
  const models = cfg && cfg.models;
  if (!models || typeof tier !== 'string' || !(tier in models)) {
    throw new RunnerConfigError(`no model configured for tier "${tier}".`);
  }
  return models[tier];
}

/**
 * Resolve which executor block applies for `tier`/`capacityId` (P41/D
 * a4fe4c2b, generalized capacity-aware, D4/D6 tsk-62v). Precedence (D4;
 * tsk-in1-2 D6 retired the intermediate `executors.<tier>` rung — 0 live
 * entries, had already caused a real bug per tsk-5tm D10):
 * `capacities.<capacityId>` (only when that entry declares its own
 * `command`/`adapter` — a capacity entry naming neither is metadata-only
 * and falls through) > `executor` (global). No `capacityId` given at all
 * keeps every pre-tsk-62v call site's behavior identical.
 *
 * A `capacities.<capacityId>` entry naming no `command`/`adapter` of its
 * own but declaring `agentType` (D1/D2, tsk-3sw) resolves via
 * `buildAgentTypeExecutor` instead of falling all the way through to
 * `executor` (global) — still ahead of that fallback in the same
 * precedence slot `command`/`adapter` already occupy.
 *
 * Presence/staleness of a `capacities.<capacityId>` entry's own tool is no
 * longer checked here (tsk-5tm-1 D1: retired — 2/3 real entries were
 * `kind:"task"`, for which this never ran, and the third's `needs` added no
 * signal beyond the OS's own ENOENT on a missing binary). Ask `fgos tool
 * query --status present/stale` directly at the call site instead.
 *
 * Cross-provider governance (D2/D3, tsk-32n): once the winning `executor`
 * is resolved below, a `kind: "cli"` capacity whose FINAL resolved
 * `command` is not in `CLAUDE_CLI_COMMANDS` requires
 * `capacity.allowCrossProvider === true` — absent or `false` throws
 * `RunnerConfigError` here, before any dispatch. Checked on the resolved
 * `command` (never on `capacity.kind` alone, and never on `provider`): a
 * `kind: "cli"` capacity naming no `command`/`adapter` of its own falls
 * through to `executor` (global, D4 above), ordinarily Claude's
 * own CLI — gating on declared `kind` alone would false-positive that
 * case, and `provider` is a freely-overridable display alias, not the
 * command actually spawned.
 */
/**
 * Derive a real, spawnable executor block for a `kind:"task"` capacity that
 * declares only `agentType` (no own `command`/`args`) — D1/D2, tsk-3sw,
 * Claude-only for now (this item's own `CONTEXT.md`: multi-provider
 * `agentType` support is `tsk-53h`'s separate follow-on, not built here).
 * Reuses `baseExecutor`'s (the already-resolved `cfg.executor`, guaranteed
 * `{command,args}`-shaped by `validateExecutorShape` at config-load time)
 * own args template verbatim — never a hardcoded literal copy of
 * `DEFAULT_RUNNER_CONFIG` — so a project's own `--allowedTools`/
 * `--permission-mode` customization carries through to its agentType
 * capacities too. Strips the `'--model','{model}'` pair (D2: the named
 * agent definition's own pinned `model:` frontmatter wins, never overridden
 * by the work item's `tier`) and appends `'--agent', agentType`.
 */
function buildAgentTypeExecutor(baseExecutor, agentType) {
  const args = [];
  for (let i = 0; i < baseExecutor.args.length; i++) {
    if (baseExecutor.args[i] === '--model' && baseExecutor.args[i + 1] === '{model}') {
      i++; // also skip the paired value token
      continue;
    }
    args.push(baseExecutor.args[i]);
  }
  args.push('--agent', agentType);
  return { command: baseExecutor.command, args };
}

/**
 * Resolve a capacityId from a declared PURPOSE (`for`, D5/D6, tsk-1o7) —
 * the purpose-based binding US-027 requires: a caller like a gather branch
 * never has a pre-registered capacityId to match by name, since its
 * prompt is composed at runtime (tsk-2ie5/tsk-2c1, the first real
 * consumer). Scans `cfg.capacities` for the first entry whose own `for`
 * ARRAY includes `purpose` (D15, tsk-in1-4: `for` widened from a single
 * value to `string[]` — one executor can serve multiple capabilities at
 * once); returns `null` when none is registered — a legitimate, expected
 * state (no gather-purpose capacity configured yet), never thrown as an
 * error here so a caller can cleanly fall back to its own native dispatch
 * instead of treating "not configured" as malformed config.
 *
 * (tsk-in1-4 D10: re-confirmed at shaping time — namespace conflict #3
 * between `capacityIdForWork`'s job-identity result and this registry's
 * own executor-name keys is resolved by reusing this exact function,
 * unchanged, never by changing how `capacities` is keyed.)
 */
export function resolveCapacityIdForPurpose(cfg, purpose) {
  const capacities = cfg && cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities : {};
  for (const [id, capacity] of Object.entries(capacities)) {
    if (capacity && Array.isArray(capacity.for) && capacity.for.includes(purpose)) return id;
  }
  return null;
}

function resolveExecutorConfig(cfg, tier, capacityId, fgosDir, contentCarries) {
  const capacity = capacityId && cfg && cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities[capacityId] : undefined;

  // D15/tsk-5td, first real gate — carries answers "CAI GI duoc di", never
  // "CO duoc ra ngoai khong" (allowCrossProvider's own question, checked
  // separately below): when the capacity declares a content-permission
  // class, the caller must self-declare what THIS dispatch actually
  // carries (`contentCarries`) — fail closed (never silently allow) when
  // the capacity opts into this gate but the caller passes nothing, since
  // there is then no way to prove the dispatch is safe. `repo-content` is
  // the wider, riskier class (it covers `user-text` plus repo paths/
  // content); a capacity declaring `carries: "user-text"` refuses a
  // `repo-content` dispatch before any spawn (verify item 8, tsk-2c1) —
  // a capacity declaring `carries: "repo-content"` accepts either.
  if (capacity && capacity.carries !== undefined) {
    if (contentCarries === undefined) {
      throw new RunnerConfigError(
        `capacity "${capacityId}" declares "carries: ${capacity.carries}" but this dispatch did not declare what content it carries — pass an explicit content class before dispatch.`,
      );
    }
    if (!CAPACITY_CARRIES.includes(contentCarries)) {
      throw new RunnerConfigError(
        `dispatch content class must be one of ${CAPACITY_CARRIES.join('/')}, got: ${JSON.stringify(contentCarries)}.`,
      );
    }
    if (contentCarries === 'repo-content' && capacity.carries === 'user-text') {
      throw new RunnerConfigError(
        `capacity "${capacityId}" declares "carries: user-text" but this dispatch carries repo-content — refused before spawn (tsk-5td D15).`,
      );
    }
  }

  // tsk-5tm-4 D11: an invocations[]-shaped capacity resolves through its
  // own invocation, ahead of the flat command/args check below — real
  // entries declare one shape or the other, never both, but invocations[]
  // wins on the (currently hypothetical) case they do.
  //
  // Gate B2 (D9, tsk-in1-4): select the invocation whose `via` is `"cli"`
  // specifically — never blindly `invocations[0]` — since `cli-spawn` is
  // the only mechanism this function ever actually dispatches through; a
  // capacity declaring, say, `[{via:"mcp",...}, {via:"cli",...}]` must
  // still resolve the cli one regardless of array order.
  //
  // Gate B3 (D9, tsk-in1-4): when `invocations` IS present but none of
  // them is `via:"cli"` (e.g. `gitnexus`'s mcp-only entry), that is a
  // capacity structurally incapable of being dispatched this way — throw
  // explicitly rather than falling through to the global executor as if
  // the capacity were merely metadata-only. Silently spawning the global
  // Claude executor in gitnexus's name would hide exactly the kind of
  // caller mistake this gate exists to catch ("bẫy B1" from shaping:
  // an mcp identifier misread as a spawnable command).
  const invocations = Array.isArray(capacity?.invocations) ? capacity.invocations : undefined;
  const cliInvocation = invocations?.find((inv) => inv.via === 'cli');
  if (invocations && !cliInvocation) {
    throw new RunnerConfigError(
      `capacity "${capacityId}" declares "invocations" but none is dispatchable via "cli" (has: ${invocations.map((inv) => inv.via).join('/')}) — resolveExecutorConfig only ever spawns a cli invocation; this capacity cannot be dispatched this way.`,
    );
  }
  const resolvedViaAgentType = !cliInvocation && !(capacity && (capacity.adapter || capacity.command)) && Boolean(capacity && capacity.agentType && cfg && cfg.executor);
  const byCapacity = cliInvocation
    ? { command: cliInvocation.command, args: cliInvocation.args, adapter: cliInvocation.adapter, provider: capacity.provider }
    : capacity && (capacity.adapter || capacity.command)
      ? capacity
      : resolvedViaAgentType
        ? buildAgentTypeExecutor(cfg.executor, capacity.agentType)
        : undefined;
  const executor = byCapacity ?? (cfg && cfg.executor);
  if (!executor || typeof executor.command !== 'string' || !Array.isArray(executor.args)) {
    throw new RunnerConfigError('runner config "executor" must have a string "command" and an "args" array.');
  }

  // Cross-provider governance (D2/D3, tsk-32n): exempts ONLY the
  // agentType-resolved path (`buildAgentTypeExecutor` always reuses the
  // global `cfg.executor.command`, always Claude in practice, so the
  // check below is already inert for it) — never a broad `kind` exemption.
  // Pre-tsk-in1-4 this read `capacity.kind !== 'task'`; `'task'` is no
  // longer a legal `kind` value at all (D5: `kind` is `agent`/`tool` now,
  // orthogonal to invocation `via`), and a `kind:"agent"` capacity like
  // `agy` dispatched via its own `via:"cli"` invocation MUST still clear
  // this gate — that is exactly what `allowCrossProvider` already governs
  // for it today.
  if (capacity && !resolvedViaAgentType && !CLAUDE_CLI_COMMANDS.includes(executor.command) && capacity.allowCrossProvider !== true) {
    throw new RunnerConfigError(
      `capacity "${capacityId}" resolves to non-Claude command "${executor.command}" — prompt content would leave the Claude ecosystem. Set capacities.${capacityId}.allowCrossProvider: true to permit this.`,
    );
  }

  return executor;
}

/**
 * Native-First Dispatch Doctrine rules 1/2/4 (`docs/decisions/0026-vision-
 * orchestrator-roottask-capacity-native-vs-cli-spawn.md`), as one pure
 * decision — tsk-3ik-1, Phase 4's own shared helper. Deliberately generic
 * over BOTH dispatch targets the doctrine names (a `capacities.<id>`
 * capacity, or a live session's own direct subTask/Task-tool call) — this
 * function never reads `cfg`/config itself, only the three booleans any
 * caller for either target shape can derive on its own:
 *
 * - `hasNativeMechanism` — does this target have a real native-dispatch
 *   mechanism at all (a capacity declaring `kind:"task"`; a subTask the
 *   caller could invoke via its own Agent/Task tool)? Rule 1: a mechanical
 *   target with no such mechanism always cli/spawns, unconditionally.
 * - `hasLiveTaskAccess` — does the CALLING session already have live
 *   Agent/Task tool access right now? Never inferred here (no environment
 *   probing, no heuristic) — the caller self-declares this, the same
 *   "the skill already self-knows its own tool manifest" pattern
 *   `tsk-3sw`'s own design already named.
 * - `forceCliSpawn` — rule 4's valid config-forces-cli/spawn exception
 *   (isolation: a separate process/worktree/cwd needed for its own sake) —
 *   wins over native even when both above are true.
 *
 * Rule 3 (cross-provider) is never this function's own concern: a caller
 * only reaches this decision once it already knows the target is
 * same-provider — a cross-provider target always cli/spawns via the
 * existing `allowCrossProvider` governance (`resolveExecutorConfig` above),
 * with no native-vs-cli/spawn choice left to make.
 */
export function decideDispatchMechanism({ hasNativeMechanism, hasLiveTaskAccess, forceCliSpawn } = {}) {
  if (!hasNativeMechanism) return 'out-of-process';
  if (forceCliSpawn) return 'out-of-process';
  return hasLiveTaskAccess ? 'in-process' : 'out-of-process';
}

/**
 * `capacities.<id>`-specific convenience over `decideDispatchMechanism`
 * above (tsk-3ik-1): derives `hasNativeMechanism` (`capacity.kind ===
 * "agent"`, D5 tsk-in1-4 — was `"task"` before `kind` split into the
 * `agent`/`tool` BAN CHAT axis; a `kind:"agent"` capacity represents a live
 * persona genuinely capable of native dispatch, e.g. `agy`, regardless of
 * which `via` its own fallback `invocations[]` entry happens to declare —
 * `gitnexus`/`herdr` are `kind:"tool"`, mechanical and presence-only, never
 * native-eligible) and `forceCliSpawn` (`capacity.forceCliSpawn`) straight
 * from the same `cfg.capacities[capacityId]` lookup `resolveExecutorConfig`
 * already does, without calling or mutating that function — this stays a
 * read-only sibling, never a second entry into the CRITICAL-blast-radius
 * resolve path (confirmed via `impact({target: "resolveExecutorConfig",
 * direction: "upstream"})`: 6 upstream symbols, 3 execution flows, HIGH
 * risk, re-run at tsk-in1-4 time). `hasLiveTaskAccess` is never derived
 * here either — same caller-self-declares contract as
 * `decideDispatchMechanism` itself.
 */
export function decideCapacityDispatchMechanism(cfg, capacityId, { hasLiveTaskAccess = false } = {}) {
  const capacity = capacityId && cfg && cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities[capacityId] : undefined;
  return decideDispatchMechanism({
    hasNativeMechanism: Boolean(capacity && capacity.kind === 'agent'),
    hasLiveTaskAccess,
    forceCliSpawn: Boolean(capacity && capacity.forceCliSpawn === true),
  });
}

/**
 * Substitute `{prompt}` and `{model}` into the resolved executor's `args` —
 * PER ARRAY ELEMENT (never joined into one shell string, per the security
 * panel). `capacityId`/`fgosDir`, when given, select a capacity override
 * ahead of the global `cfg.executor` (D4/D6, tsk-62v; the intermediate
 * per-tier `executors.<tier>` override this comment used to describe was
 * retired at tsk-in1-2 D6 — 0 live entries); every field omitted keeps
 * every pre-tsk-62v caller's behavior identical. Returns
 * `{ command, args, adapter, provider }` — `adapter` names the C9 v2
 * executor interface's adapter (`EXECUTOR_ADAPTERS` key) this command
 * should run through, defaulting to `DEFAULT_ADAPTER` when the executor
 * block does not declare one; `provider` (D7, tsk-62v, additive) is the
 * executor block's own `provider` display alias when present, else
 * `command` itself.
 */
/**
 * Worktree-dispatch attestation (tsk-2ig, D1/D3 of docs/history/parallel-
 * decomposition-footprint-avoidance/CONTEXT.md — mức 1, advisory-only):
 * chụp `baseCommit`/`headRef` NGAY TRƯỚC khi dispatch — captured by the
 * launcher itself, never trusted from whatever the dispatched executor
 * later reports.
 *
 * `attestRoot`, when given, is read instead of `fgosDir`'s own root
 * (tsk-4hl fix, independent review after tsk-2ig merged): a worker
 * dispatched via `spawnWorker` runs inside its OWN dispatch worktree
 * (`fgw/<id>`, `loop.mjs`'s `wt.path`), a DIFFERENT checkout than
 * `fgosDir`'s root (always the main checkout, ADR0020 — worktrees never
 * carry their own `.fgos/`). Reading `fgosDir`'s root unconditionally used
 * to attest the main checkout's HEAD regardless of which branch the
 * worker actually dispatched on — correct only for a first-attempt ROOT
 * item (whose dispatch branch happens to fork from main's then-current
 * tip), wrong for a leaf (forks from `fgw/<rootId>`, not main) or a retry
 * (the branch already carries the prior attempt's own commits).
 * `spawnWorker` passes its own worktree `cwd` as `attestRoot`;
 * `executeCapacityCli` (task-dispatch, no worktree involved — genuinely
 * runs against `fgosDir`'s own root) omits it, unchanged.
 *
 * Fail-safe either way: a git read that cannot resolve (detached checkout
 * weirdness, no `.git`, etc.) never throws and never blocks dispatch —
 * this is advisory metadata, not a precondition (same "advisory, không tự
 * fail" stance `frozen-judge.mjs` already states for its own checks).
 * Returns `{baseCommit, headRef}`, either field `null` when it could not
 * be read.
 */
function captureDispatchAttestation(fgosDir, attestRoot) {
  const repoRoot = attestRoot ?? (fgosDir ? path.dirname(fgosDir) : null);
  if (!repoRoot) return { baseCommit: null, headRef: null };
  const readGit = (args) => {
    try {
      return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    } catch {
      return null;
    }
  };
  return {
    baseCommit: readGit(['rev-parse', 'HEAD']),
    headRef: readGit(['symbolic-ref', '--short', '-q', 'HEAD']), // null on detached HEAD, never a throw
  };
}

export function resolveExecutorCommand(cfg, { prompt, model, tier, capacityId, fgosDir, attestRoot, contentCarries } = {}) {
  // Captured BEFORE resolveExecutorConfig, not after (D3) — cheap and
  // unconditional so the same call site works regardless of whether the
  // resolved executor turns out to be same-provider or cross-provider;
  // resolveExecutorConfig below is still the sole authority on which
  // executor actually gets used.
  const attestation = captureDispatchAttestation(fgosDir, attestRoot);
  const executor = resolveExecutorConfig(cfg, tier, capacityId, fgosDir, contentCarries);
  const adapter = executor.adapter ?? DEFAULT_ADAPTER;
  if (!(adapter in EXECUTOR_ADAPTERS)) {
    throw new RunnerConfigError(
      `runner config declares unknown executor adapter "${adapter}" (known: ${Object.keys(EXECUTOR_ADAPTERS).join(', ')}).`,
    );
  }
  const args = executor.args.map((arg) => {
    if (typeof arg !== 'string') {
      throw new RunnerConfigError('runner config "executor.args" entries must all be strings.');
    }
    return arg.split('{prompt}').join(prompt).split('{model}').join(model);
  });
  return {
    command: executor.command,
    args,
    adapter,
    provider: executor.provider ?? executor.command,
    baseCommit: attestation.baseCommit,
    headRef: attestation.headRef,
  };
}

/**
 * Run the headless executor for `work` inside `cwd` (the worktree checkout
 * — this function never touches the main working tree itself; the caller
 * decides `cwd`). Builds the prompt, resolves tier -> model, substitutes the
 * config template, and spawns via argv array with `shell: false` (always —
 * per the security panel, never templated into a shell string).
 *
 * Throws `DispatchError('worker-timeout', ...)` when the executor is killed
 * for exceeding `cfg.timeoutMs` (or `opts.timeoutMs`, test-only override),
 * and `DispatchError('worker-spawn-fail', ...)` when the process could not
 * be started at all (e.g. the configured command does not exist). A
 * non-zero exit status from a process that *did* run is NOT an error here —
 * that is the runner's goal-check's concern (per D3: the worker's own exit
 * status/report is never trusted on its own; only `verify` decides).
 */
/**
 * Live per-chunk teeing (P39): `opts.onChunk(stream, chunk)`, when provided,
 * is called synchronously on every stdout/stderr 'data' event — BEFORE the
 * maxBuffer accounting below, so a chunk is teed even on the event that
 * crosses the cap and triggers the kill. Wrapped in try/catch: an event
 * handler that throws is an uncaught exception in Node (not something a
 * Promise reject can catch), and this module's job is spawning the worker,
 * never crashing on a caller's logging callback. dispatch.mjs itself still
 * touches no filesystem outside the child process's own cwd — the callback
 * (loop.mjs, via worker-log.mjs's sole writer) owns `.fgos/logs/`.
 */
function teeChunk(onChunk, stream, chunk) {
  if (!onChunk) return;
  try {
    onChunk(stream, chunk);
  } catch {
    // observability must never crash dispatch
  }
}

/**
 * C9 v2 (P41/D a4fe4c2b), signature generalized D13 (tsk-in1-5): the
 * executor port is a NAMED interface — `EXECUTOR_ADAPTERS` maps an adapter
 * name to a function `(invocation, opts) => Promise<result>`. `invocation`
 * is whatever shape that one adapter needs (`cliSpawnAdapter` reads
 * `command`/`args`; `httpAdapter` below reads `method`/`url`/`headers`/
 * `body`) — never a fixed `(command, args, cwd, opts)` argv shape, which
 * was itself "bẫy B1": forcing a non-CLI invocation through a mold built
 * for CLI argv. `opts` stays uniform across every adapter (`cwd`,
 * `timeoutMs`, `maxBuffer`, `onChunk`, `workId`, `tier`, `model`) since
 * none of those are invocation-specific — they are dispatch-level
 * execution context every adapter equally needs. Two adapters are
 * registered today: `cli-spawn` (this exact process-spawning body,
 * unchanged in every behavioral detail from before this cell —
 * timeout-on-'exit', hand-tracked maxBuffer kill, onChunk teed before
 * accounting, grandchild-SIGTERM caveat still applies) and `http`
 * (`httpAdapter` below, D13's real pluggability precedent — no capacity
 * dispatches through it yet, same as `cli-spawn` before `agy` existed). An
 * `rpc`/`app-server` adapter (e.g. talking to a headless agent's
 * app-server over RPC instead of CLI argv) stays deferred beyond these
 * two — this cell only proves the port is pluggable, not that every
 * conceivable mechanism needs its own adapter yet.
 */
export const DEFAULT_ADAPTER = 'cli-spawn';

function cliSpawnAdapter(invocation, opts) {
  const { command, args } = invocation;
  const { cwd, timeoutMs, maxBuffer, onChunk, workId, tier, model } = opts;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    let stdout = '';
    let stderr = '';
    let stdoutLen = 0;
    let stderrLen = 0;
    let settled = false;
    let timedOut = false;
    // MAXBUFFER DEVIATION (per this cell's action (1)): spawnSync enforces
    // maxBuffer natively and surfaces overflow as `result.error` (falling
    // into the worker-spawn-fail branch below, the same branch any other
    // non-timeout spawn failure already used) — the event-based `spawn` API
    // has no built-in equivalent, so accumulated stdout+stderr length is
    // tracked by hand on every 'data' event and the child is killed the
    // moment it crosses `maxBuffer`, reusing that same worker-spawn-fail
    // outcome. The intent (never let one runaway worker exhaust memory)
    // holds; the exact error text is not byte-for-byte identical to
    // spawnSync's own maxBuffer message.
    let maxBufferExceeded = false;
    let timer = null;

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn();
    };

    if (timeoutMs) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeoutMs);
    }

    child.stdout.on('data', (chunk) => {
      teeChunk(opts.onChunk, 'stdout', chunk);
      stdoutLen += Buffer.byteLength(chunk);
      if (stdoutLen + stderrLen > maxBuffer) {
        if (!maxBufferExceeded) {
          maxBufferExceeded = true;
          child.kill('SIGTERM');
        }
        return;
      }
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      teeChunk(opts.onChunk, 'stderr', chunk);
      stderrLen += Buffer.byteLength(chunk);
      if (stdoutLen + stderrLen > maxBuffer) {
        if (!maxBufferExceeded) {
          maxBufferExceeded = true;
          child.kill('SIGTERM');
        }
        return;
      }
      stderr += chunk;
    });

    child.on('error', (err) => {
      finish(() => {
        reject(new DispatchError(
          'worker-spawn-fail',
          `executor failed to start for work "${workId}": ${err.message}`,
          { workId, tier, model, cause: err.message, stdout, stderr },
        ));
      });
    });

    // 'exit' (fires once the spawned process itself terminates), never
    // 'close' (waits for the stdio PIPES to fully close too) — matching
    // spawnSync's own timeout semantics exactly (per the GRANDCHILD-SIGTERM
    // CAVEAT above): spawnSync's timeout kills and returns based on the
    // DIRECTLY-spawned child alone, never waiting on any grandchild process
    // tree the executor itself may have started. Resolving on 'close'
    // instead would make a killed timeout silently wait out however long a
    // still-running grandchild keeps the pipe open — defeating the timeout.
    child.on('exit', (code, signal) => {
      finish(() => {
        if (timedOut) {
          reject(new DispatchError(
            'worker-timeout',
            `executor timed out after ${timeoutMs}ms for work "${workId}".`,
            { workId, tier, model, stdout, stderr },
          ));
          return;
        }
        if (maxBufferExceeded) {
          reject(new DispatchError(
            'worker-spawn-fail',
            `executor for work "${workId}" exceeded maxBuffer (${maxBuffer} bytes) and was killed.`,
            { workId, tier, model, cause: 'maxBuffer exceeded', stdout, stderr },
          ));
          return;
        }
        resolve({ status: code, signal, stdout, stderr, tier, model });
      });
    });
  });
}

/**
 * D13 (tsk-in1-5): the real second `EXECUTOR_ADAPTERS` implementation —
 * proves the port generalized above is genuinely pluggable, not just
 * documented as such. Reads `invocation.method`/`.url`/`.headers`/`.body`
 * (never `command`/`args` — a `via:"api"` invocation is shaped for this
 * adapter by `validateInvocationShape`'s own `api` branch above, not for
 * `cli-spawn`). `opts.timeoutMs`, when set, aborts the request via
 * `AbortController` — same timeout CONTRACT as `cliSpawnAdapter`
 * (`DispatchError('worker-timeout', ...)`), not the same mechanism (no
 * subprocess to SIGTERM here). Mirrors `cli-spawn`'s own "non-zero exit is
 * not an error" stance (D3): a non-2xx HTTP status is returned as a normal
 * result (`status` on the result, same field name `cli-spawn` uses for its
 * own exit code), never thrown — only a network failure or a timeout
 * reaching the server at all is a `DispatchError`, matching
 * `worker-spawn-fail`/`worker-timeout`'s existing meaning ("the executor
 * itself could not run"), not "the executor ran and reported failure".
 */
async function httpAdapter(invocation, opts) {
  const { method = 'GET', url, headers, body } = invocation;
  const { timeoutMs, workId, tier, model } = opts;
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let response;
  try {
    response = await fetch(url, { method, headers, body, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new DispatchError(
        'worker-timeout',
        `executor timed out after ${timeoutMs}ms for work "${workId}".`,
        { workId, tier, model },
      );
    }
    throw new DispatchError(
      'worker-spawn-fail',
      `executor failed to start for work "${workId}": ${err.message}`,
      { workId, tier, model, cause: err.message },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
  const text = await response.text();
  return { status: response.status, body: text, headers: Object.fromEntries(response.headers.entries()), tier, model };
}

/** C9 v2 executor-adapter registry — see `cliSpawnAdapter`'s doc comment. */
export const EXECUTOR_ADAPTERS = { [DEFAULT_ADAPTER]: cliSpawnAdapter, http: httpAdapter };

/**
 * Capacity identifier for a work item's executing-stage dispatch (D3,
 * tsk-62v): the skill name executing-stage resolves to for the item's
 * domain — the same `skillForStage`/`DOMAINS` formula `buildPrompt` already
 * applies internally to build its own `skillPath` (never recomputed a
 * different way, per D3). Kept as its own small function rather than
 * folded into `buildPrompt` itself so `buildPrompt`'s own pinned
 * "single console.warn on an unrecognized domain" behavior (str91 D6/D7)
 * stays untouched — this calls `resolveDomainName` its own time, same as
 * `selectTemplate` already being called a second time inside `spawnWorker`
 * below for template logging (P49's same "cheap, deterministic, no
 * duplicated LOGIC" precedent).
 *
 * Exported (tsk-5tm-6 D12(iii)): `decideCapacityCli`'s `--work <id>` path
 * below is the work-item-shaped lookup `fgos-fanout` needs to consult the
 * dispatch decision protocol before firing an Agent for a candidate,
 * instead of hardcoding native dispatch unconditionally.
 *
 * (tsk-in1-4 D12: re-confirmed at shaping time — a `capacityIdForWork`
 * result MISSING from `cfg.capacities` (keyed by executor name, not job
 * identity) is intentional, not a bug; `decideCapacityCli`'s own `--work`
 * branch below already documents the fallback this design implies.)
 */
export function capacityIdForWork(work) {
  const domainObj = DOMAINS[resolveDomainName(work.domain)];
  return skillForStage(domainObj, 'executing');
}

/**
 * Run the headless executor for `work` inside `cwd` (the worktree checkout
 * — this function never touches the main working tree itself; the caller
 * decides `cwd`). Builds the prompt, resolves tier -> model, resolves the
 * (possibly per-tier/per-capacity, P41/tsk-62v) executor + its C9 v2
 * adapter, substitutes the config template, and delegates the actual spawn
 * to that adapter.
 *
 * `opts.fgosDir` (optional, tsk-62v D6): the `.fgos/` directory, needed
 * only so a `kind: "cli"` capacity's presence can be checked via
 * `fgos tool query`'s own functions instead of re-probing PATH. Omitted
 * (every pre-tsk-62v call site) skips that check entirely — the item's own
 * `capacities`/`executors`/`executor` precedence still resolves exactly as
 * before.
 *
 * Throws `DispatchError('worker-timeout', ...)` when the executor is killed
 * for exceeding `cfg.timeoutMs` (or `opts.timeoutMs`, test-only override),
 * and `DispatchError('worker-spawn-fail', ...)` when the process could not
 * be started at all (e.g. the configured command does not exist). A
 * non-zero exit status from a process that *did* run is NOT an error here —
 * that is the runner's goal-check's concern (per D3: the worker's own exit
 * status/report is never trusted on its own; only `verify` decides).
 *
 * `opts.stage` (tsk-5mj D1/D6/D7, optional): threaded straight through to
 * `buildPrompt`'s own `stage` parameter — omitted (every pre-tsk-5mj call
 * site) keeps the default `'executing'` prompt byte-identical.
 */
export function spawnWorker(work, cfg, cwd, opts = {}) {
  // Setup stays synchronous and OUTSIDE the adapter call on purpose: a
  // malformed tier/config (RunnerConfigError, via modelForTier/
  // resolveExecutorCommand) must still throw synchronously, before any
  // process is spawned — exactly like the spawnSync-based version, and
  // exactly what dispatch.test.mjs's "throws a RunnerConfigError ... before
  // any spawn" test pins.
  const tier = work.tier ?? DEFAULTS.tier;
  // tsk-5tm-5 D9: capacityId computed before modelForTier (moved ahead of
  // its pre-D9 position, right after) so a capacity's own providerModel/
  // rigorOverrides can thread into tier resolution — never borrowing
  // Claude's model names for a non-Claude capacity's own dispatch.
  const capacityId = capacityIdForWork(work);
  const capacityForTier = capacityId && cfg && cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities[capacityId] : undefined;
  const model = modelForTier(cfg, tier, { providerModel: capacityForTier?.providerModel, rigorOverrides: capacityForTier?.rigorOverrides });
  const prompt = buildPrompt(work, opts.feedback, opts.stage);
  const { command, args, adapter, provider, baseCommit, headRef } = resolveExecutorCommand(cfg, {
    prompt,
    model,
    tier,
    capacityId,
    fgosDir: opts.fgosDir,
    // tsk-4hl: attest THIS worker's own dispatch worktree, never fgosDir's
    // root (always the main checkout) — see captureDispatchAttestation's
    // own docstring for why those two roots diverge on a leaf or a retry.
    attestRoot: cwd,
  });
  const adapterFn = EXECUTOR_ADAPTERS[adapter];
  if (!adapterFn) {
    throw new RunnerConfigError(`no executor adapter registered for "${adapter}".`);
  }
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs;
  const maxBuffer = opts.maxBuffer ?? 10 * 1024 * 1024;

  // Dispatch chokepoint visibility: one line per real spawn, right before it
  // happens, so a human watching the runner's own stderr can see which job
  // (executing-stage skill, capacityIdForWork's result — a different axis
  // than the runner.capabilities catalog, D12) resolved to which capacity
  // (a real cfg.capacities entry, or the global executor when none matches),
  // through which adapter/provider/model/tier. Diagnostic-only: never read
  // back by any caller, never part of this function's return value.
  process.stderr.write(
    `fgos: dispatch job=${capacityId} capacity=${cfg?.capacities?.[capacityId] ? capacityId : '(global executor)'} via=${adapter} provider=${provider} model=${model} tier=${tier}\n`,
  );

  // P49: same mechanical selection buildPrompt used internally, called again
  // here (cheap, deterministic, no duplicated LOGIC) purely so the dispatch
  // log can record which template + version produced this prompt. tsk-5mj:
  // threads `opts.stage` through same as buildPrompt's own call, so this
  // log-only selection never drifts from the template actually rendered.
  const templateName = selectTemplate({ kind: work.kind, tier, domain: work.domain, stage: opts.stage });
  const templateHash = hashTemplate(templateName);

  return adapterFn({ command, args }, {
    cwd,
    timeoutMs,
    maxBuffer,
    onChunk: opts.onChunk,
    workId: work.id,
    tier,
    model,
  }).then(
    // capacityId/provider (D7, tsk-62v)/baseCommit/headRef (tsk-4hl)/command
    // (tsk-33w D9): additive only — every field this function already
    // returned stays exactly where it was.
    (result) => ({ ...result, templateName, templateHash, capacityId, provider, command, baseCommit, headRef }),
    (err) => {
      if (err instanceof DispatchError) {
        err.templateName = templateName;
        err.templateHash = templateHash;
      }
      throw err;
    },
  );
}

/**
 * Record one `capacity.dispatch` audit line for an IN-SESSION capacity
 * call (a live skill's own gather dispatch, tsk-2ie5/tsk-2c1) — the async
 * claim/dispatch cycle's own `capacity.dispatch` event (`loop.mjs`) only
 * ever fires from inside a work item's own claim; this is the sibling
 * entry point for a call that has no claim of its own to attach to. Same
 * event `type` and `provider`/`command` shape (D9, `tsk-5td`) so a
 * downstream reader never needs a second vocabulary — `baseCommit`/
 * `headRef` are always `null`: no worktree-dispatch attestation applies to
 * an in-session call (`captureDispatchAttestation` is never invoked here).
 * `appendEvent` already acquires `events.jsonl`'s own cross-process lock
 * internally (`withEventsLock`, `src/state/events.mjs`) — no extra
 * locking needed here even when multiple gather branches log concurrently.
 */
export function logCapacityDispatch(fgosDir, { id, capacityId, provider, command, model }) {
  return appendEvent(path.join(fgosDir, 'events.jsonl'), {
    type: 'capacity.dispatch',
    payload: { id, capacityId, provider, command, model, baseCommit: null, headRef: null },
  });
}

/**
 * `execute <capacityId>` CLI subcommand (tsk-5tm-3 D5): the self-execute
 * counterpart to `resolve` above, matching marketing-cockpit's `run_task()`
 * contract (`task-executor.py:550-611`) — self-execute for every case that
 * can be, hand back only for the one case that genuinely can't. `resolve`
 * always hands back `{command,args}` for the caller to run itself via
 * Bash, even for a `kind:"cli"` capacity that `EXECUTOR_ADAPTERS` could
 * already run directly (`EXECUTOR_ADAPTERS['cli-spawn']` was validated at
 * config-load time but, before this item, only ever CALLED by `spawnWorker`
 * — Flow A never called it). `execute` closes that gap:
 *
 * - **`mechanism: "in-process"`** (native, same-family, live session) —
 *   dispatch itself has no Task/Agent tool to call (a passive CLI/library),
 *   so this is the one case that still hands back — a `spawn_instruction`-
 *   shaped result, `{mechanism, agentType, prompt[, capacityId]}`, for the
 *   caller to invoke its OWN Agent/Task tool with. Same `agentType`
 *   resolution and `hasLiveTaskAccess` self-declaration contract `decide`
 *   already uses (never probed or inferred here).
 * - **every other case** (`mechanism: "out-of-process"`, i.e. whatever
 *   `EXECUTOR_ADAPTERS[adapter]` resolves to for this capacity) — self-
 *   executes: calls the adapter directly, the same call `spawnWorker`
 *   already makes for a work item's own dispatch, and returns the REAL
 *   result (`{status,signal,stdout,stderr,tier,model}` from `cliSpawnAdapter`
 *   today, plus `provider`/`command`[, `capacityId`] additive, same
 *   shape `spawnWorker`'s own result already carries) — never the bare
 *   `{command,args}` `resolve` hands back for the caller to run through
 *   Bash itself.
 *
 * `resolveExecutorCommand` already throws if the resolved `adapter` names
 * an unregistered `EXECUTOR_ADAPTERS` key (config-load-time validation,
 * `validateExecutorShape`) — by the time this function reaches the
 * self-execute branch, `EXECUTOR_ADAPTERS[adapter]` is guaranteed to
 * exist; the explicit check below is defensive, matching `spawnWorker`'s
 * own belt-and-braces style rather than load-bearing.
 */
export async function executeCapacityCli(
  capacityIdArg,
  {
    prompt = '',
    cwd = process.cwd(),
    repoRoot,
    model: modelOverride,
    tier: tierOverride,
    for: purpose,
    carries,
    hasLiveTaskAccess = false,
    timeoutMs: timeoutOverride,
    maxBuffer: maxBufferOverride,
    onChunk,
  } = {},
) {
  if (!capacityIdArg && !purpose) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs execute <capacityId> [--prompt <text>] [--model <name>] [--tier <name>] [--carries <class>] [--has-live-task-access] | execute --for <purpose> [...]',
    );
  }
  // MAIN CHECKOUT root, not resolveRepoRoot's worktree-own root (tsk-5hv):
  // ensureRunnerConfigForDir reads .fgos/config.json, unconditionally
  // wiped from every freshly-created worktree (ADR0020) — resolving to a
  // worktree's own root here would silently bootstrap a throwaway default
  // config instead of the real one on every worktree-resident call.
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const fgosDir = fgosDirFromRoot(root);
  const cfg = ensureRunnerConfigForDir(root);
  const resolvedByPurpose = !capacityIdArg;
  const capacityId = capacityIdArg || resolveCapacityIdForPurpose(cfg, purpose);
  if (!capacityId) {
    throw new RunnerConfigError(
      `no capacity registered for purpose "${purpose}" — call "decide --for ${purpose}" first to check availability before executing.`,
    );
  }

  // Dispatch chokepoint visibility (both branches below): "capability" is
  // the purpose actually requested via --for when purpose-resolved, or —
  // for a direct capacityId call — whichever capabilities that capacity
  // itself declares serving (capacity.for, D15), so the line still answers
  // "what is this FOR" even without a --for flag. Diagnostic-only.
  const capabilityLabel = purpose ?? (cfg.capacities?.[capacityId]?.for?.join(',') || '(none declared)');

  const mechanism = decideCapacityDispatchMechanism(cfg, capacityId, { hasLiveTaskAccess });
  if (mechanism === 'in-process') {
    const agentType = cfg.capacities?.[capacityId]?.agentType;
    process.stderr.write(
      `fgos: dispatch capability=${capabilityLabel} capacity=${capacityId} via=in-process agentType=${agentType ?? '(none)'} provider=n/a model=n/a tier=n/a\n`,
    );
    const base = { mechanism, agentType, prompt };
    return resolvedByPurpose ? { ...base, capacityId } : base;
  }

  const capacity = cfg.capacities?.[capacityId];
  const tier = tierOverride ?? capacity?.tier ?? DEFAULTS.tier;
  const model = modelOverride ?? capacity?.model ?? modelForTier(cfg, tier, { providerModel: capacity?.providerModel, rigorOverrides: capacity?.rigorOverrides });
  const { command, args, adapter, provider } = resolveExecutorCommand(cfg, {
    prompt,
    model,
    tier,
    capacityId,
    fgosDir,
    contentCarries: carries,
    attestRoot: cwd,
  });
  const adapterFn = EXECUTOR_ADAPTERS[adapter];
  if (!adapterFn) {
    throw new RunnerConfigError(`no executor adapter registered for "${adapter}".`);
  }
  const timeoutMs = timeoutOverride ?? cfg.timeoutMs;
  const maxBuffer = maxBufferOverride ?? 10 * 1024 * 1024;
  process.stderr.write(
    `fgos: dispatch capability=${capabilityLabel} capacity=${capacityId} via=${adapter} provider=${provider} model=${model} tier=${tier}\n`,
  );
  const result = await adapterFn({ command, args }, { cwd, timeoutMs, maxBuffer, onChunk, workId: capacityId, tier, model });
  const base = { mechanism, ...result, provider, command };
  return resolvedByPurpose ? { ...base, capacityId } : base;
}

/**
 * `decide <capacityId>` CLI subcommand (tsk-3ik-1): lets a task-dispatch
 * consumer skill ask, before choosing whether to `execute` the command or
 * call its own Task tool natively, which mechanism
 * `decideCapacityDispatchMechanism` picks for this capacity right now.
 * Prints `{"mechanism": "in-process"|"out-of-process"}` as JSON to stdout — same
 * additive-sibling relationship to `executeCapacityCli` above as
 * `decideCapacityDispatchMechanism` has to `resolveExecutorConfig`: reads
 * the same committed runner config, calls nothing that also feeds
 * `execute`'s own resolution path (tsk-60f D4: the `resolve` CLI subcommand
 * this docblock used to describe here was retired -- 0 production
 * consumers, ~15 tests ported onto `execute`).
 *
 * `--has-live-task-access` is the caller's own self-declaration (never
 * probed or inferred here — same contract `decideDispatchMechanism` itself
 * documents) that this session already has live Agent/Task tool access.
 *
 * `agentType` (tsk-3ik-3, additive): included in the result, alongside
 * `mechanism`, whenever the capacity declares one — a `mechanism:
 * "in-process"` result is otherwise useless to a consumer skill's own
 * Agent/Task tool call, which needs a concrete `subagent_type` to invoke,
 * not just "go in-process" with no target. Omitted (`undefined`, dropped by
 * `JSON.stringify`) for a capacity with no `agentType`, e.g. every `kind:
 * "cli"` capacity — `mechanism` for those always resolves
 * `"out-of-process"` anyway (rule 1/3), so no consumer ever needs
 * `agentType` in that case.
 *
 * `work` (tsk-5tm-6 D4/D12(iii)): a work-item id, resolved to its dispatch
 * capacity via `capacityIdForWork` (the same executing-stage skill lookup
 * `spawnWorker` already applies) before deciding its mechanism -- the
 * lookup `fgos-fanout` needs to consult this protocol per-candidate before
 * firing an Agent, instead of assuming native dispatch unconditionally.
 * Lowest precedence of the three selectors (a real `capacityIdArg` always
 * wins, `for` next, matching every pre-D4 caller's byte-identical
 * behavior) since no existing caller ever passes more than one.
 *
 * `needsSoul` (tsk-60f D2): the caller's own self-declaration that it is
 * about to fire its own Agent/Task tool with no capacity or work item to
 * name -- the natural fourth signal `decide` never had, distinct from a
 * fourth lookup door (an explicit `--subtask` door was rejected: a
 * sub-task's only natural key is a purpose label, i.e. `for`). Only
 * consulted once every capacityId/purpose/work resolution above came up
 * empty (a real match always wins, unchanged): when `needsSoul` is true,
 * that empty resolution defaults to native dispatch
 * (`hasNativeMechanism: true`) instead of `"unavailable"` -- the exact
 * generalization of `work`'s own `hasExplicitCapacity === false` branch
 * above, which has hardcoded this same default for every `--work` caller
 * since tsk-5tm-6.
 *
 * `configured` (tsk-60f D3, additive on every returned shape): `true` when
 * the resolved `capacityId` names a real `cfg.capacities` entry, `false`
 * otherwise -- distinguishing "nothing registered under this name/purpose"
 * from "registered, and its own kind resolves out-of-process", which today
 * both silently collapse into the same `mechanism: "out-of-process"`
 * value. Never a reason to throw (D3): a work item whose own
 * `capacityIdForWork` result has no override configured is `configured:
 * false` by design (tsk-in1 D12), not an error.
 *
 * `mcpTool` (tsk-45f D10, additive, mutually exclusive with `agentType`):
 * MCP hand-back -- a `kind:"tool"` capacity whose mcp invocation declares a
 * `tools` map (piece 3) with an entry for the requested purpose gets
 * `mechanism` upgraded from `out-of-process` to `in-process`, carrying
 * `mcpTool` instead of `agentType`. Same reasoning as the agent-kind
 * hand-back: dispatch has no MCP client of its own, so the caller calls its
 * OWN MCP tool directly (AGENTS.md's Dispatch section, D12). Never builds
 * an MCP client here, never touches Gate B3 (`resolveExecutorConfig`) --
 * a caller that skips `decide` and calls `execute` directly on an mcp-only
 * capacity still hits that gate exactly as before.
 */
export async function decideCapacityCli(
  capacityIdArg,
  { cwd = process.cwd(), repoRoot, hasLiveTaskAccess = false, for: purpose, work: workIdArg, needsSoul = false } = {},
) {
  if (!capacityIdArg && !purpose && !workIdArg && !needsSoul) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs decide <capacityId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]',
    );
  }
  // Same main-checkout resolution as executeCapacityCli above, same reason.
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const cfg = ensureRunnerConfigForDir(root);
  // Indirect binding (purpose OR work-item) each report capacityId back
  // additively (see below) -- same byte-identical-shape reasoning
  // `executeCapacityCli` above already uses, generalized past purpose-only.
  const resolvedIndirectly = !capacityIdArg;
  let capacityId = capacityIdArg;
  if (!capacityId && workIdArg) {
    const fgosDir = fgosDirFromRoot(root);
    const workItem = listWork(fgosDir).work[workIdArg];
    if (!workItem) {
      throw new RunnerConfigError(`no work item "${workIdArg}" found -- cannot resolve its dispatch capacity.`);
    }
    capacityId = capacityIdForWork(workItem);
    // tsk-5tm-6 D4: a work-item-resolved capacityId with NO explicit
    // cfg.capacities entry means "no override configured" -- per
    // Native-First Dispatch Doctrine (docs/decisions/0026) rule 2, every
    // fgos-fanout candidate is a same-provider (Claude), soul-needing
    // target (a full rootTask run through /fgOS:pick) and therefore
    // defaults to native, NOT to decideCapacityDispatchMechanism's generic
    // "no registered capacity -> out-of-process" fallback below (correct
    // only for a NAMED capacity helper that may genuinely have no native
    // equivalent, e.g. agy -- confirmed live: `resolve fgos-coding-implement`
    // silently falls back to the bare global executor, the exact "blind
    // cli/spawn even though the caller is already a live same-provider
    // soul" bug 0026 itself names as the motivating gap). Deliberately
    // narrower than the name/purpose-resolved paths below -- both keep
    // their pre-D4 "no capacity -> out-of-process" behavior byte-identical,
    // since naming a specific capacityId/purpose asks about that
    // registered target specifically, not a work item's default dispatch.
    const hasExplicitCapacity = Boolean(cfg.capacities && typeof cfg.capacities === 'object' && cfg.capacities[capacityId]);
    if (!hasExplicitCapacity) {
      const mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
      return { mechanism, capacityId, configured: false };
    }
  }
  // Purpose-based binding, same precedence as executeCapacityCli above. No
  // match is a legitimate "not configured yet" state for `decide`
  // specifically -- `mechanism: "unavailable"` lets a caller like
  // gather's own fan-out branch tell "fall back to native" apart from
  // "in-process"/"out-of-process" with one more enum value, never a thrown
  // error for an expected, common state.
  if (!capacityId && purpose) {
    capacityId = resolveCapacityIdForPurpose(cfg, purpose);
  }
  if (!capacityId) {
    // needsSoul (D2): an empty resolution defaults to native dispatch
    // instead of "unavailable" -- same default `work`'s own
    // hasExplicitCapacity branch above already hardcodes, generalized to
    // every door.
    if (needsSoul) {
      const mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
      return { mechanism, configured: false };
    }
    return { mechanism: 'unavailable', configured: false };
  }
  const mechanism = decideCapacityDispatchMechanism(cfg, capacityId, { hasLiveTaskAccess });
  const capacity = cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities[capacityId] : undefined;
  const configured = Boolean(capacity);
  const agentType = capacity?.agentType;

  // tsk-45f D10: MCP hand-back -- a tool-kind capacity with an mcp
  // invocation and a matching entry in that invocation's own `tools` map
  // (piece 3) hands back `mcpTool` the same way an agent-kind capacity
  // hands back `agentType`: dispatch has neither an Agent/Task tool nor an
  // MCP client of its own (AGENTS.md's own Dispatch section, D12), so the
  // caller calls its OWN MCP tool directly. Only overrides `mechanism` when
  // it would otherwise be `out-of-process` -- an agent-kind capacity's own
  // `agentType` hand-back always wins, unchanged. The purpose used to look
  // up the map is the explicit `--for` value when given, else the
  // capacity's own sole `for` entry when it names exactly one (a direct
  // `decide <capacityId>` call has no purpose of its own to disambiguate
  // among several).
  let mcpTool;
  if (mechanism === 'out-of-process') {
    const mcpInvocation = Array.isArray(capacity?.invocations) ? capacity.invocations.find((inv) => inv.via === 'mcp') : undefined;
    const lookupPurpose = purpose ?? (Array.isArray(capacity?.for) && capacity.for.length === 1 ? capacity.for[0] : undefined);
    const candidate = lookupPurpose && mcpInvocation?.tools ? mcpInvocation.tools[lookupPurpose] : undefined;
    if (typeof candidate === 'string' && candidate) mcpTool = candidate;
  }

  const base = mcpTool
    ? { mechanism: 'in-process', mcpTool, configured }
    : typeof agentType === 'string' && agentType
      ? { mechanism, agentType, configured }
      : { mechanism, configured };
  return resolvedIndirectly ? { ...base, capacityId } : base;
}

// CLI entry point — only runs when this file is executed directly (`node
// src/runner/dispatch.mjs ...`), never on import (every existing caller
// imports named exports, none execute this module as a script).
if (import.meta.url === `file://${process.argv[1]}`) {
  const [subcommand, ...afterSubcommand] = process.argv.slice(2);
  // Purpose-based binding (tsk-2c1): a caller with no pre-registered
  // capacityId to name (a gather branch) passes `--for <purpose>` instead
  // of a positional id — distinguished here by whether the token right
  // after the subcommand looks like a flag. Every pre-tsk-2c1 invocation
  // always names a real, non-"--"-prefixed capacityId positionally, so
  // this never changes behavior for an existing caller.
  const capacityId = afterSubcommand[0] && !afterSubcommand[0].startsWith('--') ? afterSubcommand[0] : undefined;
  const rest = capacityId ? afterSubcommand.slice(1) : afterSubcommand;
  const flagValue = (name) => {
    const i = rest.indexOf(name);
    return i !== -1 ? rest[i + 1] : undefined;
  };
  if (subcommand === 'execute') {
    executeCapacityCli(capacityId, {
      prompt: flagValue('--prompt') ?? '',
      model: flagValue('--model'),
      tier: flagValue('--tier'),
      carries: flagValue('--carries'),
      for: flagValue('--for'),
      hasLiveTaskAccess: rest.includes('--has-live-task-access'),
    }).then(
      (executed) => {
        process.stdout.write(`${JSON.stringify(executed)}\n`);
      },
      (err) => {
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      },
    );
  } else if (subcommand === 'decide') {
    decideCapacityCli(capacityId, {
      hasLiveTaskAccess: rest.includes('--has-live-task-access'),
      for: flagValue('--for'),
      work: flagValue('--work'),
      needsSoul: rest.includes('--needs-soul'),
    }).then(
      (decided) => {
        process.stdout.write(`${JSON.stringify(decided)}\n`);
      },
      (err) => {
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      },
    );
  } else if (subcommand === 'log') {
    // capacityId here is the SAME shared positional above — the log
    // line's own capacityId, e.g. whichever id `decide`'s own result
    // named, never a second parsing scheme.
    const id = flagValue('--id');
    const provider = flagValue('--provider');
    const command = flagValue('--command');
    const model = flagValue('--model');
    if (!id || !capacityId || !provider || !command) {
      process.stderr.write(
        'usage: node src/runner/dispatch.mjs log <capacityId> --id <workItemId> --provider <p> --command <c> [--model <m>]\n',
      );
      process.exitCode = 1;
    } else {
      const root = resolveMainCheckoutRoot(process.cwd()) ?? resolveRepoRoot(process.cwd());
      const fgosDir = fgosDirFromRoot(root);
      const event = logCapacityDispatch(fgosDir, { id, capacityId, provider, command, model });
      process.stdout.write(`${JSON.stringify(event)}\n`);
    }
  } else {
    process.stderr.write(
      `unknown subcommand ${JSON.stringify(subcommand)}. Usage: node src/runner/dispatch.mjs execute <capacityId> [--prompt <text>] [--model <name>] [--tier <name>] [--carries <class>] [--has-live-task-access] | execute --for <purpose> [...] | decide <capacityId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access] | log <capacityId> --id <id> --provider <p> --command <c> [--model <m>]\n`,
    );
    process.exitCode = 1;
  }
}
