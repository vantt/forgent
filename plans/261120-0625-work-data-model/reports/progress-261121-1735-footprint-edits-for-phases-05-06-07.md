# Progress: owner answered the footprint questions; the footprint edit waits for the supervisor

The owner answered all three questions on 2026-11-21. Each answer widens the plan `footprint`. A lead's paths land refuses any footprint change (`footprint-change-refused`), so the lead recorded the answers in `plan.md` and acked the questions. The supervisor or planner now needs to apply the footprint edit below in one `fgos land --paths` commit of `plans/261120-0625-work-data-model/plan.md`. Once that commit lands, the lead runs phases 5, 6 and 7 in that order. No unit ran in this wake.

## Answers

- `q-76qpywi7if` (phase 6), "Sửa cửa land thật": the phase targets the real land door instead of a new wiring file.
- `q-ekkgwaavrb` (phase 5), "Mở footprint cho phase 5": every active file that names `docs/discussions` or `docs/backlog.md` joins the footprint, plus the CLI wiring for `fgos migrate portfolio` and the generated skill renders. The answer forbids editing history content (old reports, journals, decision narratives).
- `q-wb6bdz3c72` (phase 7), "Mở footprint tới plans/*/plan.md": only the frontmatter `status` and `contract` lines of other plans may change, following the approved mapping.

## Footprint edit to apply

Phase 6:
- Remove `apps/fgos/src/wiring/land.rs` and `apps/fgos/tests/landing_source_items.rs`.
- Add `packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs` and `apps/fgos/src/wiring/supervision.rs`.

Phase 7:
- Add `plans/*/plan.md`. The two plan paths listed one by one become redundant and can be dropped.

Phase 5: add the active files below. The list comes from `git grep -l -e docs/discussions -e 'docs/backlog\.md'` on main 625c076d3, leaving out `plans/`, `docs/discussions/`, `docs/history/` and `archive/`, which are history kept unchanged. It has 158 paths. Also add the CLI wiring for the `fgos migrate portfolio` verb (phase 5, step 4). The phase file does not name that file, so the planner names it. The renders under `.agents/skills/**` and `plugins/fgOS/**` that appear below are rebuilt with `npm run build:skills`; they are never edited by hand.

