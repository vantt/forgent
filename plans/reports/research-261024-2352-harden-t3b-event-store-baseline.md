# HARDEN T3 part 04b baseline: Event Store

Main SHA `c7522c86d42401cf9b9bca8339a4a5c5cd932534` (branch main), measured 2026-10-24 23:52 to 2026-10-25 00:20 (Asia/Saigon) on the second machine (24 cores, ext4). Activated release `sha256:874af08f3ce5b660ee4bbbf0bdd7d8a7c38af553fedef54be7a5712c9026087d`. Load average at the start 0.7 (1 min); it rose to 11 to 15 for about one minute during the first `cargo test` and was 2 to 5 for the read-path runs. Read-only work except this report; the throwaway clone and the private Cargo target directory were removed at the end, and `git status` in the main checkout is identical to its state at the start. One side effect is disclosed in section 2.

## Summary

| Item | Measured value |
|---|---|
| Rust crate `packages/event-store/rust` | src 7 757 lines (31 files); tests 9 007 lines (32 files, 3 are helper dirs); example 26 (plan said 14 376 total; now 16 790) |
| N-API addon namespace | `packages/git/node-addon/src/event_store.rs` 779 lines (one file; the addon is shared with Git) |
| Host routes in `apps/fgos/src/**` | none: `events` is a `legacy-cli` route (`packages/host-runtime/contracts/command-routes.json:332`), served by Node |
| Node around it | 1 243 lines in 21 files (facade 417, `src/state` consumer files 258, verbs 410, setup 126, detached child 32); plus 723 lines of benchmark scripts in `scripts/event-store/` |
| `src/state/events.mjs` and `src/state/legacy-event-git-adapter.mjs` | no longer exist (removed by `9f23f7438`, `53523a917`) |
| Node tests | 25 files / 134 tests in `test/event-store` (3 045 lines) plus 6 files / 25 tests in `test/state` and `test/setup` |
| Rust tests | 182 pass, 1 ignored (10 000-segment qualification), 30 suites; `cargo test -p fgos-event-store` 42.4 s wall (build already warm) |
| Node tests run (5 files) | 63 pass, 0 fail, 18.4 s wall |
| Read path, `fgos list` (activated release) | p50 843 ms, p95 898 ms, 11 git children, 1 node process; fixed cost of `fgos help` is 37 ms |
| Read path with a sync due | 2 970 ms once (the read verb ran an opportunistic fetch) |
| Write path (benchmark, 1 session) | store increment p50 27.9 ms, p95 31.5 ms; 0 spawns inside the gate; 3 fsyncs per append (one append had 4); about 4 git children per mutation outside the gate |
| Write path, 20 sessions | the benchmark FAILED on this run: a worker hit `hot-lock-timeout` after 5 000 ms (details in section 2) |
| Doctor rows of the store | 10 rows, all passing; 3 setup fixes; 1 config default |
| Whole `fgos doctor --json` | 148 rows, 12 failing (none is an Event Store row), 57 s wall |
| `cargo check --all-targets` | `x86_64-pc-windows-msvc`: 11 test targets fail to compile (24 error sites), 1 warning in the lib; `aarch64-apple-darwin`: clean |
| Open backlog rows | 0 open rows name the Event Store (`p-txiatvrts4`, the one that does, is `done`); `p-djrgdijd2c` is Git WAL, not store |
| Open follow-ups in the ES plan | 3 open and 1 closed (section 6) |

Three facts matter most for the council. First, a read verb pays for the store lifecycle: with a sync due, one `fgos list` took 2.97 s against 0.84 s warm. Second, the Windows test targets fail exactly as the 04b input says, and the macOS target is clean. Third, a fresh clone of a migrated repo cannot read: every read verb ends with the opaque `event-store-io: NotFound` until `.git/fgos/events` exists (section 2).

## 1. Lines of code

Counted with `wc -l` over `*.rs` and `*.mjs`.

### Rust crate `packages/event-store/rust/src` (7 757 lines)

