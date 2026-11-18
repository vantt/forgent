# Phase 18: unit run core

Wave 6. Depends on: 4, 6, 16. Effort 2.5d. Library only (engine module `unit_run`).

## Context

`src/runner/execution/`: `run.mjs` (1 025: `runUnit`, `resolveGitRoots`, `snapshotRunnerConfig`,
`assertRepositoryForWrites`, `detectHerdrPresent`), `unit-run-start.mjs` (515: admission and resume),
`unit-sync.mjs`, `custody-door.mjs` (`runUnderCustody`, `runVerify`, `custodyHeld`, `worktreeKey`,
`worktreeAdminScope`), `commit-unit-work.mjs` (229, commit of declared `writes` through Git ScopedCommit),
`partial-writes.mjs`, `dry-bind.mjs` (`simulateUnitBindings`), `unit-run-record.mjs` (`judgeUnitRun`, `removeUnitRun`,
`unitRunFacts`), `unit-run-history.mjs`. The loops are pure in `fgos-execution` (phase 06); this module runs their
commands (launch a seat through phase 16, verify, commit). The `CaseAdmission` trait (phase 06) gets its one S6a
adapter here: the peer over a dedicated fd (P4).

## Requirements

- `packages/execution/engine/src/unit_run/` ports them; `--worktree` checkouts through `fgos-checkout`.
- Peer adapter: JSON lines on an inherited fd, request/response ids, protocol number (refuse `host-version-mismatch`),
  the four operations with the Node port's payloads, `onUnitRunCreated` as an acknowledged event message, no
  `onCaseAdmitted` (the parent records inside its `admit` handler). Contract file
  `packages/execution/contracts/admission-peer.v1.json` (message shapes + vectors).
- The port is asked only where Node asks it today (phase 00 section 3); a run that never asks opens no channel.
- Provenance under `.fgos/assignments/<unitRunId>/` byte-compatible with Node's (vectors).
- Golden vectors `packages/execution/contracts/unit-run.v1.json`; integration tests: solo read-only, reviewed with
  writes committed, admission refused, admission peer that dies mid-run (the run fails closed, no commit).

## Steps

Record vectors; red `engine/tests/unit_run.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test unit_run`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: a write committed after consent was withdrawn (`recheckEffect` skipped). Test "recheck refused, nothing
committed". Rollback: revert.
