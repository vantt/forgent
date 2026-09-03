---
framework: diataxis
mode: how-to
---
# Close out a decomposed root item after all its children are done

**Update (tsk-580):** step 3's own verify command, when it needs to check
that every child actually resolved, no longer has to be hand-written —
`fgos edit <root-id> --verify-from-children` generates a `jq` check
against every item whose `parent === <root-id>` automatically (the same
resolved-status set — `delivered`/`retrospective`/`cleanup`/`done` — the
sibling milestone how-to's own "don't wait out cleanup's TTL" lesson
settled on), resolving the repo root itself and refusing outright if no
child is found (rather than writing a vacuously-true `jq` `all()` over an
empty list). Mutually exclusive with `--verify-from-targets` (the
milestone/MVP shortcut in the sibling doc) — pick whichever matches
whether this item's own scope is `children` or `targets`.

**Update (tsk-3bn, docs/history/tsk-3bn-merge-conductor-harness-v2/):** the
manual `git merge --no-ff` workaround this doc originally had to invent for
the "Trap" section below is now a real, supported verb —
`fgos sync-root <root-id>` — and `fgos doctor`'s `root-drift` check
surfaces exactly this drift automatically instead of requiring the manual
`git merge-base --is-ancestor`/`git branch -a --contains` forensics this
doc used to walk through by hand. `fgos approve` also now refuses to close
a milestone (a `targets`-bearing item) when one of its targets' resolved
root branch still has unsynced drift, unless `--acknowledge-drift` is
passed explicitly — the exact gap that let closing `tsk-u9k` miss
`tsk-64p`'s drift in the incident below. The narrative and the specific
git-forensics commands stay below as real, still-useful history and a
still-valid manual fallback; read "The fix" in the Trap section as
superseded by `fgos sync-root`, not removed.

`tsk-2ta` was decomposed into four children (`tsk-2ta-1..4`). Once all four
were individually claimed, implemented, verified, compound-learned, and
merged, `fgos rollup tsk-2ta` reported `doneCount: 4, totalCount: 4` — but
the root item itself was still sitting at `status: "todo"`, and it never
appeared in `fgos merge list`'s `ready` array. A decomposed root item does
not close itself just because its children finished; it needs the same
claim → implement → verify → return → compound-learn → approve cycle any
other item goes through, run on the root id itself.

## The steps

1. Confirm the children are actually all done:
   ```
   fgos rollup <root-id> --json
   ```
   Look for `doneCount === totalCount`.

2. Claim the root item itself:
   ```
   fgos pick <root-id>
   ```
   (or `/fgOS:pick <root-id>` from inside a Claude Code session). This
   reuses the root's own `fgw/<root-id>` branch — the same branch every
   child already merged into — so its worktree already contains all the
   children's real work. There is nothing left to implement.

