---
contract: plan-v1
title: "Component authority: one structural model of layers, components, decision kinds, doors, contracts and files, with generated human views"
status: running
lead: head:lead-forgent-261121-2109-compon-8ee21
priority: P1
blockedBy: []
base: 4d91f3043c0006dcc85b0bf2bffab4d9b96752f3
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
  - docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md
  - docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md
  - docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md
  - docs/platform/domainization/architecture/domainization.md
  - docs/platform/proposals/README.md
  - docs/platform/proposals/step-09-group-thinking-substrate.md
  - docs/platform/proposals/documentation-system-unification.md
  - docs/platform/proposals/step-10-coding-domain-adoption.md
  - docs/platform/agent-coordination/proposals/README.md
  - docs/platform/system-architecture/architecture/roadmap.md
  - docs/platform/system-architecture/architecture/architecture-intent.md
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

## Facts (prior art, written 2026-11-21 at bf061ff35, refreshed 2026-11-22 at 8a7839d38, re-checked at 27fd8a9b0)

- `docs/architecture-manifest.json` (since 7349a52bc): keys `contract`, `map`, `layers` (5), `rules` (3:
  `one-directional-layer`, `domain-siloing`, `tier-downward`), `components` (1: `packaging-distribution`),
  `domains` (3), `tierNames`, `tiers` (44 prefixes), `tierExceptions` (0), `doors` (83 rows, fields `job`,
  `kind`, `patterns`, `allowed`, `debt`, `reason`, `retiredBy`; 320 allowed entries; 75 debt entries in 22
  rows), `files` (325 file-to-layer rows). At bf061ff35 it had 78 door rows, 76 debt entries and 344 files;
  the s6a and work-data-model plans changed it since, and phase 2 copies it as it stands. It is unchanged between
  8a7839d38 and 27fd8a9b0.
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
2. `docs/architecture-manifest.json` does not exist, and every manifest change that landed between phase 2's copy
   and phase 7's deletion is in the model (phase 7's report lists them). `node --test test/architecture.test.mjs`
   is green on the model. Every `.mjs` under `src/` and `bin/` resolves to exactly one component. `rg -l architecture-manifest.json`
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
| 1 | [Spec, model schema and the self row](phase-01-spec-and-schema.md) | - | docs/platform/component-authority/spec.md, packages/component-authority/contracts/model.v1.json, packages/component-authority/model/components.json, docs/platform/README.md, docs/reading-map.md | 1 | done |
| 2 | [Copy the manifest into the model and move its readers](phase-02-model-migration.md) | 1 | packages/component-authority/model/layers.json, packages/component-authority/model/tiers.json, packages/component-authority/model/files.json, packages/component-authority/model/doors/, packages/component-authority/model/components.json, test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, src/verbs/merge/iron-law-level.mjs, src/runner/dispatch/execution-contract.mjs, scripts/install-git-hooks.mjs, core/instructions/design-principles.md, AGENTS.md, docs/reading-map.md, docs/explanation/core-foundation-domain-boundary.md, docs/explanation/herdr-spawn-adapter-fresh-pane.md, docs/platform/vision.md, docs/platform/runner/spec.md, docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md, docs/platform/seat-binding/spec.md, docs/platform/agent-mailbox/spec.md, docs/platform/secrets/spec.md, docs/platform/work-state/spec.md, docs/platform/host-invocation-routing/spec.md, docs/platform/write-scope/spec.md, docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md, docs/platform/governance.md, docs/platform/architecture-map.md, docs/platform/component-boundary.md | 2 | done |
| 3 | [Component and decision-kind rows; layer and tier from components](phase-03-components-and-decision-kinds.md) | 2 | packages/component-authority/model/components.json, packages/component-authority/model/decision-kinds.json, packages/component-authority/model/files.json, packages/component-authority/model/tiers.json, test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, test/component-authority/components.test.mjs | 3 | done |
| 4 | [Contract index](phase-04-contract-index.md) | 3 | packages/component-authority/model/contracts.json, test/component-authority/contracts.test.mjs | 4 | done |
| 5 | [Generated ownership views and decision-index on the model](phase-05-ownership-views.md) | 3 | scripts/component-authority-render.mjs, test/component-authority/render.test.mjs, src/report/decision-index.mjs, test/report/decision-index.test.mjs, docs/platform/component-boundary.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 4 | running |
| 6 | [Architecture-map registries generated; proposal map retired](phase-06-architecture-map-views.md) | 4, 5 | scripts/component-authority-render.mjs, test/component-authority/render.test.mjs, docs/platform/architecture-map.md, docs/platform/proposals/component-authority-boundary-map.md, docs/platform/component-authority/spec.md, docs/platform/proposals/README.md, docs/platform/proposals/step-09-group-thinking-substrate.md, docs/platform/proposals/documentation-system-unification.md, docs/platform/proposals/step-10-coding-domain-adoption.md, docs/platform/agent-coordination/proposals/README.md, docs/platform/system-architecture/architecture/roadmap.md, docs/platform/system-architecture/architecture/architecture-intent.md | 5 | done |
| 7 | [Retire the manifest and integrate](phase-07-integration.md) | 6 | docs/architecture-manifest.json, docs/platform/packaging-distribution/contracts/setup-doctor-registry.md, packages/component-authority/model/, docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md, docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md, docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md, docs/platform/domainization/architecture/domainization.md, plans/261121-2109-component-authority/ | 6 | running |


