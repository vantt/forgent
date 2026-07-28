# Claim-Port & str46-io-contract: Parallel Work Collides at Merge

**Date**: 2026-07-28 20:38  
**Severity**: High  
**Component**: Runner claim-flow, event-payload schema migration  
**Status**: Resolved  

## What Happened

Two significant pieces of work landed upstream during this session, but neither knew about the other:

1. **tsk-53f (local)**: Consolidated the claim choke-point into a single `claimWork()` function (`src/runner/claim-port.mjs`), eliminating duplication across CLI `take`, CLI `pick`, and runner's `claimItem`. This refactor lived on a branch forked before upstream had done anything.

2. **str46-io-contract (upstream)**: A schema migration that renamed the event-payload field from `actor` to `role` everywhere — committed to main while this session was building claim-port in parallel.

The `git pull` surfaced this as a genuine 3-way merge conflict with 13 real upstream commits. The code reviewer caught bugs that had zero chance of passing tests: `claim-port.mjs` was calling `moveWork`/`addOutcome` with stale `actor` field names; `bin/fgos.mjs`'s `take` case had a dangling `actor` reference (ReferenceError at runtime).

## The Brutal Truth

This is maddening because it's entirely avoidable. The two work streams — claim-port (tsk-53f, ~3 commits) and str46-io-contract (happened upstream) — should have been tested together BEFORE either landed. Instead, the codebase blessed both pieces independently, and the collision only surfaced during a human merge, buried in 3-way conflict markers.

The real frustration: if this refactor is going into production, a session doing this work again will hit the exact same problem. The testing infrastructure didn't catch the `actor`→`role` miss because claim-port tests ran against a locked dependency tree that hadn't absorbed the rename yet.

## Technical Details

**Bugs caught in code review:**

1. **ClaimError missing `.category`**: Lock-held/lock-ambiguous transitions from `main-checkout-lock.mjs` fell through to `'unexpected'` in `categoryOf()` classification, crashing the entire `runOnce` wave-loop, not just the contended item. Stack trace: `loop.mjs:810` rethrow with no recovery.

2. **baseRef validation gap**: A leaf item's `pick` could pass a `baseRef` naming a root branch that doesn't exist yet (e.g., human picks a decomposed child before runner dispatches the root). `createWorktree` throws AFTER `moveWork` commits durably — orphaning the item in `doing` state with no branch/worktree and no auto-recovery. Reproduced empirically against a real temp git repo; added regression test in `test/cli/fgos.test.mjs`.

3. **ADR numbering collision**: This session's ADR draft was numbered `0019`, but upstream already had `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` (unrelated pre-release exemption). Renumbered to `0020` to avoid clobbering; two `fgos-write-rejected` friction-log strings still cited pre-renumber `ADR0019`.

4. **Missing `role: 'system'` stamps**: Two new `moveWork` calls for `fgos-write-rejected` outcome omitted the `role: 'system'` stamp that every sibling blocked-transition in `merge.mjs` carries — inconsistent state shape.

## Root Cause

**claim-port never was cross-tested against str46-io-contract before this session.** The two pieces of work happened on genuinely parallel history; integration happened under merge pressure, not by design. The testing setup doesn't have a "pull all upstream landing in parallel to integration branch" stage before individual feature branches are blessed.

## Lessons Learned

1. **Schema migrations + refactors on parallel branches = integration debt.** Before claiming a refactor that touches parameter passing (like `moveWork` calls), validate against recent schema changes upstream. If you can't see what landed in the last week, pull from origin first.

2. **`actor`→`role` is now a git-diff pattern to search for** in any review of runner code. This migration is now a known pain point; it's worth a pre-commit checklist item.

3. **Code review is the only thing that caught this.** Tests were green on local main before the merge because the test suite ran against stale schema assumptions. No amount of running tests locally will catch a schema mismatch if you've forked before the schema change landed.

## Next Steps

- [ ] **Push the 5 local commits** (currently: `5955188`, `8023e9b` merge, `4dc9171`, `6b245b1`, `268b172`) — tests 1512/1517 pass, 0 fail, 5 pre-existing skips.
- [ ] **Document the str46-io-contract migration path** in `docs/` so future refactors don't repeat blind spots. Link it from `AGENTS.md` under "Before Touching Code."
- [ ] **Add a pre-merge validation** to catch any `actor` references lingering in test or source (grep-gate in CI, or a linter rule).
- [ ] **Consider whether claim-port should land with a "cross-test smoke" gate** — something that runs against upstream main's latest to catch exactly this class of parallel-work collision earlier.

---

**For the next session touching `claim-port.mjs`, `bin/fgos.mjs`'s take/pick cases, or `loop.mjs`'s `claimItem`:**  
This refactor inherited 4+ schema/state-shape bugs from a parallel str46-io-contract migration. If you're modifying claim-flow code, cross-check against the actor→role rename in event-payload fields. If upstream has landed a schema migration since your branch forked, re-run the full test suite after merging.
