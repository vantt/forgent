// dispatch.mjs — the runner's executor dispatch (per D2/D3/D6, reliability +
// security + feasibility panel revisions on phase-2-routing-7): builds the
// worker prompt from a work item, resolves tier -> model via the committed
// runner config, and spawns the headless executor.
//
// TRUSTED-CONFIG NOTE (security panel): `.fgos-runner.json` is an
// EXECUTABLE config, not passive data — whoever can edit it controls what
// process this module spawns and with what arguments. It is committed
// (per D2's durability policy) so it is reviewable like any other source
// file, but that also means it carries the same trust level as code: only
// apply it from a checkout you already trust.
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
import { DEFAULTS } from '../state/work.mjs';
import { DOMAINS, resolveDomainName, skillForStage } from '../state/workflow-stage-graphs.mjs';
import { selectTemplate, renderTemplate, hashTemplate } from './prompt-templates.mjs';
import { mergeConfigDefaults } from '../setup/config-merge.mjs';
import { sharedConfigFilePath, legacyRunnerConfigPath } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
import { KINDS, findExecutableOnPath, resolvedStatus, readLocalStatus } from '../state/tool-registry.mjs';
import { listWork } from '../state/store.mjs';
import { resolveRepoRoot, fgosDirFromRoot } from './paths.mjs';

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
 */
export function buildPrompt(work, feedback) {
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

  // Skill-pointer vars (str91-runner-skill-convergence D6/D7): resolved once
  // here via the SAME domain registry `fgos-routing`/STR89 already use, never
  // a hardcoded literal — `resolveDomainName` folds an absent/unrecognized
  // domain to `DEFAULT_DOMAIN` exactly like `selectTemplate`'s own internal
  // fold does, so this call site's single console.warn (when the domain is
  // genuinely unrecognized) is the only one buildPrompt triggers.
  const domainName = resolveDomainName(work.domain);
  const domainObj = DOMAINS[domainName];
  const skillName = skillForStage(domainObj, 'executing');
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;

  const templateName = selectTemplate({ kind: work.kind, tier: work.tier ?? DEFAULTS.tier, domain: work.domain });
  return renderTemplate(templateName, {
    title: work.title,
    kind: work.kind,
    description,
    feedbackSection,
    refs,
    verify: work.verify,
    domain: domainName,
    skillPath,
  });
}

/**
 * Read and validate `.fgos-runner.json` at `configPath`. Throws
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
 * assistant CLI on PATH for a fresh `.fgos-runner.json` (str82). Order
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
 * D1's baked-in default `.fgos-runner.json` payload — mirrors this repo's own
 * tracked `.fgos-runner.json` verbatim, so the auto-generated default is
 * provably identical to what already works in this repo's own dogfood loop.
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
  models: {
    light: 'haiku',
    standard: 'sonnet',
    heavy: 'opus',
  },
  timeoutMs: 900000,
  parallel: {
    maxRoots: 4,
    maxLeavesPerRoot: 4,
  },
};

/**
 * Executor templates this module has actually verified for the missing-path
 * bootstrap in `ensureRunnerConfig` (str82). Only `claude` has one — it is
 * literally `DEFAULT_RUNNER_CONFIG.executor`, so detecting `claude` on PATH
 * writes a byte-identical config to today's unconditional default. There is
 * deliberately no `codex` (or other) entry: no verified working argv shape
 * exists for this dispatch path yet, and fabricating one would silently
 * break a user's first run instead of loudly asking them to fill it in by
 * hand.
 */
export const SUPPORTED_EXECUTOR_TEMPLATES = { claude: DEFAULT_RUNNER_CONFIG.executor };

