---
contract: plan-v1
title: "A live idle lead is replaced, never left idle behind already-live"
status: done
lead: lead:NUDGE
base: 508b63defbe53850364ebe14fb621d93921e11da
priority: P1
blockedBy: []
footprint:
  - plans/261121-0722-idle-lead-replace/**
  - core/skills/fgos-supervisor/SKILL.md
  - test/skills/fgos-supervisor-idle-lead.test.mjs
source:
  - p-waxzxz5mio
created: 2026-11-21
---

# A live idle lead is replaced, never left idle behind already-live

## Outcome
When the supervisor handles `plan-no-progress` for a `running` plan whose lead is live (`leadLive: true`) but idle, it replaces the lead with `fgos session stop lead --name <headName> --reason "idle with unfinished phases"` followed by `fgos session start lead --name <headName>`. The restart rule no longer depends on `leadLive: false` alone.

## Cause (proven by reading)
- The wake outcome `already-live` (`packages/supervision/rust/src/wake.rs`) describes the supervisor head, not the lead; nothing in the Rust wake short-circuits a plan.
- The decision lives in `core/skills/fgos-supervisor/SKILL.md`, "Running plans": it restarts only on `leadLive: false`, and its event `plan-no-progress` branch says "restart the lead" through `fgos session start`, which fronts the live holder of the role instead of replacing it. A live idle lead raises no `lead-ended`, so the event ended with no effect.

## Prior art reused
`fgos session stop|start` (stop ends a live head, start fronts or opens it), `leadLive` from `fgos supervisor plans`, the idle-asker stop-then-start rule in the same skill ("Answered owner question"), and the `plan-no-progress` attention definition (unchanged). The later softer nudge (`session type` gated by a drone event) belongs to plan 261119-1731-supervision-powers-doors and is not built here.

## Non-goals
No new mechanism, verb, watcher definition or Rust change; no `session type`.

## Acceptance criteria
1. The skill's "Running plans" section says: for `plan-no-progress` naming a plan with `leadLive: true`, stop the lead with the reason above and start it again; `already-live` or a bare start is never the whole answer.
2. An owning test in `test/skills/` reads the skill and fails when the replace rule (stop then start, in that order, for a live lead on `plan-no-progress`) is missing.
3. Generated skill surfaces are rebuilt with `npm run build:skills`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | Replace rule in the supervisor skill, with its owning test | - | core/skills/fgos-supervisor/SKILL.md, test/skills/fgos-supervisor-idle-lead.test.mjs | 1 | done |

## Owner questions
None.

## Risks and rollback
- Risk: replacing a lead that is busy in a long gate. Mitigation: `plan-no-progress` fires only after the no-progress window (60 minutes by default, no commit, board entry or run attempt); the replacement resumes from the phase table.
- Rollback: `git revert` of the landing commit.

## Overlap note
The footprint overlaps two plans on `core/skills/fgos-supervisor/SKILL.md` and its generated copies. `261121-0707-head-tab-labels` (lead:NAMES) is landing now; this plan rebases after it. `261119-1731-supervision-powers-doors` is `ready` and cannot start before cores finishes and S6A yields, so this plan lands first and doors rebases. The checker error for this overlap is the known checker-versus-admission mismatch (backlog p-pcfbembv6e); the land door does not run that check.
