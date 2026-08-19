# tsk-u87 — RESEARCH.md

## STEP 1 RESULT: pinned agent + EnterWorktree(existing path) — confirmed still broken, more precisely than previously understood

**Method.** From this coordinating session (worktree
`.claude/worktrees/tsk-u87-DC47tf`), created a real, throwaway worktree
via plain `git worktree add` at `.claude/worktrees/tsk-u87-disposable-
target` (branch `tsk-u87-disposable-target-branch`, off `main`) — this is
the "real, pre-existing worktree path" plan.md's Step 1 called for.
Dispatched exactly one sub-agent via the Agent tool with
`isolation: "worktree"` (pins it at launch to its own fresh, throwaway
worktree, `agent-a08ef32c289abe9d5`). Instructed it to call
`EnterWorktree({path: <the disposable target path>})`, then run a series
of Bash/Write calls inside the (presumably) now-target worktree, quoting
every raw tool result verbatim rather than paraphrasing.

**Raw result from the dispatched agent** (all 7 steps, verbatim):

1. Starting state: `pwd` / `git rev-parse --show-toplevel` both returned
   its own pinned launch worktree,
   `/home/vantt/projects/forgentX/.claude/worktrees/agent-a08ef32c289abe9d5`.
2. Called `EnterWorktree({path: ".../tsk-u87-disposable-target"})`.
3. **The call reported SUCCESS**: "Entered worktree at
   .../tsk-u87-disposable-target on branch tsk-u87-disposable-target-branch.
   This agent's working directory and write access now point at the
   worktree; the previous directory was left untouched."
4. Immediately after, a plain `pwd` was **refused**: "This agent is
   isolated in the worktree .../agent-a08ef32c289abe9d5, but this
   command's working directory resolved to the shared checkout
   (.../tsk-u87-disposable-target). Refusing to run it there... Re-run
   the command from .../agent-a08ef32c289abe9d5."
5. A `Write` call (to leave a marker file in the target worktree) was
   **refused** with the same message shape.
6/7. Every further command (`cat`, `pwd`) was refused identically, always
   citing the ORIGINAL launch worktree as "where this agent is isolated",
   while noting the command's own cwd had "resolved to" the target
   worktree.

**Coordinator's own state, checked immediately before dispatch and again
immediately after the agent's run completed:** unaffected both times —
`pwd`/`git rev-parse --show-toplevel` returned this session's own
worktree (`.claude/worktrees/tsk-u87-DC47tf`) on both checks, with no
refusal and no drift.

## Interpretation

Two separate questions, two separate answers:

1. **Does `isolation: "worktree"` correctly scope isolation state per
   dispatched agent, protecting the coordinator (and, by the same
   mechanism, sibling agents) from the session-scoped-flag collision
   `fgos-fanout`'s hazard section documents?** — **YES, confirmed.** The
   coordinator was completely unaffected by the dispatched agent's
   `EnterWorktree` call, unlike the real 2026-08-13 (3-agent) and
   2026-08-19 (N=1, unpinned) incidents this item's own description cites.
   This is a genuine, positive, structural finding: `isolation:"worktree"`
   really does isolate the AGENT's OWN state from everyone else's.

2. **Can a pinned agent subsequently attach to a specific EXISTING
   worktree via `EnterWorktree({path: ...})` and keep operating normally
   inside it?** — **NO, still broken, and more precisely than the
   2026-08-13 finding described.** The call itself reports success and the
   agent's actual process cwd DOES move to the target path — but the
   isolation guard's own bookkeeping of "which worktree this agent is
   permitted to operate in" is never updated to match. Every subsequent
   tool call the agent makes is refused, because its real cwd (the target)
   and its guard-permitted cwd (the original launch worktree) now
   permanently disagree — there is no way for the agent to recover; it is
   simply stuck for the rest of its run. This is a sharper, more
   actionable characterization than the 2026-08-13 finding's "cannot
   re-enter an existing worktree" — the call does not outright refuse the
   switch, it silently reports success while leaving enforcement stale, a
   distinct and arguably worse-to-diagnose failure mode (a caller reading
   only the success message would wrongly believe the switch worked).

## Conclusion — proceeds to Step 2 (plan.md's own ordering)

Step 1 does not yield a usable structural fix from the tool as it exists
today. Per plan.md's own Approach, this item proceeds to Step 2: file the
concrete, minimal, now-sharply-evidenced feedback — extend
`isolation: "worktree"`'s launch-time pin to accept an existing worktree
path directly (reusing the per-agent-scoping property finding #1 above
already confirms works), rather than relying on a post-launch
`EnterWorktree(path)` call whose enforcement-bookkeeping does not follow
its own reported success.

Step 3 (a real >=3-agent fanout batch proving tsk-8v1's self-recovery
instruction) remains open and unattempted — Step 1's finding does not
resolve it either way; it is still the fallback this item's own
description names.