| Module | Lines | Module | Lines |
|---|---|---|---|
| `read.rs` | 1 027 | `checkpoint.rs` | 210 |
| `legacy_import.rs` | 895 | `promote.rs` | 194 |
| `seal.rs` | 713 | `locks.rs` | 164 |
| `sync.rs` | 618 | `identity.rs` | 164 |
| `walk.rs` | 459 | `refs.rs` | 161 |
| `open_read.rs` | 345 | `publish.rs` | 146 |
| `export.rs` | 342 | `registry.rs` / `layout.rs` | 130 / 130 |
| `diagnostics.rs` | 307 | `legacy.rs` | 121 |
| `append.rs` | 297 | `receipt.rs` | 106 |
| `envelope.rs` | 281 | `cursor.rs` | 104 |
| `order.rs` | 276 | 8 smaller files (`reconcile`, `fsio`, `fence`, `rotate`, `commit_memo`, `refspec`, `errors`, `lib`, `validation`) | 488 |

### Rust tests `packages/event-store/rust/tests` (9 007 lines)

Largest: `seal_publication.rs` 987, `reader_review_regressions.rs` 706, `append_recovery.rs` 573, `cursor_incremental.rs` 542, `reader_seal_stress.rs` 541, `reader_support/mod.rs` 476 (helper), `sync_review.rs` 359, `kill_append.rs` 353, `read_memo.rs` 352, `v_event.rs` 331, `registry_identity_layout.rs` 323. Helper directories (`common`, `reader_support`, `support`, `sync_support`) total 1 001 lines. `examples/distribution_digest_audit.rs` is 26 lines. Test to source ratio is 1.16.

### Addon and host

| Area | Path | Lines |
|---|---|---|
| N-API namespace | `packages/git/node-addon/src/event_store.rs` (calls `fgos_event_store::{read, seal, sync, promote, legacy_import, locks, identity}`) | 779 |
| Addon example | `packages/git/node-addon/examples/e3_fixture.rs` | shared |
| Host route | none in `apps/fgos/src`; `fgos events` is routed `legacy-cli` to `src/cli/command-registry.mjs:1553` | 0 |
| Host wiring that is not a route | `apps/fgctl/tests/git_wal_activation_gate.rs` mentions events; `packages/git/rust/src/{publication,scoped_commit,driver,wal}.rs` carry the Git side of the Publication port | shared with Git |

### Node (1 243 lines)

| Path | Lines |
|---|---|
| `src/event-store/native.mjs` 196, `seal-coalescing.mjs` 68, `consumers.mjs` 55, `config.mjs` 49, `maintenance.mjs` 45, `index.mjs` 4 | 417 |
| `src/state/work-event-store.mjs` 110, `consumer-event-gate.mjs` 102, `event-log.mjs` 46 | 258 |
| `src/verbs/events/migrate.mjs` 257, `rebuild.mjs` 41, `export.mjs` 38, `seal.mjs` 31, `parity.mjs` 18, `context.mjs` 13, `status.mjs` 6, `sync.mjs` 6 | 410 |
| `src/setup/event-store-checks.mjs` 90, `event-store-fixes.mjs` 36 | 126 |
| `src/cli/detached-child.mjs` (the seal child spawner) | 32 |
| `scripts/event-store/` (`v-spawn-bench.mjs`, `power-loss-driver.mjs`, `store-increment-worker.mjs`, `settle-host-proof.mjs`, `forge-probe.sh`, `power-loss.sh`, `settle-fault.py`) | 723 |

Not counted here but part of the consumer side: `src/state/replay.mjs` (827 lines, the Work fold) and the lifecycle trigger code in `bin/fgos.mjs` (`EVENT_STORE_LIFECYCLE_VERBS`, `handSealsToChild`, `opensEventStore`, about lines 4806 to 4835).

### Tests

| Group | Files / tests / lines |
|---|---|
| `test/event-store/*.test.mjs` | 25 files, 134 tests, 3 045 lines (largest: `work-gate` 535 lines / 23 tests, `facade` 222 / 13, `door` 247 / 5, `migrate-cutover-grant` 191 / 8, `topologies` 174 / 6, `store-hardening` 173 / 10, `work-conflicts` 171 / 7) |
| `test/state/event-log.test.mjs`, `events-legacy-absence.test.mjs` | 2 files, 7 tests, 102 lines |
| `test/setup/event-store-checks.test.mjs`, `event-store-fixes.test.mjs` | 2 files, 18 tests, 213 lines |
| `test/githooks/event-layout.test.mjs`, `test/git/cutover-grant.test.mjs`, `test/git/native-load.test.mjs` (shared with Git) | 3 files, 18 tests counted by `it(`/`test(` at line start, 593 lines; two files use another test syntax and count 0 |
| Rust | 182 tests (7 unit tests in the lib, 175 in 29 integration suites) |

