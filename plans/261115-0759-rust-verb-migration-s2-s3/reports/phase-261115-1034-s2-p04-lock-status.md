# Phase 04 report: `lock-status` native, and the first store-touching wiring proof

Branch `rust-verb-migration-program/s2-p04`, worktree `/home/vantt/projects/forgent-worktrees/rvm-s2-p04`, cut from the
integration head `203e44c26` (it had not moved at report time). Base release for parity: `rvm-s23-base` at `8d6a07c4c`.

## What changed

- `packages/holder-lock/rust/src/status.rs`: `collect(StatusRequest { fgos_dir, lock_root, run_instances, now_ms })`
  with Node's keys and order (unit-pinned), instances of every row from the registry template glob (no `LOCK_FILES`
  copy), problems judged rule by rule (foreign holder, predecessor record by kind, windows-job, hot records through
  `hot_record`, unknown-judge grace), beacon read. `scope.rs` exposes `registry()` and `entry()` inside the crate (one
  accessor, pushed alone as `4e98724b7` for phase 05).
- `packages/holder-lock/contracts/main-checkout-activity.v1.json`: beacon path, record fields, 18 vector rows. Checked by
  `status.rs` (Rust reader) and `test/runner/main-checkout-activity.test.mjs` (Node reader).
- `apps/fgos/src/wiring/run_dirs.rs`: the three run-directory listers (workflow runs, assignment runs with depth 16 and
  symlink barrier, open attempts) plus the per-row parameter sets; `test/rust-host/fixtures/run-dirs-vectors.json`
  (11 trees, expected lists generated from the real Node listers) read by `run_dirs.rs` tests and by the Node listers'
  own tests (`assignment-layout.test.mjs`, `adopt-client.test.mjs`) through `test/helpers/run-dirs-fixture.mjs`.
- `apps/fgos/src/wiring/lock_status.rs` (provider, descriptor, projector; a new file, the plan's file set names only
  `run_dirs.rs`, as `git_incidents.rs` of 02 is also absent from it), `catalog.rs` (`holder-lock.status`, read), annotation,
  `native: true`, regenerated routes (native 8 -> 9), `cli_projector.rs`, `main.rs`, `wiring/mod.rs`.
- Deleted: `src/runner/lock-status.mjs` and its `manifest.files` entry, the static import and arm in `bin/fgos.mjs`, the
  `ARM_STATIC_IMPORTS` line, `test/runner/lock-status.test.mjs`, three lock-status cases of `fgos-claim-2.test.mjs`, the
  one of `fgos-claim.test.mjs`, the `suite-baseline.json` row, the debt entry on the hot-record row.
- Cherry-picked from 02 (`257e6d07c`, now `4d9288044`): Node-grammar unknown-flag text and registry flag order.
  Added the lock-status unknown-flag unit case in `routing.rs`.
- `packages/holder-lock/rust/Cargo.toml`: `serde_json` gets `features = ["preserve_order"]` (step lead approved; flag for
  OPC). No `Cargo.lock` change. Effect on order: the shipped addon and host already unify `preserve_order`
  (`cargo tree -p fgos-node-addon -e features -i serde_json` shows it), so no shipped holder-lock or addon output
  changed order; only a standalone `cargo test -p fgos-holder-lock` now sees insertion order. No test pinned alphabetical order.

## Doors rows (exit of the port) and their negative cases

