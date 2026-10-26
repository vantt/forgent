# HARDEN T3 part 04a, phase 04: Observe plumbing deletions

Lead report, 2026-10-24 (Asia/Saigon). Branch `harden/t3a-p04` on track tip `89b56c7f9`. Commits: `0fe674599` (`refactor(observe)`: flags, provider, deletions, Windows open, census), `9551ad2e8` (`test(observe)`: lock-test reshape and retirement, census).

## What was deleted or merged

- **One flag parser (req 1, 11):** the 11 hand loops in `metrics_cli/{outcomes,discussions,eval,entropy,snapshot,runs,case x2,coverage,faults,harness}` now call `metrics_cli::parse_flags` (a 10-line wrapper that names the verb over `flags.rs`); each verb keeps its own `"--k"` literals. No flag was newly accepted except `--json`, so neither `command-registry.mjs` nor `command-routes.json` changed (the spec's "`--since` newly accepted by harness, faults, case" was wrong: harness and faults already read `--since`, case never did; `--json` is already in every route list). Drift test green.
- **One provider (req 2):** `ObserveProvider` + `ObserveWiring` (one `Arc` shared by both descriptors, same pattern as Identity's `for_descriptor`); one `observe_descriptor` const fn builds both descriptors; one projector arm `"observe.metrics" | "observe.friction"`; `main.rs` registers both in one loop. `ObserveFrictionProvider::new`/`Default` gone. Route ids, contract names and `command-routes.json` unchanged.
- **Required work source (req 3):** `dispatch(.., &dyn WorkObservationSource, ..)`, the three "work source not available" paths, the `Option` field and the three `allow(dead_code)` gone.
- **D11 (req 4):** `compute_runs` reads `category` only; the classification fallback branch is gone; the `verdict` read stays.
- **D14 (req 5):** `UnitSummarySource` (struct, ctor, `ObservationSource` impl, re-export, list entry) deleted; `scan_unit_summaries` stays.
- **F18 (req 6):** `metrics runs` collects only sources with id `RUN_RESULT_SOURCE` (new const in `scorecard.rs`, also used by the two `source == "run-result"` checks).
- **D15 (req 7):** `scorecard::parse_iso_secs`, `claude_transcripts::parse_iso_secs`, `time::parse_timestamp_millis` removed; callers (observe and, necessarily, `run-result`) call `civil_time` directly.
- **Req 8, 9:** see tests below. **Req 10:** shard door's Windows open is `fgos_durable_file::open_no_reparse` (no second helper); Observe gained the `fgos-durable-file` dependency; `boundary_test.rs` allowlist extended by that one crate.

## Inputs whose answer changed (also in the commit body)

`--json` accepted by every Observe metrics verb (`metrics runs --json` failed before); `--k=v` accepted by harness, faults, case (case used to ignore it, then report the flag missing); case open/close/list refuse unknown flags and extra positionals (used to ignore them); a value that starts with `--` is taken as the value (discussions, eval, runs refused it as "missing value"); `faults --limit abc|0`, `runs --by nobody`, `case close --interventions abc`, blank `--question`/`--harness`/discussions values keep their named errors. Error text changed to `metrics <verb>: <reason>` for unknown option / missing value / stray positional (no test or doc outside the crate matched the old text; one run-result test assertion updated).

## Answer to phase 02's open question 1

`UnsafeShard::Report` stays: eval still needs it. I did not move eval to `Fail` because phase 04's file list has no `eval_journal.rs` and the line-0 report is part of eval's recorded `invalid` output (`tests/eval_journal_test.rs`), a behaviour that would change, not plumbing. One-mode move is a possible follow-up (needs eval's owner proof reshaped); not done. Question 2 left as instructed.

## Tests retired or reshaped, with owners

- `scorecard::tests::test_compute_runs`: rewritten over `category` records (the producer never emits records without it); the `classification`-only fallback cases are retired (behaviour removed); one case keeps a record with only a classification and asserts it counts as unclassified. Also asserts by-adapter and by-role totals it did not before.
- `store_lock_multiprocess::a_taker_times_out_after_the_acquire_timeout_on_a_long_holder` -> `a_taker_times_out_on_a_holder_that_never_releases` with a 300 ms wait via `acquire_store_lock_within`. The 31 s test was already retired in phase 02 (owner holder-lock `multiprocess.rs::wait_ms_times_out_and_nothing_is_kept`). Suite wall time 1.0 s (< 3 s; was 35 s).
- Node `observe-store-lock` test 2 (Rust command takes the lock after a Node holder is killed) retired; owners: Observe `store_lock_multiprocess::a_sigkilled_holder_frees_the_lock_at_once`, holder-lock `multiprocess.rs::a_sigkilled_holder_frees_the_lock_at_once`. Test 1 (cross-door wiring) stays.
- `run-result/tests/unit_summary.rs`: five `UnitSummarySource::new()` uses moved to `scan_unit_summaries(..).observations`; the discussion fixture still runs through `metrics_cli::dispatch` with the transcript barrier and now a work-store barrier stub (`UnavailableWork`, panics if read).
- Added one proof: `metrics_cli::tests::every_verb_reads_flags_one_way_json_is_a_no_op_and_bad_input_is_named` (wiring of the changed inputs above; why no existing test: `flags.rs` tests prove the grammar, nothing proved the verbs use it). Stub work sources in `coverage.rs` tests, `layout_fixture.rs` and `unit_summary.rs` replace `None`.

## Measured delta (file level, `89b56c7f9..HEAD`, includes inline `#[cfg(test)]`)

Observe `src/` -460 (inline test change inside: `test_compute_runs` about -130, new verb test about +60, so non-test src is about -390 against the -335 estimate; the 13-line wrapper `parse_flags` and the 90-line wiring/provider are included); Observe `tests/` +3; run-result src -18 (estimate -10); run-result tests +34 (stub work source, `layout_fixture` cfg gating); apps/fgos -27 (estimate -40); Node tests -16. Net tests across Rust and Node about +20 against the -80 estimate: the estimate assumed removing tests that phase 02 had already removed.

## Gates

- `cargo test -p fgos-observe -p fgos-run-result -p fgos-durable-file` green; `cargo test -p fgos --bin fgos` green; `cargo test -p fgos-observe --test store_lock_multiprocess` 1.0 s.
- Node: `observe-store-lock`, `subcommand-flag-drift`, `fgos-verb-help-json`, `observe-contracts-fixtures` 36/36 green (observe-store-lock test 1 takes 4.3 s, the real 4 s lock wait). `help-routes.test.mjs` cannot run here (needs `target/release/libfgos_node_addon.so`, a release workspace build I did not make); `observe-doctor-checks` not run.
- `cargo clippy -p fgos-observe -p fgos-run-result -p fgos -p fgos-durable-file --all-targets -- -D warnings` clean.
- `cargo check ... --all-targets` on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: nothing from observe, run-result, durable-file. Windows still shows warnings in crates this phase does not own: `fgos-run-supervisor` (gate.rs, supervise.rs), `fgos-event-store` export.rs:45, `apps/fgos/tests/cli_tests.rs` (4 unused variables, untouched); macOS: `fgos-run-supervisor` terminal.rs:251. I fixed the two pre-existing Windows unused-import warnings in `run-result/tests/layout_fixture.rs` by gating its unix-only imports and stub.
- `git-one-door-scan --write-census`: 5 undeclared; census committed with each commit.
- Success greps: `while i < args.len()` finds only `flags.rs` (the one parser); `UnitSummarySource|ObserveFrictionProvider` 0 hits; `allow(dead_code)` 0 hits in `apps/fgos/src` and the three touched crates.

## Deviations

1. `run-result/src/lib.rs` edited beyond "line 4 only": its `parse_timestamp_millis` import and one call, because that wrapper is deleted (D15). Hand-off row to T5 should say so.
2. `run-result/tests/layout_fixture.rs` and `boundary_test.rs` edited (not in the file list): forced by the required work source and by the new dependency.
3. Eval stays on `UnsafeShard::Report` (above).
4. Flag-schema registry untouched (no flag newly accepted).
5. I did not rewrite `metrics runs` rejection of `--by` values that start with `--`; they are taken as values now.

## Open questions

1. Move eval to `Fail` and drop the line-0 report? Needs `eval_journal.rs` and its tests in scope.
2. Should `parse_flags`' `metrics <verb>:` prefix also cover `case`'s separate `interventions` number error (currently unprefixed)? Cosmetic.

## For phase 06 (user-visible)

CHANGELOG: every metrics verb accepts `--json` and `--k=v`, unknown flags and extra positionals are named errors (case no longer ignores them); error text `metrics <verb>: ...`. Spec: Observe shard door opens Windows shards through the durable-file no-reparse open. For T5: `run-result` lost `UnitSummarySource`, imports `civil_time` directly.

Status: DONE_WITH_CONCERNS
