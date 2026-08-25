# RESEARCH — fanout-batch-per-child-sync-spawn-and-listwork (tsk-2ewi)

## Round 1 — 2026-08-24

**Asked:** Two goals: (A) whether the three sub-claims tsk-2ewi's own
description makes about `fanoutBatchExecutorCli` (per-child synchronous
`execFileSync` spawns for `pick`/`return`, per-child `listWork` re-read,
synchronous git attestation) are still accurate on current `main` now that
tsk-5v3 (a dependency of this item, already merged per `git log` —
"Merge branch 'fgw/tsk-5v3'") has landed; (B) whether `pick`/`return`
(or the code they call) rely on real process isolation (a fresh
subprocess's own `cwd`) in a way that would need preserving if converted
to in-process calls.

**Checked:**
- `src/runner/dispatch/cli.mjs` — `fanoutBatchExecutorCli` (def at line
  731, read in full 731-871).
- `src/runner/dispatch/transport.mjs` — `captureDispatchAttestation`
  (line 113) and its caller `resolveExecutorCommand` (line 129).
- `bin/fgos.mjs` — `case 'pick':` (line 3001-3058) full handler.
- `src/runner/worktree.mjs` — the live-session-guard comment at
  lines 403-418 documenting this codebase's own `process.cwd()` invariant.
- `docs/history/fanout-batch-dispatch-sequential-loop/plan.md` and
  `RESEARCH.md` — tsk-5v3's own plan/research, to confirm what tsk-5v3
  actually changed vs. what it left untouched.
- `grep -rn "process.chdir"` across `src/` and `bin/` — zero hits outside
  one explanatory comment (worktree.mjs:409), confirming this codebase
  never calls it.
- `grep -rln "attestation"` across `src/` — narrowed to
  `attestation-guard.mjs` (a DIFFERENT mechanism, runner-loop-only,
  checked async in `loop.mjs:399`) vs. `dispatch/transport.mjs`'s
  `captureDispatchAttestation` (the one tsk-2ewi's description actually
  means — dispatch-time, level-1 advisory, per
  `docs/explanation/worktree-dispatch-attestation-level-1-advisory-only.md`).

**Found:**

1. **Sub-claim 1 (execFileSync pick/return, synchronous) — CONFIRMED,
   unaffected by tsk-5v3.** `cli.mjs:787` (`pick`) and `:822` (`return`)
   are still `execFileSync(process.execPath, [BIN_FGOS_PATH, ...], {...})`
   calls. tsk-5v3's own fix (see finding 4 below) wrapped the per-child
   body in `Promise.allSettled(batchToRun.map(async (candidateId) => {
   ... }))` — this parallelizes the `await`s around the async
   `executeExecutorCli` I/O, but `execFileSync` blocks Node's single
   event loop for its whole duration regardless of which `async` closure
   it runs inside. tsk-2ewi's own description already anticipated this
   exact distinction ("execFileSync là đồng bộ, không await được") — still
   true after tsk-5v3.

2. **Sub-claim 2 (`listWork` re-read per child) — CONFIRMED.**
   `cli.mjs:744` calls `listWork(fgosDir)` once, for the room-check only.
   `cli.mjs:761`, INSIDE the per-child `.map(async (candidateId) => {...`
   closure, calls `listWork(fgosDir).work[candidateId]` again — a second,
   full-state re-read per candidate in `batchToRun`, unchanged by tsk-5v3
   (tsk-5v3's plan.md scoped itself to the loop's concurrency shape only,
   never touched this read).

3. **Sub-claim 3 (git attestation synchronous) — CONFIRMED.**
   `transport.mjs:113-127`'s `captureDispatchAttestation` calls
   `execFileSync('git', args, {...})` twice (`rev-parse HEAD`,
   `symbolic-ref --short -q HEAD`) inside a try/catch that swallows
   errors (fail-safe by design, per its own doc comment — "advisory
   metadata, not a precondition"). It is invoked unconditionally, at the
   top of `resolveExecutorCommand` (`transport.mjs:135`), which
   `executeExecutorCli` calls before every dispatch — so every one of
   `fanoutBatchExecutorCli`'s per-child dispatches still pays two
   synchronous `git` subprocess spawns, blocking. Note: this is a
   DIFFERENT mechanism from `attestation-guard.mjs`'s
   `checkDispatchAttestation` (async-context, runner-loop-only,
   `loop.mjs:399`) — the item's description means the dispatch-time
   capture, not the runner-loop reaper check.

4. **What tsk-5v3 actually changed:** confirmed via its own
   `docs/history/fanout-batch-dispatch-sequential-loop/plan.md` — it
   converted the per-child `for` loop into `Promise.allSettled(...)`
   over `batchToRun`, addressing ONLY that the batch was dispatched one
   candidate fully-at-a-time (`await`ed in sequence) instead of
   concurrently. tsk-2ewi's own description already named this exact
   distinction from itself ("khác cơ chế: tsk-5v3 nhắm executeExecutorCli
   tuần tự, đây nhắm 2 subprocess spawn execFileSync mỗi child") — this
   round confirms tsk-5v3's fix and tsk-2ewi's three findings are
   genuinely non-overlapping; tsk-5v3 did not incidentally fix any of
   tsk-2ewi's three sub-claims.

5. **Process-isolation dependency (goal B) — partial answer, mixed.**
   `pick`'s own handler (`bin/fgos.mjs:3001-3058`) derives `repoRoot =
   path.dirname(dir)` from the explicit `--dir` flag, NOT from
   `process.cwd()` — a comment at `bin/fgos.mjs:3026-3031` explains this
   was a deliberate fix (tsk-k8u) specifically so a claim-release +
   re-pick running from inside the very worktree being torn down never
   targets git operations at that doomed cwd. This means `pick` itself
   does not lean on "a subprocess gets its own fresh cwd" for its own
   correctness — an in-process call passing the same `--dir`-equivalent
   root explicitly would behave identically. HOWEVER, this codebase's own
   documented invariant (`worktree.mjs:403-418`, a comment attached to an
   orphan-worktree-reclaim guard used by `approve`) states plainly:
   "`fgos`'s own shell wrapper... never `cd`s before invoking `node
   bin/fgos.mjs`, and this codebase never calls `process.chdir()`, so
   `process.cwd()` at the moment `approve` runs is always the real, live
   cwd of whatever session/shell invoked it" — i.e. at least one other
   verb-adjacent code path (the orphan-reclaim guard) trusts
   `process.cwd()` as a per-invocation, per-process signal. Today, each
   `fgos pick`/`fgos return` child call gets a genuinely fresh
   `process.cwd()` for free because `execFileSync` spawns a new OS
   process per call, with `cwd: wtPath` passed explicitly for the
   `return` call (`cli.mjs:823`) and default parent-cwd for `pick` (which
   does not need per-item cwd, per finding above). Converting to an
   in-process call (one shared Node process handling all N children)
   would make `process.cwd()` a SINGLE shared value across concurrent
   per-child calls, not N independent ones — a real hazard if `return`'s
   own execution path (or anything downstream, e.g. its own verify run)
   reads `process.cwd()` rather than an explicit path argument anywhere
   in that call graph. This round confirmed `pick`'s own top-level
   handler is clean; it did NOT trace `return`'s full call graph or every
   downstream `verify`-run path for the same property — that remains
   open (see below).

**Still open (not resolved this round, out of this round's scope):**
- Whether `return`'s own handler (`bin/fgos.mjs`, `case 'return':` at
  line 3069 onward) or anything it calls (the item's own `verify` command
  execution in particular) reads `process.cwd()` anywhere instead of an
  explicit path — not traced this round; needed before an in-process
  conversion could be judged safe for `return`, not just `pick`.
- Whether `hasWorkerSlotRoom`'s single upfront `listWork` call (line 744)
  and the per-child re-read (line 761) could safely collapse to one
  shared `view` object passed into each child closure, or whether staleness
  between the two reads is load-bearing for some reason not yet checked.

**Verdict for this round:** `clear` on goal A (all three sub-claims
independently confirmed against current `main`, with exact current line
numbers and confirmation that tsk-5v3 did not address any of them).
Goal B is a real, concrete, partially-open finding (not a blocker to
discovery's own verdict, since tsk-2ewi's own description already frames
itself as "design-check chứ không phải fix cơ học thuần tuý" and
explicitly asks for this exact confirmation before any conversion) — the
open items above are planning/validating-stage scope, not a gap that
should reopen this item to `exploring`.
