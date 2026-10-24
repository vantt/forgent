# HARDEN T3 part 04a, phase 02: Observe shard door, friction fixes, thin client

Lead report, 2026-10-24 (Asia/Saigon). Branch `harden/t3a-p02` on main `7f38f56a9`. Commits:
`c6323532c` (red tests, from phase 01), `89a27480d` (`fix(observe)`: Rust, census, lock test), `9ddf1a5ce` (`refactor(observe)`: Node client, doctor row, regenerator).

## Red to green

Red run on `c6323532c` before any change: `cargo test -p fgos-observe --lib -- friction:: case_journal:: metrics_cli::snapshot::` gave 8 failed, 5 passed, each on the assertion the red report names.

| Red test | Red (assertion seen) | Green now | Where it lives |
|---|---|---|---|
| 1a bad UTF-8 line skipped | `friction list must succeed: "stream did not contain valid UTF-8"` | green | owned by `shard::tests::a_bad_line_is_named_and_the_good_lines_around_it_still_read` (invalid UTF-8, not JSON, over 1 MiB, blank line) plus `friction::tests::a_record_with_an_unparsable_stamp_is_skipped_by_every_reader` (reader wiring); the friction-level copy is not landed |
| 1b invalid line never re-migrates | `record appended the migrated legacy record again` (2 vs 1) | green | kept in `friction.rs`; `record`/`resolve` lost the `legacy_sources` argument, `migrate` assertion unchanged |
| 2 torn tail healed | `record appended onto the torn line was swallowed: ["tsk-good"]` | green | owned by `shard::tests::a_torn_last_line_is_healed_before_the_next_append_or_refused_untouched` (heal and refuse); friction copy not landed |
| 3 migrate takes the lock | `migrate appended while another holder had the store lock` (1 vs 0) | green | kept in `friction.rs` |
| 4 same instant or later settles | `work:tsk-equal stays unsettled` (1 vs 0) | green | kept in `friction.rs` |
| 5a symlinked friction shard | `record wrote through a symlinked shard` | green | kept in `friction.rs` as the one wiring proof of a non-eval store |
| 5b symlinked case shard | `open_case wrote through a symlinked shard` | green (all four stores go through the door) | not landed; owners `shard::tests::a_symlinked_shard_is_refused_for_append_and_read_and_its_target_never_changes` and `tests/eval_journal_test.rs::symlink_writer_shard_never_changes_external_target` |
| 5c symlinked snapshot shard | `snapshot wrote through a symlinked shard` | green | not landed, same owners; `store_lock_multiprocess::processes_sharing_a_writer_id_never_interleave_snapshot_lines` still proves snapshot appends through the door |
| `test_friction_record_resolve_lifecycle` (flaky on main) | passed in my red run (flaky 4/6 per red report) | 10 consecutive `friction::` runs green, `cargo test -p fgos-observe` 3 runs green | `friction.rs`; fixed by instant comparison plus a strictly increasing `time::now_iso` |

## Tests retired or replaced, with the new owner

- `store_lock_multiprocess::a_write_longer_than_the_old_expiry_is_not_stolen` (31 s, proved an expiry removed in `8549e77f1` is absent): retired. Owner of "a live holder excludes a taker": `packages/holder-lock/rust/tests/multiprocess.rs::wait_ms_times_out_and_nothing_is_kept`; kill frees: `::a_sigkilled_holder_frees_the_lock_at_once`; Observe wiring: `store_lock_multiprocess::a_taker_times_out_after_the_acquire_timeout_on_a_long_holder`. Observe `cargo test` went from about 35 s to 6 s.
- `a_taker_times_out_after_five_seconds_on_a_long_holder` renamed and bounded by `ACQUIRE_TIMEOUT` (4 s) instead of 4.5 to 8 s.
- `friction::tests::test_friction_lazy_migration_and_deduplication` rewritten as `migrate_imports_legacy_records_once_and_resolved_ones_stay_settled`: migrates through `migrate`, because `record` no longer migrates. It retires with D17.
- `shard::tests::test_shard_path_and_read_all` (tested the deleted `read_all_json`): replaced by the door tests above.
- Red tests 1a, 2, 5b, 5c not landed, owners above. `eval_journal_test::concurrent_process_writers_leave_complete_shards`: dropped `FGOS_NOW` and the per-record `ts == pinned` assertion (the plan said it asserts complete shards only; it also asserted the pinned stamp). Complete-shard assertions kept.
- `test/rust-host/observe-store-lock.test.mjs`: waited-time floor 4500 to 3500 ms for the 4 s wait (file not on the phase list; forced by decision 7 of the plan).

## What changed (behaviour)

