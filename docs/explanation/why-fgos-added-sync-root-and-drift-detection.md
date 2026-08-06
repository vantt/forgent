# Why fgOS added `sync-root` and drift detection

fgOS's nested branch-tree merge topology — leaf items merge into
`fgw/<root>`, the root closes itself separately into `main` — created a
real drift window between `fgw/<root>` and `main` that fgOS could not
detect. Code that was genuinely `done` could look like it had vanished
from `main`. This was not a bug in any single mechanism: `git merge`,
approve's leaf-into-root routing, `changedFiles`, and `classifyIronLaw`
all ran exactly to their own spec. It was a system gap — a missing
supported action plus missing drift visibility.

## The real incident (verified with git, not inferred)

1. `tsk-64p` (a root item with children `tsk-62v`/`tsk-slq`/`tsk-5l2`/
   `tsk-g18`) received each leaf merge into `fgw/tsk-64p` via `approve`,
   as designed.
2. Approving `tsk-g18` hit an Iron Law false-trip (the exact mechanism
   `tsk-4voj` later fixed) because `main` didn't yet have `tsk-62v`'s
   `dispatch.mjs`. The fix at the time: a manual `git merge` of
   `fgw/tsk-64p` into `main`, once, to unblock — there was no official
   fgOS verb for this (**gap B**).
3. `tsk-g18` approved next, merging into `fgw/tsk-64p` exactly as
   designed — `fgw/tsk-64p` advanced further, but `main` never
   automatically caught up.
4. Closing milestone `tsk-u9k` (targeting `tsk-62v`+`tsk-g18` as done)
   happened with no person or system warning that `fgw/tsk-64p` had
   drifted from `main` a second time (**gap C**).
5. Result: `main` was missing `tsk-g18`'s real code and tests even
   though `tsk-u9k` recorded `done` — nearly read as data loss. It took
   roughly 20 minutes of git investigation
   (`git merge-base --is-ancestor`) to confirm nothing was actually
   lost — it was only unsynced.

## Why this is distinct from `tsk-4voj`

`tsk-4voj` is about the Iron Law false-positive *at approve time*. This
item is about the *consequence afterward*: `fgw/<root>` keeps advancing
after the first sync to `main`, nobody is prompted to sync again, and
`main` silently diverges from the root's true tip. Fixing `tsk-4voj`'s
false-positive alone would not have closed this gap — the drift window
exists independent of why the manual merge happened in the first place.

## The systemic condition that made it possible

A direct verification, requested mid-investigation, confirmed there is
no central merge conductor in fgOS today:

> grep 'approve|mergeRunnerItem|merge next' trong src/runner/loop.mjs
> (vòng lặp runner tự động, dispatch/execute) trả về 0 kết quả — runner
> loop KHÔNG BAO GIỜ tự gọi approve/merge. Merge chỉ được kích hoạt bởi
> bất kỳ session nào (người hoặc AI agent) chủ động gõ 'fgos approve
> <id>'/'fgos merge next' ... Không có tiến trình nền/daemon nào giữ
> view tổng hợp trạng thái đồng bộ main <-> mọi fgw/* branch.

Every merge is triggered independently by whichever session happens to
run it — no daemon holds a consolidated view of main-vs-every-`fgw/*`-
branch sync state. This was the exact condition behind the incident: four
parallel sessions that day, one manually merging `fgw/tsk-64p` to unblock
Iron Law, another separately approving `tsk-418-1` — neither aware the
other was touching the same root branch, with nothing playing
coordinator to catch it early.

## The two gaps identified, and how scope grew to close them properly

- **Gap B**: no official verb like `fgos sync-root <root-id>` to
  proactively sync `fgw/<root-id>` into `main` early, with a real
  event/decision record — instead of an out-of-band manual `git merge`.
- **Gap C**: no drift-detection — a read-only verb (`fgos drift`, or
  wired into `fgos doctor`) that scans every `fgw/*` branch and reports
  which ones carry commits not yet reachable from `main`.

Scope was initially narrowed to just B/C, then widened back out (D1,
reversing an earlier same-day narrowing) after discovering a separate,
newly-filed item (`tsk-3hk`, "Merge Harness v2") duplicated the exact
same scope. Rather than maintain two items with overlapping design, the
overlap was resolved by folding `tsk-3hk` into this item as its own
`wontfix`/superseded, and carrying its useful design detail — merge-set
clustering, two-tier verify, `mergeAfter` — into this item instead (D2–D7).

## Design shape locked for the fix

- `driftStatus(repoRoot, view)` — new, read-only, **not pure** (calls
  real git: `git merge-base --is-ancestor`,
  `git rev-list --left-right --count`), deliberately kept separate from
  `mergeReadiness` (a different purity class). Never cached — recomputed
  from git on every call, no new state added beyond `events.jsonl`.
  Returns `{[rootId]: {branch, target, aheadOfTarget, behindTarget, needsSync}}`.
- `sync-root <root-id>` — a mutating Layer-2 action: merges
  `fgw/<root-id>`'s current tip into its target (`main`, or
  `fgw/<parent>` for nested trees — supporting multi-level nesting, not
  just a flat sync-to-main), records a real decision/event, and leaves
  the root item's own status/stage untouched.
- `mergeAfter: [ids]` — a weak, merge-order-only edge: unset is a no-op
  (default auto-computed order applies); set is a hard gate, not a soft
  priority nudge. Implemented as the existing `waits-for` edge kind
  `dep-graph.mjs` already reserves, validated at set-time through the
  same write-door guard (existence, no self-reference, no cycle —
  including mixed with `deps`/`parent`) that `deps`/`parent` already get
  in `store.mjs`.
- The two-tier verify output field was named `mergeTier`, not the bare
  `tier` canonical reports used, to avoid colliding with the existing,
  unrelated `work.tier` field (light/standard/heavy cost tier).

## A real dependency-graph bug caught mid-review

Closing `tsk-3hk` as superseded surfaced two real dependents
(`tsk-2ie`, `tsk-3gx`) whose only `deps` entry was `tsk-3hk`. Once
`tsk-3hk` was marked `RESOLVED` (wontfix), those items became falsely
`isDepsAndLineageReady === true` even though they genuinely needed the
`mergeAfter`/tier layer this item hadn't built yet. Both were
repointed to `deps: [tsk-3bn]` instead — caught during an explicit
review pass, verified with direct `isDepsAndLineageReady()` calls
before and after the fix.

## Validation constraints carried into execution

`fgos-validating` returned READY WITH CONSTRAINTS, not a plain pass,
carrying four explicit constraints forward: `sync-root` must reuse
`mergeRunnerItem`/`mergeRunnerItemLocked`'s existing lock path;
`driftStatus` must resolve the real main checkout before any git
subprocess call; the clustering escalation-fallback path needs an
explicit test, not just the auto-serialize happy path; and
`mergeAfter` cycle tests must include a case mixed with `deps`/`parent`,
not just `mergeAfter` alone.

## The decompose split

`judgeDecompose` first returned `need-human` with a 3-child split
(sync-root / drift+doctor-wiring / close-out-guard) that omitted
clustering/`mergeTier`/`mergeAfter` entirely — the engine judges from
title/description/refs only, blind to the CONTEXT.md decisions (D1–D7)
that had already locked the wider scope. Reconciled with the user into
4 children: the engine's own catch (wiring the drift check into
`AGENTS.md`'s doctor/`checks.mjs` requirement) and its close-out-guard
idea (tying directly back to this item's own origin incident) were
both kept, alongside this item's own locked clustering/`mergeTier`/
`mergeAfter` work as the fourth child — merging both proposals rather
than picking one over the other.
