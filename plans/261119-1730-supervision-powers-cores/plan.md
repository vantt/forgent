---
contract: plan-v1
title: "Supervision powers, part 1: the four Rust cores (raise, drone signals, coordination evidence and prune, on-site read and type)"
status: running
lead: lead:CORES
base: 2bc1ed73f3932fc2ecc1bbccf4344019181757c7
priority: P1
blockedBy: []
footprint:
  - plans/261119-1730-supervision-powers-cores/**
  - packages/supervision/rust/src/queue.rs
  - packages/supervision/rust/tests/queue.rs
  - core/watcher/definitions/**
  - core/config-standard/watcher.yaml
  - core/config-schema/watcher.schema.yaml
  - packages/supervision/rust/tests/definitions.rs
  - packages/supervision/rust/tests/fixtures/definitions/**
  - packages/observe/rust/**
  - packages/supervision/rust/observe-kinds.json
  - packages/terminal-control/rust/**
  - packages/terminal-control/contracts/**
source:
  - docs/discussions/secretary-supervisor-powers/DISCUSSION.md
  - p-xnu3jnds2u
created: 2026-11-19
---

# Supervision powers, part 1: the cores

## Outcome
The four new mechanisms the settled discussion asks for exist as tested Rust cores, none of them reachable by a head yet:
a coordination event can be raised by a caller (SP-D3, SP-D7); the watcher raises the SP-D5 tier-1 signals for every
Identity session of the project; Observe records coordination evidence under registered kinds and can prune it by rule
(row 17); terminal control reads a session's recent screen and types into a pane (row 19, SP-D6). Part 2
(`261119-1731-supervision-powers-doors`) wires them to verbs and grants.

## Acceptance criteria
1. `cargo test -p fgos-supervision` has an owning test that `Queue::raise` records an event once by the id derived from
   kind, subject and instant, reports `Duplicate` on the same id, and refuses an unregistered kind (`bad-event`).
2. `cargo test -p fgos-supervision --test definitions` passes one match fixture and one non-match fixture per new
   definition: session gone, idle too long holding unfinished work, no commit or result for N minutes, repeated refused
   commands; each threshold is a registered key in `core/config-standard/watcher.yaml` with min and max in
   `core/config-schema/watcher.schema.yaml`.
3. `cargo test -p fgos-observe` proves the registered `fgos.coordination.*` kinds record through `RecordDoor`, and that
   `prune` removes only records of a prunable kind that are either cited by a settled finding or older than 30 days,
   leaves every other record byte for byte, and reports counts.
4. `cargo test -p fgos-terminal-control` proves `read_recent(target, lines)` returns at most `lines` trailing lines of the
   pane through the `read.screen` capability and refuses a driver without it, and `type_text` uses `send.text`.
5. `cargo clippy --workspace -- -D warnings` and `cargo test --workspace` are green on the merged tree.

## Non-goals
Verbs, request-socket entries, grants, personas and skills (part 2). Transcript readers per CLI (see Prior art). New
detection kinds beyond the four SP-D5 signals. The work-management data model, mailbox reliability, the head-executor
choice (discussion Non-goals).

## Prior art (reused, and what was missing)
- Reused: `Queue` in `packages/supervision/rust/src/queue.rs` (raised minus handled folded across machines) and
  `watcher::event_id`; the definitions-as-files pattern in `core/watcher/definitions/` with `tests/definitions.rs`; the
  `RecordDoor` and the declaration merge in `packages/observe`; `read.screen`, `send.text` and `send.keys` in
  `packages/terminal-control/contracts/driver-capabilities.v1.json`; existing records `fgos.head.state`,
  `fgos.session.activity`, `fgos.run.settled` as signal sources.
- Missing: any raise path for a caller (only the watcher raises today); any Observe prune door (none); a bounded recent
  read over the port; definitions for the four session signals.
- Why no per-CLI transcript adapters (row 19, left to the planner): the screen is the same for every CLI, so one
  adapter covers claude, codex and agy; a transcript needs one reader per CLI and a path discovery each. The screen shows
  only what is still on it, which is the accepted limit; a transcript reader is a backlog row if a real stuck session
  proves the screen too short.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Raise a coordination event from a caller](phase-01-raise-core.md) | - | packages/supervision/rust/src/queue.rs, packages/supervision/rust/tests/queue.rs | 1 | done |
| 2 | [Drone definitions for the four session signals](phase-02-drone-definitions.md) | - | core/watcher/definitions/**, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/** | 1 | done |
| 3 | [Coordination evidence kinds and the Observe prune door](phase-03-evidence-prune.md) | - | packages/observe/rust/**, packages/supervision/rust/observe-kinds.json | 1 | done |
| 4 | [Bounded recent read and pane typing in terminal control](phase-04-on-site-core.md) | - | packages/terminal-control/rust/**, packages/terminal-control/contracts/** | 1 | ready (resume: branch supervision-powers-cores/p04, unit ticket c-8026-1795219232378; the 2026-11-21 freeze was cancelled by the owner) |
| 5 | [Merge and full gate](phase-05-integration.md) | 1, 2, 3, 4 | plans/261119-1730-supervision-powers-cores/** | 2 | ready |

Checked with `node scripts/plan-contract-check.mjs --plan plans/261119-1730-supervision-powers-cores` and
`fgos resource-check --plan plans/261119-1730-supervision-powers-cores` (results in the plan's landing commit).
Phases 1 to 4 share no file, so all four run at once. Config keys of phase 2 are the only config touched here
(AGENTS.md install gate: registered in `core/config-standard` and `core/config-schema`, nowhere else).

## Owner questions
None. Row 19 and the raise verb name were handed to the planner by the discussion and are decided here (screen, one
adapter; `fgos supervisor raise`, in part 2).

## Risks and rollback
- A signal needs a record no producer writes today (likeliest: refused commands). Phase 2 step 1 lists, per signal, the
  existing record that carries it; a signal with none is reported to the lead as a gap and that definition is not shipped,
  the other three are. No new producer is built in this plan.
- Prune deletes Log data. It touches only kinds declared prunable and has a dry-run result that the test asserts before
  the delete test. Revert: land the revert of the phase; deleted records are not restored, which is why dry-run is the
  default mode of the core.
- Each phase is one revert on `main`; nothing is reachable by a head until part 2 lands.
