---
type: explanation
title: Why `checkMergeStillResolves` can false-positive after a root branch prune
source_capture_ids: [tsk-psb, tsk-2q8, tsk-597z, tsk-4bh]
framework: diataxis
mode: explanation
---
# Why `checkMergeStillResolves` can false-positive after a root branch prune

`checkMergeStillResolves` (`src/state/cleanup-harness.mjs`) already
documents one known limitation: it does NOT catch a plain `git revert` —
an ancestor commit that was later reverted is still an ancestor, so the
ancestry check still reports `ok:true` even though the content is
logically gone. `tsk-577` found a second, opposite-shaped limitation of
the same ancestry-only check: content that is genuinely still on `main`
can be reported as `ok:false` ("commit ... is no longer reachable from
HEAD — the merge may have been force-pushed away or history rewritten").

## The mechanism

A leaf item merges into its root's own integration branch
(`fgw/<rootId>`) first; the root later merges into `main`. The leaf's own
`branchHeadAtReturn` field records a sha from partway through the root's
history — the point where the leaf merged in — not the root's final sha.
`checkMergeStillResolves` resolves a leaf's target ref as `fgw/<rootId>`
(per `tsk-1p9` D7's root-aware resolution) and checks that recorded sha's
ancestry against that ref.

Two things can independently make that check fail even though the
content is fine:

1. **History restructuring at the root's own merge into `main`.** If the
   root's merge into `main` doesn't preserve every individual commit as a
   direct ancestor (a squash-shaped merge, or a promote/restructure step),
   the leaf's mid-history sha is never a direct ancestor of `main` even
   though the final file content is genuinely there.
2. **The root branch itself gets pruned.** `loop.mjs`'s zero-ahead
   orphan-branch prune (`loop.mjs:391-393`) deletes any `fgw/<...>` branch
   once its `aheadCount` reaches `0` — meaning all of its content already
   landed elsewhere — with no awareness of whether an open leaf descendant
   still depends on that exact ref for its own `checkMergeStillResolves`
   check. Once `fgw/<rootId>` is gone, the ancestry check against it fails
   with "unknown revision", which the function's single generic `catch`
   reports identically to a genuine force-push loss — the two failure
   modes are indistinguishable from the caller's side.

## Real-world confirmation (tsk-577)

Found 2026-08-05 rerunning `assessCleanupReadiness` on 55 `status:cleanup`
items: 14 failed the merge check, not the 1 (`tsk-47e`) known at the start
of the same day. All 14 hit the identical `checkMergeStillResolves` error.
Two were directly verified as false positives via
`git cat-file -e HEAD:<path>` — the content
(`docs/reference/record-gate-approve-contract.md` for `tsk-19j-1`,
`docs/explanation/why-promote-preflight-uses-git-merge-tree-instead-of-a-real-merge.md`
for `tsk-3gx-1`) genuinely existed on `main`. `git branch --list` for all
5 affected roots (`fgw/tsk-3bn`, `fgw/tsk-3gx`, `fgw/tsk-19j`,
`fgw/tsk-1ni`, `fgw/tsk-3go`) confirmed none of those branches still
existed, while a session start ~10 hours earlier had not yet seen the
failure — the branches were pruned sometime in between (no log captured
the exact moment; `.fgos/logs` was empty for that window).

Left unaddressed, each of the 14 items would eventually park
`cleanup → blocked` incorrectly at its own TTL — a false-blocked signal
distinct from `tsk-1q1`'s earlier TTL-park bug (already fixed via
`tsk-4jf`), arriving through a different path (restructured/pruned
history, not a TTL race).

## The fix stays ancestry-based, not content-based

`tsk-577` fixed this at both ends rather than switching to a more
expensive content/diff comparison:

- **Source**: `loop.mjs`'s zero-ahead prune must skip deleting a root's
  `fgw/<rootId>` branch while that root still has open leaf descendants
  that might need it for their own merge check.
- **Symptom**: `checkMergeStillResolves` must tolerate an already-missing
  target ref for roots pruned before the source-side fix landed, instead
  of only preventing new occurrences.

A content/diff-based rewrite (comparing file contents directly instead of
commit ancestry) was considered and explicitly rejected as out of scope —
higher compute cost, and the ref-missing tolerance already resolves every
confirmed real-world case. The revert-after-merge limitation
`cleanup-harness.mjs`'s own docstring already names stays unchanged and
accepted; a root's own `branchHeadAtReturn` failing ancestry against
`HEAD` directly (independent of any ref deletion) was also confirmed out
of scope — `HEAD` itself is never pruned the way a named `fgw/<rootId>`
ref can be, and none of the 14 confirmed items needed that variant
addressed.

Full decision record:
`docs/history/tsk-577-cleanup-checkmergestillresolves-false-positive/CONTEXT.md`.

## A third case (`tsk-3ft`): a genuine TRUE positive — the branch itself was reset, not pruned

While remediating `tsk-577`'s 14 stranded items, one (`tsk-47e`) still
failed after the fix: `checkMergeStillResolves` reported the same "no
longer reachable from HEAD" error, but `tsk-47e` is a standalone item
(`parent: None`) — its merge check runs directly against `HEAD`, not
against a `fgw/<rootId>` ref, so neither of `tsk-577`'s two fixes (branch-
prune prevention, ref-missing tolerance) applies to this case at all.

