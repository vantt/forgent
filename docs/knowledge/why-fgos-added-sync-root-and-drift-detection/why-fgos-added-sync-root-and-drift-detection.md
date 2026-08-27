---
type: explanation
title: Why fgOS added `sync-root` and drift detection
source_capture_ids: [tsk-2ec, tsk-66t]
framework: diataxis
mode: explanation
---
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

`fgos-coding-validating` returned READY WITH CONSTRAINTS, not a plain pass,
carrying four explicit constraints forward: `sync-root` must reuse
`mergeRunnerItem`/`mergeRunnerItemLocked`'s existing lock path;
`driftStatus` must resolve the real main checkout before any git
subprocess call; the clustering escalation-fallback path needs an
explicit test, not just the auto-serialize happy path; and
`mergeAfter` cycle tests must include a case mixed with `deps`/`parent`,
not just `mergeAfter` alone.

## A follow-on bug (`tsk-2ec`): `driftStatus` targeted a resolved parent's dead branch

`driftStatus`'s own target formula (`src/state/drift-status.mjs:65`)
picks `fgw/<parentId>` as the sync target whenever `rootItem.parent` is
set, with no check on whether that parent is itself still an active
target:

> "`targetBranch = rootItem?.parent ? \`fgw/${rootItem.parent}\` : trunk`
> — picks the parent's own branch as the sync target whenever a `parent`
> field is set, with no check on the parent's own resolved status."
> — real `docs/history/tsk-2ec-drift-status-resolved-parent-target/CONTEXT.md`

Live evidence via `fgos doctor`: `tsk-4n7` (parent `tsk-19y`, itself
`status: done`, fully merged into `main` and frozen since 2026-08-07)
computed a sync target of `fgw/tsk-19y` — a branch that still exists on
disk (branches aren't torn down promptly after merge) but is permanently
frozen, since nothing further is meant to land there:

> `git rev-list --left-right --count main...fgw/tsk-19y` → `340 0`
> (fully merged, `behind: 0`); the same check against `fgw/tsk-4n7` →
> `9 4` (nearly current with `main` directly).
> — real evidence, `docs/history/tsk-2ec-drift-status-resolved-parent-target/CONTEXT.md`

The diagnostic signature that told this apart from ordinary drift:
`behind: 0, ahead: N-large` against the parent branch. Ordinary drift
(the incident this doc's own "real incident" section above describes)
always has `behind > 0` — the real target kept moving forward. Here the
target had stopped moving entirely, because it was done.

The real consequence, had it gone unfixed: `needsSync` (the same
`isResolvedStatus`-gated predicate this doc's own design already uses)
evaluated true for `tsk-4n7`, so `mergeReadiness` would classify it as
`blockedOnSync` and `fgos merge next` would call `sync-root tsk-4n7` —
merging real work into a branch that was never going anywhere, reporting
"merged" while the code never actually reached `main`. The same class of
"looks done but silently isn't" risk this doc's own original incident
already named, one level deeper: not root-to-main drift, but a nested
root targeting a *grandparent* branch that had already closed out.

**The fix**: when `rootItem.parent` resolves to an item whose own status
`isResolvedStatus` reports as resolved, target `trunk` directly instead
of `fgw/<parentId>` — applying the exact same predicate the module
already trusted for `needsSync`, one level earlier in the same
computation, not a new concept. An existing test covering a nested root
targeting `fgw/<parentId>` stayed byte-identical (its fixture's parent
uses the default unresolved status); the new test is the first to
exercise a root whose *parent* is itself resolved — the actual gap.

## A follow-on bug (`tsk-66t`): `sync-root`'s no-parent merge had no clean-tree gate at all

`sync-root`'s two branches don't carry equal risk to the shared main
checkout. A root with a `parent` merges inside a throwaway
`withMergeEphemeralWorktree`, never touching the shared checkout
directly. A root with **no** parent runs `git merge --no-commit --no-ff`
and `git commit --no-edit` straight on the shared `repoRoot` — and unlike
`approve`'s own local-merge branch (which gates on `isMainTreeClean`
before any git mutation, `bin/fgos.mjs`), this branch had **no
clean-tree check anywhere** — confirmed by reading the full case body:
the only pre-merge guards present were branch-existence and the Iron Law
check, neither of which inspects working-tree cleanliness.

The consequence is the same class of risk this doc's own original
incident named — work silently not where it looks like it is — but
sharper: another session's already-staged changes get silently swept
into the merge commit (`git commit --no-edit` commits the *entire*
index, not just the merge's own changes), or the merge fails with
`"local changes would be overwritten"` and gets reported as
`merge-failed-unclassified` — a classification that reads as "something
conflicted" when nothing actually did.

This wasn't theoretical: a live reproduction happened during a separate
item's own `sync-root` landing on 2026-08-09/10 —

> "`fgos sync-root tsk-19y` crashed with 'Cannot read properties of
> undefined (reading 'output')' when the main checkout had uncommitted
> `.fgos/` changes. Traced: `mergeRunnerItem` returned
> `{outcome:'merge-failed-unclassified'}` (no `.check` field), and
> `sync-root`'s `runAndReport` has no explicit case for that outcome,
> falling through to the success path's unconditional `result.check.output`
> read."
> — real decision record, `tsk-66t`

**The fix** mirrors `approve`'s own gate byte-for-byte — same
`buildOwnFileSet`/`isMainTreeClean` helpers, same `ownFileSet` shape,
same `StoreError('validation')` refusal — attached to `sync-root`'s
no-parent branch immediately before its merge call, using the same
`runnerOwnDiff` already computed a few lines above for the Iron Law
check (no new computation). Because `fgos merge next` dispatches through
this same `sync-root` verb and only recognized one prior `StoreError`
shape (`Iron Law`) in its own `catch` block, the fix also had to teach
that `catch` a second recognized case (`is not clean` → a new, additive
`blocked: 'dirty-tree'` reason) — without this, the new gate's refusal
would have propagated as an uncaught, unattended-loop-breaking crash
instead of the graceful `{picked, blocked, syncRoot}` shape `merge-loop`'s
own stop-rule logic already expects. This was flagged as a hard-gated
**data loss** risk (forcing `high-risk` mode regardless of total flag
count) precisely because the bug's real consequence — another session's
staged work silently swept into a commit on the one shared checkout — is
exactly the kind of silent loss this doc's own drift-detection design
already exists to catch one layer up.

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
