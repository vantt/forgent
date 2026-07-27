---
name: cook
description: >-
  Use when the user wants a free-text task driven end-to-end through fgOS's
  whole lifecycle in one session — submit, clarify, decompose, real
  implementation, and return — invoked as /fgOS:cook <free-text task
  description>. Pauses for real human approval at every dev-skill gate
  (fgos-exploring/fgos-planning/fgos-validating), auto-implements at stage
  executing, and stops once the item (and every child it split into) reaches
  status proposed — final merge review stays a human decision, never
  auto-approved. Examples: "/fgOS:cook add pagination to the list view",
  "/fgOS:cook fix the flaky retry test".
---

# fgOS cook

Drives a task from a single sentence to a real, verified, `proposed`
change — chaining the same verbs and dev-skills a person would use one at a
time (`submit` → `fgos-exploring` → `fgos-planning`/`fgos-validating` →
real implementation → `return`), so the user doesn't have to drive each
stage by hand. Every state transition goes through the `fgos` CLI (one-door-
write, CTR001) — this skill never writes `.fgos/` state directly, and it
never re-implements a dev-skill's substance inline; it invokes them.

## Hard rules

- **Never auto-approve a gate.** `fgos-exploring`'s CONTEXT.md gate,
  `fgos-planning`'s plan gate, and `fgos-validating`'s proof gate each end on
  a real question to the user. Ask it, wait for a real answer, and only
  proceed once it is actually approved — do not answer on the user's behalf
  and do not skip the question because the answer "seems obvious."
- **Stop at `proposed`, never merge.** Once `fgos return <id>` succeeds the
  id is `proposed`. That is the finish line for this skill — never call
  `fgos approve`/`fgos reject`/`fgos review` yourself; the internal PR
  review gate is a human decision, always.
- **Claiming only works at stage `executing`.** Verified empirically against
  this repo: `fgos take --actor session --id <id>` on a `clarify`-stage item
  is rejected — `"<id> is todo but not in the frontier yet (stage/deps/
  lineage)"`. Clarify/decompose work happens on the item while it is still
  `todo`, through `discover`/`ask`/`answer`/`decision` — never try to
  `take`/`pick` it before it reaches `executing`.
- **Reuse, never duplicate.** `fgos-exploring`, `fgos-planning`, and
  `fgos-validating` already define the Socratic/shaping/proving substance —
  invoke them (Skill tool) for their real work; this skill only owns the
  sequencing and the mechanical CLI calls between them.

## Steps

1. **Submit.** Follow the exact same protocol as the `submit` skill
   (`plugins/fgOS/skills/submit/SKILL.md`) against the free-text argument:
   scan `fgos list --json` for a textually-grounded dependency candidate,
   present it and require an explicit confirm/edit/reject before attaching
   anything, then call `fgos submit "<text>" [--deps <ids>]`. Capture the
   returned id as the root id and push it onto a work queue.

2. **Drain the queue.** While the queue is non-empty, take the id at its
   front and re-read its live `stage`/`status`/`deps` via
   `node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs list --json` — always fresh,
   never assumed, since every branch below can change it:

   - **`status: awaiting-human`** — read the question (either
     `data.work[id]`'s own gate, or `data.discovery["<id>"]`'s latest entry's
     `question` if a `discover` call parked it). Ask the user that question
     directly in this chat, get a real answer, then
     `fgos answer <id> --text "<answer>"`. Re-read and continue.

   - **`stage: clarify`** — invoke the `fgos-exploring` skill for this id.
     It scouts, runs its own Socratic round(s) directly in this chat, writes
     `docs/history/<feature>/CONTEXT.md`, and records each decision via
     `fgos decision`. It ends on its own gate ("Approve CONTEXT.md before
     planning?") — that pause IS this skill's approval point; do not answer
     it yourself. Once the user approves, call the mechanical engine:

     ```
     node ${CLAUDE_PROJECT_DIR}/repo/bin/fgos.mjs discover <id> --json
     ```

     (Same call the `discover` skill wraps — see
     `plugins/fgOS/skills/discover/SKILL.md` for its full outcome contract.)
     `clear` moves the item to `decompose` — re-read and continue. `unclear`
     parks it `awaiting-human` — handled by the branch above on the next
     pass.

   - **`stage: decompose`** — invoke `fgos-planning` (shaping: produces
     `plan.md`/phase files, decides split vs. single-shot; ends on its own
     approval gate) then `fgos-validating` (proving: validates the plan
     against reality; ends on its own approval gate) — two separate real
     pauses, never one collapsed into the other. Once both are approved,
     call the same engine command as above (`fgos discover <id> --json`; its
     decompose branch runs the split-work judgment) and handle `data.outcome`:
     - `pass-through` / `noop` — item is now `executing`; re-read and
       continue.
     - `decompose` — children were created (`data.childIds`). Push every
       child id onto the FRONT of the queue, ahead of the root — the root
       cannot clear decompose's "no unfinished descendants" gate until they
       are all `proposed`. Continue the loop.
     - `already-decomposed` — children already exist from an earlier
       interrupted run; do not recreate them, just re-read and continue.
     - `need-human` — treat exactly like the `awaiting-human` branch above,
       using `data.verdict`'s proposal as the question.
     - `invalid` — the judgment came back unusable and nothing changed on
       the item. Stop and report this to the user rather than silently
       retrying — this is `discover`'s own fail-safe, not something to
       route around.

   - **`stage: executing`** — real implementation, not paperwork:
     1. `fgos pick <id>` — claims it and stands up its isolated `fgw/<id>`
        worktree in one call (the first point in this whole loop where a
        claim is even valid, per the hard rule above).
     2. Enter that worktree (`EnterWorktree`, falling back the same way
        `/fgOS:pick`'s own skill does if it's unavailable). Read the item's
        description / linked `CONTEXT.md` / `plan.md`, implement the real
        change, and run its attached `verify` command until it actually
        passes. Commit.
     3. `fgos return <id>` — it measures real progress itself (clean tree,
        advanced HEAD, verify actually green); it does not take your word
        for it. If it rejects the return, fix the real gap and retry — never
        argue with it or fabricate progress.
     4. Once `return` succeeds the id is `proposed` — pop it off the queue.

3. **Report.** Once the queue is empty, summarize every id touched and its
   final status (`proposed`), list every `CONTEXT.md`/`plan.md` path written
   along the way, and tell the user the review gate
   (`fgos review`/`fgos approve`/`fgos reject`) is theirs to run next — this
   skill never calls it.

## Known gap (flagged, not guessed around)

`fgos-routing`'s own "Claim" section states an item still at
`clarify`/`decompose` can be claimed directly with `fgos take --id <id>`.
Tested against this repo's actual CLI, that call is rejected outright
("not in the frontier yet (stage/deps/lineage)"). This skill follows the
verified behavior — no claim before `executing` — rather than that prose;
reconciling `fgos-routing` itself is a separate, out-of-scope fix.
