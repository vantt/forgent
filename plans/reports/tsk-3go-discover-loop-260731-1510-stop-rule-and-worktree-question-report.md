# Research: `tsk-3go` discover-loop — stop rule + worktree question

Internal-only research (no web search needed — both questions answerable
by reading the real `discover`/`decompose` implementation). Verified
2026-07-31.

## Q1: where does the loop stop? Does it run all the way to the end?

**Per-item stopping point (by design, matches `tsk-3go`'s own scope):**
the loop only ever calls the MECHANICAL `discover`/`decompose` verbs — it
never continues into `fgos-coding-implement`. So for any one item, this loop's
involvement ends the moment that item reaches ONE of:
- `stage: executing` (verdict was `clear`/`pass-through`/`decompose` —
  success, move to the next item in frontier, never chase it into
  execution)
- `status: awaiting-human` (verdict was `unclear`/`need-human`, or a
  risk/blast-radius gate fired — parked, needs a person)

**Loop-level stop rules (mirroring `merge-loop`'s own shape,
`plugins/fgOS/skills/merge-loop/SKILL.md`):**
1. Frontier of `stage: clarify` + `stage: decompose` items is empty —
   natural completion.
2. The SAME item parks `awaiting-human` twice in a row — stop (same rule
   `merge-loop` uses for "same item blocked twice"), avoid grinding on a
   stuck item.
3. A configurable per-run iteration cap — safety valve independent of
   (1)/(2).

**Does it "go all the way to the end" in one run?** Only if rule (1) is
the ONLY active stop condition and nothing else fires first. Given the
real backlog right now (49 items at `stage: clarify` alone, per this
session's own `fgos check` output), running unbounded really means
49+ real LLM judge calls in one sitting — and a meaningful fraction will
likely hit rule (2) anyway (genuinely unclear items exist in a 49-item
backlog that's been sitting untouched). **Recommendation: default to a
bounded iteration cap (e.g. 10-15 per invocation), not "run to empty."**
Cost/pacing is a real, not hypothetical, concern here — this mirrors why
`merge-loop` itself has stop rules instead of running forever.

## Q2: worktree-per-discover, merge immediately, cleanup, release?

**Short answer: no — `discover`/`decompose` never need a worktree at
all.** This isn't a simplification choice, it's a fact about what these
verbs actually touch, verified directly:

- `grep -n "writeFileSync\|fs\.write\|fs\.append" src/intake/discovery.mjs
  src/intake/plan.mjs` → **zero matches**. Neither file ever writes
  to the git tree. `readLockedContext` (`decompose.mjs`) only READS
  `CONTEXT.md`/`plan.md` if present, never writes.
- Every state change from `discover`/`decompose` (`editWork`, `addWork`,
  `moveStage`, `addDiscovery`, `putInAwaiting`) resolves to `appendEvent`
  writing to `.fgos/events.jsonl` — the SHARED, single-source-of-truth
  event log (never per-worktree; a worktree explicitly never carries its
  own `.fgos/`, ADR0020).
- Concurrent-write safety for that shared log is ALREADY handled by a
  cross-process `.fgos/events.lock` (`src/state/events.mjs:49,282-311`) —
  every `appendEvent` call blocks-then-acquires this lock, so N sessions
  calling `discover`/`decompose` against the same main checkout at once
  is already safe by construction, no worktree isolation needed for it.
- `bin/fgos.mjs`'s `discover`/`decompose` case handlers (lines 881,904)
  never shell out to git.

There is **nothing to merge**, because these calls never produce a diff —
worktree-then-merge-then-cleanup would be real overhead wrapped around an
operation that touches only a lock-guarded log file. This matches how
`fgos-runner`'s own internal sweep already works today: it calls
`resolveDiscovery`/`resolveDecompose` directly against the main checkout,
before any worktree gets created for the (separate, heavier) dispatch/
execute phase.

**Where a worktree DOES become necessary** — but is explicitly OUT of
`tsk-3go`'s scope — is the moment a human/session actually picks an
item that reached `executing` (or one parked `awaiting-human` that a
person answered and wants to shape via `fgos-coding-exploring`/`fgos-coding-planning`,
which DO write real files: `CONTEXT.md`/`plan.md`). That's `/fgOS:pick`'s
job, a later, separate step this loop should never trigger itself.

## Revised shape for `tsk-3go`

- `/fgOS:discover-next`: pick next frontier item at `stage: clarify` (or
  `decompose`), call `fgos discover <id> --dir <main>` /
  `fgos plan <id> --dir <main>` directly against the main checkout —
  **no worktree, no branch, no merge, no cleanup step at all.**
- `/fgOS:discover-loop`: `/loop` wrapped around the above. Stop rules:
  frontier empty, same item parked twice, iteration cap (default ~10-15).
- Optional: `/fgOS:terminal` per iteration for herdr-pane observability
  (already-planned nicety, unaffected by this correction).

## Unresolved questions

- Exact default iteration cap number — not decided, implementer's call
  at `fgos-coding-planning` time.
- Whether `discover-loop` should also surface a summary at the end (N
  cleared, N parked, N skipped) for the human to review in one glance —
  not decided, reasonable addition, left to planning.