Direct investigation (`git reflog show fgw/tsk-47e`, `git diff main
fgw/tsk-47e`, `git merge-base --is-ancestor` in both directions) found
something different from `tsk-577`'s prune scenario: `fgw/tsk-47e` still
existed, but its tip commit was genuinely a *different, diverged* history
from the sha recorded in the item's own `branchHeadAtReturn` — neither an
ancestor nor a descendant of it. Something (an ordinary-looking commit
message, "resync branch state files to current main tip") had reset the
branch to a different point after the item had already returned, with
nothing keeping the store's recorded sha in sync with that reset.

**This time, `checkMergeStillResolves` was not wrong.** Unlike the prune
case above, this is exactly the ancestry check doing its documented job —
catching a genuinely rewritten branch history. What made it safe to
unblock was a separate, manual confirmation: `git diff main fgw/tsk-47e`
on the item's own declared paths came back empty — the real content was
byte-identical to what already landed on `main`, just reachable through a
different, reset history rather than the original recorded one. The
"resync" commit itself turned out to be benign housekeeping, not a
destructive tool; the real gap was that nothing kept
`branchHeadAtReturn` synchronized when the branch was reset out from
under it after `return`.

**The fix stays diagnostic, never auto-recovering.** The same
conservative stance the ref-missing tolerance above took: distinguish
"branch reset to a divergent-but-possibly-safe history" from "branch
pruned/genuinely lost" in the failure message, so a person reading it
knows which investigation to run — but never auto-unblock based on an
inferred content match. A wrong content-match heuristic silently masking
a real loss would be worse than the friction this diagnostic-only stance
costs. `tsk-47e` itself was manually unblocked as part of the same item,
once its content was directly confirmed safe — not by teaching the check
to do that confirmation itself.

Whether this same reset-divergence pattern can recur on other `fgw/*`
branches, and what process produces "resync branch state files" commits
in the first place, was named as still open — `tsk-47e` was the item
that surfaced it, not a claim that the scope was fully bounded. Full
decision record: `fgos show tsk-3ft` (`docsRef` not filed as a separate
`docs/history/` doc for this item).

## A fourth case (`tsk-psb`): the check picks the wrong sha entirely, for any decomposed parent, deterministically

The three cases above all involve the target *ref* — pruned, restructured,
or reset. `tsk-psb` found a different-shaped bug in the same function:
the *sha being checked* is wrong, for a specific, structural reason that
recurs on every decomposed item, not an occasional git-history accident.

