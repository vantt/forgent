# Git phase 08 unit 1: proofs and docs

Worktree `.claude/worktrees/git-p08`, branch `git/p08-gate` from `git/p07-switch` `7044c55d1`. Git 2.53.0, Linux 7.0.0-38, ext4 on NVMe. This sandbox has no root, no mount, and no user namespaces (`bwrap` and `unshare` are refused; `apparmor_restrict_unprivileged_userns=1`). So the Git driver selected `linux-pgroup` here, and every bwrap/pidns test takes its named skip. No production code changed. The V-GATE files belong to the parallel phase 07 unit 20 and were not touched.

## What was delivered

| Requirement | Deliverable | Ran here |
|---|---|---|
| 1 E1 | `scripts/git/e1-power-cut.sh` (root: dm-log-writes, replay to every FUA, dm-snapshot mount, check). `scripts/git/e1-power-cut.mjs` (workload, post-cut `check`, §10 syscall-order `trace`/`order`) | `trace` and `check` yes; power cut no (root) |
| 3 P-SPACE / P-RESOURCE | `scripts/git/p-space-resource.mjs` (limit sweeps). `scripts/git/p-space.sh` (root: small ext4 ENOSPC, inode-starved ext4, dm-flakey EIO) | Resource sweeps yes; small filesystem no (root) |
| 4 E4 | New failing owning test in `test/git/scoped-commit.test.mjs`. Host commands below | Yes (linux-pgroup only) |
| 5 V-CONSUMER | `test/git/e2e-consumer-noncoding.test.mjs` (detached HEAD without origin/HEAD; no repository) | Runs, but stops at bwrap confinement (host-only) |
| 6 P-RELEASE | `scripts/git/p-release-checks.sh` (C5 tests, V-PACK, live-process rollback, stale-npm protocol check, release assets plus `ci-external-consumer.sh`) | Protocol comparison by hand; the rest is for the coordinator |
| 8 Vector matrix | Below | — |
| 9 Docs | Git spec status line and §19 "Implementation runs" rows; component-boundary Git row; reading-map Git entry; runner history note; holder-lock §16 status | — |
| 2 E3, 7 P-CUTOVER | Pending (see below) | No |

## Run brief for P-SPACE and P-RESOURCE (written before measuring)

- **Workload.** Each run is a fresh worker process with its own bare repository and an established tip on `refs/fgos/events/p-space`. Under the fault it does one Publication operation: open the port, write blob, tree and commit, `compareAndSwap` to a new id, close. The fault is then lifted and the worker observes.
- **Faults.** These are real kernel errnos with no seam, set on the worker pid only:
  - `RLIMIT_NOFILE` = open fds + k, for k = 0, 1, …
  - `RLIMIT_NPROC` = the uid's task count + k
  - `RLIMIT_FSIZE` = k × 128 bytes
  - chmod 0500 on `objects`, `fgos/git/operations`, `refs/fgos/events`, `refs/fgos` and `fgos/git`
  - on the host only: free space k × 4 KiB, free inodes k, and dm-flakey `error_writes`
- **Ceilings.** A sweep stops after three consecutive clean publications. Each run has a 120 s hang ceiling (a hang counts as a finding). `space` refuses a filesystem with more than 64 MiB free.
- **Invariants.** Every run checks five invariants:
  - **I1:** a returned receipt has a terminal WAL chain, and the ref is at `next`.
  - **I2:** a thrown call left either the ref at `expected` with no WAL success, or the ref at `next` with the operation pending or uncertain.
  - **I3:** the WAL scan is complete.
  - **I4:** no descriptor is left open.
  - **I5:** after `recover(id)`, a fresh id publishes.

## Results here

