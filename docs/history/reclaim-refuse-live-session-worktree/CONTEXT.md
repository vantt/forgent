# reclaim-refuse-live-session-worktree — CONTEXT.md

## Feature boundary

`approve`'s merge cleanup (`cleanupMergedBranch` -> `reclaimOrphanedCheckout`,
`src/runner/worktree.mjs`) can destroy a git worktree that the calling
session (or an ancestor session in a chained-`EnterWorktree` lineage, per
the `/fgOS:pick` tsk-424 chaining pattern: root worktree -> `EnterWorktree`
into a child item's worktree) is still actively standing inside. This item
adds a check to `reclaimOrphanedCheckout` that refuses to reclaim a
checkout the calling session is live inside, hard-erroring the same way
the existing dirty-checkout guard already does.

Two other suggestions in the item's original bug report are explicitly
OUT of scope for this item (see Decisions below): the symlink/`.fgos`
dirty-check root cause (already fixed upstream, unrelated to this fix),
and reordering cleanup to wait on the full approve operation's success
(would reverse a separate, deliberate prior decision, `tsk-480`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope narrows to: `reclaimOrphanedCheckout` must refuse to destroy a checkout the calling session (or an ancestor worktree in a tsk-424 chained-`EnterWorktree` lineage) is currently standing inside. Out of scope: (a) the symlink + `.fgos` dirty-check gap described in the original report — already fixed upstream (see Scout Evidence); (c) gating cleanup on full approve success — would reverse `tsk-480`'s deliberate "cleanup runs either way" decision (git merge is already permanent once landed; skipping cleanup on a metadata-write failure would leak the branch instead). `tsk-480` is not reopened by this item. |
| D2 | When reclaim is refused because the target is the calling session's own live worktree (or an ancestor of it), `reclaimOrphanedCheckout` hard-errors — same `WorktreeError`-throw shape as the existing "has uncommitted changes ... not a genuine crash-orphan" refusal. `approve` propagates the failure; the branch/worktree stays in place for manual cleanup. Never a silent-skip-with-warning. |

## Pinned terms

- **Live session worktree** — a worktree the CURRENT calling process (or,
  in a chained-`EnterWorktree` lineage, any ancestor worktree the current
  session switched into this one FROM) is presently using as its cwd/claim
  context. Distinct from "dirty" (uncommitted changes) — a live worktree
  can be perfectly clean and still be actively in use.
- **Crash-orphan** — per the module's own existing doc comment
  (`src/runner/worktree.mjs`): a checkout left behind by a process that
  died mid-operation. Always clean (its commit landed before the crash).
  A checkout that is either dirty OR still live-in-use is NOT a
  crash-orphan and must not be force-removed.

## Scout evidence

- `src/runner/worktree.mjs`: `isCheckoutDirty` already excludes `.fgos`
  via a `:!.fgos` pathspec (`git status --porcelain -- :!.fgos`) — landed
  commit `1a21f07`, 2026-07-28, predating this bug's own discovery date
  (2026-08-01). Verified live: in a real worktree with 7 phantom-deleted
  `.fgos/*` files (ADR0020 — worktrees never carry their own `.fgos/`),
  raw `git status --porcelain` shows all 7 as `D`, but
  `git status --porcelain -- :!.fgos` returns empty (clean).
- `node_modules` is no longer symlinked into worktrees — `tsk-2vd`
  (commit `d97d82c`, 2026-08-01 18:10) replaced the old symlink fix
  (`4123318`) with real `npm ci`/`npm install` per worktree
  (`provisionDependencies`). Verified live: `node_modules` in a real
  worktree is a real directory (`stat -c %F` reports `directory`), not a
  symlink.
- `reclaimOrphanedCheckout` (`src/runner/worktree.mjs`) is still
  destroy-only for `cleanupMergedBranch`'s call site — confirmed by
  today's `tsk-3lx` commit `95e9525`, which fixed the *other*
  `createWorktree`-reuse call site (switched to `relocateOrphanedCheckout`,
  a move instead of a destroy) while explicitly leaving
  `cleanupMergedBranch`'s call site destroy-only ("no replacement to
  relocate to").
- `reclaimOrphanedCheckout` today only guards against two cases before
  force-removing a checkout: the target resolving to `repoRoot` itself
  (`tsk-k8u` REPO-ROOT GUARD), and the target being dirty (`tsk-1os`
  DATA-LOSS GUARD via `isCheckoutDirty`). Neither guard checks whether the
  calling session is itself standing inside the target checkout (or an
  ancestor of it) — this is the real, still-live gap.
- `bin/fgos.mjs` (~line 2524 leaf-into-root, ~line 2645 root-into-main):
  both call `cleanupMergedBranch` right after `moveDeliveredOrRecordFault`,
  explicitly "either way" per `tsk-480`'s own comment: "the merge above is
  already real and permanent — cleanup must run either way, so it is no
  longer gated on the status write succeeding." This is a verified prior
  decision with documented rationale, not a bug — out of scope here (D1).
- Related items `tsk-2eq` (leaf approve holding main-checkout lock on a
  discarded directory) and `tsk-66x` (merge list/next false negatives from
  inside a worktree) are both already `status: cleanup` / `stage:
  executing` (i.e. already delivered work) — adjacent but do not cover
  this item's specific gap.
- Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` reports GitNexus
  registered and `present` — full posture. GitNexus's own index is noted
  stale by the harness at the time of this clarify pass; informational
  only, does not gate this clarify-stage skill (no code edited here).

## Verify

`rg -n 'live session|isLiveSessionWorktree' -i src/runner/worktree.mjs && node --test test/runner/worktree.test.mjs`
— fails today (the guard does not exist yet), passes once `fgos-coding-planning`/
`fgos-coding-implement` lands D1/D2's fix plus its regression test. Named after
D1's pinned term "live session worktree"; the exact symbol name is
`fgos-coding-planning`'s call, not locked here.

## Outstanding questions deferred to planning

- None material to product scope. Implementation questions (exact
  mechanism for detecting "session is standing inside this checkout or an
  ancestor of it" — cwd walk vs. claim/session-role state lookup) belong
  to `fgos-coding-planning`, not this document.