## Progress

Phase status in the table above is the bare contract value; the detail lives here.

- Phase 1: done: landed 07971a3e5 (unit c-1441, review fixes c-3520, citation-drift fix c-5775; land c-6766)
- Phase 2: done: landed 07493b986 (unit c-7239, review fixes c-15048, land c-16622). Copy anchor: manifest blob 1f294728e (reports/copy-point.md). Same 87 architecture test names pass
- Phase 3: done: landed b7744e074 from branch component-authority/p03b (units c-16989 timed out, c-25759 data fixes, c-27737 carry-over plus loader fixes; land c-29713). 70 components, 9 decision kinds, 86 exceptions; derived layer and tier equal phase 2 for all 325 files. Old worktree ../forgent-worktrees/261121-2109-component-authority-p03 handed to the supervisor (event 7f34a492f3c8fcdc)
- Phase 4: done: landed fc277aa8e (units c-30213 gemini quota, c-32984 xai, review fixes c-42575; land c-44152). 157 rows, 13 CTR; live and designed rows name existing files; 7 rows carry a provider reason. Note: the fix commit message names a phase number, against the stable-artifact rule; it cannot be reworded after the land
- Phase 5: parked on DOCOS (owner question q-4lmw3q6la7): landed 9486a7d80; every view is generated except the governance holder table, whose preview is reports/holder-view-preview.md. When DOCOS answers, one unit swaps the hand-written table for the generated block (the renderer already supports the view) and phase 5 is done
- Phase 6: done: views landed 507318599 (units c-49933, c-51310, c-54322), proposal map retired 815708ca4 (units c-55838 refused by the doc check, c-57066; land c-57444). reports/proposal-map-coverage.md ends with no clause left; every live mention of the deleted file pins its last commit e0d208e38
- Phase 7: running: no longer waits on heads-stable (owner orders 23:21 and 00:06, recorded below). Port from the manifest blob 1f294728e (reports/copy-point.md)

**Lead notes (2026-11-23, head:lead-forgent-261121-2109-compon-8ee21):**
- Phase 1: the citation-drift gate (decision 0017) refuses `CA-D<n>` tokens in prose, so the spec cites CA-D1..CA-D5 in
  its fenced header and names the decisions in words in its body (same shape as `docs/platform/questions/spec.md`).
- Phase 2 review: `layers.json` keeps the `contract` stamp but drops `map`, because `$defs/layers` does not allow it.
  `component-authority` is now an allowed instruction owner, next to `packaging-distribution`.
