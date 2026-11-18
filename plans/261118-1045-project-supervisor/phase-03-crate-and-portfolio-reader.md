# Phase 3 — Crate scaffold, portfolio reader, contracts

Creates the one crate `fgos-supervision` (PS-1) with every dependency its later phases need, declares every module in
`lib.rs` once, and creates each module as a stub, so later phases replace their own stub file and never touch `lib.rs`,
`Cargo.toml` or `Cargo.lock`. Also writes the first module: the portfolio reader (plan frontmatter only, no Work
items), and the contracts the crate and the Node side share. Rust.

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `core/skills/_shared/plan-contract.md` sections 2-4: status (`draft|ready|running|done|withdrawn`), priority `P0-P3`, `blockedBy`, `footprint`, phase table columns.
- `scripts/plan-contract-check.mjs`: `STATUSES` `:19`, `PRIORITIES` `:25`, `TABLE_COLUMNS` `:26`, `findPhaseTable` `:45`, `overlaps` `:31`; test `test/scripts/plan-contract-check.test.mjs`.
- Crate template: `packages/observe/rust/Cargo.toml` (workspace version, edition, rust-version). Root `Cargo.toml:2` `members` list takes one path per crate.
- YAML: `packages/yaml-doc/rust/src/document.rs:106` `parse(bytes, profile, file)`. Never add a second YAML parser.
- Event Store: consumer registry `packages/event-store/contracts/consumers.v1.json` (mailbox row is the template: `{id, contractFile}`); stream contract template `packages/mailbox/contracts/event-streams.v1.json`; `test/event-store/consumers.test.mjs:16-21` requires every consumer `contractFile` in `package.json` `files`.
- Kind declaration format: ops-metrics phase 1 step 3 (`plans/261118-0936-ops-metrics/phase-01-record-contract.md:37`). **Wait: ops-metrics phase 1** must be landed; read the loaded declaration shape from its contract file.
- Kind attrs and measures: `docs/discussions/ops-metrics/DISCUSSION.md:302-309`.
- Head name rule: `src/session-host/head-start.mjs:21` (`NAME_PATTERN`, 1-32 of `[a-z0-9-]`); project handle: `fgos identity project` (`docs/platform/identity/spec.md` §5 "Verbs"; Convention `project-handle`, up to 40 chars).

## Footprint
`Cargo.toml`, `Cargo.lock`, `package.json`, `packages/supervision/rust/Cargo.toml`, `packages/supervision/rust/src/**`
(`lib.rs`, `portfolio.rs`, and the stubs `queue.rs`, `watcher.rs`, `notify.rs`, `wake.rs`, `supervisor.rs`, `land.rs`,
`discussion_source.rs`), `packages/supervision/rust/tests/portfolio.rs`, `packages/supervision/contracts/**`,
`packages/supervision/rust/observe-kinds.json`, `packages/event-store/contracts/consumers.v1.json`,
`scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`.

