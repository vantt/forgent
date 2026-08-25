// dispatch/transport.mjs — adapters, spawn, attestation, tee (D7,
// tsk-2uf-1): the `DispatchError` type, worktree-dispatch attestation
// (`captureDispatchAttestation`), `resolveExecutorCommand` (the
// prompt/model → argv substitution + cross-provider gate), live per-chunk
// teeing (`teeChunk`), and the C9 v2 executor-adapter port
// (`cliSpawnAdapter`/`httpAdapter`/`EXECUTOR_ADAPTERS`). Split out of the
// former `src/runner/dispatch.mjs` (2204 lines, 6 concerns in one file) —
// pure move, no behavior change; `src/runner/dispatch.mjs` re-exports every
// name below unchanged as a barrel. See `docs/history/dispatch-activation-
// and-handoff-redesign/CONTEXT.md` D7 for the split rationale.
//
// SECURITY (security panel, unchanged from the pre-split file): the
// executor is always spawned via an argv array with `shell: false`
// (spawnSync's default) — the prompt and model are substituted
// per-array-element into `executor.args`, never concatenated into a single
// shell string. This is what keeps arbitrary shell metachars inside a work
// item's title/refs/verify text inert here (they still reach the child
// process as literal argv, never interpreted by a shell).
//
// PROCESS-GROUP KILL (closes the former GRANDCHILD-SIGTERM CAVEAT): the
// child is spawned `detached: true` (its own process-group leader), and
// every kill below targets `-pid` (the whole group) via `killChildTree`,
// not just the directly-spawned pid — a headless agent CLI that shells out
// further (e.g. `agy`) no longer survives its own parent's timeout kill.
//
// NESTED DISPATCH DEPTH CAP: an executor spawned here may itself be another
// dispatch-capable CLI that calls `node dispatch.mjs execute` again (e.g.
// `agy` fanning out its own sub-agents). `DISPATCH_DEPTH_ENV` threads a
// counter through the child's environment so that nested call can see how
// deep it already is; `MAX_DISPATCH_DEPTH` refuses the spawn outright once
// the cap is reached, rather than letting an unbounded dispatch chain fork
// forever. No live evidence of this happening yet — anticipated per the
// design, not a reaction to an observed incident.

import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { RunnerConfigError } from './config.mjs';
import { resolveExecutorConfig } from './resolve.mjs';

/** Env var a spawned child reads to know its own nested-dispatch depth,
 * threaded by `cliSpawnAdapter` on every spawn (current depth + 1) — a
 * child that never dispatches further never reads it, so this is inert
 * for the overwhelming majority of executors. */
export const DISPATCH_DEPTH_ENV = 'FGOS_DISPATCH_DEPTH';

/** Hard cap on nested out-of-process dispatch depth (user decision: no
 * observed grandchild-dispatch incident yet, capped anticipatorily). */
export const MAX_DISPATCH_DEPTH = 3;

