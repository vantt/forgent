# Phase 7: Supervisor and lead rules, retire condition

Capability: `code:implement` (skill and spec text).

Closes `p-5gczifzh7h`, the skill half of `p-ekqtvofdoh`, `p-ndortdckid` and `p-vquz26ibnn` item (c), and `p-vquz26ibnn`
item (8).

## Inputs

- `core/skills/fgos-supervisor/SKILL.md`: "Admit ready plans" step 1 lands only `status: running`; "Running plans";
  "On site and the drone".
- `core/skills/fgos-lead/SKILL.md` (how a lead parks a phase).
- `core/skills/_shared/friction-capture.md` ("Record how" assumes the CLI writes directly).
- Phase 2 (heads hold `friction record`, the lead holds `supervisor raise`, the supervisor holds `config patch`) and
  phase 3 (a running plan without `lead` or `base` fails the land gate).
- `p-5gczifzh7h` evidence: lead:WINCI's CI runs ended at 19:40 and the lead sat idle about 3 hours. The supervisor
  judged "idle with a background shell, it wakes when the shell exits" from the screen alone.
- Owner approval 2026-11-21: the manual `lead:SUPERVISOR` session retires once the supervisor head runs one plan end to
  end alone.
- Draft plan `261122-0056-orchestration-skeleton` phase 1 moves admission into code later; keep this text change small
  so that phase ports it instead of conflicting with it.

## Footprint

`core/skills/fgos-supervisor/SKILL.md`, `core/skills/fgos-lead/SKILL.md`, `core/skills/_shared/friction-capture.md`,
`.agents/skills/**` and `plugins/fgOS/skills/**` (regenerated only), `docs/platform/supervision/spec.md`,
`test/skills/fgos-supervisor-idle-lead.test.mjs`.

## Steps

1. Admission, supervisor skill step 1: one `fgos land --paths` writes `status: running`, `lead: <the head role it
   starts>` (`head:lead-<headName>`) and `base: <trunk sha at admission>` (`git rev-parse <trunk>`).
2. Idle lead, supervisor skill "Running plans": for `session-idle` naming a live lead, a screen claim such as "waiting on
   a background shell" never closes the event. The supervisor types into that lead (allowed, since the open event names
   it): check the wait you named; if it is over, continue; if not, say what it is and when it ends. The lead's shell can
   check its own background job; the supervisor's cannot. The event is closed only when the lead answers or makes
   progress. If it is idle again at the next row, the existing `plan-no-progress` rule (stop, then start) applies
   unchanged. This reaches the lead within one watcher interval, because the watcher raises the row and wakes the
   supervisor.
3. Config, supervisor skill "On site": `fgos config patch` is the supervisor's door for project config inside the
   approved frame (for example a persona pin). An owner-level value is still asked.
4. Parking, lead skill: when the lead parks a phase on another party (an owner answer, another plan, an outside run), it
   runs `fgos supervisor raise --kind coordination-help --ref plan:<dir> --reason "parked <phase> on <party>: <what>"`
   in the same turn. It does not end the turn idle without that event.
5. Friction, `friction-capture.md`: a head records with `fgos friction record` like any caller (its socket carries it).
   The triggers named for heads are a workaround, a retry, a wait, and a refused verb. Fail-open stays as it is.
6. Retire condition, `docs/platform/supervision/spec.md` settled facts: the manual `lead:SUPERVISOR` session retires once
   the supervisor head runs one plan end to end alone (admitted, lead started, phases landed, plan closed) with no
   command typed by `lead:SUPERVISOR`. The evidence is the plan's commits and the supervision records. Owner approved
   2026-11-21.
7. Owning proof: extend `test/skills/fgos-supervisor-idle-lead.test.mjs`, which already owns the supervisor's idle-lead
   text. It checks that the `session-idle` rule types a check and never closes on a screen claim, and that admission
   writes `status`, `lead` and `base` in one land. No new skill test file.
8. Run `npm run build:skills`.

## Verify

`node scripts/run-tests.mjs test/skills/fgos-supervisor-idle-lead.test.mjs test/skills/fgos-mirror.test.mjs` passes. The
mirror test proves the renders match their sources.

## Rollback

Revert the phase commit and rebuild the renders.