- `shard.rs` is the one door: per-component real-directory preflight, no-follow regular-file open (read+append on one descriptor, `fstat` checked), `TornTail::{Heal, Refuse}`, `encode_line` (compact JSON, 1 MiB cap), `append_lines` (one `write_all`, `sync_all`), `read_store` (bounded per-line read, never aborts on a line, `UnsafeShard::{Fail, Report}`), `warn_skipped`. Eval's hardened pair moved there unchanged in behaviour; eval passes `Refuse` and `Report`.
- Friction: no legacy read on `record`/`resolve`; `friction migrate` locks, fails closed on an unreadable store, one in-memory append; instants comparator for `show`, `rank`, `list --since`; `friction-invalid-input:` prefix on every input refusal; `flags.rs` grammar; `SubjectKind::as_str`.
- `FGOS_NOW`, `FGOS_CALLER_PID`, `FGOS_GIT_HEAD`: no reads left (`rg` over packages, apps, src, bin, scripts: 0 hits). `time::now_iso` is the one stamp.
- Lock wait 4 s; error text derives from the constant.
- Root rule (writes only, see measurement): `observe-root-unresolved:` on resolver error.
- Node: client 194 to 79 lines (2 exports), doctor row probes `friction rank --limit 1` through `invokeHost`, regenerator pins volatile fields after asserting order.

## Measurements

Root rule (step 7), scratch git repository, debug build of `fgos`, 40 runs each, same machine under load, A/B by toggling only the resolve:

| | without | with |
|---|---|---|
| `friction record` p50 / p95 / max | 2.6 / 2.9 / 3.7 ms | 22.8 / 24.7 / 29.0 ms |
| `friction rank --limit 1` p50 / p95 / max | 3.2 / 4.6 / 4.7 ms | 27.2 / 31.5 / 31.7 ms |

The resolve is about +20 to +25 ms a call (three Git spawns: floor, config, formats), over the +10 ms gate. Big-lead answer 4 decides this case: **the root rule applies to writing verbs only** (friction `record|resolve|migrate`, metrics `case open|close`, `eval record`, `snapshot`; `friction_cli::writes`, `metrics_cli::writes`); reads keep the requested root. Debug figures overstate CPU but the cost is process spawns, so a release run would still trip; I did not build a release (several minutes on a shared machine).

Lock budget (requirement 8): whole `friction record` max 29 ms (pre-lock process start plus resolve, post-lock admit, read, write, fsync together), far inside the 0.8 s budget (4.8 s minus 4 s); no stop needed.

`strace -f -e trace=openat` on one `friction record`: 0 opens of any `events*.jsonl`, one open of the friction shard.

Real data: a copy of the main checkout's friction, evals and snapshots stores (copied to a temp root; the real repo untouched) reads through the new door with `rank` and `list` and no skip warning.

## Measured size (non-blank lines, HARDEN code outside tests, vs `7f38f56a9`, red-test commit included in tests)

| Line | Estimate | Measured |
|---|---|---|
| Observe Rust src | -50 (+-40) | **+52** (door +216, flags +75, time +24, provider +27, entropy +12, mod +10; friction -79, eval -189, case -26, snapshot -12, store_lock -7). Over the band by about 60: the door is larger than the sum of the three appenders it deletes, because it also holds the directory preflight, torn-tail policy and bounded reader that only eval had |
| Observe Rust tests | +190 | **+403** (friction +236 incl. 4 red tests kept, 4 new rules, migrate rewrite; shard +87; provider +57; flags +33; time +7; tests dir -19) |
| Node src and scripts | -120 | **-102** (client -115, doctor row -10, regenerator +23) |
| Node tests | n/a in table | +91 (client wiring test +82, doctor +16, lock -7) |

Defects the added code pays for: shard.rs (symlinked directories and shards followed, one bad byte stopping a store, torn line swallowing the next record); flags.rs (silent drops of `--limit abc`); provider.rs (writes landing in the wrong store from a linked worktree: resolver outcomes and tests); time.rs (same-millisecond stamps, B-O4). Per the big-lead answer 1 the binding rule is the layer's net, not these per-phase ceilings.

## Gates

- `cargo test -p fgos-observe`: 48 lib + 26 eval + store-lock multiprocess + fixture + others, all green, 3 runs in a row. `cargo test -p fgos --bin fgos`: 22 passed.
- `cargo check -p fgos-observe --all-targets --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`: 0 warnings from Observe (the `arraydeque` third-party warnings and run-supervisor / event-store warnings belong to other crates; `-p fgos` checks show only those and a test-file warning in `apps/fgos/tests/cli_tests.rs`, untouched here).
- `cargo clippy -p fgos-observe --all-targets -- -D warnings`: exit 0.
- `node scripts/git-one-door-scan.mjs --root . --write-census`: 5 undeclared sites (unchanged); regenerated census committed in `89a27480d`; re-run after the last commit leaves the tree clean.
- `node scripts/regenerate-observe-fixtures.mjs`: no diff under `test/fixtures/observe`.
- Node (through `runChosenTests` only): `test/observe/friction-client.test.mjs`, `test/setup/observe-doctor-checks.test.mjs` (incl. the new refused-shard case against the real staged host), `test/rust-host/observe-store-lock.test.mjs`, `test/observe/observe-contracts-fixtures.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`: all pass. Wider friction users `test/runner/loop`, `fgos-merge`, `retrospective-doors`, `fgos-return`, `state/store`, `fgos-approve-2`, `state/replay`, `setup/checks`, `cli/command-registry`: 448 of 448 pass (that batch took 4 min 45 s). A batch of `e2e/self-improve-loop`, `e2e/pr-gate` and `scripts/run-tests` once failed pr-gate (c) and printed a leak-check ERROR; the same two e2e files re-run alone and together pass 61 of 61 twice, and `git status` shows no stray files, so I treat it as a flake of running `scripts/run-tests.test.mjs` concurrently; not reproduced.
- Not run, as instructed: `cargo test --workspace`, `npm test`.

