# Phase 5: Skill, specs and changelog

Capability: `code:implement`.

## Inputs

- `core/skills/fgos-shaping/SKILL.md` (the land-at-checkpoint rule, the terminal step "land with `fgos land --paths`").
- `core/agents/shaper.yaml` (description: "lands only its own discussion file").
- `docs/platform/session-host/spec.md` (head start, the verb table, task binding) and `docs/platform/supervision/spec.md` (line "Only a lead lands a branch").
- What phases 2, 3 and 4 shipped (their verbs, refusal codes, branch and path names).

## Footprint

- `core/skills/fgos-shaping/SKILL.md`, `core/agents/shaper.yaml`
- generated: `.agents/skills/fgos-shaping/SKILL.md`, `plugins/fgOS/skills/fgos-shaping/SKILL.md`, `.claude/agents/shaper.md`
- `docs/platform/session-host/spec.md`, `docs/platform/supervision/spec.md`
- `CHANGELOG.md`

## Steps

1. Skill: the shaper works in its own worktree (its cwd). Each round ends with `fgos session save
   plans/discussions/<dir> --message "<round summary>"`; nothing lands per round. When the discussion is settled or
   paused it runs `fgos land --branch discussion/<dir>` once and stops. Remove the rule that the file stays in the main
   checkout between checkpoints and the 30-minute land.
2. Agent description: the shaper saves rounds on its own branch and lands its discussion branch once.
3. Run `npm run build:skills` to regenerate the copies; never edit them by hand.
4. Specs: session-host spec gains the `workdir` launch field, the shaper worktree at start and rotation, and the
   `session save` row in the verb table; supervision spec says a lead lands a plan branch and a shaper lands its own
   discussion branch. Add a dated line to each spec's decision history citing ds-xb6hplcn2m.
5. `CHANGELOG.md` `## [Unreleased]`: one line for the shaper worktree and `fgos session save`.

## Verify

`npm run build:skills` leaves `git status` without changes to the generated copies after commit, and
`node --test test/skills` (the skill render tests) passes.

## Rollback

Revert the phase's squash commit and rebuild the skills.
