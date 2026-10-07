---
date: 2026-10-07
scope: merged-main-integration
status: isolated-exact-tree-pass-live-store-gates-retained
---

# Main Integration Verification

## Summary

**Isolated exact-merged-source gate passed; two live-store gate failures remain preserved.** All three full Node runs passed every executed test assertion. The initial two actual-main commands exited **1** on unexpected live `.fgos` mutations; the explicitly authorized isolated exact-source run exited **0** with the same authoritative runner and its full isolation guard intact. No additional actual-main rerun, suppression, cache restoration, guard changes, source changes, or Rust reruns were performed.

All four requested serialized Cargo suites exited **0**, totaling **176 passed**, **0 failed**, **0 ignored**. The separately parent-requested actual native development `list` command exited **0** and returned the real main-store envelope.

## Checkout and Execution Contract

- Actual working directory: `/home/vantt/projects/forgentX`; branch observed: `main`.
- Main parent: `9882561826b38aa15a9166e7bc0e881cc5b5ec04`.
- Merge feature parent: `e5dbfed343c7437893305dd80698ee6c0848146f`.
- Merge remained in progress during verification; no merge/commit/stage/push/activation operations by this agent.
- Subsequently authorized isolated checkout: `/home/vantt/projects/worktrees/forgentX-single-door-main-verification`, detached commit `d065d5688c997430d51ad0c6c0fd56f5bbde1a76`, tree `3b759fe04bec43bd0e30d1cd34fdd94df81e1817`. Actual commit/tree were observed before execution; parent established this tree exactly matches `git write-tree` of the pending main merge.
- Isolated `.fgos` and local `node_modules` were not symlinks. Parent completed local `npm ci` and owned `target -> /home/vantt/projects/forgentX/target`; no source edits or additional builds beyond the normal runner.
- Read `ak:test`, its execution/report workflows, `scripts/run-tests.mjs`, the queue/watchdog implementations, and the native dev wrapper before their commands.
- Used the package's authoritative `npm test` door, not direct or narrowed `node --test` invocations.
- Queue bypass/held flags, timeout overrides, keep-temp, fixture-root overrides, `FGOS_HOST_BIN`, `CARGO_TARGET_DIR`, and `NODE_OPTIONS` were absent. Existing queue, default 600,000ms per-file watchdog, discovery, and fixture cleanup policies remained unchanged.
- No independent build, lint, typecheck, coverage, or other test suites were run. Cargo builds performed by the requested npm/dev doors were left intact.
- Test stdout/stderr was streamed in full directly to owned logs through Eval subprocesses, without shell redirection. Each command's start/end UTC, root PID/group, duration and exit are in its log. The separately requested live-store CLI payload was later replaced with a truthful hash/count/manifest summary at parent request; test output and failures were not altered.

## Exact Commands and Results

Commands ran in the order below. Cargo commands ran sequentially, each with `-j1 -- --test-threads=1`.

| Command | Exit | Passed | Failed | Skipped / ignored | TODO | Wall seconds |
|---|---:|---:|---:|---:|---:|---:|
| `env -u CLAUDE_CODE_SESSION_ID npm test` — initial | **1** | 6,879 | 0 | 8 | 65 | 339.227 |
| `cargo test -p fgos -j1 -- --test-threads=1` | 0 | 34 | 0 | 0 | N/A | 0.462 |
| `cargo test -p fgctl -j1 -- --test-threads=1` | 0 | 0 | 0 | 0 | N/A | 0.038 |
| `cargo test -p fgos-host-runtime -j1 -- --test-threads=1` | 0 | 84 | 0 | 0 | N/A | 0.693 |
| `cargo test -p fgos-distribution -j1 -- --test-threads=1` | 0 | 58 | 0 | 0 | N/A | 0.162 |
| `npm run fgos:dev -- list` — stdin DEVNULL | 0 | N/A | N/A | N/A | N/A | 1.736 |
| `env -u CLAUDE_CODE_SESSION_ID npm test` — corrected orchestration, explicitly authorized | **1** | 6,879 | 0 | 8 | 65 | 355.323 |
| `env -u CLAUDE_CODE_SESSION_ID npm test` — isolated exact merged source, explicitly authorized | **0** | 6,879 | 0 | 8 | 65 | 367.573 |

