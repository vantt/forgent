---
phase: 05
title: "Run scan typed read in run-result; observe-run-coverage drops its Node admission twin (owner Q2 (b))"
status: pending
depends_on: [02, 04]
parallel: "with phase 03; after 02 (registrations.mjs) and 04 (run-result, wiring)"
effort: ~0.5d
net_size: "Node −45 / run-result Rust +40 / tests −90 (Node −110, Rust fixtures +20) — estimates"
---

# Phase 05 — Run scan typed read and the coverage row

## Context

Arbitration §2.2 "Run scan cost" (S-1, taken in T3 although `run-result` is T5's crate: one function, no contract change), §3 (prefix-only read rejected), owner decision 31 (Q2 = (b)). Speed seat S-1/S-2: `metrics coverage|runs|harness` cost 1.0–1.4 s, nearly all of it `serde_json::Value` parsing of 531 `result.json` files (295 MB, ≈ 71 % of it the unread `evidence` key); a small typed `from_slice` measured ≈ 7.5× faster. The doctor row parsed the same data again in Node (≈ 0.5 s).

## Requirements

1. **Typed read (S-1):** in `scan_assignment_runs`, the parse at `packages/run-result/rust/src/lib.rs:568-576` (`serde_json::from_reader(BufReader::new(file))` into `Value`) becomes `std::fs::read` + `serde_json::from_slice` through a small `DeserializeSeed`/visitor that:
   - on a top-level **object**, keeps exactly the wanted keys **including explicit `null`** in a `serde_json::Map` and skips every other key with `IgnoredAny` (so `evidence` is never built);
   - on any **non-object** top level, yields that `Value` unchanged (today it reaches `derive_legacy_outcome` and is `corrupt/corrupt-record`, `lib.rs:196-202`; accounting must not move it to `unparseable`).
   
   The wanted keys come from a re-grep of every `get(..)` in `run_observation` (`:638-690`) and `derive_legacy_outcome` (`:191-330`), at least: `runId`, `unitRunId`, `settledAt`, `timestamp`, `executorId`, `executor`, `status`, `confinement`, `durationMs`, `usage`, `classification`, `adapter`, `role`, `contract`, `outcome`, `reason`, `confidence`, `runtime`, `agentClaim`. The resulting `Value::Object` goes to the unchanged `run_observation` and `derive_legacy_outcome`. New fixture cases in the owning test (`packages/run-result/rust/tests/layout_fixture.rs`): `contract: null`, `classification: null`, `executorId: null` with `executor` present, a top-level array. Acceptance: `fgos metrics runs` and `metrics coverage` output byte-identical before and after on this repository's real results (run both builds through `npm run fgos:dev`, `diff`). <!-- Red Team: failure F6, assumptions F2 -->
2. **No size cap, no prefix read:** a cap is owner addition A2 (not chosen, decision 32); a prefix read relies on key order with no writer contract (arbitration §3).
3. **Doctor `observe-run-coverage`, Q2 (b):** `checkObserveRunCoverage` (`src/setup/registrations.mjs:5968-6018`) keeps the host call, every accounting check (`:5971-5994`) **and the directory-count comparison** (Node `scanAssignmentLayout` `runDirsSeen` against the host's, with the recency tolerance `:5955-5966`; ≈ 25 ms, speed seat S-3). Only the admission half goes: `projectRunEligibility(layout)` (`:6002`) and the eligible-count comparison and its message parts (`:6011-6017`). Decision 31 dropped the Node **run-admission** scan; the directory comparison detects a host that enumerates no directories, which is not admission, so it stays (no condition lost without an owner decision). <!-- Red Team: assumptions F8 -->
4. **Node admission twin deleted:** `projectRunEligibility`, `isRfc3339Instant`, `RFC3339_INSTANT` (`src/runner/dispatch/assignment-layout.mjs:96-138`; T5's file, T5 told). `scanAssignmentLayout`, `listAssignmentRuns`, `findRunDir` stay (other callers).
5. The shared fixture `test/fixtures/run-layout/expected.json` becomes the one proof of admission (owner decision 31): Rust `packages/run-result/rust/tests/layout_fixture.rs:62` `shared_layout_fixture_and_consumers_have_identical_run_sets` against it; Node's `test/runner/assignment-layout.test.mjs:42` keeps its layout half (directory candidates, symlinks, lookup) and drops its eligibility lines (`:48-50`); the depth-boundary test (`:107`) drops its eligibility assertion (`:117-118`), keeping its walk assertions.

## Files

- **Modify:** `packages/run-result/rust/src/lib.rs` (`scan_assignment_runs` only), `src/setup/registrations.mjs` (coverage row only), `src/runner/dispatch/assignment-layout.mjs`, `test/runner/assignment-layout.test.mjs`, `test/setup/observe-doctor-checks.test.mjs`, census (regenerated).
- **Delete:** code listed in requirements 3–4.
- **Tests to retire** (each with its owner after the change):

| Test (file:line) | Owner after |
|---|---|
| `test/runner/assignment-layout.test.mjs:201` "eligibility uses actual settlement precedence and admits only valid RFC3339 instants" | `packages/run-result/rust/tests/layout_fixture.rs:285` `timestamps_come_from_results_and_unsettled_attempts_are_accounted` and `:462` `owner_settlement_requires_regular_parseable_metadata_without_changing_results` |
| `:236` "eligibility classifies missing, invalid, nonregular and symlink results separately" | `layout_fixture.rs:554` `absent_and_malformed_results_have_distinct_accounting`, `:316` `result_and_assignment_symlinks_are_never_read` |
| `:255` "eligibility ignores nonregular owner metadata and reserves duplicate identity for eligible results" | `layout_fixture.rs:462`, `:427` `an_invalid_duplicate_does_not_hide_the_first_valid_record` |
| `:270` "eligibility preserves lexical component traversal when duplicate paths share a prefix" | `layout_fixture.rs:594` `owner_settlement_duplicates_keep_component_lexical_order_before_windowing` |
| `:280` "eligibility selects the same Unicode duplicate in UTF-8 component order" | `layout_fixture.rs:627` `unicode_duplicate_winner_uses_utf8_component_order` |
| `test/setup/observe-doctor-checks.test.mjs:260` "run coverage independently detects admission mismatch even when directory totals agree" | behaviour removed (decision 31); admission parity owned by `layout_fixture.rs:62` |

Kept, with the admission parts of their messages adjusted: `:211`, `:226`, `:242`, `:280` (directory comparison and recency), `:308` (old hosts), `:329` (accounting).

## Steps

1. Typed struct + `from_slice`; run `cargo test -p fgos-run-result` (fixture parity and every observation test unchanged).
2. Time `fgos metrics coverage` through `npm run fgos:dev -- metrics coverage` on this repo, 10 warm runs, before and after (load noted). Target: p50 ≤ 0.35 s (from ≈ 1.05 s).
3. Doctor row and Node twin deletion; tests retired per the table.
4. Census; `git diff --stat`; commits `perf(run-result): …` and `refactor(doctor): …`, bodies naming the retired tests and their owners.

## Validation (focused)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p05-target
cargo test -p fgos-run-result
cargo test -p fgos-observe --lib -- metrics_cli::coverage
node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/runner/assignment-layout.test.mjs','test/setup/observe-doctor-checks.test.mjs','test/runner/assignment-enumerator-guard.test.mjs'])"
```

Land gates: `cargo check -p fgos-run-result --all-targets` on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`; `cargo clippy -p fgos-run-result --all-targets -- -D warnings`; one-door scan count stays 5.

## Success criteria

- `metrics coverage` p50 ≤ 0.35 s warm (measured, load noted); `runs` and `harness` drop by the same ≈ 0.9 s.
- `rg -n "projectRunEligibility|isRfc3339Instant" src test` → 0 hits.
- `metrics runs` / `metrics coverage` output byte-identical before and after on the real results.
- Doctor row `observe-run-coverage` passes on this repo, costing one host call.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The typed struct misses a key a consumer reads, silently changing `metrics` output | M × M | Struct keys taken from a re-grep of every `get(..)` in `run_observation` and `derive_legacy_outcome`; every existing observation test and the legacy-derivation fixture test (`lib.rs:792`) must stay green unchanged |
| `std::fs::read` of a huge `result.json` allocates it whole | L × M | Same bytes `BufReader` read before; the cap stays an owner addition (A2) |
| The doctor loses a detection the Node twin had | L × M | Owner decision 31 accepted that; the shared fixture is the one proof |

## Rollback

Revert the two commits. No contract or on-disk change.
