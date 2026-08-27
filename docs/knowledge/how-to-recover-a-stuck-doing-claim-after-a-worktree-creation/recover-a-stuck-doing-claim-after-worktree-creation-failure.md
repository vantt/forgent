---
type: how-to
title: How to recover a stuck `doing` claim after a worktree-creation failure
tags: [worktree, claim]
timestamp: 2026-07-31T05:50:00.000Z
source_capture_ids: [tsk-4m0, tsk-3lx, tsk-k8u]
framework: diataxis
mode: how-to
---
# How to recover a stuck `doing` claim after a worktree-creation failure

Use this when `fgos pick <id>` (or any `isolate:true` claim) fails and
`fgos list --id <id>` shows the item stuck at `status: "doing"` with no
matching entry in `git worktree list` — i.e. the claim landed but the
worktree never did.

## Before you start

Since `tsk-4m0`, `claimWork` (`src/runner/claim-port.mjs`) reverts the
claim back to its pre-claim status (`todo`, or `blocked` for a branch-take)
automatically whenever `createClaimWorktree` throws — so on a checkout
carrying that fix, a worktree-creation failure normally surfaces as a
clean, retryable error and the item is **not** left stuck. Just retry
`fgos pick <id>`.

Since `tsk-3lx`, the specific trigger both real examples below hit —
`git worktree add` destroying the pre-existing orphaned checkout before
failing to create its replacement — is closed structurally on a reused
branch: `createWorktree`'s reuse path now relocates that checkout directly
(`git worktree move`) instead of destroying it first, so a failure there
(including the exact `spawnSync git ENOENT` both examples hit) leaves the
original checkout untouched — no manual recovery needed for that specific
class at all, not even a retry.

Since `tsk-k8u`, a second, related root cause behind the same `spawnSync
git ENOENT` symptom is also closed: `bin/fgos.mjs`'s `pick`/`take`
handlers used to pass `repoRoot: process.cwd()` into `claimWork` instead
of deriving it from the already-resolved `--dir`. A claim-release +
re-pick sequence run from *inside* the very worktree being torn down had
`repoRoot` (and `pick`'s `worktreeDir` default) equal to that doomed cwd
— so once `reclaimOrphanedCheckout` removed it, every subsequent git
spawn in the same call chain (including the re-add) had a nonexistent
`cwd`, ENOENT regardless of `tsk-3lx`'s zero-destroy fix. Both handlers
now derive `repoRoot = path.dirname(dir)` instead — always the stable
main checkout `--dir` names, never the caller's own possibly-transient
shell cwd (byte-identical to before when `--dir` is omitted, since
`dataDir()` resolves `dir` from `process.cwd()` too in that case). As
defense-in-depth on top of that, `reclaimOrphanedCheckout` now also
refuses outright — rather than force-removing — when `orphanPath`
resolves to `repoRoot` itself, closing the case structurally even if a
future caller reintroduces a doomed-cwd bug some other way.

This doc is for the residual cases neither fix covers:

- the revert's own `moveWork` call needs a working `.fgos/` writer and a
  working `git` — if whatever broke `createClaimWorktree` (e.g. the git
  binary itself becoming unreachable) also breaks the revert call, the
  item is still left in `doing`;
- a genuinely fresh branch (never reused, no pre-existing checkout to
  relocate) still goes through a plain `git worktree add -b` — nothing to
  destroy there, but a failure still means the claim needs the same
  `todo`-retry (now automatic, per `tsk-4m0`) and there is no worktree yet
  to fall back into;
- a checkout predating both fixes doesn't have either of them at all.

## Steps

1. **Confirm the item is actually stuck**, not mid-claim by someone else:

   ```
   fgos list --id <id> --json
   ```

   Look for `status: "doing"`, a `claimRole` of `"session"` or `"human"`
   (a `"runner"` claim self-heals via `startupReap` instead — don't touch
   it), and confirm there's no live worktree for it:

   ```
   git worktree list | grep fgw/<id>
   ```

   No match means the worktree really is gone.

2. **Confirm the branch itself is intact** — the claim commits to the
   `.fgos/` log and the branch independently; a worktree-creation failure
   never touches either:

   ```
   git log --oneline -5 fgw/<id>
   ```

3. **Manually recreate the worktree** on the existing branch:

   ```
   git worktree add <path> fgw/<id>
   ```

   Use whatever `<path>` you'd normally get from a pick (e.g. under
   `.claude/worktrees/<id>-<suffix>`) — the exact path doesn't matter, only
   that it's a fresh directory `createWorktree` didn't get to create itself.

