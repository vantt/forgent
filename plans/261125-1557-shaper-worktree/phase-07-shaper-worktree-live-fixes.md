# Phase 7: The shaper worktree works on a fresh project and runs its hooks

Capability: `code:implement`.

Opened by the phase 6 live proof (`reports/live-proof.md`, defects A and B). Both break acceptance criterion 6 and
both sit in the shaper start of phase 4.

## Inputs

- `reports/live-proof.md`, sections "Step 3", "Step 5", "Step 6" and "Defects for the owning phases".
- `src/session-host/head-start.mjs` `defaultEnsureWorktree` and the shaper branch of `placeHead`.
- `.claude/settings.json`: every fgOS hook starts `S="${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"; [ -x "$S" ] || exit 0`;
  read only.
- `packages/git/rust/src/worktree.rs` `canonical_destination` (needs the parent directory to exist); read only.

## Footprint

- `src/session-host/head-start.mjs`
- `test/session-host/head-start.test.mjs`

## Steps

1. Defect A: before asking the worktree door to create the discussion worktree, create its parent directory
   (`<project dir>-worktrees/`) when it does not exist. Nothing else is created there.
2. Defect B: after the worktree is ensured (created or reused), make `<worktree>/.fgos/installation` a symbolic link
   to `<projectRoot>/.fgos/installation`, so the project's hooks find the activated `fgos` from inside the worktree.
   Idempotent: an existing link to the same target is kept; an existing directory, file or link to another target is
   refused `shaper-worktree-installation-conflict` and nothing is replaced. A project without `.fgos/installation`
   gets no link. Do this only for the shaper; the worktree door and other personas are unchanged.
3. Tests in `test/session-host/head-start.test.mjs` on real git, not ports: a shaper start on a project whose
   `<project>-worktrees/` does not exist creates it and the worktree; the worktree carries the installation link to
   the project's; a second placement keeps the link; a conflicting `.fgos/installation` in the worktree is refused by
   name.

## Verify

`node --test test/session-host/head-start.test.mjs` passes. Then phase 6 step 3 is run again (live proof): the first
shaper start on a fresh project succeeds without a hand-made directory, and the mailbox, questions, identity register
and rotation hooks answer from inside the worktree (rotation ends with the successor holding the role).

## Rollback

Revert the phase's squash commit; a fresh project then needs the worktrees directory made by hand and shapers run
without hooks, as before.
