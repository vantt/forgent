---
authoritative_for: worktree isolation state session-scoped hazard, EnterWorktree(existing path) stale-enforcement bug, out-of-process dispatch sidesteps the hazard entirely
---

# The worktree-isolation race in concurrent fanout, precisely characterized — and the fix that actually works

`tsk-u87` resolved a live-blocking hazard for `fgos-fanout`'s concurrent
dispatch: Claude Code's worktree-isolation state (which worktree
Bash/Edit/Write/git may target) is tracked at the **session** level, not
per dispatched agent — so a sub-agent entering its own worktree can
silently redirect the coordinator's or a sibling's next tool call into
the wrong worktree.

## Real incidents that motivated this

- **2026-08-13 (`tsk-1y0`):** 3 sub-agents dispatched concurrently. One
  sibling was starved completely (6 consecutive `Write` refusals, zero
  progress); the other two survived only via their own persistent
  retrying. The coordinator's own shell commands were also repeatedly
  redirected into a sibling's worktree.
- **2026-08-19 (N=1):** dispatching even a single sub-agent (no fan-out
  at all) redirected the coordinator's own next `Bash` call into that
  agent's worktree — confirming this isn't only a fan-out-scale (N≥2)
  problem.

## Step 1 — precisely characterizing the `isolation:"worktree"` + `EnterWorktree(existing path)` failure

Two separate questions, tested directly rather than assumed:

1. **Does `isolation:"worktree"` correctly scope isolation state per
   dispatched agent** (protecting the coordinator/siblings from the
   session-scoped-flag collision)? — **YES, confirmed.** A pinned agent's
   own `EnterWorktree` call left the coordinator completely unaffected,
   checked both before and after dispatch.
2. **Can a pinned agent then attach to a specific EXISTING worktree via
   `EnterWorktree({path: <existing>})` and keep operating normally
   inside it?** — **NO, still broken — and more precisely than a prior
   2026-08-13 finding described.** The call **reports success**, and the
   agent's real process `cwd` genuinely moves to the target path — but
   the isolation guard's own bookkeeping of "which worktree this agent
   may operate in" never updates to match. Every subsequent tool call is
   refused, because the agent's real cwd and its guard-permitted cwd now
   permanently disagree, with no recovery path for the rest of that
   agent's run. This is a **sharper, more actionable, and more dangerous**
   characterization than "cannot re-enter an existing worktree" — the
   call doesn't refuse outright, it silently reports success while
   leaving enforcement stale, so a caller reading only the success
   message would wrongly believe the switch worked.

## Step 3 — a real 3-agent concurrent fanout, testing `tsk-8v1`'s self-recovery instruction

Result: **0/3 completed**, though the coordinator itself stayed clean
throughout. Two independent reasons the self-recovery instruction (in
`fgos-fanout/SKILL.md`) is not sufficient as written:

1. It only ever reaches the **coordinator's own** reading material — the
   dispatched `/fgOS:pick` agents' own skill chain (`pick` →
   `fgos-coding-driving` → `fgos-coding-implement`) says nothing about
   this hazard at all. None of the 3 dispatched agents had ever heard of
   the instruction; they improvised their own recovery from first
   principles.
2. Even where an agent independently rediscovered the core recovery move
   (re-calling `EnterWorktree`), it only recovers `Bash` usability, never
   actual progress on the claimed item — the refused operation targeted
   the broken worktree switch itself, so retrying it doesn't fix
   anything.

## Step 4 — the fix that actually works: dispatch out-of-process instead

**Result: 3/3 completed the full cycle, zero collision** — a decisive,
user-directed test of a fundamentally different mechanism. An
out-of-process worker (`agy`/gemini, spawned via `dispatch.mjs execute`)
is a genuinely separate OS subprocess whose `cwd` is set directly at
spawn time by ordinary Node code — it never touches `EnterWorktree` or
the Claude-Code-tool-call isolation guard at all. Method: claimed 3
disposable items via plain `fgos pick` (real `git worktree add`, no
`EnterWorktree` tool involved), then invoked `executeExecutorCli`
directly 3 times concurrently via `Promise.allSettled`, each call's `cwd`
explicitly set to its own already-claimed worktree path.

All three subprocesses independently read their own real prompt, wrote
only inside their own worktree, ran their own verify command, committed
on their own branch, and reported `[DONE]` — confirmed independently via
each worktree's real `git log`/`git status` (no cross-writes, no missing
files), and `fgos return` re-verified all 3 for real (never trusting the
worker's own say-so). The coordinating session's own `pwd`/`git
rev-parse` were unaffected throughout, exactly as expected — this path
never calls a tool the isolation guard watches at all.

**Out-of-process dispatch is not a workaround for the session-scoped
isolation hazard — it is a different mechanism the hazard's own
precondition (calling `EnterWorktree`) never applies to.**

## What this changes for `fgos-fanout` and `tsk-4bq`

`tsk-4bq` had separately found that `fgos-fanout`, run exactly as written,
refuses to fire ANY candidate once `fgos-coding-implement` is pinned
out-of-process — it only ever fires native Task-tool Agents, treating
`out-of-process` as "needs a person" rather than a real working
alternative. This item's result supplies the missing half: the
out-of-process path `fgos-fanout` currently refuses to use is
demonstrably **more reliable for concurrent worktree claiming** than the
native path this whole investigation spent three steps failing to make
safe. `tsk-4bq`'s own scope widened accordingly: `fgos-fanout` should
actually dispatch out-of-process candidates for real, not merely detect
and defer them to a person.

## The reusable takeaway

For any future concurrent multi-agent dispatch design in this repo:
native Task-tool `Agent(isolation:"worktree")` dispatch is safe only when
each agent stays inside the fresh worktree it was pinned to at launch —
attaching to a different, already-existing worktree afterward via
`EnterWorktree({path: ...})` is confirmed broken (silent stale
enforcement), not merely undocumented. When concurrent dispatch needs to
target specific, pre-existing claimed worktrees (the shape `fgos-fanout`
actually needs), route through out-of-process executor dispatch instead
— it sidesteps the whole hazard class by construction.
