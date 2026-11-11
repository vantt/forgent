# HARDEN T9 P05 - custody door and classified verify door

Lead: phase lead on fg-server2. Branch `harden/t9-p05-custody-door`, based on origin/main `25d9c4f82`. Owner decision 85 approved the phase; the phase row now says approved.

## What landed

- **One Execution file, `src/runner/execution/custody-door.mjs`** (new, class `infra` in the architecture manifest), four custody exports and the verify door:
  - `runUnderCustody(fgosDir, worktree, body)`: admit as successor under the `unit-custody` scope, run the body, record the hand-off on what it returns, release in `finally`. A body that throws records no hand-off.
  - `custodyHeld(fgosDir, worktree)`, `worktreeKey(worktree)`, `worktreeAdminScope()` (the `workflow-worktree` scope string moved verbatim).
  - `runVerify({ command, cwd, timeoutMs, custody })` answers `{ verdict: 'pass'|'findings' }` or `{ infrastructure: 'timeout'|'not-run' }`, plus `status`, `how`, `tail`, `durationMs`, one `outputDigest`. Exit 0 is pass, any other exit is findings; timeout, kill by signal, spawn failure, or a lease that cannot be proven alone again are infrastructure. Never rejects.
  - `outcomeOfVerify` (infrastructure maps to `execution-failure`) and `answerOfVerify` (the answer a loop's `verify` hook reads).
- **`verifyUnit`** (`run.mjs`) and **`runCaseGate`** (`case-gate.mjs`) both call `runVerify`. The gate's own exit-code classifier and its own sha256 are gone; the gate keeps admission and settle. `loops/verify.mjs` gains `verifySeatResult`, which replaces the two copies of the verdict-to-seat-result mapping in `solo.mjs` and `reviewed.mjs`.
- **Workflow no longer names the custody mechanism.** `case-gate`, `case-close`, `case-runtime`, `case-bindings` and `unit-handoff` call the door. `rg -n "cwd-lock|unit-custody|workflow-worktree" src/workflow` prints nothing (it matched 6 lines before). `case-lock.mjs` and its `advance` scope are untouched.
- Behaviour change (owner decision 83): a verify that times out, is killed or cannot start settles `execution-failure` (exit code 11, was 14 `findings`); the verify seat carries `infrastructure` and `error` (`timed out after Nms` / `could not run`). `resume` runs it again; verify results are never read back from disk history, so nothing blocks the rerun. A non-zero exit stays `findings`. The case gate records `execution-failure` the same way. CHANGELOG line added. The workflow spec (RUL-WF-32, exit codes of the gate) and the runner Unit spec (the "One bounded runner" bullet) say the same.

## Deviations from the phase text

- The door is a new file in Execution, not a function in `cwd-lock.mjs`. Reason: the phase's own done-check requires `src/workflow` to stop importing `cwd-lock`, so Workflow needs an Execution export to call. The mechanism (`admitSuccessor`, `recordCustodyHandoff`, `dispatchCwdHolder`) stays in `src/run-supervisor/cwd-lock.mjs`, untouched. The file is not named `worktree-*`: `run-gate.test.mjs` forbids `run.mjs` from importing a path containing `worktree`.
- `case-gate.mjs` still imports `verifyCommandOf` (reads the declared command so the gate can refuse by name before it touches the case). Command resolution is one function, not a classifier; the phase's "rg verifyCommandOf src/workflow prints nothing" is therefore not met. `runCommand` is gone from `src/workflow`.
- The door catches a rejected `runCommand` (lease not provable alone after the run) and answers `not-run`. Before, `verifyUnit` let it propagate while the gate swallowed it into `findings`. Both now settle `execution-failure` with the message in `error`; the run ends either way, but a Unit verify no longer throws out of `runUnit` for that case. Judged the same class and the intent of decision 83; flagging it.

## Tests

- New owning proof `test/runner/execution/custody-door.test.mjs` (8 cases): verify door classification (pass, findings, timeout, not-run); custody held inside and free after, throw releases, a second holder is refused, worktree key is one for every spelling. Not covered: a pin on the two scope strings (they are moved verbatim; the lock scope names are not observable through the public lock paths).
- `run-verify-pin.test.mjs`: the verify-timeout case changed its expected value from `findings` to `execution-failure` (owner 83, behaviour changed); new case: a killed verify settles `execution-failure` with `infrastructure: 'not-run'`, no second producer launch, and a resume with a passing verify settles `pass`. `case-verbs.test.mjs`: new gate case for a killed command (`execution-failure`, status null, milestone unreached). The gate keeps one wiring case; the Unit verify keeps its wiring cases. No test retired. I did not build a recording double for the gate path: it would need a test-only seam in production code; the observable order (held while the command runs, free before the settle) is what the door's own test and the gate cases prove.
- Gate: focused set (workflow, execution, loops, patterns, goal-check, loop, case-doors CLI, architecture, doc-health, decision-citation drift, work-path admission, e2e runner-loop) green except the architecture guard that caught the file name above (fixed by rename, rerun green: 214 tests). Full `npm test`: 8694 tests, 8661 pass, 2 fail: the known V7n addendum, and `claim-port.test.mjs` (load flake, hung 604s; rerun alone green). One-door scan: 0 undeclared; `uncalled-wrapper` sites 11 to 10, census regenerated with `--write-census`. No Rust or Git file touched, so no cargo gates and no OPC review needed. Smoke on a built host not run: the real-process cases above (kill, timeout through the whole `runUnit` and `runCaseGate`) stand in for it.

## Authority

- Verify classification: was in `verifyUnit` and `runCaseGate`, now in `runVerify` (Execution). Done.
- Custody: Workflow no longer takes or reads the lease; Execution owns it behind four functions. `case-lock.mjs` keeps its own `advance` lock (a correct downward dependency, T1 holder-lock).
- Not moved, belongs lower: `loops/verify.mjs` (`verifyCommandOf`) resolves a command from a Unit and config, Execution; fine where it is. P11 (import rule) is the follow-up that forbids Workflow from importing `cwd-lock` custody parts.
- `exec-under-hot-lock` check: the door adds no spawn and no lock beyond what the gate and `verifyUnit` already took; the gate still admits custody before the case admission, so a refused custody leaves no reservation.

## Lessons

- A blanket `sed` rename hit a lock scope string (`worktree-custody` inside `src/runner/worktree.mjs`) that shared the old file name; caught by `git diff --stat`. Rename with a path-anchored pattern, never the bare word.
- I renamed files while a focused run was still going; its result was unusable for the renamed parts. Wait for the run's done marker before touching the tree.
- `run-tests.mjs` rejects directories (ERR_UNSUPPORTED_DIR_IMPORT); expand globs to files.
- The census file must be regenerated after every source edit and again after a rebase (a first regeneration ran before the scan finished compiling and wrote nothing).
- The first run in a fresh Cargo target costs about two minutes of compile before any test starts.

Status: DONE_WITH_CONCERNS
