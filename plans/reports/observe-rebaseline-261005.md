# Observe run coverage rebaseline — 2026-10-05

## Scope and authority

Phases 1–3 of [the accepted plan](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md). Phases 4–6 remain deferred pending a separate measurement go/no-go. Historical stores and snapshots are not rewritten. New classification-impact measurements must use the rebuilt layout-v2 host, not an unchanged installed release.

No component-boundary change: RunResult owns run interpretation; Observe receives coverage through the existing host composition root. ObservationSource is unchanged. Doctor uses the existing host resolver and main-checkout root. No config defaults, environment variables, tools or writable-directory prerequisites were added.

## Before / after: actual CLI measurements

Window: `2026-09-01` onward. Harness accepts `--since 2026-09-01`, not the equals spelling. Before = each project's installed release; after = `/home/vantt/projects/forgentX/target/debug/fgos`, built with `cargo build -p fgos` and selected for Node helpers through `FGOS_HOST_BIN`.

| Project | Runs before | Runs after | Harness runs before → after | Runs since 01/10 after | Entropy score before → after |
| --- | ---: | ---: | --- | ---: | --- |
| forgentX | 887 | 221 | 887 → 221 | 118 | 737 → 737 |
| mdview | 6 | 74 | 6 → 74 | 74 | 0 → 0 |

| Project | Node candidates | Rust `runDirsSeen` | Observed | Skipped | Recent |
| --- | ---: | ---: | ---: | --- | ---: |
| forgentX | 1,195 | 1,195 | 221 | no-timestamp: 925; unparseable: 49 | 0 |
| mdview | 81 | 81 | 74 | no-timestamp: 6; unparseable: 1 | 0 |

Accounting holds exactly: 221 + 925 + 49 = 1,195; 74 + 6 + 1 = 81. Both rebuilt-host doctor coverage checks pass. The unchanged forgentX installed release does not recognize `metrics coverage`; the new Node check positively reports passed-but-degraded. This old-host response was exercised before selecting the rebuilt binary.

## Timestamp decision and baseline discontinuity

The live smoke exposed an important conflict between retaining flat historical totals and requiring a timestamp in the result. The old reader used `assignment.json.createdAt` as a fallback; that is assignment creation, not settlement. The user explicitly said backward compatibility is unnecessary and asked for the best policy. Decision: keep the strict result timestamp rule, do not manufacture settlement times, report historical timestamp-less results as `no-timestamp`, and do not migrate history. The decrease 887 → 221 is intentional under this rule, not a remaining enumeration blind spot. Pre-fix snapshots are not directly comparable with the new baseline.

Current writer inspection: `makeRunResult` in `src/runner/dispatch/run-result.mjs` writes `settledAt` with a current-time fallback; normal/failed settlement writes and propagates that field. No writer change was necessary. Timestamp-less historical records remain inspectable by Node; they are not suitable for time-window metrics.

Both installed releases returned an empty role map for `metrics runs --by=role --since=2026-10-05`. The rebuilt host in mdview reports panelist-1: 14, panelist-2: 14, panelist-3: 15, synthesizer: 8, producer: 11. forgentX's actual current-day roles are producer: 30 and reviewer: 1; no panelist role is claimed there. Entropy work-source counts are unchanged: forgentX outcomes/frictions/settlements 910/0/1596, mdview 18/0/6.

## Node reader and reconciliation evidence

See [layout inventory](observe-run-layout-261005.md) and [Rust prior art](observe-rust-coverage-261005.md).

- Node candidates: 1,073 flat-only → 1,195 bounded-layout candidates.
- Running-run check: 51 → 55; main cwd active ids: 5 → 9.
- Four nested producer orphans become visible. Existing fail-closed cwd-lock behavior is retained; no recovery apply, cleanup or retry was executed.
- Warm median inspection time: 17.446 → 32.057 ms. Directory visits: recursive 13,205 vs bounded 4,985. This is measured, not a claim that the new scan is free.
- Binding-snapshot diagnostic smoke: original function passed despite a stale binding in nested `runs/02`; migrated function fails and names attempt `02`. Temporary fixture was removed.

## Scanner cost and mutation proof

First helper coverage calls took 3,433 ms (forgentX) and 1,022 ms (mdview), including root/host resolution and cold file reads. Direct host measurements isolate the scanner: metrics ping 2.75–3.63 ms; three coverage calls 717.76, 730.31 and 772.39 ms. Typical scan cost stays below the plan's approximately one-second threshold; no second cache/index was introduced.

