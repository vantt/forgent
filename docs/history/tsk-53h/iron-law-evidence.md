# Iron Law evidence — tsk-53h

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-53h"
```

Result: `{"required":true,"matchedFlags":["auth","schema"],"matchedModules":[]}`

`filesChanged` (the real diff this ran against):

```
.agents/skills/_shared/capacity-dispatch-fallback.md
.agents/skills/fgos-submit-assist/SKILL.md
.claude/skills/_shared/capacity-dispatch-fallback.md
.claude/skills/fgos-submit-assist/SKILL.md
.gitignore
docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md
docs/history/agent-executor-generalized-capacity-helper/plan.md
docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md
test/skills/fgos-mirror.test.mjs
```

`matchedModules` is empty — no file in this diff matches any
`MODULE_RULES` entry in `src/evolve/iron-law.mjs` (no `src/runner/`,
`src/evolve/`, `bin/fgos.mjs`, `src/state/store.mjs`,
`src/state/fsm.mjs`, `src/intake/risk-keywords.mjs`,
`src/intake/classify.mjs`, or `src/state/workflow-stage-graphs.mjs`
touched). Confirmed: this diff is entirely doc/skill-tree/test-file, no
`src/` runtime code.

## Why `required: true` fires anyway — false positive, root-caused

`matchedFlags` comes from `classifyIronLaw`'s `description` scan
(`src/evolve/iron-law.mjs:83-91`): a case-insensitive
`description.includes(keyword)` substring check against every
`HEAVY_KEYWORDS` entry, run against `tsk-53h`'s own item description (a
long, accumulated research log, not this diff's content). Traced both
matches directly in that description text:

- **`auth`** — matched inside the word "**auth**or" ("...the shared
  skill-facing helper this item still needs to **author** should
  apply..."), not a reference to authentication/authorization.
- **`schema`** — a real word, but about an unrelated topic: a discussion
  of Codex's `.codex/agents/<name>.toml` file format being "a DIFFERENT
  **schema** than Claude's `.claude/agents/<name>.md`" — an
  agent-definition file format comparison from this item's own
  clarify-stage research, not a data-model/schema change in this diff.

`classifyIronLaw`'s keyword scan is deliberately over-inclusive by design
("over-reporting... is the safe direction", `src/evolve/iron-law.mjs:18`)
— this evidence file exists because the hard rule requires it whenever
`required: true`, not because a real auth/schema risk exists in this
diff. `matchedModules: []` is the more meaningful signal here: no
self-modifying-capable module was touched.

## No failing-test-first story applies — real evidence instead

The standard recipe (`docs/how-to/produce-failing-test-first-proof-for-an-
iron-law-gated-diff.md`) assumes a bug is being fixed: stash the
implementation, watch a real test go red, restore, watch it go green.
That doesn't fit here — this diff extracts existing, already-correct
prose into a shared file and adds new drift-detection coverage for it;
there is no pre-existing bug to demonstrate. Instead, real evidence that
the one new behavior this item introduces (mirror enforcement for
`_shared/`) actually has teeth, not a vacuous assertion:

**Red** (temporarily removed `.agents/skills/_shared/capacity-dispatch-
fallback.md` only, leaving the `.claude/` side and the test file
untouched):

```
✖ .claude/skills/_shared and .agents/skills/_shared mirror each other byte-identically (1.196804ms)
  AssertionError [ERR_ASSERTION]: _shared: the two trees list different files — a mirror must not add or drop files on either side
  + actual - expected

  + []
  - [
  -   'capacity-dispatch-fallback.md'
  - ]
ℹ tests 4
ℹ pass 3
ℹ fail 1
```

**Green** (restored via `git checkout HEAD -- .agents/skills/_shared/
capacity-dispatch-fallback.md`, identical command, no code changed):

```
✔ .claude/skills and .agents/skills declare the exact same set of fgos-* skill names (1.399146ms)
✔ every mirrored fgos-* skill directory contains the exact same set of relative file paths (1.641074ms)
✔ every mirrored file pair is byte-identical (1.088886ms)
✔ .claude/skills/_shared and .agents/skills/_shared mirror each other byte-identically (0.364681ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

Working tree confirmed clean (aside from the pre-existing, untouched
sparse-checkout `.fgos/*` deletions every session in this worktree sees,
per ADR0020 — not part of this diff) after the restore.

## Item's own verify command

```
node --test test/skills/fgos-mirror.test.mjs
```

```
✔ .claude/skills and .agents/skills declare the exact same set of fgos-* skill names
✔ every mirrored fgos-* skill directory contains the exact same set of relative file paths
✔ every mirrored file pair is byte-identical
✔ .claude/skills/_shared and .agents/skills/_shared mirror each other byte-identically
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Manual live-dispatch acceptance proof

Per the plan's pinned constraint, run from the main checkout (not this
item's own worktree — `resolveCapacityCli`'s git-based root resolution
misreports a registered capacity as unregistered from inside a linked
worktree):

```
$ node src/runner/dispatch.mjs resolve submit-assist-classify --prompt "..."
{"command":"agy","args":[...],"provider":"agy","model":"Gemini 3.5 Flash (Medium)"}

$ agy -p "...Ask: \"clean up leftover console.log statements in the auth module\"" --model "Gemini 3.5 Flash (Medium)"
tier: light
kind: chore
risk: low
reasoning: Removing leftover console.log statements from the auth module is a straightforward cleanup task with no functional impact or risk.
```

Sane, parseable response — confirms the rewrite (fgos-submit-assist now
pointing at the shared fragment instead of inlining the branch logic)
didn't change the real dispatch behavior.

## Full suite (regression check)

```
node --test 'test/**/*.test.mjs'
```

```
ℹ tests 2366
ℹ pass 2361
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

0 failures, 5 pre-existing skips — no regression anywhere else in the
suite from this diff.
