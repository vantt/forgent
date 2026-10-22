# Red-team (assumption destroyer): HARDEN T1 sub-plan

Target: `plans/261022-0851-harden-t1-holder-lock-identity-door/` (plan.md + phases 01-07). Frame: `plans/reports/council-261022-0245-harden-t1-arbitration.md`; owner decisions 9-13 are not contested here. Tree read: HEAD `44b43f23d`. `git diff --stat e94b1618d HEAD` touches only two Markdown files (a plan and a guide), so every source line the plan cites is the same on both commits.

## Findings

### 1. Phase 5 removes the state-root fallback, but `npm test` and every test child run without the pin
- **Severity:** Critical
- **Evidence:** `scripts/run-tests.mjs:148` (`buildTestEnv` deletes `FGOS_STATE_ROOT` from every `node --test` child); `scripts/lib/full-suite-queue.mjs:63` (`resolveLockRoot({ env })` in the `npm test` parent, which `package.json:31` starts as plain `node scripts/run-tests.mjs`); `src/holder-lock/state-root.mjs:33-37` (no pin → route today); `phase-05-doctor-merge-specs-checkout-channel.md` "Callers of `resolveStateRoot` (14 sites, Facts) are unchanged: every one runs under the host's pin; the test harness re-pins through the host (`scripts/run-tests.mjs:148`)".
- **What is wrong:** Line 148 does the opposite of re-pinning: it strips the pin. Test processes reach the root today only through the `state-root` route fallback that phase 5 deletes. After phase 5, `resolveStateRoot` and `resolveLockRoot` throw `state-root-unpinned` in:
  - the `npm test` parent, through the full-suite queue, before any test runs;
  - every in-process caller a test reaches: `src/git/inspect.mjs:29`, `src/runner/worktree.mjs:173`, `src/event-store/native.mjs:56,153,157`, `src/runner/lock-status.mjs:102`, `src/runner/dispatch/provider-capacity.mjs:392`, `src/runner/lock-fence.mjs:43`, `src/setup/git-checks.mjs:23` and others.

  The "14 sites" count is not in Facts and is wrong: there are 17 `resolveStateRoot(` call sites in `src`, plus 4 `resolveLockRoot(` callers in `src`/`scripts`. Decision 12's DoD gate (`npm test` green) fails at phase 5.
- **Suggested correction:** Keep owner decision 10 (the route goes). Phase 5 must give the harness its own pin source:
  - `buildTestEnv` sets `FGOS_STATE_ROOT` to a per-run scratch state root, which also isolates fixtures. Alternatively, `run-tests.mjs` resolves the root once through the activated host before it strips the inherited pin.
  - `full-suite-queue.mjs` reads that same pin.

  Recount the callers, and add `scripts/run-tests.mjs`, `scripts/lib/full-suite-queue.mjs` and `test/holder-lock/driver-unavailable.test.mjs` (which calls `resolveStateRoot`) to phase 5's Files.

### 2. Phase 2's `lockHolders`/`descriptionHolders` shape change misses one product caller and five test files
- **Severity:** High
- **Evidence:**
  - Product caller: `scripts/lib/full-suite-queue.mjs:39,71` (`holders.pids.join`).
  - Tests reading `.pids` from `lockHolders`: `test/runner/provider-capacity.test.mjs:463,473`; `test/holder-lock/run-borrowed-git.test.mjs:152,170` (`deepEqual(…, { kind: 'list', pids: [...] })`); `test/run-supervisor/direct-crash-matrix.test.mjs:290`.
  - Tests importing the deleted `descriptionHolders`: `test/setup/run-supervisor-checks.test.mjs:27,341`; `test/setup/holder-lock-checks.test.mjs:32,86,269`.
- **What is wrong:**
  - The list says "13 sites" but names 14, and misses `full-suite-queue.mjs`, which the full suite itself depends on.
  - `src/runner/lock-status.mjs` is listed as a `lockHolders` caller. It calls `descriptionHolders` (`:12,:24`), not `lockHolders`.
  - Plan-wide Risks call `run-borrowed-git.test.mjs` the wiring that "stays", but its two `deepEqual` assertions break on the new tuple shape.
  - `holder-lock-checks.test.mjs:86` is the `holdWithFlock` helper that four kept cases use. It is not in phase 2's test edits.
