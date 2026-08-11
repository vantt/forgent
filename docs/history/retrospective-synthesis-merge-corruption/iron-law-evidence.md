# Iron Law evidence — tsk-2oy

`classifyIronLaw` on this item's committed diff (`cc887310`) returns
`required: true`, `matchedFlags: ["audit"]`, `matchedModules: []`:

```json
{
  "filesChanged": [
    ".agents/skills/fgos-coding-compounding/SKILL.md",
    ".claude/skills/fgos-coding-compounding/SKILL.md",
    "docs/history/retrospective-synthesis-merge-corruption/CONTEXT.md",
    "docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md",
    "docs/history/retrospective-synthesis-merge-corruption/plan.md"
  ],
  "result": {
    "required": true,
    "matchedFlags": ["audit"],
    "matchedModules": []
  }
}
```

## Where the flag actually came from

`audit` matches this item's own description text — tsk-2oy repairs a hole
in the main-checkout write path (`fgos-coding-compounding` step 3's retrospective-
synthesis commit) that silently corrupted the git-history audit trail
(confirmed 5 real instances in `RESEARCH.md`). This is the expected match,
not a false positive: the whole point of this item is an audit-trail
integrity fix.

## Test command

Per `plan.md`'s Proof surface (skill-prose verify shape,
`docs/how-to/write-verify-for-a-skill-prose-change.md`):

```
npm test && grep -qF "refusing to commit — MERGE_HEAD is set" .claude/skills/fgos-coding-compounding/SKILL.md && grep -qF 'git -C "$root" commit -m "docs(<id>): retrospective synthesis"' .claude/skills/fgos-coding-compounding/SKILL.md && grep -qF "refusing to commit — MERGE_HEAD is set" .agents/skills/fgos-coding-compounding/SKILL.md && grep -qF 'git -C "$root" commit -m "docs(<id>): retrospective synthesis"' .agents/skills/fgos-coding-compounding/SKILL.md
```

## Failing-before / passing-after transcript (real, not paraphrased)

**Before** (`git show HEAD~1:.claude/skills/fgos-coding-compounding/SKILL.md`,
the commit immediately prior to the guard landing):

```
$ grep -qF "refusing to commit — MERGE_HEAD is set" /tmp/before-claude-skill.md && echo "POSITIVE claude: MATCH (unexpected)" || echo "POSITIVE claude: NO MATCH (expected -- guard not written yet)"
POSITIVE claude: NO MATCH (expected -- guard not written yet)
```

**After** (working tree, same file, this item's own commit `cc887310`):

```
$ grep -qF "refusing to commit — MERGE_HEAD is set" .claude/skills/fgos-coding-compounding/SKILL.md && echo "POSITIVE claude: MATCH (expected)" || echo "POSITIVE claude: NO MATCH (unexpected)"
POSITIVE claude: MATCH (expected)
```

Full `npm test` run (2851 tests, 2846 pass, 5 skipped, 0 fail) and all four
`grep -qF` assertions (both `.claude/` and `.agents/` mirrors, POSITIVE and
SURVIVE) confirmed passing together as the item's own real `verify`
command, immediately before `fgos return`.

## A real bug this verify caught in itself

The first version of this item's own `verify` used plain `grep -q`
(regex mode) against a pattern containing `docs(<id>)` — the parentheses
were interpreted as a regex group, so the SURVIVE assertion never matched
the file's own literal text even though the guard was correctly written.
Fixed to `grep -qF` (fixed-string, no regex interpretation) — see
`plan.md`'s Proof surface section for the full write-up. Caught by
actually running the verify for real before `fgos return`, not assumed
correct from the plan's own written text.
