---
contract: plan-v1
title: "The component authority model owns the documentation code that locate added"
description: "Map every file the locate door added to a component authority row through fgos authority declare, resolve the documentation row's mustNotOwn conflict, and render the boundary views from the model."
status: done
priority: P1
effort: 6h
branch: main
tags: [documentation, document-identity, component-authority]
created: 2026-11-24
blockedBy:
  - 261121-2110-component-authority-doors
base: 704c89b7a3f1ef3ab8b2230ae40b96ce782a142f
source:
  - p-jz2d2oid2m
footprint:
  - plans/261124-0837-docos-documentation-in-component-authority/**
  - packages/component-authority/model/components.yaml
  - docs/platform/component-boundary.md
  - docs/platform/architecture-map.md
  - docs/platform/system-overview/spec.md
  - docs/platform/README.md
  - docs/platform/governance.md
  - docs/platform/documentation/spec.md
  - docs/platform/documentation/subcomponents/document-identity/spec.md
---

# The component authority model owns the documentation code that locate added

## Outcome

`fgos authority locate` answers `document-identity` for every file the locate door added, and the views rendered
from the model (`component-boundary.md`, architecture map sections 6 and 7, the system overview's area map and shared
entities, the platform README owner table, the governance holder table) say who owns the locate port, the pkm adapter,
the `fgos doc locate` and `fgos doc index` verbs, the index worker and its cache. Nothing in those views is edited by
hand.

Authority: [component-authority spec](../../docs/platform/component-authority/spec.md) section 5 (the model is the
single source; the views are generated) and the `fgos authority` verb.

## Non-goals

- No change to locate's behaviour or to the component-authority code. A defect found in `fgos authority` becomes its
  own item for the component-authority lead, never a local workaround.
- No new component: document identity already has a row.

## Facts (checked 2026-11-24)

| # | Fact | Evidence |
|---|---|---|
| F1 | No model row maps `packages/documentation/`; `fgos authority locate` on the locate code matches only the parent `documentation` by name | `packages/component-authority/model/components.yaml`; `fgos authority locate` output |
| F2 | `document-identity`: `status: designed`, paths `docs/platform/documentation/subcomponents/document-identity/` only | `components.yaml` line ~1137 |
| F3 | `documentation`: `mustNotOwn: [runtime state mutation, code execution]`, paths docs only | `components.yaml` line ~1072 |
| F4 | Other areas map their Rust crates as paths of their row (`packages/git/rust/`, `packages/observe/rust/`, ...) | `components.yaml` |
| F5 | Locate added: `packages/documentation/**` (crate, `third-party/pkm/`), `apps/fgos/src/wiring/doc_locate.rs`, `apps/fgos/src/wiring/doctor/documentation.rs`, `core/config-standard/docLocate.yaml`, `core/config-schema/docLocate.schema.yaml`, the Observe kind `fgos.doc.locate`, the worker (`fgos doc index run`, started through the process door), the cache `.fgos/runtime/doc-locate/` and the machine model folder | locate plan footprint and phase "As built" notes |
| F6 | The plan `component-authority-doors` (another lead) is landing phases on the same model files | `git log origin/main` (`land component-authority-doors/p02a-fix2`) |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Inventory and conflicts](phase-01-inventory-and-conflicts.md) | - | plans/261124-0837-docos-documentation-in-component-authority/phase-01-inventory-and-conflicts.md | 1 | done |
| 2 | [Declare the rows](phase-02-declare-the-rows.md) | 1 | packages/component-authority/model/components.yaml | 2 | done |
| 3 | [Render and land](phase-03-render-and-land.md) | 2 | docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/system-overview/spec.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/documentation/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md | 3 | done |

The phases run in series: each needs the one before it. Footprint check (`node scripts/plan-contract-check.mjs`
and `fgos resource-check --plan`, 2026-11-24): no two phases share a file. The declare verb writes a component row
into `components.yaml` only, so the plan no longer claims all of `packages/component-authority/model/**`. That also
keeps it clear of plan `261124-0004-heads-operate-without-owner`, whose footprint holds three files under
`model/doors/`; this plan reads those door files when it renders but never writes them.

Cross-plan overlap: phase 3 regenerates five views that the running plan `261121-2110-component-authority-doors`
also regenerates (`component-boundary.md`, `architecture-map.md`, `system-overview/spec.md`, `docs/platform/README.md`,
`governance.md`). Both plans must write them, because each render rewrites the whole view from the model, so this
plan is `blockedBy` that plan rather than narrowed.

## Acceptance criteria

1. `fgos authority locate` names `document-identity` for each path in F5 that is a repository file.
2. `fgos authority render --check` passes; `node scripts/run-tests.mjs test/architecture.test.mjs` passes.
3. `component-boundary.md` and the other views carry the locate rows only through `fgos authority render`.
4. The `mustNotOwn` conflict is resolved in the model with the reason recorded, or asked of the owner in the
   decision-question template when the model's rules leave a real choice.

## Authority map

Every path this plan maps goes to rows the model already has (checked with `fgos authority locate`, 2026-11-24); no
new row is declared.

| New thing | Model row | Note |
|---|---|---|
| Locate crate, pkm adapter, `fgos doc locate` and `fgos doc index` wiring, index worker, cache, `docLocate` config | `document-identity` | Paths and owns are added to the existing row (phase 2); status moves from designed to live |
| The parent's `mustNotOwn` conflict | `documentation` | Resolved in phase 2 step 3 or asked of the owner |
| The declare and render doors this plan writes through | `component-authority` | Used as they are; a defect becomes an item for that lead |

## Owner questions

None open. Phase 1 found that `fgos authority declare` could not update an existing component; the owner chose an
update path in the declare verb, and `fgos authority declare --update` now exists (`fgos authority declare --help`,
2026-11-24). Phase 2 uses it. Phase 2 step 3 asks the owner only if the parent's `mustNotOwn` list must change.

## Risks

- `fgos authority declare` may refuse a move or ask for `--approved-by`: phase 2 stops there and asks.
- The component-authority-doors plan rewrites the same views: this plan waits for it through `blockedBy`, then renders
  once on top of its result.

## Component boundary

This plan is the boundary change itself; the rendered views are its record.

## Rollback

Revert the model commit and render again.
