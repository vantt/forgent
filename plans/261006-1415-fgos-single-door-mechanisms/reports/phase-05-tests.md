# Phase 05 root-file guard verification

## Result

Final post-review verification passed: **495 tests across 17 files**, with **0 failures, skips, cancellations, or todos**, plus **3 independently executed actual-git smoke scenarios**. This run followed the parent's comment-decoy fix and two added behavioral cases. No full npm suite, builds, linters, or formatters were run.

| Run | Files / scenarios | Passed | Failed | Wall elapsed | Exit |
|---|---:|---:|---:|---:|---:|
| New root-file guard focused file | 1 file / 9 tests | 9 | 0 | 1.024 s | 0 |
| Existing consumer group | 16 files / 486 tests | 486 | 0 | 14.698 s | 0 |
| Independent actual-git commit smoke | 3 scenarios | 3 | 0 | 0.234 s | 0 |

Final supervised execution wall time: **15.956 seconds**. Tests were run focused first, then the consumer group, then the independent smoke. Every run had a 900-second deadline; no deadline was reached.

The earlier pre-review green run remains historical evidence, **not the final acceptance result**: 7 focused tests + 486 consumer tests = 493 passing tests, plus 3 passing smoke scenarios, in 15.807 seconds. Its original logs are retained separately below.

## Initial red baseline

The parent-provided pre-implementation result was **7 tests, 4 passing, 3 failing**: actual new-root addition refusal, linked `fgw/*` refusal, and simultaneous allowlist edit/root addition refusal were unprotected. That historical result is supplied execution context, not a rerun or independently recreated observation by this worker. The fresh focused result above closes all three failures without weakening the assertions.

## Focused behavior covered

`test/e2e/root-file-guard-hook.test.mjs` passed all nine real-commit tests:

1. Newly staged root additions, copies, and renames refused; nested files accepted.
2. Existing non-allowlisted root modifications and deletions allowed.
3. Allowlisted new root file accepted.
4. Unrelated repository sharing an absolute hook not root guarded.
5. Linked `fgw/*` branch guarded before hook-home early exit.
6. Simultaneous allowlist change/root addition refused; separately landed allowlist change permits its later addition.
7. Merge commits bypass only root guarding while still refusing staged `.fgos/cache/state.json` deletion. Restoring that file then permits the merge, and its two-parent result is asserted.
8. Comment decoys cannot hide a real allowlist edit accompanying an allowed root addition.
9. An unrelated hook edit outside the allowlist may accompany an already allowlisted root addition.

**The `.fgos` deletion guard is retained in the merge case**, evidenced by focused test 7 passing, not merely a source-pattern assertion.

## Existing consumer group

Executed with `node --test`:

- `test/e2e/main-checkout-lock-hook.test.mjs`
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`
- `test/e2e/resync-worktree-bare-invocation.test.mjs`
- `test/runner/merge.test.mjs`
- `test/runner/claim-port.test.mjs`
- `test/runner/main-checkout-lock.test.mjs`
- `test/cli/fgos-claim-2.test.mjs`
- `test/setup/uninstall-wiring.test.mjs`
- `test/setup/checks.test.mjs`
- `test/scripts/install-git-hooks.test.mjs`
- `test/setup/checks-doctor-config.test.mjs`
- `test/setup/checks-setup-config.test.mjs`
- `test/setup/checks-setup-hookspath.test.mjs`
- `test/setup/dir-resolution.test.mjs`
- `test/setup/uninstall-wiring-2.test.mjs`
- `test/setup/uninstall-wiring-3.test.mjs`

A scoped search of `test/` for `.githooks/pre-commit`, `core.hooksPath`, and `install-git-hooks` found no additional direct real-hook or wiring consumer outside these files and the new focused file. No additional consumer test was necessary and no fixture edits were made.

## Independent actual-git smoke

The smoke used a fresh owned `/tmp/fgos-phase05-git-smoke-*` repository with the actual hook and its real dependency files copied from this execution worktree. It tracked the source marker `apps/fgos/Cargo.toml`, committed its baseline before enabling hooks, and configured one absolute `core.hooksPath` shared by main and the linked worktree. It did not invoke or import the e2e test fixture.

Observed and asserted:

- Main source-marker checkout: `git commit` of `scratch.cjs` exited 1 with the root-guard refusal naming the file; HEAD was unchanged.
- Nested `src/smoke/nested.mjs`: actual `git commit` exited 0 and `git show HEAD:src/smoke/nested.mjs` contained the expected content.
- Linked `fgw/phase05-smoke`: `git commit` of `worker-scratch.cjs` exited 1 with the root-guard refusal naming the file; linked HEAD was unchanged.

These are temporary fixture commits only. No commit, activation, source edit, inventory deletion, or historical-scratch deletion occurred in the execution worktree or main checkout.

## Durable evidence and cleanup

Final post-review evidence:

- [Focused stream log](phase-05-tests-focused-post-review.log)
- [Consumer stream log](phase-05-tests-consumers-post-review.log)
- [Independent git smoke stream log](phase-05-tests-actual-git-smoke-post-review.log)

Preserved pre-review evidence (493 passing tests; superseded for final acceptance):

- [Earlier focused stream log](phase-05-tests-focused.log)
- [Earlier consumer stream log](phase-05-tests-consumers.log)
- [Earlier independent git smoke stream log](phase-05-tests-actual-git-smoke.log)

The supervisor opened each durable log before launching the process and streamed combined stdout/stderr to it as output arrived, rather than collecting output only after timeout. Each child ran in an owned process group; the supervisor attempted group SIGTERM during finalization (an already-exited group is harmless), with SIGKILL escalation available after a timeout. All three final child processes and all three earlier child processes exited normally; no timeout or escalation occurred.

The independent smoke's `finally` removed only its owned fixture and logged `removed: true`: `/tmp/fgos-phase05-git-smoke-6d23pE` for the final post-review run and `/tmp/fgos-phase05-git-smoke-wTwMjg` for the earlier run. The focused fixture registers per-test teardown for its owned temporary repositories. No persistent smoke script or scaffold was created. Durable logs and this report are intentionally retained.

`CLAUDE_CODE_SESSION_ID` and `FGOS_SESSION_ID` were unset in all verification process environments. The thirty historical root scratch entries and D2 remain outside this worker's changes and await the parent's G1 confirmation/tag gate.
