# RESEARCH.md — tsk-1up (agy dispatch reliability: timeout root cause)

## Round 1 — 2026-08-18

**Asked:** does the stderr `"Error: timeout waiting for response"` observed
on the real tsk-539 dispatch (recorded in tsk-it0's own decision log,
2026-08-18) come from (a) `dispatch.mjs`'s own outer `child_process.spawn`
timeout (`cfg.timeoutMs`, 900000ms) killing the process, or (b) the `agy`
CLI binary's own internal timeout/error text?

**Checked — repo, `src/runner/dispatch.mjs`:**
- `cliSpawnAdapter` (`src/runner/dispatch.mjs:1481-1588`): when the outer
  `timeoutMs` timer fires, it sets `timedOut = true` and calls
  `child.kill('SIGTERM')`; the `'exit'` handler then rejects with
  `DispatchError('worker-timeout', "executor timed out after ${timeoutMs}ms
  for work \"${workId}\".", ...)` (line 1568-1573) — a completely different
  string shape from the observed `"Error: timeout waiting for response"`.
- The observed stderr instead matches the `resolve({ status: code, signal,
  stdout, stderr, tier, model })` branch (line 1584) — i.e. the child
  process **exited normally** (`exit code 1`, not SIGTERM-killed) with that
  text already in its own stderr, well before the outer 900000ms timer
  could ever fire. This structurally rules out (a).

**Checked — `agy --help` (installed binary, `/home/vantt/.local/bin/agy`):**
```
--print-timeout   Timeout for print mode wait (default 5m0s)
```
`agy` (print mode, `-p`, the only mode `.fgos/config.json`'s
`runner.executors.agy.invocations[0].args` ever uses) has its **own**
internal response-wait timeout, defaulting to **5 minutes** — independent
of, and much shorter than, the outer `cfg.timeoutMs` (15 minutes). Current
config (`runner.executors.agy.invocations[0].args`:
`["-p","{prompt}","--dangerously-skip-permissions","--new-project","--model","{model}"]`)
never sets `--print-timeout`, so every real dispatch runs at agy's 5-minute
default.

**Live repro (direct binary call, isolates the exact mechanism):**
```bash
agy -p "Wait 8 seconds then reply with exactly: DONE" \
  --dangerously-skip-permissions --new-project --print-timeout 2s
# → stderr: "Error: timeout waiting for response"  (exit 1)
```
Byte-for-byte match to the real tsk-539 failure's stderr, reproduced
deterministically in ~2 seconds by setting `--print-timeout` below the
actual response time — confirms `--print-timeout` is exactly the knob
controlling this failure mode.

**Finding: root cause confirmed — layer (b), not (a).** `agy`'s own
print-mode response wait defaults to 5 minutes and is never overridden by
`.fgos/config.json`. A real coding-implementation prompt (heavier than
tsk-it0's own short `pwd` verify prompt) can legitimately take agy's
backend longer than 5 minutes to respond, well within the 15-minute outer
budget the runner already allows (`cfg.timeoutMs`) — but agy gives up on
its own before the outer timeout is ever reached. This is orthogonal to
tsk-it0's cwd bug (`--new-project`, already fixed) — a second, independent
reliability gap in the same `agy` capacity.

**Not yet checked (left for planning/executing, out of discovery's own
scope):** real-world frequency of hitting the 5-minute cap on genuine
coding-implement prompts (only one live incident on record, tsk-539); the
correct new `--print-timeout` value to configure (bounded above only by
`cfg.timeoutMs`=900000ms=15m, since the outer spawn timeout would fire
first past that); whether a retry-once policy is also warranted on top of
raising the value.

**Open:** none for discovery's own clarity question — root cause is
directly reproduced and evidenced, no further ambiguity blocks moving to
`planning`. The concrete fix (config value to set) and whether other
reliability guards (retry/circuit-breaker) are warranted is `fgos-coding-planning`'s
own scope, per the item's own text.

**Verify (real, runnable, proves the exact failure mode is controlled by
`--print-timeout`, not the item's whole eventual fix):**
```bash
bash -c 'agy -p "Wait 8 seconds then reply with exactly: DONE" --dangerously-skip-permissions --new-project --print-timeout 2s 2>&1 | grep -q "timeout waiting for response"'
```