3. Run the root item's own `verify` command (`fgos list --id <root-id>
   --json` shows it — for a decomposed item this is usually the same
   check the children shared, e.g. confirming `CONTEXT.md` reflects the
   locked decisions). It should already pass, since the children already
   proved their own pieces.

4. Return it:
   ```
   fgos return <root-id>
   ```
   This is not a no-op even though nothing new was implemented — `return`
   checks for an advanced commit history relative to the branch's prior
   state, and a root item with real merged children has one (`aheadCount`
   reflects every child's commits, not zero).

5. `fgos compound <root-id> --doc-type <quadrant> --doc-path ...` — same
   compound-learn step every item goes through, run once more on the root.

6. `fgos approve <root-id>` (or `fgos merge next` if it's the top-ranked
   ready item) — merges the root's branch, carrying every child's already-
   merged commits, into its own target (parent branch, or `main` for a
   top-level root).

## Trap: a root's own branch can advance again AFTER you've already synced it to `main` once

Merging `fgw/<root-id>` into `main` once is **not a one-time event** — it
is a snapshot of that branch's tip at that moment. If the root item still
has other children in flight, and one of them merges into the root's
branch *after* your sync, `main` goes stale again for everything that
child brought in, even though `main` genuinely contained the root's
branch at some earlier point.

Real example: `tsk-64p` (parent of children `tsk-62v`, `tsk-slq`,
`tsk-5l2`, and `tsk-g18`) had its branch merged into `main` directly via
`git merge --no-ff fgw/tsk-64p` once, while only `tsk-62v` and `tsk-slq`
had landed on it. `tsk-g18` (parent: `tsk-64p`) merged into `fgw/tsk-64p`
*afterward*, through its own normal `fgos approve` cycle — correctly, per
this how-to's own topology (a child merges into its root's branch, not
`main`). But nothing re-synced `main` with `fgw/tsk-64p`'s new tip after
that. The result looked, from `main`, exactly like `tsk-g18`'s entire
implementation and test suite had vanished — `git log --oneline --all --
<path>` even listed the commit as if it were simply part of linear
history, because `--all` walks every ref/branch, not just `main`; the tell
was `git merge-base --is-ancestor <commit> main` returning false while the
same check against `fgw/tsk-64p` returned true. Nothing was lost — the
commits were exactly where `fgos approve` put them, on `fgw/tsk-64p` —
`main` was just never told to catch up a second time.

**The fix is the same sync, repeated**: `fgos sync-root <root-id>` merges
the root branch into its real target (`main`, or `fgw/<parentId>` for a
nested root) again, picking up everything the branch gained since the
last sync — a real `git merge` under the hood (the exact same lock/verify/
Iron-Law path `fgos approve` itself uses), so it conflicts loudly instead
of silently dropping anything if two syncs' content actually overlaps. It
deliberately leaves the root item's own `status`/`stage` untouched, so it
is safe to run mid-flight, before every child is done — unlike this doc's
own close-out cycle below (claim → verify → return → compound → approve),
which should still wait for **every child** to be actually `done` before
running, since that cycle *does* move the root's own status. `fgos doctor`
also runs this check on its own (the `root-drift` check) — if it warns, a
plain `fgos sync-root <root-id>` is the fix, no forensics needed. Do this
*every time* a new child lands on a root's branch that has already been
synced to `main` before — not just once, ever.

**Before concluding code is missing from `main`, always check**:
```
git merge-base --is-ancestor <commit> main && echo "on main" || echo "not on main yet"
git branch -a --contains <commit>   # shows every branch/ref that DOES have it
```
A commit reachable from some other ref but not `main` is a sync gap, not
data loss — resist the instinct to reconstruct or re-implement work that
is provably still sitting on its own branch untouched.

## Why this doesn't happen automatically

Each child merges into the *root's own branch* (`fgw/<root-id>`), not
directly into `main` — that's what lets multiple children share one
integration branch before the whole feature lands. But merging children
into that branch only advances the branch; it says nothing about the root
item's own `status`/`stage` fields, which are a separate piece of state
`fgos rollup` can report on but not change. The root item is a real work
item like any other — it earns its own `done` the same way everything
else does, on purpose, since that final claim+verify+return+compound cycle
on the root is also where a synthesized, real-results-aware `CONTEXT.md`
(if a "write the summary" child didn't already do that) or a last
integration check has a natural place to happen.

## Correction: a child's real merge target can skip an intermediate root entirely

The claim above ("each child merges into the root's own branch") held for
`tsk-2ta`'s flat one-level decomposition, but does not hold in general.
Real example: `tsk-5l2` (this same doc's own earlier "Trap" section
predicted it would need this close-out) decomposed into `tsk-5l2-1..3`.
When those children were claimed and approved, `fgos approve` reported
`"target": "fgw/tsk-64p"` for every one of them — `tsk-64p` being
`tsk-5l2`'s own *grandparent* (the true top of that whole subtree), not
`fgw/tsk-5l2` itself. `fgw/tsk-5l2` never received the children's commits
at all; `root-affinity.mjs`'s `resolveRoot` resolves a leaf's real merge
target to the topmost ancestor of its subtree, not necessarily its
immediate parent.

The practical consequence: step 2 above ("the root's own worktree already
contains all the children's real work") was **false** for `tsk-5l2` — its
worktree only had the `clarify`/`decompose` doc commits (`CONTEXT.md`,
`plan.md`), and `fgos return tsk-5l2` failed on its first attempt for
exactly this reason (compounded by the same disposable-worktree
`node_modules` gap the sibling how-to documents — the branch predated that
fix too, since it forked before any of its children had built it). The
fix was a real, ordinary merge, done once, before retrying the close-out
cycle:

```
git merge --no-ff fgw/tsk-64p   # from inside the root's own worktree, on fgw/<root-id>
```

This pulled in everything the children (and everything else) had already
landed on the true root's branch, including fixes the root's own branch
predated. After that merge, `npm test` was clean (2051/2051) and
`fgos return tsk-5l2` succeeded (`aheadCount: 21`).

**Before assuming a root's own branch already has its children's work,
verify it directly** rather than trusting the immediate-parent assumption:

```
git log --oneline <root-branch> | grep <child-id>   # or: git branch -a --contains <child's commit>
```

If it's missing, `git merge --no-ff <the-real-root-branch>` into the
item's own branch first — the same operation this how-to's own earlier
"Trap" section describes for re-syncing `main`, just run one level lower,
against whichever branch the children's `fgos approve` output actually
named as `target`.

## Bug (tsk-1ia): `--verify-from-children`'s generated `jq` was vacuously true

The `jq` check `fgos edit --verify-from-children`/`--verify-from-targets`
generates (step 1's tsk-580 update above) originally read:

```
all(["delivered","retrospective","cleanup","done"] | index(.) != null)
```

This is always `true`, regardless of the actual child status being
checked. The bug is precedence: `index(.)` inside `all(...)` binds `.` to
the array literal on its own left (`["delivered",...] | index(.)`, i.e.
"does this array contain itself"), never to the individual status string
`all()` is iterating over. Confirmed by running it directly:

```
echo '["todo","doing"]' | jq 'all(["delivered","retrospective","cleanup","done"] | index(.) != null)'
# => true   (wrong — neither "todo" nor "doing" is a resolved status)
```

Fix — bind the iterated value to a named variable first, so `index($s)`
resolves against the actual status being checked, not the array literal:

```
all(. as $s | ["delivered","retrospective","cleanup","done"] | index($s) != null)
```

This is the same pattern `tsk-2jc` already used correctly elsewhere
(`.data.work[id].status as $s | [...] | index($s) != null`) — worth
matching from the start rather than re-deriving it.

**Watch out for: a `grep`-based test on the generated `jq` string can pass
while the underlying `jq` logic is still broken.** The original test
coverage only checked that the generated verify command contained the
right substrings, never executed it. The fix required a test that actually
spawns `jq` (e.g. via `spawnSync`) against a real fixture array of
unresolved statuses and asserts the real boolean result — a test that
only inspects the generated command text as a string cannot catch a
precedence bug like this one, since the wrong expression still "looks
right" as text.
