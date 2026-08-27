---
name: cook
description: >-
  Use when the user wants a free-text task driven end-to-end through fgOS's
  whole lifecycle in one session — submit, discovery, planning, real
  implementation, and return — invoked as /fgOS:cook <free-text task
  description>. Each dev-skill gate (fgos-coding-exploring's context gate,
  fgos-coding-validating's single merged plan/proof gate) auto-approves
  when the repo's configured gate-bypass level covers it, otherwise pauses
  for real human approval — auto-
  implements at stage executing, and stops once the item (and every
  child it split into) reaches status awaiting-approval — final merge
  review always stays a human decision, never auto-approved, regardless
  of gate-bypass. Examples: "/fgOS:cook add pagination to the list view",
  "/fgOS:cook fix the flaky retry test".
---

# fgOS cook

Drives a task from a single sentence to a real, verified, `awaiting-approval`
change — chaining the same verbs and dev-skills a person would use one at a
time (`submit` → `fgos-coding-exploring` → `fgos-coding-planning`/`fgos-coding-validating` →
real implementation → `return`), so the user doesn't have to drive each
stage by hand. Every state transition goes through the `fgos` CLI (one-door-
write, CTR001) — this skill never writes `.fgos/` state directly, and it
never re-implements a dev-skill's substance inline; it invokes them.

## Hard rules

- **Never bypass a gate beyond what its own dev-skill already permits.**
  `fgos-coding-exploring`'s CONTEXT.md gate and `fgos-coding-validating`'s
  single merged plan/proof gate (the one gate in stage `planning`, per
  `docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1 —
  `fgos-coding-planning` itself has no gate) each check the repo's
  configured gate-bypass level themselves (`canAutoApprove`/
  `canAutoApproveMergedGate`, `docs/history/gate-bypass/CONTEXT.md` D1-D6,
  superseded by `coding-planning-validating-gate-redesign/CONTEXT.md`
  D9-D11) and only skip their own question when that check returns true —
  this skill's driver invokes those dev-skills unchanged either way (see
  step 2 below) and never second-guesses, forces, or fakes an
  auto-approve/human-approve record on its own authority. When a gate's
  own check does NOT clear it, that gate asks a real question — answer it
  for real, wait for it, and never skip it because the answer "seems
  obvious."
- **Stop at `awaiting-approval`, never merge.** Once `fgos return <id>` succeeds the
  id is `awaiting-approval`. That is the finish line for this skill — never call
  `fgos approve`/`fgos reject`/`fgos review` yourself; the internal PR
  review gate is a human decision, always.
- **This skill now claims before handing an id to the driver, one id at a
  time** — `fgos-coding-driving`'s own claim-timing hard rule (tsk-19j-4)
  still only claims a worktree right before the `executing`-stage skill
  when the caller hasn't already claimed it, but nothing forces a caller
  to wait that long: without an earlier claim, every stage before
  `executing` (`discovery`/`exploring`/`planning`) writes and commits its
  own docs (`CONTEXT.md`, `plan.md`) straight onto whatever checkout this
  skill was invoked from, dirtying it the same way
  `fgos-coding-shaping`'s own branch-isolation fix found and closed for
  its caller. Step 2 below claims (`fgos pick <id>` + `EnterWorktree`)
  before its FIRST `fgos-coding-driving` invocation for the id at the
  front of the queue — the same pattern `/fgOS:pick`'s own step 2/4 and
  `fgos-coding-shaping`'s own claim step already use — so the driver's own
  claim-timing rule reads `status: doing` on its first check and skips its
  own claim, exactly as it already does whenever `/fgOS:pick` claims
  first. `take`/`pick` both accept an explicit `--id` claim on a
  pre-`executing` item too (`choke-point-take-vs-pick-claim-eligibility`
  fixed the prior disagreement between the two verbs — see "Known gap"
  below).
- **Reuse, never duplicate.** `fgos-coding-exploring`, `fgos-coding-planning`,
  `fgos-coding-validating`, and `fgos-coding-driving` (tsk-19j-4) already define
  the Socratic/shaping/proving/driving substance — invoke them (Skill tool)
  for their real work; this skill only owns the id QUEUE the driver has no
  concept of, one id at a time, never split into concurrent flows.
  `fgos-fanout` is a real capability (`fgos-coding-driving`'s own "Caller
  contract" section says a caller MAY opt into it for concurrency) but this
  skill deliberately never opts in — one item, one queue, one flow, so the
  person driving `/fgOS:cook` never has to reason about what several
  concurrent Agents did to the backlog while it ran (see step 2).
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
   scan `fgos list --all --json` for a textually-grounded dependency candidate,
   present it and require an explicit confirm/edit/reject before attaching
   anything, then call `fgos submit "<text>" [--deps <ids>]`. Capture the
   returned id as the root id and push it onto a work queue.

2. **Drain the queue, one id at a time, via `fgos-coding-driving`
   (tsk-19j-4).** While the queue is non-empty, take the id at its front.
   Before this id's FIRST `fgos-coding-driving` invocation this pass —
   never before a later re-invocation of the SAME id after a
   person-shaped stop, the claim already holds by then — claim it
   (`fgos pick <id>`) and `EnterWorktree` into the returned
   `data.worktree.path`, the same claim+enter pattern `/fgOS:pick`'s own
   step 2/4 and `fgos-coding-shaping`'s own claim step already use. If
   `EnterWorktree` is unavailable or refuses, fall back exactly the way
   `/fgOS:pick`'s own step 4 does: print the worktree path and tell the
   user to open a new session there, rather than failing or retrying. Only
   once claimed and (when the fallback didn't fire) switched into the
   worktree, invoke the `fgos-coding-driving` skill for it, no `ceiling` (omit it —
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
     ids are open (it never resolves this itself, by design).
     `fgos-coding-driving`'s own "Caller contract: what to do with an
     anchored-by-open-children report" section makes concurrency
     (`fgos-fanout`) an OPTION a caller may take, never a requirement —
     this skill does not take it. Push every reported open child id onto
     the FRONT of the queue (in the order reported), then push the
     anchoring parent id back onto the queue directly after them, and
     continue draining. Each child then runs through this same step's
     dispatch on its own later turn — one id at a time, front to back,
     never concurrently and never through `fgos-fanout`. Once every child a
     parent anchored on reaches a terminal status, that parent's own anchor
     clears on the fresh read its queued turn does, and it proceeds
     normally from there — the same as any other id's turn, no special
     case.
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

   Every real gate a stage-skill hits along the way (`fgos-coding-exploring`'s
   "Approve CONTEXT.md?", `fgos-coding-planning`'s "Approve before execution?",
   `fgos-coding-validating`'s "Approve moving to executing?") still surfaces
   exactly as before — the driver invokes those skills unchanged, it does
   not swallow or pre-answer their own gates. The `planning`→`executing`
   edge itself releases the claim this step took above back to `todo`
   (`releaseClaimOnExecuting`, claim-lock §3b) the moment the item reaches
   `executing` — so the driver's own claim-timing rule re-claims
   (`fgos pick <id>` + `EnterWorktree`) right before its own first
   `fgos-coding-implement` invocation, exactly the point this step used to
   do it by hand before this fix, unaffected by the earlier claim above.
   `fgos-coding-implement` then implements, verifies, and calls
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
`discovery`/`exploring`/`planning` can be claimed directly with `fgos take
--id <id>`.
That prose used to be wrong — `take --id <id>` on a pre-`executing` item
was rejected outright ("not in the frontier yet (stage/deps/lineage)"),
while `pick --id <id>` accepted the same claim. `choke-point-
take-vs-pick-claim-eligibility` closed that gap: `take`'s explicit `--id`
branch now checks deps-done + no-open-descendant only, the same
stage-independent stance `pick` already took, so the prose is accurate
again. This skill's own sequencing now uses that same `take`/`pick`
eligibility directly — it claims before stage `executing` too (see the
hard rule above), the fix this file's own branch-isolation follow-up
made, not a workaround for a broken `take`.
