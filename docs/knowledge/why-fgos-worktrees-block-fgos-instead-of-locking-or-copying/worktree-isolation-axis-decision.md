---
framework: diataxis
mode: explanation
---
# Why fgOS worktrees block `.fgos/` instead of locking or copying it

`worktree-in-out` was the rollup tracking eight items that all traced back
to one open question left in the distillery porting log: for fgOS's
`git worktree add`-based fan-out (`fgw/<id>` branches used by
`pick`/`take`/`runner`/`approve`), should the per-worktree checkout
**lock-in-tree** (symlink `.fgos/` back to the shared store, the pattern
`session.mjs` already uses for driver sessions) or **isolate-tree**
(bootstrap-copy `.fgos/` per worktree with union-merge at merge-back, the
pattern beegog uses for its worker fan-out)? `docs/distillery/porting-log.md:101`
had this flagged `candidate`, unresolved.

## The reproducible bug that forced the question

`tsk-1an` reproduced it directly: `createWorktree` is a bare
`git worktree add` — since `.fgos/` is git-tracked in this repo, forking a
worktree checks out a frozen snapshot of `.fgos/` at fork time, missing
any event committed to `.fgos/events.jsonl` on `main` after that point.
On 2026-07-28, a session had run `fgos submit` roughly nine times in a row
on `main`, all still uncommitted — picking any of those items right then
would have handed the new worktree a `.fgos/` missing both the new item
*and* the very claim event `pick` had just written, because `moveWork`
runs on `main` immediately before `createWorktree` forks
(`bin/fgos.mjs:1287-1302`).

## The decision: neither of the two options on the table

Recorded in `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`: a
third, narrower option than either horn of the open question —
**block-tree**, not lock-in-tree and not full isolate-tree.

> Đã chốt: chặn-cây (không khóa/symlink, không cô-lập/copy). worktree.mjs's
> createWorktree xóa hẳn .fgos/ khỏi checkout worker; merge.mjs's
> mergeRunnerItem từ chối cứng (fgos-write-rejected) bất kỳ diff nào chạm
> .fgos/ trước khi tin merge.

Concretely:

- `createWorktree` deletes the freshly checked-out `.fgos/` entirely after
  `git worktree add` — no symlink, nothing kept.
- `merge.mjs` adds a mechanical guard: any diff on a `fgw/<id>` branch that
  touches a path under `.fgos/` is hard-rejected by `approve` before the
  merge is trusted — the wall sits on the trusted side (code that runs on
  `main`), not on a worker instruction it could ignore.
- `session.mjs` is untouched — its symlink stays, because the actor there
  (a driver session) is trusted to call `fgos`; a worker is not.

Why not lock-in-tree: a symlink pointing back out of the worktree is a
classic sandbox escape — a worker's execution context has no real
capability wall (unrestricted `git add`/`git commit`), so a stray write
would land directly in the live `.fgos/events.jsonl`, unreviewed, unlike a
code mistake that stays on a disposable branch. Why not full isolate-tree:
nothing in the dispatch path actually reads or writes `.fgos/` from inside
a worktree today (verified by reading the code, not assumed) — building a
whole bootstrap-copy-plus-union-merge subsystem for a need that doesn't
exist yet is building ahead of YAGNI.

## The related race the same rollup surfaced

`tsk-3w8` reproduced a second, related gap while dogfooding `approve`: the
final `moveWork(to: 'done')` step failed when another session committed to
`main` at the same moment — the merge itself had landed safely, only the
state-flip lost the race. `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`
resolved this not with a new app-level lock inside `approve`, but by
wiring an **already-written** `main-checkout-lock.mjs` primitive and
`.githooks/pre-commit` hook — previously built but never activated after
being unwired from npm's `prepare` lifecycle — into `fgos doctor` (read)
and `fgos setup` (write), so any `git commit` on the checkout is guarded,
not just ones that go through `approve`.

## The other six items this rollup tracked

- `tsk-53f` — consolidating the claim-flow choke points (`bin/fgos.mjs`'s
  `take`/`pick` and `src/runner/loop.mjs`'s automation path) that had
  independently reimplemented claim+worktree-isolation logic.
- `tsk-3t4` — `docs/explanation/pick-leaf-fork-and-sibling-merge-guard.md`
- `tsk-56t` — `docs/how-to/run-a-state-verb-from-inside-a-worktree.md`
- `tsk-1os` — `docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`
- `tsk-424` — `docs/how-to/continue-after-root-decomposes-mid-session.md`
- `tsk-3yl` — `docs/explanation/merge-idempotent-on-already-merged-branch.md`

All eight targets are `done`. The axis question the rollup existed to
settle is closed: fgOS worktrees never carry their own `.fgos/` at all —
they are blocked from it, not granted a lock or a private copy.