Test counts come from a grep for `test(`/`it(` at line start, so they are approximate. The TEST plan row quoted 70 Node tests in 19 files against 150 Rust; the current figures are 134 in 25 and 182.

## 2. Hot paths

### Read path (activated release, real repo, `</dev/null`)

Method: `fgos <verb>` timed with `date +%s%N`, 12 runs per verb, p50 and p95 by nearest rank; git children counted from `strace -f -e trace=execve`. Verbs read before running: `list`, `show`, `events status` are read verbs; `events status` and `list` also run the lifecycle trigger (see below).

| Verb | p50 | p95 | min | max | git children | bwrap | node |
|---|---|---|---|---|---|---|---|
| `fgos help` (fixed cost) | 37 ms | 42 ms | 15 | 42 | 0 | 0 | 0 |
| `fgos list` (269 work items) | 843 ms (868 on the first batch) | 898 ms | 796 | 898 | 11 | 12 | 1 |
| `fgos show tsk-5ui` | 777 ms | 964 ms | 728 | 964 | 11 | 12 | 1 |
| `fgos events status` | 633 ms (644 first batch) | 653 ms | 596 | 653 | 16 | 17 | 1 |

Timeline of one `fgos list` from `strace -ttt`: shim and activation lookup 27 ms, Rust host until `node` starts 240 ms (266 ms from the call), Node startup and imports 193 ms (first probe at 459 ms), then the 11 git children between 468 and 664 ms (one `ls-tree -r` or `cat-file --batch` takes about 100 ms of that, the others 6 to 10 ms each; `bwrap` adds about 3 ms per git). The git calls of `list` are: 2 `var`, 1 `config --list`, 1 `config`, `rev-parse`, `for-each-ref`, 2 `cat-file --batch`, `cat-file -t`, `ls-tree -r`, `cat-file --batch` again. `events status` adds `remote get-url`, a second `for-each-ref`, `symbolic-ref`, `rev-parse HEAD^`, and `worktree list`. So about 0.45 s of every read is host plus Node start before any store work, and the store's own git work is about 0.2 s.

**Side effect disclosed.** `list` and `events status` are in the lifecycle set (`bin/fgos.mjs:4806-4812`), whose end trigger runs `store.sync({opportunistic: true})` when the last attempt is older than `eventStore.sync.intervalSec` (300 s, `src/event-store/maintenance.mjs:11-12`). During my measurement this ran at least three times against `https://github.com/vantt/forgent` (the `lastFetch` time moved from 1792860822 to 1792861846 and later). The store holds no unpublished events, so nothing was pushed; the effect on the real repo is updated `refs/fgos/remotes/origin/*` fetch results only, and both refs still point at `7e456df67…`. I did not know `list` could sync before running it; the task rule says never run a verb that syncs, so this is a deviation to be aware of.

A read with a sync due: one run at 2 970 ms against 840 ms, so the opportunistic fetch (about 2.1 s of network and `rev-list`) sits on a read verb's critical path once per 300 s per clone. The next run after it took 1 120 ms.

### Write path

I could not exercise `fgos edit`/`move` in a throwaway clone. A fresh clone of the repo, with `refs/fgos/*` fetched, `fgos:dev` working (the host builds in 19 s, dev profile), failed as follows:

1. Every read verb: `fgos: event-store-io: NotFound: No such file or directory` until `.git/fgos/events` exists (strace shows the failed open of that directory). The error does not name the path.
2. After creating `.git/fgos/events/locks`, `fgos list` works, but `fgos edit tsk-5ui --priority 10001` fails with `event-store-io: Git: git-wal-unreadable: repository-identity-changed`. Creating `.git/fgos/git/{operations,compacted}` and a `.fgos/locks/activation.lock/TOMBSTONE` (the way the benchmark builds its fence) did not change it. I did not find the cause; `Wal::open_existing` compares the canonical common dir and `dev:ino`, and the clone path is canonical and owned by the user. This is unexplained, not diagnosed.

Because of that, the write path is measured with the repository's own instrument, `scripts/event-store/v-spawn-bench.mjs --work-gate --strace` (fresh fixture repos, 200 Work mutations per row through the real consumer gate, 1 000 seeded items of 8.46 MB). It runs the working-tree addon in the dev profile (unoptimized) under `strace -f`, so absolute times are pessimistic against the activated release.

