---
contract: plan-v1
title: "Work data model: the shape of the portfolio data"
status: running
lead: head:lead-forgent-261120-0625-work-d-ce9f6
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
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - src/runner/dispatch/session-attempt.mjs
  - test/session-host/head-permission-mode.test.mjs
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
  - test/session-host/head-request.test.mjs
  - test/session-host/head-start.test.mjs
  - test/session-rotation/rotate.test.mjs
  - test/state/domain-fields.test.mjs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - apps/fgos/src/wiring/supervision.rs
  - plans/*/plan.md
  - apps/fgos/src/wiring/migrate.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/tests/migrate_portfolio.rs
  - test/rust-host/vectors/envelope/version.json
  - apps/fgos/src/main.rs
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - packages/host-runtime/rust/src/catalog.rs
  - packages/questions/rust/Cargo.toml
  - packages/supervision/rust/Cargo.toml
  - Cargo.lock
  - .agents/skills/_shared/citation-format.md
  - .agents/skills/_shared/executor-dispatch-fallback.md
  - .agents/skills/fgos-coding-discovering/SKILL.md
  - .agents/skills/fgos-coding-planning/SKILL.md
  - .agents/skills/fgos-coding-shaping/SKILL.md
  - .agents/skills/fgos-secretary/SKILL.md
  - .agents/skills/fgos-shaping/SKILL.md
  - .agents/skills/fgos-supervisor/SKILL.md
  - .claude/agents/shaper.md
  - .claude/skills/fgos-coding-shaping/SKILL.md
  - AGENTS.md
  - CHANGELOG.md
  - apps/fgos/tests/supervision_verbs.rs
  - bin/fgos.mjs
  - core/agents/planner.yaml
  - core/agents/shaper.yaml
  - core/config-standard/sessionRotation.yaml
  - core/skills/_shared/citation-format.md
  - core/skills/_shared/executor-dispatch-fallback.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-shaping/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - docs/distillery/deep-dives/herdr-vs-tmux-observation.md
  - docs/distillery/deep-dives/parallel-decomposition-and-merge.md
  - docs/distillery/reports/distill-bee-inventory-2026-07-18.md
  - docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md
  - docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md
  - docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md
  - docs/distillery/sources/beehive.md
  - docs/explanation/citation-drift-backlog-scope-split-with-tsk-56w.md
  - docs/explanation/compound-learn-artifact-registry.md
  - docs/explanation/core-foundation-domain-boundary.md
  - docs/explanation/gitignore-docs-history-reverify.md
  - docs/explanation/skill-prose-cleanup-design.md
  - docs/how-to/fix-bare-citation-findings.md
  - docs/how-to/fix-d-local-outside-home-findings.md
  - docs/knowledge/coding-domain-s-role-holder-axis-handoff-verb-task-spec-skil/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md
  - docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md
  - docs/knowledge/fgos-slots-cli-verb-output-shape-and-the-worker-slot-ceiling/fgos-slots-verb-output-fields.md
  - docs/knowledge/how-to-add-a-changelog-md-entry-for-a-user-visible-change/add-a-changelog-entry-for-a-user-visible-change.md
  - docs/knowledge/how-to-hold-an-open-ended-design-brainstorm-with-fgos-coding/hold-an-open-ended-design-brainstorm-with-fgos-coding-shaping.md
  - docs/knowledge/reconcile-a-strategic-backlog-row-against-real-execution-sta/reconcile-a-strategic-backlog-row-against-real-execution-state.md
  - docs/knowledge/verify-cost-audit-real-pick-return-approve-cycle-counts/verify-cost-audit-pick-return-approve-cycle-counts.md
  - docs/knowledge/why-auto-decompose-children-now-carry-action-read-first-dire/why-auto-decompose-children-carry-action-and-read-first-directive-prose.md
  - docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md
  - docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md
  - docs/knowledge/why-fgos-merge-throughput-bottlenecked-despite-parallel-disp/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md
  - docs/knowledge/why-fgos-s-coding-domain-skills-were-rewritten-to-a-300-line/why-fgos-skills-split-into-skillmd-plus-references-under-300-lines.md
  - docs/knowledge/why-fgos-s-d-id-rul-id-adr-citations-must-carry-a-one-line-g/why-fgos-citations-carry-a-gloss-and-check-mechanically.md
  - docs/knowledge/why-herdr-cockpit-stacked-worker-launches-into-a-single-reus/why-herdr-cockpit-stacked-worker-launches-into-one-pane.md
  - docs/knowledge/why-mergerunneritem-now-checks-ancestry-before-attempting-a/merge-idempotent-on-already-merged-branch.md
  - docs/knowledge/why-runner-config-splits-capability-curated-vocab-executor-n/why-capability-executor-and-capacity-are-three-separate-concepts.md
  - docs/knowledge/why-session-claim-liveness-measures-worktree-activity-not-pi/why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md
  - docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md
  - docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md
  - docs/knowledge/work-item-pipeline-stages-verbs-actors-handoffs/work-item-pipeline-stages-verbs-and-handoffs.md
  - docs/knowledge/worker-slot-concept-and-engine-wide-worker-occupancy-ceiling/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md
  - docs/platform/agent-confinement/spec.md
  - docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/runs/1-context-investigator-raw.log
  - docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/attempt-1-superseded/asgn_coordinator_driver_op_001/runs/01/agent-result.json
  - docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/attempt-1-superseded/asgn_coordinator_driver_op_001/runs/01/result.json
  - docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/case-brief.mjs
  - docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/case-lock.md
  - docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/r6-single-agent-baseline/assignment.json
  - docs/platform/architecture-map.md
  - docs/platform/coexistence/spec.md
  - docs/platform/convention/spec.md
  - docs/platform/decision-citation-drift/spec.md
  - docs/platform/documentation/history/id-systems-audit.md
  - docs/platform/documentation/history/switchboard.md
  - docs/platform/documentation/subcomponents/document-identity/spec.md
  - docs/platform/documentation/subcomponents/document-identity/verification/recall/trial-cases.json
  - docs/platform/git/spec.md
  - docs/platform/graph/spec.md
  - docs/platform/herdr-web-dashboard/spec.md
  - docs/platform/observe/decisions/observe-component-architecture.md
  - docs/platform/platform-foundations.md
  - docs/platform/proposals/documentation-system-unification.md
  - docs/platform/proposals/knowledge-registry-redesign.md
  - docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md
  - docs/platform/questions/spec.md
  - docs/platform/runner/decisions/h-36d872fbb0e5.md
  - docs/platform/runner/subcomponents/h-2e032393add1/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/supervision/spec.md
  - docs/platform/system-overview/spec.md
  - docs/platform/work-state/decisions/retired-decision-history.md
  - docs/reading-map.md
  - dogfood-fixture/scenarios/expr-eval-chain.md
  - domains/coding/skills/fgos-coding-discovering/SKILL.md
  - domains/coding/skills/fgos-coding-planning/SKILL.md
  - domains/coding/skills/fgos-coding-shaping/SKILL.md
  - packages/convention/contracts/convention.golden.v1.json
  - packages/convention/contracts/convention.rules.v1.json
  - packages/convention/rust/tests/golden.rs
  - packages/durable-file/rust/tests/dir_replace.rs
  - packages/execution/contracts/confinement-policy/policy.v1.json
  - packages/execution/contracts/confinement-policy/resources.v1.json
  - packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/controller/evaluator-baseline.json
  - packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/evidence.json
  - packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/result.json
  - packages/execution/contracts/corpus/v3-open-attempt/producer/1/runs/01/controller/settle-context.json
  - packages/execution/contracts/run-result/readers.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/questions/rust/tests/store_support.rs
  - packages/supervision/rust/tests/discussion_source.rs
  - packages/supervision/rust/tests/fixtures/definitions/discussion-settled/nomatch.jsonl
  - packages/supervision/rust/tests/fixtures/definitions/discussion-settled/records.jsonl
  - plugins/fgOS/skills/_shared/citation-format.md
  - plugins/fgOS/skills/_shared/executor-dispatch-fallback.md
  - plugins/fgOS/skills/coding-shape/SKILL.md
  - plugins/fgOS/skills/fgos-coding-discovering/SKILL.md
  - plugins/fgOS/skills/fgos-coding-planning/SKILL.md
  - plugins/fgOS/skills/fgos-coding-shaping/SKILL.md
  - plugins/fgOS/skills/fgos-secretary/SKILL.md
  - plugins/fgOS/skills/fgos-shaping/SKILL.md
  - plugins/fgOS/skills/fgos-supervisor/SKILL.md
  - plugins/fgOS/skills/terminal/SKILL.md
  - plugins/fgOS/skills/terminal/rename.sh
  - scripts/check-backlog-reconciliation.mjs
  - scripts/check-decision-citation-drift.baseline.json
  - scripts/check-decision-citation-drift.mjs
  - scripts/identity-ids-unique.mjs
  - src/cli/command-registry.mjs
  - src/report/context-render.mjs
  - src/runner/dispatch/confinement/bypass-pairing.mjs
  - src/runner/merge.mjs
  - src/session-host/head-plan.mjs
  - src/session-host/head-start.mjs
  - src/setup/skill-wrappers.mjs
  - src/state/frontier.mjs
  - src/state/work.mjs
  - test/cli/session-verb.test.mjs
  - test/golden-recorders/confinement-policy.recorder.mjs
  - test/runner/merge.test.mjs
  - test/scripts/check-decision-citation-drift.test.mjs
  - test/scripts/doc-health.test.mjs
  - test/session-host/head-plan.test.mjs
  - test/session-rotation/handoff-store.test.mjs
  - test/setup/gitignore-docs-history-not-excluded.test.mjs
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
3. Two leads claiming the same plan are mutually excluded, proven by the existing owning tests (owner decision `q-fvulgjz2iz`: no duplicate test): `packages/supervision/rust/tests/land.rs` `a_conflict_outside_the_declared_files_refuses_before_any_candidate_is_prepared`, `two_concurrent_lands_into_one_target_serialize`, `a_paths_land_refuses_busy_while_a_land_of_its_target_holds_the_merge_slot` (`cargo test -p fgos-supervision --test land`) and `packages/identity/rust/tests/directory.rs` `a_role_held_by_a_live_session_is_refused_unless_taken` (`cargo test -p fgos-identity --test directory`). Cites follow-up row `p-lsjboo4xzg`.
4. `fgos session write` creates new item files under `plans/backlog/` and `plans/discussions/` with updated grants (`cargo test -p fgos --test session_write_publish`, `node --test test/session-host/head-grants.test.mjs`). Cites follow-up row `p-xyod5s5h6r`.
5. Existing `docs/backlog.md` rows migrated to `plans/backlog/<p-id>-<slug>.md` and `docs/discussions/` moved to `plans/discussions/<ds-id>-<slug>/`; `git grep docs/discussions` finds no active code references. Cites follow-up row `p-nxibnmfhra`.
6. Landing a plan with `status: done` updates its source backlog items to `status: done` in the landing commit (`cargo test -p fgos-supervision --test land`, per owner answer `q-76qpywi7if`). Cites follow-up row `p-pjouokg3jm`.
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
| 3 | [Concurrent claim is refused at landing](phase-03-claim-test.md) | - | - (closed by citing existing owning proofs, q-fvulgjz2iz) | 1 | done |
| 4 | [Replace plan 261119-1615 phase 4](phase-04-1615-phase4.md) | 2 | apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs, src/session-host/head-grants.mjs, test/session-host/head-grants.test.mjs, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, src/runner/dispatch/session-attempt.mjs, test/session-host/head-permission-mode.test.mjs | 3 | done |
| 5 | [Migration of backlog and discussions](phase-05-migration.md) | 1, 2, 4 | plans/backlog/**, plans/discussions/**, plans/backlog.md, docs/backlog.md, docs/discussions/**, scripts/migrate-portfolio.mjs, src/runner/agent-roster.mjs, packages/supervision/rust/src/discussion_source.rs, packages/questions/rust/src/refcheck.rs, test/e2e/fixture-marketing-domain.test.mjs, test/runner/dispatch-confinement-*.test.mjs, test/session-host/head-request.test.mjs, test/session-host/head-start.test.mjs, test/session-host/head-permission-mode.test.mjs, test/session-rotation/rotate.test.mjs, test/state/domain-fields.test.mjs, apps/fgos/src/main.rs, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/questions/rust/Cargo.toml, packages/supervision/rust/Cargo.toml, Cargo.lock | 4 | done |
| 6 | [Landing writes item done](phase-06-landing-done.md) | 2, 5 | apps/fgos/src/wiring/land.rs, apps/fgos/tests/landing_source_items.rs | 5 | done |
| 7 | [Plan statuses held to plan-v1](phase-07-plan-status.md) | 6 | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, plans/261006-1408-advisory-capability-completion/plan.md, plans/261007-1800-observe-overdue-run-signal-deferred/plan.md | 6 | done |


## Progress
- Phase 4: done (landed 7fc96fde1; see reports/progress-261121-1445-phase-04-landed.md)
- Phase 5: running: code half landed da4a572b4; discussion roots read from the convention rule landed 8d0ebd49b (p05f, reviewed); the verb is routed on work-data-model/p05e (8980311b7) but the host admission gate needs a migrate.portfolio row in packages/host-runtime/rust/src/catalog.rs, outside the footprint: owner question q-psvhjlmjxl; data move, grant swap, literal rewrite and skill rebuild wait on it Update 2026-11-21 22:58: the verb is routed and admitted on main (p05g, 2e697e88d: registry, route contracts, host wiring, catalog row, CHANGELOG line; reviewed; host-runtime and 18 migrate tests green, other fgos failures identical on a branch without the change). The data move is built on work-data-model/p05h (bcfcf608b: 451 items, 51 discussions, docs/backlog.md pointer, head-grant swap, skills rebuilt; head-grants and portfolio tests green, the permission test fails only on this sandbox's read-only durable write). Parked: main gained backlog rows and a discussion edit within minutes of its base, and running heads hold the old grants; owner question q-tj4cw2epbq asks for a short writer freeze, a re-run on the trunk tip, then head restarts. After it: hand-edit code literals, remove legacy-root fallbacks (with the review points: expect on a missing discussion rule, one shared root helper), git grep docs/discussions.
  Update 2026-11-21 23:59: the data move landed on main as 349060733 (p05i on the frozen tip: 453 items, 51 discussions, head-grant swap, drift-baseline lines for the moved discussion). The publish step failed git-wal-corrupt but the push held and the checkout was recovered (q-wpzbpqnq24 cancelled). The verb left test/rust-host/vectors/envelope/version.json without `migrate`, so test_vector_parity_version is red on main; the corrected vector (migrate added, data_hash 50d91820...) is prepared, but the file is outside the footprint (write-outside-footprint): the supervisor adds it, then the lead lands it. Still to do: code-literal rewrite, legacy-root fallback removal with the review points, git grep docs/discussions.
  Update 2026-11-22 02:59: phase 5 done. The literal rewrite and legacy-root retirement landed as p05k-p05q (last c5dfce61c); the remaining examples, citation scan over plans/backlog/ and specs landed as 77e164e56 (p05r, reviewed; review fixes 95d56ea8e: directory-mode test, discussion template column, placeholder examples; land gates incl. check-decision-citation-drift and command-routes tests green). `docs/discussions/` no longer exists and `docs/backlog.md` is a pointer. The remaining `git grep docs/discussions` hits outside history are deliberate: the migration verb's legacy-layout source (apps/fgos/src/wiring/migrate.rs), the pre-migration history root (discussion_source.rs and its test), sandbox test fixtures using arbitrary paths, and a recall trial-case corpus. See reports/progress-261122-0259-phase-05-landed.md.
- Plan: every phase is done, but plan status stays `running` because acceptance criterion 8 (`npm test` and `cargo test --workspace` green) was not run in this wake. The lead's sandbox cannot write ~/.local/state (git-floor-probe-failed) or build the addon, so the supervisor needs to run both suites on main. Known red outside this footprint: workspace clippy at packages/supervision/rust/tests/queue.rs:413. Set `done` once both suites are green.
- Phase 6: done (landed 96aa82f5b as work-data-model/p06c; written to land.rs per q-76qpywi7if; 53 land tests and land gates green)
- Phase 7: done, landed 05904d7e2 (186371db0 + review fixes fe8042f12; 22 plan-contract tests green). 81 legacy plan statuses rewritten (status lines only; no contract marker added to legacy plans); a non-plan-v1 status fails `--all`; marked plans created from 2026-11-22 must cite a minted `p-` id. Old in-progress plans now read `running` but have no phase table, so the supervisor portfolio reader still refuses them. `--all` still exits 1 on other plans: multica (sections, source), the two 261121-08* rotation plans (owner-questions section, blockedBy) and 6 active footprint overlaps; criterion 7 reading asked in q-hui44iwzw4.

Wave 1 runs independent foundational phases: phase 1 (identity and convention rules) and phase 3 (claim refusal test); footprints are disjoint. Wave 2 builds the item contract, check and index generator. Wave 3 updates session write and grants for individual item files. Wave 4 migrates existing backlog rows and discussions into `plans/`. Wave 5 enables landing auto-completion for source items. Wave 6 enforces strict plan-v1 statuses.

All phases 1-7 are marked `ready` and may execute in wave order (wave 1 through wave 6).

- Phase 2 follow-up (2026-11-21): `cargo clippy --all-targets -- -D warnings` failed with four errors in `apps/fgos/src/wiring/portfolio.rs` (from ee97088af; seen only with `--all-targets`, since `tests/portfolio_check.rs` includes the file by path). Fixed at the cause by a worker (borrowed `BacklogItemFields` struct for `format_backlog_item`, two collapsed `if`s, one `format!`), reviewed clean, landed as 9199bd18d with `test/portfolio/*.test.mjs` gates; `cargo clippy -p fgos --all-targets -- -D warnings` clean and `cargo test -p fgos --test portfolio_check` 13 passed. Workspace clippy still fails on `packages/supervision/rust/tests/queue.rs:413` (`cloned_ref_to_slice_refs`), outside this plan's footprint.

## Owner questions
- `q-luhbwwvlpc` asked 2026-11-21 19:31 by the supervisor: root disk full (22 MB free) blocked landing p05r. Answered 2026-11-22 "A. Dọn worktree đã giao + candidate cũ": the owner or an unconfined session runs `fgos worktree remove <path> --delivered-to main --discard-ignored` for the delivered work-data-model worktrees (p01 p02 p03 p05 p05b-g p05i p05j p05l-o p05q p06 p06b p06c p07), then `fgos git recover` to release finished land candidates; p05r, p05h, p05k and p05p are kept (p05k/p05p decided later). Sandboxed heads cannot run it (read-only file system). At 2026-11-22 07:12 the cleanup had not run: 17 GB free, `.fgos/runtime/git-candidates` 109 GB, 30 plan worktrees. p05r landed meanwhile (77e164e56). Acked.
- `q-tj4cw2epbq` asked 2026-11-21 22:57: pause backlog and discussion writers so the data move re-runs on the trunk tip and lands, then restart heads for the new grants. Answered A (23:27); freeze held, landed 349060733. Acked by the secretary.
- `q-hui44iwzw4` asked 2026-11-21 22:00: does criterion 7 count as met on the status vocabulary while other plans' content errors and active overlaps keep `--all` red? Answered "Count it met": criterion 7 is met on the status vocabulary; the remaining --all errors (multica, the two 261121-08* rotation plans, 6 active overlaps) belong to their owners via a backlog row. Acked.
- `q-psvhjlmjxl` asked 2026-11-21 21:12: add packages/host-runtime/rust/src/catalog.rs to the footprint (one migrate.portfolio operation descriptor and its id in that file's catalog test) so the routed `fgos migrate portfolio` passes the host admission gate. Answered 2026-11-21 "Add catalog.rs": the supervisor or planner adds `packages/host-runtime/rust/src/catalog.rs` to the frontmatter `footprint` (a lead paths land refuses footprint changes); phase 5 unit 2 resumes on work-data-model/p05e once it is on main. Acked.
- `q-2dwvrkgabm` answered 2026-11-21 "Shaper lands its edit": the orchestration-skeleton shaper landed its edit (4612c8531); the checkout no longer holds it. Acked.
- `q-exu5x27hbq` asked 2026-11-21: add apps/fgos/src/main.rs, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/questions/rust/Cargo.toml and packages/supervision/rust/Cargo.toml to the footprint so `fgos migrate portfolio` is routed and readers take roots from convention rules. Answered "Add all 5 paths"; footprint edit landed as 288058cba. Acked.
- `q-ekkgwaavrb` answered 2026-11-21 "Mở footprint cho phase 5": every active file that names `docs/discussions` or `docs/backlog.md` (outside `plans/`, `docs/history/`, `archive/`), the CLI wiring for `fgos migrate portfolio`, and the generated skill renders (rebuilt by `npm run build:skills`) join the footprint; one migration commit; history content is not edited. Acked.
- `q-76qpywi7if` answered 2026-11-21 "Sửa cửa land thật": phase 6 writes `packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs` and, if a port is needed, `apps/fgos/src/wiring/supervision.rs`, in place of `apps/fgos/src/wiring/land.rs` and `apps/fgos/tests/landing_source_items.rs`; criterion 6 is verified by `cargo test -p fgos-supervision --test land`; no other land behaviour changes and no new event. Acked.
- `q-wb6bdz3c72` answered 2026-11-21 "Mở footprint tới plans/*/plan.md": `plans/*/plan.md` joins the footprint; a unit changes only frontmatter `status`/`contract` by phase 7's approved mapping. Acked.
- These three answers need a footprint edit, which a lead's paths land refuses (`footprint-change-refused`). The exact edit for the supervisor or planner is in reports/progress-261121-1735-footprint-edits-for-phases-05-06-07.md.
- `q-b3acdzi4ur` answered 2026-11-21 "option 1": phase 4's `plans/backlog/*` grant fails the sandbox glob check in `requirementOf`; `src/runner/dispatch/session-attempt.mjs` and its owning test `test/session-host/head-permission-mode.test.mjs` join the footprint and phase 4, and the sandbox maps `<dir>/*` to `<dir>`. `session-attempt.mjs` also falls under the running plan 261118-1341's `src/runner/dispatch/**`; rebase on main before landing. Phase 4 landed as 7fc96fde1; acked.
- `q-fvulgjz2iz` answered 2026-11-21 "Đóng phase bằng trích dẫn": phase 3 closed by citing the existing owning proofs (acceptance criterion 3); the duplicate test on branch `work-data-model/p03b` (2123353c1) is not landed.
- `q-y3ypxlucin` answered 2026-11-21 "Mở footprint thêm head_request.rs": `packages/run-supervisor/rust/src/head_request.rs` and its test join the footprint and phase 4, so `fgos session write` can create a new item file under a directory grant.
- `q-x3ata7iuej`: Decided by owner 2026-11-20: "Map partial to draft, deferred to withdrawn" (`plans/261006-1408-advisory-capability-completion/plan.md` -> `draft`, `plans/261007-1800-observe-overdue-run-signal-deferred/plan.md` -> `withdrawn`). Acked; unblocks phase 07.

## Risks and rollback
- Migration footprint: Phase 5 moves all discussions and splits `docs/backlog.md`. Rollback: atomic revert of the migration commit.
- Reference drift in code/specs: mechanical rewrite with mapping table, backed by `git grep` verification.
- Revert path: Each phase lands on `main` independently; any phase can be reverted with `git revert` without breaking trunk stability.
