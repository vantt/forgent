# Iron Law evidence: tsk-51m (root → main)

`classifyIronLaw` on the ROOT's own diff (`fgw/tsk-51m` vs `main`, real
`sync-root tsk-51m` run against the real repo):

```
Matched flags: [none]
Matched modules: [bin/fgos.mjs, src/runner/main-checkout-lock.mjs, src/runner/merge.mjs, src/runner/worktree.mjs]
```

This is the UNION of what the children touched individually — gathering a
root's children into one landing diff is expected to trip the gate again
even though every child already cleared its own. Per `plan.md`'s own Iron
Law table: this was predicted for four of the five children and the
root→main land itself before any code was written (`tsk-4xq`'s own
footprint, `plugins/fgOS/skills/**` only, never touches a gated module by
itself — the gate fires on this combined diff because the other four
children's real code is also present in the same tree).

## This is not new evidence — it is the aggregate of five already-acknowledged ones

`fgos rollup tsk-51m` lists all five children `delivered`, each merged into
this branch and each already reviewed and acknowledged individually by the
person, in landing order:

1. `docs/history/merge-conductor-throughput-and-human-release/
   iron-law-evidence-tsk-2ypd.md` — post-land drift detection by real path
   intersection. Failing-test-first. `src/runner/merge.mjs`,
   `src/state/graph-harness.mjs`.
2. `docs/history/merge-conductor-throughput-and-human-release/
   plan-tsk-4xq.md` — escalation playbooks. No Iron Law of its own
   (skills-only footprint, `plugins/fgOS/skills/**`).
3. `docs/history/tsk-xyr/iron-law-evidence.md` — target-ref merge queue
   (`withMergeTargetSlot`, `mergeSlotLockFile` with the `encodeURIComponent`
   collision fix, picker-skip absorbing tsk-1zd). `bin/fgos.mjs`,
   `main-checkout-lock.mjs`, `merge.mjs`. Two honest gaps disclosed there:
   not failing-test-first, and concurrency proven at the unit/async level
   rather than genuinely separate OS processes — the second gap is being
   independently closed right now by `tsk-1wr` (see below), not blocking
   this land.
4. `docs/history/tsk-55p/iron-law-evidence.md` — refresh-at-pick for an
   unstarted branch. `src/runner/worktree.mjs`. Ancestor-check-based, never
   a rebase (proven structurally, not by convention).
5. `docs/history/tsk-4ax/iron-law-evidence.md` — catchup as the inbound
   gate's standard step, `branchHeadAtReturn` cash-in fix. `bin/fgos.mjs`.
   Strongest single proof in the batch: a run-counter test asserting verify
   executes EXACTLY once for a call that both catches up and lands.

## Not gathered here: `tsk-1wr`

`tsk-1wr` (two-real-OS-process test for the target-ref slot, closing the
second honest gap `tsk-xyr`'s own evidence names) is deliberately NOT a
child of this root (`parent: null` on its own record) and is not part of
this diff — `git log fgw/tsk-51m` does not contain it. D1 ("root chưa gom đủ
con") is evaluated against `plan.md`'s own five-child split, locked before
any implementation began; `tsk-1wr` is a real, valuable, independent
follow-up on already-landed work, not a prerequisite this root was ever
defined to gather.

## Full suite, run at this root's own actual tip

Run from `fgw/tsk-51m`'s real HEAD (`7ebc0cdc`, `Merge branch 'fgw/tsk-4ax'
into HEAD`), clean tree, immediately before this file was written — not a
child branch's own pre-merge run, the root's own post-merge tree:

```
$ npm test
ℹ tests 2985
ℹ suites 0
ℹ pass 2980
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 70069.326319
```

(The 5 skips pre-exist this batch's work and are unrelated to it.)

## Not acknowledged by this session

`fgos sync-root tsk-51m --acknowledge-iron-law` has not been run here. This
is the last Iron Law gate in the whole `tsk-51m` batch — once acknowledged,
`fgw/tsk-51m` lands on `main` and D1 (root cannot land partial) closes for
good on this effort.

## Addendum (2026-08-13, tsk-5x4): the 2985-test run above was measured on a stale tree

Post-hoc audit of the batch found the `npm test` run captured above
(2985 tests) cannot have run on "the root's own post-merge tree containing
all 5 children" as claimed: each individual child's own evidence file
reports MORE tests on its own smaller tree — `tsk-55p` 2991, `tsk-2ypd`
3003, `tsk-xyr` 3017, `tsk-4ax` 3029. A tree containing all five children
cannot have fewer tests than any single child's tree.

Root cause, confirmed against git history: the commit that introduced this
file (`2cb6519e`, "docs(tsk-51m): record root-level Iron Law evidence") was
made from a worktree (`tsk-51m-wSxZpU`) whose checked-out index had gone
stale relative to `fgw/tsk-51m`'s real ref — the branch had been
force-moved forward by five separate `approve`/`sync-root` operations
running from OTHER (ephemeral merge) worktrees, which update the shared
branch ref via `git branch -f` without touching this linked worktree's own
files. `git log`/`HEAD` correctly showed the real, current commit
throughout, but the actual files on disk — including whatever `npm test`
ran against in this file's own capture — still reflected an earlier state.
The very next commit, `254f61e9` ("fix: restore content accidentally
reverted by a stale worktree index in the previous commit"), had to
restore 405 lines of `bin/fgos.mjs` and 2838 lines across 20 files that
the bad commit had silently reverted back to before any of tsk-51m's five
children existed — confirming this file's own `npm test` capture ran on
that same reverted tree, not the real one. No addendum was ever added
after `254f61e9` landed to correct the number; this is that addendum.

Corrected: full suite run at `main`'s current tip (which already contains
`fgw/tsk-51m`'s corrected, fully-landed state via merge commit `7749b4ca`,
plus everything landed since):

```
$ npm test
ℹ tests 3116
ℹ pass 3111
ℹ fail 0
ℹ skipped 5
```

Consistent with the union-of-children expectation this file's own §1
predicts, and higher than every individual child's own count as it should
be. `fgw/tsk-51m` is already merged into `main` (confirmed:
`git merge-base --is-ancestor <fgw/tsk-51m tip> main` — YES); this addendum
corrects the paper trail, it does not change what already landed. No
source file this evidence file cites was ever actually wrong — only this
file's own captured test-count number was, and only in this one place.
