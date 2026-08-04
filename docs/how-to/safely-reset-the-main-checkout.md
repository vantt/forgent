---
type: how-to
title: How to safely `git reset --hard` the main checkout
tags: []
source_capture_ids: [tsk-3au]
---
# How to safely `git reset --hard` the main checkout

Use this whenever you need to undo a commit directly on the main
checkout — the one shared working tree every session's `fgos <verb>`
call resolves against via `git rev-parse --git-common-dir` (distinct
from a per-item `.claude/worktrees/<id>-*` worktree, which is never
shared across sessions).

## Before you start

**Never run a raw `git reset --hard` on the main checkout without a
full `git status` first.** Checking only the files you meant to touch
instead of the whole tree can silently discard another in-flight
session's uncommitted work, with no stash/reflog/blob to recover it if
it was never `git add`-ed.

## The incident this guards against

> A session ran `git reset --hard <sha>` directly on the main checkout
> (via Bash, outside any fgOS verb) to undo a mis-landed commit,
> checking only the 3 files it meant to touch first instead of a full
> `git status`. The reset discarded other uncommitted work that
> predated this session: edits in `src/runner/claim-port.mjs`,
> `src/runner/loop.mjs`, `src/runner/worktree.mjs`, plus
> `.fgos/entropy-history.jsonl`, `.fgos/events.jsonl`,
> `.fgos/coexistence.json` — state other in-flight merge-loop/runner
> processes may have depended on. None of it was ever `git add`-ed, so
> no stash/reflog/blob could recover it.

## Steps

1. **Use `fgos main-checkout-reset --sha <sha>`** instead of a raw `git
   reset --hard <sha>`. It never skips the check:

   ```bash
   fgos main-checkout-reset --sha 3a7eb10
   ```

2. **If the main checkout is dirty, it refuses** and prints the full
   whole-repo `git status --porcelain` output (not scoped to the files
   you meant to touch):

   ```
   main-checkout-reset: Main checkout has uncommitted changes (full git
   status, not just the files you meant to touch) — refusing to reset
   --hard without --confirm. Review the status output, then re-run with
   --confirm once you are sure none of it belongs to another in-flight
   session.

   Full git status (main checkout, whole repo):
   <porcelain output>
   ```

3. **Read the printed status.** Confirm none of the listed changes
   belong to another in-flight session (another worktree's
   merge-loop/runner process may depend on state you don't recognize as
   yours).

4. **Re-run with `--confirm` only once you're sure:**

   ```bash
   fgos main-checkout-reset --sha 3a7eb10 --confirm
   ```

   The reset proceeds only when the tree is clean, or when it's dirty
   *and* `--confirm` is explicitly passed.

## Why this exists

The guard (`assertSafeMainCheckoutReset`,
`src/runner/main-checkout-reset-guard.mjs`) refuses when the whole-repo
tree is dirty (reusing `isMainTreeClean`, the same whole-repo check
`approve` already uses) unless the caller passes `--confirm` after
seeing the full status the error itself prints. `repoRoot` is derived
from `--dir`, never `process.cwd()`, so the verb behaves identically
whether invoked from the main checkout or from a worktree's cwd.

This item's own scope is the destructive-git-op safety net only — a
required full-tree status check plus explicit human confirmation before
`reset --hard` proceeds, backed by both a documented reminder
(`AGENTS.md`, `plugins/fgOS/skills/pick/SKILL.md`,
`plugins/fgOS/skills/cook/SKILL.md`) and this real code-level
choke-point. The causally-upstream mistake — a session's `cd`/absolute
path drifting back to the main checkout instead of staying in its
`EnterWorktree`-switched worktree, which is what put the session in a
position to need the reset in the first place — is a different problem
surface (harness-owned `EnterWorktree` tool, not fixable from inside
fgOS code) and is tracked separately as `tsk-8v1`.

## Scope note

This guard covers `git reset --hard` on the main checkout specifically
— not a general "any destructive git command" class. Broadening to
`git clean -f`, `checkout --force`, etc. was left open rather than
locked as in-scope here.

## Related

- `docs/history/main-checkout-destructive-git-safety-net/CONTEXT.md` —
  full decision record and scout evidence.
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md` +
  `src/runner/main-checkout-lock.mjs` — existing, different-purpose
  main-checkout concurrency-safety infrastructure (guards concurrent
  *commits*, not a single writer discarding uncommitted work via
  `reset --hard`).
- `docs/how-to/clear-a-stuck-main-checkout-lock.md` — a related
  main-checkout safety recipe, for a stuck lock rather than a
  destructive reset.
