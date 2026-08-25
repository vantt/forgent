# Plan — fanout-batch dispatch runs sequentially despite being called "fanout" (tsk-5v3)

Mode: standard (2 flags: existing covered behavior — touches
`fanoutBatchExecutorCli`, already exercised by
`test/runner/dispatch.test.mjs`; weak proof around the area — no existing
test proves multi-candidate concurrent firing today, RESEARCH.md round 1
finding 6).

## Locked decisions this plan honors

No `CONTEXT.md` exists — discovery's own `clear` verdict skipped
`exploring`. Source of truth: this item's own `RESEARCH.md`
(`docs/history/fanout-batch-dispatch-sequential-loop/RESEARCH.md`, round 1).

## Approach

**Chosen path:** convert `fanoutBatchExecutorCli`'s `for` loop
(`src/runner/dispatch/cli.mjs:759-828`) into a `Promise.allSettled` fan-out
over the already-trimmed `batchToRun` array:

1. Extract the loop body (everything from the `listWork(fgosDir).work[candidateId]`
   lookup at line 760 through the `catch` block's own `fired.push` around
   line 837) into a per-candidate async function returning ONE result
   object shaped like today's `fired`/`mechanismChanged`/`unavailable`
   entries (`{ kind: 'fired'|'mechanismChanged'|'unavailable', ...entry }`)
   instead of pushing directly into the three shared arrays — concurrent
   pushes into shared mutable arrays from `Promise.allSettled` callbacks
   are safe in JS's single-threaded event loop, but returning a tagged
   result and partitioning once after all settle is more honest and
   testable than mutating shared state from N concurrent closures.
2. Replace the `for` loop with
   `const results = await Promise.allSettled(batchToRun.map(runOne))`,
   then partition `results` into `fired`/`mechanismChanged`/`unavailable`
   the same way the loop body does today (a settled `rejected` promise —
   should not happen since `runOne` already catches internally, mirroring
   today's own `try/catch` — still needs a defensive fallback into `fired`
   with an error entry, matching today's catch-block shape, so a genuinely
   unexpected throw is never silently dropped).
3. **Slot-gating is untouched.** RESEARCH.md round 1 finding 2 confirms
   `batchToRun`/`deferred` are both fully computed at lines 743-753,
   before the loop — nothing in this change moves or duplicates that
   logic.
4. **No new locking work needed.** RESEARCH.md round 1 finding 3: the
   expensive step (`executeExecutorCli`) already acquires a lock keyed per
   candidate `cwd` (`dispatchLockFile(cwd)`, tsk-64hk), not a batch-wide
   one — concurrent execution across different candidates was already
   anticipated at that layer. The `fgos pick`/`fgos return` `execFileSync`
   calls remain synchronous and will briefly interleave against each
   other under concurrency (finding 4) — expected, not a regression to
   guard against.
5. **Doc drift this fix creates (finding not in the item's own
   description — surfaced during Approach):**
   `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md:50`
   and its byte-identical mirror
   `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md:50`
   both currently read: "`fanout-batch` sequentially awaits `pick` ->
   `execute` -> `return` per candidate in a synchronous loop; running in
   foreground routinely exceeds the Bash tool's 2-minute default timeout
   (exit 143 for multi-item batches)." That sentence becomes factually
   wrong once this fix lands — the loop is no longer sequential. The
   surrounding "always background this" execution rule itself should
   stay (a concurrent batch can still run long — bounded by the SLOWEST
   candidate, not the sum, but still likely multi-minute), only the
   *reason given* needs correcting in both mirrored copies. Implementation
   updates the sentence; this plan does not draft the replacement prose
   (Execute's job, not Planning's).

**Alternatives rejected:**

- A worker-pool/queue abstraction instead of a flat `Promise.allSettled` —
  rejected (YAGNI): `batchToRun` is already capped at 5 by
  `hasWorkerSlotRoom`'s own ceiling before this function ever sees it
  (`fgos-fanout`'s own "fire batches of up to 5" convention,
  `wave-dispatch-mechanics.md`), so there is no unbounded-fan-out case to
  guard against here — a pool would add complexity for a bound the caller
  already enforces.