function currentDispatchDepth() {
  const raw = process.env[DISPATCH_DEPTH_ENV];
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
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
 * Substitute `{prompt}` and `{model}` into the resolved executor's `args` —
 * PER ARRAY ELEMENT (never joined into one shell string, per the security
 * panel). `executorId`/`fgosDir`, when given, select a executor override
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
 * `executeExecutorCli` (task-dispatch, no worktree involved — genuinely
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

export function resolveExecutorEnv(rawEnv, baseEnv = process.env) {
  if (!rawEnv || typeof rawEnv !== 'object') return {};
  const resolved = {};
  for (const [k, v] of Object.entries(rawEnv)) {
    if (typeof v === 'string') {
      resolved[k] = v.replace(/\$\{([^}]+)\}/g, (_, varName) => baseEnv[varName] ?? '');
    }
  }
  return resolved;
}

export function resolveExecutorCommand(cfg, { prompt, model, tier, executorId, fgosDir, attestRoot, contentCarries, resolvedAgentType } = {}) {
  // Captured BEFORE resolveExecutorConfig, not after (D3) — cheap and
  // unconditional so the same call site works regardless of whether the
  // resolved executor turns out to be same-provider or cross-provider;
  // resolveExecutorConfig below is still the sole authority on which
  // executor actually gets used.
  const attestation = captureDispatchAttestation(fgosDir, attestRoot);
  const executor = resolveExecutorConfig(cfg, tier, executorId, fgosDir, contentCarries, resolvedAgentType);
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
    env: executor.env,
    adapter,
    provider: executor.provider ?? executor.command,
    baseCommit: attestation.baseCommit,
    headRef: attestation.headRef,
    // governance (self-review finding, 2026-08-25): resolveExecutorConfig
    // already computes this (providerFamily + egress{kind,target,content})
    // -- it was being discarded here, so the real production dispatch path
    // (spawnWorker -> loop.mjs's `executor.dispatch` event) never recorded
    // which dispatches were cross-provider, the entire stated purpose of
    // the D1/D2/D6 governance work. Additive only: every existing caller
    // that destructures a subset of this object is unaffected.
    governance: executor.governance,
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
 * registered today: `cli-spawn` (this exact process-spawning body —
 * timeout-on-'exit', hand-tracked maxBuffer kill, onChunk teed before
 * accounting, process-group kill + optional idle-timeout + nested-depth
 * cap layered on top, see this file's own header comment) and `http`
 * (`httpAdapter` below, D13's real pluggability precedent — no executor
 * dispatches through it yet, same as `cli-spawn` before `agy` existed). An
 * `rpc`/`app-server` adapter (e.g. talking to a headless agent's
 * app-server over RPC instead of CLI argv) stays deferred beyond these
 * two — this cell only proves the port is pluggable, not that every
 * conceivable mechanism needs its own adapter yet.
 */
export const DEFAULT_ADAPTER = 'cli-spawn';

/** Kill the spawned child's entire process GROUP, not just the directly-
 * spawned pid — `detached: true` at spawn time (below) makes the child its
 * own process-group leader, so `process.kill(-pid, signal)` reaches every
 * descendant it may have shelled out to (e.g. an executor CLI that itself
 * shells out further), closing the former GRANDCHILD-SIGTERM CAVEAT this
 * file used to document as an accepted limitation. Falls back to killing
 * just the child's own pid when the negative-pid form throws (no
 * process-group support on the current platform, or the child already
 * exited) — a kill attempt must never itself throw into dispatch. */
function killChildTree(child, signal) {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // already dead -- nothing left to kill
    }
  }
}

function cliSpawnAdapter(invocation, opts) {
  const { command, args, env: rawEnv } = invocation;
  const { cwd, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId, tier, model } = opts;

  const depth = currentDispatchDepth();
  if (depth >= MAX_DISPATCH_DEPTH) {
    return Promise.reject(new DispatchError(
      'dispatch-depth-exceeded',
      `executor for work "${workId}" refused: nested out-of-process dispatch depth ${depth} is already at the cap (${MAX_DISPATCH_DEPTH}) -- a dispatched executor tried to dispatch another executor too many levels deep.`,
      { workId, tier, model, depth },
    ));
  }

  const resolvedEnv = resolveExecutorEnv(rawEnv);

  return new Promise((resolve, reject) => {
    // `stdin: 'ignore'` (never the 'pipe' default): an executor that checks
    // for piped stdin (codex's own "Reading additional input from stdin..."
    // probe, tsk-3tkc) blocks forever on an open-but-unwritten pipe here,
    // since nothing in this adapter ever writes to or closes child.stdin.
    // `detached: true` + the depth counter in `env`: see killChildTree and
    // this file's own header comment.
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: { ...process.env, ...resolvedEnv, [DISPATCH_DEPTH_ENV]: String(depth + 1) },
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    let stdout = '';
    let stderr = '';
    let stdoutLen = 0;
    let stderrLen = 0;
    let settled = false;
    let timedOut = false;
    let idleTimedOut = false;
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
    let idleTimer = null;

    const clearTimers = () => {
      if (timer) clearTimeout(timer);
      if (idleTimer) clearTimeout(idleTimer);
    };

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimers();
      fn();
    };

    if (timeoutMs) {
      timer = setTimeout(() => {
        timedOut = true;
        killChildTree(child, 'SIGTERM');
      }, timeoutMs);
    }

    // IDLE TIMEOUT (opt-in via cfg.idleTimeoutMs/opts.idleTimeoutMs, never
    // armed when absent -- every pre-existing caller that never configured
    // it keeps the single-hard-cap `timeoutMs` behavior byte-identical):
    // reset on every stdout/stderr chunk, so a worker that is genuinely
    // still producing output never trips it, only one that has gone
    // completely silent for `idleTimeoutMs`. `timeoutMs` above still stands
    // as the unconditional absolute ceiling regardless of activity.
    const armIdleTimer = () => {
      if (!idleTimeoutMs) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        timedOut = true;
        idleTimedOut = true;
        killChildTree(child, 'SIGTERM');
      }, idleTimeoutMs);
    };
    armIdleTimer();

    child.stdout.on('data', (chunk) => {
      teeChunk(opts.onChunk, 'stdout', chunk);
      armIdleTimer();
      stdoutLen += Buffer.byteLength(chunk);
      if (stdoutLen + stderrLen > maxBuffer) {
        if (!maxBufferExceeded) {
          maxBufferExceeded = true;
          killChildTree(child, 'SIGTERM');
        }
        return;
      }
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      teeChunk(opts.onChunk, 'stderr', chunk);
      armIdleTimer();
      stderrLen += Buffer.byteLength(chunk);
      if (stdoutLen + stderrLen > maxBuffer) {
        if (!maxBufferExceeded) {
          maxBufferExceeded = true;
          killChildTree(child, 'SIGTERM');
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
    // spawnSync's own timeout semantics: a kill decision is made and
    // reported based on the process's own termination, never waiting out
    // however long a still-open pipe (e.g. an orphaned grandchild that
    // escaped the process-group kill) keeps it open — resolving on 'close'
    // instead would defeat the timeout.
    child.on('exit', (code, signal) => {
      finish(() => {
        if (timedOut) {
          reject(new DispatchError(
            'worker-timeout',
            idleTimedOut
              ? `executor for work "${workId}" was killed after ${idleTimeoutMs}ms with no output (idle timeout).`
              : `executor timed out after ${timeoutMs}ms for work "${workId}".`,
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

/**
 * D3/D6 (tsk-5x7-3): `herdr-spawn` executor adapter.
 * Launches the worker inside a Herdr pane instead of a stdout-captured
 * subprocess, allowing a person to watch the agent work live.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): this adapter MUST ALWAYS create a
 * fresh pane (`herdr pane split`) on every dispatch and MUST NEVER reuse an
 * existing pane. Reusing a finished worker's pane delivers the next dispatch
 * as a chat message into an idle interactive agent REPL.
 *
 * Results come back through the existing ladder (stdout captured via `herdr pane read`).
 * Selected purely by `executor.adapter === 'herdr-spawn'`.
 */
function herdrSpawnAdapter(invocation, opts) {
  const { command, args, env: rawEnv } = invocation;
  const { cwd, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId, tier, model, herdrBin: optsHerdrBin } = opts;

  const depth = currentDispatchDepth();
  if (depth >= MAX_DISPATCH_DEPTH) {
    return Promise.reject(new DispatchError(
      'dispatch-depth-exceeded',
      `executor for work "${workId}" refused: nested out-of-process dispatch depth ${depth} is already at the cap (${MAX_DISPATCH_DEPTH}) -- a dispatched executor tried to dispatch another executor too many levels deep.`,
      { workId, tier, model, depth },
    ));
  }

  const resolvedEnv = resolveExecutorEnv(rawEnv);
  const herdrBin = optsHerdrBin ?? process.env.FGOS_HERDR_BIN ?? 'herdr';
  const fullEnv = { ...process.env, ...resolvedEnv, [DISPATCH_DEPTH_ENV]: String(depth + 1) };

  return new Promise((resolve, reject) => {
    // 1. HARD CONSTRAINT (tsk-1nih): ALWAYS create a fresh pane via `herdr pane split`
    const splitArgs = ['pane', 'split', '--no-focus'];
    if (cwd) {
      splitArgs.push('--cwd', cwd);
    }
    // Resolved env into the pane itself (self-review finding, 2026-08-25):
    // `fullEnv` above only ever governed the *local* execFileSync/spawn
    // calls this adapter makes to the `herdr` CLI -- it never reached the
    // worker actually running inside the pane at all, which instead ran
    // under whatever ambient/default env that shell already had. An
    // executor declaring `ANTHROPIC_BASE_URL`/an API key/a model env would
    // dispatch to one backend while the audit event (built from the
    // RESOLVED config, per the governance-propagation fix) recorded a
    // different one -- the exact kind of gap the governance work exists to
    // close. `herdr pane split --env KEY=VALUE` (repeatable; confirmed
    // real, `docs/history/herdr-cockpit-project-root/CONTEXT.md:71`, and
    // already part of this piece's own accepted design,
    // `docs/history/dispatch-plan-protocol-redesign/plan.md:277`) sets it
    // on the pane's own shell before anything runs there.
    for (const [key, value] of Object.entries(resolvedEnv)) {
      splitArgs.push('--env', `${key}=${value}`);
    }

    let splitOutput;
    try {
      splitOutput = execFileSync(herdrBin, splitArgs, {
        cwd,
        env: fullEnv,
        encoding: 'utf8',
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      // Never interpolate err.message/err.cmd here: a non-ENOENT
      // execFileSync failure embeds the full argv in its own message
      // ("Command failed: herdr pane split --env KEY=<real-value> ..."),
      // which would leak a resolved secret into this DispatchError's own
      // message text -- and from there into whatever surface logs/reports
      // it (self-review finding: "không log secret").
      return reject(new DispatchError(
        'worker-spawn-fail',
        `executor failed to start for work "${workId}": herdr pane split failed (exit code ${err.status ?? 'unknown'}).`,
        { workId, tier, model, cause: 'herdr pane split failed', exitCode: err.status ?? null },
      ));
    }

    let paneId;
    try {
      const parsed = JSON.parse(splitOutput);
      paneId = parsed?.result?.pane?.pane_id ?? parsed?.result?.pane_id ?? parsed?.result?.root_pane?.pane_id ?? parsed?.pane_id;
    } catch {
      paneId = splitOutput ? splitOutput.trim() : null;
    }

    if (!paneId) {
      return reject(new DispatchError(
        'worker-spawn-fail',
        `executor failed to start for work "${workId}": could not parse pane_id from herdr pane split output: "${splitOutput}"`,
        { workId, tier, model, cause: 'invalid pane split output' },
      ));
    }

    // 2. Launch worker inside the newly created pane via `herdr pane run <paneId> <cmd>`
    //
    // SECURITY (self-review finding, 2026-08-25): `herdr pane run` is not a
    // spawn -- it types the given text into whatever shell is already
    // running in the pane (docs/how-to/launch-claude-in-a-new-herdr-pane-
    // from-a-plugin.md §2: "There is no shell-safe argv boundary"). The
    // prior JSON.stringify-based double-quote wrapping still let `$()`/
    // backticks inside a double-quoted shell string execute as command
    // substitution -- and `command`/`args` here can carry untrusted prompt
    // content (repo text, user text) substituted in by resolveExecutorCommand.
    // POSIX single-quote wrapping (`'` -> close-quote, escaped literal
    // quote, reopen-quote: `'\''`) is the standard way to embed an
    // arbitrary string as one shell word with ZERO interpolation --
    // nothing inside single quotes is special to a POSIX shell, not even a
    // backslash. Every token (including `command` itself, previously never
    // quoted at all) goes through this, never a regex-based "does this
    // token look dangerous" allowlist -- that heuristic is exactly what
    // let a metacharacter combination it didn't anticipate through before.
    const posixShellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
    const quotedCmd = [command, ...(args || [])].map(posixShellQuote).join(' ');

    // SIGNAL FALLBACK (self-review finding, 2026-08-25): `herdr pane
    // wait-output --regex` can ONLY detect completion by matching text the
    // dispatched agent itself chooses to print -- unlike `cliSpawnAdapter`,
    // which observes the real child process's own 'exit' event regardless
    // of what it printed. An agent that does real work (commits, edits)
    // but never emits `[DONE]`/`[BLOCKED]` -- the exact case the existing
    // ladder's `headBefore`/`headAfter` git-inference fallback exists to
    // handle -- would otherwise just sit until this adapter's own timeout
    // elapses and hard-rejects, discarding that fallback entirely (this
    // piece's own action text: "Results come back through the EXISTING
    // ladder ... this piece introduces no new result protocol"). A
    // runner-owned sentinel closes that gap without inventing a new
    // protocol: it is not a signal the worker or `[DONE]`/`[BLOCKED]`
    // ladder ever sees or needs to know about -- it only tells THIS
    // adapter "the shell command has exited", the same fact `child.on
    // ('exit')` already gives `cliSpawnAdapter` for free, plus the real
    // exit code (closes the separate P2 finding: `status` below used to
    // be `herdr pane wait-output`'s own exit code, never the worker's).
    const sentinel = `__fgos_herdr_exit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}__`;
    const fullCmd = `${quotedCmd}; echo "${sentinel}:$?"`;

    try {
      execFileSync(herdrBin, ['pane', 'run', paneId, fullCmd], {
        cwd,
        env: fullEnv,
        encoding: 'utf8',
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      return reject(new DispatchError(
        'worker-spawn-fail',
        `executor failed to start for work "${workId}": herdr pane run failed: ${err.message}`,
        { workId, tier, model, cause: err.message },
      ));
    }

    // 3. Observe completion using `herdr pane wait-output` -- either the
    // worker's own [DONE]/[BLOCKED] token (fast path, unchanged) OR the
    // sentinel above (the shell command itself has exited, whether or not
    // the worker ever signaled).
    const waitArgs = ['pane', 'wait-output', paneId, '--regex', `\\[(DONE|BLOCKED)\\]|${sentinel}:`];
    if (timeoutMs) {
      waitArgs.push('--timeout', String(timeoutMs));
    }

    const waitChild = spawn(herdrBin, waitArgs, {
      cwd,
      env: fullEnv,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let timedOut = false;
    let timer = null;

    if (timeoutMs) {
      timer = setTimeout(() => {
        timedOut = true;
        try {
          killChildTree(waitChild, 'SIGTERM');
        } catch {}
      }, timeoutMs);
    }

    waitChild.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(new DispatchError(
        'worker-spawn-fail',
        `executor failed to observe completion for work "${workId}": ${err.message}`,
        { workId, tier, model, cause: err.message },
      ));
    });

    waitChild.on('exit', (code, signal) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        reject(new DispatchError(
          'worker-timeout',
          `executor timed out after ${timeoutMs}ms for work "${workId}".`,
          { workId, tier, model },
        ));
        return;
      }

      // 4. Read scrollback output via `herdr pane read <paneId>`
      let stdout = '';
      try {
        stdout = execFileSync(herdrBin, ['pane', 'read', paneId, '--source', 'recent-unwrapped', '--lines', '500'], {
          cwd,
          env: fullEnv,
          encoding: 'utf8',
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        try {
          stdout = execFileSync(herdrBin, ['pane', 'read', paneId], {
            cwd,
            env: fullEnv,
            encoding: 'utf8',
            shell: false,
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        } catch {
          stdout = '';
        }
      }

      // P2 (self-review finding, 2026-08-25): `status` used to be `herdr
      // pane wait-output`'s OWN exit code -- a completion-watcher process,
      // never the dispatched worker's. The sentinel above always carries
      // the real one (`echo "${sentinel}:$?"`, `$?` captured immediately
      // after the real command exits) -- parsed out here and stripped from
      // the returned stdout so it never leaks into what looks like worker
      // output. Falls back to wait-output's own exit code only when the
      // sentinel line genuinely never made it into scrollback (e.g. the
      // `--lines 500` cap truncated it away) -- same as this adapter's
      // pre-existing behavior for that edge case.
      const sentinelMatch = stdout.match(new RegExp(`${sentinel}:(\\d+)`));
      const realStatus = sentinelMatch ? Number(sentinelMatch[1]) : (code === 0 ? 0 : code);
      const cleanedStdout = stdout.replace(new RegExp(`${sentinel}:\\d+\\n?`), '');

      if (onChunk && cleanedStdout) {
        teeChunk(onChunk, 'stdout', cleanedStdout);
      }

      resolve({
        status: realStatus,
        signal,
        stdout: cleanedStdout,
        stderr: '',
        tier,
        model,
        paneId,
      });
    });
  });
}

/** C9 v2 executor-adapter registry — see `cliSpawnAdapter`'s doc comment. */
export const EXECUTOR_ADAPTERS = {
  [DEFAULT_ADAPTER]: cliSpawnAdapter,
  http: httpAdapter,
  'herdr-spawn': herdrSpawnAdapter,
};
