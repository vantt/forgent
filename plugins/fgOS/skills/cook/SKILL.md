---
name: cook
description: >-
  Use when the user wants a free-text task driven end-to-end through fgOS's
  whole lifecycle in one session — submit, clarify, decompose, real
  implementation, and return — invoked as /fgOS:cook <free-text task
  description>. Pauses for real human approval at every dev-skill gate
  (fgos-exploring/fgos-planning/fgos-validating), auto-implements at stage
  executing, and stops once the item (and every child it split into) reaches
  status awaiting-approval — final merge review stays a human decision, never
  auto-approved. Examples: "/fgOS:cook add pagination to the list view",
  "/fgOS:cook fix the flaky retry test".
---

# fgOS cook

Drives a task from a single sentence to a real, verified, `awaiting-approval`
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
- **Stop at `awaiting-approval`, never merge.** Once `fgos return <id>` succeeds the
  id is `awaiting-approval`. That is the finish line for this skill — never call
  `fgos approve`/`fgos reject`/`fgos review` yourself; the internal PR
  review gate is a human decision, always.
- **This skill still never claims before stage `executing`** — now enforced
  by `fgos-coding-driving`'s own claim-timing hard rule (tsk-19j-4), not by
  this skill's own manual step ordering. `take`/`pick` both accept an
  explicit `--id` claim on a `clarify`/`decompose` item too
  (`choke-point-take-vs-pick-claim-eligibility` fixed the prior
  disagreement between the two verbs — see "Known gap" below), but nothing
  in this skill's own queue-draining ever needs that: clarify/decompose
  work happens on the item while it is still `todo`, exactly as the driver
  already handles it.
- **Reuse, never duplicate.** `fgos-exploring`, `fgos-planning`,
  `fgos-validating`, and `fgos-coding-driving` (tsk-19j-4) already define
  the Socratic/shaping/proving/driving substance — invoke them (Skill tool)
  for their real work; this skill only owns the id QUEUE the driver has no
  concept of.
- **Never bypass the driver's own claim step with a raw `git checkout
  <fgw/branch>` on the main checkout** (tsk-4hk: `docs/journals/260803-1612-
  main-checkout-direct-branch-checkout-tsk-4hk.md`) — the main checkout is
  the one shared working tree every session's `fgos <verb>` call resolves
  against; checking a work branch out there instead of letting the driver's
  claim step (`fgos pick <id>` + `EnterWorktree`) isolate it mixes that
  branch's tree with whatever else is in flight elsewhere in the backlog.
- **Never run a raw `git reset --hard` on the main checkout without a full
  `git status` first** (tsk-3au: `docs/history/main-checkout-destructive-
  git-safety-net/CONTEXT.md`) — checking only the files you meant to touch
  can silently discard another in-flight session's uncommitted work, with
  no stash/reflog/blob to recover it. Use `fgos main-checkout-reset --sha
  <sha> [--confirm]` instead — it shows the full whole-repo status and
  refuses without `--confirm` when the tree is dirty.

## Steps

1. **Submit.** Follow the exact same protocol as the `submit` skill
   (`plugins/fgOS/skills/submit/SKILL.md`) against the free-text argument:
   scan `fgos list --json` for a textually-grounded dependency candidate,
   present it and require an explicit confirm/edit/reject before attaching
   anything, then call `fgos submit "<text>" [--deps <ids>]`. Capture the
   returned id as the root id and push it onto a work queue.

2. **Drain the queue, one id at a time, via `fgos-coding-driving`
   (tsk-19j-4).** While the queue is non-empty, take the id at its front and
   invoke the `fgos-coding-driving` skill for it, no `ceiling` (omit it —
   the driver's own implicit stops already cover everything this step used
   to hand-roll: `awaiting-approval`, an anchor by open children, a
   person-shaped stop, or a no-progress read). This skill never re-derives
   which skill a stage maps to, never applies a stage/status transition
   itself, and never decides claim-timing on its own — the driver already
   owns all three (its own hard rules: registry-only stage lookup, "engine's
   verb always wins", "claim right before the first `executing`-stage
   invocation, never earlier"). This step's whole job is the QUEUE the
   driver itself has no concept of — one id at a time, front to back — and
   relaying the driver's stop reason:

   - **`awaiting-approval` reached** — the id is done for this pass. Pop it
     off the queue and continue draining.
   - **anchored by open children** — the driver just reports which child
     ids are open (it never resolves this itself, by design). Push every
     one of those child ids onto the FRONT of the queue, ahead of the id
     that just anchored (which stays on the queue, behind them, to
     naturally clear once they're all done) — same "children before root"
     order this step always kept, now driven by the driver's own anchor
     report instead of `decompose`'s raw `childIds`. Continue draining.
   - **a person-shaped stop (`status: awaiting-human`)** — read the parked
     question (`data.work[id]`'s own gate, or `data.discovery["<id>"]`'s
     latest entry) and ask the user directly in this chat. Get a real
     answer, then `fgos answer <id> --text "<answer>"`, and invoke the
     driver again for the SAME id (never skip it or move on) — this is
     this skill's own approval-gate contract (see Hard rules): the driver
     stops at every real question, it never answers on the user's behalf.
   - **a real block (`status: blocked`)** — stop and report this to the
     user rather than silently retrying; this mirrors the old `invalid`
     outcome's own stop (a judgment or a verify that came back unusable is
     never something to route around).
   - **no-progress** — same treatment as a real block: stop, report, let a
     person look at it.

   Every real gate a stage-skill hits along the way (`fgos-exploring`'s
   "Approve CONTEXT.md?", `fgos-planning`'s "Approve before execution?",
   `fgos-validating`'s "Approve moving to executing?") still surfaces
   exactly as before — the driver invokes those skills unchanged, it does
   not swallow or pre-answer their own gates. Same for the real
   implementation work at `stage: executing`: the driver's own claim-timing
   rule claims the id and enters its worktree at exactly the point this
   step used to do it by hand (`fgos pick <id>` then `EnterWorktree`), then
   invokes `fgos-executing`, which implements, verifies, and calls
   `fgos return <id>` itself — never taking anyone's word for real progress,
   the same "measures real progress itself" contract this step always
   relied on.

3. **Report.** Once the queue is empty, summarize every id touched and its
   final status (`awaiting-approval`), list every `CONTEXT.md`/`plan.md` path written
   along the way, and tell the user the review gate
   (`fgos review`/`fgos approve`/`fgos reject`) is theirs to run next — this
   skill never calls it.

## Known gap (fixed)

`fgos-routing`'s own "Claim" section states an item still at
`clarify`/`decompose` can be claimed directly with `fgos take --id <id>`.
That prose used to be wrong — `take --id <id>` on a `clarify`-stage item
was rejected outright ("not in the frontier yet (stage/deps/lineage)"),
while `pick --id <id>` accepted the same claim. `choke-point-
take-vs-pick-claim-eligibility` closed that gap: `take`'s explicit `--id`
branch now checks deps-done + no-open-descendant only, the same
stage-independent stance `pick` already took, so the prose is accurate
again. This skill's own sequencing is unaffected — it still never claims
before stage `executing` (see the hard rule above), by choice, not by
working around a broken `take`.