The shared Rust fixture was mutation-checked by temporarily lowering traversal depth 16 → 1. It failed on the actual observed run ids: only flat/no-assignment remained, while nested/fallback were missing (exit 101). Restoring depth 16 made the same test pass (exit 0). Source restored; no fixture or live store was modified.

## Verification-policy deviation

The phase 1 proposed regex/source-enumerator guard is intentionally absent: session engineering rules prohibit permanent source-text and wiring tests. An explicit enumerator inventory and behavioral nested-reader, symlink, depth, planted-run and shared-fixture parity tests replace its evidence. A stale exact import-closure snapshot failed because the new layout module was absent from its expected array; that incidental snapshot was removed rather than re-pinned, while existing forbidden-module/process boundaries remain.

Do not claim the source-guard criterion or the whole six-phase plan complete. Remaining measurement phases are not implemented or approved by this foundation execution.

## Final verification

- `cargo test -p fgos-run-result -p fgos-observe`: 35 passed, exit 0, including the shared fixture and consumer invariants. Repeated after the scoped formatting/test cleanup, again 35 passed.
- `cargo build -p fgos`: exit 0; final actual CLI coverage still reports 1,195 candidates, 221 observed and the same explicit skips.
- Full Node suite, one authoritative invocation: 6,802 tests; 6,728 passed, one failed, eight skipped, 65 todo. The only failure is the watchdog scenario at `test/scripts/run-tests.test.mjs:560`: its timed-out file list was empty rather than containing the hung fixture. No Observe/layout/doctor/reconciliation test failed in that full run. Full-suite green is not claimed; the failure was not rerun merely to confirm it.
- Initial focused Node run: 527 tests, 526 passed; one stale exact import-closure assertion failed and was removed as described above. The subsequent full run contains no failure in that test.
- `cargo fmt --all -- --check` failed on existing broad repository formatting drift and introduced regions. Introduced regions were normalized without reformatting unrelated code. Baseline-versus-current formatter comparison then found zero nonbaseline formatting blocks in all six affected Rust files; both new files have zero formatter diff. Existing workspace-wide drift remains.
- Independent code review: 10/10, no remaining implementation findings for phases 1–3; the earlier missing-report finding was resolved by this report.
- Complete `fgos doctor` CLI exercised from forgentX and mdview with the rebuilt host: coverage check passes in both. An existing linked-worktree invocation also passes and explicitly names the main checkout store. This is not a claim that every unrelated doctor check passes.

Status: foundation implementation and scoped behavior verified. The full-suite gate was subsequently closed by the watchdog correction and the green authoritative rerun below. The six-phase plan remains in progress because phases 4–6 stay deferred and the prohibited source-text guard is not implemented.

## Watchdog gate investigation and correction

The first handoff's early-child-failure inference was withdrawn. Captured
isolated output proves that `ps` process age may reach 2,000 ms while the scenario's
wall duration is 1,934 ms; short wall duration does not exclude watchdog kill.
Ten natural captured rounds with 15 CPU-burning siblings passed; this did not
prove the race absent.

A deterministic external preload paused the real supervisor immediately after
the real root SIGKILL. The nested runner exited nonzero, the detached grandchild
was dead, and the other file ran; the parent nevertheless read `timedOut: []` and
removed the temp directory. The later journal append failed `ENOENT`. This proves
the defective interleaving (artifact://141); assigning that exact interleaving to
the original discarded-output run remains [INFERENCE].

Fix: `scripts/lib/test-file-watchdog.mjs` appends timeout evidence before
`killTree`, so the nested runner cannot finish before publication. Existing
limits remain unchanged. The regression now captures stdout/stderr, spawn
error/signal and environment diagnostics; a second real-process variant holds
the post-SIGKILL boundary until the parent has read the result. Fixture/process
cleanup is registered before execution.

Focused post-fix command:
`FGOS_HOST_BIN=/home/vantt/projects/forgentX/target/debug/fgos node --test test/scripts/run-tests.test.mjs`
passed all 32 tests, including actual tree kill, other-file completion and the
deterministic publication gap. No synthetic process table, timeout increase,
retry or failure suppression was introduced.

Final authoritative rerun after the evidenced watchdog fix:
`FGOS_HOST_BIN=/home/vantt/projects/forgentX/target/debug/fgos npm test` exited 0:
6,803 tests, 6,730 passed, zero failed/cancelled, eight skipped, 65 todo
(342,023 ms; artifact://148). Both watchdog variants passed. Independent review
approved the publication ordering and real-process regression with no findings.
Phase 3's full-suite gate is now satisfied; no skipped/todo test is claimed as a
pass.
