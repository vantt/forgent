# plan.md — tsk-129: dispatch decide/execute progress visibility

Mode: tiny

## Approach

**Chosen path.** Wire the already-existing, already-tested P39 live-tee
mechanism (`opts.onChunk`, `RESEARCH.md` Round 1) into the ONE place that
never uses it today: the bare CLI entrypoint's `execute` subcommand branch
(`src/runner/dispatch.mjs:2140`, `if (subcommand === 'execute') { ... }`).
Pass an `onChunk` that writes each live stdout/stderr chunk from the
spawned child straight to this process's own `stderr`, as it arrives —
reusing the exact same hook `src/runner/loop.mjs` already wires to
`appendWorkerLogChunk` for the headless runner (`RESEARCH.md` Round 1),
just pointed at the terminal instead of a log file. `stdout` keeps
carrying only the single final `JSON.stringify(executed)` line, unchanged —
a scripted caller parsing `stdout` as JSON never sees a difference.

**Alternatives rejected:**
- *Invent a new progress-reporting mechanism* (spinner, structured
  progress events) — rejected: P39 (`teeChunk`/`onChunk`) already exists,
  is already tested at the `spawnWorker`/adapter layer, and is already
  proven in production by `loop.mjs`. Building a second mechanism next to
  an untouched existing one would be pure duplication (YAGNI).
- *Also change `decide`* — rejected: `RESEARCH.md` confirms `decideExecutorCli`
  is a synchronous, no-spawn resolution over already-loaded config/state.
  There is no in-flight period for it to signal; adding output there would
  be noise, not a fix for a real gap. `decide`'s own single final JSON
  line stays as-is.

**Risk map:**

| Component | Risk | Proof |
|---|---|---|
| CLI `execute` branch wiring (`dispatch.mjs:~2140`) | light | manual `rg` cross-check (below) shows exactly one production call site of `executeExecutorCli` — the branch being edited itself; new test asserts the real CLI subprocess tees live chunks to stderr while `stdout` still carries exactly one parseable JSON line |
| Existing `executeExecutorCli`/adapter test coverage (`test/runner/dispatch.test.mjs`) | none — unaffected | those ~15 tests call `executeExecutorCli` directly with `repoRoot`, never through the CLI `if (import.meta.url === ...)` block being edited, so they exercise a code path this change does not touch |

**Files likely touched:**
- `src/runner/dispatch.mjs` — add `onChunk` to the `execute` CLI branch's
  call to `executeExecutorCli` (~5 lines).
- `test/runner/dispatch.test.mjs` — one new test, real subprocess
  (`spawnSync('node', ['src/runner/dispatch.mjs', 'execute', ...])`)
  against a fake multi-chunk executor script (the repo already has a
  `writeMultiChunkExecutor` helper, `RESEARCH.md` Round 1 citation), plus
  a second test asserting `decide`'s CLI output is unchanged from asserting
  no new stderr output when there's no chunk to tee.

**Order:** single piece, no ordering dependency — `fgos graph --json`'s
`criticalPath`/`topUnblock` were checked and return nothing relevant (this
item unblocks no other open item; it has no dependents in the current
graph), so ordering-by-graph-evidence has nothing to add over the natural
single-piece order (write test, wire the CLI branch, run it).

**Impact-analysis posture:** *degraded* — `fgos tool query --capability
impact-analysis --status present` returns `gitnexus` as `present`
(CLAUDE.md gate), but a direct `impact({target: "executeExecutorCli",
direction: "upstream"})` query came back `"Target 'executeExecutorCli' not
found"` (0 results) against a stale index (last indexed `7bb3231`, per this
session's own SessionStart hook) — a "not found" the repo's own gate names
explicitly as worth a grep cross-check before trusting. Cross-checked
manually instead (`rg -n "executeExecutorCli\b"` across `**/*.mjs`,
excluding this worktree's own copy): exactly one production call site
(`dispatch.mjs:2141`, the very branch this plan edits) and ~15 direct test
calls in `dispatch.test.mjs` that bypass the CLI block entirely. This is
the plan's real blast-radius evidence for this light-risk item, not the
stale GitNexus index.

## Shape

No split. One piece is honestly enough — a single wiring change in one
function's one call site plus its own test, `tiny` lane, a direct note not
a phased plan:

1. Add a new test to `test/runner/dispatch.test.mjs`: spawn
   `node src/runner/dispatch.mjs execute <fake-multi-chunk-executor-id>`
   as a real subprocess (mirroring the existing
   `executeExecutorCli prints a "fgos: dispatch ..." chokepoint line to
   stderr`-style tests already in that file, `RESEARCH.md` citation), and
   assert: (a) `stderr` contains the fake executor's intermediate chunks
   *before* the process exits — proving live teeing, not just a final
   dump; (b) `stdout` still contains exactly one line that parses as the
   same JSON shape `executeExecutorCli` already returns — proving the
   scripted-caller contract is untouched.
2. Wire `onChunk: (stream, chunk) => process.stderr.write(chunk)` into the
   `execute` branch's call to `executeExecutorCli` (`dispatch.mjs:2141`).
   No change to the `decide` branch, no change to `executeExecutorCli`'s
   own signature (the `onChunk` option already exists — this only supplies
   an argument at one call site that previously omitted it).

Concrete cases to prove: multi-chunk output arrives incrementally, not
only at the end (the whole point); a single-chunk / instant executor still
works with zero regressions (existing tests already cover this shape,
unaffected per the risk map); `stdout`'s final JSON line stays exactly one
line, byte-parseable, whether or not any chunk was teed.

## Outstanding questions

None
