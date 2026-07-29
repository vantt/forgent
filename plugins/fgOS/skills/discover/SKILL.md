---
name: discover
description: >-
  Use when the user wants to run context-discovery (or split-work judgment)
  for one fgOS work item stuck at stage clarify or decompose, from inside a
  Claude Code session, invoked as /fgOS:discover <id>. Calls a real model
  judgment through fgOS's own discover verb (one-door-write) — never writes
  .fgos/ state directly. Examples: "/fgOS:discover build-cli",
  "/fgOS:discover tsk-3wd".
---

# fgOS discover

Wraps `fgos discover` so a person working inside Claude Code can advance a
work item past `clarify`/`decompose` without hand-typing the CLI. This is a
real judgment call, not a mechanical read: it invokes a live model against
the item's full context (title/description/refs/deps/prior gate answers)
and appends a discovery (or decompose) record, then either advances the
item's `stage` or parks it in `awaiting-human` with a question. One-door-
write, CTR001 — never writes `.fgos/` state directly.

## Steps

1. **Read the required id argument.** `$ARGUMENTS` is the work item's id —
   `discover` requires it. Pass it straight through to the verb in step 2 —
   do not validate or guess it yourself; if it is missing or unknown, let
   the CLI's own error surface verbatim.

   If `$ARGUMENTS` is empty, show the user the CLI's own usage string and
   stop:

   ```
   fgos discover <id>
   ```

2. **Run context-discovery / split-work judgment.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs discover $ARGUMENTS --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   `--dir` (tsk-56t): the session may already be inside the claimed item's
   worktree (`/fgOS:pick` switches into it), which never carries its own
   `.fgos/` by design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves
   to the main checkout even from inside that worktree (it survives an
   `EnterWorktree` switch), so passing it as `--dir` here points this
   write at the one real store explicitly, instead of the CLI resolving
   `.fgos/` under the worktree's own (missing) cwd.

   The CLI itself picks which judgment runs based on the item's current
   `stage` — `clarify` gets context-discovery, `decompose` gets split-work
   judgment — there is nothing to choose here.

   If the command fails (e.g. the id doesn't exist, or the item isn't at a
   stage `discover` handles), show the real error to the user and stop — do
   not retry with a guessed id and do not fall back to a hand-written state
   change.

3. **Report the result**, reading the JSON output's `data` field. The
   shape depends on which judgment ran:

   - **Context-discovery** (`data.outcome` is `clear` or `unclear`):
     - `clear` — item advanced `clarify → decompose`; relay
       `data.verdict.verify`, the real verify command now attached.
     - `unclear` — item parked in `awaiting-human`; relay
       `data.verdict.question` and tell the user to resolve it via
       `/fgOS:answer <id> <answer text>`.
   - **Split-work judgment** (`data.outcome` is one of `noop`,
     `already-decomposed`, `invalid`, `need-human`, `pass-through`,
     `decompose`):
     - `noop` — item was already past `decompose`; nothing changed.
     - `pass-through` — simple item moved straight `decompose → executing`,
       keeping its existing `verify`.
     - `decompose` — split into children; relay `data.childIds`.
     - `already-decomposed` — children already existed (interrupted prior
       call); only the root's stage-move was completed.
     - `need-human` — parked in `awaiting-human` with a split-work proposal;
       tell the user to resolve it via `/fgOS:answer <id> <answer text>`.
     - `invalid` — the judgment came back unusable; item left untouched,
       fail-safe.

   If the item is now unclear or needs human input, say so plainly rather
   than treating it as a failure — both are valid, expected outcomes of
   this verb, not errors.
