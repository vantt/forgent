---
name: move
description: >-
  Use when the user wants to move an fgOS work item to a different status
  from inside a Claude Code session, invoked as /fgOS:move <id> <status>.
  Moves the item through fgOS's own move verb (one-door-write), never
  writing .fgos/ state directly. Examples: "/fgOS:move build-cli doing",
  "/fgOS:move str88-e1 awaiting-approval".
---

# fgOS move

Wraps `fgos move` so a person working inside Claude Code can change a work
item's status without hand-typing the CLI. Never writes `.fgos/` state
directly — every write goes through the `move` verb (one-door-write,
CTR001).

## Steps

1. **Split `$ARGUMENTS` into id and status.** `$ARGUMENTS` is expected to be
   two whitespace-separated tokens: the item id, then the target status
   (`fgos move <id> --to <status>`). Split on the first whitespace run — the
   first token is the id, the second is the status value that gets mapped
   to `--to`.

   If fewer than two tokens are present, do NOT guess either value. Show the
   user the CLI's own usage string and stop:

   ```
   fgos move <id> --to <status>
   ```

2. **Move the item.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   move <id> --to <status> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   substituting the id and status parsed in step 1.

   `--dir`: the session may already be inside the claimed item's
   worktree (`/fgOS:pick` switches into it), which never carries its own
   `.fgos/` by design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves
   to the main checkout even from inside that worktree (it survives an
   `EnterWorktree` switch), so passing it as `--dir` here points this
   write at the one real store explicitly, instead of the CLI resolving
   `.fgos/` under the worktree's own (missing) cwd.

   If the command fails (e.g. the id doesn't exist, the status is invalid,
   or a CAS precondition doesn't hold), show the real error to the user and
   stop — do not retry with a guessed id or status and do not fall back to
   a hand-written state change.

3. **Report the result.** On success, relay the command's JSON output
   fields — the item's **id**, and the **from**/**to** statuses — back to
   the user.
