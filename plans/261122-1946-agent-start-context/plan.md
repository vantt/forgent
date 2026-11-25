---
contract: plan-v1
title: "Agent Start Context: one composer for the text every fgOS-started agent receives"
status: draft
priority: P1
blockedBy:
  - 261122-2108-delete-dead-node-execution-closure
  - 261124-0004-heads-operate-without-owner
base: 2c27d499a142920788979ef8da6f2925f585a95e
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
  - docs/platform/packaging-distribution/spec.md
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
  - core/agents/**
  - packages/execution/contracts/execution-routes/**
  - packages/execution/engine/src/assignment/**
  - packages/execution/engine/src/transport_round/session_attempt.rs
  - packages/execution/engine/tests/**
  - apps/fgos/src/wiring/execution_routes.rs
  - apps/fgos/src/wiring/unit_run_host/**
  - src/setup/instruction-registry.mjs
  - src/setup/instruction-composition.mjs
  - src/setup/instruction-projections.mjs
  - test/setup/instruction-*.test.mjs
  - core/instructions/**
  - components/*/instructions/**
  - domains/*/instructions/**
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
  - p-25q7tz6jtt
created: 2026-11-22
---

# Agent Start Context

## Outcome

Every agent fgOS starts gets its persona and opening text from one composer, the tier-3 Rust crate **Agent Start
Context** (ASC-D1). ASC is the first slice of the Agent Context Engine (ACE) and its start-time door (owner approval,
[reports/owner-approval-ace-boundary.md](reports/owner-approval-ace-boundary.md)). This covers heads, workers, the
`.claude/agents` files, and sessions opened by hand on CLIs with hooks (ASC-D3). Each caller passes typed facts,
payloads and a delivery to `compose` (ASC-D5). It gets back ordered blocks or a named refusal. Rules enter as unit
files with `when:` facts through the existing instruction registry, and live context enters through registered
contributors (ASC-D6). The persona, ritual, on-wake and opening producers (four today, plus a duplicated claim render)
become one, and a test enforces that. Execution keeps rendering its assignment block and passes it in as a payload;
the objective templates move later with the runner item (P14 part 2, backlog `p-gd3rm7rbvw`). Each start writes one
Observe record with the units it matched and the bytes per block, so the token cost of a start can be measured. The
fgOS-owned part of AGENTS.md shrinks to the standing sheet that passes the L8 test.

Prior art, read in the discussion and checked again on `2c27d499a` (refresh report:
`plans/reports/planner-261125-1109-asc-plan-refresh-against-main.md`):
- **Reused:**
  - the instruction registry (`src/setup/instruction-registry.mjs:588` `discoverInstructionSources`, three roots,
    owners from the component authority model since `343984e07`, authority order at
    `src/setup/instruction-composition.mjs:66`, specificity at `instruction-registry.mjs:74-83`) as the `UnitSource`;
  - the contract layout of `packages/questions/contracts/` (input schema plus `refusals.v1.json`);
  - persona data in `core/agents/*.yaml`; `lead`, `planner` and `supervisor` already carry `on_wake`;
  - the engine's `PromptPort` (`packages/execution/engine/src/assignment/builder.rs:34`), which keeps its trait;
  - Observe's record door (`packages/observe/rust/src/record/store/door.rs`, kinds declared through
    `apps/fgos/src/wiring/observe_declarations.rs`) as the `RecordSink` target;
  - the SessionStart rows in `packages/distribution/contracts/agent-hooks.v1.json` and the native verb
    `fgos hook session-rotation --event session-start` (`apps/fgos/src/wiring/session_rotation_hook.rs`);
  - `fgos authority declare` for the new component and contract rows (component authority spec §3.2).
- **Missing, and built here:** an owner of start text, a fact registry, a per-start record kind, a contributor port,
  and a guard that allows only one producer.
- **Slice 0 (the dead Node dispatch mirror) is no longer this plan's.** Plan `261122-2108-delete-dead-node-execution-closure`
  (running) deletes all seven files of the old phase 1 together with the rest of the dead closure, answering backlog
  row `p-24xw2cwdvo`. Phases that write its files wait for it to be `done` (see "Waits on other plans").

## Acceptance criteria

1. `docs/platform/agent-start-context/spec.md` names the crate's owner, its tier and its contracts, and states the
   ACE/ASC boundary. The files
   `packages/agent-start-context/contracts/{start-request,start-context,start-facts,start-contributors,refusals}.v1.json`
   exist with golden vectors. The component and its contracts are rows of `packages/component-authority/model/`,
   and RUL102 plus the owner row of the composition contract name ACE as composer and ASC as its door. Proof:
   `cargo test -p fgos-agent-start-context` and `fgos authority render --check` (phases 2 and 3).
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
6. Each `compose` call writes one Observe record (a declared `start-context` kind) that lists its facts, the matched
   unit ids and the bytes per block. `plans/261122-1946-agent-start-context/reports/start-token-table.md` gives the
   before and after tokens per start for each head persona and each worker operation, including the always-loaded
   AGENTS.md bytes (phases 3, 4 and 11).
7. Units declare `when:` facts, and a build test refuses an unknown key or value:
   `node scripts/run-tests.mjs test/setup/instruction-when-facts.test.mjs` (phase 6, scope pending the owner, see
   "Owner questions").
8. The setup-time matcher (`src/setup/instruction-composition.mjs`) gets its selection from the composer through
   `fgos internal start-context compose` (phase 6).
9. The rotation handoff reaches a successor through one channel only, the session-host contributor. The successor
   golden shows the handoff once (phase 7).
10. The fgOS-owned sections of AGENTS.md pass the L8 placement test, and the RUL11 and RUL104 anchor tests in
    `test/docs/` stay green. A SessionStart hook composes context for hand-opened sessions on claude, codex and agy,
    defaulting to the entry persona (phases 9 and 10).
11. `npm test` and `cargo test --workspace` are green on the merged tree (phase 11).

## Non-goals

- External text: the AgentKit, GitNexus and MDView blocks, and AgentKit's `.claude/rules` (ASC-D2).
- Changing what any persona or doctrine says. Text moves without being rewritten. The only exceptions are the three
  fixes in criterion 5.
- The decision component for fixed-option judgments (P12) and the entry-persona UX flow (P13). Both are separate
  items (ASC-D4). This plan reads only the `startContext.entryPersona` config value.
- Merging the two engine entry ops `launch-session` and `run-unit` (item C).
- The runner item (P14, backlog `p-gd3rm7rbvw`). Its part 2 (the operation step and its objective templates:
  `src/runner/prompt-templates/*.txt`, `src/runner/work-compat.mjs` `buildPrompt`, `core/prompt-templates`,
  `packages/execution/engine/src/contract/templates.rs`) waits for this plan's phase 5, so that its templates move
  only once, straight into units.
- Classifying a head's domain. Phase 8 reads the domain wherever the bound item already carries it. The domain
  field on backlog rows, plans and discussions belongs to the secretary (P10) and may be settled by the open item
  component discussion `ds-ubqlutna6r`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 2 | [Area spec and v1 contracts](phase-02-spec-and-contracts.md) | - | docs/platform/agent-start-context/**, packages/agent-start-context/contracts/** | 1 | ready |
| 4 | [Golden openings and before-bytes from today's code](phase-04-golden-openings.md) | - | packages/agent-start-context/goldens/**, plans/261122-1946-agent-start-context/reports/before-bytes.md | 1 | ready |
| 3 | [The crate, its ports, the host door and its registration](phase-03-crate-and-host-door.md) | 2 | packages/agent-start-context/rust/**, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/wiring/start_context.rs, apps/fgos/src/wiring/start_context/**, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/routing.rs, apps/fgos/tests/start_context.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/component-authority/model/**, docs/platform/governance.md, docs/platform/system-overview/spec.md, docs/platform/component-boundary.md, docs/platform/architecture-map.md, docs/platform/README.md, docs/platform/packaging-distribution/spec.md, docs/reading-map.md | 2 | draft |
| 5 | [Every start-text producer moves to the composer](phase-05-move-producers.md) | 3, 4 | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, src/native/execution-door.mjs, test/native/execution-door.test.mjs, src/runner/agent-definitions.mjs, test/runner/agent-definitions.test.mjs, scripts/project-agents.mjs, .claude/agents/**, core/agents/**, packages/execution/contracts/execution-routes/**, packages/execution/engine/src/assignment/**, packages/execution/engine/src/transport_round/session_attempt.rs, packages/execution/engine/tests/**, apps/fgos/src/wiring/execution_routes.rs, apps/fgos/src/wiring/unit_run_host/**, test/architecture.test.mjs, packages/component-authority/model/doors/**, packages/agent-start-context/goldens/**, packages/agent-start-context/rust/tests/** | 3 | draft |
| 6 | [Units select by `when:` facts; one matcher](phase-06-when-facts-one-matcher.md) | 5 | src/setup/instruction-registry.mjs, src/setup/instruction-composition.mjs, test/setup/instruction-*.test.mjs, core/instructions/**, components/*/instructions/**, domains/*/instructions/** | 4 | draft |
| 7 | [The rotation handoff is the first contributor](phase-07-handoff-contributor.md) | 5 | packages/session-host/rust/src/rotation/**, packages/session-host/rust/tests/**, apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/start_context/**, packages/agent-start-context/contracts/start-contributors.v1.json, src/session-rotation/rotate.mjs, src/session-rotation/handoff-store.mjs, test/session-rotation/rotate.test.mjs | 4 | draft |
| 8 | [A head's domain fact comes from its bound item](phase-08-head-domain-fact.md) | 5 | src/session-host/head-plan.mjs, test/session-host/head-plan.test.mjs, src/session-host/head-start.mjs, test/session-host/head-start.test.mjs | 4 | draft |
| 9 | [AGENTS.md cut to the standing sheet (L8)](phase-09-agents-md-cut.md) | 6 | AGENTS.md, core/instructions/**, domains/coding/instructions/**, src/setup/instruction-projections.mjs, test/setup/instruction-projections.test.mjs, test/docs/** | 5 | draft |
| 10 | [SessionStart hook for hand-opened sessions](phase-10-hand-opened-hook.md) | 7 | apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/start_context/**, packages/host-runtime/contracts/command-manifest.json, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/tests/goldens/agent-hooks-vectors.json, test/setup/agent-hooks.test.mjs, core/config-standard/startContext.yaml, core/config-schema/startContext.schema.yaml | 5 | draft |
| 11 | [Integration gate, token table, changelog](phase-11-integration.md) | 2, 3, 4, 5, 6, 7, 8, 9, 10 | CHANGELOG.md, plans/261122-1946-agent-start-context/reports/** | 6 | draft |

The old phase 1 (delete the dead Node dispatch mirror) is removed: plan `261122-2108-delete-dead-node-execution-closure`
does it (criterion 2). Phase ids keep their numbers so links from the discussion and reports stay valid.

### Waits on other plans

Phases 2 and 4 write only the new area's spec, contracts and goldens. Neither touches a running plan's footprint
(checked on `2c27d499a` against every `ready` or `running` plan), so both are `ready` and can start now. The plan as a
whole stays `draft`: the owner wants a deep discussion of this plan before anything starts (team-lead, 2026-11-25),
and its footprint overlaps two running plans. Each other phase waits for the plans below to be `done`:

| phase | waits for | shared files |
|---|---|---|
| 3 | `261122-2108` | `packages/component-authority/model/**`, `docs/reading-map.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md` |
| 3 | `261124-0004` | `apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`, `command-routes.json`, `Cargo.lock`, three `model/doors/*.yaml` |
| 5 | `261122-2108` | `apps/fgos/src/wiring/unit_run_host/**`, `packages/execution/contracts/**`, `test/session-host/head-start.test.mjs`, `test/runner/agent-definitions.test.mjs`, `test/architecture.test.mjs`, `model/**` |
| 5 | `261124-0004` | `src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`, `core/agents/{secretary,supervisor}.yaml`, `.claude/agents/{secretary,supervisor}.md`, `unit_run_host/session_attempt.rs` |
| 6-11 | phase 5 | (inside this plan) |
| 11 | `261124-2320` | `CHANGELOG.md` (the whole-plan ready flip also overlaps it while it runs) |

Two running plans without a frontmatter footprint also edit shared files at row level, so a later phase rebases over
them: `261114-2051-rust-verb-migration-program` phase 11 (`AGENTS.md` legacy-Node paragraph, `docs/reading-map.md`
line 144) and the draft `261122-2110-coach-agent-and-observe-views` (`core/agents/**`, `routing.rs`, `wiring/mod.rs`;
whichever starts second rebases).

### Hot files, one writer per wave

- `packages/component-authority/model/**`: phase 3 (wave 2), phase 5 (wave 3, `doors/**` only).
- `test/architecture.test.mjs`: phase 5 only.
- `apps/fgos/src/wiring/start_context/**`: phase 3 (wave 2), phase 7 (wave 4), phase 10 (wave 5).
- `apps/fgos/src/wiring/session_rotation_hook.rs`: phase 7 (wave 4), phase 10 (wave 5).
- `packages/host-runtime/contracts/command-manifest.json`: phase 3 (wave 2), phase 10 (wave 5).
- `src/session-host/head-start.mjs` and its test: phase 5 (wave 3), phase 8 (wave 4).
- `core/instructions/**`: phase 6 (wave 4), phase 9 (wave 5).
- `packages/agent-start-context/goldens/**`: phase 4 (wave 1), phase 5 (wave 3).
- `CHANGELOG.md`: phase 11 only.

`.claude/agents/**` is generated by `scripts/project-agents.mjs`. It is regenerated in phase 5, never merged by
hand. The governance holder table, the system-overview area map and shared entities, `component-boundary.md`,
`architecture-map.md` §6-7 and `docs/platform/README.md` are generated from the component authority model; phase 3
changes them only through `fgos authority declare` / `fgos authority render`.

## Owner questions

1. **Phase 6 scope (owner note 3, 2026-11-22, still open).** The discussion covered only the door and injection,
   not rule choice. Phase 6's `when:` matcher goes further; its scope must be confirmed with the owner before phase
   6 is built. Options and a recommendation are in the refresh report, "Points to discuss with the owner".
2. **Approval id for the component declaration.** `fgos authority declare --kind component` needs `--approved-by`
   naming an answered owner question (`packages/host-runtime/contracts/command-manifest.json:1048`). The ASC/ACE
   approval of 2026-11-22 was relayed as supervisor event `16707082c8c40dac`, not as a question. Phase 3 needs a
   question id that records it.
3. **Where the RUL102 amendment lands.** The owner approved "amend RUL102 and the owner row of the composition
   contract in the same change" as the phase 2 spec. Both now sit in files the running deletion plan holds
   (`docs/platform/packaging-distribution/spec.md`, `packages/component-authority/model/**`). This plan moves the
   amendment into phase 3 so phase 2 can start now; the owner confirms or keeps it in phase 2 (phase 2 then waits).

The other product decisions this plan needs are settled in ASC-D1 to ASC-D7. P10 (the domain field on items) belongs
to the secretary's item; phase 8 reads the domain wherever the bound item already carries it and leaves the fact
absent otherwise. No classifier is added here (ASC-D4).

## Risks and rollback

- **One composer is a single point of failure for every start, the secretary included.** The composer fails closed
  with a named refusal for bad static data, and fails open (leaving the block out and recording that) for a broken
  contributor (ASC-D5, ASC-D6). The golden openings for each persona are the owning proof (phases 4 and 5).
  Validating must name one proof point: a live `npm run fgos:dev -- session start planner` on the phase-5 tree.
- **Producers moved partway would mean three renderers again.** Phase 5 moves every persona and opening producer in
  one change (ASC-D7), and the one-producer architecture test lands with it.
- **Text drift during the move.** Head and agent-file goldens are captured from today's code in phase 4; worker
  goldens are captured by a host test as phase 5's first commit, before anything moves (the worker prompt is
  rendered only inside the `fgos` binary, which has no library target). Phase 5 re-runs the phase-4 recorder on its
  own base first: a persona file changed by another plan in between (for example `261124-0004` phase 1 edits
  `core/agents/secretary.yaml` and `supervisor.yaml`) is recaptured with the commit that changed it named in
  `NOTES.md`, never folded into the three allowed fixes.
- **Tier placement.** The crate sits at tier 3 and may depend only on crates at tier 3 or below. Session-host
  (tier 3) calls it for the handoff contributor; it must never call Execution (tier 5).
- **Build-time call into the host.** After phase 6, `npm run build:skills` reaches the composer through the host
  door, so the projection build needs a host binary (`FGOS_HOST_BIN` or an activated release). Phase 6 states how
  the build finds it and fails with a named error, never silently falls back.
- **Hand-opened sessions.** omp and pi have no hooks and still read only AGENTS.md. Codex cuts AGENTS.md at 32 KiB;
  the file is 50,860 bytes today, so everything after the first 32 KiB (the instruction projection and the AgentKit
  block) never reaches Codex. The standing sheet must hold for them (phase 9 checks it against L8).
- **Hook rows are opt-in today.** `agent-hooks.v1.json` carries rows only for projects that opted into the mailbox
  (`rowsMailboxOn`). Phase 10 says whether the start-context row joins that set or gets its own opt-in.
- **Footprint admission.** The plan stays `draft` until the owner discussion and until `261122-2108` and
  `261124-0004` finish. A ready flip before then fails the plan check with "footprint overlaps another active plan".
- **Rollback.** Each phase lands as its own commits through `fgos land`. Reverting a phase's commits restores the old
  producer, because each phase deletes its old path in the same commit that adds the new one. Phase 5 is the one
  large revert. Reverting it restores Node `openingText`, `persona.rs` rendering and `project-agents.mjs`, and
  `launch-session` takes `opening` again.

Check results on this draft (`2c27d499a`):
- `node scripts/plan-contract-check.mjs --plan plans/261122-1946-agent-start-context`: `ok`. While the plan is
  `draft`, cross-plan overlap is not an error.
- Cross-plan overlap, simulated with the checker's own `activeOverlaps` on the same tree: phases 2 and 4 overlap no
  `ready` or `running` plan; the whole footprint overlaps `261122-2108`, `261124-0004` and `261124-2320`.
- `fgos resource-check --plan <this dir>` (run from the main checkout's activated release): `accept (10 units, 0
  findings)`; every listed collision is between phases in different waves; waves 1 to 6 as in the table; critical
  path 2 -> 3 -> 5 -> 6 -> 9 -> 11.

## Outstanding questions

See "Owner questions" 1 to 3.
