---
type: explanation
title: Why fanout's worktree isolation race is a recoverable self-heal, not a lowered batch cap
tags: [fgos-fanout, worktree, isolation, concurrency, harness]
source_capture_ids: [tsk-2k0, tsk-8v1]
authoritative_for: why fgos-fanout treats a dispatched Agent's worktree-isolation refusal as a recoverable race instead of lowering its batch cap or serializing dispatch
framework: diataxis
mode: explanation
---
# Why fanout's worktree isolation race is a recoverable self-heal, not a lowered batch cap

`tsk-2k0`. `fgos-fanout` is designed to fire up to 5 Agents at once, each
running `/fgOS:pick <id>` end to end — which stands up and enters its own
worktree as part of its own claim step. This item's real incident showed
that assumption does not hold cleanly at the harness level.

## The observed incident

During the worker-slot batch, two subagents were dispatched in one
session, each claiming its own item and entering its own worktree. Within
minutes, the first reported its working directory had silently switched
into the second worktree without it doing anything — and the drift kept
recurring afterward, including several times after the sibling had
already been paused, which is the evidence that ruled out "two drivers
briefly racing each other" as the whole story.

The root cause: the harness's own worktree-isolation state is held at
**session** level, not per dispatched Agent. Every `EnterWorktree` call
clobbers the same shared flag, so a sibling Agent's Edit/Write/Bash call
can be refused as targeting the wrong worktree
(`"isolated in the worktree X"`), and the coordinating session's own
working directory can drift into a sibling's worktree mid-run.

No write ever actually landed in the wrong tree — the isolation guard
refused the redirected writes, and both drivers had been told to use
absolute paths as a second line of defense — but the parallel plan still
had to be abandoned and the batch serialized for that session, because
nobody yet knew whether the hazard was structural or incidental.

## Why this is not fgOS's own bug to patch

This is explicitly named as a harness-level limitation — Claude Code
tracks "current worktree" per *session*, not per concurrently-dispatched
Agent — not something living in this repo's own source. fgOS cannot fix
the harness; the only thing this item could actually do was establish
whether concurrent worktree-entering dispatch is safe at all, and if not,
say so plainly in the skill instead of letting the next reader assume it
works.

## The chosen fix: treat the refusal as a recoverable race, never lower the cap

The temptation, faced with a real concurrency hazard, is to shrink the
batch size or serialize dispatch entirely. `fgos-fanout` explicitly
rejects that: lowering the batch cap below 5 would remove fanout's entire
reason to exist — true concurrency. Instead, every dispatched Agent (and
the coordinating session) carries a skill-layer self-recovery
instruction:

1. Treat a refusal containing `"isolated in the worktree X"` (or any
   operation refused on an active-worktree mismatch) as a **recoverable
   race**, never a fatal error.
2. On that refusal, immediately re-call `EnterWorktree` targeting the
   agent's own active worktree, then retry the exact operation (Edit,
   Write, or Bash) that was refused.
3. Never respond to this hazard by lowering the batch cap — concurrency
   is preserved by relying on this self-recovery instruction, not by
   avoiding the race.

## New evidence the self-recovery instruction actually holds (`tsk-8v1`)

`tsk-2k0`'s own fix only documented the hazard in `fgos-fanout/SKILL.md`'s
"Known hazard" section — it never touched the underlying mechanism. A
related item, `tsk-1y0`, tried to reopen this and ended `wontfix` (a
terminal state the status machine cannot reopen). `tsk-8v1` picked the
thread back up with fresh, real evidence and a narrower, explicitly
scoped fix.

**New evidence, N=1** (2026-08-19): dispatching a *single* Agent via the
Task tool (not even a full `fgos-fanout` batch — a smoke test for a
different item) was enough to pull the coordinating session's own cwd
into the dispatched agent's worktree. A coordinator bash call was refused
`"isolated in the worktree <path>"` even though the coordinator itself
had never called `EnterWorktree`. Recovery was clean: `ExitWorktree({action:
"keep"})`, then continuing normally — no algorithm needed, just
recognizing the right error signal and self-correcting (the exact
recovery pattern this session used for itself earlier in this same
drive, for an unrelated worktree-exit need).

Combined with `tsk-1y0`'s own older evidence (a real 3-way fanout batch:
one sibling fully starved after 6 consecutive refused writes and gave up,
the other two survived via their own retries; the starved one recovered
cleanly once redispatched down to 1-way contention), the pattern held
across both a 3-way real incident and a fresh N=1 one: recognizing "refused
for the wrong worktree" as a recoverable race and self-correcting via
`EnterWorktree` back into one's own worktree was sufficient both times,
with **no additional algorithm or Loop-level mechanism** needed on top.

**Locked scope for `tsk-8v1` itself** (2026-08-19): mechanical only —
rewrite `fgos-fanout/SKILL.md`'s "Known hazard" section (and its
`.agents/` mirror) so every dispatched Agent *and* the coordinating
session treat one refused Edit/Write/Bash call as a recoverable race:
re-`EnterWorktree` into their own worktree, then retry the exact refused
operation. Still never lower the batch cap as the fix — that removes
fanout's own reason to exist. The live empirical proof (a real ≥3-candidate
fanout batch, cap not lowered, observing whether every participant
actually self-recovers) was explicitly filed as a separate follow-up
item — this item's own worker (an out-of-process worker with no live
Agent/Task-tool access) could not safely run that test itself.

## Scope boundary: this hazard sits entirely in the in-process dispatch path

The self-recovery instruction is explicitly scoped out of the
out-of-process wave-dispatch path (`dispatch.mjs fanout-batch`,
`fgos schedule --candidates`) — that path never calls a native `Agent`'s
own `EnterWorktree`, so it structurally cannot hit this hazard.
Consolidating out-of-process dispatch into `dispatch.mjs` therefore never
touches, fixes, or claims to improve this hazard one way or the other;
the two paths are independent with respect to this specific race.
