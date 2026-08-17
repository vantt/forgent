# RESEARCH — tsk-129: dispatch decide/execute progress visibility

## Round 1 (2026-08-17, discovery)

**Asked:** Does `node src/runner/dispatch.mjs decide` / `execute` currently
emit any in-flight progress signal (log line, chunk, status print) while
running, or only a final result?

**Checked:** `src/runner/dispatch.mjs`, whole file (2197 lines) — the CLI
entrypoint block (`if (import.meta.url === ...)`, lines 2126-2197),
`executeExecutorCli` (1828-1955), `decideExecutorCli` (2025-2124),
`cliSpawnAdapter`/`teeChunk` (1447-1545+), and
`test/runner/dispatch.test.mjs`'s existing `onChunk` coverage
(lines ~2440-2493).

**Found:**

- CLI entrypoint (`dispatch.mjs:2126-2197`): both `execute` and `decide`
  branches call their function then write exactly ONE line to `stdout`
  once the returned promise settles (`process.stdout.write(JSON.stringify(...))`),
  or one line to `stderr` on error. Nothing is printed in between call and
  settle.
- `decideExecutorCli` (`dispatch.mjs:2025`) is a pure, synchronous-shaped
  resolution over `.fgos/config.json` — no child process, no I/O beyond
  reading committed config/state. It returns effectively instantly. Silence
  during `decide` is *expected*, not a gap — there is no "in-flight" period
  to signal.
- `executeExecutorCli` (`dispatch.mjs:1828`), `mechanism === 'out-of-process'`
  path: DOES write one diagnostic line to `stderr` right before spawning
  (`fgos: dispatch capability=... executor=... via=... provider=... model=... tier=...`,
  line ~1951) — so a start signal exists. But after that single line,
  nothing prints again until `await adapterFn(...)` resolves — for a
  slow/long-running spawned command (the documented case: `agy`), this can
  be a multi-minute silent gap.
- The live-streaming mechanism to close that gap ALREADY EXISTS and is
  already tested: P39 (`teeChunk`, `dispatch.mjs:1447`) — `cliSpawnAdapter`
  calls `opts.onChunk(stream, chunk)` synchronously on every child
  stdout/stderr `'data'` event, wrapped in try/catch so a broken callback
  never crashes dispatch. `executeExecutorCli` already threads an `onChunk`
  option straight through to the adapter (line 1841, 1951).
  `test/runner/dispatch.test.mjs` (`spawnWorker calls opts.onChunk for
  every stdout/stderr data event...`) proves this mechanism works at the
  `spawnWorker`/adapter layer.
  `src/runner/loop.mjs` (headless runner) already wires it:
  `onChunk: (stream, chunk) => appendWorkerLogChunk(dir, item.id, chunk)`
  (lines 819, 1201) — writes live chunks to `.fgos/logs/<id>.log`, so
  `tail -f` shows progress for a headless worker.
- **The gap:** the bare CLI entrypoint block (`execute` subcommand, line
  ~2140) calls `executeExecutorCli(executorId, {...})` with NO `onChunk`
  passed at all. The already-built, already-tested live-tee mechanism is
  simply never wired up for the one invocation shape AGENTS.md's Dispatch
  section actually documents (`node src/runner/dispatch.mjs execute ...`
  run directly by a person/session). No new mechanism needs inventing —
  the fix is wiring the existing `onChunk` hook to write live chunks
  somewhere visible (stderr, to keep `stdout`'s single final JSON line
  parseable by scripted callers) in that one CLI branch.

**Still open (for planning):** exact destination/format for the live-teed
output — direct `process.stderr.write` per chunk (simplest, matches the
existing one-line diagnostic already on stderr) vs. a prefixed/throttled
form; whether `decide`'s CLI branch also deserves a one-line "resolving..."
print for consistency even though it has no in-flight period to signal.
These are implementation-shape choices, not discovery-stage ambiguities —
the goal itself (make in-flight `execute` visible, reusing the existing
P39 mechanism) is clear.

**Verdict:** `clear`. Verify (real, runnable, proves the wiring lands in
the right place and nothing else regresses):

```bash
grep -A8 "subcommand === 'execute'" src/runner/dispatch.mjs | grep -q "onChunk" && npm test
```