- **E1 order, held.** `node scripts/git/e1-power-cut.mjs trace --root .fgos/runtime/tmp/e1-trace-<t> --ops 9` ran on ext4: 9 operations on 3 refs (one nested), with `pack-refs --all` halfway. All 36 WAL records were checked against §10 order with zero violations. Records are installed with `linkat` through `/proc/self/fd/<dirfd>`. The temp file is fsynced before install, the op directory after, and `operations/` after record 0. The fan-out directory is fsynced before `prepared`. The ref directory is fsynced between Git's `<ref>.lock` rename and the outcome record.
  - **Negative controls.** I removed each fsync class from the trace. Ref-dir removal gave 6 violations, op-dir 4, fan-out 9. The checker is not vacuous.
  - **Post-cut checker.** `check` on the intact image gave 0 violations. After I rewound one ref to an older planned value, it flagged that acknowledged operation.
- **P-RESOURCE, held before the effect.** No run violated an invariant, and no limit failed an operation after its CAS. Fd and file-size use peak before the effect, so after-effect coverage needs the host's ENOSPC/EIO sweep.

  | Fault | Runs | Refused | Refused after effect | Violations |
  |---|---|---|---|---|
  | EMFILE | 13 | 10 | 0 | 0 |
  | EFBIG | 9 | 6 | 0 | 0 |
  | EAGAIN (nproc) | 8 | 5 | 0 | 0 |
  | EACCES | 5 | 3 | 0 | 0 |

  Notes on the refusals:
  - Read-only `refs/fgos/events` gave `publication-outcome-unknown` / `recovery-required` with the ref unchanged. That is conservative, and `recover(id)` then settled it.
  - When `RLIMIT_NPROC` blocks a thread spawn, the cause reads "concurrent durable step panicked". It is safe, but it is not a named EAGAIN cause. This is a polish idea only: the durable-file concurrent fsync could use `std::thread::Builder::spawn` and map the error.
- **E4, violated on `linux-pgroup`.** A pre-commit hook child that closes the borrowed descriptor (`3>&-`) and calls `setsid`, directly or after a double fork, survives. ScopedCommit then returns `{"status":"committed","warnings":[]}`. Escapees that keep the descriptor are drained (25/25 in `test/git/scoped-commit.test.mjs`).
  - The new test `ScopedCommit never reports plain success while a setsid hook child without the borrowed descriptor survives` fails here. It should pass on a pidns host.
  - Spec §15 E4 requires `containment-unproven` as `recovery-required` where no driver answers `Empty`. Today `linux-pgroup` answers `Empty` for a group the escapee has left.
- **V-CONSUMER, not testable here.** Both cases stop at "required confinement refused … bwrap: No permissions to create a new namespace", the same as the existing `business-discussion` test in this sandbox. The no-repository case gets past workflow start. I could not observe whether the owner's Q1 decision (2026-10-18: a read-only workflow runs outside a repo) holds end to end. Two places to check on the host: `resolveGitRoots` in `src/runner/execution/run.mjs:115-125` still throws for a non-repository, and `src/workflow/case-start.mjs:153` calls it.
- **P-RELEASE, gap found.** `PROTOCOL = 1` in this checkout's `src/holder-lock/protocol.mjs` and in all three installed releases under `~/.local/state/fgos/releases`. Nothing in the protocol refuses a stale global npm `fgos merge`, which spec §12 and phase 08 req 6 expect.

## Vector matrix (§15)

Status vocabulary:
- **green:** an implementation test of the behaviour passed in the cited run.
- **partial:** only part of the vector has a test.
- **missing:** no test.
- **host:** needs root, bwrap or the coordinator.

No test carries a vector label, so the mapping below is by behaviour.

