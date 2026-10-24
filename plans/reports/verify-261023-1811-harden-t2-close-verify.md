# HARDEN T2 close verify and re-measure (phase 17: Independent verify + Re-measure only)

Not landed, not merged, not activated. No repo file edited, no commit/push. Scratch only under
`/home/vantt/projects/forgent-worktrees/t2-verify*` (clone, target, bench dir `t2-verify-bench`, logs `t2-verify-*.log`).

## Tips tested
- db5f19193: cargo build, npm test, cargo test --workspace, clippy, census, Δ numbers.
- fa8f0b885 (clone pulled; this is what origin branch was at pull time, NOT 4472f0dff; 4472f0dff is its ancestor, plus 8633fa191 perf(event-store) head-in-tip listing + a merge + census regen): darwin check, fgos-durable-file tests, fgos-git tests, re-measure build.
- Env: FGOS_SESSION_ID, CODEX_THREAD_ID, CLAUDE_CODE_SESSION_ID, FGOS_STATE_ROOT, FGOS_HOST_BIN unset; CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-verify-target; /usr/bin/git. Package has no npm deps (npm ci no-op).

## 1. Independent verify

| step | tip | result |
|---|---|---|
| `cargo build --locked --release --workspace` | db5f19193 | OK (21 s) |
| `npm test` | db5f19193 | exit 1: 8675 tests / 8576 pass / **1 fail** / 0 cancelled / 33 skipped, duration 460.8 s; load at start 4.3, at end 8.7 |
| `cargo test --workspace --no-fail-fast` | db5f19193 | exit 0, no FAILED; 1473 passed, 0 failed, 12 ignored, 261 suites (summed `test result:` lines). napi "undefined symbol" lines are the addon unit-test binary noise, exit 0 |
| `cargo clippy --workspace --all-targets -- -D warnings` | db5f19193 | exit 0 (only dependency `arraydeque` lifetime warnings, not workspace) |
| `cargo check --workspace --target aarch64-apple-darwin` | fa8f0b885 | OK, 0 errors (not run on db5f19193; coordinator said it would fail at beneath.rs:7, fixed by 6de51d3e4 in this tip) |
| `cargo test -p fgos-durable-file` | fa8f0b885 | OK (6+1+9 tests, 0 failed) |
| `cargo test -p fgos-git --no-fail-fast` | fa8f0b885 | 300 passed, 0 failed; `land_crash_matrix` 15 pass/2 ignored, `recovery_matrix` 34 pass/1 ignored, `publication` ok; wal crash/compaction cases inside the 300 |
| `node scripts/git-one-door-scan.mjs` | db5f19193 | exactly 5 unresolved sites (all `unresolved-binary`): bin/fgos.mjs:3471, bin/fgos.mjs:3615, src/runner/merge.mjs:938, src/runner/merge.mjs:968, src/runner/worktree.mjs:146 (CFG's). Matches expectation |
| `node scripts/test-proof-inventory.mjs --cli-cost` | db5f19193 | `fgos --help 118 ms, fgos list 410 ms (median of 5, load 7.5)` (that is its whole output) |
| `cargo fmt --check` (phase text lists it; not in task) | fa8f0b885 | FAILS: 3854 `Diff in` hunks across the workspace (e.g. apps/fgos/src/cli_projector.rs, apps/fgctl/src/main.rs). Not compared with origin/main, so unknown whether pre-existing |

### npm test, every `run-tests: ERROR` line (1)
```
run-tests: ERROR: test suite leaked unexpected files or modifications into .fgos store:
  Added (1):
    + .fgos/locks/worktree-admin.lock
```
Summary line: `suite: 591 files, 8029 test() calls, 461 s wall (baseline 593 / 8021 / 202 s at 3ee188506)`; `this change against 389e48d94: +46 -38 test() calls, 2 new CLI/host spawn site(s), 2 without a reason`.
Warnings: 13 test titles appear in more than one file; `test/terminal-control/client-route.test.mjs:46` and `:137` [new-cli-spawn-without-reason] (no `// boundary:` reason).

### The 1 failing test, and the leak: fresh-clone artifact, not a T2 defect
- `test/scripts/test-select-mutate.test.mjs:274` "integration: a real mutant (m-edit-1) is applied and classified inside a real detached git worktree": `WorktreeError ... git worktree add --detach ... failed at HEAD: {"cause":"git-fence-missing","code":"recovery-required"...}` from `createVerifyCheckout` via `scripts/test-select-mutate.mjs:59` on `REPO_ROOT` (the checkout itself).
- Cause: the fresh clone has no activation fence (`.fgos/locks/activation.lock/TOMBSTONE`); the main checkout has `activation.lock`. The same test writes `worktree-admin.lock` into the clone's `.fgos/locks`, which in the clone's empty store counts as a leak (the main checkout already has that file).
- One-file re-run (the full-suite runner `scripts/run-tests.mjs` ignores a file argument and runs everything, so I used `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test <file>`; the runaway full run I started by mistake was killed and its leftovers cleaned): without fence 28/29 pass, same failure (deterministic); after creating the fence in the clone (same bytes as test/helpers/git-fixture.mjs): **29/29 pass**. 
- NOT done: a full `npm test` re-run with the fence (would show whether the leak line also vanishes). Per the above, expected green; unproven. Not compared with the parent plan's known-red list or a base-commit run.

## 2. Re-measure
Machine shared with other lanes. Load noted per figure. Host/addon: **release build of the clone at fa8f0b885** (`target/release/libfgos_node_addon.so` copied as `fgos.node` + `target/release/fgos`, manifest hand-written next to them under the clone's `.fgos/runtime/rel-bench/`, loaded via `FGOS_ACTIVE_MANIFEST_PATH`; Node code from the clone's `src/`). Baseline column = the active release (digest c91242ea..., built 08:54 today), measured by the same harness, interleaved, same load.

Warning: the first set of "new" timings (loads 8 to 16, then 1) used the staged addon from `scripts/lib/git-addon-stage.mjs`, which is a DEBUG build (90 MB). Those timings (add 215 to 260 ms, scan 100 ms+) are INVALID and discarded. Child/fsync counts from that set are code-path counts, valid.

| figure | baseline (active release, same harness/load) | T2 tip release build | load (1-min) | note |
|---|---|---|---|---|
| port worktree add p50, fresh repo, 10 port + 10 plain interleaved, 3 rounds | 186 / 182 / 180 ms | 185 / 181 / 185 ms | 0.16 / 0.31 / 0.31 | no change; first add 277-302 vs 290-295; plain add 6.0-6.6 vs 6.6-6.9 ms. Seat baseline was 184 ms |
| per-add fsync (strace marginal (n3 - n1)/2, fresh state root each run) | (33 -> 79 fsync) = 23 | (33 -> 78) = 22.5 | 2.7 | unchanged (expected, phase 10 not run). Seat counted 25 |
| per-add contained children (bwrap execs, trace-parse.py, marginal) | (39 -> 77) = 19 | (39 -> 77) = **19** | 2.7 | **No reduction**: phase expectation was <= 14; identical to the active release by this method. Per-add plain git execs 5 -> 5 (6 -> 16 over 3 adds), also equal |
| fsync probe unit cost | n/a | 5.3 to 5.5 ms p50 | 0.3 to 1.3 | matches seat 5.25 |
| read-only `inspectGit` on main checkout's own WAL | 33.0 / 34.4 ms (WAL 364-391 chains over the session; seat 28.5 ms at 322) | 32.3 / 39.0 ms at 391 chains | 0.45 | the WAL is NOT compacted (old chains are retained until a door ends them) so the "after compaction" premise is not shown here |
| `inspectGit` on empty scratch WAL | 7.0 ms | 26.8 ms | 0.45 | possible regression for an empty/fresh WAL (about +20 ms per scan); one old run vs one new run, not repeated; cause not investigated |

NOT measured (wrap-up request, WORK A/B window 20:25-21:15): terminal `capabilities` op p50 and herdr invocation count; `test/runner/worktree-admin-multiprocess.test.mjs` wall time (so no figure to ping TEST with); `fgos doctor --json` wall time and Git/terminal row ids; synthetic 322-chain WAL; per-chain scan slope.

## 3. Δ table (HARDEN commits, `git log --no-merges --numstat origin/main..HEAD` at fa8f0b885 as fetched; 131 non-merge commits, 10 merge commits excluded; merge-base 389e48d94, origin/main has since moved to 297853937 and is not in the range)
Net lines of `git diff merge-base..HEAD` (gross per-commit sums in brackets). Source script `/home/vantt/projects/forgent-worktrees/t2-verify-delta.py`.

| class | added | removed | net | ceiling | verdict |
|---|---|---|---|---|---|
| Node (src, bin, scripts) | +440 [+542] | -516 [-618] | **-76** [-76] | <= -120 | MISSED by 44 |
| Rust src, incl. inline `#[cfg(test)]` | +3228 [+3628] | -2873 [-3274] | **+355** [+354] | <= 0 | MISSED |
| of which Rust non-test code / inline `#[cfg(test)]` tail (split by first `#[cfg(test)]` per file) | | | +101 / +254 | | non-test alone still > 0 |
| tests (test/, packages/*/rust/tests; inline Rust tests counted above, not here) | +2641 [+3319] | -858 [-1536] | **+1783** [+1783] | <= 0 | MISSED (big: ssh_transport.rs +514, publication_children.rs +210, herdr_driver_fake.rs +159, publication.rs +155) |
| JSON contracts (shown apart) | +2178 | -274 | +1904 | n/a | mostly 11+ terminal even-split policy fixtures (~+1000) and mutation-census (+323/-199) |
| layer = Node + Rust src | | | **+279** (+25 if inline tests excluded) | <= -120 | MISSED |
| other (docs, plans/reports, Cargo) | +1552 | -161 | +1391 | n/a | |

Per-phase estimates were not compared (not extracted). Every ceiling is missed on these numbers; the phase text says a miss blocks the close until a fold pays or the owner accepts (decision template).

## Findings for the lead
1. Contained children per add unchanged (19 -> 19) vs the active release: phase 4's expected <= 14 not visible through the Worktree add door. Worth checking before the closing table claims it.
2. Worktree add p50 unchanged (about 183 ms), fsync unchanged, scan on a retained WAL unchanged; empty-WAL scan 7 -> 27 ms needs a repeat before it is called a regression.
3. All four Δ ceilings missed.
4. `cargo fmt --check` red workspace-wide (baseline unknown).
5. npm red is a fresh-clone fence artifact; a clean-store run is still owed for a fully green statement.
6. 2 new CLI/host spawn sites without `// boundary:` reason (client-route.test.mjs:46, :137).

## Unresolved
- Is the branch tip to be tested fa8f0b885 (what the clone pulled) or 4472f0dff (what the lead named)? Results on db5f19193 stand per the coordinator.
- Was the old-release `contained children 19` in the council report counted as bwrap execs (my method) or another way? Mine reproduces 19 on both releases.

Status: DONE_WITH_CONCERNS
Summary: Build, cargo (1473/0), clippy, darwin, one-door scan (5 sites) pass; npm has 1 fresh-clone-only failure plus leak line (test passes 29/29 once the activation fence exists); add/fsync/scan figures unchanged and children still 19, all four Δ ceilings missed.
Concerns/Blockers: capabilities op, multiprocess-test wall, doctor wall, synthetic 322-chain not measured; no full clean-store npm re-run; cargo fmt --check red; first timing set used a debug addon and was discarded.