- Keeping the shared-array-push shape and relying on JS's single-threaded
  interleaving to make concurrent pushes "safe enough" — rejected: it
  would work, but a tagged-result-then-partition shape (Approach step 1)
  is directly testable in isolation and does not depend on a reader
  knowing that JS array `.push` happens to be safe across `Promise.
  allSettled` callbacks.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Blast radius of editing `fanoutBatchExecutorCli` | light — exactly one production call site (`src/runner/dispatch/cli.mjs:968`, the `fanout-batch` CLI subcommand branch), confirmed by `grep -rn fanoutBatchExecutorCli src/ bin/ test/` (impact-analysis posture: **degraded** — `gitnexus impact` on this target returned "not found" against the `forgentX` index, 1749 commits behind HEAD per `list_repos`; cross-checked directly via grep per `CLAUDE.md`'s own gate note on a suspicious zero-result, not trusted blind) | grep output above; `npm test`'s full green baseline proves nothing else silently depends on today's sequential-push shape |
| Existing test-suite regression | standard — 3 existing tests exercise `fanoutBatchExecutorCli` directly (slots-full, trim-to-free-slots, one real single-candidate end-to-end fire); none assert ordering of the `fired` array against `batchToRun` order, so partitioning after `Promise.allSettled` should not break them, but this needs a real run, not an assumption | `node --test test/runner/dispatch.test.mjs` re-run post-change, must stay green |
| The fix actually achieving concurrency (not just changed syntax) | standard — a `Promise.allSettled` wrapping a body that still blocks synchronously end-to-end would "fix" nothing while looking fixed | **new test, part of this item's own verify surface**: fire 2+ real candidates (each backed by a fake executor with an artificial delay, `writeCommittingExecutor`-style per existing test helpers) and assert their execution windows overlap in wall-clock time — a purely sequential implementation must fail this assertion, a concurrent one must pass it |
| Doc drift (`wave-dispatch-mechanics.md`, both mirrored copies) | light — prose-only, no code path depends on it, but leaving it uncorrected misleads the next `fgos-fanout` operator/session about why backgrounding is required | manual read-back of both files post-edit; per `docs/how-to/write-verify-for-a-skill-prose-change.md`, prose changes are not asked to prove comprehension via `verify` — the code-level `npm test` run already covers the one behavior that actually matters |

**Files touched:**
- `src/runner/dispatch/cli.mjs` (`fanoutBatchExecutorCli` — the loop→`Promise.allSettled` conversion)
- `test/runner/dispatch.test.mjs` (new concurrency-proving test)
- `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md` (correct the now-stale "sequential...synchronous loop" sentence)
- `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md` (same edit, mirrored byte-identical per the repo's existing mirror convention)

**Order:** write the new concurrency-proving test first (it should fail
against today's sequential code, proving it actually tests the right
thing) → convert the loop to `Promise.allSettled` → re-run the full
existing suite → correct both mirrored doc copies.

`fgos graph --json`'s `criticalPath`/`topUnblock` do not name tsk-5v3 (it
has no deps and nothing else in the graph is waiting on it) — no
cross-item ordering constraint applies beyond the single-item order above.

## Shape

Concrete cases worth proving against, at `standard`-lane depth:
- **Concurrent overlap** (the core claim): 2+ real out-of-process fires
  actually run with overlapping wall-clock windows, not back-to-back.
- **Partial failure inside the batch**: one candidate's `executeExecutorCli`
  throws (e.g. a bad prompt, a crashed adapter) while another succeeds —
  the failing one lands in `fired` with an error entry (today's existing
  catch-block shape), the succeeding one still completes normally; one
  candidate's rejection must never abort or block the others (this is
  exactly what `Promise.allSettled` over `Promise.all` buys — a wrong
  choice of `Promise.all` here would regress this case).
- **Existing behavior that must not regress**: `slotsFull`, `deferred`
  (trim), and `mechanismChanged`/`unavailable` classification all keep
  their current meaning and current triggering conditions — only the
  `fired`-path candidates change from sequential to concurrent execution.

## Outstanding questions

None
