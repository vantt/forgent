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
import { spawnSync } from 'node:child_process';
import { DEFAULTS } from '../state/work.mjs';

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
 * verify, per D3) — the five framing sections below are a fixed contract
 * (tests pin their presence): Goal, Description, Worktree boundary,
 * Expected proof, and Constraints (the D3 "never call fgos yourself" rule).
 * Description is the work item's full-text intake description (per P30),
 * reproduced verbatim — never truncated — with "(không có)" when absent.
 * Nothing here reads or writes `.fgos/` — this is pure string assembly.
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

  return `# Goal
${work.title} (kind: ${work.kind})

# Description
${description}
${feedbackSection}
# Worktree boundary
You are running on an isolated git worktree, checked out on its own branch for
this work item only. Stay inside this checkout — never touch the main
working tree, another branch, or another worktree. Relevant refs: ${refs}.

# Expected proof
Your work is judged only by this verify command, which the runner runs
itself after you finish (your own report is never trusted on its own):
${work.verify}

# Constraints
Never call \`fgos\` yourself and never write to \`.fgos/\` directly — the
runner is the sole writer through that door during this dispatch. Commit
your changes on this branch and report; do not merge, push, or approve your
own work.
`;
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

function validateRunnerConfigShape(cfg, sourceLabel) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must be an object.`);
  }
  const executor = cfg.executor;
  if (
    !executor ||
    typeof executor !== 'object' ||
    typeof executor.command !== 'string' ||
    !executor.command.trim() ||
    !Array.isArray(executor.args) ||
    !executor.args.every((arg) => typeof arg === 'string')
  ) {
    throw new RunnerConfigError(
      `runner config (${sourceLabel}) must declare "executor.command" (non-empty string) and "executor.args" (array of strings).`,
    );
  }
  if (!cfg.models || typeof cfg.models !== 'object' || Array.isArray(cfg.models)) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must declare a "models" object mapping tier -> model.`);
  }
  if (typeof cfg.timeoutMs !== 'number' || !Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
    throw new RunnerConfigError(`runner config (${sourceLabel}) must declare a positive numeric "timeoutMs".`);
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
 * Substitute `{prompt}` and `{model}` into `cfg.executor.args` — PER ARRAY
 * ELEMENT (never joined into one shell string, per the security panel).
 * Returns `{ command, args }`, ready to hand to `spawnSync(command, args,
 * { shell: false })` unchanged.
 */
export function resolveExecutorCommand(cfg, { prompt, model }) {
  const executor = cfg && cfg.executor;
  if (!executor || typeof executor.command !== 'string' || !Array.isArray(executor.args)) {
    throw new RunnerConfigError('runner config "executor" must have a string "command" and an "args" array.');
  }
  const args = executor.args.map((arg) => {
    if (typeof arg !== 'string') {
      throw new RunnerConfigError('runner config "executor.args" entries must all be strings.');
    }
    return arg.split('{prompt}').join(prompt).split('{model}').join(model);
  });
  return { command: executor.command, args };
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
export function spawnWorker(work, cfg, cwd, opts = {}) {
  const tier = work.tier ?? DEFAULTS.tier;
  const model = modelForTier(cfg, tier);
  const prompt = buildPrompt(work, opts.feedback);
  const { command, args } = resolveExecutorCommand(cfg, { prompt, model });
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs;

  const result = spawnSync(command, args, {
    cwd,
    shell: false,
    timeout: timeoutMs,
    encoding: 'utf8',
    maxBuffer: opts.maxBuffer ?? 10 * 1024 * 1024,
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new DispatchError(
        'worker-timeout',
        `executor timed out after ${timeoutMs}ms for work "${work.id}".`,
        { workId: work.id, tier, model },
      );
    }
    throw new DispatchError(
      'worker-spawn-fail',
      `executor failed to start for work "${work.id}": ${result.error.message}`,
      { workId: work.id, tier, model, cause: result.error.message },
    );
  }

  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
    tier,
    model,
  };
}
