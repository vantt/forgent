# tsk-69g — Iron Law evidence

`classifyIronLaw` result (`src/evolve/iron-law.mjs`, computed against this
item's real `changedFiles(root, item)` and its own `description` field):

```json
{"required":true,"matchedFlags":["auth"],"matchedModules":[]}
```

`matchedModules` is empty — none of this item's changed files
(`docs/history/fgos-coding-shaping/CONTEXT.md`,
`docs/history/fgos-coding-shaping/plan.md`, and the three new `SKILL.md`
files once committed) match any entry in `MODULE_RULES` (no
`src/runner/`, `src/evolve/`, `bin/fgos.mjs`, `store.mjs`, `fsm.mjs`,
`risk-keywords.mjs`, `classify.mjs`, or `workflow-stage-graphs.mjs` path).

`matchedFlags: ["auth"]` is a keyword-substring hit on this item's own
`description` field — the word **"authoring"** ("does NOT duplicate
fgos-coding-exploring/fgos-coding-planning **authoring** logic") contains the literal
substring `auth`, which `classifyIronLaw`'s case-insensitive
`description.includes(keyword)` check matches against `HEAVY_KEYWORDS`.
This item makes no auth/authorization/authentication change of any kind —
it adds three new markdown skill-instruction files (no runtime auth code
path exists in any of them). Documented here per the module's own header
comment (`iron-law.mjs` lines 6–10): "a recorded residual limitation, not
a silent bug" — this is exactly that known limitation surfacing, not a
new one.

`required: true` (from `matchedFlags` alone, since `matchedModules` is
empty) still gates this item on the failing-test-first proof below, per
this skill's own "no skip on a false-positive-looking flag" rule.

## Failing-test-first proof

Item's own `verify` command (recorded on `tsk-69g`, survived two rounds of
an independent second-pass judge at `fgos-coding-exploring`):

```
test -f .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "DISCUSSION.md" .claude/skills/fgos-coding-shaping/SKILL.md && grep -qi "native-first" .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "fgos-coding-exploring" .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "fgos-coding-planning" .claude/skills/fgos-coding-shaping/SKILL.md && grep -q "^name: coding-shape$" plugins/fgOS/skills/coding-shape/SKILL.md && grep -qi "fgos-coding-shaping" plugins/fgOS/skills/coding-shape/SKILL.md && grep -q "^name: coding-shape-distill$" plugins/fgOS/skills/coding-shape-distill/SKILL.md && grep -qi "fgos-coding-shaping" plugins/fgOS/skills/coding-shape-distill/SKILL.md && grep -qi "doc-path" plugins/fgOS/skills/coding-shape-distill/SKILL.md
```

**Before** (the three new files temporarily moved aside, proving the
command genuinely fails without them, not merely untested):

```
$ test -f .claude/skills/fgos-coding-shaping/SKILL.md && ...
$ echo "BEFORE exit code: $?"
BEFORE exit code: 1
```

**After** (files restored, real content in place):

```
$ test -f .claude/skills/fgos-coding-shaping/SKILL.md && ...
$ echo "AFTER exit code: $?"
AFTER exit code: 0
```

## Scope

Covers this item's own diff only. No `src/runner/`, `src/evolve/`,
`bin/fgos.mjs`, `store.mjs`, or `fsm.mjs` code path is touched — the Iron
Law's actual self-modifying-capability concern (D10/D14) does not apply
here; this evidence exists solely because `matchedFlags` fired on a
substring inside this item's own description text.
