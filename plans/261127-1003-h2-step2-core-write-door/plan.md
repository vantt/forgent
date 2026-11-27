---
contract: plan-v1
title: "H2 build step 2: the core write door (locate, grow with evidence, or hand off to admission), the retrospective writer as its first caller"
description: "Lift the retrospective writer's locate-grow-handoff steps into one core write-door procedure on fgos doc locate, record the writer's locate and decision on grow, add the always-loaded pointer seed through the context engine, correct the documentation specs after the context engine landed, and measure topics per retrospective item."
status: draft
priority: P2
blockedBy:
  - 261127-0143-widen-running-plan-footprint
  - 261127-0144-when-to-ask-owner-rule
  - 261127-0151-ready-plan-runs-unattended
  - 261127-0016-head-run-own-failure-domain
  - 261126-2324-changelog-fragments-and-skill-surface-regeneration
base: c4ff00277dc1b843c6536337ce8d73c998cf3f69
source:
  - p-ixrbglli5o
  - docs/platform/documentation/spec.md#4-build-order
  - plans/261113-0124-docos-retrospective-claim-units/plan.md
created: 2026-11-27
footprint:
  - plans/261127-1003-h2-step2-core-write-door/**
  - src/state/knowledge-registry.mjs
  - bin/fgos.mjs
  - src/cli/command-registry.mjs
  - test/state/knowledge-registry.test.mjs
  - docs/platform/work-state/contracts/knowledge-registry.md
  - core/skills/_shared/write-door.md
  - domains/coding/skills/fgos-coding-knowledge/SKILL.md
  - .agents/skills/_shared/write-door.md
  - .agents/skills/fgos-coding-knowledge/SKILL.md
  - .claude/skills/fgos-coding-knowledge/SKILL.md
  - plugins/fgOS/skills/_shared/write-door.md
  - plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md
  - core/instructions/documentation-door.md
  - .fgos/instructions/effective/**
  - docs/platform/documentation/spec.md
  - docs/platform/documentation/subcomponents/write-door/spec.md
  - docs/platform/documentation/subcomponents/document-identity/spec.md
  - docs/platform/documentation/operations/how-a-document-is-written.md
  - docs/platform/proposals/documentation-system-unification.md
  - docs/platform/intent-preservation-ledger.md
  - docs/reading-map.md
  - plans/260925-documentation-authority-unification/plan.md
  - plans/261113-0124-docos-retrospective-claim-units/plan.md
  - plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md
  - plans/backlog.md
  - CHANGELOG.md
  - changelog.d/**
---

# H2 build step 2: the core write door

Where H2 stands: the build order and the plan of each step live in
[documentation spec section 4](../../docs/platform/documentation/spec.md#4-build-order). Step 1 (locate through pkm)
landed in `efb1f5af3` (plan `261122-2217-docos-pkm-locate-door`). This plan is step 2. It replaces the draft
`261113-0124-docos-retrospective-claim-units`, written before the owner's 2026-11-24 decision (general door, not a
writer path) and before locate existed.

## Outcome

Any agent that writes documentation follows one core write-door procedure: draft the claim, find the unit that
already carries it with `fgos doc locate`, then grow that unit (a user knowledge unit gets one evidence line and an
attestation that records the locate result), ask when two units fit, or hand the claim to an admission request when
none does. The retrospective writer `fgos-coding-knowledge` is the first caller and no longer searches with `rg`.
One always-loaded line, compiled by the Agent Context Engine, points every agent at the door. The documentation
specs say what the context engine now owns, and every place that names H2 links to the build order. New topics
per retrospective item are measured before and after.

## Facts (checked on `c4ff00277`, 2026-11-27)

| # | Fact | Evidence |
|---|---|---|
| F1 | Most of the draft plan already landed: the cleanup gate accepts a handoff to a live admission request as a fourth evidence kind, `fgos knowledge handoff` records it, and the knowledge skill follows write door 6.4 (claims, grow with an evidence line and attest, or hand off) | `4a731ffa9`, `26d61be01`; `src/state/cleanup-harness.mjs` `checkRetrospectiveContentForId`; `domains/coding/skills/fgos-coding-knowledge/SKILL.md` |
| F2 | The skill still locates with `rg -l -i` over `docs/knowledge docs/explanation docs/how-to` and says "`fgos doc locate` replaces this search when it lands" | skill step 2 |
| F3 | `fgos doc locate` is native (Rust), takes `--draft`/`--draft-file`/`--area`/`--question`, returns up to ten candidates with `path`, `title`, `section`, `excerpt`, `axes`, `outside_region`, plus `partial` and the index `state`; it covers the whole `docs/` vault minus past-state folders and `docs/distillery/` | `packages/host-runtime/contracts/command-routes.json` `doc.native_subcommands`; `packages/documentation/rust/src/port.rs` `Candidate`, `Answer`; document identity 8.2 |
| F4 | `doc.attest` records only `captureId` on a registry document; `capture.handoff` already records a locate result (`query`, `candidates[{path, section, why_not}]`) through `normalizeHandoffLocate` | `src/state/knowledge-registry.mjs` |
| F5 | Document identity 8.1 step 6 assigns "the writer's decision in the locate log" to the write door of step 2 | document identity spec 8.1, 14 |
| F6 | Code-level refusal of `topic register` / `doc reserve` without a locate result is an effect check at the doors, which admission (step 4) builds | admission spec 6.1, 6.5; documentation spec section 4 step 4 |
| F7 | The write-door spec defines "the write door" as a skill reached through a pointer line; step 5 builds "the skill and live templates on the core door that step 2 builds" | write-door spec 1, 2.1; documentation spec section 4 step 5 |
| F8 | Always-loaded rules are now rule units under `core/instructions/` with context-engine frontmatter; the pre-commit hook runs the engine's structural and nearest-rule checks on a staged unit, and the compiled set lives in `.fgos/instructions/effective/` | `docs/platform/agent-context-engine/spec.md` 4, 6.2, 7; `core/instructions/scratch-artifacts.md` |
| F9 | The context engine owns every fgOS rule (ids L1–L10, D-ADR, RUL, seeds), links pkm itself at the same tag and never depends on the documentation component | agent-context-engine spec 1, 2; plan `261125-1631-agent-context-engine` (ACE-D6) |
| F10 | Stale after the context engine landed: documentation spec section 2 ("a future area"), section 5 row A3, section 6.1 item 1 (rules as documentation claims), section 8 row "Agent Context Engine ... none"; write-door spec 11 item 1 ("the existing instruction registry renders it", "`fgos setup`") | those sections |
| F11 | No entry document links to the build order: proposal section 0 table and 9.2, H1 plan 12.1, `docs/reading-map.md`, intent ledger PF-I006 | grep, 2026-11-27 |
| F12 | Knowledge and doc verbs stay in Node until step S7 of the Rust verb migration | `plans/261114-2051-rust-verb-migration-program/plan.md` S7 row |
| F13 | The context engine work raised the shared pkm pin to `v0.7.1` for both crates; the documentation specs still name `v0.7.0` as the current pin | `packages/documentation/rust/Cargo.toml`, `packages/agent-context-engine/rust/Cargo.toml`; `acb2a6efa` |

## Decisions (planner, inside the owner's 2026-11-24 frame)

- **D1. The core door is a shared procedure on existing verbs, not a new verb.** `core/skills/_shared/write-door.md`
  holds the steps; any skill in any domain follows it; it calls `fgos doc locate`, `fgos knowledge attest`,
  `fgos submit` and `fgos knowledge handoff`. Reasons: F7 makes the door a skill and leaves the full skill to step 5;
  F12 means a new Node verb would be migrated again in S7; RUL104 and L10. Rejected: a new `fgos doc write` verb that
  edits prose and writes registry events (a second door beside attest and handoff; Rust cannot write the Work store
  before S7).
- **D2. The writer's decision is recorded on the registry events it already writes.** Grow: `fgos knowledge attest`
  takes an optional `--locate-file` in the handoff's locate shape and records it with `decision: grow`. Create and
  no-place: `capture.handoff` already holds the locate result and gains the `decision` value. No new Observe kind;
  the observer (step 6) joins these with `fgos.doc.locate` records. The locate file stays optional, so existing
  callers and replay are unchanged.
- **D3. A claim whose carrier is outside the registry** (locate returns a platform document section that already
  states it): the retrospective writer records a non-engine decision naming the section (`path#heading`) that
  carries the claim and why the item adds nothing to it. That is a real judgement, which the gate already accepts;
  no new evidence kind. A composite document is grown only when the item changes what it states, through its own
  edit and the check command.
- **D4. The refusal at `topic register` / `doc reserve` stays with admission (step 4)** (F6). The procedure forbids
  those verbs for a writer; the code check comes with admission's effect checks.
- **D5. The pointer line is a context-engine rule unit**, `core/instructions/documentation-door.md`, written and
  checked through the engine's door (F8), not a block appended by hand. This amends write-door 11 item 1.
- **D6. Rules belong to the context engine; H2 keeps claims in documents.** Documentation spec 6.1 item 1 is
  rewritten: a rule with an id is held and checked by the context engine; documentation links to it and never
  restates it. Both link pkm at one tag; a pin raise moves both together.

## Acceptance criteria

1. `node --test test/state/knowledge-registry.test.mjs` passes, including a case where `fgos knowledge attest` with a
   locate file records the locate result and `decision: grow`, and a case where attest without one replays as before.
2. `core/skills/_shared/write-door.md` exists, and `domains/coding/skills/fgos-coding-knowledge/SKILL.md` has no
   `rg ` search and points to it; `npm run build:skills` leaves no diff.
3. `fgos internal context-engine check --protocol 1 --paths core/instructions/documentation-door.md` (the door the
   pre-commit hook calls) returns no refusal, and `.fgos/instructions/effective/rules.json`, compiled by
   `fgos internal context-engine compile --protocol 1`, contains the rule `documentation-door`.
4. `rg -n "future area|instruction registry renders" docs/platform/documentation` returns nothing;
   `node scripts/doc-health.mjs` passes on `docs/platform/**`.
5. The build order table in documentation spec section 4 has a plan column; the proposal (section 0 and 9.2), the
   H1 plan (12.1), `docs/reading-map.md` and ledger row PF-I006 each link to it.
6. A report at `fgos convention path --kind report --slug h2-step2-topics-per-retrospective-item` gives the
   baseline and the after count of new topics per retrospective item, with the queries used.
7. `npm test` and `cargo test --workspace` are green on the merged tree, apart from tests that fail the same way on
   `main`.

## Non-goals

- The code refusal at `topic register`, `doc reserve`, `doc register` (admission, step 4; D4).
- The admission reviewer, frame and ceiling (step 4). A request waits like any proposed item.
- The full documentation skill and live templates (step 5).
- Merging the 479 story documents into claim units (observer, step 6).
- Any change to `fgos doc locate`, the pkm pin, or the context engine's code.
- Moving knowledge verbs to Rust (S7 of the Rust verb migration).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Shared write-door procedure `core/skills/_shared/write-door.md` | `write-door` | Content of the write-door subcomponent; step 5 grows it into the skill |
| `--locate-file` and `decision` on `doc.attest`, `decision` on `capture.handoff` | `learning-docs-registry` | Additive event fields in the knowledge-registry contract (`docs.work-state/knowledge-registry`); replay unchanged |
| Pointer rule unit `documentation-door` | `agent-context-engine` | The engine holds and checks the unit; its wording is owned by `write-door` (write-door spec 8) |
| Rule-versus-claim boundary sentence in documentation spec 6.1 | `documentation` | Spec text only; no model change |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Attest records the locate result and the grow decision](phase-01-attest-records-locate-and-decision.md) | - | src/state/knowledge-registry.mjs, bin/fgos.mjs, src/cli/command-registry.mjs, test/state/knowledge-registry.test.mjs, docs/platform/work-state/contracts/knowledge-registry.md | 1 | draft |
| 2 | [Pointer rule unit through the context engine](phase-02-pointer-rule-unit.md) | - | core/instructions/documentation-door.md, .fgos/instructions/effective/** | 1 | draft |
| 3 | [Specs after the context engine, and links to the build order](phase-03-spec-corrections-and-links.md) | - | docs/platform/documentation/spec.md, docs/platform/documentation/subcomponents/write-door/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md, docs/platform/proposals/documentation-system-unification.md, docs/platform/intent-preservation-ledger.md, docs/reading-map.md, plans/260925-documentation-authority-unification/plan.md | 1 | draft |
| 4 | [Shared write-door procedure; the knowledge skill calls it](phase-04-shared-procedure-and-knowledge-skill.md) | 1 | core/skills/_shared/write-door.md, domains/coding/skills/fgos-coding-knowledge/SKILL.md, .agents/skills/_shared/write-door.md, .agents/skills/fgos-coding-knowledge/SKILL.md, .claude/skills/fgos-coding-knowledge/SKILL.md, plugins/fgOS/skills/_shared/write-door.md, plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md, docs/platform/documentation/operations/how-a-document-is-written.md | 2 | draft |
| 5 | [Integrate, land, retire the draft plan](phase-05-integrate-and-land.md) | 1, 2, 3, 4 | CHANGELOG.md, changelog.d/**, docs/platform/documentation/spec.md, docs/platform/documentation/subcomponents/write-door/spec.md, docs/platform/documentation/subcomponents/document-identity/spec.md, plans/261113-0124-docos-retrospective-claim-units/plan.md, plans/backlog/p-ixrbglli5o-the-retrospective-writer-opens-a-new-topic-for.md, plans/backlog.md | 3 | draft |
| 6 | [Measure topics per retrospective item](phase-06-measure-topics-per-item.md) | 5 | plans/261127-1003-h2-step2-core-write-door/reports/** | 4 | draft |

Phases 1, 2 and 3 share no file and run at once. Phase 4 needs phase 1's flag. Phase 5 merges and runs the full gate;
it also writes the implementation-alignment rows of the three documentation specs, which phase 3 leaves untouched
(a later wave, so the shared spec files are not written twice at once). Phase 6 needs the landed and activated release, because the
retrospective loop runs the activated skill.

Footprint check: phases in one wave share no path (checked by reading; `fgos resource-check --plan` runs before
`ready`). Cross-plan: `.fgos/instructions/effective/**` is written by `261127-0144` and `261127-0151`;
`src/cli/command-registry.mjs` by `261127-0143` and `261127-0151`; `docs/reading-map.md` by `261127-0016`;
`changelog.d/**` by `261126-2324`. All five are in `blockedBy`. Hot files: the compiled rule set (phase 2 only),
the generated skill copies (phase 4 only), the changelog and backlog (phase 5 only).

Capability: phases 1, 2 and 4 are `code:implement`; phase 3 is `code:implement` (documentation edit); phase 5 is
`code:review` plus the land; phase 6 is `code:test` on real items.

## Owner questions

None open. D1 (procedure, not a new verb) and D3 (a carrier outside the registry is recorded as a decision) are the
planner's calls inside the 2026-11-24 frame; the owner may overturn either before `ready`.

## Risks and rollback

- **Locate not ready** (index building, model missing): the procedure runs `fgos doc index status --wait` and, if
  the answer stays `partial`, says so in the handoff or decision instead of guessing. Proof point for validating:
  run locate on one real retrospective draft from the current pool.
- **Grow into the wrong unit** (the trial's remaining error): additive evidence, reversible by the observer.
- **The pointer unit trips the nearest-rule check** against an existing rule: phase 2 reads the advisory candidates
  and declares a relation or rewords; never bypasses the hook.
- **Generated skill copies drift** if another plan regenerates at the same time: the changelog/skill-surface plan is
  in `blockedBy`.
- **Rollback:** revert the phase 4 commit and the knowledge skill returns to `rg`; attest's locate field stays
  readable (an optional field, never required). Revert the phase 2 commit and recompile to remove the pointer line.