Each Node run reported **6,952 tests**, **22 suites**, **0 cancelled**. Reporter durations were 337,544.562251ms initially, 353,651.082479ms in the second run, and 361,345.235555ms in the isolated run. Skipped/TODO tests were not counted as passed. Cargo counts aggregate all emitted unit/integration/doc-test summaries; Rust reports no TODO category. Every Cargo summary reported 0 measured and 0 filtered out. `fgctl` executed zero tests; exit 0 is not a claim of substantive test coverage.

Cargo per-binary pass counts:
- `fgos`: 14 + 20 = 34.
- `fgctl`: 0.
- `fgos-host-runtime`: 33 + 0 + 5 + 20 + 20 + 5 + 1 + 0 = 84.
- `fgos-distribution`: 43 + 15 + 0 = 58.

## Failed Isolation Gates and Causal Caveat

### Initial full Node run

Started `2026-10-07T02:11:17.114078+00:00`; root PID/group 3784232; ended `2026-10-07T02:16:56.341057+00:00`.

The runner reported `test suite leaked unexpected files or modifications into .fgos store`, with **Modified (2)**:
- `.fgos/cache/state.json`
- `.fgos/runtime/events-jsonl.truncation-guard.json`

Evidence: `main-integration-test.log`, lines 8965–8979. Every test assertion was green; the process-level isolation gate was not.

Parent reported that its actual Node `doctor --dir main` ran concurrently within the snapshot interval and timed out at 120s; that timeout is parent-owned evidence and was not rerun here. Parent traced doctor paths that persist the truncation-guard sidecar and rebuild/write the cache. Attribution of these two modifications exclusively to doctor remains **[INFERENCE]**, because PID-level write provenance was not captured. No modification was restored or excluded from the guard.

### Corrected orchestration full Node run

Started `2026-10-07T02:18:31.264957+00:00`; root PID/group 3909676. Parent explicitly authorized this one additional full run after dev smoke, promising no parent main-store operations during it. Test selection, queue, watchdog/defaults and guard were unchanged; Cargo was not rerun.

The runner again reported `test suite leaked unexpected files or modifications into .fgos store`, now with **Added (72)**:
- **69 files** beneath `.fgos/assignments/unit-run-1791339702328-530b9bf9/`, including three panelist admissions, assignments, dispatch/control records, execution contracts, outbox acknowledgments, protected launchers/prepared invocations/secrets metadata, and run/unit records.
- **3 files** beneath `.fgos/workflow-runs/wf-run-1791339702144-c85539a6/`: `advance.lock`, `advance.log`, and `events.jsonl`.

Evidence: `main-integration-test-serialized.log`, lines 9003–9084; every exact added path is preserved there. No modified/deleted entries were reported in this run. No assertion failed. Parent subsequently identified an unrelated real user Delphi workflow (`workflow.start` at `2026-10-07T02:21:42.159Z`) as provenance for these added artifacts, not a suite-origin leak. Parent made no main-store calls during the second run. This live-user activity is distinct from the first doctor's writes and cannot be stopped or deleted for test convenience. Parent was notified immediately when each gate error appeared, and then given precise counts/paths. All live artifacts remained untouched.

### Isolated exact-merged-source full Node run

To avoid concurrent user-store writes without weakening the guard, parent explicitly authorized one run in its owned exact-source verification checkout after local dependency preparation. Read the actual isolated runner, queue and package test door; observed commit/tree identity and non-symlink `.fgos` before execution.

- Command: `env -u CLAUDE_CODE_SESSION_ID npm test`.
- Checkout: `/home/vantt/projects/worktrees/forgentX-single-door-main-verification`.
- Commit: `d065d5688c997430d51ad0c6c0fd56f5bbde1a76`; tree: `3b759fe04bec43bd0e30d1cd34fdd94df81e1817`, exactly the pending merge tree per parent evidence.
- Started `2026-10-07T02:27:26.827016+00:00`; root PID/group **4052947**.
- **Exit 0**, **6,879 passed**, **0 failed**, **8 skipped**, **65 TODO**, **0 cancelled** across **6,952 tests / 22 suites**.
- No runner isolation error or watchdog timeout error. Queue/watchdog/defaults and full `.fgos` isolation guard stayed intact.
- Full raw output and final cleanup evidence: `main-integration-test-isolated.log`. No further npm or Rust run was performed.

This demonstrates the merged source passes its full authoritative gate in an isolated store; it does not retroactively convert either actual-main exit 1 into success. Parent owns removal of only its validation worktree after evidence is retained in main.

## Actual Native Development Door

