# Phase 3 — Crate scaffold, portfolio reader, contracts

Creates the one crate `fgos-supervision` (PS-1) and declares every module in `lib.rs` once, so later phases add module files and never touch `lib.rs` or `Cargo.lock`. Also writes the first module: the portfolio reader (plan frontmatter only, no Work items). Rust.

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `core/skills/_shared/plan-contract.md` sections 2-4: status (`draft|ready|running|done|withdrawn`), priority `P0-P3`, `blockedBy`, `footprint`, phase table columns.
- `scripts/plan-contract-check.mjs`: `STATUSES` `:19`, `PRIORITIES` `:25`, `TABLE_COLUMNS` `:26`, `findPhaseTable` `:45`; test `test/scripts/plan-contract-check.test.mjs`.
- Crate template: `packages/observe/rust/Cargo.toml` (workspace version, edition, rust-version). Root `Cargo.toml:2` `members` list takes one path per crate.
- YAML: `packages/yaml-doc/rust/src/document.rs:106` `parse(bytes, profile, file)`. Never add a second YAML parser (no npm or crate YAML dependency).
- Event Store consumer registry: `packages/event-store/contracts/consumers.v1.json` (mailbox row is the template: `{id, contractFile}`); stream contract template `packages/mailbox/contracts/event-streams.v1.json`.
- Kind declaration format: ops-metrics phase 1 step 3 (`plans/261118-0936-ops-metrics/phase-01-record-contract.md:37`). **Wait: ops-metrics phase 1** must be landed; read the loaded declaration shape from its contract file.
- Kind attrs and measures: `docs/discussions/ops-metrics/DISCUSSION.md:302-309`.

## Footprint
`Cargo.toml`, `Cargo.lock`, `packages/supervision/rust/Cargo.toml`, `packages/supervision/rust/src/lib.rs`, `packages/supervision/rust/src/portfolio.rs`, `packages/supervision/rust/tests/portfolio.rs`, `packages/supervision/contracts/**`, `packages/supervision/rust/observe-kinds.json`, `packages/event-store/contracts/consumers.v1.json`, `scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`.

## Steps
1. `packages/supervision/rust/Cargo.toml`: package `fgos-supervision`; dependencies only on `fgos-yaml-doc`, `fgos-git`, `fgos-holder-lock`, `fgos-identity`, `serde`, `serde_json`, `thiserror`. No `fgos-config` (the host composes config values and passes them in). Add the path to root `members`; build once so `Cargo.lock` takes its single change.
2. `lib.rs` declares every module of the plan, empty files not created: `portfolio`, `queue`, `watcher`, `notify`, `wake`, `supervisor`, `land`, `discussion_source`. Each later phase creates its own file; until then the declaration is `pub mod x;` behind the file's existence, so create each as a one-line doc-comment stub owned by the phase that fills it (stub bytes are the only thing a later phase replaces).
3. Contract `packages/supervision/contracts/plan-vocabulary.v1.json`: statuses, priorities, phase-table columns. `scripts/plan-contract-check.mjs` reads this file in place of its constants (`STATUSES`, `PRIORITIES`, `TABLE_COLUMNS`), keeping the exported names. `LEGACY_STATUS` stays in the script. The Rust reader embeds the same file with `include_str!`. One source, two readers.
4. `portfolio.rs`: pure over text, no filesystem:
   - `Plan { dir, title, status, priority, created, blocked_by, footprint, phases }`; `read_plan(dir, text) -> Result<Plan, PlanRefusal>` (frontmatter via yaml-doc; refusal codes `plan-frontmatter-missing`, `plan-status-unknown`, `plan-priority-unknown`).
   - `order(&mut [Plan])`: priority, then `created`, then dir name.
   - `admissible(plans, done_dirs) -> Vec<&Plan>`: status `ready`, every `blockedBy` dir `done`, no `footprint` overlap with a `running` plan (same rule as the script's `overlaps`).
   - `head_name(dir) -> String`: dir cut to 32 chars; `collisions(plans) -> Vec<(String, Vec<dir>)>` when two cut names are equal or one is a prefix of another (PS-11).
5. `packages/supervision/contracts/event-streams.v1.json`: stream types `supervision.event-raised` and `supervision.event-handled` (same fields as the mailbox rows: domain, schemaVersion, scope, sealOnWrite false). Register consumer `supervision` in `consumers.v1.json`.
6. `observe-kinds.json` (crate-embedded): `fgos.watcher.tick` (attrs `fgos.watcher.mode` active|idle, `fgos.watcher.outcome` noop|woke-supervisor|notified|error; measures `fgos.watcher.interval`, `fgos.plans.ready`, `fgos.plans.running`), `fgos.supervisor.wake` (attrs `fgos.supervisor.trigger`, `fgos.supervisor.outcome`; ref session), `fgos.discussion.status` (attrs `fgos.discussion.state`, ref the document path). Injection into the host is phase 16.
7. Tests, `tests/portfolio.rs`, one proof each: order by priority then created; `blockedBy` not done is not admissible; overlap with a running plan is not admissible; 43-char dir `261118-0947-session-verb-for-agent-sessions` cuts to 32 and a colliding pair is reported; every real `plans/*/plan.md` of this repo with `contract: plan-v1` reads. Add one test in `test/scripts/plan-contract-check.test.mjs` that the script's statuses equal the contract file's.

## Verify
- `cargo test -p fgos-supervision` passes; `cargo clippy -p fgos-supervision -- -D warnings`.
- `node scripts/run-tests.mjs test/scripts/plan-contract-check.test.mjs` passes.
- `node scripts/plan-contract-check.mjs --all` gives the same verdict as before the change.
- `git diff --stat Cargo.lock` shows only the new crate.

## Rollback
Revert the phase commit: the crate, contract and consumer row go together; the script falls back to its constants through the same revert.
