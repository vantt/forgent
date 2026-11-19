# Phase 18: unit run core and the admission peer protocol

Wave 7. Depends on: 6b, 6c, 16b. Effort 2.5d. Library only (engine module `unit_run`). Citations re-read on
`f031ab0c8` (2026-11-19); since `b5b237534` `run.mjs`/`unit-run-start.mjs` changed only by the `.fgos` join door
(`691255ad0`) and the writer-id change (`b7486e847`), no admission behaviour.

## Context

`src/runner/execution/`: `run.mjs` (1 026: `runUnit`, `resolveGitRoots`, `snapshotRunnerConfig`,
`assertRepositoryForWrites`, `detectHerdrPresent`, `settleAdmission:217-233`), `unit-run-start.mjs` (516: admission and
resume; `resolveBinding` on every standalone writing run, `requireFreeWorktree:199-205`), `unit-sync.mjs`, `custody-door.mjs`
(`runUnderCustody`, `runVerify`, `custodyHeld`, `worktreeKey`, `worktreeAdminScope`), `commit-unit-work.mjs` (227,
commit of declared `writes` through Git ScopedCommit), `partial-writes.mjs`, `dry-bind.mjs` (`simulateUnitBindings`),
`unit-run-record.mjs` (`judgeUnitRun`, `removeUnitRun`, `unitRunFacts`), `unit-run-history.mjs`. The loops are pure in
`fgos-execution` (6b); this module runs their commands (launch a seat through 16b, verify, commit). The `CaseAdmission`
trait (6b) gets its one S6a adapter here: the admission peer (P13, P17).

## Requirements

- `packages/execution/engine/src/unit_run/` ports them; `--worktree` checkouts through `fgos-checkout`.
- Peer adapter (P13): one Rust type over a framed `(reader, writer)` pair carrying prefixed JSON lines (the doctor
  bridge's framing: only prefixed lines count, stray output is never read as a message;
  `apps/fgos/src/wiring/doctor/bridge.rs:1-8,31`). Request/response ids, protocol number (refuse
  `host-version-mismatch`), a deadline per request. The six operations `resolveBinding`, `admit`, `recheckEffect`,
  `settle`, `activityUnitOf`, `confinedWriteRefusal` with the Node port's payloads, and two acknowledged events,
  `unitRunCreated` and `caseAdmitted` (the parent records `recordScheduled` on it, `src/workflow/runner.mjs:173`, V18).
  The pair is either the process's own stdin/stdout (the `run-unit` internal op, phase 19) or a spawned peer's
  stdout/stdin (standalone `fgos run`, P5): same adapter, never an inherited fd above 2. Works on Linux, macOS and
  Windows (pipes only).
- Contract file `packages/execution/contracts/admission-peer/admission-peer.v1.json` (message shapes, framing prefix,
  vectors) and the `run-unit` request and result schema from phase 00 §3 (every `runUnit` option Workflow and Work pass,
  the result shape, and error classes such as `custody-predecessor-unknown` carried as `errorClass`).
- The port is asked only where Node asks it today (phase 00 §3); a run that never asks opens no channel.
- Records (F6, F12, F13): the unit-run record (`unit.json`), the run control ledger and provenance under
  `.fgos/assignments/<unitRunId>/` stay byte-compatible with Node's, so (a) 6c's `run_facts` judges them unchanged
  for the addon reads Workflow makes (P15), (b) the previous Node release reads them after a rollback (reverse-read
  fixture for phase 22), (c) the corpus replays.
- Golden vectors under `packages/execution/contracts/unit-run/` recorded by `test/golden-recorders/unit-run.recorder.mjs`;
  integration tests: solo read-only, reviewed with writes committed, admission refused, recheck refused (nothing
  committed), peer that dies mid-run (the run fails closed, no commit), a stray unprefixed line on the channel ignored.

## Steps

Commit the recorder; record vectors; red `engine/tests/unit_run.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test unit_run`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: a write committed after consent was withdrawn (`recheckEffect` skipped). Test "recheck refused, nothing
committed". Risk: peer deadlock (both sides waiting). Each side reads its input concurrently with writing; deadline per
request; test with a slow peer. Rollback: revert.