- **Suggested correction:** Add the script and the five test files to phase 2's Modify list. Fix the count. In the done-grep, replace the bare `rg lockHolders\(` with `rg -n "\.pids\b|descriptionHolders" src scripts test .githooks`, which must find nothing except the sweep result at `index.mjs:464`.

### 3. The close gates' `rfind(')')` grep is broken, and when fixed it finds Rust parsers no phase deletes
- **Severity:** High
- **Evidence:**
  - Done-when at `plan.md:110`; verification steps in phase 04 and phase 06.
  - Running `rg -n "rfind\(')'\)" packages/*/rust/src` gives `regex parse error: unopened group`.
  - A fixed-string search finds `packages/run-supervisor/rust/src/gate/unix.rs:646` and `packages/run-supervisor/rust/src/supervise/terminal.rs:269`, besides `facts.rs:433`, `flock.rs:624` and `proc_tree.rs:23`.
- **What is wrong:**
  - The gate command errors instead of matching.
  - Facts calls `proc_tree.rs` "the second `/proc/<pid>/stat` parser". There are at least five. Two of them are in run-supervisor, which no phase touches, so the gate "finds only facts.rs" can never pass.
  - Phase 6's rewrite of `docs/platform/process/spec.md:112` to "one reader remains (Observe)" would also be false. Rust `/proc` readers outside the process crate also exist in `packages/git/rust/src/{worktree.rs,wal.rs}`, `packages/terminal-control/rust/src/driver/herdr.rs`, `packages/holder-lock/rust/src/route.rs` and run-supervisor.
- **Suggested correction:** Use `rg -nF "rfind(')')"`. Scope the gate to the files T1 owns (`proc_tree.rs`, `flock.rs`), or record the run-supervisor parsers as an out-of-scope item (T4/T5) with their lines. Make the process spec sentence list the readers that actually remain.

### 4. R3's plan to pipe bwrap's stderr can stall or kill a contained gate on the success path
- **Severity:** High
- **Evidence:**
  - `packages/process/rust/src/containment/pgroup.rs:155-158`: `apply_stdio` maps a missing stderr to `Stdio::null`.
  - `packages/process/rust/src/containment/linux.rs:131-136`: stdio is applied, then the child is spawned.
  - Phase 04, R3: "gives `bwrap` a pipe for stderr when the spec has no stderr of its own".
  - Phase 04, Risks: "on success the write end is closed with the child's stderr mapping unchanged".
- **What is wrong:** The pipe becomes fd 2 of bwrap and of every process in the sandboxed gate tree at spawn time. After that, the parent cannot change the child's stderr mapping. Two outcomes follow:
  - If the parent keeps the read end unread, a gate that writes more than one pipe buffer (64 KiB) blocks forever.
  - If the parent drops the read end, the gate's writes get EPIPE or SIGPIPE.

  Today the same gate writes to `/dev/null` safely.
- **Suggested correction:** Do not touch fd 2. For the failure diagnostic, use one of these instead:
  - bwrap's own `--json-status-fd`, or a second CLOEXEC pipe that only bwrap writes to;
  - a bounded temp file that a reader thread drains to EOF, with stderr pointing at that file.

  Add a success-path case to `containment_bwrap.rs` that writes more than 64 KiB to stderr.

### 5. Deleting `state-lock-held.mjs` (phase 6) breaks unlisted tests, one of them in TEST's frozen region
- **Severity:** High
- **Evidence:**
  - `test/seat-binding/client.test.mjs:19,117,122` and `test/seat-binding/exec-budget.test.mjs:15` import `src/util/state-lock-held.mjs`.
  - `test/state/hot-lock-multiprocess.test.mjs:261` rewrites the `eab4d617b` baseline to import `noteLockHeld, noteLockReleased` from `src/util/state-lock-held.mjs`.
  - `plan.md` decision 11 and phase 06 Files.