| Sessions | Elapsed (200 mutations) | Store increment p50 / p95 | Stages p50 (read in gate / append / fold / cache write) | Spawns in gate | Git execs per steady mutation | Append fsyncs | Convoy wait p50 / p95 / max | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | 42.4 s | 27.9 / 31.5 ms | 0.9 / 26.1 / 1.1 / 17.9 ms | 0 | 4.0 | 3 (one 4) | 0.4 / 0.5 / 6 ms | PASS |
| 10 | 13.3 s | 23.5 / 43.1 ms | 2.4 / 18.4 / 1.9 / 24.1 ms | 0 | 3.9 | 3 (one 4) | 164 / 1 119 / 1 828 ms | PASS |
| 15 | 13.8 s | 30.5 / 38.1 ms | 2.4 / 25.1 / 2.0 / 23.0 ms | 0 | 4.0 | 3 (one 4) | 370 / 1 902 / 4 224 ms | PASS |
| 20 | not finished | n/a | n/a | n/a | n/a | n/a | n/a | FAIL: worker 8 threw `hot-lock-timeout` ("timed out after 5000ms acquiring state ... held by pid 1136259") at `src/state/hot-lock.mjs:195` |

The 20-session row is the acceptance row of the benchmark (200 mutations within 60 s and p95 increment at most 50 ms). The 15-session convoy already shows a 4.2 s maximum wait, so a 5 s bound is within one step of the 20-session result. This run is a dev-profile build under strace and one sample; whether the activated release passes is not known. I did not rerun it.

Not measured: a CLI-level `fgos move` or `add` wall time (blocked as above), and per-stage cost of the detached `events seal` child. The code path is read: every Work command hands its seal to one detached child (`bin/fgos.mjs:4821-4825`, `src/cli/detached-child.mjs`).

## 3. Tests

Rust: `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t3b-baseline-target cargo test -p fgos-event-store` (private ext4 target, build already warm after a 9.9 s compile): 182 passed, 0 failed, 1 ignored, 30 suites, 42.4 s wall (36 s user, 36 s system) at a load of about 12 to 15 at the start. Slowest suites by their own reported time: `reader_seal_stress` 6.85 s, `shared_machine_id` 6.30 s (one test), `order_kahn` 4.50 s, `walk_certified` 3.71 s, `three_clones` 3.43 s, `v_event` 2.62 s, `seal_publication` 2.05 s, `kill_append` 2.00 s, `sync_review` 1.98 s. The ignored test is `reader_seal_stress.rs:170`.

Node: five files through `runChosenTests` with `PATH=$HOME/.cargo/bin:$PATH`: `test/event-store/facade`, `work-gate`, `migrate`, `verbs`, `store-hardening`. Result: 63 tests, 63 pass, 0 fail, 18.4 s wall (15.2 s test time). Node files not run: the other 20 in `test/event-store`, `test/state`, `test/setup` (inventory in section 1).

## 4. Doctor rows and setup fixes

One `fgos doctor --json </dev/null` (57 s wall, 148 rows). The ten Event Store rows are registered in a loop at `src/setup/registrations.mjs:6155-6158`; all bodies live in `src/setup/event-store-checks.mjs`. The config default is registered at `registrations.mjs:6151`.

| Row id | Body (file:line) | Status now | Message now |
|---|---|---|---|
| `event-store-git-version` | `event-store-checks.mjs:49` | pass | git 2.53.0 (minimum 2.53.0), probes pass |
| `event-store-open-root` | `:50` | pass | `.git/fgos/events`, flock, kernel guarantees |
| `event-store-machine-id` | `:63`, `:71` | pass | `fg-server2-jdp2bv` |
| `event-store-refspec` | `:55` | pass | fetch mapping and pinned URL match |
| `event-store-unsealed` | `:72` | pass | oldest unsealed age 0 s (fails above 3 600 s, warns above twice `seal.intervalSec`) |
| `event-store-integrity` | `:76` | pass | verified 2 refs; 0 deferred events |
| `event-store-sync` | `:77` | pass | no unpublished events |
| `event-store-native-addon` | `:45` | pass | facade exports present |
| `event-store-legacy-layout` | `:64` | pass | fence, ref and sealed tree match; no retired paths |
| `event-store-orphan-branches` | `:86` | pass | none |