- Footprint gap for phase 7: four live docs still name the manifest and are in no phase's write list nor in the plan
  footprint: `docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md`,
  `docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md`,
  `docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md`,
  `docs/platform/domainization/architecture/domainization.md`. Acceptance criterion 2 needs them swept before phase 7
  ends. The lead cannot widen the footprint; raised to the supervisor.
- Footprint widened (2026-11-23 01:40, head:supervisor-forgent): the four docs above joined the plan footprint and
  phase 7's write list. Acceptance criterion 2 already requires them swept, so this stays inside the approved frame;
  no running or ready plan lists them.
- Footprint widened (2026-11-23 03:45, head:supervisor-forgent, event 9a7601026705e4c9): retiring the proposal map in
  phase 6 breaks links in seven docs, which joined the plan footprint and phase 6's write list:
  `docs/platform/proposals/README.md`, `docs/platform/proposals/step-09-group-thinking-substrate.md`, `docs/platform/proposals/documentation-system-unification.md`, `docs/platform/proposals/step-10-coding-domain-adoption.md`, `docs/platform/agent-coordination/proposals/README.md`, `docs/platform/system-architecture/architecture/roadmap.md`, `docs/platform/system-architecture/architecture/architecture-intent.md`.
  The link fixes follow from a deletion the approved plan already makes, so this stays inside the approved frame; no
  running or ready plan lists them.

Phases are layered (one model, one test file), so most of the plan runs serially. Phases 4 and 5 run in
parallel in wave 4. Hot files: `components.json` has one writer per wave (phase 1, then phase 2, then phase 3).
`test/architecture.test.mjs` is written by phase 2, then phase 3. `scripts/component-authority-render.mjs` is
written by phase 5, then phase 6. The generated views are regenerated and never merged by hand. Phase 2
touches `governance.md`, `architecture-map.md` and `component-boundary.md` only to change the manifest
mention; phases 5 and 6 then replace their registry sections with generated blocks. Only phase 7 writes
`docs/architecture-manifest.json` and `setup-doctor-registry.md`, and it starts when phase 6 has landed, without
waiting for `261122-0118-heads-stable-and-able` (see the 2026-11-23 note below).

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

**Owner order (2026-11-22 23:25, via the secretary, recorded by head:supervisor-forgent):** `261122-1950-owner-communication-standard`
is low priority and blocks nothing, so it left `blockedBy`. Its four shared files (`AGENTS.md`, `docs/reading-map.md`,
`docs/platform/agent-mailbox/spec.md`, `docs/platform/observe/spec.md`) are now kept apart by admission alone: whichever
of the two runs, the other waits for it.

**Owner order (2026-11-22 23:19, via the secretary, option c, recorded by head:supervisor-forgent):** start this
plan now, without waiting for `261122-0118-heads-stable-and-able`. Its edits to the two files it shares with
heads-stable (`docs/architecture-manifest.json` and
`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`) move to its last phase. For the planner
(`head:planner-component-authority`, started for this): reshape so phase 2 copies the manifest into the model without
deleting it or touching the registry contract, and the manifest deletion plus both file edits move to phase 7, which
also waits for heads-stable to be `done`. Then drop heads-stable from `blockedBy`, run the plan-contract check and
set `ready`. Heads-stable's open phases (8-11) write neither file, but its plan-level footprint still lists both, so
admission may still report an overlap; the planner says in its report whether the check accepts this or what remains.

**Reshaped (2026-11-22, planner wake, for the 23:19 order):** phase 2 now copies the manifest into the model,
moves both readers to the model and points every live mention at it, but leaves the manifest and
`setup-doctor-registry.md` untouched. Phase 2 also writes a comparison script (`reports/manifest-model-compare.mjs`)
and records its commit as the copy point. Phase 7 now waits for heads-stable to be `done`. It then ports any manifest
change that landed after the copy point, deletes the manifest, fixes the one registry row at
`setup-doctor-registry.md:164`, and runs the integration gate. `blockedBy` is now empty: s6a and work-data-model are
`done`, and heads-stable left by the order. `base` moved to 27fd8a9b0. The plan-level footprint still lists both
shared files because phase 7 writes them.

