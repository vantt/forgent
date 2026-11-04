# HARDEN T5 batch A: lead report

Worktree `/home/vantt/projects/forgent-worktrees/harden-t5-batch-a`, branch `harden/t5-batch-a` (from origin/main 6685977fd). Not pushed. Cargo target `/home/vantt/projects/forgent-worktrees/harden-t5-batch-a-cargo`.

| Fix | Commit | Red evidence | Tests |
|---|---|---|---|
| B-2 | 77861ee63 | new test fails with src stashed (`{status:'failed'}`, `{}`, undefined gave `pass`) | unit-run-outcome, run-outcome (fixture now 19 rows: added v1 bare `failed` -> infra, empty object -> corrupt), unit-summary, legacy-seat-read, assignment-enumerator-guard: 58 pass. `cargo test -p fgos-run-result`: 14 pass, Rust agrees with both new rows |
| S-1 | b423adcff | n/a (perf) | `explainSeat(..., { chain: false })` added (default unchanged, `dispatch explain` untouched); new tier-fallback test; blind-pools, yaml-parse-failures, explain importers pass |
| S-2 | 79160ded6 | new test (3 runs, result.json read count) fails with src stashed | 89 pass over 7 importing files |
| B-6 | e0c2f1bbb | new test fails with src stashed (family `claude` instead of `gemini`) | blind-pools-check 11 pass, yaml-parse-failures pass |
| R-4 | c75da9a47 | two new tests hit the 5 s child timeout with src stashed (FIFO blocks) | trust-store + credential-renewal 116 pass; 19 files importing trust-store/cleanup/authority pass (462 tests) |
| B-7 | 74392b7fe | new test fails with src stashed | provider-capacity + all importers: 418 pass, 0 fail |
| B-12 | a78229e47 | with src stashed the new test hangs (timeout exit 124) | run-lock-identity + all importers: 192 pass |

Final: `test/architecture.test.mjs` + `test/scripts/doc-health.test.mjs` 43 pass.

## Measurements
- S-1: `fgos doctor` via `npm run fgos:dev`, counting `internal seat-binding` spawns: 559 before, 183 after (wall about 87 s vs 85 s, doctor is dominated by other rows). The doctor-run count differs from the arbiter's 155 estimate by the 28 extra spawns left in other rows.
- S-2: in-process, 370 synthetic runs, `inspectDispatchRuntime --cwd`, small v2 results: first call 24 ms to 21 ms, warm 17 ms to 11 ms. The arbiter's 2.0 s was with the real 370 files on the real machine; the synthetic result files are tiny, so the absolute gain here is small. The 4 reads per run are now 1 (proved by the test).

## Deviations
- B-2: the "v1 `failed` row" already existed (row 01, a full v1 record); added a bare `{status:'failed'}` row and `{}`. Existing test asserted `undefined -> pass`; changed to `execution-failure` as the arbiter specified.
- B-7: "attempt is closed" has no signal in the machine-wide state (entry holds only account and time; the run dir is not recorded; `runIsDead` is never supplied in production). Used the arbitration's alternative: `dropClosedAssignments` (called in the same place as `reclaimDeadLeases`, under the same lock) drops an entry when no lease names the assignment and its `selectedAt` is older than 1 hour (or unparseable). The audit runs right after the lease release, so a grace window is required; 1 hour is my choice (CLOSED_ASSIGNMENT_RECORD_MS). Owner may want a different bound, or a recorded run dir with a `closed.json` check.
- R-4: `.mcp.json`, `.codex/hooks.json` (1 MiB cap) and the three marker reads in `confinement/cleanup.mjs` (64 KiB cap, constant moved there and imported by `authority.mjs`) now use `readAgentFileSync`. A link or pipe marker in `markerIsUnrecognisable` counts as unrecognisable (home left alone, `ownership-marker-unreadable`). The credential copy reads in `provider-credential-renewal.mjs` already go through the door for agent-written copies (`agent: true`); the remaining plain reads there are of the owner's source home or of fgOS-written staging, left as is. Behaviour change: a symlinked `.codex/hooks.json` now throws `unreadable-store` where it was followed before.
- B-12: on `already-exists`, an unparseable file at that epoch throws `generation-unreadable` (names the file); a parseable one continues as before.
- Mistake caught: one test run without `CARGO_TARGET_DIR` created a `target/` in the worktree; removed, nothing was committed from it.

## CHANGELOG
Lines added under `## [Unreleased]` for B-2, S-1, B-6, R-4. S-2, B-7, B-12 internal, none.

## Docs/spec lines needed (docs/ not edited)
- run-supervisor or runner spec: a settled record with no classification is judged from its legacy fields; unreadable is an execution failure.
- provider-capacity spec: assignment records are dropped after 1 hour with no lease naming them.
- agent-confinement spec: project `.mcp.json`, `.codex/hooks.json` and the home marker are read bounded and without following links.
- run-lock/admission spec: unreadable generation record refuses with `generation-unreadable`.

Status: DONE_WITH_CONCERNS
Summary: All seven fixes landed as seven commits on `harden/t5-batch-a` with red-before/green-after tests; architecture and doc-health pass.
Concerns/Blockers: B-7 uses a 1-hour age plus no-lease rule because no closed-attempt signal exists in the state; S-2 gain measured only on small synthetic files; symlinked `.codex/hooks.json` is now refused.
