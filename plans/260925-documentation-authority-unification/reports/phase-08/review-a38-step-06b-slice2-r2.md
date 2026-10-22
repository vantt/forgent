# Review round 2: documentation-cutover lease, slice 2: caller-checkout admission (820385775..a5d09c37f)

Verdict: **rework** (one new High, reproduced on the production functions and end to end through a Workflow).

All six round-1 findings are closed on the production path. The fix brings in a new hole, though. The "declared caller checkout" is trusted without checking that it belongs to the repository being gated. Naming **any checkout of a different Git repository** makes a non-holder look admitted, with no token involved. Both Land doors then publish frozen-scope docs onto main while the lease is held.

Method:

- Read-only on the worktree. The worktree was at 83a331410 during this review (a Lead baseline), not a5d09c37f. Every result below is from `git archive a5d09c37f` extracted to `scratchpad/6b2-r2/tree`.
- The archive gets the worktree's staged addon. Its Rust source digest is identical (`72acce0e…`), staged by `stage.mjs`, with env in `env.sh`.
- Repros: `foreign.test.mjs`, `wf-foreign.test.mjs`. Logs: `out-*.log`, `staged-*.log`, `lead-*.log`.

## Prior findings

| ID | Status | Evidence (a5d09c37f, staged env) |
| --- | --- | --- |
| H1 linked holder cannot land | **closed** | `landRunnerItem(..., {callerCheckout})`. Approve (both sites), sync-root and promote get `cwd: process.cwd()` from the CLI, separate from `repoRoot`. merge-land 18/18 and promote-engine 10/10 pass. Holder test now acquires in a linked worktree. |
| H2 `mergeWorkflowBranch` ungated | **closed** for non-holders who name a checkout of this repository (but see N1) | Paged `renames:false` merge-base diff, gated before ancestry, no-op check and Land. Integrate passes the recorded origin. units-runner 25/25. |
| H3 bind cwd fallback / doctor red | **closed** | Lease import and gate removed from `bind()`. Doctor and dry-bind proof in bind.test 78/78. |
| H4 holder runs fail midway; side effects before refusal | **closed** | `documentationAdmission` is threaded through Workflow → runUnit, and replay no longer re-checks. resume, answer and both detached forms gate before advance, ledger and spawn. Byte, ref and worktree snapshot test passes (case-verbs 7/7). Writing-unit replay from main cwd passes (run-case-admission 15/15). |
| M1 cost | **closed** | One `pathsAtRevision` sidecar read per operation, observed by spy in two tests. No per-attempt reads. |
| L1 stale comment | **closed** | Comment now matches the "roots error stops before sweep" behaviour. |

Regression check: run.test 81/1, architecture 29/0, case-admission-port 12/0, setup/checks 103/7.

- The single run.test failure ("commit-only resume … work-missing") timed out waiting for `.started` at load average 5.9. It passed twice on rerun, so it is a load flake.
- The 7 setup/checks failures are the archive-only shell-integration cases the Doer already disclosed.

## New findings

### N1 (High, reproduced): a foreign checkout as "caller" admits a non-holder at every gate

- **Cause.**
  - `leaseAdmission` resolves authority from `checkoutFacts(ctx.worktreePath ?? ctx.repoRoot)` (`documentation-cutover-lease.mjs:229-231`). With `worktreePath` set, it reads the **sidecar from the caller checkout's own repository**, and `repoRoot` is ignored.
  - Before this slice, `worktreePath` was always a checkout of the gated repository. Now all four gates pass a caller-supplied path through with no same-repository check: `admitDocumentationExecution` (run.mjs:142), `landRunnerItem` (merge.mjs:1144), `mergeWorkflowBranch` (runner.mjs:615), and Workflow origin via `admitRecordedWorkflow`.
- **Repro** (`foreign.test.mjs`). Lease held by a linked holder of `repo`. `foreign` is an unrelated `git init` repository with no token.
  - `leaseAdmission({repoRoot: repo, worktreePath: foreign, paths: ['docs/new.md']})` returns `{"allowed":true}`. Main as caller is still refused (control).
  - `landRunnerItem(repo, item, {branch:'scoped', callerCheckout: foreign})` returns `merged`, and `main:docs/new.md = "frozen-scope edit"`.
  - `mergeWorkflowBranch({repoRoot: repo, sourceBranch:'scoped', targetBranch:'main', callerCheckout: foreign})` returns `merged:true`, and the docs are on main.
- **End-to-end** (`wf-foreign.test.mjs`).
  - `startWorkflow({repoRoot: main, cwd: foreign})` is the same as `fgos workflow start … --dir <main>` run from another project. It is admitted and records `callerCheckout = foreign`.
  - A later `answerWorkflow` from **main** then resumes it, runs the real integrate step, and lands `docs/delivery.md` on main (`completed`).
- **CLI reachability (from source).**
  - `fgos approve|sync-root <id> --dir <main>/.fgos --trust-dir` from another project's checkout: `repoRoot = dirname(dir)`, caller = that cwd.
  - `fgos run … --dir <main>` from another repository: caller = cwd, so a read-only Unit runs while frozen.
  - The lease's trust model is "accident prevention". Cross-project agent sessions with `--dir`/`--trust-dir` are exactly that kind of accident, and no token is involved, so this goes past the accepted "can read the token" boundary (L12-109.1, L12-110).
