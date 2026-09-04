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

## Post-landing audit found one real gap, tracked as its own known-gap header (`tsk-1sl`)

A follow-up re-audit re-ran the design doc's own §17 grep sweep against
real `src/` state and cross-checked all 14 §15 acceptance criteria — all
14 confirmed pass with cited evidence, zero unclassified hit. But the
audit itself surfaced one real, live-reproduced gap not covered by those
14 criteria: §16.3's "settlement after durable revision drift fails or
goes through explicit reconcile" only had the fail half implemented —
`settleClaim` had no reconcile path, so `fgos return` refused for any
claimed item edited mid-lifecycle (the routine, expected
`fgos-coding-planning`/`fgos-coding-discovering` pattern), even when the
SAME claim-holder made every edit. This exact gap is
[`settleclaim-revision-drift-self-caused`](settleclaim-revision-drift-self-caused.md)
(`tsk-1hq`/`tsk-1ht`) — the design doc's own status header was updated
from "implemented" to "partially implemented" to name it, rather than
silently claiming full completion while a known, reproduced gap sat
unfixed.

## Landing hit a same-day flake, resolved via catchup, not a code change

The merge attempt first failed `verify-fail-post-merge` (goal-check exit
1 on the staged merge). Running `fgos catchup` (merging main into
`fgw/tsk-40m`) and re-running the full suite passed clean — confirming a
load-induced flake, not a real regression from this item's own diff. No
code change was needed; the item moved `blocked → awaiting-approval` on
retry.

## The prose docs still described the old durable-doing model (`tsk-4kn`)

Landing the code (this doc's own D1-D6) didn't touch `docs/specs/runner.md`
or `docs/specs/work-state.md` — both still described claiming an item as a
durable `todo -> doing` write, the exact model D1 retired. `tsk-4kn`
corrected both specs' prose (take/return claim language, Data Dictionary
#4/#14 in `work-state.md`; "Một vòng --once", entry-points, and "Gặt lại
lúc khởi động" in `runner.md`) to state plainly that new claims do not
durably write into `doing`, and to name the distinction this doc's D1/D4
already draw: durable status vs. the runtime-claim-overlay effective
status. Docs-only change, scope-bounded to those two spec files.

The diff was implemented, verified (47/47), and committed once already
(`fgw/tsk-4kn`, commits `ef2dd826`/`cff86806`/`83eb4065`/`8d28f3ba`) — then
lost before it could return, when a shared-main-checkout event-log
truncation incident (13:42-13:44Z) wiped the item's fgOS history mid-flight
(the same bug class tracked in
[`fgos-lifecycle-tracking-concurrent-desync`](fgos-lifecycle-tracking-concurrent-desync.md)'s
still-open write-side event-loss half). `tsk-4kn` itself is the resubmit
that drove a fresh item through the lifecycle to reapply and formally
return that already-proven diff, rather than a second design pass.

## The skill docs that ACT on D5 hadn't caught up either (`tsk-4lh`)

`tsk-4kn` fixed the two spec docs; `src/runner/worktree.mjs:1054-1060` had
already stated D5 correctly (both the retired pre-`tsk-40m` behavior and
the current one). But `.agents/skills/fgos-coding-validating/SKILL.md`'s
own Handoff section — the doc a session actually reads mid-workflow to
decide whether it needs to re-claim before calling
`fgos-coding-implement` — still asserted the retired behavior as present
fact: "the `fgos plan` call also releases the item's claim back to `todo`
the moment the item reaches `executing` — this is expected and correct."
Live-reproduced in this same run (`tsk-myq`): calling `fgos plan
tsk-myq --verdict pass-through` then immediately reading `fgos list --id
tsk-myq --json` back showed status `doing`, not `todo` — confirming via
source (`plan.mjs`'s `releaseClaimOnExecuting` stub, D5 above) this was
the doc lying, not a fluke.

`tsk-4lh` corrected `fgos-coding-validating/SKILL.md`'s Handoff section
and `fgos-coding-implement/references/worker-contract-and-orient.md`'s
matching "re-check claim status" framing to state D5's actual current
behavior — the claim persists unbroken through `clarify -> executing`,
no release/reclaim window exists — modeled on `worktree.mjs`'s already-
correct wording, then ran `npm run build:skills` to propagate the fix
into `.agents/skills/**` and `plugins/fgOS/skills/**`. Docs-only, no code
change, scope-bounded to the two skill-doc sources plus their generated
copies.
