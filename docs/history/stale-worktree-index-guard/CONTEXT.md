# Stale-worktree-index guard — locked decisions (tsk-2u5)

## Feature boundary

A linked worktree checked out on branch `fgw/<id>` can go stale: an
external process (e.g. `approve`'s leaf→root merge, via a detached
ephemeral checkout) force-moves that branch's ref without ever touching
this worktree's own working tree or index. `HEAD` inside the stale
worktree still reads the new commit correctly (it is a symbolic ref that
follows the branch), but the files on disk and the index are still the
OLD tree. A subsequent "narrowly staged" commit from that worktree
(`git add` exactly one new/changed file, then `git commit`) silently
carries the OLD content of every other tracked file along with it,
reverting them. This already happened for real: commit `2cb6519e` (run
from worktree `tsk-51m-wSxZpU`) silently reverted 405 lines of
`bin/fgos.mjs` plus 2838 lines across 20 files; caught only by luck
("ground-truth grep" noticed `performCatchUp`/`withMergeTargetSlot`
missing from `bin/fgos.mjs` right after the bad commit), patched by a
follow-up commit `254f61e9`. No system guard detected it automatically.

This item is investigation + guard design, not an existing fix. Scope:
decide where the guard lives and how it works. Implementation (the actual
hook/verb code) belongs to `fgos-coding-planning`, not here.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returned
one provider (`gitnexus`, `status: present`) — posture is **full** per
`CLAUDE.md`'s capability gate, freshly checked this pass. Informational
only: this skill edits no code and produces no proof points itself.

## Scout evidence

- `src/runner/worktree.mjs:634-669` (`resyncClaimWorktree`) already solves
  a closely related problem for the REATTACH case (a claim worktree
  falling behind after a child merge) with exactly the shape the locked
  decisions below reuse: read a `lastSynced` marker via
  `lastSyncedCommit` (`worktree.mjs:570-578`, `git reflog show HEAD -n 1`
  — deliberately not `rev-parse HEAD`, which lies once an external
  `git branch -f` has moved the branch ref out from under a symbolic
  `HEAD`), check `git merge-base --is-ancestor <lastSynced> <branchTip>`,
  and refuse loudly (never reset blind) when it isn't an ancestor or the
  tree is dirty relative to `lastSynced` (`isDirtyRelativeToSync`,
  `worktree.mjs:580-607`).
- `.githooks/pre-commit` already runs one guard unconditionally regardless
  of `hookRunsAtHome` — `stagedFgosDeletions` (lines 99-137, wired at
  line 165) — because it protects the "away from home" worktree case
  itself, the opposite of the `hookRunsAtHome`-gated STR65 guards below
  it (lines 171-197). The new stale-worktree-index guard is the same
  shape: it must fire for the worktree that's stale, not the main
  checkout, so it follows this same unconditional-guard precedent, and
  must run BEFORE `stagedFgosDeletions` so that guard reads an
  already-correct index.
- `src/setup/git-hooks.mjs:76-83` (`installGitHooks`) writes
  `core.hooksPath` as the relative string `.githooks`
  (`git config core.hooksPath .githooks`). The doc comment right above it
  (lines 24-30) asserts this "always resolves against the MAIN checkout's
  own root" — verified false: `.githooks/` is itself a tracked,
  versioned directory, so every worktree carries its own on-disk copy of
  `.githooks/pre-commit`, frozen at whatever commit that worktree's own
  branch currently has checked out. A relative `core.hooksPath` resolves
  against each worktree's OWN toplevel, not the main checkout's. This
  machine is safe today only because it happens to already have an
  absolute path set (drift already noted at tsk-1gn D3) — a fresh
  `fgos setup` run would leave every `fgw/*` worktree running a stale,
  possibly pre-guard, copy of the hook.
- `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md`
  D1: `createDetachedMergeWorktree`'s own docblock states the merge path
  intentionally never touches another open worktree. A proactive resync
  fired at merge time would contradict this decision directly.
- `docs/history/main-checkout-destructive-git-safety-net/CONTEXT.md` and
  tsk-56u's staged-`.fgos`-deletion guard establish the existing pattern
  this item's guard follows: fail closed, never auto-mutate destructively
  inside a hook.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Guard lives in the existing `.githooks/pre-commit` file. No per-worktree `core.hooksPath` override (a `--worktree`-scoped override would win over the shared value and silently disable the existing `.fgos`-deletion guard too — verified). Conceptually scoped to `fgw/*` branch commits (the "away from home" case), following the same unconditional-guard precedent as `stagedFgosDeletions`. Must run BEFORE the existing `.fgos` staged-deletion guard so that guard reads an already-correct index. |
