# Phase 5: Spec, skill and generated skills

Writes the rules phases 2-4 made true into the owning specs and the supervisor procedure. Runs after phases 2, 3
and 4 have landed; it changes no code. Plan `261124-0004-heads-operate-without-owner` is done (2026-11-25), so the
specs and the skill below already carry its head-side rules; this phase edits around them.

## Inputs

- The landed phases 2, 3 and 4 and their tests: the exact state names, definition ids and JSON fields this phase
  writes down are the ones those phases shipped, read from their code, not from this file.
- `docs/platform/supervision/spec.md`: §1 (Owns), §4 (Commands and routing, `plans` view), §5 (Flows), §6
  (Failure modes, including §6.1 Missed idle lead), §8 (Lịch sử quyết định).
- `docs/platform/observe/spec.md`: the `fgos.head.state` line in the source list.
- `docs/platform/session-host/spec.md`: the `session stop` row of §8.9 and §9 (Lịch sử quyết định).
- `core/skills/fgos-supervisor/SKILL.md`, sections "Admit ready plans", "Running plans" (the `plan-no-progress`
  paragraph and its "a live idle lead raises no `lead-ended`" note), "Done plans" and "Settled discussion".
- The answered owner question `q-eoxlvo7i4r` (plan.md, Owner questions).
- `docs/platform/governance.md#decision-scope-to-holder-table` for where each decision line goes.

## Footprint

- `docs/platform/supervision/spec.md`
- `docs/platform/observe/spec.md`
- `docs/platform/session-host/spec.md`
- `core/skills/fgos-supervisor/SKILL.md`
- `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**` (generated; regenerate, never hand-edit)

## Steps

1. Supervision spec.
   - §5 Flows: the end of a head comes from the host: `fgos.head.state` reads `ended` when the run supervisor's
     `closed.json` exists for the head's current placement, and `lead-ended` fires on `retired` or `ended`, with no
     head raising it.
   - §5 Flows: the wake close step: on each wake the door stops, through the `StopSession` port, a planner whose
     plan has landed as `draft` or `ready` and a lead whose plan is `done`, under either role shape (`head:lead-*`
     or `lead:<LANE>`); it stops only an `Idle` head and leaves `Busy` and `Unknown` ones, as `stop_stuck` does.
     Name the `plan-drafted` row beside `plan-became-ready`.
   - §4 `plans` view: the `leadsWaiting` count, and admission comparing `leadsLive` (which excludes waiting leads)
     with `maxLeads`. "Waits outside" means every phase of the plan that is not `done` is parked on another party in
     its phase table. Say it is the interim rule until the sleep rule of plan `261122-0056-orchestration-skeleton`
     phase 6 retires it.
   - §6: the cause the diagnosis named (`reports/diagnosis.md`) as a failure mode with its fix.
   - §8: one decision-history line per settled rule (host end signal, close step, admission). The admission line
     cites `q-eoxlvo7i4r` and the owner's words "a waiting lead does not hold a working slot".
2. Observe spec: the `fgos.head.state` line gains `ended` and its source (`closed.json` in the placement's
   `runDir`; a rotated head's old run directory is not read).
3. Session Host spec: the §8.9 `session stop` row accepts a lead's short `lead:<LANE>` role; one §9 history line.
4. Supervisor skill.
   - "Admit ready plans": the `plans` JSON carries `leadsWaiting`; `leadsLive` already excludes waiting leads, so the
     admission test itself is unchanged.
   - New handling for `lead-ended`: read the plan's phase table and the lead's result (`fgos request result` of any
     ticket the plan names), record what was found in the plan, mark the event handled. The lane is freed by the
     wake close step, not by hand.
   - "Running plans": keep the note that a live idle lead raises no `lead-ended`, and add that a lead whose attempt
     has closed does.
   - "Done plans" and "Settled discussion": replace "`fgos session stop lead ... if its lead is still live`" and
     "Stop the planner ... once its plan is `ready`" with a pointer to the wake close step; the supervisor stops by
     hand only what the step left (a head that was busy at the wake).
   - Do not touch the "Help queue (coordination-help)" section or any head-side handoff wording; plan 0004 owns it.
5. Regenerate the skill copies with `npm run build:skills`.

## Verify

```bash
npm run build:skills
git status --short -- .agents/skills plugins/fgOS/skills .claude/skills   # only the fgos-supervisor copies change
node scripts/plan-contract-check.mjs --plan plans/261124-2143-head-lifecycle-events
npm test
```

Every rule written here names the test that proves it (plan.md acceptance 2-5); a sentence with no proof behind it
is cut. This machine runs at most two full test suites at once (memory); run `npm test` alone or with one other.

## Rollback

Revert the phase commit and regenerate the skill copies.
