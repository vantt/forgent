# Git Index Clobbering in approve(): Existing Solution Was Built But Silent

**Date**: 2026-07-28 21:30  
**Severity**: High  
**Component**: Runner merge, main-checkout-lock hook  
**Status**: Resolved  

## What Happened

`fgos approve`'s final step — `mergeRunnerItem`'s `git commit --no-edit` in `src/runner/merge.mjs` — silently lost its own state-write when another process committed to the same main checkout at the exact same moment. The `.git/index` collision (historically named `str65` in this repo) reproduced in production on tsk-veg (2026-07-28): merge commit landed correctly on main, but the work item stayed `proposed` instead of flipping to `done`. 

While scouting the fix, discovered that a **completely parallel session had already built and tested a full solution** — `src/runner/main-checkout-lock.mjs` (a lock primitive) plus `.githooks/pre-commit` (a real git hook that acquires that lock on EVERY `git commit` against the checkout, any actor: human, agent, CI, not just fgOS verbs). `test/e2e/main-checkout-lock-hook.test.mjs` — 7/7 pass, real subprocess `git commit` calls, real lock contention between identities. Once active, this hook already covers `approve`'s own `git commit --no-edit` for free.

The hook was never active by default.

## The Brutal Truth

This is infuriating. The solution was BUILT, TESTED, and LANDED upstream — but then silently deactivated with zero explanation.

The hook was auto-wired via npm's `prepare` lifecycle script (`str65-worktree-isolation-enforcement-6`), then deliberately removed (`str88-fgos-pnpm-lifecycle-1`) because pnpm 10+ blocks `prepare` for git-hosted dependencies. It was replaced with a purely manual `npm run setup:hooks` step — documented in README but never checked by `fgos doctor`, never run by `fgos setup`, and never re-automated. No ADR explained the deferral, just a terse commit message. 

So the production bug tsk-3w8 exposed was really a bug in ACTIVATION, not the lock mechanism itself. We paid the full price of discovering the bug, only to find the fix was already in the codebase, gathering dust, just not wired to anywhere people would actually run it.

## Technical Details

**The index clobbering:** `git add` + `git commit --no-edit` fails silently when another process modifies `.git/index` between those two operations. The merge commit itself lands on main (durably), but the `moveWork(to:'done')` event never gets written because the `git commit` that would capture the work-state-change rolled back. Item stays `proposed`.

**The existing solution:** `main-checkout-lock.mjs` exports `acquireAndReleaseMainCheckoutLock(cwd)`. The `.githooks/pre-commit` script (a real git hook, in `.git/hooks/pre-commit` after installation) acquires this lock before allowing ANY subprocess to proceed with commit. This block happens at the git level, not the application level — protects even direct `git commit` calls that never touch fgOS code.

**The wiring gap:** Hook was never automatically installed after the `prepare` removal. `npm run setup:hooks` still works, but nobody runs it without being told. `fgos setup` and `fgos doctor` had no idea it existed.

## Code Review Catch

First draft of `installGitHooks` unconditionally overwrote `core.hooksPath`. This was a real bug: a developer using husky, lefthook, or any existing hook tooling would have that clobbered with zero warning — inconsistent with this same verb's other two write operations (`insertSourceLine` only appends, `mergeConfigDefaults` never touches a key the user already set). 

Fixed: now fill-only. If `core.hooksPath` already points somewhere, it's left untouched, and `fgos setup` reports `hooksSkippedExisting` in its output so the operator knows a custom hook path is in play.

## Root Cause Analysis

**The deferral was necessary but never documented.** When pnpm 10+ broke the `prepare` lifecycle for git-hosted deps, removing that automation was correct. But the replacement — manual `npm run setup:hooks` — was never integrated into the normal setup paths. It became orphaned documentation, not active code.

No one blamed for this: automation deferral is legitimate when the original activation vector breaks. But **lack of a decision record + lack of integration into `doctor`/`setup` = silent failure to activate.**

## Lessons Learned

1. **When you defer an automation, document AND integrate the fallback.** A manual step in a README that isn't checked by `doctor` and isn't called by `setup` is not a fallback — it's an orphaned instruction. Future operator (or CI) won't find it under pressure.

2. **Reachability is not enforcement.** This fix adds a second activation path (not npm-lifecycle-dependent) and a way to DETECT the gap (`fgos doctor`). But a checkout that never runs `fgos setup`/`doctor`, a CI job that just runs bare `git commit` — those are exactly as unprotected today as before. The fix makes the gap visible, not invisible; it doesn't make activation mandatory. Be honest about this boundary in any follow-up documentation.

3. **Git-level fixes beat app-level guards.** An approve-scoped lock wouldn't have protected the real repro — the "other session" never called `approve`, it committed directly. Hooks block at the git layer, protecting all commits. Scope your locks where the actual collision happens.

## Next Steps

- [ ] **Document the hook activation deferral in ADR 0021** and link it from AGENTS.md's "Before Touching Code" section so future work doesn't rediscover this gap.
- [ ] **Consider non-optional hook activation in CI/release builds.** If the dogfood (this repo) starts hitting bare `git commit` from CI jobs that skip `fgos setup`, a `fgos doctor --enforce` or CI-stage hook-wiring gate would close the remaining gap. Defer to next session if no evidence of that pattern yet.
- [ ] **Test state:** `npm test` 1522/1527 pass, 0 fail, 5 pre-existing skips. Code review pass complete. Not yet pushed.

---

**For the next developer touching `src/runner/merge.mjs` or `approve`:**  
The real protection here lives in `.githooks/pre-commit`, not in application code. If you're modifying commit behavior, verify that `fgos setup` runs and `fgos doctor` reports the hook as wired green. If you ever encounter index clobbering symptoms (commit lands, state-write vanishes), check `git config core.hooksPath` and whether the pre-commit hook is actually installed in `.git/hooks/`.
