---
contract: plan-v1
title: "Work data model: the shape of the portfolio data"
status: draft
base: 6471fa5d8310fadd1da0675d4ed7a58606a4bb6c
priority: P1
blockedBy: []
footprint:
  - plans/261120-0625-work-data-model/**
  - packages/identity/rust/src/**
  - packages/identity/contracts/**
  - packages/convention/rust/src/**
  - packages/convention/contracts/**
  - packages/identity/rust/tests/**
  - packages/convention/rust/tests/**
  - packages/portfolio/**
  - src/portfolio/**
  - apps/fgos/src/wiring/portfolio.rs
  - apps/fgos/tests/portfolio_check.rs
  - test/portfolio/**
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - plans/261006-1408-advisory-capability-completion/plan.md
  - plans/261007-1800-observe-overdue-run-signal-deferred/plan.md
  - plans/backlog/**
  - plans/discussions/**
  - plans/backlog.md
  - docs/backlog.md
  - docs/discussions/**
  - scripts/migrate-portfolio.mjs
  - src/session-host/head-grants.mjs
  - src/runner/agent-roster.mjs
  - packages/supervision/rust/src/discussion_source.rs
  - packages/questions/rust/src/refcheck.rs
  - apps/fgos/src/wiring/land.rs
  - apps/fgos/tests/landing_source_items.rs
  - apps/fgos/src/wiring/session_write_publish.rs
  - apps/fgos/tests/session_write_publish.rs
  - test/session-host/head-grants.test.mjs
  - apps/fgos/tests/concurrent_plan_claim.rs
  - CHANGELOG.md
  - docs/platform/system-overview/spec.md
source:
  - docs/discussions/work-data-model/DISCUSSION.md
  - p-mc25x5pfi6
  - p-nsngcpgoi2
  - p-rw5iadsp2p
  - p-nxibnmfhra
  - p-xmpheuduez
  - p-pjouokg3jm
  - p-xyod5s5h6r
  - p-lsjboo4xzg
  - p-jxwb7vi6a3
created: 2026-11-20
---

# Work data model: the shape of the portfolio data

## Outcome
The unified portfolio data model settled in D-ADR0082 is fully implemented, verified, and adopted:
1. All portfolio records live under `plans/` (`plans/backlog/<p-id>-<slug>.md`, `plans/discussions/<ds-id>-<slug>/DISCUSSION.md`, `plans/<dir>/plan.md`), leaving `docs/` for evergreen documentation only.
2. Backlog items and discussions have uniform frontmatter schemas, single-word statuses, and one-direction `source:` id links (`p-...`, `ds-...`).
3. Single write door in the Rust host and `fgos session write` creates individual item files without whole-file clobbering.
4. Single portfolio contract check validates frontmatter, statuses, link integrity, and generated index consistency.
5. `plans/backlog.md` is automatically generated from item files and verified for drift.
6. Legacy plan statuses are held strictly to the plan-v1 enum (`draft`, `ready`, `running`, `done`, `withdrawn`).
7. Landing a plan with `status: done` atomically updates its cited source backlog items to `status: done` in the same commit.

## Acceptance criteria
1. Identity mints discussion IDs (`fgos identity mint --kind discussion` -> `ds-<10 base32>`); convention rules resolve paths for backlog items, discussions, and index through `fgos convention path` (`cargo test -p fgos-identity -p fgos-convention`).
2. Portfolio check verifies frontmatter schemas, statuses, and link integrity, failing on unknown status, invalid `source:`, or index drift (`cargo test -p fgos --test portfolio_check`, `node --test test/portfolio/portfolio-check.test.mjs`).
3. `node scripts/plan-contract-check.mjs --all` exits 0 with all plans adhering to the plan-v1 enum.
4. Existing `docs/backlog.md` rows migrated to `plans/backlog/<p-id>-<slug>.md` and `docs/discussions/` moved to `plans/discussions/<ds-id>-<slug>/`; `git grep docs/discussions` finds no active code references.
5. Landing a plan with `status: done` updates its source backlog items to `status: done` in the landing commit (`cargo test -p fgos --test landing_source_items`).
6. `fgos session write` creates new item files under `plans/backlog/` and `plans/discussions/` with updated grants (`cargo test -p fgos --test session_write_publish`, `node --test test/session-host/head-grants.test.mjs`).
7. Concurrent claim test proves that two leads claiming the same plan are mutually excluded at landing (`cargo test -p fgos --test concurrent_plan_claim`).
8. Full workspace suites pass: `cargo test --workspace` and `npm test` green.

## Non-goals
- Designing or implementing Work code or UI adapters (Work remains frozen as history).
- Moving the plan claim to the Event Store.
- Adding a new portfolio event stream in Event Store (portfolio files are authored state, git is change log).
- Implementing a heavyweight cross-machine supervisor daemon lock (proven unnecessary by the concurrent claim test and Identity role exclusion).

## Prior art (reused, and what was missing)
- Reused:
  - `fgos identity mint` pattern for minted artifact IDs (expanded with `ds-`).
  - `packages/convention/` rules engine and golden fixtures.
  - `scripts/plan-contract-check.mjs` frontmatter and wave collision validation rules.
  - `src/session-host/head-grants.mjs` and `apps/fgos/src/wiring/session_write_publish.rs` atomic file write and commit infrastructure.
  - Plan landing door merge slot and commit infrastructure (`apps/fgos/src/wiring/land.rs`).
- Missing:
  - Discussion mint kind in Identity.
  - Convention paths for individual backlog item files and generated `plans/backlog.md`.
  - Item contract check and index generator for the portfolio.
  - Plan landing door automation to mark source items `done`.
  - Migration script and upgrade verb for existing repositories.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Identity and convention for new kinds](phase-01-identity-and-convention.md) | - | packages/identity/rust/src/**, packages/identity/contracts/**, packages/convention/rust/src/**, packages/convention/contracts/**, packages/identity/rust/tests/**, packages/convention/rust/tests/** | 1 | draft |
| 2 | [Item contract, check and generated index](phase-02-item-contract-check-index.md) | 1 | packages/portfolio/**, src/portfolio/**, apps/fgos/src/wiring/portfolio.rs, apps/fgos/tests/portfolio_check.rs, test/portfolio/** | 2 | draft |
| 3 | [Plan statuses held to plan-v1](phase-03-plan-status-enforcement.md) | - | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, plans/261006-1408-advisory-capability-completion/plan.md, plans/261007-1800-observe-overdue-run-signal-deferred/plan.md | 1 | draft |
| 4 | [Migration of backlog and discussions](phase-04-migration-backlog-discussions.md) | 1, 2, 3 | plans/backlog/**, plans/discussions/**, plans/backlog.md, docs/backlog.md, docs/discussions/**, scripts/migrate-portfolio.mjs, src/session-host/head-grants.mjs, src/runner/agent-roster.mjs, packages/supervision/rust/src/discussion_source.rs, packages/questions/rust/src/refcheck.rs | 3 | draft |
| 5 | [Landing writes source items done](phase-05-landing-writes-source-items-done.md) | 2, 4 | apps/fgos/src/wiring/land.rs, apps/fgos/tests/landing_source_items.rs | 4 | draft |
| 6 | [Session write creates one item file](phase-06-session-write-item-files.md) | 2, 4 | apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs, src/session-host/head-grants.mjs, test/session-host/head-grants.test.mjs | 4 | draft |
| 7 | [Concurrent claim refusal test](phase-07-concurrent-claim-refusal-test.md) | - | apps/fgos/tests/concurrent_plan_claim.rs | 1 | draft |
| 8 | [Triage open Work items](phase-08-triage-open-work-items.md) | - | plans/261120-0625-work-data-model/reports/work-triage.md | 1 | draft |
| 9 | [Integration and verification](phase-09-integration-and-verification.md) | 5, 6, 7, 8 | plans/261120-0625-work-data-model/reports/integration.md, CHANGELOG.md, docs/platform/system-overview/spec.md | 5 | draft |

Wave 1 runs independent foundational phases: phase 1 (identity and convention rules), phase 3 (plan-v1 status cleanup), phase 7 (claim refusal test), and phase 8 (work items triage report); footprints are completely disjoint. Wave 2 builds the item contract, check and index generator. Wave 3 migrates existing backlog rows and discussions into `plans/`. Wave 4 adds landing auto-completion and session write for item files. Wave 5 integrates and verifies the whole repository.

## Owner questions
None. All 13 rounds of discussion in `docs/discussions/work-data-model/DISCUSSION.md` were confirmed and settled with the owner as D-ADR0082. The two legacy plans marked `partial` and `deferred` are migrated to `draft` and `withdrawn` respectively for Phase 3.

## Risks and rollback
- Footprint scale during migration: Phase 4 moves all discussions and splits `docs/backlog.md`. Rollback: atomic revert of the migration commit.
- Reference drift in external documentation: mechanical rewrite with mapping table, backed by `git grep` verification.
- Revert path: Each phase lands on `main` independently; any phase can be reverted with `git revert` without breaking trunk stability.
