---
contract: plan-v1
title: "Work data model: the shape of the portfolio data"
status: running
lead: head:lead-forgent-261120-0625-work-data-mo
base: 8288e13ab08becd109d0c0746243b5502010aa8d
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
  - apps/fgos/tests/concurrent_plan_claim.rs
  - apps/fgos/src/wiring/session_write_publish.rs
  - apps/fgos/tests/session_write_publish.rs
  - src/session-host/head-grants.mjs
  - test/session-host/head-grants.test.mjs
  - plans/backlog/**
  - plans/discussions/**
  - plans/backlog.md
  - docs/backlog.md
  - docs/discussions/**
  - scripts/migrate-portfolio.mjs
  - src/runner/agent-roster.mjs
  - packages/supervision/rust/src/discussion_source.rs
  - packages/questions/rust/src/refcheck.rs
  - test/e2e/fixture-marketing-domain.test.mjs
  - test/runner/dispatch-confinement-backend-p03.test.mjs
  - test/runner/dispatch-confinement-machine-private.test.mjs
  - test/runner/dispatch-confinement-policies.test.mjs
  - test/session-host/head-permission-mode.test.mjs
  - test/session-host/head-request.test.mjs
  - test/session-host/head-start.test.mjs
  - test/session-rotation/rotate.test.mjs
  - test/state/domain-fields.test.mjs
  - apps/fgos/src/wiring/land.rs
  - apps/fgos/tests/landing_source_items.rs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - plans/261006-1408-advisory-capability-completion/plan.md
  - plans/261007-1800-observe-overdue-run-signal-deferred/plan.md
source:
  - docs/discussions/work-data-model/DISCUSSION.md
  - p-mc25x5pfi6
  - p-nsngcpgoi2
  - p-rw5iadsp2p
  - p-lsjboo4xzg
  - p-xyod5s5h6r
  - p-nxibnmfhra
  - p-pjouokg3jm
  - p-xmpheuduez
  - p-jxwb7vi6a3
created: 2026-11-20
---

# Work data model: the shape of the portfolio data

## Outcome
The unified portfolio data model settled in D-ADR0082 is implemented across seven phases taken from DISCUSSION.md section 7 anchors:
1. All portfolio records live under `plans/` (`plans/backlog/<p-id>-<slug>.md`, `plans/discussions/<ds-id>-<slug>/DISCUSSION.md`, `plans/<dir>/plan.md`), leaving `docs/` for evergreen documentation only.
2. Backlog items and discussions have uniform frontmatter schemas, single-word statuses, and one-direction `source:` id links (`p-...`, `ds-...`).
3. Single write door in the Rust host and `fgos session write` creates individual item files without whole-file clobbering.
4. Single portfolio contract check validates frontmatter, statuses, link integrity, and generated index consistency.
5. `plans/backlog.md` is automatically generated from item files and verified for drift.
6. Legacy plan statuses are held strictly to the plan-v1 enum (`draft`, `ready`, `running`, `done`, `withdrawn`).
7. Landing a plan with `status: done` atomically updates its cited source backlog items to `status: done` in the same commit.

## Acceptance criteria
1. Identity mints discussion IDs (`fgos identity mint --kind discussion` -> `ds-<10 base32>`); convention rules resolve paths for backlog items, discussions, and index through `fgos convention path` (`cargo test -p fgos-identity -p fgos-convention`). Cites follow-up row `p-nsngcpgoi2`.
2. Portfolio check verifies frontmatter schemas, statuses, and link integrity, failing on unknown status, invalid `source:`, or index drift (`cargo test -p fgos --test portfolio_check`, `node --test test/portfolio/portfolio-check.test.mjs`). Cites follow-up row `p-rw5iadsp2p`.
3. Concurrent claim test proves that two leads claiming the same plan are mutually excluded at landing (`cargo test -p fgos --test concurrent_plan_claim`). Cites follow-up row `p-lsjboo4xzg`.
4. `fgos session write` creates new item files under `plans/backlog/` and `plans/discussions/` with updated grants (`cargo test -p fgos --test session_write_publish`, `node --test test/session-host/head-grants.test.mjs`). Cites follow-up row `p-xyod5s5h6r`.
5. Existing `docs/backlog.md` rows migrated to `plans/backlog/<p-id>-<slug>.md` and `docs/discussions/` moved to `plans/discussions/<ds-id>-<slug>/`; `git grep docs/discussions` finds no active code references. Cites follow-up row `p-nxibnmfhra`.
6. Landing a plan with `status: done` updates its source backlog items to `status: done` in the landing commit (`cargo test -p fgos --test landing_source_items`). Cites follow-up row `p-pjouokg3jm`.
7. `node scripts/plan-contract-check.mjs --all` exits 0 with all plans adhering to the plan-v1 enum. Cites follow-up row `p-xmpheuduez`.
8. Full workspace suites pass: `cargo test --workspace` and `npm test` green.

## Non-goals
- Designing or implementing Work code or UI adapters (Work remains frozen as history). Triage of the ~273 open Work items is handled as an independent backlog item (`p-jxwb7vi6a3`) per DISCUSSION.md round 12.
- Moving the plan claim to the Event Store.
- Adding a new portfolio event stream in Event Store (portfolio files are authored state, git is change log).
- Implementing a heavyweight cross-machine supervisor daemon lock (proven unnecessary by Phase 3's concurrent claim test and Identity role exclusion).

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

The plan consists of seven phases taken directly from DISCUSSION.md section 7 anchors in dependency order: ids and paths first, plan statuses last.

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Identity and convention for the new kinds](phase-01-ids-and-paths.md) | - | packages/identity/rust/src/**, packages/identity/contracts/**, packages/convention/rust/src/**, packages/convention/contracts/**, packages/identity/rust/tests/**, packages/convention/rust/tests/** | 1 | done |
| 2 | [Item contract, check and generated index](phase-02-item-check.md) | 1 | packages/portfolio/**, src/portfolio/**, apps/fgos/src/wiring/portfolio.rs, apps/fgos/tests/portfolio_check.rs, test/portfolio/** | 2 | done |
| 3 | [Concurrent claim is refused at landing](phase-03-claim-test.md) | - | apps/fgos/tests/concurrent_plan_claim.rs | 1 | ready |
| 4 | [Replace plan 261119-1615 phase 4](phase-04-1615-phase4.md) | 2 | apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs, src/session-host/head-grants.mjs, test/session-host/head-grants.test.mjs | 3 | ready |
| 5 | [Migration of backlog and discussions](phase-05-migration.md) | 1, 2, 4 | plans/backlog/**, plans/discussions/**, plans/backlog.md, docs/backlog.md, docs/discussions/**, scripts/migrate-portfolio.mjs, src/runner/agent-roster.mjs, packages/supervision/rust/src/discussion_source.rs, packages/questions/rust/src/refcheck.rs, test/e2e/fixture-marketing-domain.test.mjs, test/runner/dispatch-confinement-*.test.mjs, test/session-host/head-request.test.mjs, test/session-host/head-start.test.mjs, test/session-host/head-permission-mode.test.mjs, test/session-rotation/rotate.test.mjs, test/state/domain-fields.test.mjs | 4 | ready |
| 6 | [Landing writes item done](phase-06-landing-done.md) | 2, 5 | apps/fgos/src/wiring/land.rs, apps/fgos/tests/landing_source_items.rs | 5 | ready |
| 7 | [Plan statuses held to plan-v1](phase-07-plan-status.md) | 6 | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, plans/261006-1408-advisory-capability-completion/plan.md, plans/261007-1800-observe-overdue-run-signal-deferred/plan.md | 6 | ready |

Wave 1 runs independent foundational phases: phase 1 (identity and convention rules) and phase 3 (claim refusal test); footprints are disjoint. Wave 2 builds the item contract, check and index generator. Wave 3 updates session write and grants for individual item files. Wave 4 migrates existing backlog rows and discussions into `plans/`. Wave 5 enables landing auto-completion for source items. Wave 6 enforces strict plan-v1 statuses.

All phases 1-7 are marked `ready` and may execute in wave order (wave 1 through wave 6).

## Owner questions
- `q-x3ata7iuej`: Decided by owner 2026-11-20: "Map partial to draft, deferred to withdrawn" (`plans/261006-1408-advisory-capability-completion/plan.md` -> `draft`, `plans/261007-1800-observe-overdue-run-signal-deferred/plan.md` -> `withdrawn`). Acked; unblocks phase 07.

## Risks and rollback
- Migration footprint: Phase 5 moves all discussions and splits `docs/backlog.md`. Rollback: atomic revert of the migration commit.
- Reference drift in code/specs: mechanical rewrite with mapping table, backed by `git grep` verification.
- Revert path: Each phase lands on `main` independently; any phase can be reverted with `git revert` without breaking trunk stability.
