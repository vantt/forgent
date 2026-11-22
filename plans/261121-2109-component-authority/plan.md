---
contract: plan-v1
title: "Component authority: one structural model of layers, components, decision kinds, doors, contracts and files, with generated human views"
status: draft
priority: P1
blockedBy:
  - 261118-1341-s6a-execution-tier-rust
  - 261120-0625-work-data-model
  - 261122-0118-heads-stable-and-able
  - 261122-1950-owner-communication-standard
base: 8a7839d3881a03527cfcf003e05dc323d191a613
footprint:
  - plans/261121-2109-component-authority/**
  - docs/platform/component-authority/**
  - packages/component-authority/contracts/**
  - packages/component-authority/model/**
  - docs/architecture-manifest.json
  - test/architecture.test.mjs
  - test/component-authority/**
  - src/setup/instruction-registry.mjs
  - test/setup/instruction-registry.test.mjs
  - src/verbs/merge/iron-law-level.mjs
  - src/runner/dispatch/execution-contract.mjs
  - scripts/install-git-hooks.mjs
  - scripts/component-authority-render.mjs
  - src/report/decision-index.mjs
  - test/report/decision-index.test.mjs
  - core/instructions/design-principles.md
  - AGENTS.md
  - docs/reading-map.md
  - docs/explanation/core-foundation-domain-boundary.md
  - docs/explanation/herdr-spawn-adapter-fresh-pane.md
  - docs/platform/README.md
  - docs/platform/architecture-map.md
  - docs/platform/component-boundary.md
  - docs/platform/governance.md
  - docs/platform/vision.md
  - docs/platform/system-overview/spec.md
  - docs/platform/observe/spec.md
  - docs/platform/workflow/spec.md
  - docs/platform/runner/spec.md
  - docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md
  - docs/platform/documentation/subcomponents/document-identity/spec.md
  - docs/platform/seat-binding/spec.md
  - docs/platform/agent-mailbox/spec.md
  - docs/platform/secrets/spec.md
  - docs/platform/work-state/spec.md
  - docs/platform/host-invocation-routing/spec.md
  - docs/platform/write-scope/spec.md
  - docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
  - docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
  - docs/platform/proposals/component-authority-boundary-map.md
source:
  - plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md
  - p-esa3lau6kd
  - p-7nja6ilwkr
created: 2026-11-21
---

# Component authority: one structural model

## Outcome

The repository has one place that answers "who owns what". The new, small, isolated component
`component-authority` holds one machine-read structural model at `packages/component-authority/model/`.
The model holds layers, the three layering rules and tiers; components and subcomponents (rows with a
`parent`); decision kinds; doors; a contract index; and file-to-component mapping (CA-D3, CA-D4, discussion §6).
`docs/architecture-manifest.json` is gone, and `test/architecture.test.mjs` reads the model instead. Every
contract has exactly one provider. The human views (`component-boundary.md`, `architecture-map.md` §6/§7,
system-overview Area Map and Shared Entities, the area Shared Entities sections, the `docs/platform/README.md`
owner table and the governance holder table) are generated from the model, and regenerating them produces no
diff. The proposal map is retired. The spec says the component holds design ownership and grants no runtime
permission, so it is not confused with Agent Confinement Authority (owner, 21:12).

The two doors `locate` and `declare`, their wiring into the skills and the plan contract, the twin and debt
cleanup, and the primitive-and-alias land checks are in the sibling plan
[`261121-2110-component-authority-doors`](../261121-2110-component-authority-doors/plan.md). That plan touches
files that three running plans own, so it waits for them (see Risks).

## Facts (prior art, written 2026-11-21 at bf061ff35, refreshed 2026-11-22 at 8a7839d38)

- `docs/architecture-manifest.json` (since 7349a52bc): keys `contract`, `map`, `layers` (5), `rules` (3:
  `one-directional-layer`, `domain-siloing`, `tier-downward`), `components` (1: `packaging-distribution`),
  `domains` (3), `tierNames`, `tiers` (44 prefixes), `tierExceptions` (0), `doors` (83 rows, fields `job`,
  `kind`, `patterns`, `allowed`, `debt`, `reason`, `retiredBy`; 320 allowed entries; 75 debt entries in 22
  rows), `files` (325 file-to-layer rows). At bf061ff35 it had 78 door rows, 76 debt entries and 344 files;
  the s6a and work-data-model plans changed it since, and phase 2 moves it as it stands.
- Live readers: `test/architecture.test.mjs:31,1590` (all checks, `checkDoors` at :1768-1828);
  `src/setup/instruction-registry.mjs:455` (`discoverKnownOwners` reads `components` and `domains`), with
  fixtures in `test/setup/instruction-registry.test.mjs`. Comment mentions are in `src/verbs/merge/iron-law-level.mjs:9`,
  `src/runner/dispatch/execution-contract.mjs:77`, `src/cli/command-registry.mjs:7` and
  `scripts/install-git-hooks.mjs:6`. Placement rule `doc-architecture-manifest-1` is in
  `packages/convention/contracts/convention.rules.v1.json:155`. Live prose mentions are in AGENTS.md,
  `core/instructions/design-principles.md`, `docs/reading-map.md` and the platform docs listed in the footprint.
- `src/report/decision-index.mjs:30` (`narrativeHolderResolver`) parses the governance "Decision scope to
  holder table" by hand. It is the only generator that reads an ownership ledger today.
- Contracts: 118 top-level files in 27 `packages/*/contracts/` directories, plus 406 fixtures, vectors and
  goldens below them. There are 31 prose contracts at `docs/platform/*/contracts/*.md`, and CTR001-CTR013 in
  `architecture-map.md` §7, some of them `planned` or `idea` with no file.
- Only three files have a heading titled "Shared Entities": system-overview, observe and workflow. The discussion
  counted 10 specs with ownership columns. Phase 4 lists the rest when it reads them.
- The convention door returns the plan dir: `fgos convention path --kind plan --slug component-authority`.

## Prior art reused, and what was missing

Reused: the manifest's layers, rules, tiers, door rows and their test (moved whole, not rewritten); the
`decision-index` generate-and-`--check` shape (`src/report/decision-index.mjs`, after
`enduser-index-generate.mjs`); `runner.capabilities` canonical-name-plus-aliases (D14); the vocabulary of the
proposal map (Owns / Must not own), the source links of `component-boundary.md`, the CTR ids, and the scope
aliases of the governance holder table. Missing: a component-to-decision-kind mapping, an owner per contract, a
generator for the human views, and one machine-read home for all of it.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `component-authority` component | declared by phase 1 as the first row of `components.json` | owner approved the new component (CA-D3, q-7wd766tu4p) |
| decision kind "who owns what: components, decision kinds, doors, contracts, file mapping" | `decision-kinds.json`, owner `component-authority` | the survivor of the six ledgers in discussion §3 row 1a; all other ledgers become generated views or are retired |
| layer/tier/door data | moved from the manifest | survivor: the model; retired: `docs/architecture-manifest.json` (same change, L10) |

## Acceptance criteria

1. `docs/platform/component-authority/spec.md` exists with `Design status: Accepted`, cites CA-D1..CA-D5, and
   says the component grants no runtime permission. `packages/component-authority/model/components.json`
   holds the `component-authority` row first. Check: `node --test test/component-authority/components.test.mjs`.
2. `docs/architecture-manifest.json` does not exist. `node --test test/architecture.test.mjs` is green on the
   model. Every `.mjs` under `src/` and `bin/` resolves to exactly one component. `rg -l architecture-manifest.json`
   finds only history (`archive/`, `docs/history/`, `docs/platform/**/verification/**`, decision narratives,
   `plans/`). Exception: `docs/platform/packaging-distribution/spec.md` and the convention rule, which the
   sibling plan sweeps.
3. Every top-level file in `packages/*/contracts/`, every `docs/platform/*/contracts/*.md` and every CTR row has
   one contract row with exactly one provider component. Live and designed rows name an existing file. The test
   goes red when a file lacks a row, or a row lacks its provider or file. Check:
   `node --test test/component-authority/contracts.test.mjs`.
4. `node scripts/component-authority-render.mjs --check` exits 0 and `npm test` runs it. The generated views
   listed in the Outcome carry a generated-block marker. `docs/platform/proposals/component-authority-boundary-map.md`
   is deleted and its useful rows are in the model. The contradictions in discussion §3 rows 1a and 3a(6)
   are each resolved in the model by recording what the code shows: config facade, canonical JSON, process kill,
   supervision crate and verbs, and the nonexistent `OccupancyPort`. `src/report/decision-index.mjs` reads
   decision kinds from the model.
5. `npm test` and `cargo test --workspace` are green on the integrated tree.

## Non-goals

- The `locate` and `declare` verbs, skill and plan-contract wiring, twin and debt retirement, and
  primitive-and-alias door matching. These are in the sibling plan `261121-2110-component-authority-doors`.
- Contract contents (the model indexes contracts and never copies them); RUL, the L1-L10 laws, design
  principles, and decision records. The model points to where they live (discussion §3 row 4b, provisional).
- Any change to the documentation H2 design; the RUL id collision (T8).
- Deleting door `debt` entries. This plan moves them as they are. Retiring them is the sibling plan's job.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Spec, model schema and the self row](phase-01-spec-and-schema.md) | - | docs/platform/component-authority/spec.md, packages/component-authority/contracts/model.v1.json, packages/component-authority/model/components.json, docs/platform/README.md, docs/reading-map.md | 1 | ready |
| 2 | [Move the manifest into the model](phase-02-model-migration.md) | 1 | packages/component-authority/model/layers.json, packages/component-authority/model/tiers.json, packages/component-authority/model/files.json, packages/component-authority/model/doors/, packages/component-authority/model/components.json, docs/architecture-manifest.json, test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, src/verbs/merge/iron-law-level.mjs, src/runner/dispatch/execution-contract.mjs, scripts/install-git-hooks.mjs, core/instructions/design-principles.md, AGENTS.md, docs/reading-map.md, docs/explanation/core-foundation-domain-boundary.md, docs/explanation/herdr-spawn-adapter-fresh-pane.md, docs/platform/vision.md, docs/platform/runner/spec.md, docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md, docs/platform/seat-binding/spec.md, docs/platform/agent-mailbox/spec.md, docs/platform/secrets/spec.md, docs/platform/work-state/spec.md, docs/platform/host-invocation-routing/spec.md, docs/platform/write-scope/spec.md, docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md, docs/platform/packaging-distribution/contracts/setup-doctor-registry.md, docs/platform/governance.md, docs/platform/architecture-map.md, docs/platform/component-boundary.md | 2 | draft |
| 3 | [Component and decision-kind rows; layer and tier from components](phase-03-components-and-decision-kinds.md) | 2 | packages/component-authority/model/components.json, packages/component-authority/model/decision-kinds.json, packages/component-authority/model/files.json, packages/component-authority/model/tiers.json, test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, test/component-authority/components.test.mjs | 3 | draft |
| 4 | [Contract index](phase-04-contract-index.md) | 3 | packages/component-authority/model/contracts.json, test/component-authority/contracts.test.mjs | 4 | draft |
| 5 | [Generated ownership views and decision-index on the model](phase-05-ownership-views.md) | 3 | scripts/component-authority-render.mjs, test/component-authority/render.test.mjs, src/report/decision-index.mjs, test/report/decision-index.test.mjs, docs/platform/component-boundary.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 4 | draft |
| 6 | [Architecture-map registries generated; proposal map retired](phase-06-architecture-map-views.md) | 4, 5 | scripts/component-authority-render.mjs, test/component-authority/render.test.mjs, docs/platform/architecture-map.md, docs/platform/proposals/component-authority-boundary-map.md, docs/platform/component-authority/spec.md | 5 | draft |
| 7 | [Integration](phase-07-integration.md) | 6 | plans/261121-2109-component-authority/ | 6 | draft |

Phases are layered (one model, one test file), so most of the plan runs serially. Phases 4 and 5 run in
parallel in wave 4. Hot files: `components.json` has one writer per wave (phase 1, then phase 2, then phase 3).
`test/architecture.test.mjs` is written by phase 2, then phase 3. `scripts/component-authority-render.mjs` is
written by phase 5, then phase 6. The generated views are regenerated and never merged by hand. Phase 2
touches `governance.md`, `architecture-map.md` and `component-boundary.md` only to change the manifest
mention; phases 5 and 6 then replace their registry sections with generated blocks. The check
`node scripts/plan-contract-check.mjs --plan plans/261121-2109-component-authority` passes while the plan is `draft`.

**Owner approval (2026-11-21 23:34):** the owner approved this plan and its sibling as written (option A of the approval question lead:SUPERVISOR put to him). It stays `draft` only because the plan-contract check refuses `ready` while its footprint overlaps the running plans below. When every `blockedBy` plan is `done`, the planner or supervisor sets `ready` with no further owner question.

**Refresh (2026-11-22, planner wake):** the two original `blockedBy` plans are `done`. `base` moved to 8a7839d38,
the manifest counts and reader line numbers in Facts were re-read, and the discussion path follows its move to
`plans/discussions/` (a1022572a). The check still refuses `ready`, because three plans that became active after
this plan was written own files in its footprint, so they joined `blockedBy`:
- `261122-0118-heads-stable-and-able` (running): `docs/architecture-manifest.json` and
  `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.
- `261122-0056-orchestration-skeleton`: removed from `blockedBy` by the owner order below; it now waits on this plan.
- `261122-1950-owner-communication-standard` (ready): `AGENTS.md`, `docs/reading-map.md`,
  `docs/platform/agent-mailbox/spec.md` and `docs/platform/observe/spec.md`.
The same rule applies when they are `done`: refresh `base`, re-read the manifest, run the check, set `ready`.

**Owner order (2026-11-22 23:20, via the secretary, recorded by head:supervisor-forgent):** component-authority
goes first, then its doors plan `261121-2110-component-authority-doors`; `261122-0056-orchestration-skeleton` runs in
parallel only where it does not collide. The two plans listed each other in `blockedBy`, a cycle that admitted
neither, so `261122-0056-orchestration-skeleton` left this plan's `blockedBy` and keeps this plan in its own. It still
shares `docs/platform/workflow/spec.md` and `docs/platform/runner/spec.md` with this plan and many host files with
the doors plan, so it runs after them, not beside them. The other two waits are real file collisions and stay.

**Why it first waited:** two plans that were running when it was written owned files this plan must change.
- `261118-1341-s6a-execution-tier-rust` owns `docs/architecture-manifest.json`, `test/architecture.test.mjs`,
  `src/setup/**`, `test/setup/**`, `src/runner/dispatch/**`, `docs/reading-map.md`,
  `docs/platform/component-boundary.md`, `docs/platform/runner/**` and `docs/platform/seat-binding/spec.md`. It edits
  the door rows that phase 2 moves, so moving them first would fork the manifest.
- `261120-0625-work-data-model` owns `plans/*/plan.md` (every plan file), `AGENTS.md`, `docs/reading-map.md`,
  `docs/explanation/core-foundation-domain-boundary.md`, `docs/platform/architecture-map.md`,
  `docs/platform/system-overview/spec.md` and `docs/platform/documentation/subcomponents/document-identity/spec.md`.

When both are `done`, a planner wake does three things: refreshes `base`, re-reads the manifest (s6a retires some
door debt, which phase 2 then moves as it stands), and runs the check. If the check passes, it sets `status: ready`.
Phase 1 touches only new files, `docs/platform/README.md` and `docs/reading-map.md`, and is the first to start.

## Owner questions

None. Every product decision is locked (CA-D1..CA-D5, owner rounds 1-12). The planner settled these shape
choices from the evidence and reports them here instead of asking:
- The model lives at `packages/component-authority/model/`, with one JSON file per row kind and one file per
  door under `doors/`. A single file would make every plan that adds a file or door collide on one hot file.
- Layer and tier are taken from a component's `paths`, with per-path exceptions that carry a reason (discussion
  §6, "tầng suy từ thành phần").
- Whole-model invariants are checked in `npm test`, because they are rules about this repo's own files
  (AGENTS.md install gate). The views are generated by a Node script with `--check`, the same shape as
  `decision-index`.

## Risks and rollback

- **Migration silently drops a check.** Phase 2 moves the data and keeps every current
  `test/architecture.test.mjs` case. Its verify compares the test count and pass list before and after.
  Proof point for validating: the same `node --test` names pass.
- **Layer derived from components disagrees with today's per-file layer.** Phase 3 adds exceptions with
  reasons rather than changing any file's layer. Its verify proves that every file's derived layer and tier
  equal the phase 2 values.
- **Contract provider attribution is wrong.** Provider is taken from the containing `packages/<pkg>` or
  `docs/platform/<area>`. Any row with a different provider must say why.
- **Sibling plan waits on three running plans** (`261118-1341-s6a-execution-tier-rust`,
  `261120-0625-work-data-model`, `261121-1309-git-windows-custody`; and `261121-1456-windows-ci-packaging-reds`
  for `Cargo.toml`). Until it lands, a door can still be copied under a new name. This plan does not make that
  worse.
- **Rollback:** each phase is one commit on its own branch. Revert phase commits in reverse wave order. Before
  phase 7 lands, reverting phase 2 restores the manifest.

## Outstanding questions

None.
