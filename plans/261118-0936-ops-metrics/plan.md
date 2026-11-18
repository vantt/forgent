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
  - packages/execution/rust/src/usage/**
  - packages/execution/rust/src/lib.rs
  - packages/execution/rust/tests/usage_*.rs
  - apps/fgos/src/wiring/metrics_sources.rs
  - apps/fgos/src/wiring/observe_sources/**
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/doctor/observe.rs
  - apps/fgos/observe-kinds.json
  - src/runner/execution/run-request.mjs
  - src/runner/execution/unit.mjs
  - src/runner/execution/unit-summary.mjs
  - src/runner/execution/run.mjs
  - src/runner/dispatch/settlement.mjs
  - src/runner/dispatch/usage-parsers.mjs
  - src/runner/dispatch/attention-view.mjs
  - src/verbs/dispatch/inspect.mjs
  - src/observe/friction-client.mjs
  - src/cli/command-registry.mjs
  - core/skills/_shared/friction-capture.md
  - core/skills/**
  - domains/coding/skills/**
  - domains/coding/observe/**
  - core/attention/**
  - core/config-standard/attention.yaml
  - core/config-schema/attention.schema.yaml
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - test/runner/execution/**
  - test/runner/dispatch/**
  - test/observe/**
  - test/fixtures/observe/**
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
- driving measures 1, 2, 3 and 7.

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
   - a golden fixture that writes records through the write door and reads them back through `fgos metrics query`,
     covering `--where`, `--ref`, `--by`, `--bucket` and `--agg count|sum|p50|p90|max`, `max:ts`, relative `--since`,
     a join through `refs`, `insufficient` and `coverage`;
   - a test that refuses two declarations of the same name.
2. The same fixture runs a test-local declaration of `fgos.watcher.tick`, `fgos.supervisor.wake` and `fgos.question.*`, with the two pace
   definitions and an owner-wait definition, through `fgos metrics query --def`. No Observe source file names those
   kinds (`rg -n 'watcher\.tick|supervisor\.wake|question\.asked' packages/observe/rust/src` returns nothing).
3. Every settled attempt in `unit-summary.json` carries `accountId`, `durationMs` and `usage`. `usage` holds either
   token counts or a named `reason`, one per CLI, and is proven by the parser tests in `packages/execution/rust`.
   `src/runner/dispatch/usage-parsers.mjs` is gone.
4. `fgos run --plan <dir> --phase <id>` and `fgos workflow start ... --plan <dir>` store the key. On a live run,
   `fgos metrics query --kind fgos.run.attempt --ref plan:<dir> --by gen_ai.provider.name` returns it.
5. `fgos friction record` accepts the attrs `--kind bug|instability|missing|awkward|doc` and `--ref plan:<dir>|backlog:<id>`.
   `friction rank` groups by signature (`errorClass`) with `--bucket week`, and `friction classes` lists the
   signatures. `friction resolve --class <slug> --reason filed:<p-id>` settles the whole group. The existing friction
   store is migrated, and its old write path is removed.
6. `test/runner/dispatch/attention-view*.test.mjs` shows `head-gone` and `plan-no-progress` rows built from
   definition files under `core/attention/definitions/`. The `plan-no-progress` threshold is the config key
   `attention.planNoProgressMinutes` (default 60), defined in `core/config-standard` and `core/config-schema`.
7. The driving definitions under `domains/coding/observe/definitions/` produce measures 1, 2, 3 and 7, lead time and
   phase time on a fixture plan.
   - Measures 4, 5 and 6, the owner-wait part of measure 2, and measure 3 (both waiting on `fgos.question.*`) report
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
- The question reader and the `fgos.question.*` producer, which belong to the secretary's grant follow-up plan (OM-D11).
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
| 1 | [Observe record contract and write door](phase-01-observe-record-contract.md) | - | packages/observe/contracts/observe.record.v2.json, packages/observe/contracts/observe-names.json, packages/observe/rust/src/record/**, packages/observe/rust/src/lib.rs, packages/observe/rust/Cargo.toml, packages/observe/rust/src/metrics_cli/mod.rs, packages/observe/rust/src/metrics_cli/record.rs, packages/observe/rust/tests/record_*.rs, test/fixtures/observe/record/** | 1 | draft |
| 2 | [Token usage survey per CLI](phase-02-usage-survey.md) | - | plans/261118-0936-ops-metrics/reports/usage-survey.md | 1 | draft |
| 3 | [Run record facts and plan key](phase-03-run-record-facts.md) | - | src/runner/execution/run-request.mjs, src/runner/execution/unit.mjs, src/runner/execution/unit-summary.mjs, src/runner/execution/run.mjs, src/runner/dispatch/settlement.mjs, src/cli/command-registry.mjs, packages/run-result/contracts/unit-summary.read.v3.json, test/runner/execution/** | 1 | draft |
| 4 | [Query engine and named definitions](phase-04-query-engine.md) | 1 | packages/observe/rust/src/query/**, packages/observe/rust/src/metrics_cli/query.rs, packages/observe/rust/src/metrics_cli/mod.rs, packages/observe/rust/src/lib.rs, packages/observe/rust/tests/query_*.rs, test/fixtures/observe/query/** | 2 | draft |
| 5 | [Token parsers in Rust](phase-05-usage-parsers-rust.md) | 2, 3 | packages/execution/rust/src/usage/**, packages/execution/rust/src/lib.rs, packages/execution/rust/tests/usage_*.rs, src/runner/dispatch/settlement.mjs, src/runner/dispatch/usage-parsers.mjs, test/runner/dispatch/usage-parsers.test.mjs | 2 | draft |
| 6 | [Run and unit projections](phase-06-run-projection.md) | 1, 3, 4 | packages/run-result/rust/**, packages/run-result/contracts/observe-kinds.json, apps/fgos/src/wiring/metrics_sources.rs | 3 | draft |
| 7 | [Friction on the contract](phase-07-friction-on-contract.md) | 1, 4 | packages/observe/rust/src/friction.rs, packages/observe/rust/src/friction_cli.rs, packages/observe/contracts/observe.friction.v1.json, packages/observe/contracts/friction-kinds.json, packages/observe/rust/tests/friction_*.rs, src/observe/friction-client.mjs, test/observe/friction-client.test.mjs, apps/fgos/src/wiring/doctor/observe.rs | 3 | draft |
| 8 | [Session, head and plan sources](phase-08-session-plan-sources.md) | 6 | packages/observe/rust/src/sources/**, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/src/wiring/observe_sources/**, apps/fgos/src/wiring/mod.rs, apps/fgos/observe-kinds.json | 4 | draft |
| 9 | [Capture channels: skills and worker claims](phase-09-capture-channels.md) | 5, 7 | core/skills/_shared/friction-capture.md, core/skills/**, domains/coding/skills/**, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, src/runner/dispatch/settlement.mjs, packages/run-result/contracts/run-result.read.v1.json, test/runner/dispatch/settlement*.test.mjs | 4 | draft |
| 10 | [Attention detections as definitions](phase-10-attention-detections.md) | 4, 6, 8 | src/runner/dispatch/attention-view.mjs, src/verbs/dispatch/inspect.mjs, core/attention/**, core/config-standard/attention.yaml, core/config-schema/attention.schema.yaml, test/runner/dispatch/attention-view*.test.mjs | 5 | draft |
| 11 | [Driving measures as definitions](phase-11-driving-measures.md) | 4, 6, 8 | domains/coding/observe/**, test/fixtures/observe/driving/**, packages/observe/rust/tests/driving_definitions.rs | 5 | draft |
| 12 | [Docs, backlog and integration gate](phase-12-docs-and-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | docs/platform/observe/**, docs/backlog.md, CHANGELOG.md, packages/git/contracts/mutation-census.v1.json, packages/distribution/contracts/doctor-registry.v1.json | 6 | draft |

Contract reading check (planner):
- Every phase sits in a later wave than its dependencies.
- Footprints are disjoint within each wave:
  - wave 1: phases 1, 2, 3;
  - wave 2: phase 4 under `observe/src/query`, phase 5 under `execution` and `settlement`;
  - wave 3: phase 6 under `run-result` and `metrics_sources`, phase 7 under `friction`;
  - wave 4: phase 8 under `sources` and `wiring`, phase 9 under skills and `settlement`;
  - wave 5: phase 10 under `attention`, phase 11 under `domains/coding/observe`.
- Hot files have one writer per wave:
  - `metrics_cli/mod.rs`: phase 1, then phase 4.
  - `observe/rust/src/lib.rs`: phase 1, then phase 4.
  - `metrics_sources.rs`: phase 6, then phase 8.
  - `settlement.mjs`: phase 3, then phase 5, then phase 9.
  - `command-registry.mjs`: phase 3 only.
  - The generated skill renders: phase 9 only, regenerated with `npm run build:skills`.
  - The mutation census, CHANGELOG and backlog: phase 12 only. The census is regenerated, never hand-merged.
- `node scripts/plan-contract-check.mjs --plan plans/261118-0936-ops-metrics` is run before `ready`. The result is
  recorded in the plan's log line on the board.

External dependents:
- The supervisor plan (session `shape-supervisor`): its watcher and wake producers wait for phases 1 and 4; its trigger definitions (`plan-became-ready`, `plan-done`, `plan-priority-changed`, `lane-freed`) read `fgos.plan.status` and `fgos.head.state` from phase 8; its watcher runs the phase-10 definitions.
- The secretary's grant follow-up plan: its `fgos.question.*` producer waits for phase 1.

## Owner questions

None open. Every question was answered in the discussion (OM-D1..D12). Q7 went to the secretary, which confirmed the
event shape on 2026-11-18.

## Risks and rollback

**Risks:**
- *Contract churn.* The record and query shapes are the part the owner wants stable (OM-D4).
  - Mitigation: phase 1 ends with a review of the shapes against the deferred definitions (pace, questions) before
    phase 4 builds on them.
  - A change after phase 4 lands means a new record version, not an edit.
- *Write-door cost inside agents.* A write that blocks or fails must never change the caller's outcome.
  - Mitigation: phase 1 proves a bounded time and fail-open behaviour, with counters, by a test that holds the store
    lock.
- *Token parsing differs per CLI release.*
  - Mitigation: each parser returns a named `reason` when the expected output is absent, and never a guessed number.
- *Join cost.* Querying `refs` over the whole store may be slow.
  - Mitigation: storage is layer 3 and free to change. A view or index (L3: truth in JSONL, db is a view) is added
    only if the measured cost demands it.
- *Friction migration.* It loses or duplicates records.
  - Mitigation: it is explicit and idempotent (deterministic ids), with counts before and after in the phase report.

**Rollback.** Each phase lands as one merge commit, and reverting it restores the previous behaviour. The exception is
the friction migration (phase 7): it keeps the old shards untouched until phase 12 passes, so reverting phase 7 returns
to them.
