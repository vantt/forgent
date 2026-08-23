# answer-resume-status-help-text — RESEARCH.md

## Round 1 — 2026-08-13 (tsk-f3p, discovery stage)

**Asked:** confirm the claimed mismatch between `fgos answer`'s CLI help
text ("resume the item to todo") and its actual resume-target behavior
(reported: resumes to the status from before the ask, e.g. `doing`), plus
whether the follow-on "claimed-but-no-worktree, `fgos pick` refuses to
reclaim" scenario is a real, still-open gap.

**Checked (repo search, `rg`):**
- `src/cli/command-registry.mjs:341` — the `answer` verb's `description`
  field, literal string: `'Record the answer to a parked question and
  resume the item to todo.'`
- `src/state/store.mjs:747-763` (`answerAwaiting`) — actual resume logic:
  `const to = view.gates?.[id]?.statusAtAsk ?? 'todo';` then
  `moveWork(dir, { id, to, ... })`. Own doc comment (line 753-757):
  "Resume target (claim-lock §5.1): reads the gate's own `statusAtAsk`
  snapshot ... and resumes there — `doing` when a pick claim was held at
  ask-time, `todo` otherwise (also the default for pre-existing logs/gates
  with no `statusAtAsk`, preserving the historical hardcoded-`todo`
  behavior byte for byte)."
- `docs/specs/work-state.md:229` and `:1016` — spec text (Vietnamese)
  confirms this is a DELIBERATE fix, cited as "claim-lock §5.1": the OLD
  behavior always resumed to bare `todo`, which would drop an active
  `doing` claim if `ask` happened mid-claim — that was the real bug,
  already fixed. Current behavior (resume to `statusAtAsk`) is the
  corrected, intentional design.
- `src/state/store.mjs:733-745` (`putInAwaiting`) and `bin/fgos.mjs:1903-
  1914` — confirms `statusAtAsk` is stamped at ask-time from the item's
  live status, carried through `gates[id]`.

**Verdict on part 1 (help text vs. behavior):** the mismatch is REAL, but
narrow — only `command-registry.mjs:341`'s description string is stale.
It was never updated when the resume-target fix (claim-lock §5.1) landed.
Actual behavior is correct per spec, not a functional bug.

**Checked (part 2 — "claimed-but-no-worktree, pick refuses" gap):**
- `docs/history/session-claim-liveness/CONTEXT.md` (item `tsk-3ni`,
  "Phát hiện session claim/worktree đã ngừng hoạt động để cho phép claim
  lại workitem") — a full locked-decision design (D1-D5) for exactly this
  class of problem: a session holds a `doing` claim whose worktree has
  gone quiet/missing, and a later `pick`/`take` needs to detect that and
  self-reclaim. **Status: `cleanup`** (`fgos list --id tsk-3ni --json`) —
  already implemented and shipped, not a gap.
- `src/runner/claim-liveness.mjs` (`lastActivityAt`, `isReclaimEligible`)
  — the shipped mechanism. `lastActivityAt` falls back to
  `git log -1 --format=%ct <branch>` when no live worktree is registered
  for the branch (line 50: "branch exists, no live checkout — commit time
  is all there is") — a DELETED worktree does not make the signal
  unreadable as long as the `fgw/<id>` branch itself still exists; it
  just uses commit time instead of file mtimes.
- `src/runner/claim-port.mjs:269-306` (`claimWork`) — wired into `pick`'s
  (isolate:true) claim-conflict path: when `status === 'doing'`,
  `claimRole` is `human`/`session`, and `isReclaimEligible(...)` is true,
  it releases the stale claim to `todo` first (`moveWork(to:'todo')`),
  logs a `stale-claim-reclaim` decision, then proceeds with the normal
  claim — transparently, no new flag, no human confirmation needed.
- `isReclaimEligible` (`claim-liveness.mjs:92-97`) gates on
  `STALE_DOING_DEFAULTS` (`src/state/graph-metrics.mjs`) — `humanMs`
  (24h) for `human`/`session` claimRole, `agentMs` (15min) for `runner`.
  An unreadable signal (branch itself deleted, or any git-call failure)
  returns `null` → `isReclaimEligible` returns `false` → falls through to
  today's plain refuse (unchanged, matches D5's documented "inconclusive
  → refuse" fallback).

**Verdict on part 2:** NOT an open gap. The exact scenario described
(claim resumed to `doing`, worktree gone, later `pick` refuses) is already
handled by the shipped `tsk-3ni` mechanism — `pick` self-reclaims once the
claim has been quiet past the 24h `humanMs` threshold, using the branch's
last-commit time when no worktree is registered. The 24h grace window is
an intentional, locked design choice (D3), not a defect — an immediate
manual `fgos move --to todo` is still the correct move for someone who
needs the item back within that window. No related how-to doc names this
specific combination (worktree deleted + `answer`-driven resume) yet, but
the general "stuck doing claim" class is already covered by `tsk-3ni`'s
CONTEXT.md and the shipped self-reclaim path.

**Open:** none. Both parts are resolved with direct evidence.
