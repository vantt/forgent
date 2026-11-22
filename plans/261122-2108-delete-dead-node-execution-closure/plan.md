---
contract: plan-v1
title: "Delete the dead tier-5 Node execution modules and the tests that test them"
status: draft
priority: P1
base: 4ad3bfaf8b6ac875f0f6693600df8532588260af
blockedBy:
  - 261122-0118-heads-stable-and-able
  - 261118-1341-s6a-execution-tier-rust
  - 261122-1950-owner-communication-standard
footprint:
  - plans/261122-2108-delete-dead-node-execution-closure/**
  - src/runner/dispatch/**
  - src/runner/execution/**
  - src/run-supervisor/**
  - test/runner/dispatch-assignment-id-claim-concurrency.helper.mjs
  - test/runner/dispatch-assignment-id-claim-concurrency.test.mjs
  - test/runner/dispatch-brief.test.mjs
  - test/runner/dispatch-config-patterns.test.mjs
  - test/runner/dispatch-confinement-authority.test.mjs
  - test/runner/dispatch-confinement-backend-p03.test.mjs
  - test/runner/dispatch-confinement-blind.test.mjs
  - test/runner/dispatch-confinement-credential-hygiene.test.mjs
  - test/runner/dispatch-confinement-machine-private.test.mjs
  - test/runner/dispatch-confinement-p04.test.mjs
  - test/runner/dispatch-confinement-p05.test.mjs
  - test/runner/dispatch-confinement-policies.test.mjs
  - test/runner/dispatch-confinement-reaper-fence.test.mjs
  - test/runner/dispatch-execute-effort.test.mjs
  - test/runner/dispatch-executor-profile.test.mjs
  - test/runner/dispatch-governance-operability.test.mjs
  - test/runner/dispatch-governance-provider-denylist.test.mjs
  - test/runner/dispatch-i08b-remediation.test.mjs
  - test/runner/dispatch-operability-production-door.test.mjs
  - test/runner/dispatch-plan-policy.test.mjs
  - test/runner/dispatch-policy-baseline-snapshot.test.mjs
  - test/runner/dispatch-production-call-sites.test.mjs
  - test/runner/dispatch-r9-performance-cache.test.mjs
  - test/runner/dispatch-run-timeout.test.mjs
  - test/runner/dispatch-runtime-inspect.test.mjs
  - test/runner/dispatch-stray-write-attribution.test.mjs
  - test/runner/dispatch-terminal-slot.test.mjs
  - test/runner/dispatch-trust-store.test.mjs
  - test/runner/dispatch-visibility-session.test.mjs
  - test/runner/dispatch-worker-home.test.mjs
  - test/runner/dispatch-worker-session-boot.test.mjs
  - test/runner/dispatch-worker-session.test.mjs
  - test/runner/dispatch.test.mjs
  - test/runner/dispatch/**
  - test/runner/execution-contract.test.mjs
  - test/runner/execution/**
  - test/runner/assignment-cwd-mutex-concurrency.test.mjs
  - test/runner/assignment-dispatch.test.mjs
  - test/runner/assignment-enumerator-guard.test.mjs
  - test/runner/assignment-layout.test.mjs
  - test/runner/assignment-normalizer.test.mjs
  - test/runner/assignment-provenance.test.mjs
  - test/runner/assignment-runresult.test.mjs
  - test/runner/assignment.test.mjs
  - test/runner/run-lock-identity.test.mjs
  - test/runner/run-outcome.test.mjs
  - test/runner/run-result-confinement-label.test.mjs
  - test/runner/run-result-report-complete.test.mjs
  - test/runner/run-result-source-scan.test.mjs
  - test/runner/run-result-v2.test.mjs
  - test/runner/run-result-v3-reader.test.mjs
  - test/runner/provider-capacity.test.mjs
  - test/runner/provider-credential-probe.test.mjs
  - test/runner/provider-credential-renewal.test.mjs
  - test/runner/provider-per-cli-credential-sources.test.mjs
  - test/runner/provider-pool-lease.test.mjs
  - test/runner/provider-quarantine-probe.test.mjs
  - test/runner/agent-definitions.test.mjs
  - test/runner/agent-result-claim-contract.test.mjs
  - test/runner/cli-spawn-reconciliation.test.mjs
  - test/runner/config-seat-binding-layers.test.mjs
  - test/runner/credential-store.test.mjs
  - test/runner/custody-successor-admission.test.mjs
  - test/runner/dead-vocabulary-guard.test.mjs
  - test/runner/default-executor-merge.test.mjs
  - test/runner/driver-rununit.test.mjs
  - test/runner/effective-execution-contract.test.mjs
  - test/runner/egress-governance.test.mjs
  - test/runner/evidence-attribution.test.mjs
  - test/runner/herdr-private-home-trust.test.mjs
  - test/runner/herdr-spawn-adapter.test.mjs
  - test/runner/loop.test.mjs
  - test/runner/merge-quoted-paths.test.mjs
  - test/runner/operation-choice.test.mjs
  - test/runner/operation-prompt-templates.test.mjs
  - test/runner/runner-schema-vocabulary.test.mjs
  - test/runner/spawn-worker.test.mjs
  - test/runner/tier-cell.test.mjs
  - test/runner/tier-fallback-config.test.mjs
  - test/runner/work-unit-for.test.mjs
  - test/run-supervisor/**
  - test/golden-recorders/**
  - test/setup/capability-catalog-doctrine.test.mjs
  - test/setup/gate-kill-grace.test.mjs
  - test/setup/packaged-definitions.test.mjs
  - test/setup/seat-binding-dry-bind.test.mjs
  - test/session-host/head-start.test.mjs
  - test/seat-binding/client.test.mjs
  - test/convention/seat-id.test.mjs
  - test/state/work-size-rigor.test.mjs
  - test/util/session-identity.test.mjs
  - test/session-identity/attempt-writer-id.test.mjs
  - test/workflow/**
  - test/helpers/**
  - docs/architecture-manifest.json
  - test/architecture.test.mjs
  - packages/git/contracts/mutation-census.v1.json
  - packages/holder-lock/contracts/lock-registry.v1.json
  - packages/run-supervisor/contracts/recover-actions.v1.json
  - scripts/check-decision-citation-drift.baseline.json
  - docs/platform/runner/spec.md
  - docs/platform/runner/contracts/**
  - docs/platform/runner/architecture/**
  - docs/platform/runner/subcomponents/**
  - docs/platform/run-supervisor/spec.md
  - docs/platform/component-boundary.md
  - docs/platform/architecture-map.md
  - docs/platform/agent-confinement/spec.md
  - docs/platform/agent-confinement/contracts/**
  - docs/platform/agent-coordination/spec.md
  - docs/platform/agent-protocol/spec.md
  - docs/platform/config/spec.md
  - docs/platform/seat-binding/spec.md
  - docs/platform/secrets/spec.md
  - docs/platform/terminal-control/spec.md
  - docs/platform/work-state/spec.md
  - docs/platform/packaging-distribution/spec.md
  - docs/platform/resource-referee/spec.md
  - docs/how-to/configure-and-operate-agent-confinement.md
  - docs/reading-map.md
  - packages/execution/contracts/**
  - packages/agent-protocol/contracts/agent-protocol.v1.json
  - packages/resource-referee/contracts/resource-referee.v1.json
  - packages/run-supervisor/contracts/controller/**
  - packages/run-supervisor/contracts/envelope.v3.json
  - packages/run-supervisor/contracts/unit-state.v1.json
  - packages/run-supervisor/contracts/worker-env-allowlist.v1.json
  - apps/fgos/src/wiring/unit_run_host/**
  - packages/execution/engine/src/confinement/cleanup/probes/mod.rs
  - packages/execution/rust/src/decide.rs
  - packages/run-supervisor/rust/src/controller/**
  - packages/run-supervisor/rust/tests/controller_cwd_lock.rs
  - packages/run-supervisor/rust/tests/controller_trust_store.rs
  - core/skills/fgos-run/SKILL.md
  - core/skills/_shared/capability-catalog.md
  - core/skills/_shared/capability-matching.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
source:
  - plans/discussions/ds-owool5pjhn-delete-dead-tier-5-node-execution-modules/DISCUSSION.md
  - p-24xw2cwdvo
created: 2026-11-22
---

# Delete the dead tier-5 Node execution modules and the tests that test them

Answers backlog row `p-24xw2cwdvo` and the settled discussion `ds-owool5pjhn`. The owner chose option B on
2026-11-22 at 18:23: plan `261118-1341-s6a-execution-tier-rust` (S6a) stopped after its tail facades, and this
deletion moved to its own item. At 18:27 the owner ordered it to run right after its blockers. Every production
caller already reaches Execution through the Rust door, so the deletion is mechanical. The real cost is the
tests: each retired test has to name the Rust test that now owns its behaviour (design principle 8).

## Outcome

The Node files under `src/runner/dispatch/`, `src/runner/execution/` and `src/run-supervisor/` that no product
code reaches are deleted. So are the tests that test only those files. Tests that only borrowed one of those
files as a fixture now read a live module or a fixture of their own. Every retired test is listed in a phase
report next to the Rust test that now owns its behaviour, or with the note that the behaviour was removed. Live
documents, contract notes and comments stop naming deleted files as living twins. The architecture manifest no
longer carries `p-24xw2cwdvo` as a retire condition.

## Acceptance criteria

1. The dead-file list in `reports/closure.md` (phase 1, recomputed on the post-`261122-0118` base) is empty
   on the merged tree: each listed path is absent (`git ls-files <path>` prints nothing).
2. No import of a deleted path remains. A rerun of phase 1's graph method on the merged tree finds no file in the
   three directories that lacks a live importer. Also, `git grep -nE '<deleted paths>' -- src bin scripts domains test
   packages apps core` returns no hit, except the frozen mailbox harness's own reach (see Decisions) and history
   records.
3. Every deleted or rewired test appears in one `reports/tests-*.md` table with its disposition: the owning Rust
   test (crate, file and test name), or the existing Node test that owns the behaviour, or `behaviour removed`
   with the reason.
4. `docs/architecture-manifest.json` and `test/architecture.test.mjs` no longer contain `p-24xw2cwdvo`
   (`git grep -c p-24xw2cwdvo -- docs/architecture-manifest.json test/architecture.test.mjs` prints nothing). Rows
   whose last entry went are closed. Rows that keep live entries name the step that owns them (S6b, S7 or the
   mailbox lane).
5. `node scripts/git-one-door-scan.mjs --write-census` leaves the census unchanged after phase 8's regeneration,
   and `node --test test/setup/git-mutation-census.test.mjs` passes.
6. On the merged tree, run one at a time: `npm test` is green, then `cargo test --workspace` is green
   (`reports/integration.md` records both commands, the commit they ran on, and the counts).

## Non-goals

- No new behaviour, verb, flag or mechanism (RUL104).
- No change to the Rust engine's code. Rust files are touched only to fix comments that name a deleted Node file
  as a living twin, and `cargo test --workspace` proves no code moved.
- No edit to any file `261122-0118` still edits before it lands. The `blockedBy` entry enforces this, and phase 1
  recomputes the facts on its landed tree.
- Files that are still live stay. That covers the facades and twins reached from `src/workflow/definition.mjs`,
  `src/setup/seat-binding-checks.mjs` and `domains/coding/harness/enrich-and-validate-contract.mjs`, and anything
  `261122-0118` leaves reached. They keep their own retire steps: S6b for the Workflow callers, S7 for the Work and
  session-head callers.
- History records stay as written: `archive/`, `docs/history/`, `docs/explanation/`, the `verification/`,
  `history/`, `proposals/` and `architecture/` subtrees under `docs/platform/agent-coordination/`, and closed
  plans. Plans and reports are stateful records.
- No `CHANGELOG.md` line, because a user of fgOS sees nothing. The deleted code had no product caller.

## Decisions (made here, grounded)

- **The frozen mailbox harness keeps its reach.** `scripts/lib/mailbox-live-confined.mjs` and
  `scripts/record-mailbox-hook-fixtures.mjs` import the Node bwrap driver, the confinement resources, the
  credential-expiry reader and the worker-session boot. Those imports keep about 12 closure files alive.
  `docs/architecture-manifest.json` already rules this harness a frozen measurement input whose bytes do not
  change: the entry at about line 150 reads "frozen live measurement harness … until the mailbox lane re-measures
  it", and the one at about line 445 reads "moves onto the process door when V7n is re-measured (MAIL)". Deleting
  its dependencies would break that harness, and rewiring it would change its bytes. So the files it reaches stay.
  Their manifest entries change their retire condition from `p-24xw2cwdvo` to the mailbox lane's re-measure.
  Phase 8 records that change, and phase 9 writes a settled-fact line into `docs/platform/runner/spec.md`. This
  decision follows from an existing decision and needs no owner answer.
- **Phase 1 recomputes the list; the plan does not freeze one.** The counts on base `4dffbaad4`, measured
  with phase 1's method: 89 files in the three directories, 27 reached from product code or the mailbox harness,
  and 62 dead (about 19.2k lines). 125 test files import a dead file directly, and 33 of them import nothing else
  from product code. `261122-0118` makes `head-stop` and `rotate` await the host cancel op, which can free
  `cancel-registry.mjs`, `assignment-layout.mjs` and `confinement/authority.mjs`. The authoritative list is therefore
  the one phase 1 computes on the base after that plan lands.
- **Helper APIs stay stable during wave 2.** `test/helpers/declared-assignment.mjs` (21 importers) and
  `test/helpers/work-seat-config.mjs` (18 importers) import dead files. Phase 7 changes their internals but keeps
  their exported names and shapes, so the parallel test phases are not affected.

## Prior art

What this plan reuses: S6a's phase 20 and 21 records and the close report
(`plans/261118-1341-s6a-execution-tier-rust/phase-21-dispatch-subs.md`, `reports/close.md`) for the rows and
retire conditions; the `"recorded from src/runner/…"` notes in `packages/execution/contracts/**`, which map each
Node module to the corpus fixture and the Rust test that now reads it; `scripts/git-one-door-scan.mjs
--write-census`, which regenerates the census; and `npm run build:skills` for the skill renders. What was missing:
a list of dead files computed after the tail plan, and a mapping from each test to its owning Rust test. Phases 1
to 7 produce both.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Facts: recompute the dead closure and the test dispositions](phase-01-facts.md) | - | plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md | 1 | draft |
| 2 | [Retire or rewire the dispatch tests](phase-02-tests-runner-dispatch.md) | 1 | test/runner/dispatch-assignment-id-claim-concurrency.helper.mjs, test/runner/dispatch-assignment-id-claim-concurrency.test.mjs, test/runner/dispatch-brief.test.mjs, test/runner/dispatch-config-patterns.test.mjs, test/runner/dispatch-confinement-authority.test.mjs, test/runner/dispatch-confinement-backend-p03.test.mjs, test/runner/dispatch-confinement-blind.test.mjs, test/runner/dispatch-confinement-credential-hygiene.test.mjs, test/runner/dispatch-confinement-machine-private.test.mjs, test/runner/dispatch-confinement-p04.test.mjs, test/runner/dispatch-confinement-p05.test.mjs, test/runner/dispatch-confinement-policies.test.mjs, test/runner/dispatch-confinement-reaper-fence.test.mjs, test/runner/dispatch-execute-effort.test.mjs, test/runner/dispatch-executor-profile.test.mjs, test/runner/dispatch-governance-operability.test.mjs, test/runner/dispatch-governance-provider-denylist.test.mjs, test/runner/dispatch-i08b-remediation.test.mjs, test/runner/dispatch-operability-production-door.test.mjs, test/runner/dispatch-plan-policy.test.mjs, test/runner/dispatch-policy-baseline-snapshot.test.mjs, test/runner/dispatch-production-call-sites.test.mjs, test/runner/dispatch-r9-performance-cache.test.mjs, test/runner/dispatch-run-timeout.test.mjs, test/runner/dispatch-runtime-inspect.test.mjs, test/runner/dispatch-stray-write-attribution.test.mjs, test/runner/dispatch-terminal-slot.test.mjs, test/runner/dispatch-trust-store.test.mjs, test/runner/dispatch-visibility-session.test.mjs, test/runner/dispatch-worker-home.test.mjs, test/runner/dispatch-worker-session-boot.test.mjs, test/runner/dispatch-worker-session.test.mjs, test/runner/dispatch.test.mjs, test/runner/dispatch/**, plans/261122-2108-delete-dead-node-execution-closure/reports/tests-runner-dispatch.md | 2 | draft |
| 3 | [Retire or rewire the execution tests](phase-03-tests-runner-execution.md) | 1 | test/runner/execution-contract.test.mjs, test/runner/execution/**, plans/261122-2108-delete-dead-node-execution-closure/reports/tests-runner-execution.md | 2 | draft |
| 4 | [Retire or rewire the assignment, run-result and provider tests](phase-04-tests-runner-assignment-run-provider.md) | 1 | test/runner/assignment-cwd-mutex-concurrency.test.mjs, test/runner/assignment-dispatch.test.mjs, test/runner/assignment-enumerator-guard.test.mjs, test/runner/assignment-layout.test.mjs, test/runner/assignment-normalizer.test.mjs, test/runner/assignment-provenance.test.mjs, test/runner/assignment-runresult.test.mjs, test/runner/assignment.test.mjs, test/runner/run-lock-identity.test.mjs, test/runner/run-outcome.test.mjs, test/runner/run-result-confinement-label.test.mjs, test/runner/run-result-report-complete.test.mjs, test/runner/run-result-source-scan.test.mjs, test/runner/run-result-v2.test.mjs, test/runner/run-result-v3-reader.test.mjs, test/runner/provider-capacity.test.mjs, test/runner/provider-credential-probe.test.mjs, test/runner/provider-credential-renewal.test.mjs, test/runner/provider-per-cli-credential-sources.test.mjs, test/runner/provider-pool-lease.test.mjs, test/runner/provider-quarantine-probe.test.mjs, plans/261122-2108-delete-dead-node-execution-closure/reports/tests-runner-assignment-run-provider.md | 2 | draft |
| 5 | [Retire or rewire the remaining runner tests](phase-05-tests-runner-rest.md) | 1 | test/runner/agent-definitions.test.mjs, test/runner/agent-result-claim-contract.test.mjs, test/runner/cli-spawn-reconciliation.test.mjs, test/runner/config-seat-binding-layers.test.mjs, test/runner/credential-store.test.mjs, test/runner/custody-successor-admission.test.mjs, test/runner/dead-vocabulary-guard.test.mjs, test/runner/default-executor-merge.test.mjs, test/runner/driver-rununit.test.mjs, test/runner/effective-execution-contract.test.mjs, test/runner/egress-governance.test.mjs, test/runner/evidence-attribution.test.mjs, test/runner/herdr-private-home-trust.test.mjs, test/runner/herdr-spawn-adapter.test.mjs, test/runner/loop.test.mjs, test/runner/merge-quoted-paths.test.mjs, test/runner/operation-choice.test.mjs, test/runner/operation-prompt-templates.test.mjs, test/runner/runner-schema-vocabulary.test.mjs, test/runner/spawn-worker.test.mjs, test/runner/tier-cell.test.mjs, test/runner/tier-fallback-config.test.mjs, test/runner/work-unit-for.test.mjs, plans/261122-2108-delete-dead-node-execution-closure/reports/tests-runner-rest.md | 2 | draft |
| 6 | [Retire or rewire the run-supervisor, golden-recorder, setup and other tests](phase-06-tests-supervisor-setup-misc.md) | 1 | test/run-supervisor/**, test/golden-recorders/**, test/setup/capability-catalog-doctrine.test.mjs, test/setup/gate-kill-grace.test.mjs, test/setup/packaged-definitions.test.mjs, test/setup/seat-binding-dry-bind.test.mjs, test/session-host/head-start.test.mjs, test/seat-binding/client.test.mjs, test/convention/seat-id.test.mjs, test/state/work-size-rigor.test.mjs, test/util/session-identity.test.mjs, test/session-identity/attempt-writer-id.test.mjs, plans/261122-2108-delete-dead-node-execution-closure/reports/tests-supervisor-setup-misc.md | 2 | draft |
| 7 | [Rewire the workflow tests and the shared helpers](phase-07-tests-workflow-helpers.md) | 1 | test/workflow/**, test/helpers/**, plans/261122-2108-delete-dead-node-execution-closure/reports/tests-workflow-helpers.md | 2 | draft |
| 8 | [Delete the dead source; close the manifest rows; regenerate the census](phase-08-delete-source.md) | 1, 2, 3, 4, 5, 6, 7 | src/runner/dispatch/**, src/runner/execution/**, src/run-supervisor/**, docs/architecture-manifest.json, test/architecture.test.mjs, packages/git/contracts/mutation-census.v1.json, packages/holder-lock/contracts/lock-registry.v1.json, packages/run-supervisor/contracts/recover-actions.v1.json, scripts/check-decision-citation-drift.baseline.json | 3 | draft |
| 9 | [Docs, contract notes, comments and skills stop naming deleted files](phase-09-docs-and-notes.md) | 1 | docs/platform/runner/spec.md, docs/platform/runner/contracts/**, docs/platform/runner/architecture/**, docs/platform/runner/subcomponents/**, docs/platform/run-supervisor/spec.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/agent-confinement/spec.md, docs/platform/agent-confinement/contracts/**, docs/platform/agent-coordination/spec.md, docs/platform/agent-protocol/spec.md, docs/platform/config/spec.md, docs/platform/seat-binding/spec.md, docs/platform/secrets/spec.md, docs/platform/terminal-control/spec.md, docs/platform/work-state/spec.md, docs/platform/packaging-distribution/spec.md, docs/platform/resource-referee/spec.md, docs/how-to/configure-and-operate-agent-confinement.md, docs/reading-map.md, packages/execution/contracts/**, packages/agent-protocol/contracts/agent-protocol.v1.json, packages/resource-referee/contracts/resource-referee.v1.json, packages/run-supervisor/contracts/controller/**, packages/run-supervisor/contracts/envelope.v3.json, packages/run-supervisor/contracts/unit-state.v1.json, packages/run-supervisor/contracts/worker-env-allowlist.v1.json, apps/fgos/src/wiring/unit_run_host/**, packages/execution/engine/src/confinement/cleanup/probes/mod.rs, packages/execution/rust/src/decide.rs, packages/run-supervisor/rust/src/controller/**, packages/run-supervisor/rust/tests/controller_cwd_lock.rs, packages/run-supervisor/rust/tests/controller_trust_store.rs, core/skills/fgos-run/SKILL.md, core/skills/_shared/capability-catalog.md, core/skills/_shared/capability-matching.md, .agents/skills/**, plugins/fgOS/skills/** | 2 | draft |
| 10 | [Integration: merge and run the full gate](phase-10-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9 | plans/261122-2108-delete-dead-node-execution-closure/reports/integration.md | 4 | draft |

Every phase uses capability `code:implement`, except phase 1 and phase 10, which use `code:test` (evidence reads
and the gate; neither changes code).

Contract reading, checked by hand and then by `fgos resource-check --plan` and `node scripts/plan-contract-check.mjs`.
Phases 2 to 7 and 9 share wave 2, and their footprints are disjoint. The `test/runner/` footprints of phases 2
to 5 are explicit file lists, plus the subdirectories `test/runner/dispatch/**` and `test/runner/execution/**`,
because the resource door reads a glob such as `test/runner/dispatch*` as its whole directory
(`fgos resource-check --plan` result: accept, 10 units, 0 findings). Phase 8 deletes source only after every test that imports it is gone or rewired. Phase 9 touches no file
that phase 8 owns. The hot files have one writer each: `docs/architecture-manifest.json`,
`test/architecture.test.mjs` and the census belong to phase 8, the skill renders and `docs/reading-map.md` to
phase 9. A tree with only wave 2 merged stays green: removing a test, or swapping a test's dead import for a live
one, cannot break a still-present source file. A tree that also has phase 8 is green, because phases 2 to 7 already
removed every importer.

## When this plan turns ready

The plan stays `draft` while any blocker is active. `scripts/plan-contract-check.mjs` reports every footprint
overlap between active plans and does not exempt a `blockedBy` pair. This plan shares unavoidable hot files with
`261122-0118-heads-stable-and-able` (the architecture manifest, `test/session-host/head-start.test.mjs`, the
run-supervisor and config specs, the skill renders) and with `261122-1950-owner-communication-standard` (the
census, `docs/reading-map.md`, `core/skills/fgos-run/SKILL.md`, the skill renders). Both are listed in `blockedBy`
so that each hot file has one writer at a time. When both are `done` (S6a already is), rebase `base:` onto `main`,
rerun `node scripts/plan-contract-check.mjs --plan plans/261122-2108-delete-dead-node-execution-closure`, set the
plan and its phase rows to `ready`, and land `plan.md` alone. That flip wakes the supervisor. Whoever sees the
second blocker land does it: the supervisor, the secretary, or this head on a later wake.

## Owner questions

None. The one judgment call, the frozen mailbox harness, is settled by the manifest's existing frozen-harness
decision (see Decisions).

## Constraints

- One suite at a time. Never run `npm test` and `cargo test --workspace` in parallel, and keep every cargo build
  inside one worktree (disk and memory; the backlog row's note).
- L10: nothing replaced stays behind. A file that turns out live is not deleted. Its manifest entry names the step
  that owns it instead.
- Run working-tree code with `npm run fgos:dev -- <verb>`, never plain `fgos`.
- No plan ids, phase numbers or backlog ids in code comments, test names or commit messages.

## Risks and rollback

| Risk | Level | Proof point |
|---|---|---|
| A test is retired while no Rust test proves its behaviour | medium | each `reports/tests-*.md` row names the Rust test by crate, file and name, and phase 10 spot-checks five rows by running exactly those tests |
| A file looks dead to the static graph but is loaded by a string path (spawn of a `.mjs`, `new URL(...)`, a template import) | medium | phase 1 adds a `git grep` of every candidate path over `src bin scripts domains packages apps` to the graph result. Any non-import hit keeps the file live until it is explained |
| `261122-0118` leaves a different tail than expected | low | phase 1 runs on its landed tree; the plan's footprint already covers the three directories in full |
| A footprint misses a test that phase 1 finds | low | the phase 1 report assigns each test importer to exactly one phase. A file outside every footprint is raised by the lead as a footprint-widen question before wave 2 starts |
| Census or architecture guard drifts after deletion | low | phase 8 regenerates the census and runs `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` |

Rollback: the plan only deletes files and rewrites test imports, docs and notes. Each phase lands as its own
commit, and `git revert <commit>` restores that phase. To restore everything, revert the commits in reverse
order: phase 8 first, then 9, then 2 to 7.

## Outstanding questions

None
