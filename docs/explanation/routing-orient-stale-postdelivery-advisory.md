---
authoritative_for: fgos-routing Orient stale post-delivery advisory, hand-editing a generated skill render target gets silently reverted
---

# `fgos-routing`'s Orient step now surfaces the stale post-delivery advisory itself

`tsk-4dk-2` (a child of `tsk-4dk`, tracking the broader 96%-of-worktrees-
already-delivered cleanup backlog) closed a small but real visibility
gap: `fgos stale --json`'s `postDelivery` advisory — flagging items
sitting stale in `delivered`/`retrospective`/`cleanup` — was only ever
seen by someone who remembered to type `fgos stale` by hand.

## What shipped

`fgos-routing`'s own Orient section now checks the stale post-delivery
advisory during Orient itself (inspecting `fgos stale --json`'s
`postDelivery` field, the same way `bin/fgos.mjs`'s own `stale` case
does) and prints a one-line summary when anything is stale — so a person
opening a session actually sees when the backlog needs a sweep, instead
of the advisory sitting invisible until someone thinks to ask for it.

## A real self-caught mistake along the way

The first commit hand-edited `.agents/skills/fgos-routing/SKILL.md`
directly — but that file is itself **generated** (`assembleSkills`) from
`core/skills/fgos-routing/SKILL.md`. A hand-edit to the generated copy is
silently reverted by anything that regenerates it
(`materializeSkillsIntoProject`) — confirmed reproducing this exact
revert **twice** against the same worktree via
`test/setup/doctor-fresh-run.test.mjs`. The follow-up commit corrected
this by editing the real source and running `npm run build:skills`,
which also picked up the one mirror target
(`plugins/fgOS/skills/fgos-routing/SKILL.md`) the original hand-edit had
never touched — `.agents/skills`/`.claude/skills` already matched by
that point. A concrete instance of the general rule this repo's own
skill-authoring pipeline enforces: edit `core/skills/`/`domains/<name>/
skills/`, never a rendered copy directly.