- **What is wrong:**
  - Phase 6 runs `test/seat-binding/*.test.mjs` in its verification but does not list these two files to edit.
  - `:261` is inside `:249-298`, which owner decision 11 forbids T1 to touch. Once the module is deleted, the dynamic import of the rewritten baseline fails, so the fast-path test errors on main.
  - TEST's version (`cb60c7842`, `fix/test-timing-asserts`, not on main) drops the baseline rewrite. The plan does not declare phase 6 as blocked by that landing.
- **Suggested correction:** Add the two seat-binding tests to phase 6's Modify list. Make "TEST's H21 batch (`cb60c7842`) is on main" an explicit precondition of phase 6, in the Dependencies table under TEST.

### 6. Phase 3's `checkStopped` move and "nothing moves" test claim do not hold
- **Severity:** Medium
- **Evidence:**
  - `src/holder-lock/fences.mjs:483`: `checkStopped(... excludePids = ownPidChain() ...)`.
  - `fences.mjs:478`: uses `resolveHostBin`.
  - Phase 02 Files does not list `fences.mjs`, yet D-T1-5 deletes its `/proc` reader.
  - `test/holder-lock/fences-stop-check.test.mjs:217,230,126`.
  - `test/event-store/migrate-cutover-grant.test.mjs`: 146 lines; no `excludePids`, no `unreadable`, no "unlisted worktree".
- **What is wrong:**
  - The moved `checkStopped` needs `ownPidChain` as its default and the `resolveHostBin` import. Phase 3 moves neither.
  - Phase 2 claims the `fences.mjs` `/proc` reader goes, but does not modify the file.
  - The migrate test has no twin for three behaviours:
    - `:217`: a declared own pid is not counted;
    - `:230`: a worktree the caller does not list does not block;
    - the "unreadable" status that phase 3 says is already covered.
  - `:126` (`ownPidChain` climbs parents) gets no owner, and `selfChain` gets no Rust proof.
  - On macOS, `facts::relations()` is `None`. `selfChain` over it would drop the ppid that today's `ownPidChain` keeps (`fences.mjs:416-424`).
- **Suggested correction:** Phase 2 owns `fences.mjs`'s `ownPidChain` re-point (add it to Files). The moved `checkStopped` defaults to `selfChain()` through `process-identity.mjs`. Port `:217` and `:230` (about 20 lines) into `migrate-cutover-grant`, and give `selfChain` a Rust unit test that includes a non-Linux fallback.

### 7. The door's release and drain design misstates the failure mode and skips private Rust it depends on
- **Severity:** Medium
- **Evidence:**
  - `packages/holder-lock/rust/src/driver/flock.rs:367-369`: "Any live own lock on this inode proves the old EX description gone" → `Ok(true)`.
  - Phase 02 Risks: settle "spins to `stuck`".
  - `port.rs:238`: `fn proven_alone_at` is a private `Handle` method.
  - `flock.rs:332,410`: `pub(crate)`.
  - `port.rs:311`: `BorrowedHandle::from_acquired_description` is `pub unsafe fn` on `BorrowedHandle`, not `port::from_acquired_description`.
- **What is wrong:**
  - If Node's fd, or any other live own copy, is still open when `releaseFd` runs, `settle_release` returns `Released` at once. The failure is silent, not "stuck". The stated mitigation ("asserts release within the kill wait") cannot detect it.
  - The External is not a `Handle`, so "advancing the External's marks with `proven_alone_at` exactly as a Rust `Handle` does" needs that private logic pulled out into a free function. The plan does not say so.
  - The visibility changes are only implicit, in the new `port::*` wrappers.
- **Suggested correction:**
  - Rewrite the risk as a false `released`.
  - Assert in `releaseFd` that the External's dup is the process's last copy, or test it: release while a second own description is open must not report released.
  - Name the extraction of `proven_alone_at` into a `pub(crate) fn advance(since: &Mutex<…>, started)`, and list each `pub(crate)` → wrapper explicitly.

