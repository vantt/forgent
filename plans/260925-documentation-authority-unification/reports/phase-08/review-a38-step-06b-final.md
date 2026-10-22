# Review a38 step 6b final fix (0ea4e6570..2fbf9f018)

Verdict: **ok**

## Method

- The worktree HEAD was verified at `2fbf9f018`. Results come from `git archive 2fbf9f018` extracted to `6b-final/tree`.
- The addon is staged from the worktree's staged addon. Its Rust source digest matches (`72acce0e…`). Env is in `env.sh`.
- Nothing was written to the worktree.
- Repros: `foreign.test.mjs` (log `out-foreign.log`) and `wf-foreign.test.mjs` (log `out-wf-foreign.log`). Both exit 0.
- Owning test files, run with the mandated command against the archive tree:
  - `documentation-cutover-lease` 14/0
  - `documentation-cutover-lease-hooks` (e2e) 31/0
  - `merge-land` 19/0
  - Logs: `run-*.log`.

## Findings

| ID | Status | Evidence |
|---|---|---|
| N1 High: foreign caller admitted | **closed** | While the lease is held, a foreign repo or a non-Git dir as caller is refused at `leaseAdmission` (with or without paths), `admitDocumentationExecution`, `runUnit` (`callerCheckout` and `cwd` forms), `landRunnerItem` and `mergeWorkflowBranch`. main did not move. Workflow start from a foreign checkout is refused with `documentation-cutover-lease`. Workflow start from a non-Git dir is refused with "must run inside a git repository". A foreign origin recorded before the freeze is refused when the holder later answers, so there is no upgrade. The real holder in a linked worktree (root and `docs/` subdir) is admitted, and both Lands merge. A non-holder linked worktree and main are still refused. With the lease free, foreign and non-Git callers and a non-repo `repoRoot` are still admitted. |
| L-1 stray main token | **closed as ruled** | Doctor fails with "possible interrupted release". Acquire throws `stray-main-token`. The token is kept. Real holder release still works while the stray token exists, and doctor keeps flagging the token after release. |
| L-3 held lease, hook file missing | **closed** | Doctor on a held lease with no `.githooks/reference-transaction` fails: "lease is held but its reference-transaction hook is not wired". A free lease with no hook is still not applicable. |
| L-4 malformed receipt after a landed commit | **closed** | Owning test passes: native `ScopedCommit` forwards the commit and only the receipt is corrupted. The token is preserved, the holder is admitted and the tree is clean. `onFailure` deletes only when main does not show this token as held. |
| L-2, N2, N3 | documented limits | Recorded in L12-111 as ruled. Not re-probed. |
| Test staging | **closed** | Not re-probed separately. The Lead's 406/406 stands. |
| Regressions | none | A raw `update-ref` of main while held is refused by the hook, and main is unmoved. The two-process acquire test (one winner, 20 trials) passes in the lease file. Census digests for `bin/fgos.mjs`, the lease module and `run.mjs` match the tree; the `bin/fgos.mjs` digest was stale before and is now corrected. |

## New observations (Low, no rework)

- **O1. A stray main token makes main a holder until it is removed.** `leaseAdmission({repoRoot: main, worktreePath: main})` returns `{allowed: true, holder: true}` while the lease is held and the token copy sits in main. This is inherent to lending the identical token; the ruling asks only for doctor and acquire to report it. Doctor flags it, so the operator signal exists. If you want it closed, refuse admission when `hasStrayMainToken` is true. That is one line, but it is a policy change.
- **O2. Answering a gate does not identify the answerer.** `answerWorkflow` on a holder-origin run, called with `cwd`/`worktree` set to a foreign checkout, is admitted and integrates frozen docs. This follows the ruled recorded-origin design (owner-answers L1851: a later caller cannot replace the origin): the run is the holder's, and answering is not a holder proof. Recorded so the docs turn states it explicitly.
- **O3. `leaseAdmission` falls back to `process.cwd()` when `ctx.repoRoot` is absent.** `runUnit` passes `mainRoot` from `options.cwd`, so production doors always supply it. This is noted only for future callers.

Status: DONE
Summary: Reran the N1 repros on 2fbf9f018. All four doors now refuse foreign and non-Git callers while the lease is held, and still admit the real holder in a linked worktree. L-1, L-3 and L-4 behave as ruled, raw main moves are still refused, and the one-winner acquire test passes. Verdict ok, with three Low observations.
