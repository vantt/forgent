---
name: decompose
description: >-
  Use when the user wants to advance one fgOS work item past stage
  decompose, from inside a Claude Code session, invoked as /fgOS:decompose
  <id>. Claims the item if needed, then dispatches it through
  fgos-coding-driving so the live session does its own real shaping and
  reality-check reasoning (fgos-planning/fgos-validating) and supplies the
  decompose verb's verdict itself (one-door-write) — never writes .fgos/
  state directly, and never re-derives a judgment blind. For an item at
  stage clarify, use /fgOS:discover instead. Examples: "/fgOS:decompose
  build-cli", "/fgOS:decompose tsk-3wd".
---

# fgOS decompose

Claims a work item (if not already claimed) and dispatches it through
`fgos-coding-driving` so a person working inside Claude Code can advance it
past `decompose` without hand-typing the CLI. This is a real judgment call,
not a mechanical read: the live session itself reads the item's full
context (title/description/verify/refs/deps, plus any locked
`CONTEXT.md`/`plan.md`), shapes and reality-checks it
(`fgos-planning`/`fgos-validating`'s own flow), and supplies that verdict
to the `decompose` engine verb directly — instead of leaving the judgment
to a later, context-blind subprocess call. Either way the item passes
through to `executing`, splits into children, or parks in `awaiting-human`
with a proposal. One-door-write, CTR001 — never writes `.fgos/` state
directly (`docs/history/discover-decompose-skill-wrapper-verdict-routing/
CONTEXT.md` D1).

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

2. **Claim if not already claimed.** Resolve the main checkout root (every
   verb below is `requiresExistingStore: true`, same as every other fgOS
   skill):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   Read the item's live status:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs list --id $ARGUMENTS --json --dir "$root"
   ```

   If `data.work["$ARGUMENTS"].status` already reads `doing`, skip straight
   to step 3 — the caller (or an earlier iteration of this same command)
   already holds the claim. Otherwise claim it, the same way `/fgOS:pick`'s
   own step 2 does:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs take $ARGUMENTS --role session --dir "$root"
   ```

   If the item already carries its own branch (`fgw/<id>` from an earlier
   claim), `take` refuses and names `pick` instead — fall back to:

   ```
   node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs pick $ARGUMENTS --dir "$root"
   ```

   Any other failure (the id doesn't exist, lock contention) shows the
   real error to the user and stops — do not retry with a guessed id and
   do not fall back to a hand-written state change.

3. **Dispatch through `fgos-coding-driving`.** Invoke the
   `fgos-coding-driving` skill for `$ARGUMENTS` with `ceiling:
   stage:executing`. Never invoke `fgos-planning`/`fgos-validating` (or
   any other stage-skill) by name directly here — the driver resolves
   which skill a `decompose`-stage item maps to through its own registry
   lookup, the one place that mapping is allowed to live
   (`fgos-coding-driving`'s own red-flag rule against a caller inventing a
   stage-to-skill mapping). The ceiling stops the loop the instant the
   item's stage reaches `executing` — it never lets the loop drift onward
   into `fgos-code-implement` (a real build) in the same call
   (`docs/history/discover-decompose-skill-wrapper-verdict-routing/
   CONTEXT.md` D1, D6). A real split (a `decompose` verdict with real
   children) instead anchors the item by its own open children before the
   ceiling is ever reached — the driving loop's own anchor stop, see step
   4. The live session doing the real shaping/reality-check reasoning
   inside `fgos-planning`/`fgos-validating` is what supplies the
   `decompose` engine verb its `--verdict` directly — no context-blind
   subprocess judge runs for this call.

4. **Report whatever `fgos-coding-driving` reported.** Relay its stop
   reason exactly; do not add a separate report of your own beyond it:

   - **reached ceiling at stage `executing`** — the item passed through
     `decompose` (`pass-through`/`noop`), keeping its existing verify;
     tell the user the item is ready to build (`/fgOS:pick <id>` or an
     execution sweep picks it up next).
   - **anchored by open children** — the item split into real children;
     relay every anchoring child id and tell the user `/fgOS:pick
     <child-id>` is how to continue on any of them.
   - **`awaiting-human`** — relay the parked split-work proposal/question
     exactly and tell the user to resolve it via `/fgOS:answer <id>
     <answer text>`.
   - **`blocked`** — relay the block exactly; never guess an answer or
     retry blind on this skill's own authority.
   - **no-progress** — relay it plainly; this is a real stop that needs a
     person's look (mirrors the old `invalid` outcome: the judgment came
     back unusable and the item was left untouched, fail-safe).

   A parked, blocked, or anchored outcome is a valid, expected result of
   this command, not a failure — say so plainly rather than treating it as
   one.