/**
 * Bootstrap wrapper (D1/D3) around `loadRunnerConfig`: when `configPath` does
 * not exist, auto-detects a known assistant CLI on PATH (str82,
 * `detectAssistantCli`) and writes a default `.fgos-runner.json` there,
 * announcing what it detected (or didn't) and the executor it wrote, before
 * loading it. `loadRunnerConfig` itself is never modified — its "rejects a
 * missing file" contract stays intact for any caller (e.g. an explicit
 * `--config` path) that still wants a loud failure on ENOENT; this wrapper
 * is the one place that instead treats a missing default path as "first
 * run, bootstrap it."
 *
 * The written executor depends on what `detectAssistantCli` finds: `claude`
 * on PATH writes `SUPPORTED_EXECUTOR_TEMPLATES.claude` (byte-identical to
 * `DEFAULT_RUNNER_CONFIG.executor`, since that IS the verified claude
 * template — so this stays byte-identical to the pre-str82 unconditional
 * default whenever claude is present). A detected CLI with no verified
 * template (e.g. `codex`), or no known CLI at all, writes a
 * self-documenting placeholder `executor.command` instead of a
 * fabricated/guessed argv shape, naming what to fix by hand in
 * `.fgos-runner.json`. Every other `DEFAULT_RUNNER_CONFIG` field
 * (models/timeoutMs/parallel) is unaffected either way.
 *
 * When `configPath` already exists (str87-fgos-setup-doctor D3), it is
 * merged against `DEFAULT_RUNNER_CONFIG` via `mergeConfigDefaults` instead of
 * left untouched: any default key the user's file is missing gets filled in
 * and the file is rewritten + the added keys announced; a file that already
 * has every default key is never rewritten. This branch is unaffected by
 * str82 — it never runs `detectAssistantCli`.
 *
 * A write failure (permissions, read-only fs, disk full) is never caught —
 * it propagates as a normal thrown error, since a failed bootstrap write IS
 * the whole point of this call, not a side effect to shrug off.
 */
export function ensureRunnerConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    const detected = detectAssistantCli();
    const executor =
      detected && detected in SUPPORTED_EXECUTOR_TEMPLATES
        ? SUPPORTED_EXECUTOR_TEMPLATES[detected]
        : {
            command: detected
              ? `NO_VERIFIED_TEMPLATE_FOR_${detected.toUpperCase()}__edit_.fgos-runner.json`
              : 'NO_ASSISTANT_CLI_FOUND__edit_.fgos-runner.json',
            args: ['{prompt}'],
          };
    const config = { ...DEFAULT_RUNNER_CONFIG, executor };
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    process.stderr.write(
      `fgos: no .fgos-runner.json found — ${
        detected ? `detected "${detected}" on PATH` : 'no known assistant CLI found on PATH'
      }; wrote a default (executor: ${executor.command}) at ${configPath}; edit .fgos-runner.json by hand to change.\n`,
    );
    return loadRunnerConfig(configPath);
  }

  const existingConfig = loadRunnerConfig(configPath);
  const { merged, addedKeys } = mergeConfigDefaults(existingConfig, DEFAULT_RUNNER_CONFIG);
  if (addedKeys.length === 0) {
    return existingConfig;
  }

  fs.writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`);
  process.stderr.write(
    `fgos: added missing default config keys to ${configPath}: ${addedKeys.join(', ')}\n`,
  );
  return loadRunnerConfig(configPath);
}

/**
 * Resolve+validate the runner section of the shared project config file at
 * `dir` (`.fgos/config.json`'s `runner` key), falling back to the legacy
 * `.fgos-runner.json` at `dir` — via `loadRunnerConfig` itself, unchanged —
 * when the shared file doesn't exist yet (tsk-2ta D1 amended / tsk-5vf D2).
 * The legacy-fallback branch stays byte-identical to before this item (no
 * global-config merge) — that is the deliberate parity net for any install
 * that hasn't run `fgos setup` since the move. Once the shared file is
 * real, its content is merged against `~/.fgos/config.json` via
 * `mergeWithGlobalConfig` (project wins any key present in both, tsk-5vf
 * D2's "global config has real runtime effect" half of the gap) before the
 * `runner` section is extracted and validated.
 */
export function loadRunnerConfigFromDir(dir) {
  const sharedPath = sharedConfigFilePath(dir);
  if (!fs.existsSync(sharedPath)) {
    return loadRunnerConfig(legacyRunnerConfigPath(dir));
  }
  const raw = fs.readFileSync(sharedPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new RunnerConfigError(`shared config at "${sharedPath}" is not valid JSON: ${err.message}`);
  }
  const withGlobal = mergeWithGlobalConfig(parsed);
  const runnerCfg = withGlobal.runner ?? {};
  validateRunnerConfigShape(runnerCfg, `${sharedPath}#runner`);
  return runnerCfg;
}