`npm run fgos:dev -- list` exercised the real merged main store, with stdin ignored. The door's own `cargo build --package fgos` finished successfully (`dev` profile, 0.03s). Returned one valid JSON envelope:
- Contract: `fgos.v1`; generated at `2026-10-07T02:17:58.824Z`.
- Data hash: `962e0498b014ba4305527e9a250e6954a52b25db505ad3af18b928e47db89131`.
- Collections: work **301**, decisions **869**, discovery **138**, gates **134**, settlements **133**, outcomes **158**, learnings **0**, decisionsById **162**, callThreads **299**, topics **479**, docs **479**.
- Captured combined command output: **3,245,155 bytes**, **50,798 lines**. Full live-store payload was intentionally omitted from permanent reports at parent request to avoid copying user business data; this CLI section is **not an unmodified complete stdout log**.
- Original combined stdout/stderr SHA-256: `771c98aecfc10a05712576f9e1005e3af1f04fca93fd3d100df135fd74d36951`.
- Exact emitted JSON envelope stdout: **3,245,014 bytes**, SHA-256 `9d0759737f5f2d87da37f3396f962abe28684e38cd10b4a87284427a875ef7f5`. A whole stdout-only hash cannot be reconstructed because subprocess stdout/stderr were merged; the two hashes are labeled honestly.
- The first raw log preserves the validated contract/data hash/collection counts, command/exit, Cargo freshness, native manifests and cleanup. All npm/Cargo test output and both original exit-1 gate errors are unchanged.

Observed the door's actual temporary native artifact/manifest during execution:
- Owned run directory: `.fgos/runtime/dev-host/run-WOpuNT`.
- Native SHA-256: `f0cd8cb4f020cc0aad5f84da06d32f07379898df3f270f30510ff123f6a2069b`, matching `target/debug/fgos` before/after and the manifest's native digest.
- Legacy Node manifest digest: `sha256:777afedbfe0929a59bebbe45fea4f7afa64f652733574b2bf32a7a0b192ffa10`.
- Manifest artifact digest: `sha256:1f364b677fefe1629ae42c8b3ee202b85d1659cc031d420f7d993d9856195ec8`.
- The door performed its normal current-checkout Cargo freshness build and generated a per-run matching manifest. No active installation/release was changed.
- Owned `run-WOpuNT` no longer existed after exit; final glob found no dev-host `run-*` directories. Cleanup was the wrapper's existing `finally` mechanism, not broad runtime removal.

## Process, Queue and Fixture Cleanup

- Spawned command roots in separate process groups; periodically tracked descendants, start identities and group membership. Observed 4,692 owned process identities and 220 groups across all commands, including isolated verification. Sampling is not syscall-level provenance and cannot establish the writer of the real-store artifacts.
- Final process snapshot found **no observed owned process or member of an observed owned group remaining**. Command roots were 3784232, 3906111, 3906231, 3906245, 3906403, 3908026, 3909676 and 4052947.
- Machine-wide `/tmp/fgos-full-suite.lock` was absent before the initial run and absent after all three completed runs/final inspection. No queue file was removed manually.
- Existing runner cleanup removed all three observed primary temp roots (`/tmp/fgos-test-run-8xLbdZ`, `/tmp/fgos-test-run-QXjOAL`, `/tmp/fgos-test-run-JDV4r7`), six observed nested runner temp roots and nine observed `/var/tmp/fgos-test-fixtures-*` roots. Exact names/existence checks are retained in the logs.
- Final targeted glob found no `/tmp/fgos-test-run-*`, `/var/tmp/fgos-test-fixtures-*` or native dev `run-*` directories.
- No manual process termination, broad `/tmp` cleanup, user runtime deletion, backup/event/report removal, or unowned fixture cleanup was performed.

## Durable Evidence and Handoff

- `main-integration-tests.md` — this report.
- `main-integration-test.log` — complete initial npm and serialized Cargo output, **summarized live-store dev CLI payload**, native metadata and cleanup evidence (**1,115,304 bytes** after authorized evidence hygiene).
- `main-integration-test-serialized.log` — complete explicitly authorized corrected-orchestration npm run and final cleanup evidence (**1,104,066 bytes** at report creation).
- `main-integration-test-isolated.log` — complete isolated exact-merged-source npm run and final cleanup evidence (**1,096,639 bytes**).

Coverage/build validation beyond builds inherent in the requested doors was not requested and not exercised. Isolated exact-source authoritative verification passed; both actual-main exit-1 isolation results remain explicit. Parent identified the second run's live user Delphi provenance and owns the merge decision and validation-worktree cleanup. This agent made no source changes or user-store cleanup.
