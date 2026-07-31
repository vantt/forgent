---
name: discover
description: >-
  Use when the user wants to run context-discovery for one fgOS work item
  stuck at stage clarify, from inside a Claude Code session, invoked as
  /fgOS:discover <id>. Calls a real model judgment through fgOS's own
  discover verb (one-door-write) — never writes .fgos/ state directly. For
  an item at stage decompose, use /fgOS:decompose instead. Examples:
  "/fgOS:discover build-cli", "/fgOS:discover tsk-3wd".
---

# fgOS discover

Wraps `fgos discover` so a person working inside Claude Code can advance a
work item past `clarify` without hand-typing the CLI. This is a real
judgment call, not a mechanical read: it invokes a live model against the
item's full context (title/description/refs/deps/prior gate answers) and
appends a discovery record, then either advances the item's `stage` to
`decompose` or parks it in `awaiting-human` with a question. One-door-
write, CTR001 — never writes `.fgos/` state directly.

tsk-2b0 D1 (hard split, no fallback): `discover` only ever runs
context-discovery for a `clarify`-stage item now — it no longer also
handles `decompose`-stage split-work judgment. Use `/fgOS:decompose <id>`
for that; `discover` errors if called on an item that isn't at stage
`clarify`.

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

2. **Run context-discovery.** Run:

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

   If the command fails (e.g. the id doesn't exist, or the item is not at
   stage `clarify` — the CLI now errors and names `decompose` instead),
   show the real error to the user and stop — do not retry with a guessed
   id and do not fall back to a hand-written state change.

3. **Report the result**, reading the JSON output's `data` field
   (`data.outcome` is `clear` or `unclear`):

   - `clear` — item advanced `clarify → decompose`; relay
     `data.verdict.verify`, the real verify command now attached. Tell the
     user `/fgOS:decompose <id>` is the next step for this item.
   - `unclear` — item parked in `awaiting-human`; relay
     `data.verdict.question` and tell the user to resolve it via
     `/fgOS:answer <id> <answer text>`.

   If the item is now unclear, say so plainly rather than treating it as a
   failure — this is a valid, expected outcome of this verb, not an error.
