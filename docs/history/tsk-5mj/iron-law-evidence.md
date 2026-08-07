# Iron Law evidence — tsk-5mj

`classifyIronLaw` result against the real committed diff (`src/runner/merge.mjs`'s `changedFiles`, root = main checkout):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch.mjs",
    "src/runner/loop.mjs",
    "src/runner/prompt-templates.mjs",
    "src/runner/prompt-templates/worker-prompt-discovery.txt",
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Test command

```
node --test test/runner/dispatch.test.mjs test/runner/prompt-templates.test.mjs
```

## Failing-before

Restored `src/runner/dispatch.mjs` and `src/runner/prompt-templates.mjs` to
their pre-tsk-5mj committed content (`git show HEAD~1:<path>`), kept the new
test files, ran the command above:

```
✖ buildPrompt with stage:"discovery" points the Agent skill section at fgos-researching's SKILL.md and selects the discovery template (7.633963ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

    assert.ok(prompt.includes('.claude/skills/fgos-researching/SKILL.md'))

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5mj-DyAjgv/test/runner/dispatch.test.mjs:189:10)

✖ selectTemplate resolves a coding-domain, stage:"discovery" input to the discovery template instead of the skill-pointer one (1.000931ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'worker-prompt-skill-pointer.txt'
  - 'worker-prompt-discovery.txt'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5mj-DyAjgv/test/runner/prompt-templates.test.mjs:35:10)
```

(A third assertion in the same run — `spawnWorker with opts.stage:"discovery"
logs the discovery templateName...` — failed the same way, same root cause:
the old `dispatch.mjs`/`prompt-templates.mjs` have no `stage`-aware
selection at all.) 3 failed, 154 passed.

## Passing-after

Restored the real tsk-5mj committed content, reran the same command:

```
ℹ tests 157
ℹ suites 0
ℹ pass 157
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short src/runner/dispatch.mjs src/runner/loop.mjs
src/runner/prompt-templates.mjs` confirmed all three were restored
byte-identical to the committed version before continuing (no stray diff
left behind by this evidence-gathering swap).
