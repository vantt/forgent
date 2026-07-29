# Plan: claim reclaim resets branchHeadAtTake (tsk-2zv)

## Mode

**Standard.** Flag count: 2 of 10 (existing covered behavior, weak proof
around the area). No hard-gate flag (no auth, no data loss, no external
provider, no removal of a validation) and no story-sized new behavior, so
this stays below high-risk; but it touches `claimWork`'s shared claim path
(hit by every `pick`/`take`, per `test/runner/claim-port.test.mjs`) and the
branch-source `return` check (`test/e2e/pr-gate.test.mjs` test (e)/(f)),
so `tiny`/`small` would understate the blast radius — a one-line change in
a shared claim path still needs the phased shape below to prove it doesn't
regress the other callers.

## Approach

**Chosen:** fix at the write side — `claimWork`
(`src/runner/claim-port.mjs:119-126`) stops unconditionally recomputing
`branchHeadAtTake` from the branch's live tip whenever `branchAlreadyExists`
is true. Instead: if the item already carries a `branchHeadAtTake` from a
prior claim on this same branch, **keep that existing value**; only
compute a fresh tip when the item has no `branchHeadAtTake` yet (a
genuine first claim that happens to land on a pre-existing branch, e.g. a
runner-created root branch not yet claimed by a session).

This single change satisfies both locked decisions without a second call
site:
- **D1** (infra fix) — the claim path itself becomes reclaim-safe; no
  workflow-ordering rule for a human/agent to remember.
- **D2** (both paths) — claim-lock §3b release/reclaim and the
  blocked-item branch-retake (`isBranchTake`) both flow through this same
  `branchAlreadyExists` branch in `claimWork`, so one fix covers both. The
  branch name is deterministic per id (`branchNameFor(id)`), so there is no
  cross-item leakage risk from reusing the stored value.

**Rejected alternative:** make `return` (`bin/fgos.mjs:1404-1418`) walk the
raw event log for the EARLIEST `branchHeadAtTake` ever recorded for the
id, instead of trusting `item.branchHeadAtTake`. Rejected per KISS — it
moves the fix into `return`'s core verify-gating logic (higher blast
radius, the one check every branch-source item's completion depends on),
requires new event-log-scanning code, and has to solve the exact same
"is this the same lineage or an unrelated later take" problem the chosen
approach already solves for free by reading the item's own current field.

## Risk map

| Component | Risk | Proof point (fgos-validating) |
|---|---|---|
| `claimWork`'s `branchAlreadyExists` branch (`src/runner/claim-port.mjs:116-126`) | Medium — shared by every claim through this path (fresh take, §3b reclaim, blocked-retake) | `test/runner/claim-port.test.mjs`'s existing 3 tests stay green; new test proves a §3b-style release+reclaim preserves the original `branchHeadAtTake` |
| Blocked-item branch-retake (`isBranchTake`, `claim-port.mjs:131-133`) | Low-medium — must not change behavior for a genuine first branch-take (e.g. runner-created root branch, no prior `branchHeadAtTake` on the item) | `test/e2e/pr-gate.test.mjs` test (e) (park → take → commit → return) and test (f) stay green unmodified — both are first-claims-on-existing-branch, must still compute fresh tip |
| `return`'s branch-ahead check (`bin/fgos.mjs:1404-1418`) | Low — no code change here, but its correctness now depends on the preserved value | New e2e test: claim → release (§3b-style, simulated via direct `moveWork` to `todo` without touching `branchHeadAtTake`) → reclaim → commit → `return` succeeds, proving credit for the pre-reclaim commit is no longer lost |

## Files touched

1. `src/runner/claim-port.mjs` — the fix itself (guard the recompute on
   `item.branchHeadAtTake` already being set).
2. `test/runner/claim-port.test.mjs` — new test: claim on a fresh branch,
   simulate a §3b-style release (`status: doing → todo`, `branchHeadAtTake`
   untouched — matching `decompose.mjs`'s own `releaseClaimOnExecuting`
   shape), commit on the branch, reclaim, assert the reclaimed
   `branchHeadAtTake` equals the ORIGINAL value, not the post-commit tip.
3. `test/e2e/pr-gate.test.mjs` — no new test required by this item alone
   (existing (e)/(f) already cover the first-claim branch-source path and
   must keep passing unmodified), but the fgos-validating reality check
   should confirm they still pass under the changed code, since they are
   the closest existing coverage for the `useBranchSource` path this
   change touches.
4. `docs/specs/runner.md` / `docs/specs/work-state.md` — optional doc note
   (deferred in `CONTEXT.md`) that `branchHeadAtTake` now survives the
   claim-lock §3b release/reclaim cycle; not required for the fix itself,
   revisit only if fgos-validating flags the spec as now stale.

## Order

No `fgos graph --what-if` split candidates apply — `tsk-2zv` is a leaf
item with no children and no other item depends on it
(`fgos graph --json`: component size 1). This proceeds as one piece, no
decomposition into child items:

1. Implement the `claimWork` guard.
2. Add the `claim-port.test.mjs` reclaim-preservation test (proves the
   write-side fix directly, fastest feedback).
3. Run the full existing `test/runner/claim-port.test.mjs` and
   `test/e2e/pr-gate.test.mjs` suites to confirm no regression on the two
   already-covered branch-source paths.
4. `npm test` (full suite) before `return`.

## Split

None. One cohesive fix + one new unit test + a full-suite regression
check — does not meet the bar for decomposing into child items.
