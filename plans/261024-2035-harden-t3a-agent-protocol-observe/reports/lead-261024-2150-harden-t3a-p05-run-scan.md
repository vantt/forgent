# HARDEN T3-04a phase 05: run scan typed read and coverage row

Branch `harden/t3a-p05` (from d1ed75808). Commits: `7bb298a8f` perf(run-result), `b37e83709` refactor(doctor). Status DONE.

## Measurements (this machine, linux, release host built from the worktree; 11 runs, first dropped, so n=10; real repo `.fgos/assignments`, 535 run dirs, read-only verbs)

Load average before runs 4.9 -> 3.0 (1 min); after runs 1.6 -> 1.6.

| Verb | before min/p50/max (s) | after min/p50/max (s) |
|---|---|---|
| metrics coverage | 1.019 / 1.021 / 1.043 | 0.166 / 0.169 / 0.172 |
| metrics runs | 1.018 / 1.031 / 1.052 | 0.164 / 0.170 / 0.173 |
| metrics harness | 1.550 / 1.563 / 1.589 | 0.694 / 0.705 / 0.722 |

Target p50 <= 0.35 s for coverage: met (0.169). `harness` keeps ~0.53 s that is not the run scan (other sources); not in this phase.
Debug host, coverage, 3 runs each (load ~1.4): 11.60 s -> 1.63 s.
Doctor row `observe-run-coverage` (node, 10 runs, release host, load ~1.9): after 182 ms median (host call + 17 ms directory scan). The removed admission scan costs 454 ms median on the same tree, so the row was about 1.5 s before (derived: host 1.02 s + 17 ms + 454 ms; not run as a whole, the old code no longer exists in the tree). Row passes on this repo: "run coverage matches: directories Node 535, host 535; recent tolerance 0".

## Byte identity

`metrics coverage`, `runs`, `harness` `--json` outputs, before binary vs after binary, on the real tree: identical after dropping the `generated_at` line (data_hash equal: coverage 39c915f6..., runs 93c89a0f..., harness 90195271...). Debug coverage identical too. Note `runs`/`harness` outputs are aggregates, so per-record parity is carried by the fixture tests (explicit null, non-object) plus the 531-record equality of the aggregates.

## Changes

- `scan_assignment_runs`: `std::fs::read` + `serde_json` through a `DeserializeSeed`/visitor keeping 19 `RECORD_KEYS` (re-grepped from `run_observation` and `derive_legacy_outcome`) including explicit `null`, skipping others with `IgnoredAny`; non-object top level passes through; trailing garbage still `unparseable` (`de.end()`).
- Doctor row: admission comparison and message parts removed; host call, accounting checks, directory-count comparison and recency tolerance kept. `projectRunEligibility`, `isRfc3339Instant`, `RFC3339_INSTANT` deleted (`rg` over src, test, scripts, docs, bin: 0 hits).

## Tests

Added (owner `layout_fixture.rs`): `run_scan_keeps_explicit_nulls_and_does_not_reclassify_non_object_results` (`contract: null`, `classification: null`, `executorId: null` with `executor`, top-level array -> `no-run-id`, never `unparseable`; passes on the old and the new code), `settlement_time_admits_only_valid_rfc3339_instants`.
Retired:
| Test | Owner after |
|---|---|
| assignment-layout 5 eligibility tests (precedence/RFC3339, classification, owner metadata+duplicates, lexical order, Unicode order) | `layout_fixture.rs` `timestamps_come_from_results_and_unsettled_attempts_are_accounted`, `absent_and_malformed_results_have_distinct_accounting`, `result_and_assignment_symlinks_are_never_read`, `an_invalid_duplicate_does_not_hide_the_first_valid_record`, `owner_settlement_requires_regular_parseable_metadata_without_changing_results`, `owner_settlement_duplicates_keep_component_lexical_order_before_windowing`, `unicode_duplicate_winner_uses_utf8_component_order`, plus the new settlement grammar test |
| doctor "run coverage independently detects admission mismatch..." | behaviour removed (decision 31); parity owned by `shared_layout_fixture_and_consumers_have_identical_run_sets` |
Eligibility lines dropped from the fixture test and the depth-boundary test; their layout/walk assertions kept.

Results: `cargo test -p fgos-run-result` all green (12 layout tests, 3 lib); `cargo test -p fgos-observe --lib -- metrics_cli::coverage` ok; Node: assignment-layout, observe-doctor-checks, assignment-enumerator-guard 31/31 pass.

## Gates

clippy `-D warnings` clean (fgos-run-result, fgos-observe); `cargo check -p fgos-run-result --all-targets` on x86_64-pc-windows-msvc and aarch64-apple-darwin: no warnings from our crates (only the known `arraydeque` lifetime ones); one-door scan 5 undeclared, census regenerated and committed (7/7 lines).

## Measured Δ (vs d1ed75808, excluding plans)

Rust src +100 (spec est. +40); Node src -47 (est. -45); Node tests -116 (est. -110); Rust tests +67 (est. +20). Defects paid for by the added Rust: null/non-object parity (red-team 5) needs a visitor rather than a typed struct (~+60 over a plain struct).

## Deviations

1. Added `settlement_time_admits_only_valid_rfc3339_instants` (not in the spec): the retired Node test was the only proof of the grammar edges (hour 24, +24:00, no zone, empty fraction, padded, lower-case, leap days); no Rust test owned them. Rust agrees with the retired twin on all nine cases (no divergence found).
2. Census had to be committed with the Rust commit (pre-commit census check), so the two commits are Rust+census, then Node.
3. Per-record byte identity not available from the aggregate verbs; stated above.

## Docs / phase 06 input

CHANGELOG/spec lines: doctor `observe-run-coverage` no longer compares admission counts (message shows directories and recent tolerance only); `metrics coverage|runs|harness` about 6x faster on a large assignment tree.
