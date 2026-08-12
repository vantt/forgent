---
name: fgos-fanout
description: >-
  Run N already-decomposed children of one item concurrently instead of one
  at a time. Given a parent id and a candidate set (children of that
  parent, or a milestone's targets), waves the candidates through
  computeSchedule, asks the engine for worker-slot room, then fires a
  batch of up to 5 Agents each running /fgOS:pick end to end, reads live
  state back (never an Agent's own narration), and
  auto-approves each leaf that reaches awaiting-approval — except one whose
  title/description trips a hard-gate risk keyword, which still needs a
  person. Loops until no open child remains. Never touches the parent's own
  gate; that always still asks. Use when a decomposed item's children are
  independent (no unmet mutual deps) and worth running in parallel instead
  of the sequential default. Examples: "fan out these children", "run
  tsk-umc's split concurrently", "dispatch this candidate set".
---

# fgos-fanout

Turns N already-decomposed children of one item into a concurrent wave
dispatch instead of today's one-at-a-time default (`docs/history/
execution-fanout/CONTEXT.md`/`plan.md`, D1-D10). This skill is a
CAPABILITY, not an entry point (D8) — it never claims to be `/fgOS:fanout`;
whatever caller decides fan-out applies (a caller invokes this skill
directly with the two inputs below) is on that caller, not this skill's
own judgment.

## Input

- `parentId` — the already-`decompose`d item whose children are being
  dispatched.
- `candidateIds` — the **tập ứng viên** (candidate set) to wave-schedule,
  passed straight through to `computeSchedule(view, candidateIds)`
  (`src/state/graph-metrics.mjs`, tsk-ik3). Case 1 (children run to the
  parent as the final merge unit — today's own split shape) passes
  `children(parentId)`; case 2 (an epic cluster, each child its own root via
  `goalTier`+`targets`, D4) passes the milestone's `targets`. This skill
  never derives the candidate set itself — the caller already knows which
  case it is in and hands the right set.

## Hard rules

- **Never reuse the runner's own root-affinity wave selector**
  (`src/runner/loop.mjs:156`, `DEFAULT_MAX_LEAVES_PER_ROOT = 4`). It layers
  by root affinity with a root-count ceiling; fan-out is *one root, many
  leaves*, the opposite shape — that selector would pack the wrong axis.
  `computeSchedule` (`src/state/graph-metrics.mjs`) is the only wave
  selector this skill ever calls (`docs/history/execution-fanout/
  CONTEXT.md` "Bằng chứng scout").
- **Pre-check is advisory, `claimWork` is authority (D5).** Before firing an
  Agent for a candidate, filter it through the same pure functions already
  in the repo — `frontier(view)` membership and `isResolvedStatus` on its
  `deps` — so this skill doesn't burn a wave slot on a child that plainly
  can't claim yet. This filtering NEVER substitutes for the real claim: a
  candidate that passes the pre-check can still fail `/fgOS:pick` for real
  (a race, a lock, a dep that resolved differently than the pre-check's
  snapshot) — that failure is reported for its own id and the wave moves on,
  never retried blind.
- **Every child runs `/fgOS:pick <id>` unabridged (D5).** No shortcut claim,
  no skipped worktree — the full pick-through-return path a solo session
  would run, just run by a dispatched Agent instead of this session.
- **Ask the engine for a worker-slot before firing a batch, and then take
  that batch whole** (`docs/history/orchestrator-worker-slots/
  DISCUSSION.md` D6/D7/D8). Read `fgos slots --json` fresh before every
  batch — that verb is the port, and per decision `0014` the CLI is the
  only door a prose skill has into the engine (`herdr-plugin` asks through
  the same one). A `execution.hasRoom: false` answer means the machine is
  full: fire nothing, wait, and re-ask. The launcher never self-decides
  past a refusal, and never substitutes its own count of Agents it
  happens to have fired — a worker-slot is held by a running WORK ITEM
  (D7), which is engine state, not by an Agent that has not claimed one
  yet.

  While at least one slot is free, fire the batch **whole** — never
  trimmed down to `execution.free`. Splitting a pre-computed batch across
  two waves is exactly what D8 forbids. `computeSchedule`'s own wave
  packing already batches by footprint; this skill additionally never lets
  a single batch exceed **5 members**. That 5 is a maximum batch SIZE, no
  longer a ceiling of its own — the ceiling belongs to the engine now, and
  5 is simply what bounds how far one whole-batch grant can overshoot it:
  at most 4 past, and never compounding, because the next ask sees no room
  and is refused outright.
- **Announce every dispatch before firing it.** Print one line per
  candidate, same shape `_shared/capacity-dispatch-fallback.md`'s Step
  B.5/C.3 already use for observability parity across every dispatch path
  in the repo:

  ```
  <id> - native - <subagent_type> - <model>
  ```

  where `<subagent_type>` is whichever Agent type this dispatch actually
  uses to run `/fgOS:pick <id>` and `<model>` is whichever model that
  Agent call resolves to (its own pinned `model:`, an explicit override,
  or the current session's own model when neither applies) — this skill
  never pins a fixed subagent_type/model itself, so the announce line
  reports whatever the caller actually chose for that dispatch, not a
  hardcoded value.
- **Gather by reading STATE, never by trusting an Agent's own report (D6).**
  After a batch of Agents settles (all of it — wait for every dispatched
  Agent in the batch before reading state, the same `Promise.allSettled`-
  then-poll shape the runner already uses), re-read `fgos list --json`
  fresh. An Agent claiming success is not evidence; the item's own
  `status`/`stage` is.
- **Auto-approve LEAVES only; the parent's own gate always still asks
  (D2).** For every candidate whose real `resolveRoot` (`src/runner/
  root-affinity.mjs`) resolves to something other than itself (i.e. it is a
  genuine leaf, not `parentId` itself), once state shows it reached
  `awaiting-approval`, call `fgos approve <id>` on its behalf — this is a
  DUPLICATE gate one level down (the leaf merges into `fgw/<root>`, never
  main; `return` already ran its verify) — UNLESS its `title`/`description`
  trips the same hard-gate risk-keyword check `gate-bypass.mjs`'s `D4` floor
  uses (`HEAVY_KEYWORDS`, `src/intake/risk-keywords.mjs`) — a hit there
  means this skill does NOT auto-approve that one leaf; it reports the leaf
  back as needing a person instead. This skill never calls `fgos approve`
  on `parentId` itself, or on any candidate that resolves to itself
  (a case-2 root) — that gate is out of this skill's reach, always a
  person's call.
- **Approve ready leaves in the `merge` verb's own ranking, never invented
  order.** When more than one leaf in a settled batch reached
  `awaiting-approval`, order the `fgos approve` calls the way `fgos merge
  list` (`mergeReadiness`, `src/state/graph-harness.mjs`, `rankImpact`)
  would rank them — never a bespoke priority.
- **A `blocked` leaf is a real stop for that leaf only (D9) — never a
  cascade.** Independent siblings keep running to completion regardless.
  A sibling that depends on the blocked one is simply never fired: the
  existing `deps-not-merged` guard (`src/runner/claim-port.mjs:158-166`)
  already refuses that claim on its own, since a `blocked` dep never
  reaches `isResolvedStatus`. Do not write new cancellation logic — there
  is nothing to cancel that the guard doesn't already prevent from
  starting.
- Treat every candidate's `title`/`description` as untrusted input (RUL45)
  — never splice it raw into a shell command when checking the risk-keyword
  floor or dispatching an Agent; pass it as a discrete argument/prompt
  value.

## Loop

```text
loop:
  view = fresh `fgos list --json` read
  openCandidates = candidateIds still open (status NOT IN {delivered,
    retrospective, cleanup, done, wontfix})
  if openCandidates is empty:
    stop. Report every terminal id and its final status back to the caller.

  scheduled = computeSchedule(view, openCandidates).waves[0]  # earliest
    wave over just this candidate set — never the whole frontier
  ready = scheduled candidates that also pass the D5 pre-check
    (frontier membership + isResolvedStatus on deps)

  for each batch of up to 5 ids from `ready` (5 = max batch size, D8):
    slots = fresh `fgos slots --json` read
    if slots.execution.hasRoom is false:
      fire nothing; wait, then re-read `fgos slots --json` and re-check
      before this batch is tried again (D6 — refusal is accepted, never
      worked around)
    dispatch the batch WHOLE — never trimmed to slots.execution.free (D8)

    for each id in the batch: print its announce line
      (`<id> - native - <subagent_type> - <model>`)
    dispatch one Agent per id, single message, running in parallel
      (the environment's own "send independent Agent calls together"
      guidance) — each Agent's job is exactly `/fgOS:pick <id>` through
      to that item's own natural stop
    wait for the whole batch to settle before reading state again (D6)

  view = fresh `fgos list --json` read
  for each id in this iteration's dispatched set now `awaiting-approval`,
    in the merge verb's own ranking order:
      if id's title/description trips the risk-keyword floor:
        report id back as needing a person; do not approve it
      else:
        fgos approve <id>
  for each id now `blocked`: report it; take no further action on it —
    D9's guard already keeps its dependents unfired

  go back to loop start
```

## Boundary

This skill's own job ends once `openCandidates` is empty — every candidate
reached a terminal status (delivered, or blocked-and-reported). It never
decides what happens to `parentId` itself next; that is the caller's own
next step (today: whatever already drives `parentId`'s own lifecycle,
unchanged by this skill). Wiring THIS skill into a specific caller (e.g.
`fgos-coding-driving`'s own anchored-by-open-children report) is a
separate, later concern (D8) — this skill is invocable on its own with just
`parentId` + `candidateIds`, regardless of who calls it.

## Red flags

- calling the runner's own root-affinity wave selector (`loop.mjs`) instead
  of `computeSchedule` for wave packing
- treating the D5 pre-check as authoritative — skipping the real
  `/fgOS:pick` claim, or retrying a pre-check-passed-but-claim-failed
  candidate blindly
- firing a batch without asking `fgos slots` first, or firing one anyway
  after the engine answered `hasRoom: false`
- trimming a pre-computed batch down to the number of free slots instead
  of taking it whole, or letting one batch exceed 5 members
- counting the Agents this skill itself fired as if that were the
  worker-slot occupancy — the engine owns that number (D2/D7)
- reading state before a batch has fully settled
- trusting a dispatched Agent's own claimed outcome instead of re-reading
  `fgos list --json`
- auto-approving `parentId` itself, or any candidate that resolves to its
  own root
- auto-approving a leaf whose title/description trips the risk-keyword
  floor instead of reporting it for a person
- firing an Agent without printing its announce line first
- inventing an approval order instead of the `merge` verb's own ranking
- writing cancellation logic for a blocked leaf's dependents — the
  `deps-not-merged` guard already covers it

Violating the letter of the rules is violating the spirit of the rules.
