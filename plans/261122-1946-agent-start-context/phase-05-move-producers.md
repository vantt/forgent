# Phase 5: Every start-text producer moves to the composer

Slice 1's move (ASC-D1, ASC-D7). Every producer moves in this one change, so there is never a window with three
renderers. The largest phase in the plan.

## Inputs

- The discussion's "Start text is formed in about 12 places" (`#scan-deep`) and the scan tables (`#scan`).
- The goldens and `NOTES.md` from phase 4. The crate and the `fgos internal start-context compose` door from
  phase 3.
- Callers to switch:
  - `src/session-host/head-start.mjs` (`openingText`, `FIRST_STEPS`, the start ritual and the `launchSessionInHost`
    call);
  - `src/native/execution-door.mjs:376`;
  - the `launch-session` route (`packages/execution/contracts/execution-routes/execution-routes.v1.json`,
    `apps/fgos/src/wiring/execution_routes.rs`, and `packages/execution/engine/src/transport_round/session_attempt.rs`,
    whose `opening` field is at lines 154, 195 and 310);
  - the `PromptPort` host side (`apps/fgos/src/wiring/unit_run_host/persona.rs`);
  - `packages/execution/engine/src/assignment/builder.rs:887` and `brief.rs:351` (the claim instructions are
    rendered twice);
  - `scripts/project-agents.mjs`.

## Footprint

See the phase table in `plan.md`, row 5.

## Steps

1. Persona data: move the start ritual and each persona's first step (today in `FIRST_STEPS` and the hardcoded
   ritual) into `core/agents/*.yaml` as unit or persona fields, without changing the wording. `on_wake` already
   lives there.
2. Heads: `launch-session` takes a `StartRequest` (facts `kind=head`, `persona`, `cli`, `project`, and the payloads
   `task`, `for-question` and `handoff`, with delivery `opening`) instead of a finished `opening` string. The engine
   calls the composer and writes the joined blocks to `brief.md` as it does today. Delete `openingText`,
   `FIRST_STEPS`, `taskBriefOf`'s text part, and the Node calls to `renderPersonaSection`/`renderOnWake` in
   `head-start.mjs`.
3. Workers: the `PromptPort` host adapter calls the crate for the persona block and the operation text. Execution
   keeps rendering its assignment block and passes it in as the `assignment` payload. The `PromptPort` trait itself
   does not change (ASC-D1). Delete the rendering in `persona.rs`, and keep only the persona lookup if the bind
   still needs it.
4. Claim instructions: render them once. The brief wrapper points at the block in the prompt and does not call
   `render_agent_result_claim_instructions` again.
5. Agent files: `scripts/project-agents.mjs` asks the door for delivery `agent-file` for each agent and writes the
   result. Regenerate `.claude/agents/**` with it.
6. Delete `renderPersonaSection` and `renderOnWake` from `src/runner/agent-definitions.mjs`. Move every remaining
   importer, including any left in `src/runner/dispatch/assignment.mjs` after phase 1.
7. Add an architecture test to `test/architecture.test.mjs`: one start-text producer. It fails if any file other than
   the crate builds persona, ritual, on-wake or opening text. Add a manifest rule naming the crate as the only
   holder of that job, in the same style as the "agent definition tier directories" rule.
8. Replace the phase-4 recorder with a Rust golden test in the crate (`tests/goldens.rs`) that composes every case
   and compares it with the golden. Update each golden only for the three fixes in `NOTES.md`. Retire the cases in
   `test/session-host/head-start.test.mjs` and `test/runner/agent-definitions.test.mjs` that asserted text, and name
   `goldens.rs` as their owner (design principle 8). Keep the cases that assert placement or binding.

## Verify

- `cargo test -p fgos-agent-start-context` passes (goldens), and so does
  `cargo test -p fgos-execution-engine -p fgos --test unit_run_host`.
- `node scripts/run-tests.mjs test/architecture.test.mjs test/session-host/head-start.test.mjs test/runner/agent-definitions.test.mjs test/native/execution-door.test.mjs`
  passes.
- `rg -n "openingText|FIRST_STEPS|renderOnWake|renderPersonaSection" src scripts` prints nothing.
- Live proof point, carried to validating: `npm run fgos:dev -- session start planner` on this tree opens a head
  whose `brief.md` matches the planner golden.

## Rollback

Revert the phase's commits. They restore the Node opening, the `persona.rs` rendering, `project-agents.mjs` and the
`opening` field of `launch-session` together.
