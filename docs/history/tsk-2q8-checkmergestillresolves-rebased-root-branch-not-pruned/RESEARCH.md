# Research — tsk-2q8

## 2026-08-14 — discovery pass, scope-feasibility check on directions (a)/(b)/(c)

**Asked:** is the item's scope (three proposed fix directions for
`checkMergeStillResolves`'s missing rebase-not-pruned fallback) clear enough
to plan directly, or does it need a person's product decision at `exploring`?

**Checked:**

- `src/state/cleanup-harness.mjs:133-159` (`checkMergeStillResolves`) — read
  in full. Current structure:
  - `namedRef && !refExists(...)` → falls back to `checkAncestry(sha, 'HEAD',
    fallbackNote)` (the tsk-577 pruned-ref fallback).
  - `namedRef` exists but `checkAncestry(sha, namedRef)` fails → **no
    fallback at all**, returns `ok:false` directly with only a diagnostic
    hint pointing at `git reflog show <targetRef>` (tsk-3ft).
  - This second branch is exactly the item's "rebase, not pruned" case:
    named ref still exists, ancestry against it fails.
- `docs/history/tsk-3ft-branchheadatreturn-stale-after-manual-reset/CONTEXT.md`
  D2 (locked): "Fix scope is diagnostic-only ... never auto-recover/auto-
  unblock. Matches tsk-577 D3's conservative ancestry-only stance — never
  overclaim safety from an inferred content match." Pinned term "divergent
  history" = ref exists, recorded sha is neither ancestor nor descendant of
  the branch's current tip — **this is the identical shape tsk-2q8 names as
  "rebased (not pruned)"**, not a new/different case. tsk-3ft's own
  investigation deliberately rejected auto-recovery for this shape, citing
  the general problem: ancestry alone can't distinguish a genuine force-push
  loss from a branch reset/rebased to unrelated divergent history.
  `checkAncestry`'s tsk-3ft comment (`cleanup-harness.mjs:104-112`) states
  this is an "intentional limitation."
- tsk-2q8's own confirmed evidence for tsk-2sr/fgw/tsk-3cx: "93d8e653 is not
  [reachable from main]" (same as not reachable from `fgw/tsk-3cx`'s new
  tip) — so proposed direction (a) as literally worded ("try ancestry
  against main directly as a fallback") would **not** actually flip this
  case to `ok:true`: the recorded sha is unreachable from both the named ref
  AND `main` after a rebase replaces it with a new sha. Direction (a) only
  helps the *pruned*-ref shape (already fixed, tsk-577) — for the
  *rebased*-but-not-pruned shape, no ancestry-only check (against any ref)
  can recover automatically; only a human-confirmed content-diff match
  (exactly what direction (b) proposes, and what was done manually for
  tsk-2sr/tsk-4n7) closes the gap, which is precisely the "inferred content
  match" D2 says never to auto-trust.
- `bin/fgos.mjs:4401` — `CATCHUP_REASONS = new Set(['merge-conflict',
  'verify-fail-post-merge', 'verify-timeout-post-merge', 'integration-drift',
  'merge-failed-unclassified', 'merge-blocked-other-item'])` — confirmed:
  does **not** include `system-error`. Matches the item description's claim
  exactly.
- No existing periodic/triggered sweep re-checks `status:blocked` items
  (grepped `src/runner/loop.mjs` for `blocked` — only writes: crash-reclaim,
  anti-loop-max-visits, doing→blocked; no read-and-retry pass). `fgos stale`
  (`staleDoingAdvisory`/`stalePostDeliveryAdvisory`, `src/state/store.mjs`)
  is read-only, never re-runs `checkMergeStillResolves` or transitions
  anything. Direction (c) would be a **new** mechanism, not an extension of
  an existing one.
- `test/state/cleanup-harness.test.mjs:156` already has a test for the
  ref-exists-but-diverged case (tsk-3ft): asserts `ok:false` with a
  `git reflog show` hint, explicitly a *regression guard* for the
  diagnostic-only stance, not a fallback. A direction-(a)-style auto-fallback
  would need this existing test rewritten, not just a new test added
  alongside it.

**Found:** directions (a)/(b)/(c) are technically well-scoped on their own,
but direction (a) as worded collides with a locked decision (tsk-3ft D2) on
the exact same code shape, and per the item's own confirmed evidence would
not even fix the case it's proposed for. This is not resolvable from code
alone — reconciling with D2, or getting explicit new-evidence sign-off to
supersede it, is a product/scope decision for a person.

**Still open:** which direction(s) this item actually implements, and
whether/how to supersede tsk-3ft D2 rather than silently reopening it.
