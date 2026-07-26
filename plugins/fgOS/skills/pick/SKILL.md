---
name: pick
description: >-
  Use when the user wants to claim the next fgOS work item (or a specific
  one) and start working on it from inside a Claude Code session, invoked
  as /fgOS:pick [id]. Claims the item through fgOS's own pick verb (session
  actor, one-door-write), stands up its isolated worktree, and hands the
  current session into that worktree so work can begin immediately.
  Examples: "/fgOS:pick", "/fgOS:pick build-cli".
---

# fgOS pick

Wraps `fgos pick` so a person working inside Claude Code can claim a work
item and jump straight into its dedicated worktree, without hand-typing the
CLI or the `git worktree` commands underneath it. Never writes `.fgos/`
state or touches git worktrees directly — every write goes through the
`pick` verb (one-door-write, CTR001).

## Steps

1. **Read the optional id argument.** `$ARGUMENTS` is the work item id to
   claim, or empty to claim the current frontier head. Either way, pass it
   straight through to the verb in step 2 — do not validate or guess an id
   yourself; `pick` already does frontier-head defaulting and id validation.

2. **Claim the item and stand up its worktree.** Run:

   ```
   node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs pick $ARGUMENTS
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   If the command fails (e.g. the frontier is empty, the id doesn't exist,
   or the item isn't claimable), show the real error to the user and stop —
   do not retry with a guessed id and do not fall back to a hand-written
   claim.

   On success, read the command's JSON output for:
   - the claimed item's **id** (`data.id`),
   - the worktree's **path** (`data.worktree.path`).

3. **Hand the session to the claimed worktree.** If the `EnterWorktree`
   tool is available in this session's toolset, call it with `path` set to
   the worktree path read in step 2, switching the session into that
   worktree.

   If `EnterWorktree` is unavailable, refuses, or errors for any reason
   (for example, this session is already nested inside another worktree,
   which imposes a `.claude/worktrees/` location constraint that fgOS's own
   tmpdir-based worktree path won't satisfy) — do NOT fail or retry. Fall
   back instead: print the worktree path plainly and tell the user to open
   a new session there. This is the same fallback pattern `bee worktree
   new` already uses for the analogous case.

4. **Load `fgos-routing` — do not stop after the switch.** If step 3
   actually switched the session into the worktree, immediately invoke the
   `fgos-routing` skill before saying anything else to the user. That
   skill reads the claimed item's `stage` and `domain` and hands off to
   whichever skill actually does the work for this item today; follow
   that hand-off through and let it decide when to stop. This is what
   makes claiming through `/fgOS:pick` behave the same as an internal
   fgOS dev session, instead of leaving the person staring at a claimed
   item with no next step.

   If step 3 fell back (no switch happened), skip this step — the
   session the user opens at the printed worktree path loads
   `fgos-routing` itself first, per that skill's own "load it first when a
   session opens in this repo" convention.

5. **Report and stop.** In the fallback case, report right after step 3:
   tell the user which item id was claimed and the worktree path they
   need to open. In the switched case, this is naturally where step 4's
   hand-off ends up stopping — do not add a separate report step of your
   own on top of it. Do not reimplement or orchestrate the item's
   lifecycle beyond this.