### 8. Phase 2's delete range in `holder-lock-checks.mjs` removes constants that kept code uses
- **Severity:** Medium
- **Evidence:** `src/setup/holder-lock-checks.mjs:36` (`BORROW_VECTORS_TIMEOUT_MS`, used `:310` by the kept `checkLockBorrowVectors`), `:44` (`MAX_LISTED`, used `:53-54` by `listed()`), `:37` (used `:478`); phase 02 Delete `holder-lock-checks.mjs:36-44`.
- **What is wrong:** "`:36-44` probe constants" is three probe constants (`:39`, `:42`, `:43`, plus the `:40` poll) mixed with three that remain in use. Taken literally, the delete breaks `lock-borrow-vectors` and every row message that uses `listed()`.
- **Suggested correction:** Delete only `:38-43`. Keep `:36` and `:44`. Keep `:37` until `windowsJobProblem` moves to the door.

### 9. Many cited lines are stale or wrong, despite the plan saying they were "re-read on e94b1618d"
- **Severity:** Medium
- **Evidence:**
  - `src/native/door.mjs` has 89 lines, but phases 02, 04 and 06 cite `:200`, `:244`, `:256-259` and `:264-272`.
  - `src/holder-lock/native-handover.mjs` has 9 lines, but the plan cites `:180`.
  - `src/runner/dispatch/run-lock.mjs:34-42` runs into `buildRunControlHolder` (`:38-48`), which must stay.
- **What is wrong:**
  - The `door.mjs` lines do not exist: `nativeHelperExe` is `:17`, the version check is `:60-61`, `canonicalJson` is `:73-77` and `durable` is `:81-89`.
  - The reach floor is handed over at `native-handover.mjs:6` and `index.mjs:706`, not `:180`.
  - The `run-lock.mjs` delete range would remove the kept function's doc comment and signature.
  - Also wrong: `registrations.mjs:6262-6320` (the function is `:6294`), import-graph `:231` (`:236`), `direct-cutover:163-171` (the assertion is `:172`) and `internal_lock_routes.rs` "14 cases" (13). Phase 2 verifies "5 cases" while `:372` stays until phase 5, so 6 cases remain at that point.
- **Suggested correction:** Re-run the line census against the current tree and use symbol names in delete lists. The `run-lock.mjs` delete is `:32-36` plus `:52`.

### 10. Moving `names_payload` into `origin.rs` would change who blocks the production quiesce scan
- **Severity:** Medium
- **Evidence:** `packages/holder-lock/rust/src/route.rs:557-569` (`names_payload`, including the `under(arg)` workspace-path rule); `route.rs:665` (non-`workspace_only` path: `names_payload` alone makes a blocker); phase 02 `holders` row ("Node's rules … `scripts/run-tests.mjs` … `quiesce-scan` reads the same function").
- **What is wrong:**
  - The quiesce classifier is machine-wide in production. Folding Node's `scripts/run-tests.mjs` rule into it makes any `node …/scripts/run-tests.mjs` on the machine (including other repositories' test runners) block `fgctl` activation and `events migrate`.
  - Going the other way, `under(arg)` needs workspace dirs that a lock-holder origin does not have.
  - These are two classifiers, not one.
- **Suggested correction:** Share only the payload-name predicate: `fgos`, `fgos-runner`, `fgos-gateway`, `bin/fgos.mjs` and `<stateRoot>/releases`. Keep `scripts/run-tests.mjs` and the env rules in `holder_origin` only. Keep `under(arg)` in quiesce. Add a quiesce test proving that a `run-tests.mjs` argv outside the workspace does not block.

### 11. T0's carry list points at the wrong staging judge, and the real one still uses `isProcessAlive` on a bare pid
- **Severity:** Medium
- **Evidence:** `src/runner/dispatch/assignment-runner.mjs:898` (`if (isProcessAlive(stagedPid)) continue;`, with the pid parsed from a `.staging-*` directory name); `:797` (an `admittedBy` control check, not staging); phase 06 "T0 named the staging judge, now `:797` reads `resolveHolderLiveness(...)` already".
- **What is wrong:** Deleting `isProcessAlive` "with its uses" removes the live-sibling protection for staging directories. `resolveHolderLiveness` takes a record, not a bare pid, and the plan names no replacement. The conditional "staging wiring case … added only if none" depends on this misread.
- **Suggested correction:** Name the replacement at `:898`, either `observe(pid).kind !== 'absent'` through `process-identity.mjs` or a recorded tuple. Make the staging wiring case unconditional, because the behaviour changes.

