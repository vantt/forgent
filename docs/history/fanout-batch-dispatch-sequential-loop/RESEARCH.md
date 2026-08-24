# RESEARCH — fanout-batch-dispatch-sequential-loop (tsk-5v3)

## Round 1 — 2026-08-24

**Asked:** Confirm the current implementation shape of the sequential
dispatch loop `tsk-5v3` describes, so the discovery-stage verdict can
judge whether the proposed fix (swap the `for` loop for
`Promise.allSettled`) is well-scoped and safe.

**Checked:**
- `src/runner/dispatch/cli.mjs` — `fanoutBatchExecutorCli` (def at line
  731) and `executeExecutorCli` (def at line 353).
- `src/runner/main-checkout-lock.mjs` — `dispatchLockFile` (line 77) and
  `acquireMainCheckoutLock` (line 375).
- `docs/history/dispatch-execute-per-item-concurrency-guard/plan.md` —
  the plan that introduced the per-cwd dispatch lock (tsk-64hk).
- `docs/history/main-checkout-lock-fanout-self-recognition-gap/CONTEXT.md`
  — adjacent, distinct main-checkout-lock hazard (tsk-70l).
- `test/runner/dispatch.test.mjs` — existing `fanoutBatchExecutorCli`
  coverage (`grep -n "fanoutBatchExecutorCli"`).

**Found:**

1. The item's claim is accurate. `src/runner/dispatch/cli.mjs:759` is
   `for (const candidateId of batchToRun) { ... }`, with the actual
   expensive call `await executeExecutorCli(...)` at line 799, wrapped by
   synchronous `execFileSync(... 'pick' ...)` (line 789) before it and
   `execFileSync(... 'return' ...)` (line 824) after it. All candidates in
   `batchToRun` run one at a time, `await`ed in sequence — cited line
   numbers have drifted slightly from the item's 737-818 (now 731-828+)
   but the same function, same shape.

2. Batch trimming already happens BEFORE the loop, not inside it:
   `hasWorkerSlotRoom` (line 745) computes `room`, then
   `batchToRun = candidateIds.slice(0, freeSlots)` (line 752) and
   `deferred = candidateIds.slice(freeSlots)` (line 753) — both fully
   resolved before the `for` at line 759 ever starts. Parallelizing the
   loop body only changes how the already-trimmed `batchToRun` array is
   iterated; it does not need to touch or duplicate the trim logic.

3. **The expensive step already has per-candidate lock isolation, not a
   batch-wide one.** `executeExecutorCli`'s self-execute branch acquires
   `acquireMainCheckoutLock(fgosDir, { ..., lockFile: dispatchLockFile(cwd) })`
   (cli.mjs:488), and `dispatchLockFile(cwd)` (main-checkout-lock.mjs:77)
   is `` `dispatch--${encodeURIComponent(cwd)}.lock` `` — keyed by the
   candidate's own worktree `cwd`, a **different lock file per candidate**
   (each candidate gets its own worktree via its own `fgos pick` call, so
   `cwd` differs per candidate). The doc comment at main-checkout-lock.mjs:75
   states its purpose plainly: "per-item dispatch concurrency protection
   (tsk-64hk)". The plan that introduced it
   (`dispatch-execute-per-item-concurrency-guard/plan.md`) confirms the
   guard exists to catch a **real incident** of the SAME cwd being
   double-dispatched (an interactive session re-invoking `execute` on a
   cwd already in flight), explicitly NOT to serialize unrelated cwds —
   see its own "Alternatives rejected" section, which rejected keying the
   lock any other way precisely because `cwd` already uniquely identifies
   the dispatch target for the one real caller. This is direct evidence
   the codebase already anticipated concurrent execution across different
   candidates at this layer; nothing here would need to change for the
   loop-level fix to be safe.

4. The `fgos pick` / `fgos return` `execFileSync` calls around
   `executeExecutorCli` go through the separate, genuinely-shared
   main-checkout event-log lock (the same one this session personally hit
   waiting ~150s+ for another live session mid-cleanup-loop, unrelated to
   this item). Under `Promise.allSettled`, these specific calls are
   synchronous (blocking) so they cannot literally overlap with each
   other — they will briefly interleave/serialize against each other and
   against any other concurrent writer, same as today's single-candidate
   case already can. That is expected and safe: these are fast, sub-second
   operations, not the 2-10+ minute agy call the fix is actually trying to
   parallelize. It does not defeat the fix's purpose.

5. **Adjacent-but-distinct hazard, not this item's scope:**
   `main-checkout-lock-fanout-self-recognition-gap` (tsk-70l) documents a
   real main-checkout-lock self-recognition gap — but at a different call
   site (`merge.mjs:886`, the root→main merge path) and a different
   trigger (independent OS processes sharing one inherited session id via
   subagent fanout, not this single process's own internal
   `Promise.allSettled` scheduling). Worth naming as a related risk
   category for awareness, not a blocker for this item.

6. **No existing test proves multi-candidate concurrent real firing.**
   `test/runner/dispatch.test.mjs` has: a slots-full test, a trim-to-free-
   slots test (2 candidates, but resolves both to the `in-process`
   mechanism branch — never reaches the real `execFileSync`/
   `executeExecutorCli` fire path), and one real end-to-end fire test with
   exactly ONE candidate. A verify for the fix will need a **new** test
   that fires 2+ real candidates and asserts they actually overlap in wall
   time (or equivalent proof of concurrency), not just that both
   eventually complete — sequential execution would pass a
   both-complete-eventually assertion just as well.

**Verdict:** `clear: true`.

**Verify (real, runnable):** `node --test test/runner/dispatch.test.mjs`
(existing suite, must stay green) — a new concurrency-proving test case is
part of the implementation itself, not a pre-existing command to point at.
