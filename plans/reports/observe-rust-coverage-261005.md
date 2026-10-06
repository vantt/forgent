# Observe Rust run coverage — 2026-10-05

## Scope and prior art

Phase 2 of `plans/261005-1143-observe-run-visibility-and-discussion-measurement`; phases 4–6 remain deferred. Read the accepted plan, phase 2, reading map, and Observe specification before changing code.

History examined:

- `git log -S 'smoke_real_store' -- packages/run-result` has no content hits: the token names a file, not a symbol in its contents.
- `git log -G 'scan_runs|smoke_real_store|1028|103' -- packages/run-result` identifies `120af6b3d`, the Observe native migration. Reading that commit's `smoke_real_store.rs` confirms the original test used the checkout's live store, skipped when absent, required at least 1028 observations, and pinned exactly 103 classified observations. Those were audit snapshot checks, not a layout invariant.
- `git log -S 'asgn_created_at' -- packages/run-result/rust/src/lib.rs` identifies the same migration. The original scanner enumerated only direct assignment directories, cached assignment metadata, and used assignment creation time as an ultimate timestamp fallback.
- `git log -G 'unit-run|RunResultSource|run-result.read'` identifies `073c8b6fc` alongside the migration. Reading its actual run-result diff shows only acceptance of RunResult v4 in legacy derivation; enumeration did not change. Thus the missed nested runs were not an intentional removal of support.

Reused: `RunResultSource`, the unchanged `ObservationSource` trait, legacy outcome derivation, observation attribute conventions, existing Observe metrics dispatch/provider injection, and the existing root resolution/envelope paths. Added only the owner's scanner and a composition-root callback; no run cache, index, second store, or transcript scan.

## Impact and repository identity

Repository: **forgent** (`/home/vantt/projects/forgentX`); worktree: the same checkout. The initial 2026-09-21 index was stale. Parent refreshed it before symbol edits (reported 58,449 nodes and 79,944 edges).

Upstream GitNexus queries used `node .gitnexus/run.cjs impact … --direction upstream --repo .`, with UID/file disambiguation:

- `RunResultSource.observations`: LOW, two direct unit-test callers, no indexed processes. GitNexus explicitly reports this as an interface lower bound, so downstream metrics consumers are also included in the semantic risk assessment.
- `metrics_cli::dispatch`: LOW, one direct caller, `ObserveMetricsProvider.invoke`.
- `ObserveMetricsProvider.invoke`: no indexed direct callers, interface lower-bound warning; not proof of no runtime consumers.
- `ObserveMetricsProvider.with_sources`: reported CRITICAL (113 impacted, 27 processes), but the direct caller was nameless and related results contained corrupted paths/unrelated modules. Reported the tool inconsistency. Manual callsite search finds the host composition root in `apps/fgos/src/main.rs`.
- Metrics initialization similarly reported CRITICAL through the unreliable provider graph. Host `main` with its exact file was not found (UNKNOWN). These warnings were communicated to the parent before proceeding; they were not treated as an all-clear.

Effective behavior risk: broader run visibility changes metrics runs/harness totals and future snapshots. Historical snapshots are not rewritten. All discovered production Rust callsites were migrated together; no reverse Observe → run-result dependency was introduced.

## Implemented contract

- `scan_runs(root) -> RunScan` supplies settled observations (`runs`), sparse skipped-reason counts, `run_dirs_seen`, and `recent_runs`.
- Lexical walk discovers assignment-relative ids containing `/`, stops at each `runs` directory's immediate attempts, and caps assignment depth at 16. Attempt contents cannot plant observations.
- Symlinks are not followed, including result and assignment metadata. Symlink/depth traversal barriers each account for one skipped candidate; a result symlink accounts for its existing run candidate, not a second candidate.
- Missing/unparseable/unsettled results, missing ids or result timestamps, inline unit records, duplicates, symlinks and depth barriers have explicit reasons. Timestamp comes only from nonempty `settledAt` or `timestamp`, never assignment creation time. Duplicate precedence is first valid lexical path before consumer window filtering.
- Assignment metadata is optional. The path is the canonical observation assignment id. Record role/adapter attributes retain their existing precedence over optional assignment metadata.
- Unreadable/disappearing child directories and entry metadata races are skipped while readable siblings continue. An unreadable assignments root fails explicitly; an absent root is empty.
- `recentRuns` counts regular result files modified within 60 seconds, including malformed/inline/duplicate records. Future mtimes count as recent to align Node's clock-skew tolerance. Missing and symlink result files do not contribute.
- Coverage uses the same scanner, and `observed + sum(skipped) == runDirsSeen`. Skip reasons use static keys; lexical sorting caches file-name keys.
- Observe's coverage dispatcher receives the scanner from the existing host composition root. `ObserveMetricsProvider::with_sources` now requires that callback; unused unconfigured Metrics `new`/`Default` constructors were removed. `ObservationSource` remains unchanged, and `derive_legacy_outcome` is untouched.

## Hermetic acceptance evidence supplied

`packages/run-result/rust/tests/layout_fixture.rs` materializes the immutable `test/fixtures/run-layout/expected.json` into a temporary tree. Its declarative expectation is four observed ids (`fallback`, `flat`, `nested`, `no-assignment`), ten candidates, and six skips. It compares ids/accounting to the shared fixture and invokes real Observe dispatch for coverage/runs/harness to assert matching totals. It additionally covers canonical nested ids, role null without assignment metadata, lexical duplicate precedence, planted outbox exclusion, timestamps/window filtering, unsettled attempts, result/assignment symlinks, depth boundary/barrier, empty source, result mtimes and future clock skew.

Observe's coverage unit test installs an observation source that panics if called, proving the coverage dispatch path must use only the injected run scanner. The live-store smoke file and its audit-time pins were removed entirely.

These are supplied tests, **not exercised results**: the worker assignment forbids tests/build/lint/formatters mid-flight. Parent owns suite execution, the depth-1 mutation proof, timing, fixture regeneration and live totals. No performance claim or new cache is made before measurement.

## Exact integration commands and output paths

`cargo metadata --no-deps --format-version 1` was inspected (no build/test); it resolves `target_directory` to `/home/vantt/projects/forgentX/target` and the `fgos` binary target to `fgos`.

- Suites: `cargo test -p fgos-run-result -p fgos-observe`.
- Host build: `cargo build -p fgos`; binary `/home/vantt/projects/forgentX/target/debug/fgos`. Release profile: `/home/vantt/projects/forgentX/target/release/fgos`.
- Coverage: `/home/vantt/projects/forgentX/target/debug/fgos metrics coverage --dir /home/vantt/projects/forgentX` and the same invocation with `--dir /home/vantt/projects/mdview`.
- Helper/doctor checks: set `FGOS_HOST_BIN=/home/vantt/projects/forgentX/target/debug/fgos`; installed staged hosts remain unchanged by a source build.
- Role smoke: fresh binary `metrics runs --by=role --since=2026-10-05` against each project.
- Mutation proof: temporarily reduce `MAX_ASSIGNMENT_DEPTH` from 16 to 1 and run the shared-layout fixture test; failure must be the missing nested ids, not an incidental constant pin. Restore 16 before final suites.
- Timing must measure the scanner through coverage on the actual store. Only an observed cost over about one second justifies the accepted plan's cache condition.

The accepted plan's **887** baseline is a historical plan observation, not a measurement by this worker. After totals and timing belong to the parent's integrated rebaseline report. CHANGELOG, architecture manifest, phase statuses and golden regeneration are parent-owned. No component-boundary change: the composition root already connects source owners to Observe.
