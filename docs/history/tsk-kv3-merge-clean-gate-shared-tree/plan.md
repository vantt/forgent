# plan.md — tsk-kv3: narrow the clean-tree gate to where it's load-bearing

Mode: standard. Builds directly on `RESEARCH.md`'s F1–F8 (round 1,
discovery) — nothing below reopens that evidence, only answers the three
open questions it left for a person.

## Locked decisions

- **Q1 — leaf→root clean-tree gate: removed, not narrowed.** F4 already
  proved the leaf's actual merge runs entirely inside a DETACHED ephemeral
  worktree (`withMergeEphemeralWorktree`) that never reads or writes
  `repoRoot`'s own working tree. Gating on its cleanliness protected a
  resource that code path never touches — vestigial, per the user's own
  call. `approve`'s local-merge branch's `isMainTreeClean` check moved from
  before the leaf/root split to inside the root-to-main branch only, where
  the merge genuinely does land on the shared checkout.
- **Q2 — root-to-main's ownFileSet reducing toward whole-tree for a
  many-child root: working as designed, not a bug.** `tsk-598`'s own D2
  principle is "block only on a real same-path collision between the
  item's own diff and another source's dirty state" — for a root, "the
  item's own diff" correctly IS the union of everything its children
  legitimately merged, not "someone else's work." A collision there (e.g.
  `AGENTS.md` touched by both a landed child and a concurrent session) is
  a genuine same-path conflict per D2, not a false positive. The dilution
  effect for a many-child root is a real, named limitation of narrowing by
  path-set alone — not something this item's own scope reopens or fixes.
- **Q3 — scope includes the `bin/fgos.mjs` call sites, not `merge.mjs`.**
  F7 already found `isWorkingTreeClean`/`buildOwnFileSet` fully shipped
  (tsk-598) with test coverage; the only gap was WHERE `approve` calls it.
  Footprint widened to include `bin/fgos.mjs` accordingly — shared with
  `tsk-xyr`/`tsk-4ax`'s own footprint on that file, which `mergeReadiness`
  auto-serializes if ever ready at the same time (intended mechanism, not
  a conflict to route around). By the time this item was implemented,
  those two had already merged into `fgw/tsk-51m`, so no live overlap
  occurred in practice.

## What changed, concretely

`bin/fgos.mjs`, `case 'approve'`:
1. `ownFileSet` (`buildOwnFileSet(runnerOwnDiff, item.footprint)`) is now
   computed once, still ahead of the leaf/root split (needed by both), but
   the `isMainTreeClean(repoRoot, ownFileSet)` check itself moved out of
   the shared pre-split position.
2. Leaf→root branch (`rootId !== id`): no clean-tree check at all now.
3. Root→main branch: the SAME check, same `ownFileSet`, re-added right
   before the merge attempt — byte-identical logic to before this item,
   only its location changed.

`sync-root`'s own nested (`item.parent`) path already had no such gate
(confirmed by reading, not assumed) — `tsk-66t`'s original clean-tree gate
for `sync-root` was scoped correctly to the no-parent (root-to-main-shaped)
branch from the start. No change needed there.

## Acceptance

1. A leaf approve succeeds despite a dirty main checkout, even one whose
   path collides with the leaf's own declared footprint (a case that would
   have blocked before this item, and still correctly blocks for a root —
   proven side by side in the same test file).
2. A root/standalone approve's clean-tree behavior is completely unchanged
   (regression guard — the existing `tsk-598 D3` footprint-dirty test for
   a root/standalone item still passes unmodified).
3. `sync-root`'s own gate placement is unaffected (already correct).

## Verify

`npm test` (state + cli + runner + e2e). 3084/3084 passing at the time
this plan was written, 0 fail, 5 pre-existing skips.

## Outstanding questions

None.
