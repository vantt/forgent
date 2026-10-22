# Red-team (scope and complexity lens): HARDEN T1 sub-plan

Reviewer: code-reviewer subagent, 2026-10-22 (Asia/Saigon), main `44b43f23d` (the brief named `e94b1618d`; the commits after it are docs only). Read only. Every finding cites the codebase. Plan line numbers are given only next to a codebase citation.

## Findings (Critical, then High, then Medium)

No Critical findings. Six High, six Medium.

### F1. The `lockHolders` shape change misses a production script and three test files

- **Severity:** High
- **Evidence:**
  - `scripts/lib/full-suite-queue.mjs:39` (`holders.pids.length > 0 ? \`pid ${holders.pids.join(', ')}\``) and `:71` (`holderText(lockHolders('full-suite', params))`).
  - `test/holder-lock/run-borrowed-git.test.mjs:152` and `:170` (`assert.deepEqual(lockHolders(LOCK, …), { kind: 'list', pids: [process.pid] })`).
  - `test/runner/provider-capacity.test.mjs:463` and `:473` (`.pids`).
  - `test/run-supervisor/direct-crash-matrix.test.mjs:290-291` (`listed.pids`).
  - The plan lists "13 sites" (phase-02 line 124). None of these appear in it.
  - Phase 2 also says `run-borrowed-git.test.mjs` "stays" as the Node-spawn-plus-Rust-drain wiring (plan.md line 95).
- **What is wrong:**
  - L10 says a contract change moves every caller in the same change. Phase 2 changes `lockHolders` from `{kind, pids}` to `{kind, holders:[tuples]}`.
  - The full-suite queue script reads `.pids`. After the change it throws `TypeError` on `undefined.length` whenever a second `npm test` waits for the queue, so the suite runner's own queue message breaks.
  - The three test files fail with a deep-equal mismatch or `undefined`. One of them is the wiring proof the plan says it keeps unchanged.
- **Suggested fix:** Add `scripts/lib/full-suite-queue.mjs` and the three tests to phase 2's Modify list, and add them to its one-file run. Smaller alternative: keep `pids` as a derived field next to `holders` in the facade's return (one line), and change only the callers that need tuples (`lock-fence.mjs`, `holder-lock-checks.mjs`).

### F2. Phase 2 deletes exports that files still import until phase 3 or phase 5, so the doctor module fails to link

- **Severity:** High
- **Evidence:**
  - `src/setup/holder-lock-checks.mjs:21` imports `KILL_WAIT_CONFIG_KEY, DEFAULT_KILL_WAIT_MS, MAX_KILL_WAIT_MS` from `protocol.mjs`, and `:34` re-exports `MAX_KILL_WAIT_MS`.
  - `test/setup/holder-lock-checks.test.mjs:29` imports `MAX_KILL_WAIT_MS`.
  - Phase 2 deletes `protocol.mjs:25-27` (phase-02 line 129) and removes only the `:20` import from the checks file (line 130). Phase 5 removes the `:21` import (phase-05 line 34).
  - `descriptionHolders` (deleted in phase 2) is still imported by `test/setup/run-supervisor-checks.test.mjs:27` (used at `:341`) and by `test/setup/holder-lock-checks.test.mjs:32` (the `holdWithFlock` helper at `:86`). Neither use is in any phase's file list.
  - `src/holder-lock/fences.mjs:478` (`checkStopped({ …, excludePids = ownPidChain(), … })`) moves to `migrate.mjs` in phase 3. Phase 3 does not list `ownPidChain` among the moved helpers (phase-03 line 20), and `fences.mjs` is deleted in the same phase.
- **What is wrong:**
  - An ES module that imports a missing named export fails at link time. From phase 2 until phase 5, `holder-lock-checks.mjs` cannot load. `registrations.mjs` imports it, so every doctor row and `fgos doctor` itself fail on the track branch for two or three phases.
  - That contradicts "each phase verifies green", and it hides regressions in phases 3 and 4.
  - The moved `checkStopped` keeps a default argument that names a deleted function.
