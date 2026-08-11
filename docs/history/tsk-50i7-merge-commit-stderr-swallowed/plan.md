# Plan: approve/merge swallows git commit's stderr

Mode: tiny

Two files (`src/runner/merge.mjs`, `test/runner/merge.test.mjs`), one direct
task: attach `err.stderr`/`err.status` to the `MergeError` thrown by both
`git commit --no-edit` catch branches in `mergeRunnerItem`, matching the
shape CONTEXT.md D2 already locks. No split — this is one honest piece of
work, not several independently workable ones. No `fgos graph` call: there
is nothing to order or unblock-compare (a single piece, no children, no
alternative sequencing).

## Approach

Only path considered: match the existing `merge.mjs:917` precedent shape
(`{ branch, stderr: err.stderr ?? null, status: err.status ?? null }`) —
CONTEXT.md D2 already locked this as the closest, most directly comparable
in-file convention, so no alternative shape was evaluated. `bin/fgos.mjs`'s
slightly more defensive `typeof err.stderr === 'string' ? ... :
err.stderr?.toString()` coercion was considered and rejected in CONTEXT.md
(scout evidence) in favor of the same-file precedent — noted here, not
re-litigated.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `src/runner/merge.mjs:954-959` (the two commit-failed catch branches) | low — additive field only, no control-flow change | existing test `mergeRunnerItem aborts the merge when "git commit" itself fails...` (`test/runner/merge.test.mjs:614-630`) must still pass unchanged (its regex assertion targets `err.message` text, which this fix does not alter) |
| New pinning test | low — new test, no existing behavior to regress | new test asserts the thrown error's `.stderr` carries a value injected via a fake failing pre-commit hook (`echo "..." >&2; exit 1`, the same technique the existing test at line 614 already uses) |
| Downstream consumers of `MergeError` from this call site (`bin/fgos.mjs`'s `approve`/`merge` verb handlers) | low | scout confirmed (CONTEXT.md) these read `err.message`/`err.stderr` already, generically, not a hardcoded shape that would break on new fields; no assertion elsewhere pins `MergeError`'s exact key set |

### Files touched

- `src/runner/merge.mjs` — both `git commit --no-edit` catch branches (today: lines 954-957 and 959).
- `test/runner/merge.test.mjs` — one new pinning test near the existing commit-failed test (line ~614).

### Impact-analysis posture

`impact-analysis: full` (GitNexus present, confirmed in CONTEXT.md). GitNexus
confirms `MergeError` callers are `reviewDiff`/`changedFiles`/
`renumberDecisionFile` — none overlapping the commit-failed catch branches
this item touches. Blast radius stays inside `mergeRunnerItem`'s own two
catch blocks plus the CLI's existing generic error-message/stderr readers.

## Shape

Direct task, no phases:

1. In the abort-also-failed branch (currently `merge.mjs:954-957`), add
   `stderr: err.stderr ?? null, status: err.status ?? null` to the `MergeError`
   details object (alongside the existing `branch` field) — `err` here is
   the original `git commit` failure, already in scope in that catch block.
2. In the clean-abort branch (currently `merge.mjs:959`), add the same two
   fields to that `MergeError`'s details object.
3. Add one new test in `test/runner/merge.test.mjs`, adjacent to the
   existing commit-failed test (line ~614): reuse the same fake
   pre-commit-hook technique, but write a distinguishable string to stderr
   (e.g. `"refused by test hook for stderr-pinning"`), catch the rejection,
   and assert `err.stderr` (or `err.cause?.stderr` / whatever property name
   `MergeError`'s `Object.assign(this, details)` exposes it as directly on
   the thrown instance — confirmed by `MergeError`'s own constructor,
   CONTEXT.md scout) includes that string.
4. Run `npm test` (the item's own verify) — must pass, including the
   existing commit-failed test unchanged.

### Cases to prove

- Commit fails with a real stderr message (the pinning test) — `.stderr`
  surfaces it.
- Commit fails when `git merge --abort` ALSO fails (the other catch branch,
  line 954-957) — not separately pinned by a new test (CONTEXT.md scope is
  the diagnostic gap on the primary commit-fail path; the double-failure
  branch already has no dedicated existing test either, and is not the
  branch the item's own incident hit) — accepted as an existing gap, not a
  new one this item introduces.
- Existing regression: the current commit-failed test's message-regex
  assertion must keep passing verbatim (proves the message text itself is
  untouched, only `details` gained fields).

## Outstanding questions

None
