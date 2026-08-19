---
name: pick
description: >-
  Use when the user wants to claim the next fgOS work item (or a specific
  one) and start working on it from inside a Claude Code session, invoked
  as /fgOS:pick [id]. Claims the item through fgOS's own pick verb (session
  role, one-door-write), stands up its isolated worktree, and hands the
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

1. **Read the optional id argument, and the optional `--autoClose` flag.**
   `$ARGUMENTS` is the work item id to claim, or empty to claim the current
   frontier head, plus an optional trailing `--autoClose` token — opt-in
   only, never a new default. Strip a trailing `--autoClose` token from
   `$ARGUMENTS` before passing the rest through to the verb in step 2 —
   when absent, `$ARGUMENTS` is unchanged and this skill's behavior is
   byte-identical to before this option existed. Do not validate or guess
   the id itself; `pick` already does frontier-head defaulting and id
   validation. Remember whether `--autoClose` was present — it is read
   again at step 6.

2. **Claim the item and stand up its worktree.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   pick $ARGUMENTS --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir`: most picks run from the main checkout, where this is
   a no-op — but the chaining case (a session already inside a root
   item's worktree calling `/fgOS:pick` again on a child item, via a
   second in-session `EnterWorktree`) means this cwd can already BE a
   linked worktree, which never carries its own `.fgos/` by design.
   `${CLAUDE_PROJECT_DIR}` still resolves to the main checkout even from
   inside that worktree (it survives an `EnterWorktree` switch), so
   passing it as `--dir` here keeps the chained claim writing to the one
   real store instead of refusing.

   If the command fails (e.g. the frontier is empty, the id doesn't exist,
   or the item isn't claimable), show the real error to the user and stop —
   do not retry with a guessed id and do not fall back to a hand-written
   claim.

   On success, read the command's JSON output for:
   - the claimed item's **id** (`data.id`),
   - the worktree's **path** (`data.worktree.path`).

3. **Rename the pane via `/fgOS:terminal`.** This has to run after
   step 2 (never before): the claimed **id** is only known once the
   claim call returns, including the frontier-default case (`/fgOS:pick`
   with no id argument).

   This is `/fgOS:terminal`'s own `rename` behavior, invoked directly here
   rather than through a second slash-command round trip:

   ```
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal/rename.sh "<id>" "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   substituting `<id>` from step 2's `data.id`. This call is decoration,
   never a gate — per the `terminal` skill's own contract it always exits
   `0`, silently doing nothing when the session isn't inside a
   herdr-managed pane. Never stop or retry pick's own flow based on its
   result.

   (Showing the claimed item's title/description to the user no
   longer happens here — it moved to `fgos-coding-driving`'s own Loop,
   which step 5 below already invokes and which now prints it once, right
   before the worktree/claim branch, the same position this step used to
   show it in. Duplicating it here too would print it twice.)

4. **Hand the session to the claimed worktree.** If the `EnterWorktree`
   tool is available in this session's toolset, call it with `path` set to
   the worktree path read in step 2, switching the session into that
   worktree.

   If `EnterWorktree` is unavailable, refuses, or errors for any reason
   (for example, this session was already nested inside another worktree
   *before* this claim, a still-real limit — `EnterWorktree` flatly refuses
   to stand up a brand-new worktree from inside an existing one) — do NOT
   fail or retry. Fall back instead: print the worktree path plainly and
   tell the user to open a new session there. This is the same fallback
   pattern `bee worktree new` already uses for the analogous case.

   Pick's own worktree lives under `.claude/worktrees/` precisely
   so a session already switched into a root item's worktree CAN chain a
   second, in-session `EnterWorktree` call into a child item's worktree
   (e.g. the root decomposing into children mid-session) — that specific
   case no longer needs this fallback at all.

   **Never bypass this step with a raw `git checkout <fgw/branch>` on the
   main checkout** — the main checkout is the one
   shared working tree every session's `fgos <verb>` call resolves against;
   checking a work branch out there instead of into its own worktree mixes
   that branch's tree with whatever else is in flight elsewhere in the
   backlog. If `EnterWorktree` falls back per above, open a fresh session
   at the printed path rather than hand-checking-out the branch in this
   one.

   **Never run a raw `git reset --hard` on the main checkout without a
   full `git status` first** — a
   session that checks only the files it meant to touch, not the whole
   tree, can silently discard another in-flight session's uncommitted work
   with no stash/reflog/blob to recover it (the main checkout is shared
   across every session's `fgos <verb>` call, same as the branch-checkout
   danger above). Use `fgos main-checkout-reset --sha <sha> [--confirm]`
   instead — it shows the full whole-repo status and refuses without
   `--confirm` when the tree is dirty.