/**
 * Build the default executor block for a fresh runner-config bootstrap
 * (str82's `detectAssistantCli` logic, factored out so both the legacy
 * `ensureRunnerConfig` bootstrap branch above and `ensureRunnerConfigForDir`
 * below produce the identical shape/messages for the same detected CLI —
 * `pathHint` is the literal string named in the placeholder command / stderr
 * message when no verified template exists).
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
 * Bootstrap wrapper (retargeted per tsk-2ta D1 amended / tsk-5vf D1/D2/D4)
 * around `loadRunnerConfigFromDir`: the shared-file counterpart to
 * `ensureRunnerConfig` above, resolved against `dir` instead of a single
 * file path.
 *
 * - Shared file (`.fgos/config.json`) already exists: fills any default
 *   key its `runner` section is missing (same `mergeConfigDefaults`
 *   discipline as `ensureRunnerConfig`), rewrites only when a key was
 *   actually added, merges the result against `~/.fgos/config.json` via
 *   `mergeWithGlobalConfig` (project wins), and validates the merged
 *   `runner` section.
 * - Shared file absent but the legacy `.fgos-runner.json` exists: delegates
 *   to `ensureRunnerConfig` on the legacy path UNCHANGED — fills/writes the
 *   OLD file in place. The physical move to the new location only happens
 *   through `fgos setup`'s own explicit `ensureSharedConfigDefaults` call
 *   (tsk-5vf D2) — never implicitly here.
 * - Neither exists (true first run): bootstraps straight into the new
 *   shared file, never writing a fresh `.fgos-runner.json` again.
 */
