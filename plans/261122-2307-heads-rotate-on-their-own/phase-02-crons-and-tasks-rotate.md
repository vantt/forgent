# Phase 2: Crons and background tasks no longer block rotation

Capability: `code:implement`. Closes cause 1 of `p-fwdxupc6fx`.

## Inputs

- `plans/261122-2307-heads-rotate-on-their-own/plan.md`: Outcome item 1, "Cause confirmation", "Prior art".
- `packages/session-host/rust/src/rotation/decide.rs:146-189` (`AtRest`, `decide`) and its tests.
- `apps/fgos/src/wiring/session_rotation_hook.rs:172-240` (`stop_inner`: `AtRest` from the payload counts, stop facts).
- `src/session-rotation/rotate.mjs` (`requestRotation`, how `stopFacts` reach the handoff).
- `src/session-rotation/handoff-store.mjs` (handoff sections) and `test/session-rotation/handoff-store.test.mjs`.
- `packages/session-host/contracts/rotation-files.v1.json` (`hookPayload.stop`, handoff shape).
- `docs/platform/session-host/spec.md` 8.8 "What a handoff records": read only. Phase 4 writes the spec.

## Footprint

`packages/session-host/rust/src/rotation/decide.rs`, `apps/fgos/src/wiring/session_rotation_hook.rs`,
`src/session-rotation/rotate.mjs`, `src/session-rotation/handoff-store.mjs`, `test/session-rotation/rotate.test.mjs`,
`test/session-rotation/handoff-store.test.mjs`, `packages/session-host/contracts/rotation-files.v1.json`.

## Steps

1. **Record the cron shape.** Start a throwaway Claude Code session with the Stop hook dump that
   `scripts/record-mailbox-hook-fixtures.mjs` uses, create one cron and one background task, and note the element
   fields of `session_crons` and `background_tasks` in the Stop payload. Keep the dump under `.fgos/runtime/tmp/`,
   and write the field list into `plans/261122-2307-heads-rotate-on-their-own/reports/stop-payload-lists.md`. Do
   not change the mailbox fixtures: they are another plan's.
2. **Decide.** In `decide`, a cron never blocks. A background task blocks soft only: move it next to
   `pending_question`, so hard still rotates. Rename the reason to `background-task-running` (soft-only), and drop
   `background-work-running`. Update the doc comment. Replace the test
   `a_running_background_task_or_cron_blocks_every_level` with
   `a_cron_never_blocks_and_a_background_task_holds_soft_but_not_hard`.
3. **Hook.** Carry the two lists into the stop facts (`stopFacts.sessionCrons`, `stopFacts.backgroundTasks`),
   bounded like the other facts: at most 20 entries per list, and every string cut with the existing `bounded`
   helper. Keep only the fields step 1 found to identify a cron (schedule, prompt, recurring flag) or a task (id,
   description or command). The counts that feed `AtRest` are unchanged. Extend the existing hook test (the one
   with `background_tasks`, around line 585) so it asserts that the lists reach the `session rotate` args.
4. **Rotate and handoff.** `requestRotation` passes the two lists to the handoff writer. `handoff-store.mjs` adds a
   section "Crons to recreate", one line per cron with the instruction to recreate it with the session's cron tool
   before the first task. It also adds "Background tasks that were running", one line per task with the
   instruction to rerun it only if its result still matters. An empty list leaves its section out. Extend
   `test/session-rotation/handoff-store.test.mjs` with one test that owns both sections. Extend `rotate.test.mjs`
   only if `requestRotation` validates `stopFacts` keys (the wiring proof).
5. **Contract.** Update `rotation-files.v1.json`: the stop-facts fields, the new decision reason in the
   `stop-trace.jsonl` shape, and the handoff sections.

## Verify

```bash
cargo test -p fgos-session-host rotation::decide
cargo test -p fgos session_rotation_hook
node --test test/session-rotation/handoff-store.test.mjs test/session-rotation/rotate.test.mjs
```

The pass condition is that all of them are green and the renamed decide test passes. Confirm the package names with
`cargo metadata` if they differ.

## Rollback

Revert the phase's commits. Crons and tasks block rotation again.
