# Phase 5: Every start-text producer moves to the composer

Slice 1's move (ASC-D1, ASC-D7). Every persona and opening producer moves in this one change, so there is never a
window with three renderers. The largest phase in the plan. It starts only after plans
`261122-2108-delete-dead-node-execution-closure` and `261124-0004-heads-operate-without-owner` are `done`, and after
this plan's phase 6, which is where ASC joins ACE phase 3 (owner, 2026-11-25 20:4x). It does not wait for ACE phase 4
or for the gathering plan.

## Inputs

- The discussion's "Start text is formed in about 12 places" (`#scan-deep`) and the scan tables (`#scan`), as
  re-checked on `2c27d499a` in `plans/reports/planner-261125-1109-asc-plan-refresh-against-main.md`.
- The goldens and `NOTES.md` from phase 4. The crate from phase 3; the `fgos internal start-context compose` door,
  its host adapters and the reading of ACE's rule set from phase 6.
- ACE's rule-unit schema and `fgos internal context-engine check` (ACE phase 3, reached through phase 6): the ritual
  and first-step units written here must pass it. If ACE phase 4 has landed, its pre-commit check also runs; if the
  gathering plan has landed, a ritual sentence that restates a gathered rule is refused and points to it instead. If
  the gathering lands later, it treats these units like any other part of its corpus.
- Callers to switch:
  - `src/session-host/head-start.mjs` (`openingText`, `FIRST_STEPS`, the start ritual, `defaultOpening`, and the
    `launchSessionInHost` call in `defaultLaunch`);
  - `src/native/execution-door.mjs:376` (`launchSessionInHost`);
  - the `launch-session` route (`packages/execution/contracts/execution-routes/execution-routes.v1.json`,
    `apps/fgos/src/wiring/execution_routes.rs`, `apps/fgos/src/wiring/unit_run_host/session_attempt.rs`, whose
    request reads `opening` at lines 137-140, and `packages/execution/engine/src/transport_round/session_attempt.rs`,
    whose `opening` field is at lines 154, 195 and 310);
  - the `PromptPort` host side (`HostPrompt` in `apps/fgos/src/wiring/unit_run_host/execution.rs:391`, which calls
    `persona::persona_section` in `apps/fgos/src/wiring/unit_run_host/persona.rs:310`);
  - `packages/execution/engine/src/assignment/builder.rs:887` and `brief.rs:351` (the claim instructions are
    rendered twice; the renderer is `packages/execution/rust/src/run_result/claim.rs:94`);
  - `scripts/project-agents.mjs` (`projectAgentMarkdown`).

## Footprint

See the phase table in `plan.md`, row 5.

## Steps

1. Capture the worker goldens first, in a commit of their own: a host test under
   `apps/fgos/src/wiring/unit_run_host/tests/` renders one worker prompt per role task (the role tasks in
   `packages/execution/rust/src/loops/role_tasks_data.rs`), in both `-p` and terminal-brief form, through today's
   `HostPrompt`, and writes or checks `packages/agent-start-context/goldens/worker/<case>.txt`. Re-run the phase-4
   recorder on this base: recapture any head or agent-file golden whose persona file changed since phase 4, naming
   the commit that changed it in `NOTES.md`.
2. Rules: move the start ritual and each persona's first step (today in `FIRST_STEPS` and the hardcoded ritual) into
   ACE rule units under `core/instructions/`, scoped by `when:` (`kind: [head]` for the ritual, `persona: [<id>]` for
   each first step), without changing the wording. This is their only move: they become rules in ACE, not persona
   fields, so ACE's gathering never moves them again. Recompile the rule set. `core/agents/*.yaml` stays persona
   data and is not edited here.
3. Heads: `launch-session` takes a `StartRequest` (facts `kind=head`, `persona`, `cli`, `project`, and the payloads
   `task`, `for-question` and `handoff`, with delivery `opening`) instead of a finished `opening` string. The host
   calls the composer and writes the joined blocks to `brief.md` as it does today. Delete `openingText`,
   `FIRST_STEPS`, `taskBriefOf`'s text part, and the Node calls to `renderPersonaSection`/`renderOnWake` in
   `head-start.mjs`.
4. Workers: the `PromptPort` host adapter calls the crate for the persona block. Execution keeps rendering its
   assignment block (and the operation text from its templates, which move with P14 part 2) and passes it in as the
   `assignment` payload. The `PromptPort` trait itself does not change (ASC-D1). Delete the rendering in
   `persona.rs`, and keep only the persona lookup if the bind still needs it.
5. Claim instructions: render them once. The brief wrapper points at the block in the prompt and does not call
   `render_agent_result_claim_instructions` again.
6. Agent files: `scripts/project-agents.mjs` asks the door for delivery `agent-file` for each agent and writes the
   result. Regenerate `.claude/agents/**` with it.
7. Delete `renderPersonaSection` and `renderOnWake` from `src/runner/agent-definitions.mjs`. After plan `261122-2108`
   the only importer left is `head-start.mjs` (its other importer, `src/runner/dispatch/assignment.mjs`, is in that
   plan's dead set).
8. Add an architecture test to `test/architecture.test.mjs`: one start-text producer. It fails if any file other than
   the crate builds persona, ritual, on-wake or opening text. Add a door row under
   `packages/component-authority/model/doors/` naming the crate as the only holder of that job, in the style of the
   existing door rows.
9. Replace the phase-4 recorder and the step-1 host test with a Rust golden test in the crate
   (`packages/agent-start-context/rust/tests/goldens.rs`) that composes every case and compares it with the golden.
   Update each golden only for the three fixes in `NOTES.md`. Retire the cases in
   `test/session-host/head-start.test.mjs` and `test/runner/agent-definitions.test.mjs` that asserted text, and name
   `goldens.rs` as their owner (design principle 8). Keep the cases that assert placement or binding.

## Verify

- `cargo test -p fgos-agent-start-context` passes (goldens), and so do
  `cargo test -p fgos-execution-engine` and `cargo test -p fgos unit_run_host`.
- `node scripts/run-tests.mjs test/architecture.test.mjs test/session-host/head-start.test.mjs test/runner/agent-definitions.test.mjs test/native/execution-door.test.mjs`
  passes.
- `rg -n "openingText|FIRST_STEPS|renderOnWake|renderPersonaSection" src scripts` prints nothing.
- Live proof point, carried to validating: `npm run fgos:dev -- session start planner` on this tree opens a head
  whose `brief.md` matches the planner golden.

## Rollback

Revert the phase's commits. They restore the Node opening, the `persona.rs` rendering, `project-agents.mjs` and the
`opening` field of `launch-session` together.
