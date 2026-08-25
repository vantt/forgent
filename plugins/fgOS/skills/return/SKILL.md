---
name: return
description: >-
  Use when the user wants to return a claimed fgOS work item — running its
  verify and advancing it to awaiting-approval (or blocked, on a red verify) — from
  inside a Claude Code session, invoked as /fgOS:return <id>. Returns the
  item through fgOS's own return verb (one-door-write), never writing
  .fgos/ state directly. Examples: "/fgOS:return build-cli",
  "/fgOS:return str88-e1".
---

# fgOS return

Wraps `fgos return` so a person working inside Claude Code can return a
claimed work item without hand-typing the CLI. Never writes `.fgos/` state
directly — every write goes through the `return` verb (one-door-write,
CTR001).

## Steps

1. **Read the required id argument.** `$ARGUMENTS` is the work item id to
   return: `fgos return <id>`. Pass it straight through to the verb in step
   2 — do not pre-validate it yourself; `return` already does its own
   existence and status checks.

2. **Return the item.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   return <id> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   substituting the id from step 1.

   `--dir`: the session doing the returning is normally already
   inside the claimed item's worktree (that's the whole point of `return`
   — proving real progress on `fgw/<id>`), which never carries its own
   `.fgos/` by design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves
   to the main checkout even from inside that worktree (it survives an
   `EnterWorktree` switch), so passing it as `--dir` here points this
   write at the one real store explicitly. `return`'s own git operations
   (branch checks, the disposable detached-worktree verify) still run
   against the session's actual cwd, unaffected by `--dir` — only the
   `.fgos/` state resolution changes.

   If the command fails (e.g. the id doesn't exist, the item isn't
   `doing`, or it wasn't taken through the pull door), show the real error
   to the user and stop — do not retry with a guessed id and do not fall
   back to a hand-written state change.

3. **Report the result.** On success, relay the command's JSON output back
   to the user — whether the item's own verify passed (advancing it to
   `awaiting-approval`) or failed (parking it at `blocked` with friction), and the
   relevant fields the command returned.
