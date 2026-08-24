---
type: explanation
title: Why fanout's worktree isolation race is a recoverable self-heal, not a lowered batch cap
tags: [fgos-fanout, worktree, isolation, concurrency, harness]
source_capture_ids: [tsk-2k0]
authoritative_for: why fgos-fanout treats a dispatched Agent's worktree-isolation refusal as a recoverable race instead of lowering its batch cap or serializing dispatch
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

## Scope boundary: this hazard sits entirely in the in-process dispatch path

The self-recovery instruction is explicitly scoped out of the
out-of-process wave-dispatch path (`dispatch.mjs fanout-batch`,
`fgos schedule --candidates`) — that path never calls a native `Agent`'s
own `EnterWorktree`, so it structurally cannot hit this hazard.
Consolidating out-of-process dispatch into `dispatch.mjs` therefore never
touches, fixes, or claims to improve this hazard one way or the other;
the two paths are independent with respect to this specific race.
