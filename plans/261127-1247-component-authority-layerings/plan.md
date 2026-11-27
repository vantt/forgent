---
contract: plan-v1
title: "Component authority declares four layerings as data, with fixed rule kinds in code"
description: "Step A of CAS-D5: the model declares hexagon, stack, orchestration-ring and domain-scope with their definitions; layering values sit on component rows under the layering id; the architecture checks run per fixed rule kind (order-downward, isolation, port-wiring) read from the model; no hardcoded layer or tier list remains."
status: ready
priority: P2
blockedBy: []
base: 25f849e9d001553a9ade2883704fa1b51cea8b43
source:
  - plans/discussions/ds-zfqskcns7j-component-authority-scope-and-levels/DISCUSSION.md
  - p-adv35azsca
created: 2026-11-27
footprint:
  - plans/261127-1247-component-authority-layerings/**
  - docs/platform/component-authority/spec.md
  - packages/component-authority/model/layers.yaml
  - packages/component-authority/model/components.yaml
  - packages/component-authority/model/contracts.yaml
  - packages/component-authority/contracts/model.v1.json
  - packages/component-authority/rust/src/**
  - packages/component-authority/rust/tests/**
  - test/architecture.test.mjs
  - test/report/decision-index.test.mjs
  - docs/platform/component-boundary.md
  - docs/platform/architecture-map.md
  - docs/platform/README.md
  - docs/platform/governance.md
  - docs/platform/system-overview/spec.md
  - docs/platform/observe/spec.md
  - docs/platform/workflow/spec.md
  - docs/platform/vision.md
  - CHANGELOG.md
---

# Component authority declares four layerings

Mode: standard (cross-module model and schema change, one shared data file, no runtime behaviour change outside checks and the model reader).

## Outcome

`packages/component-authority/model/layers.yaml` declares four layerings, `hexagon`, `stack`,
`orchestration-ring` and `domain-scope`, each with `id`, `aliases`, `questions`, `meaning`,
`granularity`, `distinctFrom`, `values` (each with its own `meaning`), `rules` and `source`
(CAS-D8). Every component row carries its value for each declared layering under a field named
after the layering (`hexagon`, `stack`, `orchestration-ring`); path-level departures sit in the
component's existing `exceptions` (CAS-D9, CAS-D10). The schema, the Rust crate and the Node
architecture test read the value lists from the model; no list of layer names or tier range is
written in code. The architecture checks run through three rule kinds fixed in code,
`order-downward`, `isolation` and `port-wiring`, chosen per layering by its `rules` (CAS-D5).
The hand-written layering guards (A4 Work-layer, "lower tiers do not import Dispatch") are
folded into the layering that owns them. T7 and T8 are swapped (`T7-domain`, `T8-work`,
CAS-D13). The prose that used the old vocabulary is corrected and the layering definitions are
rendered into `architecture-map.md` §3 from the model.

## Acceptance criteria

1. `layers.yaml` declares the four layerings with every CAS-D8 field, and every value has a
   non-empty `meaning`; checked by a Rust model test in
   `packages/component-authority/rust/tests/model_checks.rs` (`cargo test -p component-authority`).
2. Every component row carries `hexagon`, `stack` and `orchestration-ring`; `layer`, `tier`,
   `tierNames`, `tierExceptions`, top-level `layers` and `rules` are gone from the model and
   schema. `rg -n "LAYER_NAMES|TIER_RANGE|\"entry\", \"use-case\"" packages/component-authority/rust/src packages/component-authority/contracts`
   prints nothing.
3. Each rule kind has one fixture violation that its check catches, in `test/architecture.test.mjs`;
   the A4 Work-layer guard and the "lower tiers do not import Dispatch" guard run as
   `orchestration-ring` and `stack` `order-downward` (the old hand lists `WORK_LAYER_MODULES`
   and the `lower` directory list are deleted).
4. `runner` declares its hexagon departures by path in `exceptions`; ports are declared on the
   contract index (`contracts.yaml`), not guessed from file names; components not yet split
   are listed as named debt.
5. `npm test` and `cargo test --workspace` green on the integrated tree.
6. `docs/platform/component-boundary.md` §4 (module = packaging unit, CAS-D1),
   `docs/platform/architecture-map.md` §3 (rendered layering definitions) and
   `docs/platform/vision.md` §6 Known gaps use the new vocabulary; `fgos authority render --check`
   reports no drift.
7. `work-state`, `runner` and its subcomponents, and `supervision` carry `stack: T8-work`; the
   Domain rows (`domain-components`, `coding-domain`, `group-thinking`, `domain-registry-loader`,
   `enduser-docs-*`) carry `stack: T7-domain`; the vision.md §6 Known gap about the Work and
   Domain order is closed (CAS-D13).

## Non-goals

- Step B: `fgos authority check` owning the checks (CAS-D5 "B sau"); the checks stay in
  `test/architecture.test.mjs`.
- Q2 of the discussion: what component-authority owns, the hash ids of `runner` subcomponents,
  `paths: []` of `domain-components`, `coding-domain`, `group-thinking`, and the `supervision`
  crates that no component maps.
- Splitting every mixed-role component (CAS-D10 "áp dần"); only `runner` is split now, the rest
  is named debt.
- `fromLayering` (dropped, CAS-D12); a general rule interpreter (RUL104).
- Renaming "module" in `core/instructions/design-principles.md` (left open in the discussion, §3 row 7).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Layering definitions in `layers.yaml` (`layerings` rows) and their schema def | component-authority | `fgos authority locate "the model declares each layering with its definition, values and rule kinds"` → `component-authority`. Replaces `layers`, `rules`, `tierNames`; survivor: `layerings`; retired: `layers.yaml` `layers`, `rules`, `tierNames`, `tierExceptions`. |
| Layering value fields on component rows (`hexagon`, `stack`, `orchestration-ring`) | component-authority | survivor: field named after the layering; retired: component fields `layer`, `tier` and exception fields `layer`, `tier`. |
| Three rule kinds `order-downward`, `isolation`, `port-wiring` | component-authority | Checks live in `test/architecture.test.mjs` (CAS-D5 step A). survivor: one function per rule kind; retired: the import-one-way test, the two tier tests, the domain-siloing loop, the "lower tiers do not import Dispatch" test, the A4 `WORK_LAYER_MODULES` reach guard. |
| Port declaration on a contract-index row (`port: {kind, implementers}`) | component-authority | Extends the contract index the crate already owns (CAS-D10). No new row kind. |
| Named debt of a layering (components not yet split) | component-authority | A `debt` list on the layering row (component id, reason, owning backlog row). Planner decision, see Risks. |
| Rendered view `architecture-map-layerings` | component-authority | New view in the existing render door (`render.rs`), same markers contract. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Spec first](phase-01-spec-first.md) | - | docs/platform/component-authority/spec.md | 1 | ready |
| 2 | [Layerings in the model, fields renamed](phase-02-layerings-in-the-model.md) | 1 | packages/component-authority/model/layers.yaml, packages/component-authority/model/components.yaml, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/src/, packages/component-authority/rust/tests/, test/architecture.test.mjs, test/report/decision-index.test.mjs, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 2 | ready |
| 3 | [Rule kinds in code](phase-03-rule-kinds-in-code.md) | 2 | test/architecture.test.mjs | 3 | ready |
| 4 | [Hexagon by CAS-D4 and ports](phase-04-hexagon-and-ports.md) | 2, 3 | packages/component-authority/model/layers.yaml, packages/component-authority/model/components.yaml, packages/component-authority/model/contracts.yaml, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 4 | ready |
| 5 | [Orchestration ring and folded guards](phase-05-orchestration-ring.md) | 3, 4 | packages/component-authority/model/layers.yaml, packages/component-authority/model/components.yaml, test/architecture.test.mjs, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 5 | ready |
| 6 | [Rendered definitions and prose](phase-06-rendered-definitions-and-prose.md) | 5 | packages/component-authority/rust/src/render.rs, docs/platform/architecture-map.md, docs/platform/component-boundary.md, docs/platform/vision.md | 6 | ready |
| 7 | [Integrate](phase-07-integrate.md) | 6 | CHANGELOG.md, plans/261127-1247-component-authority-layerings/reports/ | 7 | ready |

The waves are serial because `components.yaml`, `layers.yaml`, `test/architecture.test.mjs`
and the rendered docs are hot files that four phases must write in turn; each phase leaves
`npm test` and `cargo test --workspace` green on its own, so the gate holds on a tree with only
the first phases landed. Contract check: `node scripts/plan-contract-check.mjs --plan
plans/261127-1247-component-authority-layerings`; footprint check: `fgos resource-check --plan
plans/261127-1247-component-authority-layerings`.

Prior art reused: the component `exceptions` field (84 lines on 14 components) carries the
path departures, so no second exception store is added and `tierExceptions` (0 lines) is
deleted (CAS-D9); the render door and its markers carry the new view; the contract index
carries ports; the Node import lexers (`scripts/lib/js-source-lexer.mjs`) stay the edge source.

## Owner questions

None. Every decision this plan needs is locked in CAS-D1 to CAS-D13; the one gap (where named
debt lives) is decided below under Risks, inside the approved frame ("phần chưa tách ghi nợ có
tên", hand-off non-goals).

## Risks and rollback

- **Field rename breaks other projects' models.** Projects with `.fgos/authority/model/` that
  wrote `layer`/`tier` rows fail to load after the rename. The loader refuses an old field by
  name with a message that names the new field (no compatibility reader, L10); CHANGELOG says
  so (phase 7). The empty model a new project starts from declares no layering, so a project
  without layerings needs no layering fields.
- **Re-ranking `hexagon` by CAS-D4 surfaces many violations** (infra moves to the bottom;
  `runner`, `workflow`, `execution-core` are infra today). Phase 4 measures first, reassigns
  defaults, writes `runner` exceptions, and records every other component whose code still
  breaks `port-wiring` as named debt on the layering (`debt` list: component, reason, backlog
  row). Proof point for validating: the phase-4 measure report lists the violation count before
  and after.
- **Named debt location is a planner decision**: a `debt` list on the layering row, not on the
  component, because debt is "this component does not yet meet this layering's rules". If the
  validating reviewer rejects it, the alternative is a backlog row per component with no model
  field; the check then cannot skip them and phase 4 would have to keep `port-wiring` off.
- **Ring values need judgment on 87 rows**; `stack` cross-check catches a reversed pair.
- **Rollback**: each phase is one commit series on its own branch; revert the phase's merge
  commits in reverse order. Phase 2 is the only one that changes the model's shape; reverting it
  restores `layer`/`tier`.

## Outstanding questions

None
