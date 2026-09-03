---
authoritative_for: dispatch waiting-rule "end the turn, no tool call" guidance, ScheduleWakeup validation error recurrence after tsk-1uf
---

# The waiting-rule fix needed to say "end the turn," not just "don't call `ScheduleWakeup`"

`tsk-3f9k` closed a real gap that survived
[`tsk-1uf`'s own fix](return-approve-background-execution-guidance.md):
even after that fix added a "Do NOT use `ScheduleWakeup` or polling"
warning to `return-mechanics.md` and `wave-dispatch-mechanics.md`,
dispatch's background-wait flow kept hitting `Error: \`prompt\` is
required when \`stop\` is not true.` — the `ScheduleWakeup` required-param
validation error.

## Confirmed live, after the prior fix had already landed

Three fresh session transcripts, all captured after `tsk-1uf` (commit
`90ada78e`, 2026-08-20 08:42) had landed: in every case the agent
narrated something like "I'll wait for the harness's completion
notification rather than polling" immediately after starting a
backgrounded/Monitor-based dispatch — and the `ScheduleWakeup` validation
error appeared right after that narration, all three times. The agent
was still calling `ScheduleWakeup` with no `prompt`, despite the doc
warning already telling it not to.

## The actual gap: a prohibition without a positive instruction

The prior wording only said what *not* to do (don't call
`ScheduleWakeup`, don't poll) — it never stated the actual required
action: **end the turn with no further tool call** once Monitor/
background dispatch starts. The harness delivers a task-notification
automatically and resumes the session with the output already in
context; no tool call is needed, or permitted, to "wait" for it. An
agent reaching for *some* tool to represent "now I wait" defaulted to the
nearest-sounding one (`ScheduleWakeup`) even with the prohibition already
stated.

## What shipped

The Waiting-rule text, everywhere it appears with this pattern, was
strengthened to say explicitly: end the turn with no further tool call
once Monitor/background dispatch is started — the harness delivers a
task-notification automatically and resumes the session with the output
in context. Do NOT use `ScheduleWakeup` or polling. Updated across every
render copy: `return-mechanics.md`, `wave-dispatch-mechanics.md`, and
`_shared/executor-dispatch-fallback.md`'s Step B Monitor guidance
(`.agents/skills/`, `.claude/skills/`, `core/skills/`,
`domains/coding/skills/`, `plugins/fgOS/skills/`).

## A cross-branch commit-and-revert along the way

The first attempt at this fix (`bdff5895`) was committed directly onto
`fgw/tsk-24e` — an unrelated item's own worktree branch, not
`tsk-3f9k`'s — then reverted there (`4fd126e0`) once caught. The correct
version (`d6dbb6d4`, carrying materially the same wording) was redone on
`tsk-3f9k`'s own branch and merged to `main` cleanly. Confirmed by direct
git inspection: neither `bdff5895` nor its revert appear anywhere in
`main`'s linear history for the affected file; both commits exist only
on `fgw/tsk-24e`. Named here as a real, concrete instance of the
cross-branch/cross-worktree commit hazard this repo has hit before in
other sessions — not a new mechanism, but fresh confirmation of the same
risk class.
