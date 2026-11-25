---
contract: plan-v1
title: "Portfolio component: one domain-agnostic owner of a project's initiatives and phases, with one reader, one write door, a read port and a request port"
status: draft
priority: P1
blockedBy: []
footprint:
  - plans/261125-2137-domain-agnostic-item-component/**
  - packages/component-authority/model/**
  - packages/portfolio/**
  - test/portfolio/**
  - core/skills/_shared/plan-contract.md
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - Cargo.toml
  - Cargo.lock
  - apps/fgos/**
  - packages/supervision/rust/**
  - packages/host-runtime/contracts/command-manifest.json
  - src/cli/command-registry.mjs
  - bin/fgos.mjs
  - src/workflow/case-start.mjs
  - src/workflow/propose.mjs
  - test/workflow/**
  - core/skills/**
  - domains/coding/skills/**
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - src/session-host/**
  - packages/session-host/**
  - test/session-host/**
  - plans/backlog/**
  - plans/initiatives/**
  - core/config-standard/sessionRotation.yaml
  - packages/convention/contracts/**
  - packages/durable-file/rust/tests/dir_replace.rs
  - packages/execution/contracts/transport-round/session-attempt.v1.json
  - packages/execution/engine/tests/transport_round.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - scripts/check-backlog-reconciliation.mjs
  - scripts/check-decision-citation-drift.mjs
  - scripts/check-decision-citation-drift.baseline.json
  - scripts/identity-ids-unique.mjs
  - src/runner/merge.mjs
  - test/runner/merge.test.mjs
  - test/scripts/**
  - test/session-rotation/**
  - test/setup/gitignore-docs-history-not-excluded.test.mjs
  - docs/platform/portfolio/**
  - docs/platform/work-state/spec.md
  - docs/platform/supervision/spec.md
  - docs/platform/workflow/spec.md
  - docs/platform/runner/decisions/**
  - docs/decisions/index.md
  - docs/reading-map.md
  - CHANGELOG.md
base: 87abd4c89b89507e096e2eea3955bb0308039b0e
source:
  - plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md
  - p-2qle2tjflb
created: 2026-11-25
---

# Portfolio component: one owner of a project's work items

Answers the settled discussion `ds-ubqlutna6r` (§6 design, §7 tasks). Every choice below cites its
decision row there (A2–A8); none is reopened here.

## Outcome

One domain-agnostic component, `portfolio`, sits below Workflow and Supervision (A7) and owns the work
items of one project (A5 a): initiatives (top item, one file) and phases (leaf cards of the initiative's
one plan) (A5 b, f). It has:

- one reader of the portfolio files, merged from the two Rust readers that exist today, with both old
  paths deleted (A7, L10);
- one write door that records the three kinds of fact (coordination, progress, life), checks each one,
  derives the stage from the pinned workflow's stage list, pins the workflow on leaving Init, and moves
  the file from `plans/backlog/` to `plans/initiatives/` (A4, A5 e, A8);
- `fgos portfolio check`, the same checks read-only, for files edited without fgOS (A4, A8);
- a read port (cards, a version per card, a change feed) and a request port (identity, base version,
  idempotency key, reason codes), and one board definition per project (A6);
- every holder recording its own facts through the door; Workflow takes an opaque caller reference and
  records nothing in the portfolio (A4).

The existing portfolio is migrated onto file contract v2, and the spec, decision record and changelog
say so.

## Acceptance criteria

1. `fgos portfolio check` exits 0 on migrated `main` (phase 9).
2. One initiative runs Init → Retrospective with every fact recorded by its decider through the door,
   and no stage written by hand (phase 7, end-to-end test named there).
3. The read port answers "all cards" and "changed since V": `cargo test -p fgos-portfolio read_port`
   (phase 6).
4. The request port refuses a stale base version, a replayed key and an unknown caller with reason
   codes: `cargo test -p fgos-portfolio request_port` (phase 8).
5. `fgos authority model` shows the `portfolio` row below Workflow; "portfolio status" is gone from
   Supervision's `owns`; `node --test test/architecture.test.mjs` passes (phase 1).
6. `apps/fgos/src/wiring/portfolio.rs`, `packages/supervision/rust/src/portfolio.rs` and the dead Node
   twin under `packages/portfolio/*.mjs` no longer exist; `rg -l "wiring::portfolio"` finds nothing
   (phase 4).
7. `node scripts/plan-contract-check.mjs` warns on a phase with 9 numbered steps and not on one with 8
   (phase 2).
8. `npm test` and `cargo test --workspace` are green on the integrated tree (phase 11).

## Non-goals

- T2 outside-tool sync design (separate topic; raised as a backlog row at hand-off).
- Views across projects (gateway or outside UX, A5 a).
- Item nesting below the phase (A5 b, I37–I38).
- Workflow's step graph and its vocabulary, I12 and I14 (Workflow's own questions).
- Reviving Work's store; `tsk-` items stay frozen history (A3, A8).
- Building a board UI; this plan ships the ports a board calls.

## Prior art

- **Reused.** `apps/fgos/src/wiring/portfolio.rs` (parse, check, index, `create_item`, `edit_item`;
  used by `land` and `migrate portfolio`) is the base of the one reader and the door's checks. The
  contracts under `packages/portfolio/contracts/` (v1) are the base of v2. `resolveWorkflow` and
  `domains/<domain>/registry.yaml` (`workflowFor`, `defaultWorkflow`) give the workflow pin.
  `fgos identity mint backlog` mints `p-` ids. `scripts/plan-contract-check.mjs` is extended, not copied.
- **Retired.** `packages/supervision/rust/src/portfolio.rs` (Supervision's plan reader, I7, I43); the
  Node twin `packages/portfolio/*.mjs` and `test/portfolio/portfolio-check.test.mjs` (dead per I18).
- **Missing before this plan.** No verb creates or edits an item through a door, no stage, no domain or
  kind on an item, no card contract, no versions, no request port, no component row owns the reader.

## Ordering against other plans

- `261122-0056-orchestration-skeleton` (draft, blocked by five plans) lists
  `packages/supervision/rust/src/portfolio.rs` in its footprint. This plan deletes that file in phase 4,
  so the skeleton's keeper reads the portfolio read port once this plan lands (§7 order, I19). The
  keeper's item is the initiative, and the keeper wakes leads, never their children (I22). The
  skeleton's planner must narrow its footprint when it next touches that plan; this plan does not edit
  another plan.
- Work's phase T7 of `ds-wqsrwmiier` opens only after this plan lands (A2).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| the `portfolio` component (file contract, reader, door, ports), tier below Workflow | declare: component portfolio | new component (A7); needs the owner's answered q-s4oy6tinfr for `--approved-by`. Overlaps supervision "portfolio status and plan lane pool": survivor: portfolio; retired: the "portfolio status" entry of supervision `owns`, `packages/supervision/rust/src/portfolio.rs` |
| portfolio file contract v2 (initiative fields, plan `initiative:`, phase done evidence, `plans/initiatives/`, stage-list source, lenient id) | portfolio/portfolio-vocabulary.v1 | overlaps the v1 contract: survivor: portfolio/portfolio-vocabulary.v1 moved to v2; retired: `packages/portfolio/contracts/portfolio-vocabulary.v1.json` |
| initiative item schema | portfolio/backlog-item.schema.v1 | overlaps the backlog-item schema: survivor: portfolio/backlog-item.schema.v1 renamed to the initiative schema v2; retired: `packages/portfolio/contracts/backlog-item.schema.v1.json` |
| the one reader | declare: component portfolio | merges two readers: survivor: portfolio; retired: `apps/fgos/src/wiring/portfolio.rs`, `packages/supervision/rust/src/portfolio.rs`, `packages/portfolio/*.mjs` |
| the item write door and `fgos portfolio check` | declare: door portfolio-item-write-door | no row owns item writes today (I18); `fgos authority locate` matched only the unrelated `write-door` component |
| card contract, read port, change feed, board definition | declare: contract portfolio-cards | new contract (A6) |
| request port | declare: contract portfolio-requests | new contract (A6) |
| Workflow's opaque caller reference and milestone stage tags | workflow | inside Workflow's own row; replaces `--plan` and `planCaseSlug` |
| phase-size warning | supervision/plan-vocabulary.v1 | the plan contract the check enforces; a warning, never a refusal (A8) |
| work-state "status board" becomes view only; human gates leave work-state | work-state | overlaps questions on human gates (I6): survivor: questions; retired: "human gates" from work-state `owns` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Declare the component and move owners](phase-01-declare-portfolio-component.md) | - | packages/component-authority/model/** | 1 | draft |
| 2 | [Portfolio file contract v2 and phase-size warning](phase-02-file-contract-v2.md) | - | packages/portfolio/contracts/**, core/skills/_shared/plan-contract.md, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 1 | ready |
| 3 | [Workflow takes a caller reference](phase-03-workflow-caller-reference.md) | 2 | src/workflow/case-start.mjs, src/workflow/propose.mjs, test/workflow/**, src/cli/command-registry.mjs, bin/fgos.mjs, core/skills/fgos-cook/**, domains/coding/skills/fgos-coding-driving/**, domains/coding/skills/fgos-coding-planning/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 2 | ready |
| 4 | [One reader](phase-04-one-reader.md) | 1, 2 | packages/portfolio/rust/**, packages/portfolio/item.mjs, packages/portfolio/discussion.mjs, packages/portfolio/index-generator.mjs, packages/portfolio/portfolio-check.mjs, packages/portfolio/vocabulary.mjs, test/portfolio/**, Cargo.toml, Cargo.lock, apps/fgos/**, packages/supervision/rust/** | 2 | draft |
| 5 | [Item write door and check](phase-05-item-door-and-check.md) | 4 | packages/portfolio/rust/**, apps/fgos/**, packages/host-runtime/contracts/command-manifest.json | 3 | draft |
| 6 | [Read port and board definition](phase-06-read-port-and-board.md) | 5 | packages/portfolio/rust/**, apps/fgos/**, packages/portfolio/contracts/portfolio-cards.v1.json | 4 | draft |
| 7 | [Holders record their own facts](phase-07-holders-record-facts.md) | 3, 5 | core/skills/fgos-secretary/**, core/skills/fgos-supervisor/**, core/skills/fgos-shaping/**, core/skills/fgos-lead/**, domains/coding/skills/fgos-coding-shaping/**, src/session-host/**, packages/session-host/**, test/session-host/**, test/portfolio/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 4 | draft |
| 8 | [Request port](phase-08-request-port.md) | 6 | packages/portfolio/rust/**, apps/fgos/**, packages/portfolio/contracts/portfolio-requests.v1.json, packages/host-runtime/contracts/command-manifest.json | 5 | draft |
| 9 | [Migrate the existing portfolio](phase-09-migrate-portfolio.md) | 7, 8 | plans/backlog/**, plans/initiatives/**, core/config-standard/sessionRotation.yaml, core/skills/_shared/citation-format.md, packages/convention/contracts/**, packages/durable-file/rust/tests/dir_replace.rs, packages/execution/**, packages/run-supervisor/rust/tests/head_request.rs, scripts/check-backlog-reconciliation.mjs, scripts/check-decision-citation-drift.mjs, scripts/check-decision-citation-drift.baseline.json, scripts/identity-ids-unique.mjs, src/runner/merge.mjs, test/runner/merge.test.mjs, test/scripts/check-decision-citation-drift.test.mjs, test/scripts/convention-conformance.test.mjs, test/scripts/doc-health.test.mjs, test/session-rotation/**, test/setup/gitignore-docs-history-not-excluded.test.mjs, core/skills/fgos-secretary/**, core/skills/fgos-supervisor/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 6 | draft |
| 10 | [Docs and decision record](phase-10-docs-and-decision.md) | 8 | docs/platform/portfolio/**, docs/platform/work-state/spec.md, docs/platform/supervision/spec.md, docs/platform/workflow/spec.md, docs/platform/runner/decisions/**, docs/decisions/index.md, docs/reading-map.md, CHANGELOG.md | 6 | draft |
| 11 | [Integration](phase-11-integration.md) | 9, 10 | plans/261125-2137-domain-agnostic-item-component/reports/** | 7 | draft |

Phases 2 and 3 do not depend on the owner's answer and are `ready`; phase 1 waits on q-s4oy6tinfr, and
phases 4–11 wait on phase 1 through the chain. Generated skill renders (`.agents/skills/`, `plugins/fgOS/skills/`, `.claude/skills/`) are hot files: the phases that edit a skill source (2, 3, 7, 9) own them, sit in four different waves, and regenerate them with `npm run build:skills`, never hand-merging them. `apps/fgos/**` and the crate are written by phases 4, 5, 6 and 8 in four different waves.

Plan-contract reading: required keys and sections are present; every phase sits in a later wave than
its dependencies; no two phases in one wave share a footprint (checked with
`fgos resource-check --plan` and `node scripts/plan-contract-check.mjs --plan`, results in
`reports/`).

## Owner questions

- q-s4oy6tinfr: Approve declaring the new component `portfolio` in the authority model. Blocks phase 1
  only (and, through the chain, phases 4–11); phases 2 and 3 run meanwhile.
- Phase 9 raises two questions when its proposal lists exist, because the owner approves lists that do
  not exist yet (discussion §7 task-migrate): the `domain`/`kind` classification of the 535 rows, and
  the `initiative:` choice for the 33 plans that cite several rows or none. Phase 9's other steps
  proceed while those wait.

## Risks and rollback

| Risk | Level | Proof point carried to validation |
|---|---|---|
| Deleting two readers breaks `land`, `migrate portfolio`, `resource-check` or the supervisor wake | high | phase 4 runs `cargo test --workspace` plus `apps/fgos/tests/session_write_publish.rs` and `packages/supervision/rust/tests/wake.rs` against the new crate before the old files go |
| The move to `plans/initiatives/` breaks every reader that hard-codes `plans/backlog` (40 files) | medium | phase 9 repoints them and `rg -n "plans/backlog"` is reviewed file by file; `npm test` green |
| Stage derivation disagrees with a workflow's stage list | medium | phase 5 tests one derived stage per default stage and the skippable Clarify |
| The skeleton plan keeps `packages/supervision/rust/src/portfolio.rs` in its footprint | low | noted above; its planner narrows it; resource-check warns, never blocks a draft |
| The owner's classification list is late | low | phase 9 is the only phase that waits on it; `portfolio check` reports unclassified rows by name |

Rollback: each phase lands as its own commit set on `main`; revert a phase's commits with `git revert`
in reverse wave order. Phase 9's file moves are one commit, reverted whole. Nothing outside the
repository changes.