4. **Remove the checked-out `.fgos/`** — `createWorktree` normally does
   this itself (ADR0020: a linked worktree never carries its own
   `.fgos/`), so do it by hand since this checkout was created outside
   that path:

   ```
   rm -rf <path>/.fgos
   ```

5. **Resume work in `<path>`.** The claim itself (`status: "doing"`,
   `claimRole`) is already yours — you do not need to re-run `fgos pick` or
   `fgos take`. If you try anyway, expect it to refuse: `pick` on an
   already-`doing` item with an existing branch reattaches instead of
   re-claiming, and `take` refuses outright once an item has its own
   branch ("its work lives there, not on the main checkout").

## Real example

Reproduced twice on this same bug, a day apart.

**First**, on `tsk-f31`: a second `fgos pick tsk-f31` attempt (branch
already existed) failed with `spawnSync git ENOENT` from inside
`createWorktree`'s `git worktree add` call — the exact worktree the
session was sitting in was deleted as a side effect (working directory
disappeared mid-session, shell auto-recovered to a parent dir). No data
loss: `fgw/tsk-f31` had all 5 real commits intact. A first retry of
`fgos pick tsk-f31` then hit a SECOND, different error —
`transitionWork: expected status todo but found doing` — because at the
time, nothing had reverted the first failed claim back to `todo`. Recovery
used steps 3-4 above by hand.

**Second**, live while implementing this very fix (`tsk-4m0`, session
`82c23340`): re-picking this item's own claim (to re-enter its worktree
after an engine stage-transition released it back to `todo`) hit the
identical `spawnSync git ENOENT` failure, and again deleted the exact
worktree the session was sitting in — the fix for this bug was not
merged yet at the time it fired. `fgw/tsk-4m0` had both commits
(`CONTEXT.md`, `plan.md`) intact; steps 3-5 above recovered the session
in under a minute, no data lost.

## Related

- `docs/history/pick-worktree-reclaim-zero-destroy/CONTEXT.md`,
  `docs/history/pick-worktree-reclaim-zero-destroy/plan.md` (`tsk-3lx`) —
  the fix that closes the specific `spawnSync git ENOENT`-during-reclaim
  trigger both real examples below hit, by relocating (`git worktree
  move`) instead of destroying the orphaned checkout on a reused branch.
- `docs/history/pick-take-worktree-cwd-fix/CONTEXT.md` (`tsk-k8u`) — the
  companion fix for the same ENOENT symptom's other root cause: `pick`/
  `take` deriving `repoRoot` from `--dir` instead of `process.cwd()`, plus
  a refuse-when-`orphanPath`-equals-`repoRoot` guard in
  `reclaimOrphanedCheckout` as defense-in-depth.
- `docs/history/pick-worktree-claim-race/CONTEXT.md`,
  `docs/history/pick-worktree-claim-race/plan.md` — the locked decisions
  and shape behind the `tsk-4m0` fix this doc is the residual-case
  complement to.
- `docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`
  — a different trigger (`approve`'s leaf-merge reclaim path), the same
  "a step commits before a worktree operation, and a failure in between
  orphans state" shape.
- `docs/how-to/add-a-new-createworktree-call-site.md` — confirms
  `createClaimWorktree`'s cleanup/lifecycle is owned by `claim-port.mjs`'s
  `claimWork`, which is why the revert lives there.
