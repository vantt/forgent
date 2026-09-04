---
authoritative_for: retro-loop/cleanup-loop's per-item settling points (case 'compound', case 'cleanup', promote-to-component) never releasing/retrying .fgos/main-checkout.lock, holding it continuously "hot" for a whole 15-item sweep and paralyzing every other session's take/pick/approve; fixed with the same release-early pattern tsk-45z already proved at case 'return'
---

# A sweep loop's own commits held the shared lock "hot" for its entire run

`tsk-5zv` fixed a real, reproduced operational pain: `retro-loop`/
`cleanup-loop` paralyzed concurrent `take`/`pick`/`approve` for any OTHER
session because per-item commits never released
`.fgos/main-checkout.lock` between items.

## Root cause, confirmed via code trace

`fgos-coding-compounding` (retro-loop) and `cleanup-next` write directly to
the main checkout — no worktree, since the item's own `fgw/<id>` branch is
already merged/torn down by this stage. Each commit fires the pre-commit
hook, which acquires the STR65 main-checkout lock file (guarding against
two writers racing one shared git index). The hook never proactively
releases it — `HOOK_TTL_MS=20s` self-expiry only
(`src/runner/main-checkout-lock.mjs:131`), by design.

The loop's own session identity is stable across the whole run
(`resolveWriterIdentity` reads `CLAUDE_CODE_SESSION_ID`/`FGOS_SESSION_ID`
from env), so self-recognition (D6) means the loop never blocks itself —
but the lock stays continuously "hot" for the ENTIRE sweep duration (up to
15 items per retro-loop run), refusing every OTHER session's
take/pick/approve for that whole time.

An already-proven fix pattern for this exact class of problem already
existed and was already shipped, just not applied everywhere it was
needed: `bin/fgos.mjs`'s `case 'return'` (`tsk-45z`) already calls
`releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id)` right at
a main-sourced item's own natural settling point. `case 'compound'` (the
terminal per-item step of the retro pipeline) and `case 'cleanup'` (the
terminal per-item step of the cleanup pipeline) had no equivalent release
call, despite being exactly the same shape of "main-sourced item reaches
its own settling point."

## A scope claim that discovery corrected before planning

The item's original description also claimed `approve` had no
retry-on-lock-held unlike `take`/`pick` — discovery-stage verification
found this claim FALSE against the current repo: `approveUseCase` and
`syncRootUseCase` already wrap their `mergeRunnerItem` calls in
`withLockRetry` (fixed as separate work, `tsk-5k4`, sometime after this
item's description was written). The real remaining asymmetry was
`promote-to-component` (`src/runner/promote-engine.mjs:73`), which still
called `mergeRunnerItem` directly with zero `withLockRetry` wrapping —
even though its merge runs in an ephemeral worktree, `lockRoot: repoRoot`
means it still contends for the same shared main-checkout lock
approve/sync-root contend for.

A person confirmed the corrected scope: retarget fix-step-3 from `approve`
to `promote-to-component` (not drop it), and keep this as one item — all
three remaining fix points are the same bug class (a settling point that
doesn't release/retry the main-checkout lock) sharing one review/verify
surface.

## What shipped

Three additive calls, mirroring the already-proven `tsk-45z` pattern
exactly:

```diff
       if (assessment.failed.length > 0) {
         const { event } = moveWork(dir, { id, to: 'blocked', expectedStatus: 'cleanup', reason, role: 'system' });
+        releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
         return { id, to: 'blocked', reason, seq: event.seq };
       }
       ...
       const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'cleanup', role: 'human' });
+        releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
       ...
       const { event } = addOutcome(dir, { id, docType, ...(docPath !== undefined ? { docPath } : {}) });
+        releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
```

And `promote-engine.mjs`'s `retargetMember` wraps its `mergeRunnerItem`
call in `withLockRetry`, mirroring the exact pattern already proven in
`approve.mjs`/`sync-root.mjs`:

```diff
   const result = await withMergeEphemeralWorktree(repoRoot, rootId, (ephemeral) =>
-    mergeRunnerItem(ephemeral.path, memberItem, opts.timeoutMs ? { timeoutMs: opts.timeoutMs, lockRoot: repoRoot } : { lockRoot: repoRoot }),
+    withLockRetry(
+      () => mergeRunnerItem(ephemeral.path, memberItem, opts.timeoutMs ? { timeoutMs: opts.timeoutMs, lockRoot: repoRoot } : { lockRoot: repoRoot }),
+      { waitMs: undefined },
+    ),
   );
```

No new abstraction, no hook/TTL/contract change — purely calling an
already-existing, already-safety-audited release function from two more
already-existing settling points, and wrapping one more already-existing
merge call with an already-proven retry helper.

## Explicitly rejected alternatives (already evaluated, don't re-litigate without new evidence)

- **Batching multiple items into one commit** — breaks the per-item
  commit-as-audit-trail contract, no gain on the final commit's own
  contention window.
- **Giving retro/cleanup items their own throwaway worktree** — highest
  cost; the land-to-main step still needs the same lock briefly, buys
  little over the release-early fix.
- **Narrower per-path locking** — unsound; STR65 protects the single
  shared git index per checkout, which is not divisible by path.
