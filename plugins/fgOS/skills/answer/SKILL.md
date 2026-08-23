---
name: answer
description: >-
  Use when the user wants to answer an fgOS work item currently parked in
  awaiting-human, resuming it to todo, from inside a Claude Code session,
  invoked as /fgOS:answer <id> <answer text>. Answers through fgOS's own
  answer verb (one-door-write), never writing .fgos/ state directly.
  Examples: "/fgOS:answer build-cli use the existing OAuth provider",
  "/fgOS:answer str88-e1 use kebab-case ids".
---

# fgOS answer

Wraps `fgos answer` so a person working inside Claude Code can answer a
work item parked in `awaiting-human` and resume it, without hand-typing the
CLI. Never writes `.fgos/` state directly — every write goes through the
`answer` verb (one-door-write, CTR001).

## Steps

1. **Split `$ARGUMENTS` into id and answer text.** The first
   whitespace-separated token of `$ARGUMENTS` is the item id; everything
   after it (trimmed) is the answer text (`fgos answer <id> --text
   "..."`).

   If no text remains after the id, stop and ask the user for the answer
   text before doing anything else — `fgos answer` requires non-empty text
   and will reject an empty call anyway.

2. **Answer the item.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   answer <id> --text "<text>" --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   substituting the id and text parsed in step 1, with `<text>`
   double-quoted so it survives shell parsing as a single argument.

   `--dir`: the session may already be inside the claimed item's
   worktree (`/fgOS:pick` switches into it), which never carries its own
   `.fgos/` by design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves
   to the main checkout even from inside that worktree (it survives an
   `EnterWorktree` switch), so passing it as `--dir` here points this
   write at the one real store explicitly, instead of the CLI resolving
   `.fgos/` under the worktree's own (missing) cwd.

   If the command fails (e.g. the id doesn't exist or the item isn't
   currently `awaiting-human`), show the real error to the user and stop —
   do not retry with a guessed id or reworded text and do not fall back to
   a hand-written state change.

3. **Report the result.** On success, relay the command's JSON output
   fields — the item's **id**, and the **from**/**to** statuses — back to
   the user.
