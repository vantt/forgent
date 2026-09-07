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
import fs from 'node:fs';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { RunnerConfigError } from './config.mjs';
import { resolveExecutorConfig } from './resolve.mjs';
import { createHerdrClient, normalizeAgentName, isReadyState } from './herdr-agent.mjs';
import { briefPaths, renderBrief, renderPointer } from './brief.mjs';
import { evaluateLadder, paneFateFor } from './liveness.mjs';

/**
 * The ladder's outcome is the precise answer; `errorClass` stays the coarse
 * vocabulary `recovery.mjs` matches on, so the recovery matrix keeps working
 * unchanged. A caller that wants the real reason reads `outcome`.
 *
 * A known seam, stated rather than hidden: `blocked` and `paused-limit` both
 * map to `worker-timeout`, so the matrix will retry them like any other
 * timeout even though neither is worth retrying immediately. Fixing that
 * means giving the matrix its own entries, which belongs with Run truth, not
 * with the adapter.
 */
const ERROR_CLASS_FOR_OUTCOME = Object.freeze({
  died: 'worker-spawn-fail',
  blocked: 'worker-timeout',
  'timed-out-idle': 'worker-timeout',
  'timed-out-ceiling': 'worker-timeout',
  'paused-limit': 'worker-timeout',
});

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
    // The args BEFORE substitution. An adapter that must NOT put the prompt on
    // a command line (herdr-spawn: the prompt goes to a file, one pointer goes
    // through the terminal) needs to know exactly which entries carried it,
    // and the `{prompt}` placeholder says so precisely where string-matching
    // the substituted result only guesses. Additive: every existing caller
    // destructures a subset of this object and is unaffected.
    argsTemplate: executor.args,
    env: executor.env,
    liveOutput: executor.liveOutput,
    interactiveMode: executor.interactiveMode,
    adapter,
    // An explicit `executor.provider` display alias (e.g. "agy") still
    // wins first — that is a deliberate, separately-tested concept distinct
    // from the model-routing family (an executor can alias to "agy" while
    // its `providerModel`/family is "gemini"). The fallback, though, used
    // to be the raw `executor.command` — ignoring `providerModel` entirely
    // and showing e.g. "claude" for glm-cli (routed to z-ai via env
    // override) or the raw non-Claude command for any executor with no
    // alias of its own. `executor.governance.providerFamily` is
    // resolve.mjs's own deriveProviderFamily(executorEntry,
    // executor.command) result, already computed correctly a few lines
    // above in resolveExecutorConfig — the correct fallback.
    // How the prompt reaches an interactive worker: `file-pointer` (default)
    // writes it to disk and types a pointer, `inline` types it whole.
    promptDelivery: executor.promptDelivery,
    provider: executor.provider ?? executor.governance.providerFamily,
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

    // RELEASE OUR OWN READ END ON EVERY SETTLE PATH (self-review finding,
    // real, 2026-08-26, confirmed live): rejecting immediately on timeout
    // (below) bounds the PROMISE, but the parent process's own event loop
    // stays alive as long as `child.stdout`/`child.stderr` remain open
    // Node-side handles — and an escaped descendant (e.g. `setsid ...
    // sleep 5 &`) inherits the pipe's write end independent of process
    // groups, so it alone can keep that pipe from ever closing. Confirmed
    // live: even with the promise settling at ~112ms, a caller that never
    // force-exits hung for the full ~5s the escaped descendant kept
    // running. Destroying our own read-side streams (never the writer's
    // problem to close) drops that handle immediately regardless of what
    // any descendant does afterward. Harmless on the normal 'close' path
    // too — the streams have already ended themselves by then.
    const releaseStdio = () => {
      try { child.stdout.destroy(); } catch {}
      try { child.stderr.destroy(); } catch {}
    };

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimers();
      releaseStdio();
      fn();
    };

    // TIMEOUT/MAXBUFFER SETTLE IMMEDIATELY ON KILL, NEVER WAIT FOR 'close'
    // (self-review finding, real, 2026-08-26, confirmed live): switching
    // normal completion to 'close' (below) fixed a real stdout-loss race,
    // but it also made a rejection that USED TO fire on the killed child's
    // own 'exit'/'close' start waiting on the SAME event instead — and
    // `killChildTree`'s process-group SIGTERM only reaches descendants
    // still in the child's own process group. A descendant that escaped it
    // (e.g. `setsid sh -c 'sleep 1' &`) keeps inheriting the stdout pipe
    // open for as long as IT runs, regardless of the SIGTERM — confirmed
    // live: `timeoutMs: 100` against `sh -c "setsid sh -c 'sleep 1' &
    // echo parent-done"` rejected worker-timeout after ~1006ms, not
    // ~100ms. `timeoutMs` is a promised ceiling on how long a caller waits
    // for an ANSWER, not on how long an escaped grandchild is allowed to
    // keep a pipe open — so the timeout/idle-timeout/maxBuffer paths each
    // settle THEMSELVES, synchronously, right after killing, with whatever
    // stdout/stderr has been captured so far. `close` (below) still owns
    // NORMAL completion (no kill involved, so no escape risk) — `finish`'s
    // `settled` guard makes it a harmless no-op on the already-settled path.
    const settleTimeout = () => {
      finish(() => {
        reject(new DispatchError(
          'worker-timeout',
          idleTimedOut
            ? `executor for work "${workId}" was killed after ${idleTimeoutMs}ms with no output (idle timeout).`
            : `executor timed out after ${timeoutMs}ms for work "${workId}".`,
          { workId, tier, model, stdout, stderr },
        ));
      });
    };
    const settleMaxBuffer = () => {
      finish(() => {
        reject(new DispatchError(
          'worker-spawn-fail',
          `executor for work "${workId}" exceeded maxBuffer (${maxBuffer} bytes) and was killed.`,
          { workId, tier, model, cause: 'maxBuffer exceeded', stdout, stderr },
        ));
      });
    };

    if (timeoutMs) {
      timer = setTimeout(() => {
        timedOut = true;
        killChildTree(child, 'SIGTERM');
        settleTimeout();
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
        settleTimeout();
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
          settleMaxBuffer();
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
          settleMaxBuffer();
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

    // 'close' (waits for the child's stdio PIPES to fully close, not just
    // the process itself to terminate), NOT 'exit' (self-review finding,
    // real, 2026-08-26): Node's own docs are explicit that 'exit' can fire
    // BEFORE all buffered stdout/stderr 'data' events have been delivered —
    // the OS pipe can still hold output at the instant the child terminates,
    // with the final 'data' event landing on a later event-loop tick. Under
    // light load this race resolves in 'data''s favor almost every time,
    // which is why this went unnoticed until a CONCURRENT dispatch test
    // (two workers' stdout competing for CPU) reproducibly captured an empty
    // `stdout` for one of them — a live-tee log silently losing entire
    // worker output under load, not a test-only artifact: `result.stdout`
    // itself would have been truncated the same way for any real caller.
    // 'close' is what Node's OWN `child_process.exec`/`execFile` wait for
    // internally, for exactly this reason. Only the NORMAL completion path
    // waits for it now — timeout/idle-timeout/maxBuffer each settle
    // themselves the instant they kill (see settleTimeout/settleMaxBuffer
    // above), so this handler firing after one of them already has is
    // always a no-op via `finish`'s `settled` guard.
    child.on('close', (code, signal) => {
      finish(() => {
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
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery } = invocation;
  const {
    exitCommand,
    kind,
    readyTimeoutMs = DEFAULT_READY_TIMEOUT_MS,
    promptTimeoutMs = DEFAULT_PROMPT_TIMEOUT_MS,
    maxResends = DEFAULT_MAX_RESENDS,
    resendAfterMs,
    usageLimitPatterns,
  } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
  } = opts;

  const depth = currentDispatchDepth();
  if (depth >= MAX_DISPATCH_DEPTH) {
    return Promise.reject(new DispatchError(
      'dispatch-depth-exceeded',
      `executor for work "${workId}" refused: nested out-of-process dispatch depth ${depth} is already at the cap (${MAX_DISPATCH_DEPTH}) -- a dispatched executor tried to dispatch another executor too many levels deep.`,
      { workId, tier, model, depth },
    ));
  }

  // herdr launches the canonical executable for a kind; `command` only tells
  // us which kind that is. An unrecognized kind is herdr's own refusal, and
  // it is reported as one -- never silently downgraded to typing at a shell.
  const agentKind = kind ?? (command ? path.basename(command) : null);
  if (!agentKind) {
    return Promise.reject(new DispatchError(
      'invalid-config',
      `executor for work "${workId}" refused: herdr-spawn needs an agent kind -- declare interactiveMode.kind, or a command whose basename names one.`,
      { workId, tier, model },
    ));
  }

  const resolvedEnv = resolveExecutorEnv(rawEnv);
  const herdrBin = optsHerdrBin ?? process.env.FGOS_HERDR_BIN ?? 'herdr';
  const fullEnv = { ...process.env, ...resolvedEnv, [DISPATCH_DEPTH_ENV]: String(depth + 1) };
  const delivery = promptDelivery ?? 'file-pointer';

  return runHerdrRound({
    client: createHerdrClient({ herdrBin, cwd, env: fullEnv }),
    agentKind,
    agentArgs: agentArgsWithoutPrompt({ argsTemplate, args, prompt, model }),
    prompt: prompt ?? '',
    delivery,
    exitCommand,
    readyTimeoutMs,
    promptTimeoutMs,
    maxResends,
    resendAfterMs: resendAfterMs ?? promptTimeoutMs,
    runDir: optsRunDir,
    paneEnv: resolvedEnv,
    cwd,
    timeoutMs,
    idleTimeoutMs,
    usageLimitPatterns,
    closeAlways,
    workId,
    tier,
    model,
    onChunk,
  });
}

/** herdr's own stall detector fires at 5000ms; anything shorter on this side
 * wins the race and hands the caller a bare timeout instead of the real
 * reason. Measured upstream: 5s broke, 20s worked. */
const DEFAULT_PROMPT_TIMEOUT_MS = 20000;
/** `agent start`'s own documented default. */
const DEFAULT_READY_TIMEOUT_MS = 30000;
/** A brief that never landed is worth re-sending a couple of times; a brief
 * that never lands twice is a broken transport, not a slow one. */
const DEFAULT_MAX_RESENDS = 2;
/** How often the receipt poll looks at the outbox. */
const RECEIPT_POLL_MS = 500;
/** How long the exit sequence waits for the agent process to actually leave
 * the pane before giving up and closing anyway. */
const EXIT_DRAIN_MS = 10000;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * The agent's own argv, with the prompt taken out of it.
 *
 * `argsTemplate` is the executor's args BEFORE substitution, so an entry that
 * carried the prompt is identifiable exactly -- by the `{prompt}` placeholder
 * itself, not by string-matching the substituted result. The fallback for a
 * caller that passes no template compares against the prompt text, which is
 * long and unique enough to be reliable but is a fallback, not the contract.
 */
function agentArgsWithoutPrompt({ argsTemplate, args, prompt, model }) {
  if (Array.isArray(argsTemplate)) {
    return argsTemplate
      .filter((arg) => typeof arg === 'string' && !arg.includes('{prompt}'))
      .map((arg) => arg.split('{model}').join(model ?? ''));
  }
  const effective = Array.isArray(args) ? args : [];
  if (!prompt) return effective;
  return effective.filter((arg) => !String(arg).includes(prompt));
}

/** The last line on screen with anything on it -- what a person would read to
 * see why an agent is blocked. Screen text explains a failure; it never
 * establishes that work happened. */
function lastScreenLine(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines[lines.length - 1] : null;
}

/**
 * One round: pane, agent, brief, receipt, exit.
 *
 * Every failure below keeps the pane open and names its reason, so three
 * genuinely different transport failures stay three different answers rather
 * than collapsing into one timeout: the agent never became ready, the brief
 * was never accepted, or the agent is sitting on a prompt it cannot pass.
 */
async function runHerdrRound(ctx) {
  const {
    client, agentKind, agentArgs, prompt, delivery, exitCommand,
    readyTimeoutMs, promptTimeoutMs, maxResends, resendAfterMs,
    paneEnv, cwd, timeoutMs, idleTimeoutMs, usageLimitPatterns, closeAlways,
    workId, tier, model, onChunk,
  } = ctx;

  const round = 1;
  const runDir = ctx.runDir
    ? path.resolve(ctx.runDir)
    : fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-'));
  const paths = briefPaths(runDir, round);
  fs.mkdirSync(paths.outbox, { recursive: true });

  const agentName = normalizeAgentName(`fgos-${workId ?? 'run'}-${Date.now().toString(36)}`);
  const briefText = renderBrief({ prompt, round, runDir, agentName });
  fs.writeFileSync(paths.briefPath, briefText);

  let paneId = null;
  const fail = (errorClass, reason, message, extra = {}) => new DispatchError(
    errorClass,
    message,
    { workId, tier, model, reason, paneId, runDir, agentName, ...extra },
  );

  try {
    paneId = client.paneSplit({ cwd, env: paneEnv });
  } catch (err) {
    throw fail('worker-spawn-fail', err.code ?? 'pane_split_failed',
      `executor failed to start for work "${workId}": herdr could not open a pane (${err.code ?? 'unknown'}): ${err.message}`);
  }

  try {
    client.agentStart(agentName, { kind: agentKind, paneId, timeoutMs: readyTimeoutMs, agentArgs });
  } catch (err) {
    // The pane stays open on purpose: whatever stopped the agent from
    // becoming ready is still on that screen.
    throw fail('worker-spawn-fail', err.code ?? 'agent_not_ready',
      `executor failed to start for work "${workId}": herdr could not bring a "${agentKind}" agent to ready in pane ${paneId} (${err.code ?? 'unknown'}): ${err.message}`);
  }

  // One line so a person watching the runner's own stderr can find the pane
  // to watch and the directory the round's files will appear in. Diagnostic
  // only -- nothing reads it back.
  process.stderr.write(`fgos: herdr-spawn work=${workId} pane=${paneId} agent=${agentName} runDir=${runDir}\n`);

  // What actually gets typed. `file-pointer` is the default because one shape
  // works for every agent kind; `inline` is a declared choice with its own
  // evidence, not a fallback taken when something goes wrong.
  const message = delivery === 'inline' ? briefText : renderPointer({ runDir, round });

  const deliver = () => {
    try {
      // `--until working` confirms the submission was accepted and the turn
      // began. Waiting for a settled state instead would block this call for
      // the entire turn, and the turn is what the receipt poll is for.
      client.agentPrompt(agentName, message, { wait: true, until: ['working'], timeoutMs: promptTimeoutMs });
      return null;
    } catch (err) {
      return err;
    }
  };

  const promptError = deliver();
  if (promptError) {
    let screen = null;
    if (promptError.code === 'agent_blocked') {
      try { screen = lastScreenLine(client.agentRead(agentName, { lines: 40 })); } catch { screen = null; }
    }
    throw fail('worker-spawn-fail', promptError.code ?? 'agent_prompt_failed',
      `executor failed to brief the worker for work "${workId}": ${promptError.message}${screen ? ` -- last line on screen: ${screen}` : ''}`,
      screen ? { screen } : {});
  }

  // A liveness probe that FAILS reports `unknown`, never `absent`. A pane
  // that still exists proves nothing about the agent: an idle pane always
  // lists its own shell, so "agent present" means a foreground process that
  // is not the shell.
  const readLiveness = () => {
    try {
      const info = client.paneProcessInfo(paneId);
      return info.foregroundProcesses.some((p) => p.pid && p.pid !== info.shellPid)
        ? 'present'
        : 'absent';
    } catch {
      return 'unknown';
    }
  };

  // Receipt, not status. The ack proves the worker read the brief; the result
  // file ends the round. A round short enough to produce the result before the
  // first poll never shows an ack, and that is not a failure.
  const startedAt = Date.now();
  let ackSeen = false;
  let resends = 0;
  let lastResendAt = startedAt;
  let lastProgressAt = null;
  let ladderPrior = { absentStreak: 0 };
  let screen = null;
  let decision = { outcome: null };

  for (;;) {
    const resultFilePresent = fs.existsSync(paths.resultPath);
    if (!ackSeen && fs.existsSync(paths.ackPath)) {
      ackSeen = true;
      lastProgressAt = Date.now();
    }

    let agentState = 'unknown';
    try { agentState = client.agentGet(agentName).agentStatus; } catch { agentState = 'unknown'; }
    // `working` is a progress signal and nothing more. It never concludes a
    // round -- only the worker's own result file does that.
    if (agentState === 'working') lastProgressAt = Date.now();

    decision = evaluateLadder({
      observation: {
        resultFilePresent,
        liveness: readLiveness(),
        agentState,
        lastProgressAt,
        startedAt,
        now: Date.now(),
        screen,
      },
      limits: { idleTimeoutMs, ceilingMs: timeoutMs, usageLimitPatterns },
      prior: ladderPrior,
    });
    ladderPrior = decision;

    // The ladder asks for the screen only once progress has stopped, and
    // settles on the very next pass with it in hand -- so this never becomes
    // a screen read per tick.
    if (decision.needsScreen) {
      try { screen = client.agentRead(agentName, { lines: 60 }); } catch { screen = ''; }
      continue;
    }
    screen = null;

    if (decision.outcome) break;

    if (!ackSeen && resends < maxResends && Date.now() - lastResendAt >= resendAfterMs) {
      // Re-send only when the agent is back at rest with still no ack. An
      // agent that is `working` has the brief and is acting on it; typing at
      // it again on a timer would interrupt the very turn being waited for.
      if (isReadyState(agentState)) {
        resends += 1;
        lastResendAt = Date.now();
        const retryError = deliver();
        if (retryError) {
          throw fail('worker-spawn-fail', retryError.code ?? 'agent_prompt_failed',
            `executor failed to re-brief the worker for work "${workId}" (attempt ${resends + 1}): ${retryError.message}`);
        }
      }
    }

    await sleep(RECEIPT_POLL_MS);
  }

  if (decision.outcome !== 'settled') {
    // Any wait that gives up reads the screen on the way out, so the caller
    // gets a line it can quote instead of the word "timeout". This costs one
    // read on a round that has already failed, so a false positive costs
    // nothing.
    let screenLine = decision.screenLine;
    if (!screenLine) {
      try { screenLine = lastScreenLine(client.agentRead(agentName, { lines: 60 })); } catch { screenLine = null; }
    }
    if (paneFateFor(decision.outcome, { closeAlways }) === 'close') {
      client.paneClose(paneId);
    }
    throw fail(
      ERROR_CLASS_FOR_OUTCOME[decision.outcome] ?? 'worker-timeout',
      decision.outcome,
      `executor for work "${workId}" ended as ${decision.outcome}: ${decision.reason}.${
        screenLine ? ` Last line on screen: ${screenLine}` : ''
      }${paneFateFor(decision.outcome, { closeAlways }) === 'keep' ? ` Pane ${paneId} is left open.` : ''}`,
      { outcome: decision.outcome, ...(screenLine ? { screen: screenLine } : {}) },
    );
  }

  let stdout = '';
  try {
    stdout = fs.existsSync(paths.reportPath)
      ? fs.readFileSync(paths.reportPath, 'utf8')
      : fs.readFileSync(paths.resultPath, 'utf8');
  } catch {
    stdout = '';
  }

  // Exit sequence. The agent is asked to leave, then the pane is watched until
  // nothing but its own shell is running in the foreground -- an agent that
  // has not finished tearing down would swallow anything sent after it.
  //
  // Closing a pane is not cancelling a worker: measured, the foreground
  // process dies and a `setsid` descendant survives it. Nothing below reports
  // this round as cancelled, and nothing should.
  try {
    client.agentPrompt(agentName, exitCommand, { wait: false, timeoutMs: promptTimeoutMs });
  } catch {
    // A worker that already produced its result but will not take /exit is
    // still a completed round; the pane close below is what actually ends it.
  }

  const drainDeadline = Date.now() + EXIT_DRAIN_MS;
  while (Date.now() < drainDeadline) {
    if (readLiveness() !== 'present') break;
    await sleep(250);
  }

  if (onChunk && stdout) {
    teeChunk(onChunk, 'stdout', stdout);
  }

  client.paneClose(paneId);

  return {
    status: 0,
    signal: null,
    stdout,
    stderr: '',
    tier,
    model,
    paneId,
    runDir,
    resultPath: paths.resultPath,
    outcome: 'settled',
  };
}

function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
}

/** C9 v2 executor-adapter registry — see `cliSpawnAdapter`'s doc comment. */
export const EXECUTOR_ADAPTERS = {
  [DEFAULT_ADAPTER]: cliSpawnAdapter,
  http: httpAdapter,
  'herdr-spawn': herdrSpawnAdapter,
};