Setup fixes (`registrations.mjs:6152-6154`, bodies in `src/setup/event-store-fixes.mjs`): `event-store-machine-id` (`:18`, mints through the Identity door), `event-store-refspec` (`:21`, installs the fetch mapping through Git's repository config), `event-store-lock-dirs` (`:28`, mode 0700). `events migrate` calls all three at `src/verbs/events/migrate.mjs:177`. The 12 failing rows in the same doctor run belong to other components: `executor-skills-installed`, `tool-registry-configured`, `work-step-vocabulary`, `run-attempts-stuck`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted`, `active-release-matches-checkout`, `git-worktree-recovery`, `git-mutation-one-door`. No row currently reports the missing open-root directory of a fresh clone as a named condition (section 2, item 1).

Repo state read from `fgos events status`: the repository is migrated (`refs/fgos/legacy` and `refs/fgos/remotes/origin/legacy` at `7e456df67…`, tracked fence `.fgos/events`), `storeId` is null, both streams (`project`, `project:porting`) have `lastSeq` 0 and no unsealed events, and no machine event ref exists yet (`machineRefShared` false). So the real repo's store has not yet taken a Work write since the cutover; Work state is folded from the legacy mirror on every read (269 items).

## 5. Windows and macOS

Commands: `cargo check -p fgos-event-store --all-targets --target <triple>` with a private Cargo target directory.

`aarch64-apple-darwin`: exit 0, no warning from the crate (only 3 lifetime warnings in the vendored `arraydeque`).

`x86_64-pc-windows-msvc`: exit 101. Lib alone (`cargo check -p fgos-event-store --target x86_64-pc-windows-msvc`) passes with one warning.

| Where | Problem |
|---|---|
| Warning, lib | `src/export.rs:45`: `let mut builder` does not need to be mutable on Windows (the `builder.mode` call at `:46-49` is `#[cfg(unix)]`) |
| Lib test target | `src/refs.rs:116:23` (`use std::os::unix::fs::PermissionsExt` inside `mod tests`, `cfg(test)` at `:113`) and `src/refs.rs:127:53` (`Permissions::from_mode`) |
| 10 integration test targets (24 error sites, E0433 `os::unix` missing, E0599 `from_mode`, E0599 `ExitStatus::signal`) | `tests/append_recovery.rs:332,335,347`; `tests/kill_append.rs:4,38`; `tests/reader_support/mod.rs:31,32,59,70`; `tests/seal_cas_race.rs:32,35`; `tests/seal_publication.rs:46,49`; `tests/sync_review.rs:179,219`; `tests/sync_support/mod.rs:48,49,65,66,82`; `tests/v_event.rs:281,314` |
| Targets that fail to compile | `append_recovery`, `kill_append`, `offline_sync`, `reader_seal_stress`, `seal_cas_race`, `seal_publication`, `shared_machine_id`, `sync_review`, `three_clones`, `v_event`, and the lib test |

`offline_sync`, `reader_seal_stress`, `shared_machine_id` and `three_clones` import the helper modules above (`reader_support`, `sync_support`, or direct `os::unix`), so the helper files are the common cause for those. The 04b input said `append_recovery` and `sync_review` fail and the lib has an unused `mut` at `export.rs:45`; all three statements hold, and the real count is 11 failing test targets.

## 6. Open backlog rows and open WORK follow-ups

`docs/backlog.md`: no open row (status other than `done`) names the Event Store, `events migrate`, `refs/fgos` or the store's spec terms.

| Row | Status | Relation |
|---|---|---|
| `p-txiatvrts4` (an attached HEAD costs two git children per Event Store read) | done | closed; the read still runs `symbolic-ref`, `rev-parse HEAD^` in `events status` (section 2), so its effect on `status` was not verified here |
| `p-djrgdijd2c` (finished Worktree and Refs WAL chains are never compacted; this checkout had 322 chains / 2.2 MB, now 445 operation entries) | open | Git WAL, but it shares the WAL directory the store's seal uses |

Open follow-ups in `plans/261018-0945-event-store-fgos-event-store/plan.md` ("Hand-offs received for after the cutover", lines 115 to 123):

| Item | Status | What |
|---|---|---|
| H33 | open | delete the legacy `work.friction` fence (`run_lazy_migration`, `legacy_friction.rs`, `fgos friction migrate`, doctor row `observe-friction-migrated`); about -780 lines; one release after the cutover |
| H31-A test | open | owning proof that a migrated write admission with a `refs/fgos/remotes/<remote>/legacy` mirror differing from the pin is refused with `event-store-refspec-missing`, next to `tracked_fence_without_fetched_legacy_is_refspec_missing` in `tests/reader_review_regressions.rs` (04b input) |
| Import stray shards | open | `fgos events import-legacy --file <shard>`; due 2026-10-25, then one release. The verb is not in the command registry (`src/cli/command-registry.mjs:1553-1563` lists only sync, status, seal, export, migrate) |
| Dead union settlement | open | `declareStoreFiles` in `src/runner/merge.mjs` still settles `merge=union` `.fgos` paths; remove or name its remaining reach (due 2026-10-25) |
| Land pre-cutover worker branches | closed (dropped) | proofs retired as behaviour removed |

## 7. Node and Rust duplicates noticed (file:line only, not judged)

- Config defaults and validation: `src/event-store/config.mjs:5-27` (`EVENT_STORE_DEFAULTS` and minimums) against the registry fixture `packages/config/contracts/fixtures/registry-defaults.v1.json:55-108` and `packages/config/rust/src/bundle.rs:18,23` (Rust knows an `eventStore` section); the Rust store takes `interval_sec` as an argument at `packages/event-store/rust/src/seal.rs:587`.
- Sync-due and seal-due policy in Node: `src/event-store/maintenance.mjs:11-12` and `:40` beside Rust `seal_if_due` (`packages/event-store/rust/src/seal.rs:587-590`).
- Unsealed-age thresholds in the doctor row: `src/setup/event-store-checks.mjs:73-74` (3 600 s, twice `seal.intervalSec`) beside the Rust `oldest_unsealed_age_sec` used at `seal.rs:590`.
- Damaged-history error codes listed by hand in Node: `src/state/work-event-store.mjs:16`, whose codes come from the generated result-code registry (`packages/event-store/rust/src/errors.rs:2`).
- Refspec overlap logic in Node: `src/setup/event-store-checks.mjs:22-31` (`overlaps`) beside Rust `packages/event-store/rust/src/refspec.rs:9-29` (`publication_fetch_mappings`, `ensure_refspecs`).
- Legacy event decoding and parity: Node fold and diff in `src/verbs/events/migrate.mjs:29-58` and `src/verbs/events/parity.mjs:4-18` beside Rust `packages/event-store/rust/src/legacy.rs:34-82` and `legacy_import.rs`; Node parses legacy lines too at `src/state/event-log.mjs:25-46` (`parseEventLines`).
- Work fold in Node: `src/state/replay.mjs` (827 lines) with the cache-validity rule at `src/state/work-event-store.mjs:30-38`, beside Rust `packages/work-state/rust/src/event_reader.rs:167` and `work_source.rs` (the event-streams contract is read from both: `work-event-store.mjs:12`, `event_reader.rs:167`).
- Node lock-rank guards: `src/event-store/native.mjs:12-27` (`ranksOf`, `outsideGate`: rank 60 and depth refusals) beside Rust `fgos_event_store::locks::validate_seal_context` (`packages/git/node-addon/src/event_store.rs:270`).

## Gaps

- No CLI-level write-path timing (blocked in the clone, section 2); the benchmark numbers are a dev-profile build under `strace`.
- The 20-session benchmark row failed once and was not rerun; its cause on the activated release is unknown.
- Doctor per-row timing is not in `--json` (the plan lists it as a proposed addition); the whole run takes 57 s.
- Node test counts are grep approximations; only five Node files were run.

Status: DONE_WITH_CONCERNS
Summary: Baseline for the Event Store at `c7522c86d` is recorded: LOC, read path (p50 843 ms, 11 git children), benchmark write path, 182 Rust and 63 Node tests green, ten passing doctor rows, a clean macOS check and 11 failing msvc test targets, open follow-ups and Node/Rust duplicate sites.
Concerns/Blockers: `fgos list` and `events status` triggered opportunistic fetches from the real repo's remote (refs only, nothing pushed); a CLI-level write path could not be measured because a fresh clone refuses writes with `git-wal-unreadable: repository-identity-changed` (cause not found); the 20-session work-gate benchmark row failed once with a hot-lock timeout on a dev-profile build under strace.
