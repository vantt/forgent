---
phase: 08
title: "Packaged definitions: the release's own tiers are proven by npm test; doctor judges only the tiers a project supplies"
status: pending
depends_on: [07]
parallel: "none (registrations.mjs chain)"
owning_lane: "HARDEN (reviewer: TEST)"
effort: ~0.5d
net_size: "Node −150 / Rust 0 / tests −50 (estimate)"
---

# Phase 08 — Packaged definitions split

## Context

Audit §1 "Packaged definitions": class O, "R for release tiers; K only for a project tier". A shipped release's `core/` and `domains/` cannot change after build, so judging them on every doctor run in every project is a release test, not readiness; a project's own tier (`fgos/agents` workspace folder, RUL13, packaging-distribution spec `:697-698`; project prompt templates) can break per project, which is readiness. Code read on `fd476d709`:

| Row | Body | Registration | What it reads |
|---|---|---|---|
| `task-specs-resolve` | `registrations.mjs:828-863` (`root = FGOS_INSTALL_ROOT`) | `:1467-1472` | packaged domains' task-spec map → files |
| `agent-claims-resolve` | `:999-1052` (`allAgentYamlFiles` `:932-972`) | `:1473-1478` | `core/agents` + other tiers under cwd |
| `domain-registry-compiled` | `:1484-1518` | `:1519-1524` | `<cwd>/domains/*/compiled.json` vs registry/workflow YAML |
| `agent-type-names-unique` | `:1239-1283` | `:1525-1530` | tiers `fgos/agents`, `domains/*/agents`, `core/agents` |
| `domain-workflow-operations-coverage` | `:1908-1921` (+ `findWorkflowStageOperationProblems` `:1053-1238`) | `:1922-1927` | packaged domain workflows |
| `operation-prompt-templates-valid` | `:3486-3520` | `:3501-3506` | project/domain/core template tiers |

Existing release-side tests: `test/state/domain-registry-compiled.test.mjs`, `test/runner/operation-prompt-templates.test.mjs`, `test/setup/yaml-parse-failures.test.mjs`, `test/setup/registrations.test.mjs` (task specs, operations coverage).

## Requirements

- For each row: one `npm test` case judges the packaged tiers of this checkout (the release's source) with the same function; then the doctor row judges only tiers outside the installed release (`fgos/agents`, project `domains/` when the project is not the release source, project template tier). A row with no project tier (task specs, operations coverage: packaged domains only) is deleted from doctor after its test exists.
- Keep one body per judgment: the function takes the tier list; the test passes the packaged tiers, the row passes the project tiers. No copy.
- `DOMAINS`-based checks that read the install root (`checkTaskSpecsResolve`, coverage) leave doctor entirely; their bodies stay where a product caller still needs them, or move to the test helper if none remains (grep).
- In the fgOS repo itself, the project tier and the release source are the same tree: the row skips tiers the test already owns (by path), so nothing is judged twice.
- `CHANGELOG.md`: packaged-definition rows judge only project tiers; release tiers are release tests.

## Files

**Create:** none expected.

**Modify:** `src/setup/registrations.mjs` (bodies/registrations above), tests listed in Context plus `test/setup/checks.test.mjs`; registry contract; `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` or the domain spec if it names these rows (plan id grep); `CHANGELOG.md`.

**Delete:** none.

**Tests to retire:** doctor-row cases in `checks.test.mjs`/`registrations.test.mjs` that judged packaged tiers through the row → owned by the new release-tier cases (each named in the report); project-tier cases stay on the row.

## Net size

Node: two rows deleted −60, `findWorkflowStageOperationProblems` and task-spec bodies leave `src/setup` if test-only −100, tier parameters +10 → about −150. Tests: row cases −80, release-tier cases +30 → about −50.

## Validation

- FR the release-tier test files, `test/setup/checks.test.mjs test/setup/registrations.test.mjs test/setup/yaml-parse-failures.test.mjs`
- Red: break one packaged task-spec reference on a scratch copy → the release-tier test fails; break one `fgos/agents` file in a scratch project → the doctor row fails
- doctor time before/after

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A broken release ships because the test did not cover a tier doctor used to | L × H | Tier list per row in the report; release tiers = everything under the install root |
| A project's own `domains/` (domain extension) stops being judged | M × M | Project tiers stay on the row; red case above |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

Release tiers proven by tests, doctor judges project tiers only, no judgment twice; landed with a guide section.

## Lead brief essentials

One body per judgment, tier list as the parameter. All plan.md lead rules apply.
