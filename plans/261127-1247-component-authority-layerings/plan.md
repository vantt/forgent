---
contract: plan-v1
title: "Component authority declares four layerings as data, with fixed rule kinds in code"
description: "Step A of CAS-D5 against CAS-D1..D26: the model declares hexagon, stack, orchestration-ring and domain-scope with their definitions; values sit on component rows; the checks run per fixed rule kind read from the model, measured before they block; ownerless and retired rows are cleaned; decision kinds give way to component rows; architecture-map renders the layerings and every row has a summary; no hardcoded layer or tier list remains."
status: draft
priority: P2
blockedBy: []
base: 89a347aeab781be7070386e1992a03b3110f2d07
source:
  - plans/discussions/ds-zfqskcns7j-component-authority-scope-and-levels/DISCUSSION.md
  - p-adv35azsca
created: 2026-11-27
footprint:
  - plans/261127-1247-component-authority-layerings/**
  - docs/platform/component-authority/spec.md
  - packages/component-authority/model/**
  - packages/component-authority/contracts/model.v1.json
  - packages/component-authority/rust/src/**
  - packages/component-authority/rust/tests/**
  - apps/fgos/tests/authority.rs
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
  - changelog.d/261127-1247-component-authority-layerings.md
  - apps/fgos/src/wiring/authority.rs
  - src/report/decision-index.mjs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - core/instructions/design-principles.md
  - core/instructions/ready-plan-runs-unattended.md
  - core/skills/_shared/plan-contract.md
  - core/skills/fgos-shaping/SKILL.md
  - domains/coding/skills/fgos-coding-implement/SKILL.md
  - AGENTS.md
  - .fgos/instructions/effective/rules.json
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - docs/reading-map.md
  - docs/decisions/index.md
---

# Component authority declares four layerings

Mode: standard (cross-module model and schema change, hot shared data files, no runtime
behaviour change outside the model reader, the declare and locate doors, and the checks).

Re-planned 2026-11-28 against CAS-D1..D24 (owner answer `q-to4kq6l5bw` = A). The first version
was written from CAS-D1..D13. Phase 1's branch `component-authority-layerings/p01` (123eaf5f07,
reviewed, not landed) is reused: phase 1 amends it for CAS-D14..D24 instead of starting over.
The decisions that replace earlier ones are applied as the discussion orders them: CAS-D15 keeps
only its parts (1) definition, (2) `T8-delivery` and (3) `sameAs`; CAS-D16 sets the ring values
and `source: declared`; CAS-D12 stands (no `fromLayering`); CAS-D22 replaces the `work-driver`
parts of CAS-D15 and CAS-D19.

Amended 2026-11-28 15:50 for CAS-D25 and CAS-D26, which the discussion settled after the
re-plan. CAS-D25 is the new phase 10. It runs between phases 2 and 3 and is numbered 10 so the
other phase numbers stay as they were. CAS-D26's step-A part goes into phase 2 (the `summary`
field), phase 3 (a summary on every row) and phase 8 (the layering render layout and the
reading path).

## Outcome

`packages/component-authority/model/layers.yaml` declares four layerings, `hexagon`, `stack`,
`orchestration-ring` and `domain-scope`, each with the CAS-D8 fields and a `meaning` per value.
Every live or designed component row carries `hexagon`, `stack` and `orchestration-ring`
values; path departures sit in the component's `exceptions` (CAS-D9, CAS-D10). The schema, the
Rust crate and the Node architecture test read the value lists from the model; no list of value
names or tier range is written in code. Three rule kinds fixed in code, `order-downward`,
`isolation` and `port-wiring`, run per layering as the model's `rules` choose (CAS-D5); every
new rule was measured in report mode first and blocks only once clean (CAS-D23). The
hand-written layering guards are folded into the layering that owns them. `source` is merged
into `paths`, and every file under the model's `coverage.roots` belongs to exactly one component
(CAS-D17). The declare door sees every layering at once, checks the ring against the stack and
`sameAs` words, and refuses a row that owns nothing (CAS-D14, CAS-D15, CAS-D20). The model has
no retired rows, no `h-*` rows, no `team-cognition-engine` and no `work-driver`; old ids resolve
through `aliases`; `host-runtime` owns `packages/host-runtime/` (CAS-D20..D22). `stack` is
`T0-native` .. `T9-surface` with `T4-agent-runtime`, `T7-domain`, `T8-delivery` (CAS-D7, D13,
D15, D18). The layering definitions are rendered into `architecture-map.md` §3 from the model
and the prose uses the new vocabulary.
The model has no decision kinds. Each live row is a decision scope whose narrative home is its
`spec` or its `decisions` field. The governance holder table, `fgos decision-index` and the plan
contract check read from component rows, and design principle 7 says "each component does one
job" (CAS-D25). `architecture-map.md` renders the four layerings in the CAS-D26 (2) layout, and
every component row carries a one-sentence `summary` that `declare` requires (CAS-D26).

## Acceptance criteria

Numbers in brackets are the hand-off acceptance numbers of the discussion.

1. [core] `layers.yaml` declares the four layerings with every CAS-D8 field (`id`, `aliases`,
   `questions`, `meaning`, `granularity`, `distinctFrom`, `values` each with `meaning`, `rules`,
   `source`), `source` only `declared` or `fromPaths`; checked by
   `cargo test -p component-authority` (model test in `rust/tests/model_checks.rs`). (1)
2. [core] Every `live`/`designed` component carries `hexagon`, `stack`, `orchestration-ring`;
   no row carries `layer`, `tier` or `source`; `tierNames`, `tierExceptions`, top-level
   `layers` and `rules` are gone. `rg -n "LAYER_NAMES|TIER_RANGE" packages/component-authority/rust/src packages/component-authority/contracts`
   prints nothing, and the schema's value enums are filled from the model, not written by hand. (2, 11)
3. [core] Each rule kind has one fixture violation its check catches, in
   `test/architecture.test.mjs`; `stack` catches an upward Cargo crate dependency and `hexagon`
   catches a wrong-rank Rust `use`, each by a fixture; the A4 Work-layer guard and "lower tiers
   do not import Dispatch" run as `stack` `order-downward` (the hand lists `WORK_LAYER_MODULES`
   and the `lower` directory list are deleted), and the edge reader still catches a dynamic
   `import()`, a `require()` and a one-hop re-export. (3, 11)
4. [core] `runner` declares its hexagon departures by path in `exceptions` (`anti-loop`,
   `recovery`, `rigor` domain; `github-adapter`, `worktree` infra) and its ring departures
   (`loop.mjs` orchestrator, `operation-choice.mjs` router, `work-dispatch.mjs` launcher; default
   launcher); ports are declared on `contracts.yaml` rows (`port: {kind, implementers}`); every
   remaining real violation is a named `exceptions` line with a reason (no baseline list). (4, 15, 16)
5. [core] `npm test` and `cargo test --workspace` green on the integrated tree;
   `fgos release check --worktree <integration worktree>` passes. (5)
6. [core] `docs/platform/component-boundary.md` §4 (module = packaging unit, CAS-D1),
   `docs/platform/architecture-map.md` §3 (layering definitions rendered from the model) and
   `docs/platform/vision.md` §6 Known gaps use the new vocabulary; the Work/Domain order gap is
   closed; `fgos authority render --check` reports no drift. (6, 7)
7. [core] `stack` values: Work rows (`work-state`, `runner`, `supervision`) carry `T8-delivery`;
   Domain rows (`domain-components`, `coding-domain`, `group-thinking`, `domain-registry-loader`)
   carry `T7-domain`; `run-supervisor`, `launch-gate`, `agent-mailbox` carry
   `T4-agent-runtime`; `src/report/knowledge-resolver.mjs` is a `T8-delivery` exception. (7, 9, 12)
8. [core] `fgos authority declare` refuses a component missing a value for any `declared`
   layering, and refuses an `orchestration-ring` order that runs against `stack`, naming both
   layerings and the component pair; `fgos authority locate` answers all four layerings; each by
   a test in `declare.rs` / `locate.rs`. (8)
9. [core] Values sharing a word across layerings carry `sameAs` (or the declared
   `distinctFrom` of `hexagon.domain`); the declare door refuses a `sameAs` pair whose two sides
   disagree on a component; `orchestration-ring` has the values `surface`, `orchestrator`,
   `launcher`, `router`, `driver`, `dispatcher`, `none`, `source: declared`. (9, 10)
10. [core] Every file under `coverage.roots` (`src/`, `bin/`, `packages/`, `apps/`, `domains/`,
    declared in the model) minus `coverage.ignore` belongs to exactly one component by longest
    prefix; the crate pairs of CAS-D17 (1) are split parent/child by directory. (11)
11. [core] No `retired` row remains; every `live` contract has a `live`/`designed` provider;
    `agent-mailbox` is `live`; `host-runtime` is declared through `fgos authority declare` and
    owns `packages/host-runtime/` and the 11 former `host-invocation-routing` contracts;
    `fgos authority locate <old id>` returns the successor. (12, 14)
12. [core] The declare door refuses a row that owns nothing (CAS-D20); the 8 `h-*` rows are
    gone, `docs/platform/runner/` is in `runner.paths`, and the governance holder table still
    lists every runner spec file; each `documentation` family row points to a plan or is
    removed. (13)
13. [core] No `team-cognition-engine` or `work-driver` row; `fgos authority locate work-driver`
    returns `runner`; backlog rows exist for the hardcoded `MODEL_DIR` (p-glsrogszi7) and for
    splitting `src/util/` to its owning components (p-3kjg52xfaa). (15)
14. [core] `reports/measure-layerings.md` records, per layering and rule, the violation count
    measured in report mode, and how each was resolved (model fix or named exception); no new
    rule blocks before its count is zero. (16)
15. [core] `decision-kinds.yaml`, the `DecisionKind` type and `--kind decision-kind` are gone;
    every live row has a narrative home (`decisions`, default its `spec`); the governance holder
    table and `fgos decision-index` read scopes from component rows, and an old scope id
    (`architecture-map`, the nine kind ids and their aliases) resolves to its successor; design
    principle 7 reads "Each component does one job, and no second component does a similar job";
    no `enduser-docs-authoring` or `enduser-docs-index` row, and `fgos authority locate` of either
    returns `learning-docs-registry`. Checked by `cargo test -p component-authority`,
    `node --test test/report/decision-index.test.mjs test/scripts/plan-contract-check.test.mjs`
    and the `rg` of phase 10. (17)
16. [core] `architecture-map.md` carries one rendered section per layering from `layers.yaml` in
    the CAS-D26 (2) layout (heading = the question, meaning paragraph, Mermaid diagram from the
    value order, values with meaning and two or three representative components, a "distinct
    from" line, rules as sentences) between markers that `fgos authority render --check` guards;
    every component row has a one-sentence `summary`, and `fgos authority declare` requires it;
    a render unit test and a declare test prove each. (18)

## Non-goals

- Step B, `fgos authority check` (CAS-D24): the checks stay in `test/architecture.test.mjs`.
- `paths: []` of `domain-components`, `coding-domain`, `group-thinking` (hand-off "open").
- Splitting `runner` or any other mixed-role component (CAS-D10 "áp dần", CAS-D22 (2)); the
  departures are path exceptions.
- Splitting `src/util/` into owning components (CAS-D19: a separate item; here each file gets
  its rank by exception).
- Fixing the hardcoded `MODEL_DIR` (CAS-D22 (3): its own backlog row).
- `fromLayering`, a general rule interpreter, a baseline file (CAS-D12, RUL104, CAS-D24 (5)).
- Refactoring code to satisfy a rule (CAS-D23: A changes data and checks only).
- The rest of CAS-D26, which is backlog row p-xtgvunuvxy: the brief-card layout of
  `component-boundary.md`, merging the duplicate component tables, moving the content that
  belongs elsewhere (CAS-D26 (6)), rewriting `owns`/`mustNotOwn` as full sentences on about 70
  rows with the owner's trial read, and retiring the six old roles (CAS-D26 (7)).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Layering rows in `layers.yaml` (`layerings`, `sameAs`, `distinctFrom`) and their schema def | component-authority | `fgos authority locate "the model declares each layering with its definition, values and rule kinds"` returns `component-authority`. survivor: `layerings`; retired: `layers.yaml` `layers`, `rules`, `tierNames`, `tierExceptions`. |
| Layering value fields on component rows and in `exceptions` | component-authority | survivor: field named after the layering; retired: component and exception fields `layer`, `tier`. |
| `coverage.roots` / `coverage.ignore` in the model | component-authority | survivor: model-declared coverage; retired: the hardcoded `src/`+`bin/` `.mjs` scan in `test/architecture.test.mjs:225`. |
| `paths` as the one ownership field | component-authority | survivor: `paths`; retired: component field `source` (render "Source links" reads `paths`). |
| Three rule kinds `order-downward`, `isolation`, `port-wiring` | component-authority | One function per kind in `test/architecture.test.mjs` (step A). survivor: the kind functions; retired: the import-one-way test, the two tier tests, the domain-siloing loop, the "lower tiers do not import Dispatch" test, the A4 `WORK_LAYER_MODULES` reach guard. |
| Edge readers: Rust `use`/`mod` and Cargo crate dependencies | component-authority | Reuse `lexRust` (`scripts/lib/rust-source.mjs`) and the Cargo.toml reading already in `test/architecture.test.mjs:1947-1990`; no new module. |
| Declare-door checks: every declared layering, ring-vs-stack, `sameAs`, owns-something, live-contract provider | component-authority | Extends `rust/src/declare.rs`; no new door. |
| `locate` answers four layerings and resolves old ids by `aliases` | component-authority | Extends `rust/src/locate.rs`. |
| Port on a contract row (`port: {kind, implementers}`) | component-authority | Extends the contract index (CAS-D10). |
| Rendered view `architecture-map-layerings` | component-authority | New view in `render.rs` `view_definitions`, same marker contract. |
| Component `host-runtime` | declare: component host-runtime | CAS-D21; owner approval `q-o2r2zblera`; row draft `reports/host-runtime-row.json`. Overlaps retired `host-invocation-routing`: survivor: host-runtime; retired: components.yaml row `host-invocation-routing`. |
| Component field `decisions` (narrative home) | component-authority | survivor: component rows as decision scopes; retired: `decision-kinds.yaml`, `DecisionKind`, `--kind decision-kind`, the `decisionKinds` reads in `src/report/decision-index.mjs` and `scripts/plan-contract-check.mjs` (CAS-D25). |
| Component field `summary` | component-authority | Extends the component row and the declare door (CAS-D26 (5)); no new door. |
| Principle 7 wording | agent-context-engine | Rules belong to ACE (CAS-D25 (2)); `locate` names no path owner for `core/instructions/` today. Edits the existing unit `core/instructions/design-principles.md`; rendered copies regenerate. |
| Rows merged into survivors | component-authority | survivor: runner; retired: rows `work-driver` and `h-*` (CAS-D20, CAS-D22). survivor: fgos-gateway; retired: rows `herdr-web-dashboard`, `ui-spec`. survivor: workflow and run-result; retired: row `agent-coordination` (CAS-D21). survivor: learning-docs-registry; retired: rows `enduser-docs-authoring`, `enduser-docs-index` (CAS-D25). |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Spec first](phase-01-spec-first.md) | - | docs/platform/component-authority/spec.md | 1 | ready |
| 2 | [Model shape, values and every caller](phase-02-model-shape.md) | 1 | packages/component-authority/model/, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/src/, packages/component-authority/rust/tests/, apps/fgos/tests/authority.rs, test/architecture.test.mjs, test/report/decision-index.test.mjs, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 2 | draft |
| 10 | [Decision kinds retired, four owners](phase-10-decision-kinds-retired.md) | 2 | packages/component-authority/model/, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/src/, packages/component-authority/rust/tests/, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, src/report/decision-index.mjs, test/report/decision-index.test.mjs, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, test/architecture.test.mjs, core/instructions/design-principles.md, core/instructions/ready-plan-runs-unattended.md, core/skills/_shared/plan-contract.md, core/skills/fgos-shaping/SKILL.md, domains/coding/skills/fgos-coding-implement/SKILL.md, AGENTS.md, .fgos/instructions/effective/rules.json, .agents/skills/, plugins/fgOS/skills/, docs/decisions/index.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 3 | draft |
| 3 | [Row cleanup: owners, retired rows, merges, summaries](phase-03-row-cleanup.md) | 10 | packages/component-authority/model/components.yaml, packages/component-authority/model/contracts.yaml, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/src/model.rs, packages/component-authority/rust/src/render.rs, packages/component-authority/rust/tests/, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 4 | draft |
| 4 | [Declare and locate see every layering](phase-04-declare-and-locate.md) | 3 | packages/component-authority/model/layers.yaml, packages/component-authority/rust/src/declare.rs, packages/component-authority/rust/src/locate.rs, packages/component-authority/rust/src/model.rs, packages/component-authority/rust/tests/, apps/fgos/tests/authority.rs | 5 | draft |
| 5 | [Rule kinds in report mode, measured](phase-05-rule-kinds-measured.md) | 3 | test/architecture.test.mjs, plans/261127-1247-component-authority-layerings/reports/measure-layerings.md | 5 | draft |
| 6 | [Data to clean: ranks, exceptions, ports, owners](phase-06-data-to-clean.md) | 4, 5 | packages/component-authority/model/components.yaml, packages/component-authority/model/contracts.yaml, plans/261127-1247-component-authority-layerings/reports/measure-layerings-after.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 6 | draft |
| 7 | [Rules block, hand guards folded](phase-07-rules-block.md) | 6 | test/architecture.test.mjs | 7 | draft |
| 8 | [Rendered definitions and prose](phase-08-rendered-definitions-and-prose.md) | 6 | packages/component-authority/rust/src/render.rs, docs/platform/architecture-map.md, docs/platform/component-boundary.md, docs/platform/vision.md, docs/reading-map.md | 7 | draft |
| 9 | [Integrate](phase-09-integrate.md) | 7, 8 | changelog.d/261127-1247-component-authority-layerings.md, plans/261127-1247-component-authority-layerings/reports/closing.md | 8 | draft |

Phase 1 is `ready` (the owner question does not touch it). Phases 2-9 are `draft` until
`q-o2r2zblera` is answered, because phase 2 starts with the `host-runtime` declare and every
later phase builds on phase 2.

Why mostly serial: `components.yaml`, `contracts.yaml`, `test/architecture.test.mjs` and the
seven rendered docs are hot files with one writer per wave. Phase 10 sits between 2 and 3
because it rewrites the same model files and Rust modules. Phases 4 and 5 run together (the
door code and the test file are disjoint); phases 7 and 8 run together (test file vs. render
code and prose). Every phase leaves `npm test` and `cargo test --workspace` green on its own, so
the gate holds on a tree with only the first phases landed. Contract check:
`node scripts/plan-contract-check.mjs --plan plans/261127-1247-component-authority-layerings`;
footprint check: `fgos resource-check --plan plans/261127-1247-component-authority-layerings`.

Prior art reused: the component `exceptions` field carries every path departure (no second
store; `tierExceptions`, 0 lines, is deleted, CAS-D9); the render door and its markers carry the
new view; the contract index carries ports; the Node import lexer in the test, `lexRust`, and the
Cargo.toml reading of `test/architecture.test.mjs:1947-1990` stay the edge sources (CAS-D17 (3));
the declare door's existing approval, alias and provider checks are extended, not duplicated.

## Unattended run

### Host steps

| step | argv | executor |
|---|---|---|
| declare `host-runtime` before the model shape changes (phase 2 step 1, in the phase-2 worktree) | fgos authority declare --kind component --row plans/261127-1247-component-authority-layerings/reports/host-runtime-row.json --approved-by q-o2r2zblera --dir <phase-2 worktree> | lead |
| render the ownership views after each model change (phases 2, 10, 3, 6, 8) | fgos authority render --dir <phase worktree> | lead |
| full gate on the integrated tree (phase 9) | fgos release check --worktree <integration worktree> | lead |

`fgos can-i` on 2026-11-28 answered `ask` for `authority declare` (no head row grants it), so
that run files one owner question carrying the exact argv; `q-o2r2zblera` already approves its
content. `release check` is `allow` for the lead. Render after phase 2 runs from the worktree's
own code (`npm run fgos:dev -- authority render`), since the activated release reads the old
model shape; a unit sandbox runs it as part of its phase.

### Cleanup

Standing rule. The p01 worktree (`forgent-worktrees/261127-1247-component-authority-layerings-p01`)
is reused by phase 1, not superseded.

### Beyond the rule

| item | question |
|---|---|
| new component `host-runtime` (`fgos authority declare --kind component`) | q-o2r2zblera |

### Split

Parallel where footprints are disjoint (phases 4 with 5, 7 with 8), otherwise serial because the
model files and the test file are hot; one big step per phase rather than staged
compatibility, since CAS-D23 already makes each new rule land report-only and the revert path is
a per-phase merge revert with no state outside the worktree.

## Owner questions

- `q-o2r2zblera`: Approve declaring the new component host-runtime (CAS-D21) so the layerings
  plan can go ready?

Decided by the planner inside the approved frame, not asked:

- **Named debt lives in `exceptions`, not in a `debt` list on the layering.** p01's spec added
  a `debt` list; CAS-D23 ("vi phạm thật thì ghi ngoại lệ có tên và lý do") and CAS-D24 (5) ("không
  thêm baseline") place every real violation in `exceptions`. Phase 1 removes `debt` from p01.
- **When the hexagon count is "too large to name" (CAS-D23).** The phase-5 measure stops the
  plan when resolving the `hexagon` violations would need more than 150 new `exceptions` lines
  after the CAS-D4 re-rank and the CAS-D19 rows; the lead then asks the owner with the measure
  attached and does not loosen a rule. 150 is about twice today's 84 exception lines.
- **`host-runtime` stack value.** Declared `tier: 3` (T3-event) because `observe` (T3) and
  `execution` (T5) depend on it (CAS-D21 note); phase 6 splits its routing part by path
  exception if the measure demands it.
- **The enduser-docs spec text stays a spec.** CAS-D25 makes the authoring practice an ACE unit
  only "if it is a rule". `knowledge-registry.md`'s enduser-docs-authoring section describes
  behaviour (the `retrospective` status, the `fgos compound` producer), which is spec, so no ACE
  unit is added (RUL104).
- **Summaries in this plan, sentence rewrites in the backlog row.** Acceptance (18) asks for a
  `summary` on every row, so phase 3 writes them. CAS-D26 (5)'s full-sentence rewrite of
  `owns`/`mustNotOwn` and the owner's trial read of the two rendered pages belong to the
  brief-card page, which backlog row p-xtgvunuvxy builds.
- **Representative components are chosen, not declared.** The layering render shows the first two
  or three live rows carrying a value, in model order; no new field (RUL104).
- **`sameAs` pairs.** `orchestration-ring.surface` sameAs `stack.T9-surface`;
  `domain-scope.domain` sameAs `stack.T7-domain`; `hexagon.domain` distinctFrom all three
  (CAS-D15 (3)). Phase 4 checks there is no other shared word.

## Risks and rollback

- **The field rename breaks other projects' models** (`.fgos/authority/model/` with
  `layer`/`tier`/`source`). The loader refuses each old field by name and names its new field
  (no compatibility reader, L10); the changelog fragment says so. The empty bootstrap model
  declares no layering, so a new project's declare needs no layering value.
- **The measure finds too many hexagon violations.** Stop rule above; proof point for
  validating: `reports/measure-layerings.md` counts per layering before phase 6.
- **Removing retired rows drops history readers rely on.** `locate` resolves the old id through
  the successor's `aliases` (acceptance 11), and the decision history keeps the narrative.
- **`authority declare` is `ask` for heads.** The run waits for one owner answer at phase 2
  step 1; the content is pre-approved by `q-o2r2zblera`, so the answer is mechanical.
- **Ring values on ~60 rows need judgment.** The ring-vs-stack check of phase 4 catches a
  reversed pair; the §7 scan table of the discussion is the input.
- **No baseline proof here.** The planner's sandbox cannot load the native addon
  (`git-addon-not-shipped`), so `test/architecture.test.mjs` was not run on `base`; phase 2's
  first step records the baseline result.
- **Phase 10 regenerates shared render surfaces** (`AGENTS.md`, `.fgos/instructions/effective/rules.json`,
  `.agents/skills/`, `plugins/fgOS/skills/`) that other plans also regenerate. The lead reruns
  `npm run build:skills` on the rebased branch right before land, so the generated bytes come
  from the merged sources rather than being hand-merged.
- **Rollback**: each phase is one branch; revert its merge commits in reverse wave order.
  Phase 2 is the only shape change; reverting it restores `layer`/`tier`/`source`. The
  `host-runtime` row is removed by reverting phase 2.

## Outstanding questions

- `q-o2r2zblera`: Approve declaring the new component host-runtime (CAS-D21) so the layerings
  plan can go ready?
