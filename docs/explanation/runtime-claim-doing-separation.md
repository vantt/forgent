---
authoritative_for: separating live claim/doing coordination from the durable .fgos eventlog so take/pick never dirties the main checkout — new runtime-coordination.mjs module (runtime claims in .fgos/runtime/, git-ignored), an effective-view formula overlaying active claims on durable status, anti-loop budget counting durable work.attempt events instead of doing transitions, and a hard migration with no dual-write backward-compat path
---

# `doing` was never supposed to be durable history — it was live coordination masquerading as an event

`tsk-40m` separated live claim/doing coordination from fgOS's durable
event log. Before this item, claiming a work item (`take`/`pick`) wrote a
`moveWork(to: 'doing')` transition straight into
`.fgos/events/*.jsonl` via `claim-port.mjs`'s `claimWork()` — meaning fgOS
made the main checkout git-dirty just from claiming an item, even though
`doing` is fundamentally live coordination state, not durable history that
needs to survive as an audit-log entry the way `awaiting-approval`/
`blocked`/`delivered` genuinely do.

## The boundary drawn

Runtime state (claim/session/slot) moves to `.fgos/runtime/` — git-ignored
entirely. The durable eventlog only ever records a real state transition
that needs history: `awaiting-approval`, `blocked`, `delivered`, and so
on. A new module, `src/state/runtime-coordination.mjs`, owns
`acquireClaim`/`releaseClaim`/`readClaims` against a lock file
(`.fgos/runtime/claims.lock`) and per-item claim records
(`.fgos/runtime/claims/<id>.json`).

## Six locked design decisions

- **D1** — `doing` splits into two layers: `doing-current` (derived from
  an active runtime-claim overlay, never durably written at claim time)
  vs. `doing-history` (the durable `work.attempt` record written at
  settle time). Effective view = durable status XOR active claim (a claim
  present → reads as `doing`).
- **D2** — CAS settle now keys on claim ownership (`claimId` + a captured
  `preClaimStatus`/`preClaimRevision`), never `expectedStatus: 'doing'`.
  Runtime claim schema: `claimId`, `id`, `actor`, `preClaimStatus`,
  `preClaimRevision`, `branch`, `branchHeadAtTake`, `acquiredAt`,
  `lastObservedActivityAt`, `hardExpiresAt`. Settling checks the claim
  still exists, the `claimId` matches, the owner has rights, and the
  durable revision still matches the captured `preClaimRevision`.
- **D3** — `anti-loop` switches to counting durable `work.attempt` events
  (`phase: execute`) instead of `work.move → doing` transitions. A hard
  migration, no dual-count legacy path, and deliberately never counts
  clarify/decompose/planning claims — only the execute phase spends
  budget, matching the mechanism's original intent.
- **D4** — `frontier`/`list`/`worker-slots`/`return` all read the
  *effective* view (durable status overlaid with an active runtime claim),
  never raw durable status: `effectiveStatus(item) = activeClaim(item.id)
  ? 'doing' : durableStatus(item)`. Dependency-resolution/finality logic
  still keys off real durable final states
  (`delivered`/`done`/`wontfix`/`retrospective`/`cleanup`) — unchanged.
- **D5** — `releaseClaimOnExecuting`
  (`src/intake/plan.mjs:525-540`) is retired in this hard cut — the
  runtime claim now holds continuously through `clarify → executing`
  since there's no more durable `doing` transition to release/reclaim
  in between. A genuine pause needs a durable `work.attempt` record with
  `result: 'released'`, then deleting the runtime claim.
- **D6** — reclaim liveness uses `isReclaimEligible`/`lastActivityAt`
  (`claim-liveness.mjs`, real git worktree activity) as the primary
  signal; `hardExpiresAt` is only a hard backstop. Another hard migration
  — accepted downtime, no parallel backward-compat write path for new
  claims. Pre-migration durable-`doing` records still read correctly
  through the `effectiveStatus` formula's own natural fallback (no active
  claim → read durable status, including old `doing`).

## What consumers had to change

`fgos list`/`show`/`status` (anywhere displaying running state),
`worker-slots` (counts runtime claims, not durable `doing`), `return`
(no longer relies on durable `doing` to know an item is claimed), and
stale/reclaim logic (reads runtime claim TTL/liveness instead of durable
status) all switched from reading raw durable `status === 'doing'` to the
effective/runtime-claim view.

## Explicit non-goals

No migration of the full `.fgos/events/*` history to changesets, no new
daemon, no change to `.fgos/logs|cache|runtime` ignore rules beyond what
tests proved necessary, and no commit/revert of any pre-existing live
`.fgos/events/*` dirty state.

## Acceptance bar this item held itself to

After `pick`/`take`, `git status .fgos/events` shows no change; the UI
still shows claimed/running state through the overlay; worker slot count
follows runtime claims; a worktree-creation failure leaves neither a
durable `doing` nor a stale runtime claim; a successful `return` writes
durable `awaiting-approval` then releases the claim; a verify failure
writes durable `blocked` then releases; concurrent claims on the same item
resolve to exactly one winner, with the loser getting a typed conflict
that never touches the eventlog; and existing tests were updated to the
new contract, not just patched to pass.

## Landing hit a same-day flake, resolved via catchup, not a code change

The merge attempt first failed `verify-fail-post-merge` (goal-check exit
1 on the staged merge). Running `fgos catchup` (merging main into
`fgw/tsk-40m`) and re-running the full suite passed clean — confirming a
load-induced flake, not a real regression from this item's own diff. No
code change was needed; the item moved `blocked → awaiting-approval` on
retry.
