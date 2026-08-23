# Plan — tsk-3f9k

Mode: tiny

0 flags apply (no auth, no data model, no audit/security, no external
system, no public contract, no cross-platform surface, no existing covered
behavior, no weak-proof area, single domain) — a couple of files, one
direct task, prose-only.

## Approach

Per `RESEARCH.md` Round 1: additive prose only, no `src/` touched. Traced
the mirror pipeline (`src/setup/skill-wrappers.mjs`) to find each file's
real canonical source (never edit a generated mirror directly):

- `core/skills/` — domain-agnostic canonical skill authoring.
- `domains/<domain>/skills/` — domain-specific canonical skill authoring.
- `assembleSkills` copies both of the above into `.agents/skills/`
  (generated).
- `generateAllSkillWrappers` generates `.claude/skills/*/SKILL.md` thin
  wrappers from `.agents/skills/*/SKILL.md` (generated).
- `mirrorDevSkillsIntoPlugin` copies `.agents/skills/_shared` and every
  `.agents/skills/fgos-*` into `plugins/fgOS/skills/` (generated).
- `plugins/fgOS/skills/approve/SKILL.md` has no canonical source anywhere
  else (confirmed via `git ls-files`) — it is edited directly, exactly as
  tsk-1uf's own commit (90ada78e) already did.

Two edits, at their real canonical source:

1. **`core/skills/_shared/executor-dispatch-fallback.md` Step B** —
   currently has zero `ScheduleWakeup` guidance at all, despite being the
   most-cited Monitor-based out-of-process dispatch pattern in the repo
   (its own "Precedent" section cites 6 consuming stage skills). Add the
   same Waiting-rule callout the other 3 docs already carry, right after
   the existing "Run this through the Monitor tool" paragraph, before
   "Once Monitor reports the command exited, read its final line."

2. **All 4 docs that carry (or will carry) the Waiting-rule callout**
   (`core/skills/_shared/executor-dispatch-fallback.md`,
   `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md`,
   `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md`,
   `plugins/fgOS/skills/approve/SKILL.md`) — the existing wording only
   prohibits (`Do NOT use ScheduleWakeup or polling`). Add the concrete
   required action right after the prohibition: end the turn with no
   further tool call once the background command/Monitor is started; the
   harness delivers a task-notification event on its own and resumes the
   session with the result already available — no tool call is needed or
   correct to "wait".

No split — one small, mechanical doc-consistency fix.

## Files touched (canonical, hand-edited)

- `core/skills/_shared/executor-dispatch-fallback.md`
- `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md`
- `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
- `plugins/fgOS/skills/approve/SKILL.md`

## Files regenerated (never hand-edited directly)

Run `npm run build:skills` after the canonical edits above, which
regenerates:
- `.agents/skills/_shared/executor-dispatch-fallback.md`
- `.agents/skills/fgos-coding-implement/references/return-mechanics.md`
- `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
- `.claude/skills/fgos-coding-implement/references/return-mechanics.md`
  (and any other `.claude/skills` wrapper depending on assembled content)
- `.claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/fgos-coding-implement/references/return-mechanics.md`
- `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md`

Verify these regenerated copies actually changed (`git status`/`git diff`)
after running the build step — if a mirror path doesn't move, the
canonical edit landed in the wrong source file.

## Verify

```
npm run build:skills && npm test && grep -q 'end the turn' plugins/fgOS/skills/_shared/executor-dispatch-fallback.md && grep -q 'ScheduleWakeup' plugins/fgOS/skills/_shared/executor-dispatch-fallback.md && grep -q 'end the turn' plugins/fgOS/skills/fgos-coding-implement/references/return-mechanics.md && grep -q 'end the turn' plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q 'end the turn' plugins/fgOS/skills/approve/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

## Outstanding questions

None.