### 12. Phase 3's pinning claims overstate what the tests prove, and the size headlines disagree with the phase sums
- **Severity:** Medium
- **Evidence:**
  - `test/holder-lock/registry-contract.test.mjs:94-113` (rank/kind table and ordering only).
  - `packages/holder-lock/rust/tests/scope_rank.rs:135-144` (compares `(name, rank)` only).
  - `packages/holder-lock/rust/src/scope.rs:43-52` (reads `name`, `rank`; `kind` and `v3Path` at `:128,:133`).
  - `plan.md:20` vs `plan.md:53`.
  - `src/holder-lock/driver.mjs` (348 lines; the phase 2 delete list removes about 132).
- **What is wrong:**
  - No test pins a `v3Path` template. The "no `~` template" conclusion holds today (all registry rows start with `<…>`), but the mitigation as written is false.
  - Outcome says Rust ≈ +35 and tests ≈ −2 250, while the phase sums are +65 and −2 280. "Layer total ≈ −3 900" is −3 989 with contracts.
  - The `driver.mjs` −230 assumes it reaches about 120 lines. The keep list (`lockTransport` … `runStateRootRoute`, `guaranteeFor`) is about 190 lines after phase 2.
- **Suggested correction:** Add one assertion in `registry-contract` that every `v3Path` starts with a known placeholder. Align the Outcome numbers with the sums. Re-estimate `driver.mjs`.

## Verification results: 200 claims checked, 173 verified, 27 failed

Phase net-size sums recomputed:

| Column | Sum of phases | Matches plan.md:53? |
|---|---|---|
| Node | 0 − 630 − 600 − 5 − 175 − 215 + 0 = −1 625 | yes |
| Rust | 0 + 90 − 3 − 22 − 15 + 15 + 0 = +65 | yes |
| Contracts | −50 − 65 − 34 = −149 | yes |
| Tests | +150 − 400 − 1 250 − 320 − 120 − 340 + 0 = −2 280 | yes |