```text
.agents/skills/_shared/citation-format.md
.agents/skills/_shared/executor-dispatch-fallback.md
.agents/skills/fgos-coding-discovering/SKILL.md
.agents/skills/fgos-coding-planning/SKILL.md
.agents/skills/fgos-coding-shaping/SKILL.md
.agents/skills/fgos-secretary/SKILL.md
.agents/skills/fgos-shaping/SKILL.md
.agents/skills/fgos-supervisor/SKILL.md
.claude/agents/shaper.md
.claude/skills/fgos-coding-shaping/SKILL.md
AGENTS.md
CHANGELOG.md
apps/fgos/tests/session_write_publish.rs
apps/fgos/tests/supervision_verbs.rs
bin/fgos.mjs
core/agents/planner.yaml
core/agents/shaper.yaml
core/config-standard/sessionRotation.yaml
core/skills/_shared/citation-format.md
core/skills/_shared/executor-dispatch-fallback.md
core/skills/fgos-secretary/SKILL.md
core/skills/fgos-shaping/SKILL.md
core/skills/fgos-supervisor/SKILL.md
docs/backlog.md
docs/distillery/deep-dives/herdr-vs-tmux-observation.md
docs/distillery/deep-dives/parallel-decomposition-and-merge.md
docs/distillery/reports/distill-bee-inventory-2026-07-18.md
docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md
docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md
docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md
docs/distillery/sources/beehive.md
docs/explanation/citation-drift-backlog-scope-split-with-tsk-56w.md
docs/explanation/compound-learn-artifact-registry.md
docs/explanation/core-foundation-domain-boundary.md
docs/explanation/gitignore-docs-history-reverify.md
docs/explanation/skill-prose-cleanup-design.md
docs/how-to/fix-bare-citation-findings.md
docs/how-to/fix-d-local-outside-home-findings.md
docs/knowledge/coding-domain-s-role-holder-axis-handoff-verb-task-spec-skil/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md
docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md
docs/knowledge/fgos-slots-cli-verb-output-shape-and-the-worker-slot-ceiling/fgos-slots-verb-output-fields.md
docs/knowledge/how-to-add-a-changelog-md-entry-for-a-user-visible-change/add-a-changelog-entry-for-a-user-visible-change.md
docs/knowledge/how-to-hold-an-open-ended-design-brainstorm-with-fgos-coding/hold-an-open-ended-design-brainstorm-with-fgos-coding-shaping.md
docs/knowledge/reconcile-a-strategic-backlog-row-against-real-execution-sta/reconcile-a-strategic-backlog-row-against-real-execution-state.md
docs/knowledge/verify-cost-audit-real-pick-return-approve-cycle-counts/verify-cost-audit-pick-return-approve-cycle-counts.md
docs/knowledge/why-auto-decompose-children-now-carry-action-read-first-dire/why-auto-decompose-children-carry-action-and-read-first-directive-prose.md
docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md
docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md
docs/knowledge/why-fgos-merge-throughput-bottlenecked-despite-parallel-disp/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md
docs/knowledge/why-fgos-s-coding-domain-skills-were-rewritten-to-a-300-line/why-fgos-skills-split-into-skillmd-plus-references-under-300-lines.md
docs/knowledge/why-fgos-s-d-id-rul-id-adr-citations-must-carry-a-one-line-g/why-fgos-citations-carry-a-gloss-and-check-mechanically.md
docs/knowledge/why-herdr-cockpit-stacked-worker-launches-into-a-single-reus/why-herdr-cockpit-stacked-worker-launches-into-one-pane.md
docs/knowledge/why-mergerunneritem-now-checks-ancestry-before-attempting-a/merge-idempotent-on-already-merged-branch.md
docs/knowledge/why-runner-config-splits-capability-curated-vocab-executor-n/why-capability-executor-and-capacity-are-three-separate-concepts.md
docs/knowledge/why-session-claim-liveness-measures-worktree-activity-not-pi/why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md
docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md
docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md
docs/knowledge/work-item-pipeline-stages-verbs-actors-handoffs/work-item-pipeline-stages-verbs-and-handoffs.md
docs/knowledge/worker-slot-concept-and-engine-wide-worker-occupancy-ceiling/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md
docs/platform/agent-confinement/spec.md
docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/runs/1-context-investigator-raw.log
docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/attempt-1-superseded/asgn_coordinator_driver_op_001/runs/01/agent-result.json
docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/attempt-1-superseded/asgn_coordinator_driver_op_001/runs/01/result.json
docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/case-brief.mjs
docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/case-lock.md
docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/r6-single-agent-baseline/assignment.json
docs/platform/architecture-map.md
docs/platform/coexistence/spec.md
docs/platform/convention/spec.md
docs/platform/decision-citation-drift/spec.md
docs/platform/documentation/history/id-systems-audit.md
docs/platform/documentation/history/switchboard.md
docs/platform/documentation/subcomponents/document-identity/spec.md
docs/platform/documentation/subcomponents/document-identity/verification/recall/trial-cases.json
docs/platform/git/spec.md
docs/platform/graph/spec.md
docs/platform/herdr-web-dashboard/spec.md
docs/platform/observe/decisions/observe-component-architecture.md
docs/platform/platform-foundations.md
docs/platform/proposals/documentation-system-unification.md
docs/platform/proposals/knowledge-registry-redesign.md
docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md
docs/platform/questions/spec.md
docs/platform/runner/decisions/h-36d872fbb0e5.md
docs/platform/runner/subcomponents/h-2e032393add1/spec.md
docs/platform/session-host/spec.md
docs/platform/supervision/spec.md
docs/platform/system-overview/spec.md
docs/platform/work-state/decisions/retired-decision-history.md
docs/reading-map.md
dogfood-fixture/scenarios/expr-eval-chain.md
domains/coding/skills/fgos-coding-discovering/SKILL.md
domains/coding/skills/fgos-coding-planning/SKILL.md
domains/coding/skills/fgos-coding-shaping/SKILL.md
packages/convention/contracts/convention.golden.v1.json
packages/convention/contracts/convention.rules.v1.json
packages/convention/rust/tests/golden.rs
packages/durable-file/rust/tests/dir_replace.rs
packages/execution/contracts/confinement-policy/policy.v1.json
packages/execution/contracts/confinement-policy/resources.v1.json
packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/controller/evaluator-baseline.json
packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/evidence.json
packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/result.json
packages/execution/contracts/corpus/v3-open-attempt/producer/1/runs/01/controller/settle-context.json
packages/execution/contracts/run-result/readers.json
packages/host-runtime/contracts/command-manifest.json
packages/questions/rust/src/refcheck.rs
packages/questions/rust/tests/store_support.rs
packages/run-supervisor/rust/src/head_request.rs
packages/run-supervisor/rust/tests/head_request.rs
packages/supervision/rust/src/discussion_source.rs
packages/supervision/rust/tests/discussion_source.rs
packages/supervision/rust/tests/fixtures/definitions/discussion-settled/nomatch.jsonl
packages/supervision/rust/tests/fixtures/definitions/discussion-settled/records.jsonl
plugins/fgOS/skills/_shared/citation-format.md
plugins/fgOS/skills/_shared/executor-dispatch-fallback.md
plugins/fgOS/skills/coding-shape/SKILL.md
plugins/fgOS/skills/fgos-coding-discovering/SKILL.md
plugins/fgOS/skills/fgos-coding-planning/SKILL.md
plugins/fgOS/skills/fgos-coding-shaping/SKILL.md
plugins/fgOS/skills/fgos-secretary/SKILL.md
plugins/fgOS/skills/fgos-shaping/SKILL.md
plugins/fgOS/skills/fgos-supervisor/SKILL.md
plugins/fgOS/skills/terminal/SKILL.md
plugins/fgOS/skills/terminal/rename.sh
scripts/check-backlog-reconciliation.mjs
scripts/check-decision-citation-drift.baseline.json
scripts/check-decision-citation-drift.mjs
scripts/identity-ids-unique.mjs
src/cli/command-registry.mjs
src/report/context-render.mjs
src/runner/agent-roster.mjs
src/runner/dispatch/confinement/bypass-pairing.mjs
src/runner/merge.mjs
src/session-host/head-grants.mjs
src/session-host/head-plan.mjs
src/session-host/head-start.mjs
src/setup/skill-wrappers.mjs
src/state/frontier.mjs
src/state/work.mjs
test/cli/session-verb.test.mjs
test/e2e/fixture-marketing-domain.test.mjs
test/golden-recorders/confinement-policy.recorder.mjs
test/runner/dispatch-confinement-backend-p03.test.mjs
test/runner/dispatch-confinement-machine-private.test.mjs
test/runner/dispatch-confinement-policies.test.mjs
test/runner/merge.test.mjs
test/scripts/check-decision-citation-drift.test.mjs
test/scripts/doc-health.test.mjs
test/session-host/head-grants.test.mjs
test/session-host/head-permission-mode.test.mjs
test/session-host/head-plan.test.mjs
test/session-host/head-request.test.mjs
test/session-host/head-start.test.mjs
test/session-rotation/handoff-store.test.mjs
test/session-rotation/rotate.test.mjs
test/setup/gitignore-docs-history-not-excluded.test.mjs
test/state/domain-fields.test.mjs
```
