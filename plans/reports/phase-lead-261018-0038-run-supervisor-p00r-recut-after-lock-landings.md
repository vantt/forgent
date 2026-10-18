# P00r report: 6.2 plan re-check after lock landings

Status: DONE. Date 2026-10-18. Branch `run-supervisor/p00r-recut`, from integration tip `a5ecb2fff`.

## Evidence
- `cargo test -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor -p fgos-agent-protocol` (CARGO_BUILD_JOBS=4, session id unset): exit 0, 21 test binaries ok, 0 failed. No break from the main merge.
- `node --test test/run-supervisor/contracts.test.mjs`: 6 pass, 0 fail (before and after edits).
- Not run: npm full suite (docs and one contract text change only). `cargo check` Windows/macOS: no code changed.

## Changes
- `plan.md`: block `## CẮT LẠI 2026-10-18` (prerequisites, D6/D7 effect, per-phase deltas, run order unchanged).
- `packages/process/contracts/containment.port.v1.json`: `windows-job` id/is_empty/kill_all now follow the 4.4b record and job/contender views (text only).
- Dated amendments in phase 01, 02 (pending block replaced by approved reduced scope), 09, 11.

## Findings
- `Domain` enum lacks `LinuxPgroup` (contract has it): P01 adds it.
- Windows domain code is in `windows_job.rs`; P02 only calls it. Gate is always a job member.
- D7 moot: Windows lock driver landed.
- P09: no child_process inside `withStateTx` (guard `exec-under-hot-lock`).
- Order P01 → P02 → P05 → P03 → P04 → P06 → P07 → P08 → P10 → P11 → P09 → P12A stays.

## Impact analysis
GitNexus impact not run: no existing code symbol edited (docs and a JSON contract only).

## Unresolved
- None blocking. `rs-integration` worktree has no `node_modules`/`target` link; later phases that test there need them.
