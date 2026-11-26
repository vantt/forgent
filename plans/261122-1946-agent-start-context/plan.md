---
contract: plan-v1
title: "Agent Start Context: one composer for the text every fgOS-started agent receives"
status: running
lead: session:fg-server-claude-2026-11-27
priority: P1
blockedBy:
  - 261122-2108-delete-dead-node-execution-closure
  - 261124-0004-heads-operate-without-owner
  - 261125-1631-agent-context-engine
  - 261125-2041-gather-fgos-rules-to-one-owner
  - 261126-1851-ace-when-keys-v2
base: 4f44bb780d5e65ac42d6f554d4bbe3731565bf5c
footprint:
  - plans/261122-1946-agent-start-context/**
  - docs/platform/agent-start-context/**
  - packages/agent-start-context/**
  - docs/reading-map.md
  - docs/platform/governance.md
  - docs/platform/system-overview/spec.md
  - docs/platform/component-boundary.md
  - docs/platform/architecture-map.md
  - docs/platform/README.md
  - packages/component-authority/model/**
  - Cargo.toml
  - Cargo.lock
  - apps/fgos/Cargo.toml
  - apps/fgos/src/wiring/start_context.rs
  - apps/fgos/src/wiring/start_context/**
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/observe_declarations.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/tests/start_context.rs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - test/architecture.test.mjs
  - src/session-host/head-start.mjs
  - src/session-host/head-plan.mjs
  - test/session-host/head-start.test.mjs
  - test/session-host/head-plan.test.mjs
  - src/native/execution-door.mjs
  - test/native/execution-door.test.mjs
  - src/runner/agent-definitions.mjs
  - test/runner/agent-definitions.test.mjs
  - scripts/project-agents.mjs
  - .claude/agents/**
  - packages/execution/contracts/execution-routes/**
  - packages/execution/engine/src/assignment/**
  - packages/execution/engine/src/transport_round/session_attempt.rs
  - packages/execution/engine/tests/**
  - apps/fgos/src/wiring/execution_routes.rs
  - apps/fgos/src/wiring/unit_run_host/**
  - src/setup/instruction-projections.mjs
  - test/setup/instruction-projections.test.mjs
  - core/instructions/**
  - components/*/instructions/**
  - domains/*/instructions/**
  - .fgos/instructions/effective/**
  - packages/session-host/rust/src/rotation/**
  - packages/session-host/rust/tests/**
  - apps/fgos/src/wiring/session_rotation_hook.rs
  - src/session-rotation/rotate.mjs
  - src/session-rotation/handoff-store.mjs
  - test/session-rotation/rotate.test.mjs
  - AGENTS.md
  - test/docs/**
  - packages/distribution/contracts/agent-hooks.v1.json
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/rust/tests/goldens/agent-hooks-vectors.json
  - test/setup/agent-hooks.test.mjs
  - core/config-standard/startContext.yaml
  - core/config-schema/startContext.schema.yaml
  - CHANGELOG.md
source:
  - plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md
  - plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md
  - p-25q7tz6jtt
created: 2026-11-22
---

# Agent Start Context

> **Runs on the fg-server machine (owner order, 2026-11-26).** This plan is worked only on fg-server. No agent on fg-server2 or any other machine starts, restarts, admits, closes or lands work for it; on fg-server2 a `plan-no-progress`, `head-gone` or `leadLive: false` for it is expected and is marked handled with no action.

## Outcome

Every agent fgOS starts gets its persona and opening text from one composer, the tier-3 Rust crate **Agent Start
Context** (ASC-D1). ASC and the Agent Context Engine (ACE) are two components joined by a contract, not one component
in slices (ACE-D1); the 2026-11-22 approval that called ASC "the first slice of ACE"
([reports/owner-approval-ace-boundary.md](reports/owner-approval-ace-boundary.md)) is superseded by ACE-D1 and kept
as a record. The dependency order is ACE ← ASC ← packaging-distribution (ACE-D2). ACE stores every rule and hands ASC
one checked effective rule set with a digest; ACE owns the `when:` key registry (ACE-D5, ASC-D9). ASC is the only
selector: it fills fact values from live data, matches `when:`, gathers contributor context and returns ordered
blocks (ASC-D8). This covers heads, workers, the `.claude/agents` files, sessions opened by hand on CLIs with hooks
(ASC-D3), and the AGENTS.md block `fgos setup` writes. Each caller passes typed facts, payloads and a delivery to
`compose` (ASC-D5). It gets back ordered blocks or a named refusal. Live context enters through registered
contributors (ASC-D6). The persona, ritual, on-wake and opening producers (four today, plus a duplicated claim render)
become one, and a test enforces that. Execution keeps rendering its assignment block and passes it in as a payload;
the objective templates move later with the runner item (P14 part 2, backlog `p-gd3rm7rbvw`). Each start writes one
Observe record with the rules it matched and the bytes per block. The fgOS-owned part of AGENTS.md shrinks to the
standing sheet that passes the L8 test.

Prior art, read in the discussion and checked again on `2c27d499a` (refresh report:
`plans/reports/planner-261125-1109-asc-plan-refresh-against-main.md`) and on `4f44bb780` for this revision:
- **Reused:**
  - ACE's effective rule set and reader (`packages/agent-context-engine/`, plan `261125-1631-agent-context-engine`
    phase 3), which replaces the Node instruction registry as the source of rules; ACE's `ValueSource` adapter for
    live fact values;
  - the contract layout of `packages/questions/contracts/` (input schema plus `refusals.v1.json`);
  - persona data in `core/agents/*.yaml`; `lead`, `planner` and `supervisor` already carry `on_wake`;
  - the engine's `PromptPort` (`packages/execution/engine/src/assignment/builder.rs:34`), which keeps its trait;
  - Observe's record door (`packages/observe/rust/src/record/store/door.rs`, kinds declared through
    `apps/fgos/src/wiring/observe_declarations.rs`) as the `RecordSink` target;
  - the SessionStart rows in `packages/distribution/contracts/agent-hooks.v1.json` and the native verb
    `fgos hook session-rotation --event session-start` (`apps/fgos/src/wiring/session_rotation_hook.rs`);
  - `fgos authority declare` for the new component and contract rows (component authority spec §3.2).
- **Missing, and built here:** an owner of start text, the matcher of `when:` facts, a per-start record kind, a
  contributor port, and a guard that allows only one producer.
- **Slice 0 (the dead Node dispatch mirror) is no longer this plan's.** Plan `261122-2108-delete-dead-node-execution-closure`
  (running) deletes all seven files of the old phase 1 together with the rest of the dead closure, answering backlog
  row `p-24xw2cwdvo`. Phases that write its files wait for it to be `done` (see "Waits on other plans").

## Acceptance criteria

1. `docs/platform/agent-start-context/spec.md` names the crate's owner, its tier and its contracts, and states the
   ACE/ASC contract of ACE-D5. The files
   `packages/agent-start-context/contracts/{start-request,start-context,start-contributors,refusals}.v1.json` exist
   with golden vectors; fact keys are ACE's (`packages/agent-context-engine/contracts/when-keys.v1.json`), and
   `start-request.v1.json` says which of them each start kind must supply. The component and its contracts are rows
   of `packages/component-authority/model/`. Proof: `cargo test -p fgos-agent-start-context` and
   `fgos authority render --check` (phases 2, 3 and 6).
2. The dead Node dispatch mirror is gone: plan `261122-2108-delete-dead-node-execution-closure` is `done` (its
   acceptance criteria 1 and 2) before phase 5 starts.
3. `rg -n "openingText|FIRST_STEPS|renderOnWake|renderPersonaSection" src scripts` prints nothing. The persona
   rendering in `apps/fgos/src/wiring/unit_run_host/persona.rs` (`persona_section`, line 310) is gone.
   `scripts/project-agents.mjs` renders no text of its own. `render_agent_result_claim_instructions` has one
   production caller (today two: `builder.rs:887`, `brief.rs:351`) (phase 5).
4. `node scripts/run-tests.mjs test/architecture.test.mjs` includes a case that fails when a second persona, ritual,
   on-wake or opening producer appears (phase 5).
5. The golden openings in `packages/agent-start-context/goldens/` (head and agent-file cases captured in phase 4,
   worker cases captured at the start of phase 5) match the composer output for every persona. Only three
   differences are allowed, each listed in the golden's notes: the domain is filled in, the preamble is worded for
   heads, and the handoff appears once (phases 4, 5 and 7).
6. Each `compose` call writes one Observe record (a declared `start-context` kind) that lists its facts, the rule
   set digest, the matched rule ids and the bytes per block. `plans/261122-1946-agent-start-context/reports/start-token-table.md`
   gives the before and after tokens per start for each head persona and each worker operation, including the
   always-loaded AGENTS.md bytes (phases 4, 6 and 11).
7. `compose` refuses a start request with a fact key that is not in ACE's registry or a value of the wrong type
   (phase 3, against ACE phase 1's `when-keys` vectors), a value the live source does not allow, and a rule set whose
   digest or version does not verify (phase 6, through ACE's reader and `ValueSource`)
   (`cargo test -p fgos-agent-start-context`). Refusing a bad `when:` in a rule unit is ACE's criterion 4.
8. The setup-time projection (`src/setup/instruction-projections.mjs`) gets its rules from `compose` with standing
   facts and the file delivery, and ACE's interim filter is gone (phase 6).
9. The rotation handoff reaches a successor through one channel only, the session-host contributor. The successor
   golden shows the handoff once (phase 7).
10. The fgOS-owned sections of AGENTS.md pass the L8 placement test, and the RUL11 and RUL104 anchor tests in
    `test/docs/` stay green. A SessionStart hook composes context for hand-opened sessions on claude, codex and agy,
    defaulting to the entry persona (phases 9 and 10).
11. `npm test` and `cargo test --workspace` are green on the merged tree (phase 11).

## Non-goals

- External text: the AgentKit, GitNexus and MDView blocks, and AgentKit's `.claude/rules` (ASC-D2).
- The rule store, rule checks, the `when:` key registry, and resolving duplicate or conflicting rules: ACE's
  (ACE-D2, ACE-D4, ACE-D5; plans `261125-1631` and `261125-2041` for the gathering).
- Changing what any persona or doctrine says. Text moves without being rewritten. The only exceptions are the three
  fixes in criterion 5.
- The decision component for fixed-option judgments (P12) and the entry-persona UX flow (P13). Both are separate
  items (ASC-D4). This plan reads only the `startContext.entryPersona` config value.
- Merging the two engine entry ops `launch-session` and `run-unit` (item C).
- The runner item (P14, backlog `p-gd3rm7rbvw`). Its part 2 (the operation step and its objective templates:
  `src/runner/prompt-templates/*.txt`, `src/runner/work-compat.mjs` `buildPrompt`, `core/prompt-templates`,
  `packages/execution/engine/src/contract/templates.rs`) waits for this plan's phase 5, so that its templates move
  only once, straight into ACE units.
- Classifying a head's domain. Phase 8 reads the domain wherever the bound item already carries it. The domain
  field on backlog rows, plans and discussions belongs to the secretary (P10) and may be settled by the open item
  component discussion `ds-ubqlutna6r`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 2 | [Area spec and v1 contracts](phase-02-spec-and-contracts.md) | - | docs/platform/agent-start-context/**, packages/agent-start-context/contracts/** | 1 | done |
| 4 | [Golden openings and before-bytes from today's code](phase-04-golden-openings.md) | - | packages/agent-start-context/goldens/**, plans/261122-1946-agent-start-context/reports/before-bytes.md | 1 | done |
| 3 | [The pure composer crate and its ports](phase-03-crate-and-host-door.md) | 2 | packages/agent-start-context/rust/**, Cargo.toml, Cargo.lock | 2 | done |
| 6 | [Join ACE: host door, rule set and fact values, registration, projection through `compose`](phase-06-when-facts-one-matcher.md) | 3 | packages/agent-start-context/rust/**, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/wiring/start_context.rs, apps/fgos/src/wiring/start_context/**, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/routing.rs, apps/fgos/tests/start_context.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/component-authority/model/**, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/reading-map.md, src/setup/instruction-projections.mjs, test/setup/instruction-projections.test.mjs | 3 | done |
| 5 | [Every start-text producer moves to the composer](phase-05-move-producers.md) | 4, 6 | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, src/native/execution-door.mjs, test/native/execution-door.test.mjs, src/runner/agent-definitions.mjs, test/runner/agent-definitions.test.mjs, scripts/project-agents.mjs, .claude/agents/**, core/instructions/**, .fgos/instructions/effective/**, packages/execution/contracts/execution-routes/**, packages/execution/engine/src/assignment/**, packages/execution/engine/src/transport_round/session_attempt.rs, packages/execution/engine/tests/**, apps/fgos/src/wiring/execution_routes.rs, apps/fgos/src/wiring/unit_run_host/**, test/architecture.test.mjs, packages/component-authority/model/doors/**, docs/platform/component-boundary.md, packages/agent-start-context/goldens/**, packages/agent-start-context/rust/tests/** | 4 | done |
| 7 | [The rotation handoff is the first contributor](phase-07-handoff-contributor.md) | 5 | packages/session-host/rust/src/rotation/**, packages/session-host/rust/tests/**, apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/start_context/**, packages/agent-start-context/contracts/start-contributors.v1.json, src/session-rotation/rotate.mjs, src/session-rotation/handoff-store.mjs, test/session-rotation/rotate.test.mjs, packages/agent-start-context/goldens/** | 5 | draft |
| 9 | [AGENTS.md cut to the standing sheet (L8)](phase-09-agents-md-cut.md) | 5, 6 | AGENTS.md, core/instructions/**, components/*/instructions/**, domains/*/instructions/**, .fgos/instructions/effective/**, test/docs/** | 5 | draft |
| 8 | [A head's domain fact comes from its bound item](phase-08-head-domain-fact.md) | 7 | src/session-host/head-plan.mjs, test/session-host/head-plan.test.mjs, src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, packages/agent-start-context/goldens/** | 6 | draft |
| 10 | [SessionStart hook for hand-opened sessions](phase-10-hand-opened-hook.md) | 7 | apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/start_context/**, packages/host-runtime/contracts/command-manifest.json, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/tests/goldens/agent-hooks-vectors.json, test/setup/agent-hooks.test.mjs, core/config-standard/startContext.yaml, core/config-schema/startContext.schema.yaml | 6 | draft |
| 11 | [Integration gate, token table, changelog](phase-11-integration.md) | 2, 3, 4, 5, 6, 7, 8, 9, 10 | CHANGELOG.md, plans/261122-1946-agent-start-context/reports/** | 7 | draft |

The old phase 1 (delete the dead Node dispatch mirror) is removed: plan `261122-2108-delete-dead-node-execution-closure`
does it (criterion 2). Phase ids keep their numbers so links from the discussion and reports stay valid. All phases
are `draft`: none is admitted until the owner's deep discussion of this plan (team-lead, 2026-11-25).

### Progress (fg-server, 2026-11-27)

Started on the owner's instruction of 2026-11-27 00:0x ("hoàn tất ... 261122-1946-agent-start-context"), which is taken
as the go-ahead the note above waited for. Phases 2, 3, 4 and 6 are `done` on branch `agent-start-context/p02`:
the spec and v1 contracts with vectors; the pure crate with its ports, its two adapters onto the agent context engine
and its vector tests; the goldens of today's head openings and agent files with `before-bytes.md`; the host door
`fgos internal start-context compose`, the `fgos.start.context` Observe record, the component and contract rows, and
the setup projection selecting through the door. Phase 6 also edited three units outside its listed footprint
(`domains/coding/instructions/coding-worktree-safety.md`, `coding-verification-discipline.md` and
`components/packaging-distribution/instructions/docs-only-verification.md`): each now says `when: {domain: [coding]}`,
so selection by `when:` needs no scope filter and the AGENTS.md block stays byte-identical.

Phase 5 has one design point the phase file does not cover: today's head opening interleaves text that depends on
which payloads are present (the first ritual line differs with and without a handoff; a persona's first step shows
only when a task is bound; the task section precedes the ritual). The composer therefore owns a head-opening layout,
with the ritual and first steps as rule units; the persona block renderer is already in the crate
(`src/persona.rs`). After this land the activated release must carry the door, because `npm run build:skills` now
asks it for the setup selection.

Phase 5 is `done` on branch `agent-start-context/p05`. Every start-text producer now goes through the crate:
- head openings: the Node head start sends a StartRequest to the door;
- worker persona blocks: the host renders them through `persona_section`;
- agent files: `scripts/project-agents.mjs` asks the door with delivery `agent-file`.

The door row `compose-start-text` names the crate as the only holder of that text. The goldens are owned by
`rust/tests/goldens.rs` (20 openings and 18 agent files, byte for byte), and the recorder is retired. Three
deviations from the phase file are recorded in its Result section; one of them is backlog row `p-menbgsmgoc`.


Phase 6 now runs before phase 5 (ids kept): phase 6 is the one place ASC joins ACE phase 3, so the producers move
onto a composer that already reads ACE's rules. Phase 8 runs after phase 7 because both update the goldens.

### Join points with ACE and the gathering (owner, 2026-11-25 20:4x)

ACE phase 1 runs first and alone. Then ASC, ACE and later the gathering run in parallel, joined only at three points.
The phase table lists only in-plan ids; these are the cross-plan waits:

| ASC phase | waits for | data it needs |
|---|---|---|
| 2 (and 4) | ACE phase 1 | the spec and `start-request.v1.json` cite ACE's `when-keys.v1.json` and `effective-rules.v1.json`; phase 4 needs nothing from ACE but starts after ACE 1 because ACE 1 runs alone |
| 6 | ACE phase 3 | ACE's reader, `when_keys` and host `ValueSource`, `rules.json`, and the interim filter to delete |
| 9 | plan `261125-2041-gather-fgos-rules-to-one-owner` (`done`) | every AGENTS.md rule section is already a unit; phase 9 only sets `when:` by L8 |

Every other ASC need on ACE fits these three points, checked edge by edge:

| ASC phase | earlier data edge | now |
|---|---|---|
| 3 | ACE 3 (reader, `ValueSource`) | needs ACE 1 only: the crate is tested with ACE 1's vectors; the reader, `ValueSource`, host door and registration moved to phase 6 |
| 5 | ACE 3, 4, 5 | ACE 3 through in-plan phase 6 (5 depends on 6). ACE 4 is not needed: phase 5 runs ACE 3's `check` op itself, and ACE 4's pre-commit check, when landed, only adds the nearest-rule refusal. The gathering is not needed: it takes the ritual units as part of its corpus if they land first |
| 6 | ACE 3 | owner join point |
| 9 | ACE 5 (now the gathering) | owner join point |
| 11 | ACE 6 (`CHANGELOG.md`) | ACE 6 is before the gathering (its `blockedBy`), and the gathering before phase 9, so it is already ordered |

No extra join point is needed for data. The shared files of phases that can now run at the same time are listed under
"Hot files"; their resolution, and the plan-admission limit on running overlapping plans side by side, are in the
recut report `plans/reports/planner-261125-2038-ace-asc-plan-recut.md` (owner questions A and B).

Who moves which text, so that each piece moves once: the gathering plan moves AGENTS.md's rule sections and every
duplicate copy; this plan's phase 5 moves the ritual and `FIRST_STEPS` out of code into ACE units; this plan's phase 9
moves no text and only scopes units by L8.

### Waits on other plans

The plan stays `draft`: the owner wants a deep discussion of it before anything starts (team-lead, 2026-11-25).

| phase | waits for | shared files |
|---|---|---|
| 2, 4 | ACE phase 1 | (paths cited, no shared file) |
| 6 | ACE phase 3 | the ACE crate, `rules.json`, `context_engine/**`, `instruction-projections.mjs` |
| 9 | `261125-2041` (gathering) | `AGENTS.md`, unit roots, `.fgos/instructions/effective/**`, `test/docs/**` |
| 6 | `261122-2108` | `packages/component-authority/model/**`, `docs/reading-map.md`, `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md` |
| 6 | `261124-0004` | `apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`, `command-routes.json`, `Cargo.lock`, three `model/doors/*.yaml` |
| 5 | `261122-2108` | `apps/fgos/src/wiring/unit_run_host/**`, `packages/execution/contracts/**`, `test/session-host/head-start.test.mjs`, `test/runner/agent-definitions.test.mjs`, `test/architecture.test.mjs`, `model/**` |
| 5 | `261124-0004` | `src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`, `.claude/agents/{secretary,supervisor}.md`, `unit_run_host/session_attempt.rs` |
| 7-11 | phase 5 | (inside this plan) |

`blockedBy` names `261122-2108` and `261124-0004` because phases 5 and 6 cannot start before them. It also names the
ACE and gathering plans: the owner chose to run the three plans one after another, ACE then the gathering then ASC
(2026-11-25 21:0x), because the supervisor admits only whole plans with disjoint footprints and `fgos resource-check`
over the three plans together gives 12 layers in parallel against 14 in sequence. The phase-level waits in the table
above stay as the data edges, for when a phase-level admission exists. Two running plans without a frontmatter
footprint also edit shared files at row level, so a later phase rebases over them: `261114-2051-rust-verb-migration-program`
phase 11 (`AGENTS.md` legacy-Node paragraph, `docs/reading-map.md` line 144) and the draft
`261122-2110-coach-agent-and-observe-views` (`core/agents/**`, `routing.rs`, `wiring/mod.rs`; whichever starts second
rebases).

### Hot files, one writer per wave

Inside this plan:
- `packages/agent-start-context/rust/**`: phase 3 (wave 2), phase 6 (wave 3), phase 5 (wave 4, `tests/**`).
- `Cargo.lock`: phase 3 (wave 2), phase 6 (wave 3).
- `packages/component-authority/model/**` and `docs/platform/component-boundary.md`: phase 6 (wave 3), phase 5
  (wave 4, `doors/**` and the re-rendered boundary table).
- `test/architecture.test.mjs`: phase 5 only.
- `apps/fgos/src/wiring/start_context/**`: phase 6 (wave 3), phase 7 (wave 5), phase 10 (wave 6).
- `packages/host-runtime/contracts/command-manifest.json`: phase 6 (wave 3), phase 10 (wave 6).
- `apps/fgos/src/wiring/session_rotation_hook.rs`: phase 7 (wave 5), phase 10 (wave 6).
- `src/session-host/head-start.mjs` and its test: phase 5 (wave 4), phase 8 (wave 6).
- `packages/agent-start-context/goldens/**`: phase 4 (wave 1), phase 5 (wave 4), phase 7 (wave 5), phase 8 (wave 6).
- `core/instructions/**`, `.fgos/instructions/effective/**`: phase 5 (wave 4), phase 9 (after the gathering).
- `CHANGELOG.md`: phase 11 only.

Across plans, the phases that can run at the same time and share a file:

| ASC phase | other phase | shared files | resolution |
|---|---|---|---|
| 3 | ACE 3 | `Cargo.toml` (one `members` line), `Cargo.lock` | the second to land rebases, re-adds its `members` line and regenerates `Cargo.lock` with cargo; never merged by hand (owner question A) |
| 5 | gathering phase 1 | `core/instructions/**` (new ritual and first-step files only), `.fgos/instructions/effective/**`, `.claude/agents/**`, `packages/agent-start-context/goldens/**` | different files or generated files; the second to land regenerates the set, the agent files and the touched goldens; a restated rule is refused by ACE's check for the second lander (owner question A) |
| 7, 8 | gathering phase 1 | `packages/agent-start-context/goldens/**` | as above |

`.claude/agents/**` is generated by `scripts/project-agents.mjs`. It is regenerated in phase 5, never merged by
hand. The governance holder table, the system-overview area map and shared entities, `component-boundary.md`,
`architecture-map.md` §6-7 and `docs/platform/README.md` are generated from the component authority model; phases 5
and 6 change them only through `fgos authority declare` / `fgos authority render`.

## Authority map

Rows checked against `packages/component-authority/model/` on 2026-11-25. The rule store, the `when:` key registry
and the effective rule set are not this plan's: the ACE plan (`261125-1631`) declares component
`agent-context-engine`, and this plan only reads its contracts.

| New or moved thing | Model row | Note |
|---|---|---|
| The composer `compose`, its ports (`RuleSet`, `FactRegistry`, contributors, `RecordSink`), the host door `fgos internal start-context compose`; contracts `start-request`, `start-context`, `start-contributors`, `refusals` (each declared with `--kind contract`, provider `agent-start-context`, in phase 3) | `declare: component agent-start-context` | ASC-D1, tier 3. `fgos authority locate` finds no row for it (2026-11-25). |
| Persona, ritual, on-wake and opening text of heads (`FIRST_STEPS`, `renderOnWake`, `openingText` in `src/session-host/head-start.mjs`) | `session-host` | The text producer overlaps the new component; survivor: `agent-start-context` for start text; retired: the text producers in `src/session-host/head-start.mjs`. Session-host keeps starting and binding heads, and passes facts to `compose`. The ritual and first-step wording become ACE rule units in phase 5 (owner of the store: `agent-context-engine`, declared by plan `261125-1631`). |
| Persona rendering of workers (`persona_section` in `apps/fgos/src/wiring/unit_run_host/persona.rs`, `renderPersonaSection`) and the duplicate claim render | `execution-core` | The persona render overlaps the new component; survivor: `agent-start-context`; retired: `persona_section`, `renderPersonaSection`, the second caller of `render_agent_result_claim_instructions`. Execution keeps the assignment block and `PromptPort`, and passes the block to `compose` as a payload. |
| Persona definitions in `core/agents/*.yaml`, the agent listing | `runner`, `execution/agents.v1` | Unchanged owner: ASC reads the definitions; `scripts/project-agents.mjs` keeps writing `.claude/agents/**` but takes its text from `compose`. |
| Rule selection for the setup-time AGENTS.md block | `docs.packaging-distribution/instruction-composition-and-projection` | The selection half of the row overlaps the new component; survivor: `agent-start-context` for selection by facts (ASC-D8); retired: ACE's interim filter in `src/setup/instruction-projections.mjs`. Packaging-distribution keeps writing the host file. |
| The rotation handoff reaching a successor | `session-rotation`, `session-host/rotation-files.v1` | Unchanged owner of the handoff store and files; the handoff enters the start text only through a registered contributor (ASC-D6). |
| SessionStart hook rows for hand-opened sessions | `distribution/agent-hooks.v1` | Unchanged owner (`packaging-distribution`); phase 10 adds rows that call the host door. |
| The `start-context` record kind | `observe` | Unchanged owner of the record door; the kind is declared through `apps/fgos/src/wiring/observe_declarations.rs`. |
| The `startContext.entryPersona` key | `config` | New key in `core/config-standard` and `core/config-schema` (phase 10). |

## Owner questions

1. **Phase 6 scope (owner note 3, 2026-11-22): resolved by ACE-D5 and ASC-D9.** The owner settled that ACE owns the
   `when:` keys and that ASC fills the values and matches. The key list is fixed in ACE phase 1, and DOCOS is told
   when it lands (approval point 4). Phase 6 is now ASC's join with ACE phase 3 (owner, 2026-11-25 20:4x).
2. **Approval id for the component declaration** (shared with ACE owner question 1). `fgos authority declare --kind
   component` needs `--approved-by` naming an answered owner question
   (`packages/host-runtime/contracts/command-manifest.json:1048`). ASC-D1 was relayed as supervisor event
   `16707082c8c40dac`, not as a question. One answered question that records ASC-D1 and ACE-D3 serves both plans:
   asked as `q-5sog3pzmqn` (2026-11-25); phase 6 passes that id to `--approved-by` once it is answered.
3. **Where the RUL102 amendment lands: resolved.** ACE-D3 moves the registry out of packaging-distribution, so the
   RUL102 successor belongs to ACE phase 3, which records all three roles (ACE-D2). This plan no longer edits
   `docs/platform/packaging-distribution/spec.md`.
4. **Running the three plans side by side** (recut report owner question A, 2026-11-25). The supervisor admits only a
   whole `ready` plan whose footprint overlaps no `running` plan (`packages/supervision/rust/src/portfolio.rs:252-268`).
   This plan's footprint overlaps ACE's and the gathering's. **Resolved (owner, 2026-11-25 21:0x):** the plans run
   one after another, ACE then the gathering then ASC, through `blockedBy`.
5. **Shared files of phases that run at the same time** (recut report owner question B). **Moot** after answer 4:
   no ASC phase runs beside an ACE or gathering phase.

The other product decisions this plan needs are settled in ASC-D1 to ASC-D9 and ACE-D1 to ACE-D6. P10 (the domain
field on items) belongs to the secretary's item; phase 8 reads the domain wherever the bound item already carries it
and leaves the fact absent otherwise. No classifier is added here (ASC-D4).

## Risks and rollback

- **One composer is a single point of failure for every start, the secretary included.** The composer fails closed
  with a named refusal for a rule set that does not verify, and fails open (leaving the block out and recording that)
  for a broken contributor (ASC-D5, ASC-D6). Bad rules never reach it: ACE refuses them when they are written
  (ACE-D5). The golden openings for each persona are the owning proof (phases 4 and 5). Validating must name one
  proof point: a live `npm run fgos:dev -- session start planner` on the phase-5 tree.
- **No pkm at start.** The composer reads the compiled `rules.json` through ACE's reader, built without ACE's `store`
  feature; phases 3 and 6 check that `cargo tree -p fgos-agent-start-context` lists no `pkm-core` (ACE-D6).
- **Producers moved partway would mean three renderers again.** Phase 5 moves every persona and opening producer in
  one change (ASC-D7), and the one-producer architecture test lands with it.
- **Text drift during the move.** Head and agent-file goldens are captured from today's code in phase 4; worker
  goldens are captured by a host test as phase 5's first commit, before anything moves (the worker prompt is
  rendered only inside the `fgos` binary, which has no library target). Phase 5 re-runs the phase-4 recorder on its
  own base first: a persona file changed by another plan in between (for example `261124-0004` phase 1 edits
  `core/agents/secretary.yaml` and `supervisor.yaml`) is recaptured with the commit that changed it named in
  `NOTES.md`, never folded into the three allowed fixes.
- **Tier placement.** The crate sits at tier 3 and may depend only on crates at tier 3 or below; ACE is tier 3.
  Session-host (tier 3) calls it for the handoff contributor; it must never call Execution (tier 5).
- **Hand-opened sessions.** omp and pi have no hooks and still read only AGENTS.md. Codex cuts AGENTS.md at 32 KiB;
  the file is 50,860 bytes on `2c27d499a`, so everything after the first 32 KiB never reaches Codex. The standing
  sheet must hold for them (phase 9 checks it against L8).
- **Hook rows are opt-in today.** `agent-hooks.v1.json` carries rows only for projects that opted into the mailbox
  (`rowsMailboxOn`). Phase 10 says whether the start-context row joins that set or gets its own opt-in.
- **Cross-plan order.** The whole plan waits for ACE and the gathering (owner question 4). The gathering may park on
  conflict questions, which delays this plan as a whole; that is the accepted cost of running in sequence.
- **Footprint admission.** The plan stays `draft` until `261122-2108`, `261124-0004`, ACE and the gathering are
  `done`; only then does a ready flip pass the plan check and the supervisor admit it.
- **Rollback.** Each phase lands as its own commits through `fgos land`. Reverting a phase's commits restores the old
  producer, because each phase deletes its old path in the same commit that adds the new one. Phase 5 is the one
  large revert. Reverting it restores Node `openingText`, `persona.rs` rendering and `project-agents.mjs`, and
  `launch-session` takes `opening` again. Reverting phase 6 restores ACE's interim filter, not the Node composer.

Checks on this revision: `node scripts/plan-contract-check.mjs` and `fgos plan-lint` on this plan, and the
Authority map proven on a copy dated today; outputs in `plans/reports/planner-261125-2038-ace-asc-plan-recut.md`.
Critical path across the three plans: ACE 1 → ACE 2 → ACE 3 → ACE 4 → ACE 6 → gathering 1 → gathering 2 → ASC 9 →
ASC 11; ASC 2 → 3 → 6 → 5 → 7 → 8/10 runs beside it after ACE 1 (ASC 6 joining after ACE 3).

## Outstanding questions

See "Owner questions" 2, 4 and 5. Questions 1 and 3 are resolved by ACE-D3 and ACE-D5.
