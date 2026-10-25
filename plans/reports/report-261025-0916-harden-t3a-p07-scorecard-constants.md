# Report: remove constant / always-zero `metrics harness` sections

Owner approved removal 2026-10-25 (04a-Q3, decision 37). Branch `harden/t3a-p07-scorecard-constants`, code commit 87a7aa449.

## Deleted (net lines, whole commit: +18 / -875)

| Area | Net |
|---|---|
| Observe Rust src (`harness.rs` -211, `scorecard.rs` -240, `repo.rs` -39 net of test edit, `entropy.rs` -9) | +4 / -499 |
| Tests and scripts (`harness_protocols_test.rs` -200, fixtures test -19 net, regenerator -62, boundary test) | +5 / -282 (the `compute_sessions` unit test, about 106 lines, is counted under src) |
| Data and other (contract json -74, fixture tree -9, Cargo.toml/Cargo.lock -2, spec, CHANGELOG, census hashes) | +9 / -94 |

Removed: `compute_complexity` (typed `total_routes = 50`, `native_routes = 2`), `compute_loc_breakdown`, protocol scanners (`extract_protocol_id_from_file`, `scan_tier_directory`, `count_protocols_defined`, `count_protocols_used`), `ComplexitySection`, `LocBreakdown`, `compute_sessions`, `SessionsSection`, the `friction: "n/a (pre-F5)"` field, `EntropyCompounded`, `EntropyCounts.frictions`, `tracked_files`, `count_lines_of_code` (no other caller), the `fgos-yaml-doc` dependency of `fgos-observe` (its only use was the protocol scanner), contract `coordination-session.read.v1.json`, fixture tree `test/fixtures/observe/.fgos/coordination/`, the regenerator coordination step, the spec reference. `percentile` kept (used by `compute_work`). CHANGELOG line names the removed keys.

## Retired tests (behaviour removed, no owner left)
- `tests/harness_protocols_test.rs`: proved protocol counting in `complexity`; behaviour gone.
- `scorecard::tests::test_compute_sessions`: proved the `sessions` section; behaviour gone.
- coordination-session block (and contract-list entry) of `test/observe/observe-contracts-fixtures.test.mjs`: contract removed.
- `count_lines_of_code` assertion in `repo.rs::test_repo_helpers`: function removed (commit-count assertion stays).
- Changed, not weakened: `tests/boundary_test.rs` dependency list drops `fgos-yaml-doc` (dependency removed; still asserts the exact set).

## Consumer grep (src, bin, apps, packages, herdr-dashboard, test, scripts; before deleting)
Keys `complexity`, `sessions`, `friction` (harness), `counts.frictions`, `lines_of_code`, `protocols_used/defined`, `total_routes`, `native_routes`: no reader outside `packages/observe/rust` and its own tests. `src/cli/command-registry.mjs:158` only lists `fgos metrics harness` as an example. Other `frictions` hits are the legacy Work friction reader and Work replay, unrelated.

Success-criteria `rg -n "total_routes|native_routes|compute_sessions|n/a \(pre-F5\)|coordination-session" packages src test docs/specs`: the first four keys return 0 hits. The word `coordination-session` still matches other, unrelated things: the retired runner's `hint.kind === 'coordination-session'` recovery authority in `src/runner/dispatch/*`, `docs/specs/runner.md`, `docs/specs/reading-map.md` (historic architect doc `coordination-session.md`), and run-result fixtures. None refers to the removed Observe contract (`coordination-session.read.v1`: 0 hits). Left alone, outside this phase.

## Commands (CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p07-target)
- `cargo test -p fgos-observe`: all pass (48 lib + integration).
- `cargo clippy -p fgos-observe --all-targets -- -D warnings`: clean.
- `cargo check -p fgos-observe --all-targets --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`: clean.
- Node: `runChosenTests(['test/observe/observe-contracts-fixtures.test.mjs'])`: 5/5 pass. No other Node test drives `metrics harness`.
- `node scripts/git-one-door-scan.mjs --root . --write-census` (hook asked): only digests changed.
- `node scripts/regenerate-observe-fixtures.mjs`: ran the coordination-free steps, then failed at step 6 with `metrics case: unknown option --name`. This is the regenerator calling `metrics case open --name`, which the host rejects. It is independent of this change (that step comes after the removed one) and I did not touch it; the deleted fixture tree is the only fixture diff. Needs its own fix (not in this phase's scope).

## Timings (`metrics harness`, no sources, cwd = this worktree: 10043 tracked files)
Method: temporary integration test (deleted) calling `dispatch_harness` 7 times on the worktree root, `cargo test --release`, p50 of 7, warm file cache. Installed `fgos` could not be used (no activation in a worktree), and a release host build was not worth its cost.
- Before: p50 55 ms (min 53, max 327 first-run outlier); load average 0.68 to 1.78.
- After: p50 about 7 microseconds; load average 1.50 to 1.55.
The removed work (tracked-file listing, reading every js, mjs, ts and rs file, plus the newline count over all files, protocol scan) was the whole cost of the call without sources. Real runs also read observations from the sources, unchanged by this work. The plan's "about 0.3 s" matches the cold-cache outlier (327 ms), not the warm p50.

## Concerns
- Regenerator breakage above (pre-existing).
- `docs/specs/observe.md` § Contract only lost the contract reference; no other spec text described the removed keys.
