---
contract: plan-v1
title: "Agent Context Engine: one checked store of every fgOS rule, built on pkm, handing ASC one effective set with a digest"
status: running
lead: head:lead-forgent-261125-1631-agent-15de9
priority: P1
blockedBy:
  - 261122-2108-delete-dead-node-execution-closure
  - 261124-0004-heads-operate-without-owner
base: 4f44bb780d5e65ac42d6f554d4bbe3731565bf5c
footprint:
  - plans/261125-1631-agent-context-engine/**
  - docs/platform/agent-context-engine/**
  - packages/agent-context-engine/**
  - Cargo.toml
  - Cargo.lock
  - apps/fgos/Cargo.toml
  - apps/fgos/src/wiring/context_engine.rs
  - apps/fgos/src/wiring/context_engine/**
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/tests/context_engine.rs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/component-authority/model/**
  - docs/platform/governance.md
  - docs/platform/system-overview/spec.md
  - docs/platform/component-boundary.md
  - docs/platform/architecture-map.md
  - docs/platform/README.md
  - docs/reading-map.md
  - docs/platform/packaging-distribution/spec.md
  - docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
  - docs/platform/proposals/documentation-system-unification.md
  - src/setup/instruction-registry.mjs
  - src/setup/instruction-composition.mjs
  - src/setup/instruction-projections.mjs
  - src/setup/skill-wrappers.mjs
  - test/setup/instruction-*.test.mjs
  - test/rust-host/release-tree.test.mjs
  - test/suite-baseline.json
  - packages/git/contracts/mutation-census.v1.json
  - .fgos/instructions/effective/**
  - .githooks/pre-commit
  - core/instructions/**
  - components/*/instructions/**
  - domains/*/instructions/**
  - CHANGELOG.md
source:
  - plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md
  - p-y3umlovk73
created: 2026-11-25
---

# Agent Context Engine

## Outcome

ACE becomes its own component (ACE-D3): the one store of every fgOS rule, with one owner per rule, no duplicate and
no conflict (ACE-D1). It knows no agent and writes no host file (ACE-D2). Rule units stay Markdown files in the three
existing roots (`core/instructions/`, `components/<c>/instructions/`, `domains/<d>/instructions/`); a Rust crate
indexes them with pkm (ACE-D6), uses pkm's lifecycle classes, typed edges and effective set for validity,
supersession and declared relations, and uses pkm search to find the nearest existing rules when a rule is written.
ACE refuses a bad rule when it is written, never at agent start (ACE-D5). At build or setup time it compiles one
checked effective rule set with a digest, each rule carrying id, owner, body and `when:` metadata, and it owns the
registry of `when:` keys (ACE-D5). ASC reads that file; it needs no pkm and no embedding model at agent start
(ACE-D6). The Node registry and composer leave packaging-distribution in the same change that the Rust engine
arrives (L10); packaging-distribution keeps only writing host files.

Gathering every fgOS rule to one owner (ACE-D4: the 31 duplicate clusters and all 14 measured conflicts) is no longer
this plan's. The owner moved it to its own plan on 2026-11-25 20:4x:
[261125-2041-gather-fgos-rules-to-one-owner](../261125-2041-gather-fgos-rules-to-one-owner/plan.md). Its phase file
moved there with it (old phase 5 is now that plan's phase 1); phase ids here keep their numbers so links resolve.

## Prior art

Read with `git log -S` on `discoverInstructionSources`, `evaluateInstructionComposition`, `EFFECTIVE_INSTRUCTIONS_DIR`,
`conflictsWith`, `RUL102` and "Agent Context Engine":

- **Reused, ported to Rust and then deleted in Node:**
  - the registry (`04be428b6`, hardened `2e03118c3`, `caebec897`): three roots, frontmatter, owners from the component
    authority model (`src/setup/instruction-registry.mjs:455` `discoverKnownOwners`, `:588`
    `discoverInstructionSources`), kinds, modes, scopes and specificity (`:27-83`);
  - the composer (`be24172ad`, `19d0640dc`, `61d4e3da1`, `0f4c36482`): kind order, authority order
    (`src/setup/instruction-composition.mjs:66`), the fail-closed conflict codes (`:54`), sealed law supersession
    (`instruction-registry.mjs:120` `hasVerifiedSupersessionEvidence`);
  - the composition semantics of
    [instruction-composition-and-projection.md](../../docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md)
    §5-9, and its unit fields `dependsOn`, `refines`, `supersedes`, `conflictsWith`, which map onto pkm edges;
  - the tracked effective-set artifact `.fgos/instructions/effective/repo.json` (`be24172ad`) and the projection
    ledger's `effectiveSetDigest` (`src/setup/instruction-projections.mjs:240`).
- **Reused as is:** pkm v0.7.0 as linked today by `packages/documentation/rust/Cargo.toml` (same tag, same static
  ONNX Runtime build); the doctor rows `doc-locate-model` and `doc-locate-model-fetch` for the embedding model;
  `fgos authority declare` for the component and contract rows.
- **Decisions this plan carries forward:** RUL102 (2026-10-17, `b111a8144`, `docs/platform/packaging-distribution/spec.md:838`)
  already gave composition to ACE and kept delivery in packaging-distribution, with a weight guard ("the seed moves
  to its own module when the first budget/tiering slice lands, never kept in two places"). ACE-D3 is that move.
  The 2026-10-21 counsel (`plans/reports/kongming-261021-1325-rule-engine-component-boundary.md`) advised a Node ACE
  with no new crate; ACE-D3 and ACE-D6 (own component, pkm linked directly) supersede that part. Its other point
  holds: ACE never depends on the documentation component, and the hot path reads a precompiled set.
- **Missing, and built here:** a rule schema with lifecycle and typed relations, a `when:` key registry, a digest on
  the effective set, and a write-time nearest-rule check.

## Acceptance criteria

1. `docs/platform/agent-context-engine/spec.md` names ACE's owner, tier 3, its ports and its contracts, and states
   the three roles of ACE-D2. `packages/agent-context-engine/contracts/{rule-unit,when-keys,effective-rules,refusals}.v1.json`
   exist with vectors. The component and its contracts are rows of `packages/component-authority/model/`; RUL102 is
   superseded by a decision that records ACE-D2 and ACE-D3. Proof: `cargo test -p fgos-agent-context-engine` and
   `fgos authority render --check` (phases 1 and 3).
2. `plans/261125-1631-agent-context-engine/reports/pkm-fit.md` shows, from a running probe, which rule needs pkm
   answers and which it does not (phase 2).
3. `rg -l "instruction-registry|instruction-composition" src scripts test bin` prints nothing; the Rust crate is the
   only registry and composer. `npm run build:skills` renders the same "fgOS Effective Instructions" block from the
   compiled set (`git diff --exit-code AGENTS.md`), and `.fgos/instructions/effective/rules.json` carries a digest
   that the reader verifies (phase 3).
4. A rule unit with an unknown `when:` key or value, an unknown owner, a duplicate id, a replaced rule without its
   replacement and end date, a dependency that is not in force, or two in-force rules joined by `conflicts_with` is
   refused by `fgos internal context-engine check` and by the pre-commit hook. A new unit whose nearest in-force rule
   scores above the threshold is refused until it declares a relation to it (phase 4).
5. (Moved.) The gathering criterion (no duplicate cluster outside pointers, none of the 14 conflicts) is criterion 1
   of plan `261125-2041-gather-fgos-rules-to-one-owner`.
6. `npm test` and `cargo test --workspace` are green on the merged tree (phase 6).

## Non-goals

- Gathering the rules and resolving the 14 conflicts: plan `261125-2041` (ACE-D4, owner 2026-11-25 20:4x).
- Selecting rules for a start, budgets per delivery and reading plans: ASC's (ACE-D2, ASC-D8).
- Writing host files, block markers, ledger rows and doctor drift repair: packaging-distribution's (ACE-D2).
- AgentKit, GitNexus and MDView text (ASC-D2); the AgentKit rules loaded three times (`p-7eb9e65b`).
- H2 document identity: ACE keeps its own rule schema and never calls the documentation component (ACE-D6).
- A scheduled full semantic sweep as a running job.
- Deciding which rules are always loaded (L8) and the AGENTS.md byte cut: ASC phase 9.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Area spec and v1 contracts](phase-01-spec-and-contracts.md) | - | docs/platform/agent-context-engine/**, packages/agent-context-engine/contracts/** | 1 | done |
| 2 | [pkm fit probe](phase-02-pkm-fit-probe.md) | - | plans/261125-1631-agent-context-engine/reports/pkm-fit.md | 1 | draft |
| 3 | [The crate on pkm, the compile door, registration; the Node registry moves out](phase-03-crate-store-and-registry-move.md) | 1, 2 | packages/agent-context-engine/rust/**, packages/agent-context-engine/pkm/**, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/wiring/context_engine.rs, apps/fgos/src/wiring/context_engine/**, apps/fgos/src/wiring/mod.rs, apps/fgos/src/routing.rs, apps/fgos/tests/context_engine.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/component-authority/model/**, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/reading-map.md, docs/platform/packaging-distribution/spec.md, docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md, docs/platform/proposals/documentation-system-unification.md, src/setup/instruction-registry.mjs, src/setup/instruction-composition.mjs, src/setup/instruction-projections.mjs, src/setup/skill-wrappers.mjs, test/setup/instruction-*.test.mjs, test/rust-host/release-tree.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, .fgos/instructions/effective/**, core/instructions/**, components/*/instructions/**, domains/*/instructions/** | 3 | draft |
| 4 | [Refuse a bad rule when it is written](phase-04-write-time-check.md) | 3 | packages/agent-context-engine/rust/src/check/**, packages/agent-context-engine/rust/tests/check*.rs, apps/fgos/src/wiring/context_engine/**, apps/fgos/tests/context_engine.rs, .githooks/pre-commit | 4 | draft |
| 6 | [Integration gate, changelog](phase-06-integration.md) | 1, 2, 3, 4 | CHANGELOG.md, plans/261125-1631-agent-context-engine/reports/** | 5 | draft |

Phase 1 is parked (owner, 2026-11-25 22:58): another machine does it; the lead waits for that land on main, then marks
phase 1 done; phase 2 does not wait for that land (next paragraph). The duplicate local run's branch `agent-context-engine/p01` is not landed
(cleanup is owner question `q-ubi34e6xd3`).

Phase 5 left this plan for `261125-2041` (owner, 2026-11-25 20:4x). Phase 2 runs beside phase 1 (owner, 2026-11-25
21:4x, recut question C): the two share no file, and the probe maps the rule shape of ACE-D1 and ACE-D5 onto pkm, so
phase 1 can take the probe's findings into `rule-unit.v1.json` instead of the probe waiting for it. Phase 3 waits for
both.

### Join points with the other two plans (owner, 2026-11-25 20:4x)

The owner first set these join points (20:4x), then chose to run the three plans in sequence (21:0x, see "Parallel
admission" below). The joins stay as the data edges between the plans:

| join | waits | why (data edge) |
|---|---|---|
| ASC starts after ACE 1 | ASC 2 and ASC 4 wait for ACE 1 | ASC's spec and `start-request.v1.json` cite `when-keys.v1.json` and `effective-rules.v1.json`; ASC 3's crate tests read ACE 1's vectors |
| ASC 6 after ACE 3 | ASC 6 waits for ACE 3 | ASC 6 wires ACE's reader (`RuleSet`) and `ValueSource` into the host, adds the host door, and deletes the interim filter ACE 3 leaves in the projection |
| ASC 9 after the gathering | ASC 9 waits for plan `261125-2041` | the gathering has moved every AGENTS.md rule section into a unit; ASC 9 only scopes units by L8 |

The gathering plan lists this plan in `blockedBy`: it needs phase 4's write-time check and phase 3's compile door,
and both plans write `CHANGELOG.md` in their last phase. No phase here waits for ASC or the gathering (no cycle; ACE
never depends on ASC). The ASC plan's phase table shows how its phases were re-ordered so that every ASC data need on
ACE 3 passes through ASC 6. The owner chose to run the three plans one after another, this plan then the gathering
then ASC (2026-11-25 21:0x; recut report `plans/reports/planner-261125-2038-ace-asc-plan-recut.md`, question A).

### Who moves which text (each piece moves once)

- Existing units' frontmatter (to the pkm rule schema with `when:`): **ACE phase 3**, once.
- Hand-written fgOS rule sections of `AGENTS.md`, and every copy in the 31 clusters: **the gathering plan**.
- The start ritual and `FIRST_STEPS` (code in `src/session-host/head-start.mjs`, outside the P2 corpus): **ASC phase
  5**, into ACE units, after ACE 3 (through ASC 6).
- Which unit is always loaded and which is scoped by facts (L8): **ASC phase 9**; it edits only `when:` lines and the
  anchor tests.

### Waits on other plans

Phase 1 writes only new files; phase 2 writes a report (the probe lives in `.fgos/runtime/tmp/`). Neither touches a
running plan's footprint (checked on `4f44bb780`). The plan as a whole stays `draft`. Each other phase waits:

| phase | waits for | shared files |
|---|---|---|
| 3 | `261122-2108` | `packages/component-authority/model/**`, `docs/reading-map.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md`, `docs/platform/proposals/documentation-system-unification.md`, `test/suite-baseline.json`, `packages/git/contracts/mutation-census.v1.json` |
| 3 | `261124-0004` | `Cargo.lock`, `apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`, `command-routes.json` |
| 3-6 | `261023-1649` (running) | row level only: its phase 00 lists `src/setup/instruction-registry.mjs` as a YAML reader; if that plan still edits the file when phase 3 starts, phase 3 rebases over it, since phase 3 deletes the file |

### Hot files, one writer per wave

Inside this plan every hot file has one writer: `Cargo.toml`, `Cargo.lock`, `wiring/mod.rs`, `routing.rs`, the host
manifest and routes, the model and its generated views, `src/setup/instruction-projections.mjs`, `core/instructions/**`
and `.fgos/instructions/effective/**` are phase 3's; `apps/fgos/src/wiring/context_engine/**` is phase 3's, then phase
4's; `CHANGELOG.md` is phase 6's. Across the three plans, the phases that can run at the same time as ACE phases
share only `Cargo.toml` and `Cargo.lock` (ACE 3 with ASC 3); the recut report lists every pair and its resolution.

## Authority map

| New or moved thing | Model row | Note |
|---|---|---|
| The rule store, rule schema, `when:` key registry, composition and write-time checks; contracts `rule-unit`, `when-keys`, `effective-rules`, `refusals` (each declared with `--kind contract`, provider `agent-context-engine`, in phase 3) | `declare: component agent-context-engine` | ACE-D3. `fgos authority locate` finds no row for it (2026-11-25). |
| Composition semantics of the instruction contract | `docs.packaging-distribution/instruction-composition-and-projection` | The row overlaps the new component; survivor: `agent-context-engine` for composition and registry shape; retired: `src/setup/instruction-registry.mjs`, `src/setup/instruction-composition.mjs`. Packaging-distribution keeps the projection half of the row. |
| Writing host files, the projection ledger, block markers | `packaging-distribution` | Unchanged owner (ACE-D2); loses the registry and composer only. |
| RUL102 successor decision | `packaging-distribution` | Recorded in the packaging-distribution decision history, since RUL102 lives there. |
| pkm link, embedding model rows | `documentation` | Not a dependency: ACE links pkm itself and only reuses the doctor rows for the model file (ACE-D6). |

## Owner questions

1. **Approval id for the component declaration** (shared with ASC owner question 2). `fgos authority declare --kind
   component` needs `--approved-by` with an answered owner question. ACE-D3 was settled in chat. One question that
   records ACE-D3 and ASC-D1 lets both declarations run. Detail in
   `plans/reports/planner-261125-1631-agent-context-engine-plan.md` Q1. Asked in the question store as
   `q-5sog3pzmqn` (2026-11-25); phase 3 passes that id to `--approved-by` once it is answered.
2. **Nearest-rule check without the embedding model** (phase 4). Detail in the same report, Q4. Still open.
3. Answered: the gathering became its own plan (old Q5, owner 2026-11-25 20:4x). The old questions on the order with
   `261122-1950` (Q2) and the scope of "every rule" (Q3) moved to plan `261125-2041` with the phase they govern.

## Risks and rollback

- **pkm gaps** (phase 2 decides): pkm has no built-in `conflicts_with`, `depends_on` or `refines` edge and enforces
  no meaning on custom edges; it does not detect contradictions, only near-duplicates (`implicit-replacement`,
  cosine ≥ 0.93 by default); R12 needs an end date on every replaced rule; search needs a worker and a ~130 MB model.
  Mitigation: custom edges in ACE's own pack file, ACE's own checks on those edges (ported from the Node composer),
  a tuned threshold, and dates written by the check's fix hint. If the probe shows a blocking gap, phase 3 stops and
  the gap goes to the owner and to pkm (owner issue tracker, as for `pkm#1`).
- **Layering.** ACE sits at tier 3 and must never depend on ASC or documentation. Cargo refuses the ASC cycle; phase 3
  checks `cargo tree -p fgos-agent-context-engine` for `fgos-documentation`. The pkm store adapter sits behind a
  cargo feature, so ASC links the reader without the store.
- **The interim projection filter** (phase 3 to ASC phase 6) is a selection outside ASC. It is named in phase 3,
  equals today's repo target, and ASC phase 6 deletes it. ASC 6 waits for ACE 3 (owner join point), so the window
  is as short as ASC's own order allows. Rollback of ASC 6 restores it, not the Node composer.
- **Build needs the host.** After phase 3 `npm run build:skills` calls the host door; it finds the binary through
  `FGOS_HOST_BIN` or the activated release and fails with a named error, never silently.
- **Release tree.** The compiled set must ship in the release payload so other projects get it at setup (mission
  #1); phase 3 updates the release-tree probe that imported `instruction-registry.mjs`.
- **Parallel admission.** The supervisor admits only whole `ready` plans whose footprint overlaps no `running` plan
  (`packages/supervision/rust/src/portfolio.rs:252-268`). This plan's footprint overlaps ASC's and the gathering's,
  so the owner ordered the plans in sequence (2026-11-25 21:0x): this plan runs first, and the gathering and ASC
  wait for it through `blockedBy`.
- **Rollback.** Each phase lands as its own commits through `fgos land`, and each deletes the old path in the same
  commit that adds the new one. Reverting phase 3 restores the Node registry and composer together with
  `repo.json`.