export function ensureRunnerConfigForDir(dir) {
  const sharedPath = sharedConfigFilePath(dir);
  const legacyPath = legacyRunnerConfigPath(dir);

  if (fs.existsSync(sharedPath)) {
    const parsed = JSON.parse(fs.readFileSync(sharedPath, 'utf8'));
    const existingRunner = parsed.runner ?? {};
    const { merged, addedKeys } = mergeConfigDefaults(existingRunner, DEFAULT_RUNNER_CONFIG);
    let projectShared = parsed;
    if (addedKeys.length > 0) {
      projectShared = { ...parsed, runner: merged };
      fs.writeFileSync(sharedPath, `${JSON.stringify(projectShared, null, 2)}\n`);
      process.stderr.write(
        `fgos: added missing default config keys to ${sharedPath}#runner: ${addedKeys.join(', ')}\n`,
      );
    }
    const withGlobal = mergeWithGlobalConfig(projectShared);
    const runnerCfg = withGlobal.runner ?? {};
    validateRunnerConfigShape(runnerCfg, `${sharedPath}#runner`);
    return runnerCfg;
  }

  if (fs.existsSync(legacyPath)) {
    return ensureRunnerConfig(legacyPath);
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
 * the required global `cfg.executor` and every optional `cfg.executors.<tier>`
 * entry (P41/C9 v2). An `adapter` field, when present, must name a
 * registered `EXECUTOR_ADAPTERS` key; absent defaults to `DEFAULT_ADAPTER`
 * at resolve time, not validated here.
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

/** kind vocabulary `capacities.<id>.kind` may take (D2, tsk-62v): reuses
 * `tool-registry.mjs`'s `KINDS` verbatim plus `'task'` (in-session
 * Agent/Task dispatch — the one kind `fgos tool` has no reason to know,
 * since presence-on-this-machine is never the question for it). This is
 * `capacities`' own vocabulary, not a change to `tool-registry.mjs`'s
 * `KINDS` itself — `fgos tool register --kind` must never accept `"task"`.
 */
export const CAPACITY_KINDS = Object.freeze([...KINDS, 'task']);

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
 * Shape-check one `capacities.<id>` entry (D1/D2, tsk-62v; `allowCrossProvider`
 * D1, tsk-32n): requires `kind` (one of `CAPACITY_KINDS`). `command`/`args`,
 * when either is present, must satisfy the same shape `validateExecutorShape`
 * already requires for an executor block — a capacity entry naming its own
 * executor is shaped exactly like one. A capacity entry naming neither is
 * valid too: it carries only `kind`/`tier`/`target` metadata and falls
 * through to `executors.<tier>`/global for the actual command (D4).
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
 * tier-to-model resolution. This field lets `resolveCapacityCli`
 * (task-dispatch only, below) substitute a capacity-specific model instead.
 *
 * `agentType`, when present, must be a non-empty string (D1/D2, tsk-3sw):
 * names a Claude Code agent definition (`.claude/agents/<name>.md`) a
 * `kind:"task"` capacity with no own `command`/`args` resolves into a real
 * `claude --agent <agentType>` invocation via, `buildAgentTypeExecutor`
 * below.
 *
 * `forceCliSpawn`, when present, must be a boolean (tsk-3ik-1, Native-First
 * Dispatch Doctrine rule 4, `docs/decisions/0026-...md`): the valid
 * "config forces cli/spawn anyway" exception (isolation, a separate
 * process/worktree/cwd) for a `kind:"task"` capacity that would otherwise be
 * native-eligible — read by `decideDispatchMechanism`/
 * `decideCapacityDispatchMechanism` below, never by `resolveExecutorConfig`
 * itself (which stays cli/spawn-only and unaware this field exists).
 */
function validateCapacityShape(capacity, label) {
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
}

function validateRunnerConfigShape(cfg, sourceLabel) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must be an object.`);
  }
  validateExecutorShape(cfg.executor, `${sourceLabel} executor`);
  // OPTIONAL per-tier executor overrides (P41/D a4fe4c2b): a tier declared
  // here dispatches through its own executor block; a tier absent from this
  // map falls back to the global `executor` above — old configs with no
  // `executors` block at all keep running unchanged (backward-compat).
  if (cfg.executors !== undefined) {
    if (!cfg.executors || typeof cfg.executors !== 'object' || Array.isArray(cfg.executors)) {
      throw new RunnerConfigError(`runner config (${sourceLabel}) "executors" must be an object mapping tier -> executor when present.`);
    }
    for (const [tier, executor] of Object.entries(cfg.executors)) {
      validateExecutorShape(executor, `${sourceLabel} executors.${tier}`);
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
      validateCapacityShape(capacity, `${sourceLabel} capacities.${capacityId}`);
    }
  }
  if (!cfg.models || typeof cfg.models !== 'object' || Array.isArray(cfg.models)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must declare a "models" object mapping tier -> model.`);
  }
  if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must declare a positive numeric "timeoutMs".`);
  }
  // OPTIONAL `parallel` block (fan-out-parallel D10) — validated the same
  // additive-optional way every field above is: absent entirely is fine (the
  // runner falls back to in-code defaults), but when present it must be an
  // object whose `maxRoots`/`maxLeavesPerRoot`, if given, are positive
  // integers. This keeps every existing `.fgos-runner.json` valid untouched.
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
 * work item omits `tier`, per D7b) to a model name via `cfg.models`. An
 * unknown tier — one work.mjs's `TIERS` allows but this config's `models`
 * map does not cover, or any other string — is a validation error: the two
 * tables must reconcile (per work.mjs's own doc comment), and dispatch time
 * is where that drift would first bite.
 */
export function modelForTier(cfg, tier) {
  const models = cfg && cfg.models;
  if (!models || typeof tier !== 'string' || !(tier in models)) {
    throw new RunnerConfigError(`no model configured for tier "${tier}".`);
  }
  return models[tier];
}

/**
 * Resolve which executor block applies for `tier`/`capacityId` (P41/D
 * a4fe4c2b, generalized capacity-aware, D4/D6 tsk-62v). Precedence (D4):
 * `capacities.<capacityId>` (only when that entry declares its own
 * `command`/`adapter` — a capacity entry naming neither is metadata-only
 * and falls through) > `executors.<tier>` > `executor` (global). No
 * `capacityId`/`tier` given at all keeps every pre-tsk-62v call site's
 * behavior identical.
 *
 * A `capacities.<capacityId>` entry naming no `command`/`adapter` of its
 * own but declaring `agentType` (D1/D2, tsk-3sw) resolves via
 * `buildAgentTypeExecutor` instead of falling all the way through to
 * `executors.<tier>`/global — still ahead of that fallback in the same
 * precedence slot `command`/`adapter` already occupy.
 *
 * For a `capacities.<capacityId>` entry declaring `kind: "cli"`, presence
 * is checked via the same in-process functions `fgos tool query` already
 * uses (`listWork`/`readLocalStatus`/`resolvedStatus`, D6) instead of
 * re-probing PATH — throws `RunnerConfigError` at resolve time, before any
 * spawn, the same "fail loud" style this function already uses for a
 * malformed executor block. This check only runs when the caller supplies
 * `fgosDir` (`spawnWorker`'s optional `opts.fgosDir`); omitted `fgosDir`
 * skips it entirely — every pre-tsk-62v call site never passes it.
 *
 * Cross-provider governance (D2/D3, tsk-32n): once the winning `executor`
 * is resolved below, a `kind: "cli"` capacity whose FINAL resolved
 * `command` is not in `CLAUDE_CLI_COMMANDS` requires
 * `capacity.allowCrossProvider === true` — absent or `false` throws
 * `RunnerConfigError` here, before any dispatch. Checked on the resolved
 * `command` (never on `capacity.kind` alone, and never on `provider`): a
 * `kind: "cli"` capacity naming no `command`/`adapter` of its own falls
 * through to `executors.<tier>`/global (D4 above), ordinarily Claude's
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

function resolveExecutorConfig(cfg, tier, capacityId, fgosDir) {
  const capacity = capacityId && cfg && cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities[capacityId] : undefined;

  if (capacity && capacity.kind === 'cli' && fgosDir) {
    const tools = listWork(fgosDir).tools ?? {};
    if (!tools[capacityId]) {
      throw new RunnerConfigError(
        `capacity "${capacityId}" declares kind "cli" but is not registered — run "fgos tool register --name ${capacityId} --kind cli --command <cmd> --capability <label>" first.`,
      );
    }
    const status = resolvedStatus(capacityId, readLocalStatus(fgosDir));
    if (status !== 'present') {
      throw new RunnerConfigError(
        `capacity "${capacityId}" is registered but not present on this machine (status: "${status}") — run "fgos tool check --name ${capacityId}" to refresh, or install it.`,
      );
    }
  }

  const byCapacity =
    capacity && (capacity.adapter || capacity.command)
      ? capacity
      : capacity && capacity.agentType && cfg && cfg.executor
        ? buildAgentTypeExecutor(cfg.executor, capacity.agentType)
        : undefined;
  const perTier = cfg && cfg.executors && typeof cfg.executors === 'object' ? cfg.executors[tier] : undefined;
  const executor = byCapacity ?? perTier ?? (cfg && cfg.executor);
  if (!executor || typeof executor.command !== 'string' || !Array.isArray(executor.args)) {
    throw new RunnerConfigError('runner config "executor" must have a string "command" and an "args" array.');
  }

  if (capacity && capacity.kind === 'cli' && !CLAUDE_CLI_COMMANDS.includes(executor.command) && capacity.allowCrossProvider !== true) {
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
  if (!hasNativeMechanism) return 'cli-spawn';
  if (forceCliSpawn) return 'cli-spawn';
  return hasLiveTaskAccess ? 'native' : 'cli-spawn';
}

/**
 * `capacities.<id>`-specific convenience over `decideDispatchMechanism`
 * above (tsk-3ik-1): derives `hasNativeMechanism` (`capacity.kind ===
 * "task"`) and `forceCliSpawn` (`capacity.forceCliSpawn`) straight from the
 * same `cfg.capacities[capacityId]` lookup `resolveExecutorConfig` already
 * does, without calling or mutating that function — this stays a read-only
 * sibling, never a second entry into the CRITICAL-blast-radius resolve path
 * (confirmed via `impact({target: "resolveExecutorConfig", direction:
 * "upstream"})`: 8 upstream symbols, 7 execution flows). `hasLiveTaskAccess`
 * is never derived here either — same caller-self-declares contract as
 * `decideDispatchMechanism` itself.
 */
export function decideCapacityDispatchMechanism(cfg, capacityId, { hasLiveTaskAccess = false } = {}) {
  const capacity = capacityId && cfg && cfg.capacities && typeof cfg.capacities === 'object' ? cfg.capacities[capacityId] : undefined;
  return decideDispatchMechanism({
    hasNativeMechanism: Boolean(capacity && capacity.kind === 'task'),
    hasLiveTaskAccess,
    forceCliSpawn: Boolean(capacity && capacity.forceCliSpawn === true),
  });
}

/**
 * Substitute `{prompt}` and `{model}` into the resolved executor's `args` —
 * PER ARRAY ELEMENT (never joined into one shell string, per the security
 * panel). `tier`, when given, selects a per-tier executor override (P41)
 * ahead of the global `cfg.executor`; `capacityId`/`fgosDir`, when given,
 * select a capacity override ahead of that (D4/D6, tsk-62v); every field
 * omitted keeps every pre-tsk-62v caller's behavior identical. Returns
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
 * orchestrator itself, never trusted from whatever the dispatched executor
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
 * `resolveCapacityCli` (task-dispatch, no worktree involved — genuinely
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

export function resolveExecutorCommand(cfg, { prompt, model, tier, capacityId, fgosDir, attestRoot } = {}) {
  // Captured BEFORE resolveExecutorConfig, not after (D3) — cheap and
  // unconditional so the same call site works regardless of whether the
  // resolved executor turns out to be same-provider or cross-provider;
  // resolveExecutorConfig below is still the sole authority on which
  // executor actually gets used.
  const attestation = captureDispatchAttestation(fgosDir, attestRoot);
  const executor = resolveExecutorConfig(cfg, tier, capacityId, fgosDir);
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
 * C9 v2 (P41/D a4fe4c2b): the executor port is now a NAMED interface —
 * `EXECUTOR_ADAPTERS` maps an adapter name to a function
 * `(command, args, cwd, opts) => Promise<{status, signal, stdout, stderr,
 * tier, model}>`. Today exactly one adapter is registered: `cli-spawn`,
 * which is this exact process-spawning body, unchanged in every behavioral
 * detail from before this cell (timeout-on-'exit', hand-tracked maxBuffer
 * kill, onChunk teed before accounting, grandchild-SIGTERM caveat still
 * applies). An `rpc`/`app-server` adapter (e.g. talking to a headless
 * agent's app-server over RPC instead of CLI argv) is deferred — not
 * registered here — until a real system needs to plug into this port; only
 * the interface's name is bought now, not a second adapter.
 */
export const DEFAULT_ADAPTER = 'cli-spawn';

function cliSpawnAdapter(command, args, cwd, opts) {
  const { timeoutMs, maxBuffer, onChunk, workId, tier, model } = opts;

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

/** C9 v2 executor-adapter registry — see `cliSpawnAdapter`'s doc comment. */
export const EXECUTOR_ADAPTERS = { [DEFAULT_ADAPTER]: cliSpawnAdapter };

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
 */
function capacityIdForWork(work) {
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
 */
export function spawnWorker(work, cfg, cwd, opts = {}) {
  // Setup stays synchronous and OUTSIDE the adapter call on purpose: a
  // malformed tier/config (RunnerConfigError, via modelForTier/
  // resolveExecutorCommand) must still throw synchronously, before any
  // process is spawned — exactly like the spawnSync-based version, and
  // exactly what dispatch.test.mjs's "throws a RunnerConfigError ... before
  // any spawn" test pins.
  const tier = work.tier ?? DEFAULTS.tier;
  const model = modelForTier(cfg, tier);
  const prompt = buildPrompt(work, opts.feedback);
  const capacityId = capacityIdForWork(work);
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

  // P49: same mechanical selection buildPrompt used internally, called again
  // here (cheap, deterministic, no duplicated LOGIC) purely so the dispatch
  // log can record which template + version produced this prompt.
  const templateName = selectTemplate({ kind: work.kind, tier, domain: work.domain });
  const templateHash = hashTemplate(templateName);

  return adapterFn(command, args, cwd, {
    timeoutMs,
    maxBuffer,
    onChunk: opts.onChunk,
    workId: work.id,
    tier,
    model,
  }).then(
    // capacityId/provider (D7, tsk-62v)/baseCommit/headRef (tsk-4hl):
    // additive only — every field this function already returned stays
    // exactly where it was.
    (result) => ({ ...result, templateName, templateHash, capacityId, provider, baseCommit, headRef }),
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
 * `resolve <capacityId>` CLI subcommand (tsk-5l2-1, design doc §4.2): lets
 * task-dispatch (an in-session skill shelling out via Bash, e.g.
 * `fgos-submit-assist`) resolve a capacity's real command/args/provider/
 * model the exact same way cli-dispatch's `spawnWorker` does — reusing
 * `resolveExecutorConfig`/`resolveExecutorCommand` verbatim, no second
 * argv-building implementation. Model resolution is the one deliberate
 * divergence from `spawnWorker` (tsk-2yp follow-up): a capacity's own
 * `model`, when declared, wins over `modelForTier(cfg, tier)` — needed
 * for a cross-provider capacity whose backend doesn't share Claude's
 * model-name vocabulary; `spawnWorker` never reads `capacity.model` and
 * keeps using `modelForTier` unconditionally. Prints `{command,args,provider,
 * model}` as JSON to stdout on success; a `RunnerConfigError` (unknown
 * capacity, not registered, not present, malformed config) prints its
 * message to stderr and exits non-zero — the same errors
 * `resolveExecutorConfig` already raises for cli-dispatch, not a new error
 * vocabulary invented for this entry point.
 *
 * `repoRoot`, when given, skips the git-based `resolveRepoRoot` lookup
 * entirely (tests pass a plain `mkdtemp` fixture dir here, the same way
 * every other test in `dispatch.test.mjs` points `fgosDir`/config paths at
 * a temp dir rather than a real git checkout).
 *
 * `model`/`tier` (tsk-2k1, D10): an ad-hoc-packet caller's own optional
 * `provider`/`tier` fields, when supplied, win over the capacity's own
 * declared `tier`/`model` and the computed `modelForTier` default — same
 * precedence a capacity's own `model` already had over `modelForTier`
 * (the divergence this doc comment already names above), extended one
 * level further out to the caller. Omitted (every pre-tsk-2k1 call site,
 * and every registered-`<CAPACITY_ID>` dispatch that never names an
 * override) leaves resolution byte-identical to before this parameter
 * existed. This is plumbing only — which tier/model a caller SHOULD pick
 * is `tsk-503`'s own judgment, not decided here.
 */
export async function resolveCapacityCli(
  capacityId,
  { prompt = '', cwd = process.cwd(), repoRoot, model: modelOverride, tier: tierOverride } = {},
) {
  if (!capacityId) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs resolve <capacityId> [--prompt <text>] [--model <name>] [--tier <name>]',
    );
  }
  const root = repoRoot ?? resolveRepoRoot(cwd);
  const fgosDir = fgosDirFromRoot(root);
  // Was a direct `ensureRunnerConfig(path.join(root, '.fgos-runner.json'))`
  // call, bypassing the shared-config-first resolution every other caller
  // in this file already uses — the one entry point still writing to the
  // legacy file even after `fgos setup` had already migrated a project to
  // `.fgos/config.json` (tsk-5vf D2). Fixed to match `bin/fgos.mjs`'s own
  // callers.
  const cfg = ensureRunnerConfigForDir(root);
  const capacity = cfg.capacities?.[capacityId];
  const tier = tierOverride ?? capacity?.tier ?? DEFAULTS.tier;
  const model = modelOverride ?? capacity?.model ?? modelForTier(cfg, tier);
  const { command, args, provider } = resolveExecutorCommand(cfg, { prompt, model, tier, capacityId, fgosDir });
  return { command, args, provider, model };
}

/**
 * `decide <capacityId>` CLI subcommand (tsk-3ik-1): lets a task-dispatch
 * consumer skill ask, before choosing whether to `exec` the `resolve`d
 * command or call its own Task tool natively, which mechanism
 * `decideCapacityDispatchMechanism` picks for this capacity right now.
 * Prints `{"mechanism": "native"|"cli-spawn"}` as JSON to stdout — same
 * additive-sibling relationship to `resolveCapacityCli` above as
 * `decideCapacityDispatchMechanism` has to `resolveExecutorConfig`: reads
 * the same committed runner config, calls nothing that also feeds
 * `resolve`'s own resolution path.
 *
 * `--has-live-task-access` is the caller's own self-declaration (never
 * probed or inferred here — same contract `decideDispatchMechanism` itself
 * documents) that this session already has live Agent/Task tool access.
 *
 * `agentType` (tsk-3ik-3, additive): included in the result, alongside
 * `mechanism`, whenever the capacity declares one — a `mechanism: "native"`
 * result is otherwise useless to a consumer skill's own Agent/Task tool
 * call, which needs a concrete `subagent_type` to invoke, not just "go
 * native" with no target. Omitted (`undefined`, dropped by `JSON.stringify`)
 * for a capacity with no `agentType`, e.g. every `kind: "cli"` capacity —
 * `mechanism` for those always resolves `"cli-spawn"` anyway (rule 1/3), so
 * no consumer ever needs `agentType` in that case.
 */
export async function decideCapacityCli(capacityId, { cwd = process.cwd(), repoRoot, hasLiveTaskAccess = false } = {}) {
  if (!capacityId) {
    throw new RunnerConfigError('usage: node src/runner/dispatch.mjs decide <capacityId> [--has-live-task-access]');
  }
  const root = repoRoot ?? resolveRepoRoot(cwd);
  const cfg = ensureRunnerConfigForDir(root);
  const mechanism = decideCapacityDispatchMechanism(cfg, capacityId, { hasLiveTaskAccess });
  const agentType = cfg.capacities?.[capacityId]?.agentType;
  return typeof agentType === 'string' && agentType ? { mechanism, agentType } : { mechanism };
}

// CLI entry point — only runs when this file is executed directly (`node
// src/runner/dispatch.mjs ...`), never on import (every existing caller
// imports named exports, none execute this module as a script).
if (import.meta.url === `file://${process.argv[1]}`) {
  const [subcommand, capacityId, ...rest] = process.argv.slice(2);
  if (subcommand === 'resolve') {
    let prompt = '';
    const promptFlagIndex = rest.indexOf('--prompt');
    if (promptFlagIndex !== -1) prompt = rest[promptFlagIndex + 1] ?? '';
    let model;
    const modelFlagIndex = rest.indexOf('--model');
    if (modelFlagIndex !== -1) model = rest[modelFlagIndex + 1];
    let tier;
    const tierFlagIndex = rest.indexOf('--tier');
    if (tierFlagIndex !== -1) tier = rest[tierFlagIndex + 1];
    resolveCapacityCli(capacityId, { prompt, model, tier }).then(
      (resolved) => {
        process.stdout.write(`${JSON.stringify(resolved)}\n`);
      },
      (err) => {
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      },
    );
  } else if (subcommand === 'decide') {
    const hasLiveTaskAccess = rest.includes('--has-live-task-access');
    decideCapacityCli(capacityId, { hasLiveTaskAccess }).then(
      (decided) => {
        process.stdout.write(`${JSON.stringify(decided)}\n`);
      },
      (err) => {
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      },
    );
  } else {
    process.stderr.write(
      `unknown subcommand ${JSON.stringify(subcommand)}. Usage: node src/runner/dispatch.mjs resolve <capacityId> [--prompt <text>] [--model <name>] [--tier <name>] | decide <capacityId> [--has-live-task-access]\n`,
    );
    process.exitCode = 1;
  }
}