- **Suggested fix:**
  - Phase 2 deletes `checkLockPredecessorKillWait` and `killWaitOf` together with the protocol exports. The doctor-row removal of decision 12 then lands in one phase, which is also where D-T1-8's split belongs. Phase 5 keeps only the docs.
  - Phase 2 rewrites both `descriptionHolders` test users onto `lockHolders`.
  - Phase 3 imports the self-chain wrapper into `migrate.mjs` for the `checkStopped` default.

### F3. Removing the state-root fallback breaks every in-process test that resolves the root, and the plan claims the opposite

- **Severity:** High
- **Evidence:**
  - `scripts/run-tests.mjs:148` (`const { …, FGOS_STATE_ROOT: _pinnedStateRoot, ...rest } = env;`) strips the pin from every test child. Test files run as plain `node --test` children, not under the host.
  - In-process callers without a pin: `test/setup/git-checks.test.mjs:59` (`resolveStateRoot({ fgosDir })`) and `test/runner/execution/run-sync.test.mjs:325`.
  - Indirectly, every in-process acquire of a machine-scope lock goes through `resolveLockRoot` (`src/holder-lock/state-root.mjs:41-43`).
  - After phase 4, `src/runner/dispatch/confinement/attestation-store.mjs:167` does too, so the four `dispatch-confinement-*` tests are affected.
  - Phase 5 says "the test harness re-pins through the host (`scripts/run-tests.mjs:148`)" (phase-05 line 39). It strips the pin; it does not re-pin.
- **What is wrong:**
  - After phase 5, `resolveStateRoot` throws `state-root-unpinned` in every one of these processes.
  - `scripts/run-tests.mjs` and the affected tests are in no phase's Modify list.
  - Phase 4 has a related problem. Until phase 5 deletes the route, the RT-M5 change makes the attestation store spawn the `state-root` route whenever no pin is set, which adds a host spawn in phase 4.
- **Suggested fix:**
  - `buildTestEnv` pins `FGOS_STATE_ROOT` to the fixture state root it already derives, or to a per-run scratch root. That is one line in the harness that owns the env.
  - Phase 5 adds `scripts/run-tests.mjs` and runs the listed tests.
  - Alternatively, `resolveStateRoot` derives the root in process from the crate's rule through the door (the `state_root` crate already exists). That needs no spawn and no pin, but it is a door addition, so it is an owner question.

### F4. The hook's no-host refusal is silently dropped, and its owning test is not named