| D2 | Detection is read-only, never mutates. Compare `lastSynced` (read via the same reflog-based pattern as `lastSyncedCommit`, never `rev-parse HEAD`) against the branch's current tip. Equal → no-op. Not an ancestor, or reflog unreadable → refuse (fail closed). Ancestor but behind → refuse with the exact repair command to run; the hook itself never auto-fixes. Reason: an in-hook reset+reapply that fails partway leaves the working tree reset with the agent's only copy of its change stranded in a temp patch — the same class of work-loss this guard exists to prevent — and `git commit <pathspec>` builds its own temporary index, which a naive reset+patch inside the hook could clobber incorrectly. |
| D3 | Repair is a separate verb (`fgos resync-worktree`), never embedded in the hook: (1) extract `git diff --cached --binary <lastSynced>`, save under `--git-common-dir` (never the worktree's own `--git-dir`, which fgOS can force-remove later, losing the only copy); (2) `git reset --hard <tip>`; (3) re-strip `.fgos/` after the reset — bundled fix for a pre-existing bug where `resyncClaimWorktree`'s own `reset --hard` resurrects an old `.fgos/` snapshot in a claim worktree, violating ADR0020 (verified directly); (4) `git apply --index <patch>` (never `--3way`, tested to leave unmerged/conflict state); (5) apply conflict (real content conflict) → refuse, keep the patch, report its path; (6) any stray dirt beyond what was staged (untracked/unstaged, not part of the commit under repair) → refuse outright, never guess a merge. |
| D4 | Bundled fix: `installGitHooks` (`src/setup/git-hooks.mjs:81`) must write an ABSOLUTE path to the main checkout's `.githooks/`, not the relative `.githooks` string it writes today — so every worktree always resolves to the same, latest hook file regardless of its own branch's checked-out commit. The comment asserting the relative form "always resolves to the main checkout" is wrong and must be corrected alongside the fix. |
| D5 | Out of scope: no proactive resync at merge time (eagerly pushing the fix into sibling worktrees the moment a ref force-moves). Conflicts directly with `createDetachedMergeWorktree`'s own documented decision (D1 above) and races a still-live session. D2+D3 (hook detection + on-demand repair verb) are sufficient to stop the silent-revert failure mode without this. |

## Pinned terms

- **stale-worktree-index** — the failure mode this item guards against: a
  linked worktree whose on-disk files/index no longer match its own
  branch tip because an external process force-moved the ref without
  touching that worktree.
- **lastSynced** — the commit a worktree's `HEAD` reflog last recorded,
  read via `git reflog show HEAD -n 1` (never `rev-parse HEAD`, which can
  lie after an external force-move).
- **away from home** — `.githooks/pre-commit`'s own term
  (`hookRunsAtHome`) for a hook invocation whose committing checkout is
  NOT the file's own `__dirname`-derived repo root — i.e. a linked
  worktree sharing the main checkout's `core.hooksPath`. This guard fires
  in exactly that case.

## Canonical references

- `src/runner/worktree.mjs:570-669` — `lastSyncedCommit`,
  `isDirtyRelativeToSync`, `resyncClaimWorktree`
- `.githooks/pre-commit` — `hookRunsAtHome`, `stagedFgosDeletions`, `main()`
- `src/setup/git-hooks.mjs:76-83` — `installGitHooks`
- `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md` — origin
  decision record for `resyncClaimWorktree`
- `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md`
  D1 — why merge never touches a sibling worktree
- tsk-56u — staged-`.fgos`-deletion guard precedent (unconditional hook
  guard protecting the "away from home" worktree)
- tsk-1gn D3 — existing note on this machine's accidental absolute
  `core.hooksPath` drift

## Outstanding questions

For `fgos-coding-planning`/`fgos-coding-validating` to gather real data on and
decide, not blocking this item's own decisions: how often do real sessions
have stray untracked/unstaged dirt at commit time? If common, D3's
"refuse on any stray dirt beyond what's staged" rule could make the
repair verb rarely usable in practice — planning/validating should check
this against real session behavior and reconsider whether to relax it.