| Vector | Owning proof | Last green evidence | Status |
|---|---|---|---|
| V-PUB | `packages/git/rust/tests/publication.rs` `hooks_symbolic_refs_and_replaced_authority_are_refused`, `objects_walk_stop_set_cas_delete_and_gc_all_formats_and_backends`; `test/git/native-load.test.mjs` Publication marshal | `gate-261020-0653` (cargo workspace 1157/0, tree `e27df5b27`) | partial: direct-to-symbolic substitution race has no test |
| V-CAS | `publication.rs` `attempted_operation_is_never_replayed_after_fault_or_aba`, `sigkill_on_both_sides_of_target_effect_has_conservative_recovery`; `refs_remote.rs` `target_attempt_survives_aba_and_never_reissues`; `land_crash_matrix.rs`; `recovery_matrix.rs` | `gate-261020-0526` (recovery_matrix 8/8) | partial: multi-ref residue on `reftable` not named |
| V-EVENT | `packages/event-store/rust/tests/v_event.rs` | After the H1 fix: `phase-lead-261018-2231-es-p05-u2-review-fixes.md` and `gate-261019-2107-es-p08-host-gate.md` (`-p fgos-event-store -p fgos-git -p fgos-node-addon` 261 pass, `aa237c062`); first green `unit-run-1792335330301-2d5438cb/producer/1`; this tip `7044c55d1`: 4/4 green (below) | green |
| V-GC | `publication.rs` `objects_walk_stop_set_cas_delete_and_gc_all_formats_and_backends` | `gate-261020-0653` | partial: interrupted unprepared objects not separately asserted |
| V-LAND | `test/git/land.test.mjs`; `packages/git/rust/tests/land.rs` | `gate-261020-0526` | green (correctness); E3 Land is separate |
| V-VERIFY | `test/git/land.test.mjs` (mismatched verification never moves target; frozen transforms) | `gate-261020-0526` | green |
| V-CRASH | `land_crash_matrix.rs`, `publication.rs` `every_acknowledged_filesystem_boundary_preserves_attempt_evidence`, `safe_restore.rs`, `recovery_matrix.rs` | `gate-261020-0526` | green for SIGKILL; power loss is E1 |
| V-ORDER | `test/git/lock-handover.test.mjs`, `land.test.mjs` rank refusals, `borrow_deadline.rs` | `gate-261020-0653` | partial |
| V-BORROW | `borrow_deadline.rs`, `packages/holder-lock/rust/tests/borrow_io.rs`, `borrow_git.rs`, `test/git/scoped-commit.test.mjs` drain | here: scoped-commit 25/25; `gate-261020-0526` | partial: see E4 finding |
| V-CUSTODY | `test/git/worktree.test.mjs` custody, `land.rs` `held_custody_refuses_before_effect`, `test/runner/custody-successor-admission.test.mjs` | `test-261019-0210-git-p04-u3-host-verification.md` | green on the implementation |
| V-SCOPE | `test/git/write-scope-parity.test.mjs`, `packages/git/write-scope` | `gate-261020-0526` | green |
| V-TRUST | `publication.rs` hooks/symbolic/replace; `refs_remote.rs` transport trust; `scoped_commit_sync.rs` hook tampering | `gate-261020-0653` | partial: no fsmonitor or GIT_* env poisoning test |
| V-SYNC | `test/git/sync.test.mjs`, `scoped_commit_sync.rs` | `gate-261020-0526` | partial: "no useless worker" untested |
| V-CLEAN | `test/git/worktree.test.mjs`, `worktree.rs`, `refs_remote.rs` `worktree_add_queued_on_admin_cannot_attach_after_delete` | `gate-261020-0526` | green |
| V-CONSUMER | `test/git/e2e-consumer-noncoding.test.mjs` (new) | none | host; noncoding writing-land fixture missing |
| V-PACK | `test/git/native-load.test.mjs` (staged manifests, no PATH/cwd, second copy refused) | `gate-261020-0526` | partial: external install and pending-WAL rollback are in `p-release-checks.sh` |
| V-PARITY | `test/event-store/legacy-order-parity.test.mjs`, `export-legacy-parity.test.mjs`, `land.test.mjs` M4 | `gate-261019-2107` | partial |
| V-GATE | phase 07 unit 20 (`test/git/one-door.test.mjs`, `scripts/git-one-door-scan.mjs`) | none yet | pending phase 07 unit 20 |
| E1 | `scripts/git/e1-power-cut.{sh,mjs}` | order trace here (held) | host (root) |
| E2 | `worktree.rs` killed create/move | `gate-261020-0526` | partial |
| E3 | `scripts/git/e3-bench.mjs`; `test/git/e3-census.test.mjs` | `gate-261020-0653`: ScopedCommit 1.35–1.46 ≤ 1.5 pass; Land p95 ≈ 1.43–1.46 s (≤ 1.6 s absolute budget since 2026-10-20) | host: full run after phase 07 unit 20 merges |
| E4 | `scoped-commit.test.mjs` (drain + new escapee test); `containment_bwrap.rs`; `borrow_deadline.rs --ignored` | here: drain 25/25, escapee test fails | violated on linux-pgroup; pidns host run needed |
| E5 | `publication.rs`, `refs_remote.rs` remote/hook tests; GF raw-Git run | `gate-261020-0653` | partial |
| E6 | census `scout-261020-1616-git-p07-u13-census.json`, `scout-261020-1702-git-p07-u17-census.md` | phase 07 | pending phase 07 regenerated census |
| P-SPACE | `scripts/git/p-space.sh` + `p-space-resource.mjs space` | none | host (root) |
| P-RESOURCE | `scripts/git/p-space-resource.mjs resource` | here (held before effect) | partial: after-effect via host ENOSPC; deadline only via `borrow_deadline.rs` |
| P-RELEASE | `scripts/git/p-release-checks.sh` → `git_gate.rs`, `activation_lock_multiprocess.rs`, `git_wal_activation_gate.rs`, `e3-bench.mjs rollback`, `ci-external-consumer.sh` | rollback-with-live-processes passed in `gate-261019-1855` | host; protocol-bump gap |
| P-CUTOVER | `test/git/cutover-grant.test.mjs`, `scoped_commit_sync.rs` `baseline_only_cutover_commits_the_event_fence`, `test/event-store/migrate-cutover-grant.test.mjs` | `gate-261019-2107` (5/5) | pending: Event Store cutover commit (WORK lane) |
| Second-load | `native-load.test.mjs` "a second physical addon copy refuses at load" | `gate-261020-0526` | green |
| M1–M4, P-WAL-ID, P-CUSTODY | Model runs in §19; implementation tests as V-CAS, V-CUSTODY, `land.test.mjs` M4 | §19; `gate-261020-0526` | partial (as §19) |

