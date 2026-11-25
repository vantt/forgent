---
contract: plan-v1
title: "Agent Context Engine: one checked store of every fgOS rule, built on pkm, handing ASC one effective set with a digest"
status: draft
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
  - AGENTS.md
  - core/skills/**
  - core/agents/**
  - core/prompt-templates/**
  - domains/coding/skills/**
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - test/docs/**
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
arrives (L10); packaging-distribution keeps only writing host files. Finally every fgOS rule is gathered to one
owner, which resolves the 31 duplicate clusters and the 14 conflicts measured in P2 (ACE-D4).

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
  the effective set, a write-time nearest-rule check, and a single owner for each of the 31 clusters.

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
5. A rerun of the P2 method on the merged tree finds no duplicate cluster outside pointers and none of the 14
   conflicts; every rule from AGENTS.md's hand-written sections and from the 31 clusters has one owner unit
   (phase 5).
6. `npm test` and `cargo test --workspace` are green on the merged tree (phase 6).

## Non-goals

- Selecting rules for a start, budgets per delivery and reading plans: ASC's (ACE-D2, ASC-D8).
- Writing host files, block markers, ledger rows and doctor drift repair: packaging-distribution's (ACE-D2).
- AgentKit, GitNexus and MDView text (ASC-D2); the AgentKit rules loaded three times (`p-7eb9e65b`).
- H2 document identity: ACE keeps its own rule schema and never calls the documentation component (ACE-D6).
- A scheduled full semantic sweep as a running job. The P2 method is rerun once as phase 5's proof; making it a
  recurring audit is a separate item if the owner wants it.
- Deciding which rules are always loaded (L8) and the AGENTS.md byte cut: ASC phase 9.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Area spec and v1 contracts](phase-01-spec-and-contracts.md) | - | docs/platform/agent-context-engine/**, packages/agent-context-engine/contracts/** | 1 | draft |
| 2 | [pkm fit probe](phase-02-pkm-fit-probe.md) | - | plans/261125-1631-agent-context-engine/reports/pkm-fit.md | 1 | draft |
| 3 | [The crate on pkm, the compile door, registration; the Node registry moves out](phase-03-crate-store-and-registry-move.md) | 1, 2 | packages/agent-context-engine/rust/**, packages/agent-context-engine/pkm/**, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/wiring/context_engine.rs, apps/fgos/src/wiring/context_engine/**, apps/fgos/src/wiring/mod.rs, apps/fgos/src/routing.rs, apps/fgos/tests/context_engine.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/component-authority/model/**, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/reading-map.md, docs/platform/packaging-distribution/spec.md, docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md, docs/platform/proposals/documentation-system-unification.md, src/setup/instruction-registry.mjs, src/setup/instruction-composition.mjs, src/setup/instruction-projections.mjs, src/setup/skill-wrappers.mjs, test/setup/instruction-*.test.mjs, test/rust-host/release-tree.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, .fgos/instructions/effective/**, core/instructions/**, components/*/instructions/**, domains/*/instructions/** | 2 | draft |
| 4 | [Refuse a bad rule when it is written](phase-04-write-time-check.md) | 3 | packages/agent-context-engine/rust/src/check/**, packages/agent-context-engine/rust/tests/check*.rs, apps/fgos/src/wiring/context_engine/**, apps/fgos/tests/context_engine.rs, .githooks/pre-commit | 3 | draft |
| 5 | [Gather every fgOS rule to one owner](phase-05-gather-rules.md) | 4 | core/instructions/**, components/*/instructions/**, domains/*/instructions/**, AGENTS.md, core/skills/**, core/agents/**, core/prompt-templates/**, domains/coding/skills/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, test/docs/**, .fgos/instructions/effective/** | 4 | draft |
| 6 | [Integration gate, sweep rerun, changelog](phase-06-integration.md) | 1, 2, 3, 4, 5 | CHANGELOG.md, plans/261125-1631-agent-context-engine/reports/** | 5 | draft |

### Dependencies with the ASC plan (`261122-1946-agent-start-context`)

ACE ← ASC ← packaging-distribution (ACE-D2). Each edge from an ASC phase to the ACE phase it needs, and why (the
admission rule below makes the whole ASC plan wait for this one, but these are the real data edges):

| ASC phase | needs ACE phase | why |
|---|---|---|
| 2 (spec, contracts) | 1 | ASC's spec and `start-request.v1.json` cite `when-keys.v1.json` and `effective-rules.v1.json` by path; `start-facts.v1.json` is no longer ASC's (ASC-D9) |
| 3 (crate, door) | 3 | ASC's `RuleSet` port reads the compiled set through ACE's reader; its `FactRegistry` takes keys from ACE and values through ACE's value-source adapter |
| 5 (producers) | 3, 4, 5 | the start ritual and each persona's first step move once, straight into ACE rule units with `when:`, checked against the gathered rules |
| 6 (one matcher) | 3 | it replaces phase 3's interim "rules without `when:`" filter in the projection with a `compose` call |
| 9 (AGENTS.md cut) | 5 | phase 5 has already moved every AGENTS.md rule section into a unit; ASC phase 9 only sets `when:` by L8 |
| 11 (integration) | 6 | both write `CHANGELOG.md`; ASC 11 lands after ACE 6 |

**Admission order.** The two footprints overlap (`Cargo.lock`, the model, the host manifest, `core/instructions/**`,
`AGENTS.md`), and the plan contract admits a `ready` plan only when it overlaps no active plan unless `blockedBy`
resolves it. Two active plans cannot interleave phases on shared files. So the ASC plan lists this plan in
`blockedBy`, and no ACE phase waits for an ASC phase (that would be a cycle). ASC phases 2 and 4 write only new
directories and may still be marked `ready` while this plan runs, ASC 2 once ACE 1 has landed. Owner question 5 asks
whether to move phase 5 into its own plan so ASC can start after ACE 4.

### Who moves which text (each piece moves once)

- Hand-written fgOS rule sections of `AGENTS.md`, and every copy in the 31 clusters: **ACE phase 5**. It moves each
  rule into its owner unit with no `when:` restriction, so the rendered AGENTS.md still carries it, and turns the
  other copies into pointers. It rewrites wording only to resolve the 14 conflicts (ACE-D4).
- The start ritual and `FIRST_STEPS` (code in `src/session-host/head-start.mjs`, outside the P2 corpus): **ASC
  phase 5**, straight into ACE units, after the gathering; phase 4's write-time check refuses them if they restate a
  gathered rule.
- Which unit is always loaded and which is scoped by facts (L8): **ASC phase 9**. It edits only `when:` lines and the
  anchor tests; it moves no text.
- Existing units' frontmatter (to the pkm rule schema with `when:`): **ACE phase 3**, once.

### Waits on other plans

Phases 1 and 2 write only new files (spec, contracts, a report; the probe lives in `.fgos/runtime/tmp/`) and touch no
running plan's footprint (checked on `4f44bb780`). The plan as a whole stays `draft`. Each other phase waits:

| phase | waits for | shared files |
|---|---|---|
| 3 | `261122-2108` | `packages/component-authority/model/**`, `docs/reading-map.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md`, `docs/platform/proposals/documentation-system-unification.md`, `test/suite-baseline.json`, `packages/git/contracts/mutation-census.v1.json` |
| 3 | `261124-0004` | `Cargo.lock`, `apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`, `command-routes.json` |
| 5 | `261122-2108` | `core/skills/fgos-run/SKILL.md`, `core/skills/_shared/capability-catalog.md`, `core/skills/_shared/capability-matching.md` |
| 5 | `261124-0004` | `core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`, `core/agents/{secretary,supervisor}.yaml` |
| 5 | `261122-1950` (draft) | asking-a-person doctrine: `core/instructions/decision-question.md`, `core/skills/_shared/{coordination-driver,plan-contract,decision-question}.md`, `fgos-shaping`, `fgos-cook`, `AGENTS.md`, `.fgos/instructions/effective/**`. See owner question 2 |
| 3-6 | `261023-1649` (running) | row level only: its phase 00 lists `src/setup/instruction-registry.mjs` as a YAML reader; if that plan still edits the file when phase 3 starts, phase 3 rebases over it, since phase 3 deletes the file |

`261114-2051` phase 11 edits single AGENTS.md paragraphs without a frontmatter footprint; phase 5 rebases over it.

### Hot files, one writer per wave (both plans)

- `core/instructions/**`: ACE 3 (wave 2), ACE 5, ASC 5, ASC 9, in that order.
- `src/setup/instruction-projections.mjs`: ACE 3 (interim filter), ASC 6 (calls `compose`).
- `Cargo.toml`, `Cargo.lock`, `apps/fgos/Cargo.toml`, `wiring/mod.rs`, `routing.rs`, the command manifest and routes,
  `packages/component-authority/model/**` and the generated views: ACE 3, then ASC 3.
- `apps/fgos/src/wiring/context_engine/**`: ACE 3, then ACE 4.
- `AGENTS.md`, `test/docs/**`: ACE 5, then ASC 9.
- `CHANGELOG.md`: ACE 6, then ASC 11.

`.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**` and the AGENTS.md projection block are generated
by `npm run build:skills`; phase 5 regenerates them, never edits them by hand.

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
   records ACE-D3 and ASC-D1 lets both phase 3s declare. Detail in the report.
2. **Order with the communication standard plan `261122-1950`.** Both rewrite the asking-a-person doctrine (clusters
   12-14 and 19, conflict C7). Detail in the report.
3. **Scope of "every rule" in ACE-D1 for skill-local rules.** Detail in the report.
4. **Nearest-rule check without the embedding model.** Detail in the report.
5. **Move the gathering (phase 5) into its own plan, so ASC is not held behind it.** Detail in the report.

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
  equals today's repo target, and ASC phase 6 deletes it. Rollback of ASC 6 restores it, not the Node composer.
- **Build needs the host.** After phase 3 `npm run build:skills` calls the host door; it finds the binary through
  `FGOS_HOST_BIN` or the activated release and fails with a named error, never silently.
- **Release tree.** The compiled set must ship in the release payload so other projects get it at setup (mission
  #1); phase 3 updates the release-tree probe that imported `instruction-registry.mjs`.
- **Rule loss during the gathering.** Phase 5 proves that every moved rule appears in the compiled set and in the
  rendered AGENTS.md, and keeps the RUL11/RUL104 anchor tests green by pointing them at the new location.
- **Rollback.** Each phase lands as its own commits through `fgos land`, and each deletes the old path in the same
  commit that adds the new one. Reverting phase 3 restores the Node registry and composer together with
  `repo.json`; reverting phase 5 restores the old copies and the conflicts.
