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
export function runGoalCheck(item, cwd, timeoutMs) {
  const maxBuffer = 10 * 1024 * 1024;
  return new Promise((resolve) => {
    const child = spawn(item.verify, { shell: true, cwd });
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
        resolve({ passed: false, status: null, output: `${stdout}${stderr}` });
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
          output: `${stdout}${stderr}`,
        });
      });
    });
  });
}
