---
name: decompose
description: >-
  Use when the user wants to run split-work (chia-viec) judgment for one
  fgOS work item stuck at stage decompose, from inside a Claude Code
  session, invoked as /fgOS:decompose <id>. Calls a real model judgment
  through fgOS's own decompose verb (one-door-write) — never writes
  .fgos/ state directly. For an item at stage clarify, use /fgOS:discover
  instead. Examples: "/fgOS:decompose build-cli", "/fgOS:decompose tsk-3wd".
---

# fgOS decompose

Wraps `fgos decompose` so a person working inside Claude Code can advance a
work item past `decompose` without hand-typing the CLI. This is a real
judgment call, not a mechanical read: it invokes a live model against the
item's full context (title/description/verify/refs/deps, plus any locked
`CONTEXT.md`/`plan.md`) and appends a decompose record, then either passes
the item through to `executing`, splits it into children, or parks it in
`awaiting-human` with a proposal. One-door-write, CTR001 — never writes
`.fgos/` state directly.

tsk-2b0 D1 (hard split, no fallback): `decompose` is the sibling of
`discover` created by splitting the old dual-purpose verb — it only ever
runs split-work judgment for a `decompose`-stage item. Use `/fgOS:discover
<id>` for a `clarify`-stage item instead; `decompose` errors if called on
an item that isn't at stage `decompose`.

## Steps

1. **Read the required id argument.** `$ARGUMENTS` is the work item's id —
   `decompose` requires it. Pass it straight through to the verb in step 2
   — do not validate or guess it yourself; if it is missing or unknown,
   let the CLI's own error surface verbatim.

   If `$ARGUMENTS` is empty, show the user the CLI's own usage string and
   stop:

   ```
   fgos decompose <id>
   ```

2. **Run split-work judgment.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs decompose $ARGUMENTS --json --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
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
   stage `decompose` — the CLI now errors and names `discover` instead),
   show the real error to the user and stop — do not retry with a guessed
   id and do not fall back to a hand-written state change.

3. **Report the result**, reading the JSON output's `data` field
   (`data.outcome` is one of `noop`, `already-decomposed`, `invalid`,
   `need-human`, `pass-through`, `decompose`):

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

   If the item now needs human input, say so plainly rather than treating
   it as a failure — this is a valid, expected outcome of this verb, not
   an error.