## V-EVENT on this tip

`cargo test --locked -p fgos-event-store --test v_event -- --test-threads=1` on `7044c55d1` (this branch, 2026-10-20 ~21:55 Asia/Saigon): 4 passed, 0 failed (17.5 s). This is the V-EVENT green run for the phase 08 blocking edge; the coordinator repeats it on the merged landing tree.

## Pending, with owner and commands

The host has root, bwrap/userns, and is the owner's ext4 NVMe class.

1. **E1 (owner, root).** `sudo scripts/git/e1-power-cut.sh --work /var/tmp/fgos-e1 --user $USER --replay-log <xfstests>/src/log-writes/replay-log`
   - Build `replay-log` first: `git clone https://git.kernel.org/pub/scm/fs/xfs/xfstests-dev.git && make -C xfstests-dev`.
   - The verdict goes to `/var/tmp/fgos-e1/e1-verdict.json`. A pass licenses `stableMedia` for that ext4 profile only, and that is a later production change to `git-durability-capability`.
2. **P-SPACE (owner, root).** `sudo scripts/git/p-space.sh --work /var/tmp/fgos-p-space --user $USER`. It writes bytes, inodes and EIO results to `out/`.
3. **E4 pidns (host with userns).**
   - `cargo test -p fgos-process --test containment_bwrap -- --nocapture` (no `skip:` lines allowed)
   - `cargo test -p fgos-git --test borrow_deadline -- --ignored`
   - `cargo test -p fgos-holder-lock --test borrow_io --test borrow_git`
   - `node --test test/git/scoped-commit.test.mjs` (the new escapee test must pass there)
