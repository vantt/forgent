---
name: merge-loop
description: >-
  Use when the user wants to merge every ready fgOS work item in sequence,
  unattended, until nothing is left or a safety condition trips — invoked
  as /fgOS:merge-loop. Wraps the existing /loop skill around
  /fgOS:merge-next, encoding the stop rules (frontier empty, Iron Law
  trip, or the same item blocked twice in a row) so a person never has to
  restate them by hand. Example: "/fgOS:merge-loop", "merge everything
  that's ready".
---

# fgOS merge-loop

Wraps the existing `loop` skill (invoked as `/loop`) around the existing
`/fgOS:merge-next` skill so a person can merge every ready item in
sequence without hand-typing `/loop /fgOS:merge-next` and re-deriving its
stop rules every time. Never writes `.fgos/` state directly, never
re-implements merge mechanics, and never adds a new CLI verb — `merge
next` and its underlying `approve`/CTR005 gate stay exactly as they are.

Not `ck-loop`: that is a separate, unrelated skill for mechanical-metric
optimization (`Goal`/`Scope`/`Verify`-single-number/`Guard` config,
git-commit-then-measure per iteration). This skill has no metric to
optimize — only a repeat-until-a-named-stop-condition task — so it
recurses into the plain `loop` skill instead, the one built for "run a
prompt on a recurring interval... omit the interval to let the model
self-pace."

## Steps

1. **Ignore `$ARGUMENTS`.** Neither `/loop` nor `/fgOS:merge-next` takes
   an id or any other argument for this flow — do not read, parse, or
   forward anything from the slash command's argument text.

2. **Pre-flight (soft warn only).** Run `git status --short` in the main
   checkout. If it reports anything, print a reminder that merging
   normally expects a clean working tree, then continue regardless — do
   not refuse to start. `/fgOS:merge-next`'s own `approve` gate already
   checks working-tree cleanliness on every single attempt
   (`isWorkingTreeClean`, `src/runner/merge.mjs`), so a dirty tree is
   caught downstream on the very first iteration if it's actually a
   problem; this step is a courtesy heads-up, not a second gate.

3. **Start the loop.** Invoke the `loop` skill with `prompt:
   "/fgOS:merge-next"`, and no fixed interval — let it self-pace
   dynamically. Each `/fgOS:merge-next` call runs a real `npm test`-class
   verify as part of `approve`, so how long one iteration takes varies by
   item; a fixed short interval would either hammer `merge-next` before
   the previous attempt could possibly matter, or sit idle needlessly
   long. Never write a bespoke timer/scheduling mechanism in this skill's
   own place of `/loop` — that would duplicate a working mechanism
   instead of reusing it.

4. **Read each iteration's result and decide whether to continue.** Every
   time `/fgOS:merge-next` runs, read its JSON envelope's `data` field:

   - `{picked: null, reason: "nothing ready to merge"}` — the frontier is
     empty. Stop the loop cleanly. Nothing to report as a problem.
   - `{picked: <id>, approve: {done}}` — a normal successful merge.
     Continue to the next iteration; forget any previously-tracked
     blocked id (a successful merge always resets the count for whatever
     was picked).
   - `{picked: <id>, approve: {blocked, reason: ...}}` (merge-conflict,
     verify-fail, or any other `approve`-reported block) or
     `{picked: <id>, blocked: "iron-law", ...}` — a blocked pick. Compare
     `<id>` against the id picked (and blocked) on the immediately
     preceding iteration:
     - **Different id, or this is the first blocked pick of the run** —
       normal. Continue to the next iteration, remembering this `<id>` as
       "last blocked."
     - **Same `<id>` blocked on two consecutive iterations in a row**
       (whether both are Iron Law, both are merge-conflict/verify-fail,
       or one of each) — stop the loop. Report the id and the block
       reason(s) in a plain chat message in the current conversation.
       Never call `fgos ask <id>` to park it, and never run
       `/fgOS:approve <id> --acknowledge-iron-law` on this skill's own
       authority — a person has to look at it.

5. **Report on stop.** Whichever condition ends the loop, say plainly
   which one it was (frontier empty vs. same-id-blocked-twice) and, for
   the latter, which id and why. There is nothing further to do
   automatically past that point.
