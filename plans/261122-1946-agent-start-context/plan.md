---
contract: plan-v1
title: "Agent Start Context: one composer for the text every fgOS-started agent receives"
status: draft
priority: P1
blockedBy:
  - 261118-1341-s6a-execution-tier-rust
  - 261122-0118-heads-stable-and-able
base: f03efc32e13ee2389253ea89e6e9d223e74f5094
footprint:
  - plans/261122-1946-agent-start-context/**
  - docs/platform/agent-start-context/**
  - docs/reading-map.md
  - docs/platform/governance.md
  - docs/platform/system-overview/spec.md
  - docs/architecture-manifest.json
  - packages/agent-start-context/**
  - Cargo.toml
  - Cargo.lock
  - apps/fgos/Cargo.toml
  - apps/fgos/src/wiring/start_context.rs
  - apps/fgos/src/wiring/start_context/**
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/tests/start_context.rs
  - packages/host-runtime/contracts/command-manifest.json
  - src/runner/dispatch/session-attempt.mjs
  - src/runner/dispatch/assignment-runner.mjs
  - src/runner/dispatch/herdr-round.mjs
  - src/runner/dispatch/brief.mjs
  - src/runner/dispatch/assignment.mjs
  - src/runner/dispatch/transport.mjs
  - src/run-supervisor/direct-launch.mjs
  - test/runner/**
  - test/run-supervisor/**
  - test/golden-recorders/**
  - test/architecture.test.mjs
  - src/session-host/head-start.mjs
  - src/session-host/head-plan.mjs
  - test/session-host/head-start.test.mjs
  - test/session-host/head-plan.test.mjs
  - src/native/execution-door.mjs
  - test/native/execution-door.test.mjs
  - src/runner/agent-definitions.mjs
  - scripts/project-agents.mjs
  - .claude/agents/**
  - core/agents/**
  - packages/execution/contracts/execution-routes/**
  - packages/execution/engine/src/assignment/**
  - packages/execution/engine/src/transport_round/session_attempt.rs
  - packages/execution/engine/tests/**
  - apps/fgos/src/wiring/execution_routes.rs
  - apps/fgos/src/wiring/unit_run_host/**
  - apps/fgos/tests/unit_run_host.rs
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
  - test/session-rotation/rotate.test.mjs
  - AGENTS.md
  - test/docs/**
  - packages/distribution/contracts/agent-hooks.v1.json
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/rust/tests/goldens/agent-hooks-vectors.json
  - src/setup/agent-hooks.mjs
  - test/setup/agent-hooks.test.mjs
  - scripts/fgos-session-start-hook.mjs
  - core/config-standard/startContext.yaml
  - core/config-schema/**
  - CHANGELOG.md
source:
  - plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md
  - p-25q7tz6jtt
created: 2026-11-22
---

# Agent Start Context

## Outcome

Every agent fgOS starts gets its start text from one composer, the tier-3 Rust crate **Agent Start Context**
(ASC-D1). This covers heads, workers, the `.claude/agents` files, and sessions opened by hand on CLIs with hooks
(ASC-D3). Each caller passes typed facts, payloads and a delivery to `compose` (ASC-D5). It gets back ordered blocks
or a named refusal. Rules enter as unit files with `when:` facts through the existing instruction registry, and live
context enters through registered contributors (ASC-D6). About 12 text-forming places become 1, and a test enforces
that count. Each start appends a record of the units it matched and the bytes per block, so the token cost of a
start can be measured. The fgOS-owned part of AGENTS.md shrinks to the standing sheet that passes the L8 test.

Prior art, read in the discussion and checked again on `f03efc32e`:
- **Reused:**
  - the instruction registry (`src/setup/instruction-registry.mjs`, with its three roots, the owners from the
    architecture manifest, and its authority and specificity order) as the `UnitSource`;
  - the contract layout of `packages/questions/contracts/` (input schema plus `refusals.v1.json`);
  - persona data in `core/agents/*.yaml`, which already carries `on_wake`;
  - the engine's `PromptPort` (`packages/execution/engine/src/assignment/builder.rs`), which keeps its trait;
  - the SessionStart hook table in `packages/distribution/contracts/agent-hooks.v1.json`;
  - the rotation SessionStart verb (`apps/fgos/src/wiring/session_rotation_hook.rs`).
- **Missing, and built here:** an owner of start text, a fact registry, per-start records, a contributor port, and
  a guard that allows only one producer.
- **Slice 0 overlaps backlog row `p-24xw2cwdvo`.** That row deletes the whole dead tier-5 Node closure (78 files)
  after plan `261122-0118` and s6a phase 22. The discussion's slice 0 is a subset of it, so phase 1 verifies the
  deletion and does it only for the files that are still present (see phase 1).

## Acceptance criteria

1. `docs/platform/agent-start-context/spec.md` names the crate's owner, its tier and its contracts. The files
   `packages/agent-start-context/contracts/{start-request,start-context,start-facts,start-contributors,refusals}.v1.json`
   exist with golden vectors. Proof: `cargo test -p fgos-agent-start-context` (phases 2 and 3).
2. `rg -l "assignment-runner|herdr-round|direct-launch|dispatch/session-attempt|dispatch/brief" src test bin scripts`
   prints nothing (phase 1).
3. `rg -n "openingText|FIRST_STEPS|renderOnWake|renderPersonaSection" src scripts` prints nothing. The Rust
   persona rendering in `apps/fgos/src/wiring/unit_run_host/persona.rs` is gone. `scripts/project-agents.mjs`
   renders nothing of its own. `render_agent_result_claim_instructions` has a single caller (phase 5).
4. `node scripts/run-tests.mjs test/architecture.test.mjs` includes a case that fails when a second start-text
   producer appears (phase 5).
5. The golden openings in `packages/agent-start-context/goldens/` (captured in phase 4) match the composer output
   for every persona. Only three differences are allowed, each listed in the golden's notes: the domain is filled
   in, the preamble is worded for heads, and the handoff appears once (phases 4, 5 and 7).
6. Each `compose` call appends one record that lists its facts, the matched unit ids and the bytes per block.
   `plans/261122-1946-agent-start-context/reports/start-token-table.md` gives the before and after tokens per start
   for each head persona and each worker operation (phases 3, 4 and 11).
7. Units declare `when:` facts, and a build test refuses an unknown key or value:
   `node scripts/run-tests.mjs test/setup/instruction-when-facts.test.mjs` (phase 6).
8. The setup-time matcher (`src/setup/instruction-composition.mjs`) gets its selection from the composer through
   `fgos internal start-context compose` (phase 6).
9. The rotation handoff reaches a successor through one channel only, the session-host contributor. The successor
   golden shows the handoff once (phase 7).
10. The fgOS-owned sections of AGENTS.md pass the L8 placement test, and the RUL11 and RUL104 anchor tests in
    `test/docs/` stay green. A SessionStart hook composes context for hand-opened sessions on claude, codex and agy,
    defaulting to the entry persona (phases 9 and 10).
11. `npm test` and `cargo test --workspace` are green on the merged tree (phase 11).

## Non-goals

- External text: the AgentKit, GitNexus and MDView blocks (ASC-D2).
- Changing what any persona or doctrine says. Text moves without being rewritten. The only exceptions are the three
  fixes in criterion 5.
- The decision component for fixed-option judgments (P12) and the entry-persona UX flow (P13). Both are separate
  items (ASC-D4). This plan reads only the `entryPersona` config value.
- Merging the two engine entry ops `launch-session` and `run-unit` (item C).
- The runner item (P14). It moves the Node fronts onto the declared doors. Its part 2 (the operation step and its
  objective templates) waits for this plan's phase 5, so that its templates move only once, straight into units.
- Classifying a head's domain. Phase 8 reads the domain wherever the bound item already carries it. The domain
  field on backlog rows, plans and discussions belongs to the secretary (P10).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [The dead Node dispatch mirror is gone](phase-01-dead-mirror.md) | - | src/runner/dispatch/session-attempt.mjs, src/runner/dispatch/assignment-runner.mjs, src/runner/dispatch/herdr-round.mjs, src/runner/dispatch/brief.mjs, src/runner/dispatch/assignment.mjs, src/runner/dispatch/transport.mjs, src/run-supervisor/direct-launch.mjs, test/runner/**, test/run-supervisor/**, test/golden-recorders/**, test/architecture.test.mjs, docs/architecture-manifest.json | 1 | draft |
| 2 | [Area spec and v1 contracts](phase-02-spec-and-contracts.md) | - | docs/platform/agent-start-context/**, packages/agent-start-context/contracts/**, docs/reading-map.md, docs/platform/governance.md, docs/platform/system-overview/spec.md | 1 | ready |
| 4 | [Golden openings and before-bytes from today's code](phase-04-golden-openings.md) | - | packages/agent-start-context/goldens/**, plans/261122-1946-agent-start-context/reports/before-bytes.md | 1 | ready |
| 3 | [The crate, its ports and the host door](phase-03-crate-and-host-door.md) | 2 | packages/agent-start-context/rust/**, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/wiring/start_context.rs, apps/fgos/src/wiring/start_context/**, apps/fgos/src/wiring/mod.rs, apps/fgos/src/routing.rs, apps/fgos/tests/start_context.rs, packages/host-runtime/contracts/command-manifest.json, docs/architecture-manifest.json | 2 | draft |
| 5 | [Every start-text producer moves to the composer](phase-05-move-producers.md) | 1, 3, 4 | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, src/native/execution-door.mjs, test/native/execution-door.test.mjs, src/runner/agent-definitions.mjs, test/runner/agent-definitions.test.mjs, scripts/project-agents.mjs, .claude/agents/**, core/agents/**, packages/execution/contracts/execution-routes/**, packages/execution/engine/src/assignment/**, packages/execution/engine/src/transport_round/session_attempt.rs, packages/execution/engine/tests/**, apps/fgos/src/wiring/execution_routes.rs, apps/fgos/src/wiring/unit_run_host/**, apps/fgos/tests/unit_run_host.rs, test/architecture.test.mjs, docs/architecture-manifest.json, packages/agent-start-context/goldens/** | 3 | draft |
| 6 | [Units select by `when:` facts; one matcher](phase-06-when-facts-one-matcher.md) | 5 | src/setup/instruction-registry.mjs, src/setup/instruction-composition.mjs, test/setup/instruction-*.test.mjs, core/instructions/**, components/*/instructions/**, domains/*/instructions/** | 4 | draft |
| 7 | [The rotation handoff is the first contributor](phase-07-handoff-contributor.md) | 5 | packages/session-host/rust/src/rotation/**, packages/session-host/rust/tests/**, apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/start_context/**, packages/agent-start-context/contracts/start-contributors.v1.json, src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs | 4 | draft |
| 8 | [A head's domain fact comes from its bound item](phase-08-head-domain-fact.md) | 5 | src/session-host/head-plan.mjs, test/session-host/head-plan.test.mjs, src/session-host/head-start.mjs, test/session-host/head-start.test.mjs | 4 | draft |
| 9 | [AGENTS.md cut to the standing sheet (L8)](phase-09-agents-md-cut.md) | 6 | AGENTS.md, core/instructions/**, domains/coding/instructions/**, src/setup/instruction-projections.mjs, test/setup/instruction-projections.test.mjs, test/docs/** | 5 | draft |
| 10 | [SessionStart hook for hand-opened sessions](phase-10-hand-opened-hook.md) | 7 | apps/fgos/src/wiring/session_rotation_hook.rs, apps/fgos/src/wiring/start_context/**, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/tests/goldens/agent-hooks-vectors.json, src/setup/agent-hooks.mjs, test/setup/agent-hooks.test.mjs, scripts/fgos-session-start-hook.mjs, core/config-standard/startContext.yaml, core/config-schema/** | 5 | draft |
| 11 | [Integration gate, token table, changelog](phase-11-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | CHANGELOG.md, plans/261122-1946-agent-start-context/reports/** | 6 | draft |

Phases 2 and 4 write only the new area's docs, contracts and goldens. Neither touches a running plan's footprint,
so both are marked `ready` and can start now. The plan as a whole stays `draft` while the two plans in `blockedBy`
are running. Every other phase writes files those plans hold: s6a holds `src/runner/dispatch/**`,
`packages/execution/**`, `apps/fgos/src/wiring/unit_run_host/**`, `src/setup/**`, `src/session-host/head-start.mjs`,
`test/architecture.test.mjs` and `docs/architecture-manifest.json`. Plan 0118 holds
`apps/fgos/src/wiring/session_rotation_hook.rs`, `src/session-rotation/rotate.mjs` and
`test/session-host/head-start.test.mjs`. When both plans are done, the supervisor (or this planner) sets
`status: ready`.

Hot files have one writer per wave:
- `docs/architecture-manifest.json`: phase 1 (wave 1), phase 3 (wave 2), phase 5 (wave 3).
- `test/architecture.test.mjs`: phase 1 (wave 1), phase 5 (wave 3).
- `apps/fgos/src/wiring/start_context/**`: phase 3 (wave 2), phase 7 (wave 4), phase 10 (wave 5).
- `apps/fgos/src/wiring/session_rotation_hook.rs`: phase 7 (wave 4), phase 10 (wave 5).
- `src/session-host/head-start.mjs`: phase 5 (wave 3), phase 8 (wave 4).
- `core/instructions/**`: phase 6 (wave 4), phase 9 (wave 5).
- `CHANGELOG.md`: phase 11 only.

`.claude/agents/**` is generated by `scripts/project-agents.mjs`. It is regenerated in phase 5, never merged by
hand.

`node scripts/plan-contract-check.mjs` and `fgos resource-check --plan` were both run on this table. Their results
are under "Risks and rollback".

## Owner questions

None. Every product decision this plan needs is settled in ASC-D1 to ASC-D7. The one open point in the discussion
(P10, the domain field on backlog rows, plans and discussions) belongs to the secretary's own item. Phase 8 reads the
domain wherever the bound item already carries it and leaves the fact absent otherwise. No classifier is added here
(ASC-D4).

## Risks and rollback

- **One composer is a single point of failure for every start, the secretary included.** The composer fails closed
  with a named refusal for bad static data, and fails open (leaving the block out and recording that) for a broken
  contributor (ASC-D5, ASC-D6). The golden openings for each persona are the owning proof (phases 4 and 5).
  Validating must name one proof point: a live `fgos session start` of a head on the phase-5 tree.
- **Producers moved partway would mean three renderers again.** Phase 5 moves every producer in one change (ASC-D7),
  and the one-producer architecture test lands with it.
- **Text drift during the move.** The goldens are captured from today's code before anything moves (phase 4), so
  any difference other than the three named fixes fails phase 5.
- **Tier placement.** The crate sits at tier 3 and may depend only on crates at tier 3 or below. Session-host
  (tier 3) calls it for the handoff contributor; it must never call Execution (tier 5).
- **Hand-opened sessions.** omp and pi have no hooks and still read only AGENTS.md. The standing sheet must hold for
  them (phase 9 checks it against L8).
- **Footprint admission.** The plan stays `draft` until s6a and plan 0118 finish. A ready flip before then fails the
  plan check with "footprint overlaps another active plan".
- **Rollback.** Each phase lands as its own commits through `fgos land`. Reverting a phase's commits restores the old
  producer, because each phase deletes its old path in the same commit that adds the new one. Phase 5 is the one
  large revert. Reverting it restores Node `openingText`, `persona.rs` rendering and `project-agents.mjs`, and
  `launch-session` takes `opening` again.

Check results on the draft:
- `node scripts/plan-contract-check.mjs --plan plans/261122-1946-agent-start-context` reports no structural error.
  While the plan is `draft`, the cross-plan overlap shows only as advice.
- `fgos resource-check --plan plans/261122-1946-agent-start-context`: no phases in the same wave collide, there are
  no cycles, and the declared waves are valid.

## Outstanding questions

None
