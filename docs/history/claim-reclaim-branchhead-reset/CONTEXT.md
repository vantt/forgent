# CONTEXT: claim reclaim resets branchHeadAtTake, hiding pre-reclaim commits from return (tsk-2zv)

## Feature boundary

Fix the two claim/reclaim paths where `branchHeadAtTake` gets recomputed
from the branch's *current* tip on a reclaim, silently swallowing every
commit made before that reclaim — so `fgos return`'s
advance-past-`branchHeadAtTake` check refuses genuinely-done work.

Two paths share the exact mechanical shape:

1. **Claim-lock §3b release/reclaim** (the confirmed repro): a `pick`
   claim held through `clarify`/`decompose` (`status: doing`) is released
   back to `todo` the moment `resolveDecompose` moves the root to
   `executing` (`src/intake/plan.mjs:261-265`,
   `releaseClaimOnExecuting`). A session that re-picks the same item
   afterward has `claimWork` (`src/runner/claim-port.mjs:119-126`) see
   `branchAlreadyExists === true` and stamp `branchHeadAtTake` to the
   branch's live tip — which already includes every commit made during
   `clarify`/`decompose` (CONTEXT.md, plan.md, and, in tsk-424's dogfood
   case, the code fix itself).
2. **Blocked-item branch-retake** (`claim-port.mjs:131`, `isBranchTake`,
   human-rounds D2): a person retaking a `blocked` item that already has a
   branch hits the identical `branchAlreadyExists` recompute at
   `claim-port.mjs:121`. UPDATE (fgos-coding-validating pass): this recompute is
   deliberate, not a bug — it is the anti-cheat gate that forces new work
   after a verify-fail or reject before `return` can succeed again
   (confirmed by `test/cli/fgos.test.mjs:4997-5019`, which asserts the
   recomputed value equals the branch's live tip at retake time). Out of
   scope per D2 (revised) below.

Out of scope: a genuinely fresh `take`/`pick` (no prior claim on this
branch) — `branchHeadAtTake` correctly reflects "nothing done yet" there,
and this item does not touch that case. Also out of scope: `headAtTake`
(the main-based, non-isolated claim marker) — it is a different field for
a different claim shape (`useBranchSource === false`) and this item's
repro is exclusively branch-sourced (`isolate`/`isBranchTake`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix direction is an infra change to the claim/return mechanism itself — not a docs-only workaround telling a continuing session to defer implementation commits until after the stage-firing `discover` call. Chosen for consistency with the sibling item (tsk-424, `docs/history/fgos-pick-worktree-relocation/CONTEXT.md` D1) which faced the identical infra-fix-vs-docs-only fork and locked the infra fix, on the same reasoning: a docs-only answer relies on a person or agent remembering an unenforced ordering rule, and silently regresses the moment that order isn't followed. |
| D2 | ~~Fix scope covers BOTH reclaim paths...~~ **REVISED at fgos-coding-validating**: fix scope is the claim-lock §3b decompose→executing release/reclaim path ONLY (the confirmed repro). The blocked-item branch-retake path (`isBranchTake`) is explicitly OUT of scope — its recompute-to-live-tip is a deliberate anti-cheat gate (forces new work after verify-fail/reject), not shared bug shape; extending the fix there would defeat that gate. Reversed on new evidence (`test/cli/fgos.test.mjs:4997-5019`, the `human-rounds D2` comment at `claim-port.mjs:128-130`), confirmed with the user before reversing (review-audit-self-decision.md protocol). |
| D3 | The fix mechanism must positively identify "this todo entry came from a §3b release," not infer it from "status is todo and branch already exists." A rejected item (`proposed→todo`, `bin/fgos.mjs:1978-1989`) never deletes its branch, so it lands in the exact same shape a §3b-released item does — a naive "preserve branchHeadAtTake whenever already set" would also wrongly preserve a stale marker across a reject-then-retake. Mechanism: tag the §3b release's `moveWork(..., to: 'todo', ...)` call (`decompose.mjs:263`) with a distinguishing marker, and have `claimWork` check — via `readRawEvents` (already read at claim time for `visitCount`, `claim-port.mjs:96`) — whether the item's most recent `work.move` event landing on `todo` carries that marker before deciding to preserve vs. recompute `branchHeadAtTake`. |

## Scout evidence

- `src/runner/claim-port.mjs:116-126` — `branchHeadAtTake` is computed
  fresh from `gitAt(repoRoot, ['rev-parse', branch])` whenever
  `branchAlreadyExists` is true, on EVERY claim through this path
  (fresh take, §3b reclaim, and blocked-branch retake alike) — no
  distinction today between "first take on this branch" and "reclaim of
  a release".
- `src/runner/claim-port.mjs:131-133` — `isBranchTake = item.status ===
  'blocked' && branchAlreadyExists`; `useBranchSource = isolate ||
  isBranchTake` — both the pick-isolate path and the blocked-retake path
  route through the same `branchHeadAtTake` recompute.
- `src/intake/plan.mjs:261-265` — `releaseClaimOnExecuting`: `if
  (work.status === 'doing') moveWork(dir, { id, to: 'todo',
  expectedStatus: 'doing' })` — releases the claim without touching
  `branchHeadAtTake` at all; the field is left stale until the next
  claim's `to: 'doing'` move overwrites it (see next point).
- `src/state/replay.mjs:88-102` — `branchHeadAtTake` (and `headAtTake`,
  `claimRole`, `claimTrigger`) are folded onto the item ONLY on a `to ===
  'doing'` move with `from !== 'awaiting-human'` — i.e. every genuine
  claim (fresh or reclaim) overwrites it; there is no reclaim-aware
  branch in this fold today.
- `bin/fgos.mjs:1404-1418` — `return`'s branch-source check:
  `branchAheadCount = commitsSince(repoRoot, item.branchHeadAtTake,
  branchHead)`; refuses when `branchAheadCount <= 0`. This is the check
  that reads whatever `branchHeadAtTake` the most recent claim stamped —
  the value this item's fix must make trustworthy across a reclaim.
- `docs/specs/runner.md:163-168` — claim-lock §3b prose: confirms the
  release/reclaim cycle is an intentional, documented lifecycle feature
  (letting a session or a different session re-pick the same branch for
  the `executing` phase), not a bug in itself — the bug is only in what
  `branchHeadAtTake` means across that cycle.
- `docs/history/fgos-pick-worktree-relocation/CONTEXT.md:95-106` — the
  "Execution finding (filed separately as tsk-2zv)" section: the original
  repro report, written during tsk-424's own execution (2026-07-28), and
  the sibling item's own D1 (infra fix over docs-only) cited as precedent
  for D1 above.
- No existing `docs/decisions/` entry or `docs/backlog.md` row references
  this gap prior to this item — confirmed via grep, so no prior locked
  decision could conflict with D1/D2 above.

## Deferred to planning

- Exact mechanism for making `branchHeadAtTake` reclaim-safe: whether
  `claimWork` should skip recomputing it on a detected reclaim (and how a
  reclaim is distinguished from a genuine first take on that branch), or
  whether `return`'s check should instead walk the event log for the
  EARLIEST `branchHeadAtTake` recorded since the branch's own creation
  and compare against that — both satisfy D1/D2, this is implementation
  shape.
- How to distinguish "released via claim-lock §3b, about to be reclaimed
  for the same execution round" from "a later, unrelated take on a branch
  that happens to still exist" — needed so the fix doesn't accidentally
  let a stale/unrelated old branch tip suppress a legitimate later
  return-refusal.
- Test coverage shape: planning/implementation to add a repro-shaped test
  (claim → release via §3b → reclaim → commit → return) proving the fix,
  alongside the existing `branchHeadAtTake` tests in
  `test/state/replay.test.mjs`, `test/state/store.test.mjs`,
  `test/e2e/pr-gate.test.mjs`, `test/cli/fgos.test.mjs`.
- Whether `docs/specs/runner.md`'s claim-lock §3b prose and
  `docs/specs/work-state.md`'s claim-lock references need a line noting
  `branchHeadAtTake` now survives the release/reclaim cycle correctly —
  a doc update, not a behavior decision.
