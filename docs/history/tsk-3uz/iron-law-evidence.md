# Iron Law evidence — tsk-3uz

## classifyIronLaw result

```json
{"required": true, "matchedFlags": ["audit"], "matchedModules": []}
```

`matchedModules` is empty — neither changed file
(`.claude/skills/fgos-coding-planning/SKILL.md`,
`.agents/skills/fgos-coding-planning/SKILL.md`) matches any Iron Law
self-modifying-capable module rule (`src/evolve/iron-law.mjs`'s
`MODULE_RULES`). `required: true` here comes entirely from the item's own
`description` matching the `audit` HEAVY_KEYWORDS entry — the description
cites "STR92 audit 2026-07-23" as the scout evidence naming this gap, not
an actual audit/security-sensitive change. Named plainly per D1's own
"failing-test-first proof" pin (docs/history/tsk-5t3-iron-law-evidence-
contract/CONTEXT.md), applied here even though it is a keyword
false-positive on prose that happens to contain the word "audit".

## Test command (the item's own recorded `verify`)

```bash
awk '/Decide the split/,0' .claude/skills/fgos-coding-planning/SKILL.md | grep -q -- '--footprint' && awk '/Decide the split/,0' .agents/skills/fgos-coding-planning/SKILL.md | grep -q -- '--footprint'
```

## Failing before

```
$ git show HEAD:.claude/skills/fgos-coding-planning/SKILL.md | awk '/Decide the split/,0' | grep -q -- '--footprint'; echo "before-exit=$?"
before-exit=1
$ git show HEAD:.agents/skills/fgos-coding-planning/SKILL.md | awk '/Decide the split/,0' | grep -q -- '--footprint'; echo "before-exit-agents=$?"
before-exit-agents=1
```

Matches CONTEXT.md's own scout evidence: `grep -n "footprint"
.claude/skills/fgos-coding-planning/SKILL.md` → 0 results before this change.

## Passing after

```
$ awk '/Decide the split/,0' .claude/skills/fgos-coding-planning/SKILL.md | grep -q -- '--footprint' && awk '/Decide the split/,0' .agents/skills/fgos-coding-planning/SKILL.md | grep -q -- '--footprint' && echo "verify-pass"
verify-pass
```

Both dual-root files carry byte-identical new prose (`diff` confirms
identical) in step 5 ("Decide the split"): an instruction to always pass
`--footprint` on the `fgos add --parent` call, sourced from the file list
the step's own Approach/Shape already recorded, plus one example command.
