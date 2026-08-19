// goal-check.mjs — the goal-check primitive (per D3): run the item's own
// `verify` — the literal command string, via a shell, in the given cwd —
// and judge only by its exit status. The caller's own report (worker
// process, or a human returning an item) is never trusted on its own.
//
// Extracted from loop.mjs (stage-decompose S2-pull, cell action (3)): the
// runner calls this inside a worktree, `bin/fgos.mjs`'s `return` verb calls
// the exact same function directly in the host repo's cwd — one goal-check
// implementation, never two.

import { spawn } from 'node:child_process';

// ASYNC CONVERSION (D16 wiring surface, fan-out-parallel): converted from
// spawnSync to the event-based `spawn` API. The defined timeout contract is
// unchanged and load-bearing — a timeout RESOLVES (never rejects/throws)
// `{passed:false, status:null, ...}`, exactly what spawnSync's own
// timeout->status:null behavior already gave every caller (runOnce's
// startupReap/processItem, merge.mjs's mergeRunnerItem, bin/fgos.mjs's
// return/approve verbs) — none of them expect runGoalCheck to ever reject.
//
// tsk-53o: a timeout and a genuine verify FAILURE were both indistinguishable
// statusless outcomes (`{passed:false, status:null}`) — the same shape a
// spawn failure (the shell itself missing) already produced too. A caller
// under real load (~15 parallel sessions sharing one machine) could not tell
// "this item is actually broken" from "the check itself ran out of time" and
// parked the item `blocked` on a false negative, quoting a misleading
// `(exit null)`. `timedOut` is now always present on the resolved object
// (`true` on the timeout branch below, `false` on every other branch,
// including the spawn-failure branch) — additive only, load-bearing exactly
// like the rest of this contract: `passed`/`status`/`output` keep their
// existing meaning unchanged, and every caller must now read `timedOut`
// before treating a `!passed` result as proof the item's own verify failed.
// tsk-516: the same spawn/timeout/capture contract, addressed by a literal
// command string instead of an item. `runGoalCheck` below is now a thin
// wrapper over this, so the item's own verify and the repo-invariant checks
// (docs/history/tsk-516-approve-reverify-scope/CONTEXT.md D3) share ONE
// implementation of the timeout semantics tsk-53o pinned -- a second copy
// would be a second place for `timedOut` to drift.
export function runCommand(command, cwd, timeoutMs) {
  const maxBuffer = 10 * 1024 * 1024;
  return new Promise((resolve) => {
    // `stdin: 'ignore'` (never the 'pipe' default): a verify command that
    // checks for piped stdin (codex's own "Reading additional input from
    // stdin..." probe, tsk-3tkc) blocks forever on an open-but-unwritten
    // pipe here, since nothing in this runner ever writes to or closes
    // child.stdin -- same fix as src/runner/dispatch/transport.mjs's
    // cliSpawnAdapter.
    const child = spawn(command, { shell: true, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    let stdout = '';
    let stderr = '';
    let stdoutLen = 0;
    let stderrLen = 0;
    let settled = false;
    let timedOut = false;
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
      stdoutLen += Buffer.byteLength(chunk);
      if (stdoutLen + stderrLen <= maxBuffer) stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderrLen += Buffer.byteLength(chunk);
      if (stdoutLen + stderrLen <= maxBuffer) stderr += chunk;
    });

    // A genuine spawn failure (e.g. the shell itself missing) is not a
    // defined outcome spawnSync ever surfaced through a distinct branch here
    // either — it fell straight through to `status: null` the same way a
    // timeout does (spawnSync sets status:null on any failure-to-run). Mirror
    // that: never reject, resolve as a failed, statusless check.
    child.on('error', () => {
      finish(() => {
        resolve({ passed: false, status: null, timedOut: false, output: `${stdout}${stderr}` });
      });
    });

    // 'exit' (fires once the spawned process itself terminates), never
    // 'close' (waits for the stdio PIPES to fully close too): `verify` runs
    // via a shell (shell:true), and a shell running a single command often
    // FORKS rather than execs into it (observed with dash) — the shell
    // process can die from the timeout's SIGTERM in milliseconds while a
    // grandchild it spawned keeps the stdout/stderr pipe open for however
    // long IT keeps running. Resolving on 'close' would make a killed
    // timeout silently wait out the grandchild's full runtime — the same
    // grandchild caveat dispatch.mjs already documents for spawnWorker,
    // applying here to shell:true instead of a spawned executor tree.
    // spawnSync's own timeout returns as soon as the direct child (the
    // shell) is confirmed dead, never waiting on any grandchild — 'exit'
    // reproduces that same timing exactly.
    child.on('exit', (code) => {
      finish(() => {
        resolve({
          passed: !timedOut && code === 0,
          status: timedOut ? null : code,
          timedOut,
          output: `${stdout}${stderr}`,
        });
      });
    });
  });
}

const FGOS_HINT_RE = /\.fgos\b/;
const MISSING_RE = /ENOENT|no such file|not found/i;

/**
 * tsk-4o9: advisory-only. Returns a hint string when `output` (a failed
 * goal-check's combined stdout+stderr) looks like the verify command
 * depended on `.fgos/`'s presence -- which a detached worktree never has
 * (ADR0020; `bin/fgos.mjs`'s `return` re-verify runs inside one). Returns
 * null otherwise. Never changes pass/fail -- callers append this to an
 * already-failing friction record's own `detail`, nothing more.
 */
export function detachedWorktreeFgosHint(output) {
  if (typeof output !== 'string') return null;
  if (!FGOS_HINT_RE.test(output) || !MISSING_RE.test(output)) return null;
  return "hint: this verify command's output mentions .fgos/ together with a missing-file signal -- a detached worktree (bin/fgos.mjs's return re-verify) never carries .fgos/ (ADR0020); if that is the real cause, redesign this item's verify to check real code/behavior instead of .fgos/ presence.";
}

export function runGoalCheck(item, cwd, timeoutMs) {
  return runCommand(item.verify, cwd, timeoutMs);
}

/**
 * Run the repo-invariant checks in order, stopping at the first failure
 * (docs/history/tsk-516-approve-reverify-scope/CONTEXT.md D3/D4). Resolves
 * the same `{passed, status, timedOut, output}` shape `runCommand` does,
 * plus the `command` that actually failed so a caller can name it instead
 * of reporting an anonymous red.
 *
 * An empty `commands` list passes trivially -- that is the configured-off
 * path (an absent `invariantChecks` section), and it MUST stay behaviorally
 * identical to before this existed, for every repo that never opted in.
 */
export async function runInvariantChecks(commands, cwd, timeoutMs) {
  for (const command of commands) {
    const result = await runCommand(command, cwd, timeoutMs);
    if (!result.passed) return { ...result, command };
  }
  return { passed: true, status: 0, timedOut: false, output: '', command: null };
}

/**
 * Report a failed invariant check through the SAME
 * `{passed, status, timedOut, output}` shape a failed verify already
 * carries, so every downstream branch (the blocked move, the friction row,
 * the outcome, the merge abort, the exit status) keeps working unchanged
 * instead of growing a parallel failure path.
 *
 * The failing command is named in `output`: without it, a person reading a
 * red return or a refused merge cannot tell a repo-invariant failure apart
 * from their own item's verify failing — and that distinction is the whole
 * reason this gate is actionable rather than just another red.
 */
export function invariantFailureAsCheck(invariant) {
  return {
    passed: false,
    status: invariant.status,
    timedOut: invariant.timedOut,
    output: `repo-invariant check failed: ${invariant.command}\n${invariant.output}`,
  };
}
