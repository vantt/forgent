# CONTEXT: fgos return refuses to close out work already done before the claim (tsk-4on)

## Feature boundary

`fgos return <id>` requires the branch/HEAD to have advanced past
`branchHeadAtTake`/`headAtTake` — the value stamped at claim time — before
it will run verify and settle the item. This is a deliberate anti-cheat
gate (forces real new work between claim and return; confirmed by
`docs/history/claim-reclaim-branchhead-reset/CONTEXT.md` D2). It breaks
for a distinct, legitimate case: an item whose real work was already
fully committed on its branch *before* this particular claim happened
(e.g. a parent item whose children are already `done`/`compound-learn`
and whose merged content already sits on the parent's own branch from a
prior session). `claimWork` (`src/runner/claim-port.mjs`) stamps
`branchHeadAtTake`/`headAtTake` to the branch's live tip at claim time
regardless, so there is structurally no room left for "a new commit" —
`return` refuses forever, even though the work is genuinely finished and
verify would pass right now.

Confirmed repro: tsk-4j9 (parent, 4 children done/compound-learn, branch
work completed in a prior session, re-picked, immediate `return` refused
with "branch has not advanced past branchHeadAtTake").

This is a different bug shape from `claim-reclaim-branchhead-reset`
(tsk-2zv, already fixed): that item covered a *reclaim* of a specific,
taggable release event (`releaseClaimOnExecuting`'s `claim-lock-3b`
marker, `decompose.mjs:294-300`). tsk-4on's case has no such single
release event to tag — the branch simply already reflects completed work
by the time of this claim, whether that claim is a genuinely first-ever
`take`/`pick` on the branch or a later reclaim through some other path.

Current workaround: `fgos move <id> --to proposed` directly. This
bypasses `return` entirely, so it never calls `addOutcome` — the item is
left with `actual: null` forever, permanently surfaced by
`collectMissingOutcomeNag` (`bin/fgos.mjs:427-437`). Not an acceptable
long-term path; this item replaces it with a real one.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix ships as a new verb/flag on `return` — not an extension of the `claim-reclaim-branchhead-reset` (tsk-2zv) reclaim-marker mechanism (`isClaimLockReclaim` in `claim-port.mjs`). Chosen over broadening that mechanism because: (1) tsk-4j9's repro has no single taggable release event to mark — the branch's "already done" state accumulates across a parent/children lifecycle, not one governable transition, so there is nothing concrete for a marker-based approach to key off; (2) broadening `isClaimLockReclaim`'s auto-detection is exactly what the sibling item's own D2 revision already rejected for the analogous blocked-retake path, on the grounds that auto-preserving `branchHeadAtTake` more broadly risks silently defeating the anti-cheat gate for the wrong case (a lazy retake dodging a failed verify, not genuinely-done-elsewhere work); (3) an explicit flag/verb is faster to ship, has a clean provable test (invoke it on a stuck item, assert transition + `actual` outcome recorded), and keeps the "this is genuinely done" judgment with the operator invoking it, not a heuristic. |
| D2 | The new path is gated by: verify passing on the item's current state, AND this being the item's first-ever `return` attempt for this claim (the item has never previously been parked `blocked` by a verify-fail on this branch). Reasoning: prevents the bypass being used to dodge the advance-past-`branchHeadAtTake`/`headAtTake` anti-cheat check after a failed retry loop — it can only close out work that was never returned at all, never rescue a retake that already failed verify once. |
| D3 | Fix scope covers both claim shapes: branch-sourced (`branchHeadAtTake`, `pick`/isolate claims — the confirmed tsk-4j9 repro) and main-sourced (`headAtTake`, plain `take` without a worktree). Chosen over repro-only scope: the same "work already done before this claim" shape can equally hit a plain `take`, even without a confirmed repro yet. |

## Pinned terms

- **Reclaim** (as used in `claim-reclaim-branchhead-reset`) — releasing and
  re-claiming the SAME execution round through a specific, taggable
  transition (`claim-lock-3b`). Distinct from this item's case, where the
  claim doing the closing-out may be the branch's first-ever claim under
  the state machine, with no prior release event at all.
- **Close** (working name for the new path, pending implementation
  naming) — settling an item via `return`'s own verify-then-transition
  logic when there is no new commit to require, as opposed to `return`'s
  normal contract of proving new work happened since claim.

## Scout evidence

- `bin/fgos.mjs:1508-1514` / `1576-1582` — the two `return` advance
  checks (`branchAheadCount <= 0` / `aheadCount <= 0`) that refuse when
  branch/HEAD hasn't moved past `branchHeadAtTake`/`headAtTake`.
- `src/runner/claim-port.mjs:116-183` — `claimWork`'s
  `branchHeadAtTake`/`headAtTake` computation: recomputes to the
  branch's/repo's live tip on every claim except the one already-fixed
  `isClaimLockReclaim` case (`claim-port.mjs:158-165`, tsk-2zv).
- `bin/fgos.mjs:427-437` — `collectMissingOutcomeNag`: flags any item in
  a final status (`awaiting-approval`/`blocked`/`done`) with no recorded
  `outcomes[id].actual` — the exact symptom left behind by the
  `fgos move --to proposed` workaround, since `move` never calls
  `addOutcome`.
- `docs/history/claim-reclaim-branchhead-reset/CONTEXT.md` — the sibling
  item (tsk-2zv) that fixed the single-taggable-event reclaim case, and
  whose D2 revision (blocked-retake explicitly out of scope, auto-detect
  broadening rejected as anti-cheat risk) is the direct precedent for
  this item's D1.
- `src/intake/plan.mjs:294-300` — `releaseClaimOnExecuting`, the one
  release path tsk-2zv's marker mechanism covers; confirms tsk-4j9's
  parent/children shape is not this same transition.
- No existing `docs/decisions/` entry or `docs/backlog.md` row references
  this gap prior to this item (grepped, no hits) — no prior locked
  decision could conflict with D1-D3 above.

## Deferred to planning

- Exact CLI shape: a flag on `return` (e.g. `fgos return <id>
  --no-new-commits-ok`) vs. a separate verb (e.g. `fgos close <id>`) —
  D1 only locks "new surface, not marker-extension," not the concrete
  name/shape.
- How "first-ever return attempt" (D2) is detected — walking
  `outcomes`/event log for any prior `actual.outcome === 'blocked'` on
  this item's current claim, or a narrower per-branch signal. Also: does
  a prior claim-lock §3b reclaim (tsk-2zv path) count as part of "this
  claim" for D2's purposes, or reset the count.
- Whether D2's gate needs the SAME `addOutcome`/friction shape `return`
  already writes on both its normal branches (`awaiting-approval` on
  pass, `blocked` + friction on verify-fail) — likely yes, but the exact
  `actual` payload shape (e.g. `aheadCount: 0` explicitly recorded) is
  implementation detail.
- Test coverage shape: a repro-shaped test (claim on a branch whose tip
  already contains complete, verify-passing work with zero commits since
  take -> new path succeeds and records `actual`), alongside the
  existing `branchHeadAtTake`/`headAtTake` tests in
  `test/cli/fgos.test.mjs`, `test/state/store.test.mjs`.
- Whether `docs/specs/runner.md`'s `return` contract section needs a line
  documenting this new path — a doc update, not a behavior decision.
