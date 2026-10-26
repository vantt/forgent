---
phase: 04
title: "Observe plumbing deletions: one flag parser, one provider arm, dead fallbacks and sources, time-based tests"
status: pending
depends_on: [02, 03]
parallel: "after 02 (same crate) and after 03 for requirement 10 only (the Windows helper in fgos-durable-file); before 05 (shares apps/fgos/src/wiring/metrics_sources.rs and packages/run-result)"
effort: ~1.5d
net_size: "Node 0 / Observe Rust src −335 / apps/fgos −40 / run-result −10 / tests −80 — estimates"
---

# Phase 04 — Observe plumbing deletions

## Context

Arbitration §2.2 "Plumbing", §3 (the 31 s test), §4.2 item 3, §4.4 (RT-15). Simplicity seat D11, D13–D16, D18, D19, F17 (= D14), F18. No behaviour is added; the one behaviour change is that every `metrics` verb parses flags the same way (`--k=v` everywhere, unknown flags and bad numbers are named errors, `--json` is a no-op).

## Requirements

1. **D16 + RT-15, one flag parser:** the 11 hand-written loops (`metrics_cli/{outcomes.rs:15,discussions.rs:15,eval.rs:12,entropy.rs:112,snapshot.rs:22,runs.rs:20,case.rs:36,case.rs:98,coverage.rs:12,faults.rs:18,harness.rs:25}`) move onto `flags.rs` (created in phase 02). Each verb declares its flags once. `--json` is accepted and ignored by every Observe verb (today `fgos metrics runs --json` fails with `unexpected argument for metrics runs: --json`, verified 10-24). The change lists, in the commit body, every input whose answer changed (for example `--since=<v>` now accepted by `harness`, `faults`, `case`; `faults --limit abc` stays an error; `friction rank --limit abc` became an error in phase 02).
2. **D13, one provider arm:** the two descriptors (`provider.rs:15-45`) are built by one function; the two providers (`:47-110`, `:112-168`) become one `ObserveProvider` that dispatches on the operation id; `ObserveFrictionProvider::new` and its `Default` (`:118-138`, no caller) go; the two projector arms (`apps/fgos/src/cli_projector.rs:31-79`) become one `"observe.metrics" | "observe.friction"` arm; `apps/fgos/src/main.rs:108-109` and `:233-245` (providers registered at `:234`, `:242`) follow. Route ids and `command-routes.json` (`:335`, `:619`) are unchanged.
3. **F16 (part of D13):** the three `#[allow(dead_code)]` (`apps/fgos/src/wiring/metrics_sources.rs:8,18`, `friction_sources.rs:5`) go; the work source becomes a required argument (it is always `Some`, `metrics_sources.rs:19-22`), so the three "work source not available" paths (`metrics_cli/entropy.rs:126`, `outcomes.rs:37`, `snapshot.rs:36`) and the `Arc<Option<…>>` field (`provider.rs:51`) go; tests that passed `None` build a stub source.
4. **D11:** `compute_runs` reads the bucket from `category` only: the `classification.outcome.category` fallback (`scorecard.rs:241-245`) and the `else if let Some(cls) = classification` branch (`:270-296`) go. The only producer always writes `category` (`packages/run-result/rust/src/lib.rs:663-666`, `run_observation`). The `verdict` read from `classification.assessment` (`:246-250`) stays.
5. **D14 (F17):** `UnitSummarySource`'s `ObservationSource` impl (`packages/run-result/rust/src/unit_summary.rs:139-147`), its struct and constructor (`:17-25`), the re-export (`lib.rs:4`) and the list entry (`apps/fgos/src/wiring/metrics_sources.rs:12`) go; no `compute_*` reads a `unit-summary` observation. `scan_unit_summaries` stays (discussions use it through the scanner callback, `provider.rs:53`). `run-result` is T5's crate: T5 is told (hand-off row).
6. **F18:** `metrics runs` collects only the `run-result` source (`metrics_cli/runs.rs:95-101` loops over every source, then `compute_runs` keeps `source == "run-result"`, `scorecard.rs:214`).
7. **D15 remainder:** the one-line wrappers `scorecard.rs:146-148` and `sources/claude_transcripts.rs:60-62` (`parse_iso_secs`) and `time.rs:45-47` (`parse_timestamp_millis`) go; callers call the civil-time functions directly.
8. **D18:** in `packages/observe/rust/tests/store_lock_multiprocess.rs`, retire `a_write_longer_than_the_old_expiry_is_not_stolen` (`:162-178`: a 31 s fixed sleep proving the absence of the expiry removed in `8549e77f1`; a kernel lock has no expiry, `store_lock.rs:1-5`); reshape `a_taker_times_out_after_five_seconds_on_a_long_holder` (`:131-146`) onto `acquire_store_lock_within` with a 300 ms wait (the 5 s value is a constant, not a behaviour). Owners of what remains: holder-lock `tests/multiprocess.rs:62` `wait_ms_times_out_and_nothing_is_kept` (a live holder makes a taker time out, nothing kept) and `:46` `a_sigkilled_holder_frees_the_lock_at_once`; Observe keeps `a_taker_waits_for_a_holder_that_releases` (`:117`) and `processes_sharing_a_writer_id_never_interleave_snapshot_lines` (`:180`). This answers the arbitration's open question: no holder-lock test asserts "past 30 s", because no expiry mechanism exists to test (`rg -n -i "expir|ttl" packages/observe/rust/src/store_lock.rs packages/holder-lock/rust/src/driver/flock.rs` finds only the doc comment that says there is none).
9. **D19:** retire `test/rust-host/observe-store-lock.test.mjs:50-65` "the Rust command takes the lock right after a Node holder is killed" (the kernel lock does not depend on the holder being Node; owner: Observe `store_lock_multiprocess.rs:148` `a_sigkilled_holder_frees_the_lock_at_once` and holder-lock `multiprocess.rs:46`). Test 1 (`:34`, the cross-door wiring proof) stays.
10. **RT-06, Windows shard door** (moved here from phase 02 so both crates use one helper): the door's non-Unix branch drops `create_new(true)` (`eval_journal.rs:206-220`, now in `shard.rs`) and opens through `fgos_durable_file::open_no_reparse` (added in phase 03), so a writer's second record on Windows no longer fails with AlreadyExists and a reparse point is refused. Observe gains a path dependency on `fgos-durable-file` (an L0 leaf). Proof: `cargo check` on `x86_64-pc-windows-msvc`; the helper's own refusal is reasoned in its doc comment (no Windows runner on this machine). <!-- Red Team: scope F2, security F3 -->
11. **Flag literals and the registry:** each verb file keeps its own `"--k"` literals and passes them to `flags.rs` (`test/cli/subcommand-flag-drift.test.mjs:262-282,330-345` reads them per file); every flag a verb newly accepts (for example `--since` on `harness`, `faults`, `case`) is added to its schema in `src/cli/command-registry.mjs` and to `packages/host-runtime/contracts/command-routes.json` in the same commit, so the drift test passes both ways. `--json` is already declared in many route flag lists (`command-routes.json`, e.g. the `observe.friction` entry from `:335`); re-grep per verb and add it where missing. <!-- Red Team: assumptions F6 -->

