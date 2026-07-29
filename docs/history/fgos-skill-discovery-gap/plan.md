# fgos skill discovery gap — plan

## Mode

**Spike.** One yes/no question decides whether any fix here is even real:
*does renaming `.claude/skills/fgos/` to a name that doesn't collide
case-insensitively with `plugins/fgOS/` restore discovery of the 8
`fgos-*` skills?* Everything downstream (whether this becomes a rename,
a plugin-registration duplication per the rejected option, or something
else) depends on that answer.

Flag count against `CONTEXT.md`'s D1 (root-cause before fixing): 2 —
existing covered behavior (every session opening in this repo is
supposed to load `fgos-routing` first, per `AGENTS.md`; that path is
currently broken for all of them), and weak proof around the area (no
one has verified how the harness's project-skill scan actually behaves
here). 2 flags alone would suggest `standard`, but the single
decisive-question criterion overrides that and puts this at `spike`.

## Approach

**New evidence found during this bootstrap step (cites `CONTEXT.md` D1,
does not reopen it — D1 said root-cause first, not "no rename ever";
this is the root-cause D1 asked for):**

`plugins/fgOS/` and `.claude/skills/fgos/` are the same string once
case-folded (`"fgOS".toLowerCase() === "fgos"`). Neither `gitnexus`
(the working counterexample from `CONTEXT.md`) nor `distill` (the flat
working example) has a same-named plugin anywhere under `plugins/`:

```
$ ls plugins/
dogfood-fixture/
fgOS/
```

Only one plugin exists whose name collides with a `.claude/skills/`
subdirectory, and that subdirectory is exactly the one whose 8 skills
are invisible to `Skill()`. This is the strongest lead available from
inside the repo: a plausible mechanism is that the harness's
skill-discovery scan treats a `.claude/skills/<name>/` subtree as
already claimed once a plugin named `<name>` (case-insensitively) is
enabled, and silently drops the project-level entries rather than
merging or erroring — which would explain both the missing
available-skills-list entries and the identical "Unknown skill" result
for scoped and unscoped invocation alike.

**Rejected alternative (from `CONTEXT.md`'s options that were not
picked):** duplicating the 8 skills into `plugins/fgOS/skills/*` was
rejected precisely because it doubles maintenance of routing-critical
text going forward, and — new to this plan — would not even test
whether the collision hypothesis is right; it would just permanently
route around an unconfirmed cause.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Rename `.claude/skills/fgos/` → non-colliding name | Low risk to apply (rename + update every reference), but the *fix* only works if the collision hypothesis is actually the cause | A fresh session (new `/clear` or new session, since the available-skills list is fixed at session start and will not re-scan mid-session) shows the renamed skills in its available-skills list and `Skill()` resolves them |
| References to the old path | Low — mechanical grep/replace, no logic change | `grep -rn '.claude/skills/fgos/'` returns zero hits after the rename |
| Hypothesis turns out wrong | Medium — if renaming does *not* fix discovery, the real cause is still open and this spike returns with a `false` on its one question, per spike's own contract | The fresh-session check above returning "still missing" is itself the disproof |

Files likely touched if the rename proceeds: the 8
`.claude/skills/fgos/<name>/SKILL.md` files (move only, no content
change), and `AGENTS.md`'s "fgOS Workflow" section (`AGENTS.md:47`, the
only real hit for `.claude/skills/fgos/`). **Corrected at
`fgos-validating`**: `CLAUDE.md` does not need touching — it carries no
direct reference of its own, only `@AGENTS.md`, which pulls the real
reference in at context-load time. This item's own routing skill's
self-references (`fgos-routing`, `fgos-exploring`, `fgos-planning` all
cite `.claude/skills/fgos/...` paths in their own prose) also need the
update.

`fgos graph --what-if tsk-d3c --json` reports `unblocksTransitive: 0` —
nothing else in the backlog is waiting on this item, so there is no
ordering constraint from other work.

## Shape (spike — one open question)

**Open question:** does the rename alone restore discovery, confirming
the case-fold collision as root cause?

This cannot be answered inside the current session — the available-skills
list a session sees is fixed at session start (this session's own list
was generated before any of today's investigation, and renaming a
directory mid-session will not cause a re-scan). The test needs a
**separate, later session** with the rename already applied:

1. Rename `.claude/skills/fgos/` to `.claude/skills/fgos-workflow/`
   (chosen to keep the domain readable, avoid the `fgOS`/`fgos` collision
   with `plugins/fgOS/`, and avoid colliding with any other existing
   plugin or skill name — checked: no `plugins/*/skills/fgos-workflow`
   and no other `.claude/skills/fgos-workflow` exist today).
2. Update the 8 moved `SKILL.md` files' self-references and
   `AGENTS.md`/`CLAUDE.md`'s "fgOS Workflow" section pointer
   (`.claude/skills/fgos/fgos-routing/SKILL.md` →
   `.claude/skills/fgos-workflow/fgos-routing/SKILL.md`) so the "load it
   first" instruction still resolves.
3. Commit, then open a **fresh** Claude Code session in this repo (a
   real new session or `/clear`, not a continuation) and check whether
   `fgos-routing` (and the others) now appear in that session's
   available-skills list, and whether `Skill({skill: "fgos-routing"})`
   resolves.
4. If yes — collision confirmed as root cause, rename stands as the
   fix, item can move toward `executing`/close. If no — the rename
   itself gets reverted (it cost nothing but a mechanical move) and the
   real cause is still open; the next session picks up from there with
   the collision hypothesis ruled out, which is itself useful signal to
   carry forward.

No split proposed — this is one honestly-sized piece of work: a
mechanical rename + a same-repo test of one hypothesis. `tiny`/`small`
would undersell the fact that a wrong answer here needs a real
follow-up investigation, but a `standard` phased plan or a further
child-item split would overstate work that is, at its core, one
rename and one observation.

## Verify

`grep -rn '\.claude/skills/fgos/' . --include='*.md' --include='*.mjs'`
returns zero hits after the rename (excluding this plan/CONTEXT
documenting the historical path), **and** a fresh session's
available-skills list includes `fgos-routing` (or whatever namespaced
form the harness settles on) where today it is silently absent.
