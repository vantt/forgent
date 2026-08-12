# tsk-2j9 — plan

## Mode

**standard** (2 flags counted):
- existing covered behavior — `src/runner/merge.mjs` and
  `test/runner/merge.test.mjs` already have real coverage; the fix must
  not regress any of the existing outcome shapes (`conflict`,
  `fgos-write-rejected`, `verify-fail`, `merged`).
- weak proof around the area — this exact code path already produced 3
  real crashes in production use (`tsk-18a`'s decision log); the fix
  needs a real regression test proving the crash no longer happens, not
  just code review.

No hard-gate flag (auth, data loss, audit/security, external provider,
validation removal) applies. Matches the item's own pre-set `tier:
standard`.

## Approach

Per `CONTEXT.md` D2: add a MERGE_HEAD-exists guard before all 4
`git merge --abort` calls in `mergeRunnerItemLocked`
(`src/runner/merge.mjs`). Extract a single helper —
`abortMergeIfPossible(repoRoot)` — that:
1. checks `MERGE_HEAD` exists (`git rev-parse --verify MERGE_HEAD`,
   catch failure → false)
2. if it exists, runs `git merge --abort` (propagating a real abort
   failure exactly as today — the existing `MergeError` wording per call
   site is unchanged)
3. if it does not exist, is a no-op

Each of the 4 call sites replaces its own bare `git(repoRoot, ['merge',
'--abort'])` + try/catch with a call to this helper, keeping each site's
own existing `MergeError` message and returned outcome unchanged for
every case that already has coverage today. This is additive
defense-in-depth on top of `isAlreadyMerged`'s existing pre-check
(`tsk-3yl`, `merge.mjs:701`) — that pre-check stays exactly as is.

**Alternative rejected:** guarding only the 2 empirically-reachable sites
(verify-fail, commit-fail) and leaving conflict-catch/fgos-write-rejected
bare. Rejected per D2 (locked) — uniform guarding is more robust against
future code changes that could make those sites reachable too, and the
helper makes the 4-site version no more code than a 2-site inline version.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` →
1 provider (`gitnexus`), status `present` → posture is **full**
(`CLAUDE.md`'s three-way gate). Per that gate, before editing
`mergeRunnerItemLocked` at `fgos-coding-implement` time: run
`impact({target: "mergeRunnerItemLocked", direction: "upstream"})` and
report blast radius; run `detect_changes()` before committing.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `abortMergeIfPossible` helper correctness | medium | unit-level: called with MERGE_HEAD present aborts and returns; called with MERGE_HEAD absent is a silent no-op; an abort failure still throws the same `MergeError` shape as today |
| 4 call sites still return their existing outcome/message on every already-covered case | medium | full existing `test/runner/merge.test.mjs` suite passes unchanged (no test rewritten, only the two currently-uncovered no-op-abort cases get NEW tests) |
| The actual tsk-2j9 crash (no-op merge → verify-fail or commit-fail → abort with no MERGE_HEAD) | high (this is the item's whole point) | new regression test(s): simulate a genuine `git merge --no-commit --no-ff` no-op landing (branch already ancestor of HEAD at merge-attempt time, e.g. via direct git setup bypassing `isAlreadyMerged`'s pre-check window) with (a) verify failing → assert outcome `verify-fail`, no throw, no crash; (b) verify passing but nothing staged so `git commit --no-edit` fails → assert the existing commit-fail `MergeError`, no secondary "no merge to abort" crash |
| Blast radius on `mergeRunnerItemLocked`'s callers | to confirm at execute-time | `impact()` per the impact-analysis posture above (full) |

## Files touched

- `src/runner/merge.mjs` — add `abortMergeIfPossible` helper; replace the
  4 call sites in `mergeRunnerItemLocked`.
- `test/runner/merge.test.mjs` — add the 2 new regression tests from the
  risk map's third row; existing tests must still pass unmodified.

## Order

Single file pair, no dependency ordering needed — `fgos graph --json`'s
`criticalPath`/`topUnblock` don't surface any ordering constraint specific
to `tsk-2j9` itself (it sits in `topUnblock` at `unblocks: 2,
newlyUnblocks: 3` — `tsk-18a` is its known downstream dependent, per the
research report's dependency table, not a same-item ordering concern).

1. Write the 2 new regression tests first (red — they should fail against
   current code, proving the gap is real before touching `merge.mjs`).
2. Add `abortMergeIfPossible` and wire the 4 call sites.
3. Run the full `test/runner/merge.test.mjs` suite — all green, including
   the 2 new tests.

## Split

No split. One honest piece: a helper + 4 call-site edits + 2 regression
tests, all in the same 2 files. Proceeds as itself, no child items.

## Assumptions

- `git rev-parse --verify MERGE_HEAD` is the correct existence check
  (matches the empirical test in `CONTEXT.md`'s scout evidence: it
  fails with `fatal: Needed a single revision` exactly when there is
  nothing to abort). Not asked as a question — a pure implementation
  detail, not material to scope/behavior/acceptance criteria.
- The helper's placement (module-level function in `merge.mjs`, not a
  new file) follows the file's existing pattern of colocated small
  helpers (`isAlreadyMerged`, `splitConflictSegments`,
  `classifyDecisionIndexCollision` are all in the same file). Not asked —
  implementation detail.

## Verify

`npm test` (full suite, per `AGENTS.md`'s DoD question 5) — the item's own
`verify` field is currently `"chưa xác định — P15 bổ sung"` (undetermined);
this plan proposes `npm test -- test/runner/merge.test.mjs` as the
item-scoped verify command for `fgos-coding-implement`'s narrowest-useful-test
step, broadened to full `npm test` before `fgos return` per the repo's own
quality-gate convention.
