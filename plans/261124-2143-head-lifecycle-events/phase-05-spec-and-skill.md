# Phase 5: Spec, skill and generated skills

Writes the rules phases 2-4 made true into the owning specs and the supervisor procedure.

## Inputs

- The landed phases 2, 3 and 4 and their tests.
- `docs/platform/supervision/spec.md` (sections 1, 4, 5, 6 and 8), `docs/platform/observe/spec.md`
  (`fgos.head.state` line), `docs/platform/session-host/spec.md` (`session stop` row and its history).
- `core/skills/fgos-supervisor/SKILL.md` (Admit ready plans, the idle-lead paragraphs, Done plans, Settled
  discussion).
- `docs/platform/governance.md#decision-scope-to-holder-table` for where each decision line goes.

## Footprint

- `docs/platform/supervision/spec.md`
- `docs/platform/observe/spec.md`
- `docs/platform/session-host/spec.md`
- `core/skills/fgos-supervisor/SKILL.md`
- `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**` (generated; regenerate, never hand-edit)

## Steps

1. Supervision spec: the host-side end signal (`ended` from `closed.json`, `lead-ended` on `retired` or `ended`),
   the wake close step and its stop conditions, the `plan-drafted` row, and the admission rule the owner picked
   with its inputs. Add one decision-history line per settled rule, citing the owner's question id for admission.
2. Observe spec: `fgos.head.state` gains `ended` and what it reads.
3. Session Host spec: `session stop` accepts a short `lead:<LANE>` role; one history line.
4. Supervisor skill: on `lead-ended`, read the plan's phase table and the lead's result (`fgos request result` of
   any named ticket), record what it found in the plan, and mark the event handled; the lane is freed by the wake
   close step. Replace "stop the planner once its plan is `ready`" and the "stop the lead if still live" lines with
   a pointer to the wake close step (the supervisor stops by hand only what the step left: a head that was busy).
   Do not touch the head-side handoff wording plan 0004 owns.
5. Regenerate the skill copies with `npm run build:skills`.

## Verify

```bash
npm run build:skills
git status --short -- .agents/skills plugins/fgOS/skills .claude/skills   # only the expected regenerated files
node scripts/plan-contract-check.mjs --all
npm test
```

## Rollback

Revert the phase commit and regenerate the skill copies.