`checkMergeStillResolves` already resolves the correct target ref for a
decomposed item (`fgw/<rootId>`, via `tsk-1p9`'s root-aware resolution) —
that part was never the bug. The bug is which sha it checks against that
ref: it always reads the item's *own* `branchHeadAtReturn`. For an
ordinary leaf, that sha is a real merge commit that landed the leaf's
content into the target ref. For a **decomposed** item — one that gained
children instead of executing directly — `branchHeadAtReturn` is
whatever `fgw/<id>` happened to record last, which is only ever a "merge
main back into itself to sync" commit, the wrong direction for this
ancestry check. Once an item decomposes, its own branch is never the
thing merged forward — its *children's* branches are merged directly
into the same resolved root ref instead. So a decomposed parent's own
recorded sha can never be an ancestor of anything downstream, by
construction, every single time:

> "So `branchHeadAtReturn` is structurally never an ancestor of the
> parent branch for any task that got decomposed this way, and cleanup
> will always misreport it as blocked ... even though the real content
> did land in the parent via the children's own merges."
> — real item description, `tsk-psb`

Confirmed live: `tsk-4n7` (parent `tsk-19y`, decomposed into `tsk-3wl` +
`tsk-bvh`) had its own `branchHeadAtReturn` (`d893da2f`) genuinely absent
from `fgw/tsk-19y`'s ancestry — but the real feature commits from both
children (`42a8e1c`, `f077b67`) were present there. No content was lost;
the check was verifying the wrong commit's ancestry entirely.

**Distinct from the prune/reset cases above in kind, not just cause**:
those three are occasional, git-history-level accidents (a branch
deleted, a merge restructured, a branch reset). This one is
deterministic and structural — *every* task that decomposes and closes
by having its children merge directly into the parent hits this false
block, every time, with no git-history anomaly involved at all.

**The fix**: when checking a decomposed item, additionally check
ancestry against the children's own `branchHeadAtReturn`/merge commits,
not only the parent's own branch — same diagnostic-only stance the prune
and reset fixes above both take (never auto-unblock from an inferred
content match, just stop misreporting a decomposed parent as blocked).

## A fifth case (`tsk-5j0`): a decomposed ROOT's own branch was never checked against `main` at all

`tsk-psb`'s own fix (above) replaced the parent's-own-sha check with a
children-recursion check for *any* item with children — but for the
**root** of a decompose tree specifically, that replacement was total, not
additive: `checkMergeStillResolves` returned `checkChildrenResolve`'s
result directly and never went on to check the root's own branch
(`fgw/<rootId>`) against `main` at all. Children resolving into
`fgw/<rootId>` says nothing about whether `fgw/<rootId>` itself ever
merged into `main` — those are two independent facts, and only the first
one was ever being checked.

Confirmed live on `tsk-4b2` (parent of `tsk-4v6`+`tsk-12p`): `fgw/tsk-4b2`
never merged into `main` (two failed approve attempts), yet
`fgos cleanup tsk-4b2` returned a clean TTL noop with zero entries in
`assessment.failed`. Left unfixed, any decomposed root whose own branch
fails to merge into `main` — conflict, verify-miss, or any other reason —
would eventually reach `done` and have its branch deleted by
`cleanupMergedBranch`, with the harness reporting zero problems the whole
way: a silent, permanent loss of the root's own content once cleanup
deletes the branch.

**Distinct from `tsk-psb`'s bug in kind**: `tsk-psb` found the check
verifying the *wrong sha* against the *right ref* for a non-root
decomposed node. This is the *right ref never being checked at all*, and
only for the root specifically — a non-root decomposed node's own branch
correctly stays unchecked (its content was never supposed to merge
forward through it in the first place, per `tsk-psb`'s own reasoning
above).

**The fix stays additive, not a third replacement**: when an item has
children, run the existing children-recursion check *and*, only when the
item resolves to itself as the root, also check that root's own branch
against `main` — combined with AND. Same diagnostic-only stance every
fix on this page already takes: report, never auto-recover. See
`src/state/cleanup-harness.mjs`'s `checkRootBranchResolves`.

## The rebased-not-pruned case (`tsk-2q8`) — content landed, ancestry sha didn't

A different scenario from a pruned ref: a root/parent branch (`fgw/<rootId>`)
that still *exists* but was **rebased**, not pruned. Confirmed live: a
leaf item's own `branchHeadAtReturn` sha becomes permanently stale
ancestry-wise even though the content genuinely landed on `main` —
`git reflog` showed the parent branch rebased, replaying the leaf's
return commit as a byte-identical new sha (verified: diff of
added/removed lines matches exactly, and the deliverable text was
directly confirmed present on `main`). The new sha is reachable from
both the parent branch and `main`; the *recorded* sha is reachable from
neither, so `checkMergeStillResolves` blocked the item with
`parkReason: system-error` on every TTL cleanup attempt — permanently,
since `fgos catchup`'s own `CATCHUP_REASONS` set only covers
merge-related parks, never `system-error`.

**Chosen fix**: rather than adding a third ancestry-fallback check (the
originally proposed direction) or a sha-resync step, `fgos catchup`
itself was made eligible for exactly this park shape. The eligibility
gate reads the item's most recent `work.move` event and checks whether
it transitioned `cleanup -> blocked` (via `readRawEvents`, already in
scope at the same call site) — not a new field, marker convention, or
`reason`-text parsing. Once eligible, `catchup`'s own existing
merge-and-reverify mechanism (already tested, unchanged) naturally
re-establishes fresh ancestry by merging the target into the item's
branch and re-verifying — the exact recovery a rebased-but-still-live
branch needs, reusing machinery that already existed for a different
purpose rather than building a parallel fallback path.

A negative test locks the boundary: a `blocked` item with an unrelated
`system-error` reason (e.g. a runner-crash reclaim) must still be
*rejected* by `fgos catchup` — admitting the wrong class of `system-error`
park into the merge-retry path is exactly the failure this eligibility
gate must not create.

## A found-but-separate gap: old victims of an already-fixed false positive stay stuck

A second, real occurrence of the *original* pruned-parent false positive
(the `tsk-psb` shape this doc's own main body already covers) was found
stuck in `status: blocked` for 5 days — the fix that resolved
`checkMergeStillResolves` for new occurrences never retroactively
re-checked items already parked *before* the fix landed. Fresh
verification confirmed no data loss (the recorded sha had since become a
real ancestor via an unrelated `sync-root`), and the item was manually
unblocked the same way. This surfaced a genuine gap this item's own scope
named but did not close: no sweep or audit revisits `status: blocked`
items with a merge-related `system-error` park to see whether a since-landed
fix now clears them — a fixed false-positive shape can still leave old
victims stranded indefinitely, discoverable only by manual investigation.

## The recheck sweep, split off as its own item (`tsk-597z`)

Split off from `tsk-2q8` (per its own exploring D2). **Report-only,
never auto-transitioning**, on purpose — four named risks ruled out
auto-transition for now: (1) keying the trigger on the free-text
`detail` string would be fragile, since that string has already been
independently rewritten by several other fixes in turn; a structured
marker would be needed, not string-matching; (2) wiring auto-transition
into the runner's ~5s poll cycle against a transiently-resolvable git ref
risks a flap loop; (3) a check-then-transition window races concurrent
rebases/prunes on the shared main checkout (TOCTOU); (4) no persistent
`--watch` daemon runs in this repo's normal day-to-day usage today
(sessions call `fgos` per-command), so an auto-transition wired only into
a single poll cycle wouldn't even fire reliably in practice yet.

**Delivered**: `fgos recheck-blocked`, a report-only sweep listing which
currently-`blocked` items would now pass their own park-causing check if
it were re-run today — surfacing exactly the `tsk-4n7` shape (a
now-resolved false positive) for a person to act on, without the engine
ever transitioning anything on its own.

**Explicitly does not fix `tsk-2q8`'s own repro.** The rebased-root-branch
case (`tsk-2sr`) has a *permanently* unreachable recorded sha — re-running
the same ancestry check on it fails forever, no matter how many times it
reruns. This sweep only helps the `tsk-4n7` shape, where the underlying
check later became true again for an unrelated reason (a `sync-root`
elsewhere re-establishing real ancestry) — a genuinely different failure
mode from a rebase that permanently orphans the original sha.

## A fourth gap: canceled/`wontfix` children were never skipped (`tsk-4bh`)

Found in the same 2026-08-14 fable audit
(`docs/reference/worktree-merge-lifecycle-audit-260814-findings.md`):
`checkMergeStillResolves` never skipped `wontfix`/canceled children when
walking a decomposed root's own children-recursion check — a root with
one abandoned (`wontfix`) child could never clear cleanup, since the
check kept demanding ancestry proof for a child that was never going to
merge in the first place. **Fix**: the check now skips canceled/`wontfix`
children when recursing, the same way it should already skip anything
that was never going to land.