## Deviations from the phase text (each with its reason)

1. **`~` legacy stamps count as +1 ms, not stripped.** Stripping makes the migrated resolve equal to its record, and equal instants never settle in a `pid-*` shard, so legacy resolved records written by a process without a session id would turn unsettled again. `ts~` means "just after", so +1 ms keeps the on-disk meaning and avoids that regression.
2. **`time::now_iso` is strictly increasing within a process** (about 12 lines). Without it a `record` then `resolve` in one millisecond in a `pid-*` shard never settles (D-T3A-14), which is exactly the flaky lifecycle test. Cross-process stamps never collide in one pid shard.
3. **Windows branch of the door has only the metadata check** (a check-then-open race, comment in `open_regular`). Eval's `create_new(true)` Windows branch would have made every second friction append fail on Windows once friction went through the door. The no-reparse open from `fgos-durable-file` replaces it in phase 04; I did not create a second helper.
4. **`append_lines` takes encoded lines (`encode_line`)**, not `&[Value]`, so each caller keeps its own serialisation byte order (case and eval records are typed structs) and eval can check the 1 MiB cap before it creates directories.
5. **`read_store` returns shard-name then line order; callers sort by instant** (friction, snapshots) or keep their timestamp sort (case, eval).
6. Root rule on writes only (measurement above, big-lead answer 4).
7. Eval's directory preflight now covers `.fgos` and `observe` for every store, so a project whose `.fgos` is itself a symlink is refused by all stores (eval already refused it).

## Residuals and not done

- Friction, case and snapshot take the store lock before the door's directory check (eval checks first), so a symlinked `.fgos` still lets the lock file be created in the link's target before the refusal; no data is written there. Fixing it is a one-line call per writer; not done to keep the phase to its list (listed under proposed additions).
- Windows no-reparse hardening, `metrics` verbs onto `flags.rs`: phase 04. Spec, `docs/platform/holder-lock/spec.md` (5 s to 4 s) and CHANGELOG: phase 06.
- No release-build timing; the activation-time re-measure is the big lead's loop step 8.
- `metrics_cli/snapshot.rs` still reads cases with `.ok()` (a refused case store drops the active case silently); phase 04's list.

## For phase 06 (user-visible changes)

`friction record|resolve` no longer migrate and no longer read the legacy log; `friction migrate` locks and fails closed; symlinked store directories or shards refused by friction, cases, evals, snapshots; a bad line is skipped with `fgos: warning: observe <store>: skipped <file>:<line>: <reason>` on stderr and a torn last line is healed (evals still refuse it); `--limit abc`, unknown flags and missing values are errors; input refusals start with `friction-invalid-input:`; `list --since` and settlement compare instants; a friction record with an unparsable stamp is skipped; writing verbs resolve the trusted main root (`observe-root-unresolved:`); lock wait 4 s; `FGOS_NOW`, `FGOS_CALLER_PID`, `FGOS_GIT_HEAD` no longer read; `observe-host-resolvable` probes a real read (description changed: docs `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:333`, `docs/specs/observe.md` doctor line).

## Hand-offs

WORK must be told before this merges to main: `friction record|resolve` no longer run the lazy migration; `friction migrate` locks and fails closed (plan "Hand-offs"). Identity owner: RT-21 unchanged (`pid-<N>` shard names).

## Proposed additions (not built)

1. Door-first order in friction, case and snapshot writers: call `shard_path` before `acquire_store_lock` (as eval does) so a symlinked `.fgos` never gets a lock file. Real defect, tiny, cost about 3 lines.

## Unresolved questions

1. Phase 04 should confirm that the `UnsafeShard::Report` mode (eval only) stays, or eval should move to `Fail` and drop the line-0 convention; both pass the current tests.
2. Should reads in a linked worktree also use the main root once T9 moves the host's own walk? (Writes already do.)

Status: DONE_WITH_CONCERNS
Summary: All routed red tests are green through one shard door; Rust src is +52 lines against an estimate of -50 (+-40) and tests +403 against +190, named above.
Concerns: root rule applied to writes only after measuring +20 to +25 ms a call (big-lead answer 4); Windows door is metadata-check-only until phase 04; two small deviations (`~` as +1 ms, monotonic `now_iso`) explained above.
