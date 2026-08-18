# Plan: stop merge's ephemeral-worktree reuse from clobbering a kept-open checkout

Mode: high-risk

Flags applied: data loss (hard-gate — the bug's failure mode is a checkout
being silently destroyed), existing covered behavior (`test/runner/
worktree.test.mjs`, `test/runner/worktree-callsite-wrapper.test.mjs`
already cover `createWorktree`/`relocateOrphanedCheckout`).

Decided by `fgos-routing`'s Orient step before this skill loaded (tsk-5ay
D1); recorded here per that skill's own convention, not re-derived.

## Approach

Honors D1 (`docs/history/merge-worktree-reclaim-clobbers-kept-checkout/
CONTEXT.md`): approve/merge's ephemeral-worktree creation must never move
or destroy an existing checkout of the target branch, even temporarily —
fail loudly instead if that can't be avoided.

**Chosen path:** stop `withMergeEphemeralWorktree`'s call chain from ever
needing a literal second checkout of `fgw/<rootId>` at all. Today
`createWorktree`'s reuse branch (`src/runner/worktree.mjs:415-457`) checks
out the branch name itself in a fresh worktree, which is exactly why it
has to relocate (git forbids two checkouts of the same branch). Instead,
the ephemeral merge checkout should check out the branch's current tip
*commit* under a disposable throwaway ref/detached state — never the real
`fgw/<rootId>` name — run the merge and verify there exactly as today, and
on success fast-forward `fgw/<rootId>`'s own ref to the resulting commit
(a plain ref update, which needs no exclusive checkout). On failure
(conflict/verify-fail), nothing touches the real branch or any existing
checkout of it, same as today's `git merge --abort` cleanup.

This satisfies D1 by construction for the expected case: the real branch's
existing checkout (kept-open or not) is never inspected, moved, or
touched, because the ephemeral worktree no longer needs that literal
branch name.

**Fallback (D1's "fail loud" clause):** if a future case can't avoid
needing the literal branch checked out (none identified so far), the
existing `relocateOrphanedCheckout`'s LIVE SESSION GUARD (`worktree.mjs:
226-252`) already throws rather than silently destroying the calling
session's own checkout — this plan extends that same throw-not-destroy
posture to cover a checkout that is *not* the caller's own live session
too (today's gap): any existing checkout of the branch found at that
point becomes a hard refusal, never a relocate.

**Rejected alternatives** (per `CONTEXT.md`'s own rejected-alternatives
section, restated at the technical level):
- Relocate-then-restore-after — rejected by the person (D1); also adds a
  crash window where a `finally`-based restore could itself fail.
- Fail-fast whenever the target branch has any other live checkout —
  rejected by the person (D1) as conflicting with the existing tsk-424
  chained-worktree design (root worktree meant to stay open through child
  merges). The scratch-ref approach above makes this refusal unnecessary
  in the common case, keeping tsk-424's workflow intact.

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `createWorktree`'s ephemeral-merge callers no longer literally check out `fgw/<rootId>` | Medium — touches all 4 shared call sites (`bin/fgos.mjs:2799`, `:3150`, `:3371`, `promote-engine.mjs:72`) | New regression test reproducing tsk-5yp's exact repro: pick root, `ExitWorktree keep`, approve a child merging into root, assert the root's worktree path/registration is unchanged in `git worktree list` afterward |
| Merge result correctness (scratch-ref → fast-forward) | Medium — must produce the identical commit history a direct-checkout merge would | Existing `mergeRunnerItem` tests in `test/runner/worktree.test.mjs`/related merge tests must pass unmodified — the merge algorithm itself doesn't change, only which working tree it runs in |
| Verify command still runs in a real, disposable working tree | Low | Same existing test suite; verify still executes against real checked-out files, just not literally on the branch name |
| Fallback fail-loud path when a checkout can't be avoided | Low — rarely exercised | New unit test forcing the "existing checkout found, not caller's own" case and asserting a clear `WorktreeError` is thrown, never a relocate/destroy |

Impact-analysis posture: **degraded** — GitNexus present but its index is
391 commits behind current HEAD (`gitnexus list_repos`). Cross-checked its
`createWorktree`/`relocateOrphanedCheckout` upstream-caller results
against a direct `rg` grep of the same call sites (`bin/fgos.mjs:2799,
3150, 3371`, `promote-engine.mjs:72`) — they matched, so the 4-call-site
count above is corroborated despite the stale index, not blindly trusted.
GitNexus's own `impact` risk label (LOW, few direct callers) is a
call-graph blast-radius measure, a different axis from this item's
high-risk *lane*, which is set by the data-loss failure mode, not by
caller fan-out.

### Files likely touched

- `src/runner/worktree.mjs` — `createWorktree`'s reuse branch,
  `relocateOrphanedCheckout`'s guard, and (new) the scratch-ref-then-
  fast-forward helper `withMergeEphemeralWorktree` needs
- `bin/fgos.mjs` — none of its call sites change their own call shape
  (`withMergeEphemeralWorktree(repoRoot, rootId, fn)` stays the same
  signature); only the internals move
- `test/runner/worktree.test.mjs`, `test/runner/
  worktree-callsite-wrapper.test.mjs` — new regression coverage per the
  risk map above

### Order

`fgos graph --json` shows tsk-5yp as an isolated single-item component
(no dependents, no dependencies) — no cross-item ordering to resolve.
This is one piece of work end to end.

## Shape

Not split. The fix lives entirely in one shared primitive
(`createWorktree`'s reuse path) consumed identically by all 4 exposed
call sites — splitting it into per-call-site items would fragment a
single-primitive fix and risk 3 of 4 call sites staying vulnerable while
only one gets "shaped" as its own item. Proceeds as this item itself once
`fgos-coding-validating` clears it.

Concrete cases to prove against (depth matched to high-risk):
- Clean, kept-open worktree on the root branch, one child approved into
  it — the exact tsk-5yp repro. Must remain untouched afterward.
- Multiple children approved into the same root branch back-to-back
  (the exact "3 approves in a row" repro shape) — root worktree survives
  all 3.
- Dirty checkout on the target branch (existing `isCheckoutDirty`
  protection) — must keep failing loudly exactly as it does today, not
  regress into a silent skip.
- No existing checkout of the branch at all (the common case today) —
  merge proceeds exactly as before, no behavior change, no perf
  regression from the extra ref-update step.
- The calling session's own live checkout on the target branch (existing
  LIVE SESSION GUARD case, tsk-1tm) — must keep throwing exactly as
  today.

## Execution

Per the locked decision that `executing`'s verify/return mechanism is
already a solved, mechanical path, this plan does not redesign it. Verify
command for this item (already set on the item):

```
node --test test/runner/worktree.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```
