# Phase 2 — cache/ and runtime/ buckets

## Outcome (actual, differs from initial scope)

- **`tool-status.local.json` → `.fgos/runtime/`**: done. 1 real call site
  (`src/state/tool-registry.mjs`'s `toolStatusPath`), 3 test files fixed.
  `npm test` green.
- **`events-jsonl.truncation-guard.json` → `.fgos/runtime/`**: done. 2 real
  call sites (`src/state/events-jsonl-truncation-guard.mjs`,
  `src/setup/registrations.mjs`), 4 test files fixed (some tests construct
  this path themselves and pass it to low-level `readGuardMark`/
  `writeGuardMark` — those didn't need changes; only tests relying on the
  *production* internal resolution did). `npm test` green.
- **`state.json` → `.fgos/cache/`**: attempted, reverted. 4 real call sites
  in production code (small), but **21 test files independently hardcode
  `.fgos/state.json`** instead of going through the shared harness helper —
  moving it broke **51 tests** (most of the e2e/pr-gate/self-improve-loop
  suite). All already gitignored either way — zero dirty-tree benefit, only
  cost. Reverted; stays at `.fgos/state.json` root. `.gitignore` comment
  records why, so a future attempt doesn't repeat the same discovery cost.
- **`sessions.json`, `sessions.lock`, `main-checkout.lock`, `runner.lock`,
  dispatch/merge-slot locks**: not attempted. `.githooks/pre-commit` (the
  real, tracked pre-commit hook — not `.git/hooks/`, which is
  machine-local) imports `main-checkout-lock.mjs` and
  `session-identity.mjs` directly and runs on *every* commit to this repo.
  These files sit on the single most incident-scarred code path in the
  repo (STR65, tsk-1d9, tsk-2l8). Zero dirty-tree benefit (already
  gitignored) for real risk to live concurrency control — not worth it.
  Left at `.fgos/` root indefinitely unless a future need (not just
  tidiness) justifies touching this code again.

## Lesson

`state.json`'s blast radius (21 files) vs the other two (≤4 files each)
confirms the plan's original risk ranking was right in spirit but wrong in
degree — "purely organizational" undersold how many places had drifted
into their own hardcoded copy of a path instead of using the shared
resolver. Test the actual blast radius (grep + run suite) before trusting
a small sample of call sites, even for a "just move a file" change.