- **Related (same root, lower impact).** `admitDocumentationExecution` turns `not-a-repository` **for the caller path** into `allowed`, even when `repoRoot` is a repository. A read-only `fgos run --dir <main>` from a non-Git directory, or a read-only Workflow start, is therefore admitted while frozen. Writes are still refused by `assertRepositoryForWrites`.
- **Fix (one place).**
  - Before the token check, resolve the caller's `trustedMainRoot` and require it to equal `repoRoot`'s main checkout (realpath). Otherwise refuse, for example `documentation-cutover-lease-foreign-caller`, or evaluate as non-holder by passing `worktreePath: repoRoot`.
  - Keep the `not-a-repository` → allowed exception only when `repoRoot` itself is not a repository.
  - The natural owner is `leaseAdmission`: read the sidecar from `repoRoot`'s main, and the token only from a checkout registered to that repository. The lease module is outside this slice's write list, so the Lead routes it (Q1). The alternative is one shared helper in the slice that all four call sites use, not four copies.
- **Proofs to add, each at its owning layer.**
  - Foreign repository and non-Git caller are refused, for runner Land and Workflow Land.
  - A Workflow started from a foreign cwd is refused at start, before the ledger.

### N2 (Low, code-traced, not reproduced): composite execute paths still have side effects before refusal

- `fanout-batch.mjs:105-113` runs `fgos pick` (claim plus worktree) before `runUnit` refuses.
- `work-dispatch.mjs` and `operation-choice.mjs` gate on the claim worktree. That worktree never holds the token, so the holder's Work-item runs are always refused.
- Both behaviours predate this round (round 1 had the same gate in `runUnit`). The brief named only the run/Workflow/Land doors. Recorded for the Lead, not a rework item.

### N3 (Low): legacy pre-origin runs can record a later caller as origin

- `advanceWorkflowRun` opens a legacy case with the **current** caller's `worktreePath` (runner.mjs:97). This happens only after `admitRecordedWorkflow` admitted main, so nothing gets past the lease while it is held.
- If such a run is resumed while no lease is held, its recorded origin becomes whatever checkout that resumer named, and that origin then decides admission under a later lease. The Doer's "no retroactive upgrade" claim holds only while a lease is held.

## The 5 tests failing in the Lead's environment

- **Cause confirmed.** It is not the 5 new tests specifically.
  - With `FGOS_HOST_BIN` pointing at an activated release, `loadNativeAddon` accepts that release only if its payload root equals this checkout (`src/native/door.mjs:30-35`). Otherwise it falls back to `native-addon.json` in the checkout, which is absent, so it throws `git-addon-not-shipped`.
  - **Every** in-process native test in `units-runner`, `case-verbs` and `promote-engine` fails the same way. The Lead's own logs show it: 37 failures at 83a331410 and 42 at a5d09c37f, including all pre-existing promote-engine tests. The new tests add exactly 5 more.
  - Those three files rely on the launcher (`scripts/run-tests.mjs` → `ensureGitAddon`). The Doer substituted a `--import` preload that calls `ensureGitAddon()`, which is equivalent to the launcher.
  - `merge-land` (via `test/git/land-fixture.mjs`) and `run-case-admission` (via `ensureScriptAddon()`) stage the addon themselves, which is why they pass for the Lead.
- **With a staged addon**, all 6 touched files are green: promote-engine 10/0, merge-land 18/0, run-case-admission 15/0, bind 78/0, case-verbs 7/0, units-runner 25/0.
- **What the tests must do.** If single-file runs are the accepted proof, the three files should call the existing helper once at module scope, as run-case-admission does:

  ```js
  import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
  ensureScriptAddon();
  ```

  - This fixes their pre-existing tests too, so it is a file-level fix, not a defect of the new tests. No new helper is needed.
  - Otherwise, accept launcher-equivalent staging as the verification environment.

## Lead questions

1. **N1 placement.** The real fix is in `leaseAdmission` (authority from `repoRoot`, token only from a checkout registered to the same repository), but the lease module is owned by another turn. Should that turn take it, or should this slice add one shared same-repository guard used by all four call sites?
2. **Read-only from outside Git.** Should a read-only run or Workflow from a non-Git cwd with `--dir <main>` stay admitted while frozen (current behaviour), or be refused like any non-holder?
3. **Single-file proofs.** Should `ensureScriptAddon()` be added to units-runner, case-verbs and promote-engine so single-file runs are the accepted proof? Or is launcher-equivalent staging the accepted environment?

Status: DONE
Summary: H1–H4, M1 and L1 are closed on the production path and the touched tests pass with a staged addon. A new reproduced High (N1) remains: a checkout of any other repository passed as caller is admitted with no token, so frozen docs land on main through runner Land and Workflow Land, so the verdict is rework. The Lead's 5 failures are the files' existing dependence on launcher addon staging (every in-process native test in those files fails the same way); the fix is a module-level `ensureScriptAddon()`.
