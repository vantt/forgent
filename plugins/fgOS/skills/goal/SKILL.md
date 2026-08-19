---
name: goal
description: >-
  Use when the user wants to set or show the persisted fgOS goal focus from
  inside a Claude Code session, invoked as /fgOS:goal set <id> or /fgOS:goal
  show. Reads/writes the focus through fgOS's own goal verb (one-door-write
  for set, pure read for show), never writing .fgos/ state directly.
  Examples: "/fgOS:goal set build-cli", "/fgOS:goal show".
---

# fgOS goal

Wraps `fgos goal` so a person working inside Claude Code can set or read the
persisted goal-focus pointer without hand-typing the CLI. `set` is the one
write door for focus (one-door-write, CTR001); `show` is a pure read that
never appends an event.

## Steps

1. **Split `$ARGUMENTS` into a sub-verb and optional id.** The first
   whitespace-separated token is the sub-verb — `set` or `show`. Everything
   after it (trimmed) is the id, required only for `set`.

   If the sub-verb is neither `set` nor `show`, or `set` has no id after it,
   do NOT guess. Show the user the CLI's own usage string and stop:

   ```
   fgos goal <set|show> [id]
   ```

2. **Run the matching command.**

   Both branches use `../_shared/fgos-cli-fallback.md`, substituting
   `<verb-cmd>` with:

   - For `set`:

     ```
     goal set <id> --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

   - For `show`:

     ```
     goal show --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

   substituting the id parsed in step 1 for `set`.

   `--dir`: `goal` is `requiresExistingStore: true` for both
   sub-verbs, and this session may already be inside a linked worktree
   from an earlier `/fgOS:pick`, which never carries its own `.fgos/` by
   design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves to the main
   checkout even from inside that worktree (it survives an `EnterWorktree`
   switch), so passing it as `--dir` here points this call at the one real
   store explicitly.

   If the command fails (e.g. the id doesn't exist, or for `set` the item
   has no declared `goalTier`), show the real error to the user and stop —
   do not retry with a guessed id and do not fall back to a hand-written
   state change.

3. **Report the result.**
   - For `set`: relay the command's JSON output's `data.focus` field — the
     new persisted focus id.
   - For `show`: relay `data.focus` (or say "no focus set" if it is `null`),
     plus `data.criticalPath` and `data.topUnblock` when `focus` is not
     `null`.
