# Iron Law evidence — tsk-12p

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-12p`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Why this flags true with no RED/GREEN transcript below

`fgw/tsk-12p` branched off `fgw/tsk-4b2` (this item's `parent`) before piece 1
merged to `main` (`git merge-base main fgw/tsk-12p` == `50aa8317`, the same
point `fgw/tsk-4b2` itself branched from). `trunk...branch` therefore includes
every ancestor commit still unmerged from `fgw/tsk-4b2`, including
`5b394faf` (`feat(tsk-4b2): wire discovery/exploring stages into the real
flow`), which is what actually touches `bin/fgos.mjs` and trips the
`matchedModules` check — not this item's own commit.

This item's own commit (`d7ce57c6`,
`fix(fgos-routing): correct clarify row, add discovery/exploring rows to
stage table`) touches exactly two files, both prose:
`.claude/skills/fgos-routing/SKILL.md` and
`.agents/skills/fgos-routing/SKILL.md`. Zero code changed, so there is no
executable behavior for a RED/GREEN test transcript to prove here.

The inherited `bin/fgos.mjs` change already has its own real,
non-fabricated failing-test-first evidence, recorded when piece 1 landed it:
`docs/history/tsk-4b2/iron-law-evidence.md` (commit `b8b5aa6d`,
`docs(tsk-4b2): Iron Law RED/GREEN evidence`). That file is the actual proof
for the flagged module; this file exists only to trace *why* the mechanical
classifier flagged `required: true` for a diff this item's own change did
not create, per the standing rule against fabricating a transcript that
doesn't exist.

Once `fgw/tsk-4b2` (piece 1) merges to `main`, `trunk...fgw/tsk-12p` will no
longer include those ancestor commits, and the same classify call against
this item's own commit alone would read `required: false` (no matched
modules — its diff is two `SKILL.md` files with no Iron Law flag pattern).

## This item's own verify (unaffected, real)

```
npm test \
  && grep -q "\`fgos-clarifying\`" .claude/skills/fgos-routing/SKILL.md \
  && grep -q "| \`discovery\` |" .claude/skills/fgos-routing/SKILL.md \
  && grep -q "| \`exploring\` |" .claude/skills/fgos-routing/SKILL.md \
  && ! grep -q "\`clarify\`.*\`fgos-coding-exploring\`" .claude/skills/fgos-routing/SKILL.md
```

All four checks pass; `npm test` passes 2745/2750 (5 pre-existing skips, 0
fail).