## Steps
1. `packages/supervision/rust/Cargo.toml`: package `fgos-supervision`. Dependencies, every one later phases need
   (they never edit this file): `fgos-yaml-doc`, `fgos-git`, `fgos-write-scope` (`packages/git/write-scope`, footprint
   matching for land), `fgos-holder-lock`, `fgos-identity`, `fgos-event-store` (queue: `append.rs:177`, `read.rs:468`),
   `fgos-observe` (discussion `RecordSource`, tick span), `sha2` (event ids), `serde`, `serde_json`, `thiserror`.
   Dev-dependencies: `tempfile` (or the workspace's temp-dir helper, step 0 picks the one other crates use) and the
   Git / Event Store test-support crates or features phases 7, 8, 13 and 14 name (step 0 lists them from
   `packages/git/rust/tests/support` and `packages/event-store/rust/tests`). No `fgos-config` (the host composes config
   values and passes them in). Use only workspace dependency versions. Add the path to root `members`; build once so
   `Cargo.lock` takes its single change.
2. `lib.rs` declares every module: `portfolio`, `queue`, `watcher`, `notify`, `wake`, `supervisor`, `land`,
   `discussion_source`. Create each module file other than `portfolio.rs` as a one-line doc-comment stub; the phase that
   fills a module replaces only its stub's bytes.
3. Contract `packages/supervision/contracts/plan-vocabulary.v1.json`: statuses, priorities, phase-table columns, and
   `headName: {max: 32, projectPrefix: 8}` (PS-11). `scripts/plan-contract-check.mjs` reads this file in place of its
   constants (`STATUSES`, `PRIORITIES`, `TABLE_COLUMNS`), keeping the exported names. `LEGACY_STATUS` stays in the
   script. The Rust reader embeds the same file with `include_str!`; the Node resolver of phase 10 reads it. One source.
4. `portfolio.rs`: pure over text, no filesystem:
   - `Plan { dir, title, status, priority, created, blocked_by, footprint, source, phases }`; `read_plan(dir, text) -> Result<Plan, PlanRefusal>` (frontmatter via yaml-doc; refusal codes `plan-frontmatter-missing`, `plan-status-unknown`, `plan-priority-unknown`).
   - `order(&mut [Plan])`: priority, then `created`, then dir name.
   - `admissible(plans, done_dirs) -> Vec<&Plan>`: status `ready`, every `blockedBy` dir `done`, no `footprint` overlap with a `running` plan (same rule as the script's `overlaps`).
   - `head_name(project_handle, dir) -> String`: handle cut to `projectPrefix` (trailing `-` trimmed), `-`, the dir cut so the whole is at most `max`; `supervisor_name(project_handle)`: the handle cut to `max`. `collisions(plans, handle)` reports two plans that are not `done`/`withdrawn` whose names are equal or one a prefix of the other (PS-11).
5. `packages/supervision/contracts/event-streams.v1.json`: stream types `supervision.event-raised` and
   `supervision.event-handled` (same fields as the mailbox rows: domain, schemaVersion, scope `project`, sealOnWrite
   false). Register consumer `supervision` in `consumers.v1.json`. Add `packages/supervision/contracts` to `package.json`
   `files` (the consumers test requires it; the plan-vocabulary contract also ships, since `scripts/` ships and reads it).
6. `observe-kinds.json` (crate-embedded):
   - `fgos.watcher.tick` (span): attrs `fgos.watcher.mode` (active|idle), `fgos.watcher.outcome`
     (noop|woke-supervisor|notified|error|skipped-busy); measures `fgos.watcher.interval` (s), `fgos.plans.ready`,
     `fgos.plans.running`, and the counters `fgos.watcher.raised`, `fgos.watcher.duplicate`, `fgos.watcher.wakes`,
     `fgos.watcher.notifies`, `fgos.watcher.errors`, `fgos.watcher.unmeasured`. Phase 11 emits exactly these names.
   - `fgos.supervisor.wake` (span, emitted by the wake door): attrs `fgos.supervisor.trigger`, `fgos.supervisor.outcome`
     (started|already-live|starting|nothing-unhandled|nothing-admissible|identity-unknown|role-held-other-project|project-id-missing|start-failed|backoff),
     ref session. The DISCUSSION's per-session outcome list (noop|lead-started|...) is not produced: the wake span is
     the door's, and `supervisor-idle-burn` reads `started` wakes while no plan is ready or running. Recorded in the
     spec's decision history (phase 1 links it).
   - `fgos.discussion.status` (attrs `fgos.discussion.from`, `fgos.discussion.to`, `fgos.discussion.path`; ref the
     discussion dir or report stem). Injection into the host is phase 16.
7. Tests, `tests/portfolio.rs`, one proof each: order by priority then created; `blockedBy` not done is not admissible;
   overlap with a running plan is not admissible; `head_name("forgent", "261118-0947-session-verb-for-agent-sessions")`
   is 32 chars with the `forgent-` prefix and a colliding pair is reported; a `done` plan never collides; every real
   `plans/*/plan.md` of this repo with `contract: plan-v1` reads. Add one test in
   `test/scripts/plan-contract-check.test.mjs` that the script's statuses equal the contract file's.

## Verify
- `cargo test -p fgos-supervision` passes; `cargo clippy -p fgos-supervision -- -D warnings`.
- `node scripts/run-tests.mjs test/scripts/plan-contract-check.test.mjs test/event-store/consumers.test.mjs` passes.
- `node scripts/plan-contract-check.mjs --all` gives the same verdict as before the change.
- `git diff --stat Cargo.lock` shows only the new crate.

## Rollback
Revert the phase commit: the crate, contracts, consumer row and `package.json` entry go together; the script falls back
to its constants through the same revert.
