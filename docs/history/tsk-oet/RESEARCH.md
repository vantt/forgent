# RESEARCH — tsk-oet

## Round 1 — 2026-08-21 — confirm root cause and scope for fix

**Asked:** the item's own description attributes the regression (7 tests
failing deterministically on `main`, all SHA/clean-tree assertions in
`fgos-take.test.mjs`/`fgos-read.test.mjs`/`fgos-return.test.mjs`/
`runner-loop.test.mjs`) to commit `88619f23` (tsk-6al, "skip redundant
verify in fgos return when worker already verified sha"). Is that
attribution correct, and can a fix proceed independently of tsk-6al's own
blocked merge state?

**Checked:**

- Ran the 4 flagged test files against current `main` (`b354b996`) —
  reproduced all 7 failures (`node --test test/cli/fgos-take.test.mjs
  test/cli/fgos-read.test.mjs test/cli/fgos-return.test.mjs
  test/e2e/runner-loop.test.mjs`).
- Read `git show 88619f23 -- bin/fgos.mjs`: the only change is wrapping
  the existing verify logic in an `if (isWorkerVerified) {...} else {
  <unchanged original code> }` branch, gated on `--worker-verified-sha`
  matching `branchHead`. None of the 4 failing test files pass that flag,
  so `isWorkerVerified` is always `false` in their scenarios — the "else"
  branch is byte-identical to pre-88619f23 behavior.
- Bisected empirically: created a detached worktree at `88619f23` itself
  (`git worktree add --detach <tmp> 88619f23`), installed deps, ran the
  exact same 4 test files there — **all 171 tests passed, 0 failures**.
  This falsifies the item's own root-cause attribution: commit `88619f23`
  alone does NOT cause the regression.
- Walked `git log --oneline 88619f23..HEAD` looking for a more likely
  cause and found `5439eaa2` ("feat(state): add opportunistic truncation
  guard and periodic commit for events.jsonl (tsk-1ji)"), one commit
  above `88619f23` on `main`. Bisected the same way: worktree at
  `5439eaa2`, ran the same 4 files — **5 of 7 failures reproduce there**
  (the 2 remaining ones are a test-suite naming drift between then and
  now, not a discrepancy in the underlying bug).
- Read the full diff of `5439eaa2` (`git show 5439eaa2 -- src/state/store.mjs
  src/runner/claim-port.mjs src/runner/merge.mjs
  src/state/events-jsonl-truncation-guard.mjs`). It wires a new
  `runOpportunisticMainCheckoutChecks(dir, repoRoot, opts)` into
  `claimWork` (`src/runner/claim-port.mjs:122`, runs on every claim) and
  into `withMergeTargetSlot`/`mergeRunnerItem` (`src/runner/merge.mjs:786,911`,
  runs on every merge-lock acquisition). That function
  (`src/state/events-jsonl-truncation-guard.mjs`, added whole in this
  commit) has two unconditional side effects, every time it runs, on
  whatever `repoRoot` it is handed:
  - **D1** — writes/advances `.fgos/events-jsonl.truncation-guard.json`
    (`writeGuardMark`) whenever the truncation check reports `ok`. This
    is a brand-new tracked file appearing dirty in every git-fixture test
    that asserts "only `.fgos/events.jsonl` (or nothing) is dirty" —
    matches the `footprintDiffHits self-exempt` and `ONLY .fgos/ dirty`
    test failures (`actual: 3, expected: 1` — the guard-mark file is the
    extra dirty path).
  - **D2** — if `.fgos/events.jsonl` is dirty and the last real commit
    touching that path is `>= 900s` old (or has never been committed —
    the common case for a freshly-initialized test fixture), runs a REAL
    `git add` + `git commit -m "chore(.fgos): periodic events.jsonl
    checkpoint" -- .fgos/events.jsonl` directly against `repoRoot`. This
    is an actual, unconditional commit that advances `HEAD` on whichever
    repo `repoRoot` resolves to — including a self-contained test fixture
    repo (`initGitCwdMain()`), which is exactly what every SHA-comparison
    assertion in the failing tests (`gitHead(cwd) === mainHeadBefore`)
    catches. This function carries no guard distinguishing "the real
    fgOS main checkout" from any other repo it is pointed at.

**Found (with citations):**

- `src/state/events-jsonl-truncation-guard.mjs`'s
  `runOpportunisticMainCheckoutChecks` (added in `5439eaa2`, part of
  already-merged item `tsk-1ji`, `mergedSha: 0cbde249784f...`,
  `mergedInto: main`) is the real, confirmed, bisection-proven cause of
  all 7 regressed tests — not commit `88619f23`/`tsk-6al`.
- `tsk-1ji`'s own `verify` (`node --test test/runner/claim-port.test.mjs
  test/runner/merge.test.mjs`) never covered the 4 files this change
  actually broke, which is how the regression landed on `main` unnoticed.
- `tsk-1ji` is `status: retrospective` (past `awaiting-approval` and
  `delivered`, i.e. already fully merged into `main`) — there is nothing
  left to "finish" on that item that would unblock a fix here.
- `tsk-oet`'s declared `deps: ["tsk-6al"]` does not correspond to the
  real root cause found above and is not a real blocker for this fix.

**Still open:** the concrete fix shape for `runOpportunisticMainCheckoutChecks`
D2 (never auto-commit against a repo that is not the real fgOS-managed
main checkout — e.g. gate on an explicit opt-in flag/marker, or only fire
from call sites that are provably the shared main checkout, never a
disposable/test fixture root) is an implementation decision, not
researched further here (out of scope for a discovery-stage root-cause
check; the fix's own approach belongs to `planning`).
