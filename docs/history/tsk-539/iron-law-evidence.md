# tsk-539 — Iron Law evidence

`classifyIronLaw` result on the real committed diff (`fgw/tsk-539`,
commit `9828447d`):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": ["src/state/status-fsm.mjs"]
}
```

## Test command

The item's own recorded `verify`:

```
npm test && for f in .agents/skills/fgos-coding-exploring/SKILL.md .agents/skills/fgos-coding-validating/SKILL.md .agents/skills/fgos-coding-implement/SKILL.md .agents/skills/fgos-coding-shaping/SKILL.md plugins/fgOS/skills/fgos-coding-exploring/SKILL.md plugins/fgOS/skills/fgos-coding-validating/SKILL.md plugins/fgOS/skills/fgos-coding-implement/SKILL.md plugins/fgOS/skills/fgos-coding-shaping/SKILL.md; do grep -q 'citation-format.md' "$f" || exit 1; done
```

## Failing-before, real transcript excerpt

Captured from a real `npm test` run against this branch, at the point the
`transitionWork` check had already landed (via the out-of-process `agy`
dispatch) but the production callers (`discovery.mjs`, `plan.mjs`) and
several test fixtures had not yet been updated — proving the check
actually rejects real, non-compliant `ask` text rather than being a
no-op:

```
test at test/e2e/runner-loop.test.mjs:327:1
✖ e2e stage-clarify (b) unclear verdict: an explicit discover --verdict unclear parks the item in awaiting-human with the exact question; answering resumes it to todo, and --once still never re-judges clarify on its own (D16) (1262.156235ms)
  AssertionError [ERR_ASSERTION]: discover failed: fgos: transitionWork: "ask" for work "tsk-3js" must contain structurally complete Markdown headings with at least 20 characters of content under each. Missing or incomplete: ## Context, ## Why this matters.


  4 !== 0

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-539-8qVrOB/test/e2e/runner-loop.test.mjs:355:10)
```

That run's real summary: 117 failing tests across 8 files (`test/state/
awaiting.test.mjs`, `test/intake/plan.test.mjs`, `test/intake/
discovery.test.mjs`, `test/cli/fgos-read.test.mjs`, `test/cli/
fgos-stage.test.mjs`, `test/cli/fgos-move.test.mjs`, `test/e2e/
runner-loop.test.mjs`, `test/runner/loop.test.mjs`) — the real blast
radius the reality-gate's own "existing covered behavior" flag named,
now concretely enumerated.

## Passing-after, real transcript excerpt

Same test, same repo, after `discovery.mjs`/`plan.mjs`'s own auto-generated
`ask` text and every affected fixture were updated to the required
`## Context` / `## Why this matters` structure:

```
✔ e2e stage-clarify (b) unclear verdict: an explicit discover --verdict unclear parks the item in awaiting-human with the exact question; answering resumes it to todo, and --once still never re-judges clarify on its own (D16) (1611.64849ms)
```

Full-suite real summary, same run:

```
ℹ tests 3624
ℹ suites 0
ℹ pass 3619
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

The item's own full `verify` command (`npm test` plus the 8-file
`citation-format.md` grep loop) was also run standalone after this point
and exits `0`.
