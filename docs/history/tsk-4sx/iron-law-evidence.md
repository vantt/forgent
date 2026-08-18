# Iron Law evidence — tsk-4sx

## classifyIronLaw result (against the real committed diff)

```json
{"required":true,"matchedFlags":["audit"],"matchedModules":[]}
```

Run against `changedFiles(repoRoot, item)` AFTER committing the real
implementation (`ad192a6d`), per the ordering
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`
requires to avoid the `tsk-2l0` false-negative.

## Why this trips the gate

`matchedFlags: ["audit"]` is incidental, not descriptive of this item's
own nature: the word "audit" appears in this item's description only
inside a quoted path name it cites for context
(`docs/history/tsk-49i-iron-law-port-followup-audit/plan.md`, the prior
item's own feature dir), not because this item is itself an audit.
`matchedModules` is empty — `.agents/skills/fgos-coding-planning/SKILL.md`
and its `plugins/fgOS/skills/` mirror are not on the Iron Law's
self-modifying gated-module list (`src/evolve/iron-law.mjs`'s
`MODULE_RULES`).

## Real evidence: the POSITIVE clause is a genuine failing-then-passing pair

Unlike a comment-only edit, this diff adds real, grep-detectable content —
so the standard failing-test-first shape applies directly, captured live
during this session rather than reconstructed after the fact:

**Before** (ran during `fgos-coding-validating`'s reality gate, prior to
any edit):
```
$ grep -q "docs-ref" .agents/skills/fgos-coding-planning/SKILL.md && echo POSITIVE1_PASS || echo POSITIVE1_FAIL
POSITIVE1_FAIL_asexpected
```

**After** (ran post-implementation, post-commit):
```
$ grep -q "docs-ref" .agents/skills/fgos-coding-planning/SKILL.md && echo POSITIVE1_PASS || echo POSITIVE1_FAIL
POSITIVE1_PASS
$ grep -q "docsRef" .agents/skills/fgos-coding-planning/SKILL.md && echo POSITIVE2_PASS || echo POSITIVE2_FAIL
POSITIVE2_PASS
```

**NEGATIVE clause** (scope containment — this item must not touch `src/`):
```
$ git diff --name-only main...HEAD | grep "^src/" # (none)
$ ! git diff --name-only main...HEAD | grep -q "^src/" && echo NEGATIVE_PASS
NEGATIVE_PASS
```
`git diff --name-only main...HEAD` after the implementation commit:
`docs/history/tsk-4sx/RESEARCH.md`, `docs/history/tsk-4sx/plan.md`,
`.agents/skills/fgos-coding-planning/SKILL.md`,
`plugins/fgOS/skills/fgos-coding-planning/SKILL.md` — no `src/` file.

## Full suite: `npm test`, post-fix

```
ℹ tests 3464
ℹ suites 0
ℹ pass 3459
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 115377.946058
```

Regression risk is structurally bounded by the NEGATIVE clause above: this
item never touches `src/`, so there is no executable-code path for a
regression to hide in beyond the prose file itself, and `test/skills/
fgos-mirror.test.mjs` (part of the same `npm test` run) is the one test
file that would actually catch a drift between the `.agents/skills/` and
`plugins/fgOS/skills/` copies — it passed, confirming both copies stayed
byte-identical after `npm run build:skills`.