| # | Claim | Actual |
|---|---|---|
| 1 | `src/holder-lock/native-handover.mjs:180` hands the floor to the loan | The file has 9 lines; the floor is passed at `native-handover.mjs:6` and `index.mjs:706` |
| 2 | `handover.rs:21-58` `mint_git_loan` | `:21-63` |
| 3 | The v1-path grep finds only `registry.mjs:76-99`, `holder-lock-checks.mjs:383`, `case-lock.mjs:16` | It also finds 13 lines of `fences.mjs` (`:148-393`) |
| 4 | `proc_tree.rs` is "the second `/proc/<pid>/stat` parser" | At least 5: `facts.rs:433`, `flock.rs:624`, `proc_tree.rs:23`, `run-supervisor gate/unix.rs:646`, `supervise/terminal.rs:269` |
| 5 | `run-tests.mjs:148`: "the host re-pins it" / "the harness re-pins through the host" | `:148` strips the pin; `node --test` children run unpinned and use the route |
| 6 | `src/runner/session.mjs:64` is a `.fgos` join copy | It already wraps `fgosDirFromRoot` |
| 7 | `src/observe/friction-client.mjs:30-34` is a join copy | It already calls `fgosDirFromRoot` (dead `||` fallback) |
| 8 | `internal_lock_routes.rs`: 14 cases | 13 |
| 9 | `run-lock.mjs:34-42` is `isProcessAlive` | `:32-36`; `:38-48` is the kept `buildRunControlHolder` |
| 10 | `assignment-runner.mjs:797` is the staging judge | Staging judge is `:898` (`isProcessAlive(stagedPid)`) |
| 11 | `src/native/door.mjs:200` `nativeHelperExe` | `:17` |
| 12 | `door.mjs:244` version check | `:60-61` |
| 13 | `door.mjs:256-259` `canonicalJson` | `:73-77` |
| 14 | `door.mjs:264-272` `durable()` | `:81-89` |
| 15 | Phase 2: 13 `lockHolders` sites reading `.pids` | 14 listed; `lock-status.mjs` reads `descriptionHolders`; missed: `scripts/lib/full-suite-queue.mjs:39,71` and five test files (Finding 2) |
| 16 | `holder-lock-checks.mjs:36-44` are probe constants | `:36`, `:37`, `:44` are used by kept code (`:310`, `:478`, `:53-54`) |
| 17 | Phase 2: `internal_lock_routes` green "with 5 cases" | 6 until phase 5 retires `:372` |
| 18 | `scope.rs:43-52` reads `name`, `rank`, `kind`, `v3Path` | `:43-52` reads `name`, `rank`; `kind`/`v3Path` at `:128`, `:133` |
| 19 | `registry-contract.test.mjs:94-113` and `scope_rank.rs:135` pin every row's template | They pin rank/kind and `(name, rank)` only |
| 20 | `migrate-cutover-grant` already covers clean, blocked and unreadable for the four quiesce proofs | No unreadable, no `excludePids` (`:217`), no unlisted-worktree negative (`:230`) |
| 21 | `resolveStateRoot` callers: 14 | 17 call sites in `src` (15 after phases 3/5) plus 4 `resolveLockRoot` callers (`src`, `scripts`) |
| 22 | `registrations.mjs:6262-6320` `checkWriterIdentityResolvable` | Function at `:6294` |
| 23 | Import-graph `:231` names `state-lock-held.mjs` | `:236` |
| 24 | `direct-cutover.test.mjs:163-171` holds the `3456` assertion | Assertion at `:172` |
| 25 | `process-facts-vectors.test.mjs:13` owns `judgeHotRecord`'s four verdicts | It covers live and unknown; dead and reused only in `judge_vectors.rs` |
| 26 | Outcome: Rust ≈ +35, tests ≈ −2 250, layer ≈ −3 900 | Phase sums: +65, −2 280; layer −3 989 incl. contracts |
| 27 | Phase 4: `terminal-control-checks.mjs` imports `fgosDirOf` | It has its own copy at `:22` (phase 5 states this correctly) |

Unverifiable read-only (not counted): the live fence measurement (427 targets, 55 unfenced), the release digests, and the 1.36 ms / 28 µs baseline numbers. Their internal arithmetic is consistent: 22 + 32 + 1 = 55.

## Rejected hypotheses

1. **"`mint_git_loan` does not take the floor as a string."** Rejected: `packages/git/node-addon/src/git/handover.rs:27` is `reach_floor_ticks: Option<String>`, parsed at `:41-44`.
2. **"The `pub(crate)` `settle_release`/`drain_description` cannot be reached from the addon."** Rejected as a blocker: `packages/holder-lock/rust/src/lib.rs:20` (`pub mod driver`). The plan adds in-crate `pub fn port::release_description` / `port::drain_borrowed_description` wrappers, so the crate-private functions stay private. The `proven_alone_at` gap is reported separately (Finding 7).
3. **"A v3 template starts with `~` and loses its expansion."** Rejected: every `v3Path` in `packages/holder-lock/contracts/lock-registry.v1.json` starts with `<fgosDir>`, `<lockRoot>`, `<runDir>`, `<workflowRunDir>` or `<eventOpenRoot>`.
4. **"The fence columns have more readers than the plan names."** Rejected: `rg -l '"fence"|fenceNote|v1Path|v1Shape|\.fence\b' src bin packages apps scripts test docs` finds only `fences.mjs`, `registry.mjs`, the registry JSON and schema, `registry-contract.test.mjs`, two fence tests, `packages/event-store/rust/tests/registry_rows.rs:28-30` and `docs/platform/holder-lock/spec.md`.
5. **"HEAD moved past `e94b1618d` and shifted lines."** Rejected: `git diff --stat e94b1618d 44b43f23d` changes only `plans/261021-1118-.../plan.md` and one guide.
6. **"The phase net-size sums do not add up."** Rejected: they sum exactly to −1 625 / +65 / −149 / −2 280 (`plan.md:53`). Only the Outcome paragraph disagrees (Finding 12).