5. **Drive the claimed item via `fgos-coding-driving` — do not
   stop after the switch.** If step 4 actually switched the session into
   the worktree, immediately invoke the `fgos-coding-driving` skill for
   this id, no `ceiling` (omit it — the driver's own implicit stops
   already cover this correctly: `awaiting-approval`, an anchor by open
   children, a person-shaped stop, or a no-progress read). The driver
   reads the claimed item's `stage`/`domain` fresh and resolves each
   stage's skill through the exact same registry lookup `fgos-routing`
   itself uses — this step never re-derives that mapping on its own,
   it only supplies the id and lets the driver run. Follow the driver's
   own stop through to whatever it reports (see step 6) — this is what
   makes claiming through `/fgOS:pick` behave the same as an internal
   fgOS dev session, instead of leaving the person staring at a claimed
   item with no next step. The item was ALREADY claimed in step 2, before
   this point — the driver's own claim-timing rule sees `status: doing`
   on its first read and correctly skips claiming again, proceeding
   straight into whichever stage-skill the item's `stage` resolves to.

   If step 4 fell back (no switch happened), skip this step — the
   session the user opens at the printed worktree path loads
   `fgos-routing` itself first, per that skill's own "load it first when a
   session opens in this repo" convention (which, for a coding-domain
   item, routes into `fgos-coding-driving` the same way this step does).

6. **Report and stop.** In the fallback case, report right after step 4:
   tell the user which item id was claimed and the worktree path they
   need to open. In the switched case, report whatever `fgos-coding-
   driving` itself reported:
   - **`awaiting-approval` reached** — the item is built, verified, and
     returned; tell the user and mention the review gate
     (`fgos review`/`fgos approve`/`fgos reject`) is theirs to run next,
     this skill never calls it. `fgos approve` refuses to run from inside
     a linked worktree ("this is a git worktree, not the repository main
     working tree") — this session is sitting in exactly that worktree
     (step 4 switched into it), so tell the user (or do it yourself if
     driving on their behalf) to leave it first: `ExitWorktree` with
     `action: "keep"`, then run `fgos approve` from the main checkout.
   - **anchored by open children** — the driver's own planning pass split
     this item; tell the user which child ids are still open and that
     `/fgOS:pick <child-id>` is the way to continue on any of them.
   - **a person-shaped stop (`awaiting-human`) or a real block
     (`blocked`)** — relay the question or the block exactly as the driver
     reported it; never guess an answer or retry blind on this skill's own
     authority.
   - **no-progress** — relay it plainly; this is a real stop that needs a
     person's look, not a silent retry.
   Do not add a separate report step of your own beyond relaying the
   driver's own stop reason. Do not reimplement or orchestrate the item's
   lifecycle beyond this.

   **If `--autoClose` was passed (step 1) and the driver's stop is one of
   `awaiting-approval` reached, anchored by open children, or
   `awaiting-human`** — an advance or a legitimate park — call
   `/fgOS:terminal-close` as the literal last action of this skill's own
   flow, invoked directly here the same way step 3 already calls
   `terminal/rename.sh` rather than through a second slash-command round
   trip:

   ```
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal-close/close.sh
   ```

   Never call this on `blocked` or no-progress — the pane must stay open
   for a person to debug. Never call it if `--autoClose` was not
   passed. Nothing runs after this call — it is unconditionally the final
   statement of this skill's flow when it fires, with no delay before it.
