# tsk-u87 — plan.md

Mode: spike

No CONTEXT.md exists for this item — discovery's own `clear` verdict
skipped `exploring` (no genuine repo-groundable ambiguity: the two facts
this item turns on were already read first-hand, this same session, from
the `EnterWorktree` tool's own live schema and from `fgos-fanout/
SKILL.md`'s + `/fgOS:pick`'s own current Workflow text — not stale, not
guessed). The item's own `description` (locked by the user directly in
this same session, via explicit back-and-forth, most recently `/fgOS:pick
tsk-u87` itself as the go-ahead) carries every locked decision this plan
needs; nothing here reopens or reinterprets it.

## Approach

**Chosen path — Step 1 first, cheapest.** Dispatch exactly ONE sub-agent
via the Task/Agent tool with `isolation: "worktree"` (pins it to its own
worktree at launch). From inside that agent, call `EnterWorktree({path:
<a real, pre-existing, disposable worktree path — created fresh for this
test, never a live in-flight item's worktree>})`. Then, from BOTH sides —
the pinned agent's own next Bash/Edit/Write call, and the coordinating
session's (this session's) own next Bash/Edit/Write call — check whether
either was redirected/refused pointing at the other's worktree. Record
the real, observed outcome (not a guess) as `## STEP 1 RESULT:` in this
feature's own `RESEARCH.md`.

**Alternatives rejected:**
- Going straight to Step 3 (a real ≥3-agent fanout batch) — rejected as
  the item's own locked ordering: Step 3 is expensive (3+ agents, real
  candidate items, real risk of dragging this coordinating session's own
  cwd off course per the exact incidents `docs/history/tsk-u87-.../
  RESEARCH.md` cites) and only needed if Steps 1-2 both come up empty.
- Testing against an existing, currently-`awaiting-approval` item's
  worktree (e.g. tsk-8v1's own) — rejected: mutating or even just
  entering a real, not-yet-merged item's worktree from a throwaway test
  risks colliding with that item's own pending review. A disposable
  worktree, created fresh for this test alone and discarded after, is the
  correct target.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| The live test itself (spawning 1 Task-tool agent, calling `EnterWorktree`) | standard | Direct before/after observation of both the agent's and the coordinator's own tool-call refusals/successes — this IS the proof point, not a guess. Real risk: if the hypothesis is wrong, the coordinator's own cwd could drift the same way the 2026-08-19 N=1 incident already did once (recovered cleanly then via `ExitWorktree({action:"keep"})` — same recovery available here). |
| `fgos-fanout/SKILL.md` + `.agents`/`plugins` mirrors (ONLY if Step 1 succeeds) | light | Prose-only edit, same shape tsk-8v1/tsk-2k0 already proved safe — `npm test` stays green (no code path touches these files), a grep check confirms the new dispatch instruction landed. |
| External feedback text (ONLY if Step 1 fails) | light | No code touched at all — a written artifact only (`RESEARCH.md` + this feature's own follow-up decision), not a runtime change. |

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → GitNexus registered and `present` (full posture) —
but not applicable here regardless: every real branch of this item edits
skill-prose (`SKILL.md`) or writes docs, never a code symbol GitNexus's
graph covers. Recorded per the capability gate, not skipped silently.

**Files likely touched, in order:**
1. `docs/history/tsk-u87-worktree-isolation-pinned-agent-existing-path-test/RESEARCH.md` — every branch, first (the real test result).
2. `.agents/skills/fgos-fanout/SKILL.md`, `.claude/skills/fgos-fanout/SKILL.md` (regenerated via `npm run build:skills`), `plugins/fgOS/skills/fgos-fanout/SKILL.md` — only if Step 1 succeeds.

No `fgos graph --json` critical-path ordering applies — tsk-u87 is an
isolated node (component size 1, no `deps`), so nothing else in the
backlog is waiting on this item's own internal file order.

## Shape

**The one open question this spike exists to answer:** does a Task-tool
agent pinned at launch (`isolation: "worktree"`) retain that per-agent
scoping when it subsequently calls `EnterWorktree({path: <existing>})` to
switch into a specific pre-existing worktree — i.e. does the switch stay
scoped to just that agent (per the tool's own current documentation), or
does it still leak into the coordinating session's shared isolation state
the way an *unpinned* agent's `EnterWorktree` call does today (per the
real 2026-08-13 and 2026-08-19 incidents)?

Concrete cases worth proving against:
- **Happy path**: pinned agent switches into the existing target
  worktree; agent's own subsequent Bash/Edit/Write succeed inside it;
  coordinator's own subsequent Bash/Edit/Write are completely unaffected.
- **Leak case**: the pin does not survive the `path`-targeted switch —
  the coordinator's own next Bash/Edit/Write gets refused, citing the
  agent's worktree, the same false-positive shape already seen twice.
- **Partial case**: the agent itself cannot resume correctly in the
  target existing worktree (e.g. the pin only ever composes with a
  freshly-created worktree, refusing or silently ignoring an existing
  `path`) — this would directly confirm the 2026-08-13 finding still
  holds, distinct from the leak case above.

This is not a split — one honest piece of work. No child specs.

## Outstanding questions

None
