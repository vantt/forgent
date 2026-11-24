---
contract: plan-v1
title: "The component authority model owns the documentation code that locate added"
description: "Map every file the locate door added to a component authority row through fgos authority declare, resolve the documentation row's mustNotOwn conflict, and render the boundary views from the model."
status: draft
priority: P1
effort: 6h
branch: main
tags: [documentation, document-identity, component-authority]
created: 2026-11-24
blockedBy: []
source:
  - p-jz2d2oid2m
footprint:
  - plans/261124-0837-docos-documentation-in-component-authority/**
  - packages/component-authority/model/**
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

| # | Phase | Status |
|---|---|---|
| 1 | [Inventory and conflicts](phase-01-inventory-and-conflicts.md) | todo |
| 2 | [Declare the rows](phase-02-declare-the-rows.md) | todo |
| 3 | [Render and land](phase-03-render-and-land.md) | todo |

## Acceptance criteria

1. `fgos authority locate` names `document-identity` for each path in F5 that is a repository file.
2. `fgos authority render --check` passes; `node scripts/run-tests.mjs test/architecture.test.mjs` passes.
3. `component-boundary.md` and the other views carry the locate rows only through `fgos authority render`.
4. The `mustNotOwn` conflict is resolved in the model with the reason recorded, or asked of the owner in the
   decision-question template when the model's rules leave a real choice.

## Risks

- `fgos authority declare` may refuse a move or ask for `--approved-by`: phase 2 stops there and asks.
- The other lead's phases rewrite the same files: rebase before each land, land serially, message that lead first.

## Component boundary

This plan is the boundary change itself; the rendered views are its record.

## Rollback

Revert the model commit and render again.