- **Severity:** High
- **Evidence:**
  - `.githooks/pre-commit:131-137`: without a host, the hook still refuses while the kernel lists a holder (`if (holders.kind === 'list' && holders.pids.length > 0) return { kind: 'held' }`).
  - Owning proof: `test/e2e/main-checkout-borrow-hook.test.mjs:242-254` ("with no usable host binary the hook still refuses while the kernel lists a holder of the lock file").
  - D-T1-4 (plan.md line 68) turns no-host into "warn and continue". It cites `:120-121`, but the comment there describes the fallback that `:133-137` replaced.
  - Phase 2 names only three hook fixture tests (`custody-lease-commit`, `merge`, `commit-unit-work`; phase-02 line 150). Other hook tests that drive the real hook are not listed: `test/e2e/main-checkout-lock-hook.test.mjs`, `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, `main-checkout-borrow-hook.test.mjs`, `test/runner/land-vs-manual-commit.test.mjs`, `test/runner/repo-locks-multiprocess.test.mjs`, `test/runner/worktree-admin-multiprocess.test.mjs`, `test/runner/claim-capacity-race.test.mjs`.
- **What is wrong:**
  - A safety behaviour (refuse a commit while fgOS holds the main checkout, even without a host) is removed without being named as removed behaviour, and its test is neither retired nor kept.
  - This breaks design principle 8: a retired proof names its owner, or the change says the behaviour is gone.
  - Phase 2 also says identity resolution with no host refuses the commit anyway, so `:242`'s expected message `fgOS is writing the main checkout right now` changes either way.
- **Suggested fix:** Decide the no-host behaviour explicitly.
  - Keep the refusal: the hook keeps "no host → refuse", since identity already refuses there. This is the smallest option.
  - Or retire `:242` by name as removed behaviour.
  - Either way, list every e2e and runner test that drives the real hook in phase 2's verification.

### F5. Two moves import upward across layers, and no phase owns the architecture manifest edit or runs its test

- **Severity:** High
- **Evidence:**
  - `docs/architecture-manifest.json` classifies `src/state/fgos-file-registry.mjs` and `src/util/session-identity.mjs` as `kernel`, and `src/runner/paths.mjs` and `src/native/door.mjs` as `infra`.
  - `test/architecture.test.mjs:142-171` fails on any import whose source rank is above its target rank (layers `entry, use-case, infra, domain, kernel`).
  - Phase 4 makes `fgos-file-registry.mjs:69` call `fgosDirFromRoot` from `paths.mjs` (phase-04 line 29). `paths.mjs:15-16` imports the Git inspect port and `worktree.mjs`, so the kernel file would also pull in Git.
  - Phase 6 makes `session-identity.mjs` call `nativeDoor()` (phase-06 line 119).
  - Neither phase lists the manifest or runs `test/architecture.test.mjs`.
- **What is wrong:**
  - Design principle 2 (strict bottom-up layering) is broken, and the mechanical check for it goes red in phases 4 and 6.
  - `fgosDirFromRoot` also calls `path.resolve`, which `normalizeFgosDir` does not, so the "one door" swap changes behaviour for relative inputs.
- **Suggested fix:**
  - Phase 4: leave `normalizeFgosDir` alone. The arbitration called it a disambiguator, and the plan's own Facts (plan.md line 31) say it "keeps its name".
  - Or move `fgosDirFromRoot` into a kernel leaf that both files import. That is two lines, and `paths.mjs` re-exports it.
  - Phase 6: reclassify `session-identity.mjs` in the manifest, or route the door call through an infra adapter. Add the manifest and `test/architecture.test.mjs` to phase 6.

### F6. Phases 3 and 4 are not disjoint: both regenerate the census and refresh the suite baseline

- **Severity:** High (it blocks the parallel claim the plan's schedule rests on)
- **Evidence:**
  - `packages/git/contracts/mutation-census.v1.json:3` has one `payloadDigest` over all hashed files.
  - Phase 3's files are hashed: `src/setup/holder-lock-checks.mjs`, `src/holder-lock/fences.mjs`, `src/holder-lock/registry.mjs`, `src/verbs/events/migrate.mjs`.
  - Phase 4's files are hashed: `src/state/hot-lock.mjs`, `src/native/door.mjs`, `packages/holder-lock/rust/src/driver/flock.rs`, `packages/process/rust/src/containment/linux.rs`, `src/runner/session.mjs`, `src/setup/run-supervisor-checks.mjs`, `src/runner/dispatch/confinement/attestation-store.mjs`, `packages/convention/rust/src/operations.rs`. All are present in the census (grep counts ≥ 1 each).
  - `test/suite-baseline.json:3-4` (`files`, `tests`) changes in both phases, because both retire tests.
  - plan.md line 55 says "the only shared file is the CHANGELOG hunk".
- **What is wrong:**
  - Each phase regenerates a JSON file whose digest depends on the other phase's edits. Whichever lands second always conflicts and must regenerate, and a rebase can silently keep a stale digest. The baseline has the same problem.
  - The ownership claim is wrong as written.
- **Suggested fix:** Name both generated files as "regenerated by the later lander after rebase, never merged by hand". Add one step to phase 5's start: regenerate the census and refresh the baseline once. Or run 3 and 4 in sequence; together they take about 1.5 days.

### F7. The lock External, `closeHandedOver` and three new public port entries grow the approved shape; a smaller shape exists

- **Severity:** Medium
- **Evidence:**
  - Arbitration §2.1 approved "The Rust port is unchanged" and fd-based calls: `drainChild(fd, …)`, `releaseFd(fd, killWaitMs)`, `clearDomain(fd, …)`.
  - The plan adds a typed N-API External that holds a duplicate of the description, plus `closeHandedOver`, `port::lock_fd`, `port::release_description`, `port::drain_borrowed_description`, `predecessor::contender_view`, and a signature change to `port::from_acquired_description` (phase-02 lines 105-117).
  - Today a handed-over handle is a plain `fs.closeSync` (`src/holder-lock/index.mjs:121`). Under the plan it needs a door call only because the External holds a second fd.
  - `settle_release` takes ownership of a `File` and drops it itself (`packages/holder-lock/rust/src/driver/flock.rs:332-346`). A call that takes the fd (`releaseFd(fd, since, killWaitMs)` duplicates and closes inside Rust, and Node marks the fd closed) does not need a long-lived duplicate.
  - The `since` marks are two `(ticks, last_pid, at)` triples. They can travel as a plain object held in the facade's private WeakMap, with `at` sent as monotonic nanoseconds.
  - Test cost: phase 2 says "Added 1 (Rust classifier)" (phase-02 line 178). Yet `port::lock_fd` (predecessor admit plus guarantee composed in a new way), `release_description` and `drain_borrowed_description` get no new Rust test, and the "unit test beside `predecessor::contender_view`" named as the owner for the retired `internal_lock_routes.rs:255` is not counted.
- **What is wrong:**
  - These are RUL104 additions: a new object kind with its own Drop semantics, a new facade call and four new public Rust entry points, with no deletion paying for them beyond what an fd-based shape would also delete.
  - Their owning proofs are either missing or not counted.
- **Suggested fix:**
  - Use the fd-based shape the owner approved. Marks go in the WeakMap entry. A handed-over or shared handle keeps the plain close. Drop `closeHandedOver` and the External.
  - Keep one public port entry (`port::lock_fd`) and keep the settle and drain bodies `pub(crate)` behind it, or name and count one Rust test per new public entry.

### F8. Three retired tests name owners that do not prove the same behaviour

- **Severity:** Medium
- **Evidence:**
  - `test/holder-lock/registry-contract.test.mjs:161-187`:
    - `:161` checks that each vector's `expect` equals its rule's `result`, except for `control-*` vectors.
    - `:169` checks that the observer-outside-init vectors carry no `pidNs` and expect `unknown`, and that the zombie states are exactly `X`, `Z`.
    - `:181` checks that vector names are unique.
    - The named owner, `packages/process/rust/tests/judge_vectors.rs:74-104`, checks only that `judge()` agrees with each vector and that each rule has a vector. `test/process/process-facts-vectors.test.mjs:13` judges three live records.
    - Phase 3 admits the reason is "retired here because this phase already rewrites the file" (phase-03 line 43). These are not fence tests: this is scope creep in a fence-deletion phase.
  - `test/setup/holder-lock-checks.test.mjs:174` ("the probe refuses a probe file another process already holds"):
    - The named owner, `packages/holder-lock/rust/src/semantics.rs:177-190`, runs only the passing probe.
    - The refusal branch at `semantics.rs:86` ("a fresh probe file … was already locked") has no test after the retirement.
  - `test/util/session-identity.test.mjs:248` (classification of exec failures):
    - The named owner, `test/setup/writer-identity-doctor-check.test.mjs:42-60`, covers pass, `host-version-mismatch` and no host.
    - It does not cover `host-error` (exit 3 with stderr in the message), which D-T1-7 keeps for the probe. It does not cover a hung host being killed and reaped either.
- **What is wrong:** These retirements weaken coverage of behaviours that still exist (design principle 8).
- **Suggested fix:**
  - Keep `:161/:169/:181`. They are cheap and not fence-related. At most, move them later into a judge-vector owner that actually asserts them.
  - Retire `:174` only after adding the refusal case to `semantics.rs` tests (≈ 12 lines).
  - Keep `:248`'s `host-error` and timeout halves as one `probeIdentity` case in `writer-identity-doctor-check.test.mjs`.

### F9. `process.selfChain()` scans the whole machine, regresses macOS, and duplicates phase 6's `relation_of`

- **Severity:** Medium
- **Evidence:**
  - The plan builds `selfChain()` over `facts::relations()` (phase-02 line 115). `relations()` reads every process (`packages/process/rust/src/facts.rs:436-441`), and the platform default returns `None` (`packages/process/rust/src/platform/mod.rs:43`; only `linux.rs:100` implements it).
  - Today `ownPidChain` returns at least `[process.pid, process.ppid]` on every platform (`src/holder-lock/fences.mjs:407-427`).
  - Phase 6 then adds `facts::relation_of(pid)` (one stat read) for the same parent-walk job (phase-06 line 128).
  - The behaviour needs more than `ppid`: `test/cli/fgos-lock-fence.test.mjs:127-139` holds the lock in the test process, which is the grandparent of the payload.
- **What is wrong:**
  - Two new Rust surfaces do one job.
  - The first costs a full process-table pass on every `lock fence`.
  - On macOS the chain shrinks to the process itself, unless the plan specifies a fallback, so `lock-fence-self` can fence the caller's own parent there.
- **Suggested fix:** Move `relation_of` into phase 2 and build `selfChain` as a loop over it, about the same 10 lines. Keep `process.ppid` as the second element where `relation_of` returns `None`. Phase 6 then only adds the `session`/`tty_nr` fields.

### F10. The size estimates are inflated for `driver.mjs` and `index.mjs`, and the plan's Rust totals disagree with each other

- **Severity:** Medium
- **Evidence:**
  - `src/holder-lock/driver.mjs` is 348 lines.
    - Phase 2 deletes `:154-201` (`runLockRoute`, 48 lines), `:222-225` (4) and `:272-348` (77): about 129 lines.
    - It keeps `:1-153` (`lockTransport`, `leftoverSweep`, `borrowLeadsGroup`, `hostBin`, `routeEnv`, `interpretRoute`, `routeLineOrThrow`, `lockFdArgv`, `runLockRouteSync`), `guaranteeFor`/`assertDriverUsable` (`:203-249`) and `runStateRootRoute` (`:250-270`).
    - That leaves about 215 lines, not "≈ 120" (−230, phase-02 line 174).
  - `src/holder-lock/index.mjs` (716 lines):
    - The listed deletions (`:187-194`, `:302-333`, `:370-378`, `:429-447`) total about 68 lines.
    - New External, handed-over, settle-error and `closeHandedOver` branches add some back.
    - −60 to −90 is realistic; the plan says −150.
  - plan.md line 20 says "Rust ≈ +35". The table sum at line 53 is +65 (phase lines: +90 −3 −22 −15 +15).
- **What is wrong:**
  - About 150 Node lines of the claimed −1 625 are not backed by a delete list.
  - The layer still ends below 0, so this is honesty, not the gate.
- **Suggested fix:**
  - Re-derive the two lines from the delete lists: driver about −130, index about −80.
  - Fix plan.md line 20 to +65.
  - Report the "contracts −149" figure separately, as the plan already does.

### F11. The named release-stuck error changes WORK's transaction contract, while the plan says WORK's region is untouched

- **Severity:** Medium
- **Evidence:**
  - `src/state/hot-lock.mjs:318-326`: `releaseRecord(paths)` runs inside `finally` after `fn(tx)`.
  - Phase 4 makes `releaseRecord` throw `hot-lock-release-stuck` (phase-04 line 106). The plan says no edit inside `:227-332` and that "the error propagates as the transaction's error after the callback's own result".
- **What is wrong:**
  - A throw from `finally` replaces both the callback's return value and the callback's own exception.
  - A transaction that already committed is then reported to its caller as failed.
  - A callback error is masked by the release error.
  - This changes the contract of WORK's `withStateTx`, which owner decision 3 and the arbitration (§2.5) leave to WORK, without saying so or telling WORK.
- **Suggested fix:**
  - Name the contract change and record it on WORK's board row.
  - Or keep T1's change in its own range: `releaseRecord` returns `'stuck'`, and `withStateTx` is left as is. In that case, record a single line for WORK about throwing after the result.
  - Add one `withStateTx`-level case to `windows-hot-lock.test.mjs` that pins the chosen behaviour.

### F12. The new RT-M5 test file ignores the module's existing owner, and a retired test leaves a spec reference dangling

- **Severity:** Medium
- **Evidence:**
  - `test/runner/dispatch-r9-performance-cache.test.mjs:8-13` imports `src/runner/dispatch/confinement/attestation-store.mjs` (the probe-cache store functions). `test/runner/dispatch-confinement-p04.test.mjs:29` imports `loadAttestationRecord` from it.
  - Phase 1 creates a new file on the claim that "no test imports `attestation-store.mjs` today" (phase-01 line 27).
  - `docs/platform/git/spec.md:610` cites `test/state/hot-lock-known-exec-sites.test.mjs` as "the existing … pattern" for the Git runtime check. Phase 4 deletes that test without editing the spec.
- **What is wrong:**
  - Design principle 8 says a new test lands in the file that owns the module unless the module is new.
  - Deleting a file that a living spec names as a pattern leaves the spec pointing at nothing (L10 applied to docs).
- **Suggested fix:**
  - Put the pinned-root case in `dispatch-r9-performance-cache.test.mjs` (≈ 10 lines; no new file, no new `test/runner/dispatch/confinement/` directory).
  - In phase 4, reword `git/spec.md:610` to cite `test/state/hot-lock-guard.test.mjs`, the owner the plan names, and tell GIT, since this is GIT's spec.

## Coverage table

| Source row | Phase | Status |
|---|---|---|
| S-1 + RT-M2/M4/M7 (door, handed-over, full mark, tuple holders) | 1, 2 | ok in scope; shape grown (F7); callers missed (F1) |
| RT-M1 (hook as cold host client) | 2 | ok, but the no-host refusal is dropped silently (F4) |
| RT-M2 (red: `spawnWithLocks` then release keeps the child) | 1, 2 | ok |
| RT-M3 (Windows keeps `hold-transport.mjs`, `route/hold.rs`) | 2 | ok (`windows_lock_hold_route.rs:116-122` rewritten because `--probe` goes) |
| S-F1 | 1, 4 | ok |
| HL-N8/N9 (R1) | 1, 4 | ok (both checks kept, one owner each) |
| T1-CF-01 / T1-CF-02 | 4 | ok as arbitrated; WORK contract side effect unacknowledged (F11) |
| S-2/S-E2 (Node `/proc` scan) | 2 | ok |
| S-3 (identity door) | 6 | ok; layering break (F5) |
| S-8/S-E3 (two-process probe) | 2 | ok; refusal proof lost (F8) |
| S-E1 (fences) | 3 | ok; `ownPidChain` default left dangling (F2) |
| S-E4 (classifier in `fgos-holder-lock`, `origin`) | 2 | ok |
| S-E10 (`proc_tree.rs` onto `fgos-process`) | 6 | ok; `relation_of` should come earlier (F9) |
| RT-M5 | 1, 4 | ok; test placement (F12); spawn until phase 5 (F3) |
| RT-M11 / R3 | 1, 4 | ok (message carries bwrap's line; no named `containment-mount-refused`, as arbitrated) |
| T0-R1 | 1, 4 | ok |
| T0-R2 | 1, 4 | ok |
| RT-M6 / RT-M8 / RT-M10 | 4 / 3 / 4 | ok (RT-M8 moved to the file owner, phase 3) |
| S-13 (kill-wait read twice) | 2, 5 | ok via owner decision 12; doctor half breaks linking in phases 2–4 (F2) |
| S-G1 (doctor 9 → 5) | 3, 5 | ok in mapping; `state-root-unpinned` breaks tests (F3) |
| T0 size debt (simplicity list, red-team correction) | 4 | ok for the red tests. The T1 phase file's "N-API boilerplate in `process,durable_file,canonical_json.rs`" is not trimmed: the arbitration row narrowed it, and the plan grows `process.rs` +10 instead |
| §2.3 RT-M9 + S-F5a | 4 | ok |
| §2.4 one state-root / `.fgos` door | 4, 5 | ok in list; kernel→infra import (F5); test pin (F3) |
| D2, D3, D4 (5 corrections), D5 | 2, 3 | ok; D4 guide line interpreted as "passed incl. warn" (see rejected 5) |
| H16 (git-fence-missing row first) | done `96dd8fb29` | ok |
| H18 (`migrate.mjs` move, GIT/ES review) | 3 | ok |
| H19 second half (one counter) | 6 | ok |
| H21 (HL-F1 to TEST), H22 (to WORK) | — | ok, not touched |
| Received: T0 debt / T0-R1 / T0-R2 / R3 / HL-N8/N9 | 4 | ok (boilerplate half dropped; see the T0 size debt row) |
| Received: HL-F1 → TEST | — | ok (`hot-lock-multiprocess.test.mjs:249-298` untouched) |
| Parent loop step 4 (Create/Modify/Delete/Tests-to-retire/net-size per phase) | all | present. Omissions: F1, F2, F3, F5 files missing from Modify lists; phase 2's added Rust tests are uncounted (F7) |

## Rejected hypotheses

1. **The `repo-config` scan change is unrequested.** Rejected. Arbitration D4 orders "`cutOverLockFiles` filters by `LOCK_FILES` membership". `LOCK_FILES` already carries `repo-config` (`src/setup/holder-lock-checks.mjs:379`), so the scan grows as a consequence.
2. **RT-M8 in phase 3 is misplaced.** Rejected. The arbitration fix is "delete with `v1Path`". `v1Path` goes in phase 3 with `src/holder-lock/registry.mjs:52-73`, which phase 3 owns.
3. **`selfChain` is unnecessary; `process.pid`/`process.ppid` suffice.** Rejected. `test/cli/fgos-lock-fence.test.mjs:127-139` holds the lock in the test process, two levels above the payload (test → host → node). F9 covers the shape, not the need.
4. **Rewriting `windows_lock_hold_route.rs` is scope creep.** Rejected. `apps/fgos/tests/windows_lock_hold_route.rs:116-122` calls `lock-fd --probe`, which the arbitration's delete list removes.
5. **D-T1-9 waters down "lock-fences green".** Rejected. `checkLockFences` returns `passed: true` with a warn message for unfenced post-cutover paths (`src/setup/holder-lock-checks.mjs:620-623`). "Green" in doctor terms includes a warning; only `v1Present`/`git-fence-missing` fail.
6. **Counting JSON contracts in the Rust column is a trick.** Rejected. The parent size rule defines Rust by path (`packages/`, `apps/`; parent plan line 108), and plan.md shows the code-only figure next to it. Only the +35/+65 mismatch is real (F10).
7. **The S-F5a spec correction is unrequested.** Rejected. Arbitration §2.3 asks for it ("the lead picks whichever is smaller").