The check passes as `draft`. As `ready` it refuses with two cross-plan overlap errors, so the plan stays `draft`:
- `261122-0118-heads-stable-and-able` (running): its plan-level footprint still lists
  `docs/architecture-manifest.json` and `setup-doctor-registry.md`, although its open phases write neither. The fix
  belongs to that plan: its supervisor narrows its footprint to drop the two files. This plan cannot drop them,
  because phase 7 writes them.
- `261122-1950-owner-communication-standard` (ready): the check does not let two active plans share
  `AGENTS.md`, `docs/reading-map.md`, `docs/platform/agent-mailbox/spec.md` and `docs/platform/observe/spec.md`, so
  "kept apart by admission alone" (23:25 order) does not hold while both are `ready`. Phases 1, 2 and 5 write those
  files. Following the owner's order (this plan first, that one low priority), the fix is for that plan to list this
  one in its `blockedBy`, or go back to `draft`.
When both are fixed, re-run the check and set `status: ready`. The planner or supervisor does this, and it needs no
further owner question.

**Set ready (2026-11-23 00:12, head:supervisor-forgent, owner order 00:15 via Miu):** heads-stable narrowed its footprint
(`9fc5261af`); `261122-1950-owner-communication-standard` already lists this plan in its `blockedBy`. The land door's
plan check decides the transition.

**Phase 7 wait dropped (2026-11-23 04:27, head:lead-forgent-261121-2109-compon-8ee21, on lead:SUPERVISOR's
instruction):** the "phase 7 waits for heads-stable to be `done`" rule in the reshape note above no longer holds. The
owner replaced option c at 23:21 (Miu mail 9e491a48: "no waiting on heads-stable at all; admit including the two shared
files") and repeated it at 00:06 ("heads-stable never gates component-authority"). heads-stable dropped both shared
files from its footprint at 00:07 (9fc5261af). Phase 7 starts now and ports any later manifest change.

**Why it first waited (history):** two plans that were running when it was written owned files this plan must change.
- `261118-1341-s6a-execution-tier-rust` owns `docs/architecture-manifest.json`, `test/architecture.test.mjs`,
  `src/setup/**`, `test/setup/**`, `src/runner/dispatch/**`, `docs/reading-map.md`,
  `docs/platform/component-boundary.md`, `docs/platform/runner/**` and `docs/platform/seat-binding/spec.md`. It edits
  the door rows that phase 2 moves, so moving them first would fork the manifest.
- `261120-0625-work-data-model` owns `plans/*/plan.md` (every plan file), `AGENTS.md`, `docs/reading-map.md`,
  `docs/explanation/core-foundation-domain-boundary.md`, `docs/platform/architecture-map.md`,
  `docs/platform/system-overview/spec.md` and `docs/platform/documentation/subcomponents/document-identity/spec.md`.

Both are `done` now. Phase 1 touches only new files, `docs/platform/README.md` and `docs/reading-map.md`, and is
the first to start.

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
- **The manifest changes after the copy and the change is lost.** Between phase 2 and phase 7 nothing reads the
  manifest, so a heads-stable edit to it would be untested and then deleted. Phase 2 points every instruction at the
  model, so new rows go there. Phase 7 ports every manifest commit after the copy point before deleting the file, and
  lists them in its report. Proof point for validating: phase 7's ported-change list against
  `git log <copy point>..HEAD -- docs/architecture-manifest.json`.
- **Contract provider attribution is wrong.** Provider is taken from the containing `packages/<pkg>` or
  `docs/platform/<area>`. Any row with a different provider must say why.
- **Sibling plan waits on three running plans** (`261118-1341-s6a-execution-tier-rust`,
  `261120-0625-work-data-model`, `261121-1309-git-windows-custody`; and `261121-1456-windows-ci-packaging-reds`
  for `Cargo.toml`). Until it lands, a door can still be copied under a new name. This plan does not make that
  worse.
- **Rollback:** each phase is one commit on its own branch. Revert phase commits in reverse wave order. The manifest
  exists until phase 7, so reverting phase 2 alone restores the old readers.

## Outstanding questions

None.
