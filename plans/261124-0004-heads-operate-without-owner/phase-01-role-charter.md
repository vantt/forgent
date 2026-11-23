# Phase 1: Role charter for the two hands

Capability: `code:implement` (documentation and skill text only).

Writes PC-D1, PC-D2 and PC-D5 (discussion `plans/discussions/privileged-chores-research/DISCUSSION.md` §4) into
every place that states what Miu and the supervisor are, and removes every sentence that says the opposite.

## Inputs

- The discussion, §4 (PC-D1, PC-D2, PC-D5, PC-D10) and §6 "Vai trò".
- `docs/platform/supervision/spec.md`: the supervisor's scope and the retire condition of the manual supervisor (line
  ~223, which this phase does not weaken: PC-D4).
- `docs/platform/session-host/spec.md`: the head personas.
- `core/skills/fgos-secretary/SKILL.md`: line 18 ("never types into or reads another session and never tunes the
  watcher: those are the supervisor's") and line ~85 (the list of verbs "not in your grant").
- `core/skills/fgos-supervisor/SKILL.md`: its scope today (plans and leads).
- `core/agents/secretary.yaml`, `core/agents/supervisor.yaml`: the agent descriptions projected to
  `.claude/agents/*.md` by `scripts/project-agents.mjs`.

## Footprint

`docs/platform/supervision/spec.md`, `docs/platform/session-host/spec.md`, `core/skills/fgos-secretary/SKILL.md`,
`core/skills/fgos-supervisor/SKILL.md`, `core/agents/secretary.yaml`, `core/agents/supervisor.yaml`,
`.claude/agents/secretary.md`, `.claude/agents/supervisor.md`, and the regenerated `.agents/skills/**`,
`plugins/fgOS/skills/**`, `.claude/skills/**`.

The grant comment in `src/session-host/head-grants.mjs` that describes Miu is phase 2's file and is fixed there.

## Steps

1. In `docs/platform/supervision/spec.md`, add one role charter section, domain-free (PC-D10):
   - The supervisor (left hand) looks after every running agent that no lead watches: leads, shapers, planners and
     any pane or agent started by hand without a lead. Workers of a lead are that lead's.
   - Miu (right hand) holds every power the supervisor holds and keeps it asleep. In peace she talks with the owner,
     clarifies and orders goals. When no supervisor is alive, or a help request waits past the threshold, she runs
     the operation herself and wakes the machinery until it runs again (PC-D1).
   - One help channel: every head raises `coordination-help` to the supervisor; heads do not talk to Miu directly in
     peace; owner decisions go through the question store (PC-D5).
   - The supervisor's rhythm is the keeper's of plan `261122-0056-orchestration-skeleton`, named as such, not
     specified here.
2. In `docs/platform/session-host/spec.md`, point the persona rows of the secretary and the supervisor to that
   section; no second copy of the charter.
3. In `core/skills/fgos-secretary/SKILL.md`, replace the line-18 sentence and the "not in your grant" list with the
   charter: these verbs are hers, dormant, used only in takeover (phase 3 adds the takeover steps). Keep every peace-time
   rule (she never reads diffs, edits code, runs tests or lands code).
4. In `core/skills/fgos-supervisor/SKILL.md`, widen its scope to every agent with no lead (PC-D2), and name the help
   queue as one of its inputs.
5. In `core/agents/secretary.yaml` and `core/agents/supervisor.yaml`, say the same in the description, then run
   `node scripts/project-agents.mjs` to regenerate `.claude/agents/secretary.md` and `.claude/agents/supervisor.md`.
6. Run `npm run build:skills`.

## Verify

```bash
npm run build:skills
node scripts/project-agents.mjs --check 2>/dev/null || node scripts/project-agents.mjs
rg -n "never .*(reads|types into) .*session|not in your grant|those are the supervisor's" core/skills/fgos-secretary/SKILL.md core/agents/secretary.yaml
node --test test/skills
```

Pass: the build and projection leave no diff after a second run, the `rg` finds nothing, and the skills tests are
green.

## Rollback

`git revert` the phase's commits and rerun `npm run build:skills` and `node scripts/project-agents.mjs`.