## Files

- **Create:** none.
- **Modify:** `packages/observe/rust/src/{provider.rs,lib.rs,shard.rs,scorecard.rs,time.rs,sources/claude_transcripts.rs,metrics_cli/*.rs,friction_cli.rs}`, `packages/observe/rust/Cargo.toml` (`fgos-durable-file`), `src/cli/command-registry.mjs` and `packages/host-runtime/contracts/command-routes.json` (newly accepted flags only), `Cargo.lock` (regenerated), `packages/observe/rust/tests/store_lock_multiprocess.rs`, `apps/fgos/src/{main.rs,cli_projector.rs,wiring/metrics_sources.rs,wiring/friction_sources.rs}`, `packages/run-result/rust/src/{unit_summary.rs,lib.rs}` (line 4 only), `packages/run-result/rust/tests/unit_summary.rs` (5 uses of `UnitSummarySource::new()`, `:3,66,292,471,525,570` → `scan_unit_summaries(..).observations`), `test/rust-host/observe-store-lock.test.mjs`, census (regenerated).
- **Delete:** none as files.
- **Tests to retire:** the 31 s test (owner: holder-lock `multiprocess.rs:62`, behaviour "no expiry" is structural); Node `observe-store-lock` test 2 (owners above); the `test_compute_runs` cases fed with observations that carry no `category` (`scorecard.rs:807` onward; behaviour removed — the producer never emits them).

## Steps

1. Flag parser for every verb, verb by verb, running that verb's tests after each.
2. Provider/descriptor/projector merge; work source required.
3. D11, D14, F18, D15 remainder.
4. Time-based test retirement (D18, D19).
5. Census; `git diff --stat` check; commits `refactor(observe): …`, `test(observe): …`.

## Validation (focused)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p04-target
cargo test -p fgos-observe
cargo test -p fgos-run-result
cargo test -p fgos --bin fgos
node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/rust-host/observe-store-lock.test.mjs','test/cli/subcommand-flag-drift.test.mjs','test/cli/fgos-verb-help-json.test.mjs','test/observe/observe-contracts-fixtures.test.mjs'])"
```

Land gates: `cargo check -p fgos-observe -p fgos-run-result -p fgos -p fgos-durable-file --all-targets` on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`; `cargo clippy` on the same with `-D warnings`; `node scripts/git-one-door-scan.mjs --root .` count stays 5.

## Success criteria

- `cargo test -p fgos-observe --test store_lock_multiprocess` wall time < 3 s (was 35 s, baseline §3).
- `fgos metrics runs --json` answers; `rg -n "while i < (req\.)?args\.len\(\)" packages/observe/rust/src` → 0 hits.
- `rg -n "UnitSummarySource|ObserveFrictionProvider|allow\(dead_code\)" packages apps/fgos/src` → 0 hits.
- Measured Δ reported.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The flag parser changes an answer some caller relies on | M × M | Only callers: the doctor (`metrics coverage`, no flags) and people; every changed answer listed in the commit; `test/cli/subcommand-flag-drift.test.mjs` run |
| The merged provider changes the outcome contract name | L × M | Contract names derive from the operation id; `test/cli/fgos-verb-help-json.test.mjs` and the projector unit tests pin them |
| T5's `run-result` edited by T3 | L × L | Deletion only (no caller); T5 told |

## Rollback

Revert the phase's commits. No on-disk or contract format change; the CLI accepts a superset of today's inputs except the inputs listed as now refused (each was silently mis-parsed before).
