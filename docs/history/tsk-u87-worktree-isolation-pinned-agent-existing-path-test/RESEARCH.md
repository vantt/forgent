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

## STEP 3 RESULT: real 3-agent concurrent fanout — 0/3 completed, but coordinator stayed clean throughout (2026-08-19, user-authorized follow-up run)

**Blocker found and cleared first.** `fgos-fanout`'s own dispatch-decision
hard rule refuses to fire a Task-tool Agent for any candidate whose
`dispatch.mjs decide --work <id>` answer isn't `in-process`.
`executorIdForWork` always resolves a coding-domain item to
`fgos-coding-implement`, which `.fgos/config.json`'s `runner.capabilities`
pins to `agy`/gemini-3.6-flash-medium (out-of-process) — a very recent,
unrelated commit (`cd060ad1`, sitting at the top of this session's own git
log). Confirmed directly: every real candidate item resolved
`out-of-process` today, which would have made `fgos-fanout` report every
candidate as "needing a person" and fire nothing at all. Per
`dispatch/cli.mjs`'s own "Native-First" D4 rule, an UNCONFIGURED
`fgos-coding-implement` capability (no `cfg.executors`/`cfg.capabilities`
entry at all) defaults to native/`in-process` for a `--work`-resolved
decision. User-approved fix for this run only: backed up
`.fgos/config.json`, removed the `capabilities.fgos-coding-implement`
block (only that block — no executor definitions touched), confirmed
`decide --work <id>` now answered `in-process`, ran the real test, then
restored `.fgos/config.json` byte-for-byte from the backup immediately
after and re-confirmed the pin was back (`out-of-process` again). This is
a real, currently-live gap worth its own follow-up: `fgos-fanout` cannot
fire ANY native Agent today with this capability pin in place — a
structural issue independent of the worktree-isolation hazard, and one
this item's own scope does not cover fixing.

**Method.** Created a disposable parent (`tsk-193`, `wontfix`d after) with
3 disposable children (`tsk-4ov`, `tsk-wkw`, `tsk-3jm`, all trivial
marker-file-write chores, `wontfix`d after) via `fgos add --parent`.
Confirmed `fgos slots --json` showed room (`hasRoom: true`, unarmed
ceiling). Confirmed all 3 candidates' own `decide --work <id>` answered
`in-process`. Dispatched exactly 3 Task-tool Agents, one per candidate, no
`isolation` parameter (matching `fgos-fanout`'s real, undocumented-as-pinned
dispatch shape exactly), each instructed to read and follow
`plugins/fgOS/skills/pick/SKILL.md` literally end to end (claim →
EnterWorktree → drive → implement → verify → return). Checked this
coordinating session's own `pwd`/`git rev-parse --show-toplevel` before
dispatch, mid-run (while all 3 were still active), and after all 3
settled.

**Result: 0/3 candidates completed.** All 3 got through the real `fgos
pick` claim (`todo`→`doing`, real worktree stood up on disk, real branch)
and the first `EnterWorktree({path: <their own freshly claimed
worktree>})` call — which every time **reported success** — but every
subsequent Bash/Write call from all 3 agents was refused, citing the
agent's own *original launch-time pin* (this coordinating session's own
worktree, `tsk-u87-DC47tf`) as the only place it was "allowed" to run,
even though the refusal message itself said the command's cwd had
"resolved to" the correct new target. This is the **exact same
mechanism** Step 1 found (`EnterWorktree` reports success, isolation
enforcement never actually follows) — now confirmed under real,
concurrent, unpinned, production-shaped dispatch (not a synthetic pinned
test), independently, 3 times over.

- **Agent 1 (`tsk-4ov`):** tried `ExitWorktree({action:"keep"})` to
  recover — refused: "ExitWorktree cannot be called from a subagent with
  a cwd override... use Bash with `cd`" — but Bash's own `cd` was refused
  for the identical reason. Permanently stuck, no recovery attempted
  beyond that (correctly stopped rather than routing around the guard).
- **Agent 2 (`tsk-wkw`):** identical `ExitWorktree` refusal, identical
  permanent Bash lockout. Correctly stopped and reported rather than
  bypassing.
- **Agent 3 (`tsk-3jm`):** hit the identical refusals, but additionally
  tried re-issuing `EnterWorktree` a SECOND time — targeting its own
  ORIGINAL launch path (`tsk-u87-DC47tf`) rather than the stuck target.
  **This worked** — it recovered a working Bash shell — but only by
  giving up on the target worktree entirely; per `/fgOS:pick`'s own Step 4
  fallback rule ("if step 4 fell back, skip step 5"), it correctly stopped
  there rather than forcing the drive step. This is a real, partial
  confirmation of tsk-8v1's own self-recovery instruction's core
  mechanism ("re-call `EnterWorktree`") — but it recovers the AGENT back
  to a *usable* state, never to the *target* state the item actually
  needed. The item still does not get done.

**The one clearly positive finding, confirmed 3 independent times across
the whole run:** this coordinating session was **never** affected — `pwd`
stayed at `tsk-u87-DC47tf` before dispatch, mid-run (all 3 agents active
simultaneously), and after all settled. No cross-contamination to the
coordinator, and (per each agent's own report) no cross-contamination
between siblings either — each agent's failure was self-contained to
itself. This is a materially better result than the 2026-08-13 incident
(coordinator's own cwd was dragged into a sibling's worktree that day).
Whatever changed between 2026-08-13 and today, the *cross-agent leak*
class of this hazard looks closed; the *EnterWorktree(path) reports
success but does not actually enforce it for the calling agent itself*
class is what remains, and it is enough on its own to make every
candidate fail today (0/3, worse than 2026-08-13's 2/3 survival rate for
the OLD failure mode).

**Bottom line for tsk-8v1's self-recovery instruction:** it is not
sufficient as written, for two separate reasons. (1) It only ever reaches
`fgos-fanout/SKILL.md`'s own text — the COORDINATOR's reading material —
never the dispatched `/fgOS:pick` agents themselves, whose own skill
chain (`pick`→`fgos-coding-driving`→`fgos-coding-implement`) says nothing
about this hazard at all; none of the 3 agents here had ever heard of the
instruction, they improvised their own recovery attempts from first
principles. (2) Even where an agent independently rediscovered the core
move (agent 3, re-calling `EnterWorktree`), it only recovers Bash
usability, never actual progress on the claimed item — the instruction as
written implies "retry the exact operation that was refused" would
succeed after recovery, but the refused operation targeted the broken
worktree switch itself, which re-attempting does not fix.

Cleanup performed: all 3 candidate worktrees/branches removed from disk;
`tsk-4ov`/`tsk-wkw`/`tsk-3jm`/`tsk-193` moved to `wontfix`;
`.fgos/config.json` restored byte-for-byte from a pre-test backup and
re-verified.
