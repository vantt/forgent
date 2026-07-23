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
import { spawn } from 'node:child_process';
import { DEFAULTS } from '../state/work.mjs';
import { selectTemplate, renderTemplate, hashTemplate } from './prompt-templates.mjs';
import { mergeConfigDefaults } from '../setup/config-merge.mjs';

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
 * description, each still pure JS conditional logic, never moved into a
 * template) and selects+renders the template via `selectTemplate`/
 * `renderTemplate`. Nothing here reads or writes `.fgos/` — this stays pure
 * string assembly, still returning a plain string (unchanged signature).
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

  const templateName = selectTemplate({ kind: work.kind, tier: work.tier ?? DEFAULTS.tier, domain: work.domain });
  return renderTemplate(templateName, {
    title: work.title,
    kind: work.kind,
    description,
    feedbackSection,
    refs,
    verify: work.verify,
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
 * Bootstrap wrapper (D1/D3) around `loadRunnerConfig`: when `configPath` does
 * not exist, writes `DEFAULT_RUNNER_CONFIG` there and announces the write
 * (executor + path) before loading. `loadRunnerConfig` itself is never
 * modified — its "rejects a missing file" contract stays intact for any
 * caller (e.g. an explicit `--config` path) that still wants a loud failure
 * on ENOENT; this wrapper is the one place that instead treats a missing
 * default path as "first run, bootstrap it."
 *
 * When `configPath` already exists (str87-fgos-setup-doctor D3), it is
 * merged against `DEFAULT_RUNNER_CONFIG` via `mergeConfigDefaults` instead of
 * left untouched: any default key the user's file is missing gets filled in
 * and the file is rewritten + the added keys announced; a file that already
 * has every default key is never rewritten.
 *
 * A write failure (permissions, read-only fs, disk full) is never caught —
 * it propagates as a normal thrown error, since a failed bootstrap write IS
 * the whole point of this call, not a side effect to shrug off.
 */
export function ensureRunnerConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, `${JSON.stringify(DEFAULT_RUNNER_CONFIG, null, 2)}\n`);
    process.stderr.write(
      `fgos: no .fgos-runner.json found — wrote a default (executor: ${DEFAULT_RUNNER_CONFIG.executor.command}) at ${configPath}; edit it to change.\n`,
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
 * Resolve which executor block applies for `tier` (P41/D a4fe4c2b): a tier
 * present in `cfg.executors` uses that block; otherwise (or with no `tier`
 * given at all, keeping every pre-P41 call site working unchanged) falls
 * back to the global `cfg.executor`.
 */
function resolveExecutorConfig(cfg, tier) {
  const perTier = cfg && cfg.executors && typeof cfg.executors === 'object' ? cfg.executors[tier] : undefined;
  const executor = perTier ?? (cfg && cfg.executor);
  if (!executor || typeof executor.command !== 'string' || !Array.isArray(executor.args)) {
    throw new RunnerConfigError('runner config "executor" must have a string "command" and an "args" array.');
  }
  return executor;
}

/**
 * Substitute `{prompt}` and `{model}` into the resolved executor's `args` —
 * PER ARRAY ELEMENT (never joined into one shell string, per the security
 * panel). `tier`, when given, selects a per-tier executor override (P41)
 * ahead of the global `cfg.executor`; omitted keeps every pre-P41 caller's
 * behavior identical. Returns `{ command, args, adapter }` — `adapter` names
 * the C9 v2 executor interface's adapter (`EXECUTOR_ADAPTERS` key) this
 * command should run through, defaulting to `DEFAULT_ADAPTER` when the
 * executor block does not declare one.
 */
export function resolveExecutorCommand(cfg, { prompt, model, tier } = {}) {
  const executor = resolveExecutorConfig(cfg, tier);
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
  return { command: executor.command, args, adapter };
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
 * Run the headless executor for `work` inside `cwd` (the worktree checkout
 * — this function never touches the main working tree itself; the caller
 * decides `cwd`). Builds the prompt, resolves tier -> model, resolves the
 * (possibly per-tier, P41) executor + its C9 v2 adapter, substitutes the
 * config template, and delegates the actual spawn to that adapter.
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
  const { command, args, adapter } = resolveExecutorCommand(cfg, { prompt, model, tier });
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
    (result) => ({ ...result, templateName, templateHash }),
    (err) => {
      if (err instanceof DispatchError) {
        err.templateName = templateName;
        err.templateHash = templateHash;
      }
      throw err;
    },
  );
}
