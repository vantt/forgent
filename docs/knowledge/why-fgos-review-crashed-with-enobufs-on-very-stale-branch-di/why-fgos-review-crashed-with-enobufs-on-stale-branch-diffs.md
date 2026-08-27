---
type: explanation
title: Why `fgos review` crashed with ENOBUFS on very stale branch diffs
tags: []
source_capture_ids: [tsk-648]
framework: diataxis
mode: explanation
---
# Why `fgos review` crashed with ENOBUFS on very stale branch diffs

`fgos review tsk-4n7` failed outright with `computing diff for branch
"fgw/tsk-4n7" failed: spawnSync git ENOBUFS` instead of returning a real
review result, when that item's parent root branch (`fgw/tsk-19y`) was
332 commits behind `main`.

## Root cause: a missing `maxBuffer`, not a special case for staleness

The shared `git()` helper (`src/runner/merge.mjs`) calls
`execFileSync('git', args, { cwd, encoding: 'utf8', shell: false,
stdio: [...] })` with no `maxBuffer` option, so Node silently applies its
own default of 1 MiB to captured stdout. `reviewDiff` has two call sites
that ask `git()` for a FULL, uncapped diff (`git diff trunk...branch` for
the runner source, and `git diff headAtTake..headAtReturn` for the pull-
door source) — either one can exceed 1 MiB once a branch is hundreds of
commits stale. When it does, `execFileSync` throws `ENOBUFS`, and
`reviewDiff`'s existing `try/catch` rethrows it as a `MergeError` whose
message is just Node's raw text — accurate, but not something the caller
can act on. `fgos review <id>` calls `reviewDiff` directly with nothing
that catches a `MergeError` locally, so it surfaces via the CLI's
top-level handler as a hard failure instead of a usable review.

## Why the fix does both of the item's own "either/or" options instead of picking one

The item's own description named two acceptable fixes — raise git's
buffer limit, or detect/report excessive staleness as its own diagnosable
condition — and treated them as alternatives. The plan did both, since
each is only a few lines and doing both costs less than debating which
one to skip:

1. `git()` gained an optional `maxBuffer` param, default `undefined` —
   Node's own default when omitted, so all ~19 other call sites
   (`detectTrunk`, `changedFiles`, `isWorkingTreeClean`, `isAlreadyMerged`,
   and others) stay byte-identical.
2. `reviewDiff`'s two full-diff call sites pass an explicit, generous
   `maxBuffer` (50 MiB) — a local git subprocess call, not memory-
   constrained the way a network payload is.
3. Both of `reviewDiff`'s `catch` blocks special-case `err.code ===
   'ENOBUFS'` with a message naming the real condition (diff too large,
   branch likely very stale) instead of forwarding Node's raw message —
   this only fires once even the raised ceiling isn't enough, so it costs
   nothing on the common path.

A third option — computing commit-count/staleness up front via an extra
`git rev-list --count` call before ever attempting the diff, and refusing
early — was considered and rejected as unnecessary ceremony (YAGNI):
raising the buffer already fixes the reproduced case (332 commits)
outright, and the `ENOBUFS`-specific catch already gives a diagnosable
message for whatever is left over, without a second git round-trip on
every review.

## Why the fix stayed narrow despite `git()` being a CRITICAL-risk shared primitive

Impact analysis on `git()` in `src/runner/merge.mjs` returned risk
CRITICAL with 21 upstream dependents across three modules (Runner, State,
Setup) — `detectTrunk`, `isWorkingTreeClean`, `isMainWorktree`,
`changedFiles`, and 12 more direct callers, plus depth-2/3 fan-out into
`promote-engine.mjs`, `drift-status.mjs`, and `setup/registrations.mjs`.
The chosen design (default-omitted `maxBuffer`, an explicit value passed
only from `reviewDiff`'s two call sites) is specifically shaped to keep
that blast radius real rather than merely assumed safe: none of the other
15 direct callers pass `maxBuffer` at all, so their behavior is provably
unchanged — proven by a full `npm test` pass, not just by the additive
shape of the change on paper. `reviewDiff` itself, by contrast, has 0
upstream dependents beyond the one CLI call site (`fgos review`), which
is why widening its two call sites' buffer carried no wider risk of its
own.

## Scope correction: `approve` was never actually affected

The item's own title says "review/approve crashes," but grepping every
call site of `reviewDiff` and every full (non-`--name-only`) `git diff`
call in `merge.mjs` found `approve` never calls `reviewDiff` or any other
full-diff path — every other `git diff` call in the file passes
`--name-only`, which returns file paths, not diff content, and cannot
realistically hit a 1 MiB cap. The fix covers both of `reviewDiff`'s own
full-diff call sites (covering `review`, and any future caller of
`reviewDiff`), without inventing an `approve`-side change with no
corresponding code path to fix.

## Related

- `docs/history/review-diff-enobufs-stale-branch/plan.md` — the full risk
  map, shape, and rejected-alternative reasoning behind this fix.
