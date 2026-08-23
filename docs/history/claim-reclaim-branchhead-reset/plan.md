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

**REVISED at fgos-coding-validating** (see CONTEXT.md D2 revision + D3): the
original "preserve `branchHeadAtTake` whenever already set" mechanism was
unsafe — it cannot distinguish a §3b release from a reject (`proposed→
todo`, which never deletes the branch, `bin/fgos.mjs:1978-1989`) or a
verify-fail park, both of which land the item at the exact same
`status`+`branchAlreadyExists` shape. Preserving blindly there would
defeat the deliberate anti-cheat gate that forces new work before a
retaken item can `return` again (`test/cli/fgos.test.mjs:4997-5019`).

**Chosen:** a positive marker, not an inference from status shape.

1. `src/intake/plan.mjs:263` — `releaseClaimOnExecuting`'s own
   `moveWork(dir, { id, to: 'todo', expectedStatus: 'doing' })` call gains
   a new additive field marking this specific `todo`-entry as a claim-lock
   §3b release (mirrors the existing `claimTrigger`/`headAtTake` additive-
   stamp convention in `store.mjs:334-400` — a new named param, forwarded
   post-transition, ignored by the pure `transitionWork` the same way
   `role`/`headAtTake` already are).
2. `src/runner/claim-port.mjs` — before computing `branchHeadAtTake` in the
   `branchAlreadyExists` branch, check whether the item's MOST RECENT
   `work.move` event landing on `to: 'todo'` carries that marker (via
   `readRawEvents(dir)`, already imported and read at claim time for
   `visitCount`, `claim-port.mjs:96,10` — same established pattern, no new
   import). Marker present → preserve the item's existing
   `branchHeadAtTake`. Marker absent (reject, verify-fail park, or a
   genuinely fresh take that happens to land on a pre-existing branch) →
   compute fresh from the live tip, exactly as today.

Reading the event log directly (rather than a durable item field) avoids
a staleness trap: the check always answers "how did THIS item arrive at
its CURRENT `todo` status," so it can never carry forward a marker from
some earlier, unrelated release the way a durable boolean field would if
a later reject-to-todo move forgot to clear it.

This satisfies both locked decisions:
- **D1** (infra fix) — the claim path itself becomes reclaim-safe for the
  in-scope case; no workflow-ordering rule for a human/agent to remember.
- **D2** (revised, §3b-only) — only the §3b release path gets the marker;
  the blocked-item branch-retake path is untouched, its existing
  recompute-to-live-tip behavior (and anti-cheat property) preserved
  exactly as-is.

**Rejected alternatives:**
- Infer from status/branch-existence alone (the original chosen approach)
  — rejected on the D2/D3 evidence above: indistinguishable from reject
  and verify-fail-park, defeats their anti-cheat gate.
- Make `return` (`bin/fgos.mjs:1404-1418`) walk the raw event log for the
  EARLIEST `branchHeadAtTake` ever recorded for the id, instead of
  trusting `item.branchHeadAtTake`. Rejected per KISS — moves the fix into
  `return`'s core verify-gating logic (higher blast radius, the one check
  every branch-source item's completion depends on) and still has to
  solve the identical release-vs-reject disambiguation problem, just on
  the read side instead of the write side.

## Risk map

| Component | Risk | Proof point (fgos-coding-validating) |
|---|---|---|
| `claimWork`'s `branchAlreadyExists` branch, marker check (`src/runner/claim-port.mjs:116-126`) | Medium — shared by every claim through this path (fresh take, §3b reclaim, blocked-retake, reject-retake) | `test/runner/claim-port.test.mjs`'s existing 3 tests stay green; new test proves a §3b-style release+reclaim (marker present) preserves the original `branchHeadAtTake` |
| Reject-then-retake at `todo` (`bin/fgos.mjs:1978-1989` reject, no branch deletion) | Medium — must NOT preserve stale `branchHeadAtTake` here (no marker present) | New test: reject a branch-source proposed item, retake it, assert `branchHeadAtTake` recomputes to the live tip (marker absent → fresh, same as today) |
| Blocked-item branch-retake (`isBranchTake`, `claim-port.mjs:131-133`) | Low — explicitly OUT of scope (D2 revised); must be provably UNCHANGED | `test/e2e/pr-gate.test.mjs` test (e)/(f) and `test/cli/fgos.test.mjs:4997-5019` stay green unmodified — no marker ever applies to this path, so the existing recompute-to-live-tip fires exactly as before |
| `decompose.mjs`'s `releaseClaimOnExecuting` marker stamp (`src/intake/plan.mjs:263`) | Low — additive field on an existing call, mirrors `claimTrigger`/`headAtTake` convention (`store.mjs:334-400`) | `test/intake/plan.test.mjs` (existing suite) stays green; new assertion that the release event carries the marker |
| `return`'s branch-ahead check (`bin/fgos.mjs:1404-1418`) | Low — no code change here, but its correctness now depends on the write-side fix | New e2e test: claim → §3b-style marked release → reclaim → commit → `return` succeeds, proving credit for the pre-reclaim commit is no longer lost |

## Files touched

1. `src/intake/plan.mjs` — `releaseClaimOnExecuting`'s `moveWork`
   call gains the release marker.
2. `src/state/store.mjs` — `moveWork`'s signature/post-transition stamp
   gains the new additive param (mirrors `claimTrigger`).
3. `src/state/replay.mjs` — fold the new marker onto the `to: 'todo'`
   move's payload the same additive way `branchHeadAtTake` etc. are
   folded on `to: 'doing'` moves.
4. `src/runner/claim-port.mjs` — the fix itself: read the marker via
   `readRawEvents(dir)` before deciding preserve-vs-recompute.
5. `test/runner/claim-port.test.mjs` — new tests: (a) §3b-style marked
   release + reclaim preserves the original `branchHeadAtTake`; (b)
   reject-then-retake (no marker) still recomputes fresh.
6. `test/intake/plan.test.mjs` — assert the release event carries
   the new marker.
7. `test/e2e/pr-gate.test.mjs` / `test/cli/fgos.test.mjs:4997-5019` — no
   new test required; run unmodified to confirm the blocked-retake path
   (D2, out of scope) is provably unchanged.
8. `docs/specs/runner.md` / `docs/specs/work-state.md` — optional doc note
   (deferred in `CONTEXT.md`) that `branchHeadAtTake` now survives the
   claim-lock §3b release/reclaim cycle; not required for the fix itself.

## Order

No `fgos graph --what-if` split candidates apply — `tsk-2zv` is a leaf
item with no children and no other item depends on it
(`fgos graph --json`: component size 1). This proceeds as one piece, no
decomposition into child items:

1. Add the release marker (`decompose.mjs` + `store.mjs` + `replay.mjs`).
2. Implement the `claimWork` marker check + preserve/recompute guard.
3. Add the two `claim-port.test.mjs` tests (marked-preserve,
   unmarked-recompute) and the `decompose.test.mjs` marker assertion —
   fastest feedback on the write-side fix directly.
4. Run the full existing `test/runner/claim-port.test.mjs`,
   `test/e2e/pr-gate.test.mjs`, and `test/cli/fgos.test.mjs` suites to
   confirm no regression on the blocked-retake and reject paths.
5. `npm test` (full suite) before `return`.

## Split

None. One cohesive fix (marker + read-side check) + new unit tests + a
full-suite regression check — does not meet the bar for decomposing into
child items.
