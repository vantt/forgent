---
type: how-to
title: How to safely `git reset --hard` the main checkout
tags: []
source_capture_ids: [tsk-3au]
framework: diataxis
mode: how-to
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

2. **If the main checkout is dirty or `--sha` is behind current HEAD**, it refuses and prints the full whole-repo `git status --porcelain` and/or the list of committed commits about to be discarded (with author, message, and files touched):

   ```
   main-checkout-reset: Main checkout reset to <sha> would discard N committed commit(s) ahead of target SHA — refusing to reset --hard without --confirm. Review the lost commits, then re-run with --confirm once you are sure none of it belongs to another in-flight session.

   Commits about to be discarded (N):
   <git log --stat output>
   ```

3. **Read the printed status and lost commits.** Confirm none of the listed changes or commits belong to another in-flight session (another worktree's merge-loop/runner process may depend on state or commits you don't recognize as yours).

4. **Re-run with `--confirm` only once you're sure:**

   ```bash
   fgos main-checkout-reset --sha 3a7eb10 --confirm
   ```

   The reset proceeds only when the tree is clean and `--sha` is not behind `HEAD` by unconfirmed commits, or when `--confirm` is explicitly passed.

## Why this exists

The guard (`assertSafeMainCheckoutReset`,
`src/runner/main-checkout-reset-guard.mjs`) refuses when the whole-repo
tree is dirty (reusing `isMainTreeClean`) or when `--sha` is behind `HEAD` with committed commits ahead of target SHA unless the caller passes `--confirm` after seeing the full status or lost commits details the error itself prints. `repoRoot` is derived from `--dir` (or `git common-dir`), so the verb behaves identically whether invoked from the main checkout or from a worktree's cwd.

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

## Update (`tsk-5iv`): the guard could target the WRONG tree entirely when run bare from a worktree

An independent round-3 review (4 parallel agents, real-command verified)
found a real gap in the guard this doc describes, not just a docs gap:
`repoRoot` inside `main-checkout-reset` is computed as
`path.dirname(dir)`, where `dir` defaults to
`resolveFgosDir(process.cwd(), {strict: true})` — and `strict: true`
returns `process.cwd()` as-is, **never git-resolved** to the shared main
checkout. This directly contradicts what "Why this exists" above used to
claim ("repoRoot is derived from `--dir`, never `process.cwd()`, so the
verb behaves identically whether invoked from the main checkout or from
a worktree's cwd") — that claim held only when `--dir` was passed
explicitly; the verb's own *default* path, with no `--dir`, still fell
through to `process.cwd()`.

**The practical consequence, reproduced end-to-end in a scratch repo**:
running `fgos main-checkout-reset` bare (no `--dir`) from inside a
linked worktree resolves `repoRoot` to the *worktree's own* root, not the
shared main checkout — yet the guard's own printed status still says
`"Full git status (main checkout, whole repo)"`, and with `--confirm` the
`git reset --hard <sha>` actually runs against the worktree tree while
labeling itself as operating on the main checkout. In the reproduction,
the worktree's `HEAD` was reset while the real main checkout's `HEAD`
stayed untouched — the exact wrong-tree class this whole safety net
exists to prevent, occurring inside the safety net itself.

This matters specifically because `AGENTS.md` tells every session to use
this verb *instead of* a raw `git reset --hard` precisely to avoid
destroying another session's work — and ADR0020's worktree-resident
session is the *default* configuration this repo runs sessions in, not
an edge case.

**The fix**: resolve `repoRoot` via `git rev-parse --git-common-dir`
(the same non-strict resolution `resolveRepoRoot` already uses
elsewhere), instead of `path.dirname(dir)`, so the guard resolves the
real shared main checkout regardless of which directory the caller's
`process.cwd()` happens to be. Also added `main-checkout-reset` to
`STORE_MISSING_WARNING_VERBS` as defense in depth — though note per the
review: that warning alone is **not sufficient**, since `fgos session
start` symlinks `.fgos` into the worktree, which makes
`fs.existsSync(dir)` return `true` even while `repoRoot` is still
pointed at the wrong tree; the warning fires only for a genuinely
missing store, not for a store that exists but resolves to the wrong
location.

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