| Row | Patterns | Allowed | Negative case (fails as expected) |
|---|---|---|---|
| report the registry locks | `LOCK_FILES`, `existingInstances`, `export function collectLockStatus`, `pub fn collect(` | `status.rs` | `test/architecture.test.mjs` "door rows catch a second lock report ...": a `const LOCK_FILES`, an `export function collectLockStatus`, a Rust `pub fn collect(` in a scratch file each give 1 failure |
| main checkout activity beacon | `main-checkout-activity\.json` | `main-checkout-activity.mjs`, `status.rs`, `command-registry.mjs` (reasons given); `retiredBy` set | a `readFileSync(... 'main-checkout-activity.json')` in a scratch file fails |
| list run directories (twin) | the two Node lister exports, `export const runsRoot`, a `'workflow-runs'` literal ending a join, the three Rust function names | the three Node files, `run_dirs.rs`; `retiredBy` set | `export function listOpenAttemptDirs`, `join('workflow-runs')`, Rust `fn assignment_run_dirs` in scratch files fail |
| read and clear a hot mutex record (OPC's request) | adds `\.hot\b`; debt entry for `lock-status.mjs` removed | unchanged | `fs.unlinkSync(`${dir}/state.hot`)` and Rust `remove_file(dir.join("state.hot"))` fail; a comment naming `<resource>.hot` passes |

The `workflow-runs` pattern is the literal as the last join argument (`'workflow-runs')`), because the bare literal also
appears in `handoff-refs.mjs` and `confinement/resources.mjs` for unrelated path classification.

## Parity (host against base release `8d6a07c4c`, entry `node:<base>/bin/fgos.mjs` plus the staged env)

29 cases green, no `node` child of the host entry. Every case compares exit code, stderr and the envelope data
(`data_hash` included): all free, `--json`, extra positionals, `--dir` from outside and before the verb word, a
subdirectory, six refusals as exact bytes (`--bogus`, with value, `--dir=<path>`, `--json=true`, bare `--dir`, `--dir ""`),
no repository, worktree without `.fgos` (warning on stderr), worktree with its own, worktree named by `--dir`; held main
checkout, merge slot, machine lock and provider-account instance; foreign flock holder problem; run-scoped holders
(`advance` in a case and in `.bindings`, `recovery`, open `attempt`, closed attempt skipped); hot records (unparseable,
unjudgeable for 12 min on one resource and young on the other, dead); predecessor records (dead, alive, other host,
windows-job, not JSON, unknown version, no version); beacon (active, expired, numeric writer, corrupt, unknown version).
Run through `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs` with `FGOS_TEST_PARITY_BASE` set.

Accepted difference, one case (`lock-status-empty-placeholder-names-no-instance`, asserted separately in the runner):
a lock file with an empty placeholder (`merge-slot--.lock`, `dispatch-cwd--.lock`, `worker-session/.lock`) holding a
foreign process: Node's `LOCK_FILES` accepted it (3 problems), the registry template needs one character (host: none).
These names cannot be produced by the registry's callers. `lock-not-node-owned` and `status: 'not-node-owned'` are
unreachable (every row has a string path); pinned by a `status.rs` unit test over a synthetic row, not a parity case.

Runner note: `test/rust-host/verb-parity.test.mjs` is not on the `s2` integration branch yet (the step lead adds it).
I ran with a local copy (entry A the base's Node payload with its staged env set on the entry, entry B the host, six at a
time, B must start no `node`, plus the accepted-difference check). It is left untracked; the table name `lock-status`
is the only thing 04 adds to it. The `acceptedDifference` and `jsonIgnorePaths` case fields need the runner to read the
former.

## Wiring proof (`apps/fgos/tests/cli_tests.rs`, one test)

`lock_status_runs_the_doors_through_the_binary_and_starts_no_node`: a worktree without `.fgos` exits 0 with the
admission warning; `--dir ""` exits 4 with one `dir-invalid` record in the caller's store and no lifecycle record; a
project whose `eventStore` section is refused leaves exactly one `event-store-end-trigger` record on Linux (none
elsewhere), and with `FGOS_DISPATCH_DEPTH=1` also one `event-store-start-trigger`; a `node` wrapper on PATH that fails
when started was never started.
Observation for the step lead (not changed here): a `lock-status` from a linked worktree with no store also leaves one
`event-store-end-trigger` "refused" record, in the main checkout's store, even with no `eventStore` section.

## Retired tests -> owner now

| Retired test | Owner now |
|---|---|
| `lock-status.test.mjs` foreign flock holder / borrowed child / attempt member | `status.rs` `a_holder_that_is_not_a_fgos_process_is_a_problem...` (+ `origin.rs` classification, unchanged) and the parity case `foreign-holder-problem` |
| predecessor domain running / dead | `status.rs` `a_predecessor_domain_is_a_problem_unless_the_judge_proves_it_dead`, `a_predecessor_record_that_is_absent_unreadable_unknown...` |
| windows-job record | `status.rs` `a_windows_job_record_is_judged_by_the_contender_view...` |
| scan covers every registry row with a lock file (repo-config included) | `status.rs` `the_problem_scan_covers_every_repo_and_machine_row_of_the_real_registry` |
| fresh workspace and missing hot record report nothing | `status.rs` `a_hot_record_that_does_not_parse...` (absent half) and `a_row_whose_file_does_not_exist_is_free...` |
| hot record of a live process is no problem | `status.rs` `a_hot_record_of_a_live_holder_or_a_dead_one_is_no_problem` |
| hot record that does not parse | `status.rs` `a_hot_record_that_does_not_parse_is_a_problem_with_the_way_out` |
| hot record without a pid is unreadable | `hot_record.rs` read vectors (`hot-lock.v1.json` rows), already owning it |
| hot record in a foreign namespace, only after the grace | `status.rs` `a_hot_record_the_judge_cannot_place_is_a_problem_only_after_the_grace` |
| beacon age, window, active | `status.rs` `the_beacon_reads_as_none_corrupt_or_present_with_its_age` + contract vectors (`every_beacon_vector...`, Node `readBeacon answers corrupt or ok for every vector`) |
| `fgos-claim-2` nothing held, main held, merge slot instance | `status.rs` row tests (`a_row_whose_file...`, `a_held_fixed_row...`, `a_parametric_row...`) + parity `all-free`, `held-locks` + the `cli_tests.rs` wiring case for the CLI shape |
| `fgos-claim` worktree warning | `store_admission.rs` (rule, unchanged) + the wiring case |
| `fgos-claim-2` "registered as read-only" | **kept** in `fgos-claim-2.test.mjs`: the plan names `fgos-manifest.test.mjs` as its owner, but that file has no `lock-status` assertion, and the behaviour (registry flags) still exists |

Not deleted though the plan listed it as owner of the fence-after-status case: `fgos-lock-fence.test.mjs` is phase 05's.

## Gates

- `cargo fmt --all --check`, `cargo clippy -p fgos-holder-lock -p fgos -p fgos-host-runtime --all-targets -- -D warnings`: clean.
- `cargo test -p fgos -p fgos-holder-lock -p fgos-host-runtime -p fgos-node-addon`: all green (fgos bins 100, cli_tests wiring case, holder-lock lib 48 and integration suites).
- `cargo check --locked --target x86_64-pc-windows-msvc|aarch64-apple-darwin -p fgos-holder-lock -p fgos`: clean.
- `node scripts/export-command-selectors.mjs --check`: clean. Census regenerated; scan 0 undeclared; `git-driver` 1, `sandbox-door` 2 (unchanged); `rust-test` 161 -> 163 (the wiring test and the status tests).
- `node scripts/run-tests.mjs` with HERDR_*/CLAUDE* unset: verb-parity (29 cases), fgos-claim-2, fgos-claim, fgos-lock-fence, main-checkout-activity, holder-lock-checks, command-routes, architecture (58), git-mutation-census, assignment-layout, adopt-client, assignment-enumerator-guard, operation-choice, unknown-flag-rejection, subcommand-flag-drift, fgos-manifest, workflow-runner-lock-status, hot-lock-tx, hot-lock-contract: pass.
- Not run: `test/rust-host/help-routes.test.mjs` fails here before and after (needs a `--release --workspace` addon build in my target; heavy, ask first). `fgos lock-status --help` answered correctly by hand. No `npm test`, no `cargo test --workspace`.

## Proposed `## [Unreleased]` line

None required: no user-visible change (same data, same text, same exit codes). Optional, if the step lead wants the one
difference named: "`fgos lock-status` no longer lists a lock file whose name has an empty placeholder (`merge-slot--.lock`) among its problems; no registry caller writes one."

## Concerns

1. The `s2` runner and `routing.rs` Node-grammar helper are not on the integration branch; my branch carries 02's commit as a
   cherry-pick (`4d9288044`); it will be patch-identical when 02 lands (rebase will drop it). The `catalog.rs` count line
   (`CATALOG.len()`) will conflict with 02's (16 -> 18 there, 17 here): take the sum, 19.
2. `run_dirs.rs` reads `closed.json` existence through symlinks like Node (`exists`), and the open-attempt lister walks a
   symlinked `assignments` root while the recovery lister refuses it: both pinned by fixture rows.
3. Error texts of a beacon file that cannot be read (EISDIR) differ: Node exits 1 with the raw errno text, the host exits 1
   as `fgos: error: invocation failed: EISDIR: illegal operation on a directory, read`. Not a parity case.
4. Latency (exit criterion 9) is not measured here; the close phase measures with a release host.

Status: DONE_WITH_CONCERNS
