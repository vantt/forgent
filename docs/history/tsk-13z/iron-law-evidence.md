# Iron Law evidence — tsk-13z

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-13z`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/loop.mjs",
    "src/runner/prompt-templates/worker-prompt-discovery.txt"
  ]
}
```

Matched via the `src/runner/` prefix rule (`src/evolve/iron-law.mjs`), not
a heavy-risk keyword.

## Verify command

```
npm test && grep -q "asking a person only when a genuine gap remains" .claude/skills/fgos-routing/SKILL.md && grep -q "asking a person only when a genuine gap remains" .agents/skills/fgos-routing/SKILL.md && grep -q "fgos-clarifying" .claude/skills/fgos-routing/SKILL.md && grep -q "fgos-clarifying" .agents/skills/fgos-routing/SKILL.md && ! grep -qE "clarify.*fgos-coding-exploring" .claude/skills/fgos-routing/SKILL.md && ! grep -qE "clarify.*fgos-coding-exploring" .agents/skills/fgos-routing/SKILL.md
```

(See `CONTEXT.md` D4 for why this replaces the item's original
`git merge-base --is-ancestor 7add82b8 main && npm test` — that command
was structurally unsatisfiable through `fgos approve`'s own goal-check
timing, not a defect in this item's implementation.)

This item's own fix is a real `git merge --no-ff fgw/tsk-4b2` landing
`fgw/tsk-4b2`'s already-written content — not new source written by this
item's own implementation step. The Iron Law's failing-test-first proof
is given honestly here against the concrete, measurable fact the merge
actually changes: `.claude/skills/fgos-routing/SKILL.md`'s stage-routing
table, which the RESEARCH.md round 1 pass already confirmed is a real,
still-live bug on `main` (`clarify` wrongly routed to `fgos-coding-exploring`
instead of the registry's real `fgos-clarifying`).

## RED — pre-fix (`main` at commit `11f04361`, the trunk tip this item's
branch forked from and the same tip the merge landed against)

```
$ git show main:.claude/skills/fgos-routing/SKILL.md | grep -n "clarify\` |.*fgos-coding-exploring"
139:| `clarify` | the request is still fuzzy — gray areas, missing acceptance criteria, an ambiguous ask | `fgos-coding-exploring` |

$ git show main:.claude/skills/fgos-routing/SKILL.md > /tmp/main-routing-skill.md
$ grep -q "asking a person only when a genuine gap remains" /tmp/main-routing-skill.md; echo $?
1   # not found -- the fixed row text does not exist on main yet

$ grep -qE "clarify.*fgos-coding-exploring" /tmp/main-routing-skill.md; echo $?
0   # found -- the bug (clarify wrongly paired with fgos-coding-exploring) is present
```

## GREEN — post-fix (working tree at the real committed merge on
`fgw/tsk-13z`, `git status --short` clean before this run)

```
$ grep -q "asking a person only when a genuine gap remains" .claude/skills/fgos-routing/SKILL.md; echo $?
0
$ grep -q "asking a person only when a genuine gap remains" .agents/skills/fgos-routing/SKILL.md; echo $?
0
$ grep -q "fgos-clarifying" .claude/skills/fgos-routing/SKILL.md; echo $?
0
$ grep -q "fgos-clarifying" .agents/skills/fgos-routing/SKILL.md; echo $?
0
$ grep -qE "clarify.*fgos-coding-exploring" .claude/skills/fgos-routing/SKILL.md; echo $?
1   # bug gone
$ grep -qE "clarify.*fgos-coding-exploring" .agents/skills/fgos-routing/SKILL.md; echo $?
1   # bug gone
```

Full `npm test` was also run clean against the final committed state
before `fgos return`: **2853 passing, 0 failing, 5 skipped** (up from a
2848/0/5 baseline measured on the pre-merge tree — the merge's own 96 new
assertions in `test/runner/loop.test.mjs` plus the expanded
`test/e2e/runner-loop.test.mjs` account for the difference).