4. **V-CONSUMER (host with bwrap).** `node --test test/git/e2e-consumer-noncoding.test.mjs`. The test suite's environment applies (`npm test` sets it).
5. **P-RELEASE (coordinator at landing).** `scripts/git/p-release-checks.sh --work /var/tmp/fgos-p-release --stale-fgos "$(npm root -g)/fgos"`.
6. **E3 full (coordinator).** Run after phase 07 unit 20 merges: `node scripts/git/e3-bench.mjs run --root /var/tmp/fgos-e3-<t>`, under the `performance` governor with load and spawn recorded. Judge it only against `e3-budgets.md` (Land p95 ≤ 1.6 s absolute; ScopedCommit ≤ 1.5 ×).
7. **P-CUTOVER (WORK lane, later).** The evidence is the Event Store cutover commit (grant used once, nothing else allowed) plus phase 05's refusal tests (`test/git/cutover-grant.test.mjs`, green at `gate-261019-2107`). Pending because that cutover has not happened.
8. **Noncoding writing-land fixture.** Not written. It needs a writing noncoding workflow preset with an integrate step. This is the next unit.
9. **Docs not changed.** The packaging contracts already read "Frozen (V1) / Implemented". The future-tense "M10 switch point" sentence in `release-manifest.md` waits for landing. The program board row is outside my write scope.

## Decisions for the owner

1. **E4 on `linux-pgroup` hosts.**
   - **What is happening:** on a host without user namespaces (Ubuntu's default AppArmor setting), a hook child that drops the borrowed lock fd and calls `setsid` outlives the operation, and the receipt says `committed`.
   - **Cause:** the pgroup driver reports the group empty.
   - **Options:**
     - (a) `linux-pgroup` answers `Unknown` whenever a hook or filter ran. ScopedCommit, Sync and Land then return `containment-unproven` as `recovery-required`. This is safe, but every hook run on such hosts parks.
     - (b) Refuse hook-running operations without pidns, by name. This is clear, but it blocks those hosts.
     - (c) Keep the current behaviour and narrow the spec claim to "escapees holding the borrowed descriptor". There is no cost now, but the claim weakens.
   - **Recommendation:** (a). It matches §15 E4's text, and the failing test already encodes it.
   - **Scope:** the Process containment driver and the Git driver's drain check only.
2. **P-RELEASE protocol bump.**
   - **What is happening:** nothing refuses a stale global npm `fgos merge`.
   - **Options:**
     - (a) Bump the holder-lock route protocol to 2 in `src/holder-lock/protocol.mjs` and in the host route answer, in the landing release.
     - (b) Rely on the activation fence and quiesce scan alone, and drop the protocol-bump wording from §12 and phase 08 req 6.
   - **Recommendation:** (a). It is the only thing that stops an old Node writer that never goes through `fgctl`.
   - **Scope:** the landing release.

## Verification commands (focused, run here)

```sh
node scripts/git/e1-power-cut.mjs trace --root .fgos/runtime/tmp/e1-trace-<t> --ops 9
node scripts/git/p-space-resource.mjs resource --kind nofile|fsize|nproc|perm --root .fgos/runtime/tmp/pres-<t>/<kind>
node --test test/git/scoped-commit.test.mjs                 # 25 pass + new escapee test fails on linux-pgroup
node --test test/git/e2e-consumer-noncoding.test.mjs       # stops at bwrap confinement in this sandbox
bash -n scripts/git/e1-power-cut.sh scripts/git/p-space.sh scripts/git/p-release-checks.sh
```

Each command needs the addon env that `scripts/git-addon.mjs` produces (`FGOS_HOST_BIN` and `FGOS_ACTIVE_MANIFEST_PATH`). For workflow tests it also needs a private `FGOS_STATE_HOME` (mode 0700) and `FGOS_TEST_FIXTURE_ROOT`, because `/var/tmp` is read-only in this sandbox. Full `npm test` and E3 were not run, as the brief asked.

Status: DONE_WITH_CONCERNS
Summary: The E1, P-SPACE/P-RESOURCE, E4, V-CONSUMER and P-RELEASE proofs are scripted or tested, and the vector matrix and docs are done. The E1 order trace and the P-RESOURCE sweeps held here. E4 is violated on linux-pgroup, recorded as a failing test, and P-RELEASE has no protocol bump.
Concerns/Blockers: Everything that needs root, bwrap or the landing tree is listed above for the host. E3 full and P-CUTOVER are pending. Two owner decisions are open (E4 linux-pgroup, protocol bump).
Context refs:
- (none)
Expected outputs:
- (none)
