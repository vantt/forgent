---
contract: plan-v1
title: "Operations measurement: one observe contract for writing and querying, run facts, friction, attention detections"
status: draft
priority: P1
blockedBy: []
footprint:
  - plans/261118-0936-ops-metrics/**
  - packages/observe/**
  - packages/run-result/**
  - packages/git/node-addon/src/run_result.rs
  - packages/host-runtime/contracts/command-routes.json
  - packages/config/contracts/fixtures/**
  - apps/fgos/src/wiring/**
  - apps/fgos/observe-kinds.json
  - apps/fgos/tests/**
  - src/native/door.mjs
  - src/runner/execution/run-request.mjs
  - src/runner/execution/unit.mjs
  - src/runner/execution/unit-summary.mjs
  - src/runner/execution/run.mjs
  - src/run-supervisor/steps/settle-attempt.mjs
  - src/workflow/case-verbs.mjs
  - src/runner/dispatch/settlement.mjs
  - src/runner/dispatch/usage-parsers.mjs
  - src/runner/dispatch/agent-result-claim-contract.mjs
  - src/runner/dispatch/attention-view.mjs
  - src/verbs/dispatch/inspect.mjs
  - src/observe/friction-client.mjs
  - src/cli/command-registry.mjs
  - core/skills/**
  - core/attention/**
  - core/config-standard/dispatch.yaml
  - core/config-schema/dispatch.schema.yaml
  - domains/coding/skills/**
  - domains/coding/observe/**
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - test/runner/execution/unit-summary.test.mjs
  - test/runner/execution/run-request.test.mjs
  - test/runner/usage-parsers.test.mjs
  - test/runner/run-result-source-scan.test.mjs
  - test/runner/assignment-runresult.test.mjs
  - test/runner/dispatch-runtime-inspect.test.mjs
  - test/observe/friction-client.test.mjs
  - test/suite-baseline.json
  - test/fixtures/observe/**
  - docs/architecture-manifest.json
  - docs/platform/observe/**
  - docs/backlog.md
  - CHANGELOG.md
  - packages/git/contracts/mutation-census.v1.json
  - packages/distribution/contracts/doctor-registry.v1.json
base: 37d8e82c5abb2b565d045d8163662b47ba24c24d
source:
  - docs/discussions/ops-metrics/DISCUSSION.md
  - p-s5mliyp335
  - p-mvc3d54cda
  - p-7nqygnztum
  - p-24dxhwq7zr
created: 2026-11-18
---

# Operations measurement (ops-metrics)

Design and every decision (OM-D1..D12): [DISCUSSION.md](../../docs/discussions/ops-metrics/DISCUSSION.md).
Inventory: [scout report](../reports/scout-261118-0936-ops-metrics-inventory.md). Lessons from skillstation:
[research report](../reports/research-261118-1017-skillstation-observability-lessons.md).

## Outcome

The operator answers questions about many plans with `fgos metrics query`, using named definitions kept where they
are used. The questions are:

- tokens per plan, phase, run, provider, account and model;
- time per phase and plan lead time from `ready` to `done`;
- failure rate per provider, account, model and executor;
- friction by kind, by signature and by week, linked to a plan or a backlog row;
- driving measures 1, 2 and 7 now; the owner-wait part of 2 and measure 3 once the question component emits
  `fgos.question.*` (OM-D13, OM-D14).

`fgos dispatch inspect --attention` also shows `head-gone` and `plan-no-progress` rows.

The order of work follows the owner's three layers (OM-D4):

1. **The public contract (built first and best).** One record shape for every measurement and event, plus one query
   grammar.
   - Each owner declares its kinds, attrs and measures where it uses them (OM-D12).
   - Names follow OpenTelemetry where a standard exists, and `fgos.*` elsewhere (OM-D8).
2. **Integration.** It is fail-open and records health counters, and never slows down or changes the agent or the
   process it observes.
3. **Storage.** It stays the shard JSONL that exists today, behind the contract.

Observe knows no consumer concepts (OM-D5). Plan, phase, the driving measures and the detections are data defined by
their consumers. A detection the supervisor plan adds later (pace, OM-D10), or one the question owner adds later
(OM-D11), is one more declaration and definition file. Neither needs an Observe code change.

### Prior art reused, and what was missing

**Reused:**
- `observe.observation.v1` and the `ObservationSource` trait (`packages/observe/rust/src/contract.rs:57,86`). The new
  record extends this shape instead of adding a second one.
- The shard door and the store lock (`shard.rs`, `store_lock.rs`).
- The flag grammar (`flags.rs`).
- The best-effort side channel of D-ADR0037. Today it records a write failure only to `invocation-faults`.
- The additive optional-field pattern of the `verify` block in `unit-summary.read.v3`.
- The `workflow {caseId, activity}` link on a Unit.
- `run.mjs:866`, which already reads the account selection.
- The `durationMs` that run bindings already hold (`run.mjs:862`).
- The Claude transcripts source.
- Friction settle-by-instant (spec § Friction).

**Missing:**
- a write contract;
- a registry, and declarations kept where kinds are used;
- a query grammar;
- a plan/phase key on runs;
- token parsers for every CLI except pi and codex (live data: 0 of 98 results carry tokens);
- an aggregation of duration;
- a provider/account/model dimension;
- friction kinds, trend and links;
- any non-run row in the attention view.

## Acceptance criteria

1. `cargo test -p fgos-observe` contains:
   - a fixture that writes records through the write door (fail-open under a held lock, counters raised) and reads
     them back through the query engine, covering `where`, `ref`, `by`, `bucket`, `latest-per`, `agg
     count|sum|p50|p90|max|max:ts|age:ts|span`, a group filter against k × a measure, a join, an anti-join, relative
     `since`, `insufficient`, `coverage` and `unmeasured`;
   - a test that refuses two declarations of the same name, and one that merges embedded, glob and project
     declarations.
2. Phase 7's definition test runs, over test-local declarations of `fgos.watcher.tick`, `fgos.supervisor.wake` and
   `fgos.question.*`, the definitions `head-gone`, `plan-no-progress`, `lane-freed`, `plan-became-ready`,
   `watcher-overdue`, `supervisor-idle-burn` and owner wait through `fgos metrics query --def`. No Observe source file names those
   kinds (`rg -n 'watcher\.tick|supervisor\.wake|question\.asked' packages/observe/rust/src` returns nothing).
3. Every settled attempt in `unit-summary.json` carries `accountId`, `durationMs` and `usage`. `usage` holds either
   token counts or a named `reason`, one per CLI, and is proven by the parser tests in `packages/run-result/rust` (addon `runResult.parseUsage`).
   `src/runner/dispatch/usage-parsers.mjs` is gone.
4. `fgos run --plan <dir> --phase <id>` and `fgos workflow start ... --plan <dir>` store the key. On a live run,
   `fgos metrics query --kind fgos.run.attempt --ref plan:<dir> --by gen_ai.provider.name` returns it.
5. `fgos friction record` accepts the attrs `--kind bug|instability|missing|awkward|doc` and `--ref plan:<dir>|backlog:<id>`.
   `friction rank` groups by signature (`errorClass`) with `--bucket week`, and `friction classes` lists the
   signatures. `friction resolve --class <slug> --reason filed:<p-id>` settles the whole group. The existing friction
   store is migrated, and its old write path is removed.
6. `test/runner/dispatch-runtime-inspect.test.mjs` shows `head-gone` and `plan-no-progress` rows built from
   definition files under `core/attention/definitions/`. The `plan-no-progress` threshold is the config key
   `dispatch.attention.planNoProgressMinutes` (default 60), in `core/config-standard/dispatch.yaml` and its schema.
7. `cargo test -p fgos --test driving_definitions`: the definitions under `domains/coding/observe/definitions/`
   produce measures 1, 2 (worker, failed runs, re-check) and 7, lead time and phase time on a fixture plan.
   - The owner-wait part of measure 2, measure 3 (both `requires` `fgos.question.*`) and measures 4, 5 and 6 report
     `unmeasured` with a named reason.
8. The integration gate is green on the combined tree:
   - `npm test` and `cargo test --workspace`;
   - `cargo clippy --workspace -- -D warnings`;
   - the Windows (msvc) and `aarch64-apple-darwin` compile checks;
   - `node scripts/plan-contract-check.mjs --plan plans/261118-0936-ops-metrics`.

## Non-goals

- Money and price tables (OM-D2).
- Alerts or mailbox delivery (OM-D1).
- The watcher process, its row-kind → action table, the supervisor, the pace and wake-trigger definitions, and the `fgos.watcher.tick` / `fgos.supervisor.wake` producers, which belong to the supervisor plan (OM-D10).
- The owner-question component (`fgos questions ask|answer`, asker record, answer place, waking) and the
  `fgos.question.*` declaration and producer, which belong to its own shaper (OM-D13, OM-D14).
- Moving `WorkSource` off v1 `Observation` (Work layer last); phase 16 files the row.
- Sources for driving measures 4, 5 and 6, filed as backlog rows (OM-D6).
- The council stability fix (p-24dxhwq7zr: only its measurement comes for free).
- Retention of run directories (p-tslryr3buq).
- p-ixrbglli5o.
- Moving the case, eval, snapshot and invocation-faults stores onto the contract. Each becomes its own backlog row (L10
  rest).
- OTLP ingestion. The names are aligned with OpenTelemetry so it stays cheap later.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Record contract, names and declarations](phase-01-record-contract.md) | - | packages/observe/contracts/observe.record.v2.json, packages/observe/contracts/observe-names.json, packages/observe/rust/src/contract.rs, packages/observe/rust/src/record/types/**, packages/observe/rust/src/record/registry/**, packages/observe/rust/src/record/mod.rs, packages/observe/rust/src/lib.rs, packages/observe/rust/Cargo.toml, packages/observe/rust/tests/record_*.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/wiring/mod.rs, test/fixtures/observe/record/** | 1 | draft |
| 2 | [Token usage survey per CLI](phase-02-usage-survey.md) | - | plans/261118-0936-ops-metrics/reports/usage-survey.md | 1 | draft |
| 3 | [Run record facts and plan key](phase-03-run-record-facts.md) | - | src/runner/execution/run-request.mjs, src/runner/execution/unit.mjs, src/runner/execution/unit-summary.mjs, src/runner/execution/run.mjs, src/runner/dispatch/settlement.mjs, src/run-supervisor/steps/settle-attempt.mjs, src/workflow/case-verbs.mjs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-routes.json, packages/run-result/contracts/unit-summary.read.v3.json, test/runner/execution/unit-summary.test.mjs, test/runner/execution/run-request.test.mjs | 1 | draft |
| 4 | [Write door and health counters](phase-04-write-door.md) | 1 | packages/observe/rust/src/record/store/**, packages/observe/rust/src/record/mod.rs, packages/observe/rust/tests/store_*.rs | 2 | draft |
| 5 | [Query engine](phase-05-query-engine.md) | 1 | packages/observe/rust/src/query/**, packages/observe/rust/src/lib.rs, packages/observe/rust/tests/query_*.rs, test/fixtures/observe/query/** | 2 | draft |
| 6 | [Token parsers in Rust](phase-06-usage-parsers-rust.md) | 2, 3 | packages/run-result/rust/src/usage/**, packages/run-result/rust/src/lib.rs, packages/run-result/rust/tests/usage_*.rs, packages/git/node-addon/src/run_result.rs, src/native/door.mjs, src/runner/dispatch/settlement.mjs, src/runner/dispatch/usage-parsers.mjs, test/runner/usage-parsers.test.mjs, test/runner/run-result-source-scan.test.mjs, test/suite-baseline.json, docs/architecture-manifest.json | 2 | draft |
| 7 | [Query verbs and named definitions](phase-07-query-verbs-and-definitions.md) | 1, 4, 5 | packages/observe/rust/src/metrics_cli/mod.rs, packages/observe/rust/src/metrics_cli/record.rs, packages/observe/rust/src/metrics_cli/query.rs, packages/observe/rust/src/definition/**, packages/observe/rust/tests/definition_*.rs, apps/fgos/src/wiring/observe_query.rs, apps/fgos/src/wiring/mod.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-routes.json | 3 | draft |
| 8 | [Run, unit and verify projections](phase-08-run-projection.md) | 1, 3, 5, 6 | packages/run-result/rust/src/lib.rs, packages/run-result/rust/src/unit_summary.rs, packages/run-result/rust/src/projection/**, packages/run-result/rust/observe-kinds.json, packages/run-result/rust/tests/projection_*.rs, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/src/wiring/observe_declarations.rs | 3 | draft |
| 9 | [Friction on the contract: kinds, flags, rank](phase-09-friction-attrs-and-rank.md) | 4, 5, 7 | packages/observe/rust/src/friction.rs, packages/observe/rust/src/friction_cli.rs, packages/observe/rust/friction-kinds.json, packages/observe/contracts/observe.friction.v1.json, src/observe/friction-client.mjs, test/observe/friction-client.test.mjs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-routes.json | 4 | draft |
| 10 | [Transcript source on the contract](phase-10-transcript-source.md) | 1, 5 | packages/observe/rust/src/sources/**, packages/observe/rust/transcript-kinds.json, packages/observe/rust/tests/transcript_*.rs | 4 | draft |
| 11 | [Head state and plan sources](phase-11-head-and-plan-sources.md) | 1, 5, 8 | apps/fgos/src/wiring/observe_sources/**, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/observe-kinds.json, apps/fgos/tests/observe_sources_*.rs | 4 | draft |
| 12 | [Capture channels: skills, plan key, worker claims](phase-12-capture-channels.md) | 3, 6, 9 | core/skills/**, domains/coding/skills/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, src/runner/dispatch/agent-result-claim-contract.mjs, src/runner/dispatch/settlement.mjs, packages/run-result/contracts/run-result.read.v1.json, test/runner/assignment-runresult.test.mjs | 5 | draft |
| 13 | [Friction store migration](phase-13-friction-migration.md) | 9 | packages/observe/rust/src/friction.rs, packages/observe/rust/src/friction_cli.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-routes.json | 5 | draft |
| 14 | [Attention detections as definitions](phase-14-attention-detections.md) | 7, 8, 11 | src/runner/dispatch/attention-view.mjs, src/verbs/dispatch/inspect.mjs, core/attention/**, core/config-standard/dispatch.yaml, core/config-schema/dispatch.schema.yaml, packages/config/contracts/fixtures/**, test/runner/dispatch-runtime-inspect.test.mjs | 5 | draft |
| 15 | [Driving measures as definitions](phase-15-driving-measures.md) | 7, 8, 11 | domains/coding/observe/**, apps/fgos/tests/driving_definitions.rs, test/fixtures/observe/driving/** | 5 | draft |
| 16 | [Docs, backlog, doctor and integration gate](phase-16-docs-and-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 | docs/platform/observe/**, docs/backlog.md, CHANGELOG.md, packages/git/contracts/mutation-census.v1.json, packages/distribution/contracts/doctor-registry.v1.json, apps/fgos/src/wiring/doctor/observe.rs | 6 | draft |

Contract reading check (planner), after the independent validation of 2026-11-18
(`reports/validation-261118-plan-review.md`):

- Every phase sits in a later wave than its dependencies.
- Footprints are disjoint within each wave.
- Hot files have one writer per wave:
  - `command-registry.mjs` and the generated `command-routes.json`: phase 3 (wave 1), phase 7 (wave 3), phase 9
    (wave 4), phase 13 (wave 5).
  - `observe/rust/src/lib.rs`: phase 1, then phase 5.
  - `run-result/rust/src/lib.rs`: phase 6, then phase 8.
  - `metrics_sources.rs` and `observe_declarations.rs`: phase 8, then phase 11.
  - `apps/fgos/src/wiring/mod.rs`: phase 1, phase 7, phase 11.
  - `settlement.mjs`: phase 3, phase 6, phase 12.
  - The generated skill renders: phase 12 only.
  - The mutation census, CHANGELOG, backlog and doctor registry: phase 16 only.
- Phases 1, 4, 5 and 7 split the old contract phase by file boundary.
- Phases 9 and 13 split friction into flags and migration.
- Phases 10 and 11 split the sources.

External dependents:
- **The supervisor plan** (session `shape-supervisor`).
  - Its watcher and wake producers wait for phases 4 and 7.
  - Its trigger definitions read `fgos.plan.status`, `fgos.head.state` (phase 11) and `fgos.run.attempt` (phase 8).
  - Its watcher runs the phase-14 definitions.
- **The owner-question component** (shaper `shape-owner-questions`, OM-D14). Its `fgos questions ask|answer` emits
  `fgos.question.*` through the phase-4 door, and it declares those kinds itself.

## Owner questions

None open. Every question was answered in the discussion (OM-D1..D14). Q7 and Q11 left this plan: the owner-question
component has its own shaper (`shape-owner-questions`), which confirmed the event shape.

## Risks and rollback

**Risks:**
- *Contract churn.* The record and query shapes are the part the owner wants stable (OM-D4).
  - Mitigation: phase 1 ends with a review of the shapes against the deferred kinds, and phase 5 proves every planned
    and deferred detection as a plain query before any consumer builds on it.
  - A change after phase 7 lands means a new record version, not an edit.
- *Write-door cost inside agents.* A write that blocks or fails must never change the caller's outcome.
  - Mitigation: phase 4 proves a bounded time and fail-open behaviour, with counters, by a test that holds the store
    lock.
- *Token parsing differs per CLI release.*
  - Mitigation: each parser returns a named `reason` when the expected output is absent, and never a guessed number.
- *Join cost.* Querying `refs` over the whole store may be slow.
  - Mitigation: storage is layer 3 and free to change. A view or index (L3: truth in JSONL, db is a view) is added
    only if the measured cost demands it.
- *Friction migration.* It loses or duplicates records.
  - Mitigation: it is explicit and idempotent (deterministic ids), with counts before and after in the phase report.

**Rollback.** Each phase lands as one merge commit, and reverting it restores the previous behaviour. The exception is
the friction migration (phase 13): it keeps the old shards untouched until phase 16 passes, so reverting phase 13
returns to them.
