# tsk-5ge — Iron Law evidence

`classifyIronLaw` result on this item's branch-committed diff
(`changedFiles(repoRoot, item)` against trunk — `fgw/tsk-5ge` only ever
carries `docs/history/tsk-5ge-judge-decompose-config-fix/plan.md`, per
`ADR0020`; the item's real deliverable landed as commit `5ca7a58` directly
on `main`, outside this branch):

```json
{"required":true,"matchedFlags":["delete"],"matchedModules":[]}
```

`matchedFlags: ["delete"]` comes from the item's own description text
("then delete the executors.judge key entirely"), a keyword match, not a
code-symbol match (`matchedModules` is empty — the branch's own diff is
docs-only). The real deletion this flag refers to happened directly on
main (commit `5ca7a58`), so the failing-test-first proof below is taken
against that commit, not against this branch.

## Failing-test-first proof

`test/runner/dispatch.test.mjs`, run against the pre-fix main-checkout
`.fgos/config.json` (`git checkout 784bcbc -- .fgos/config.json`, the
parent of this item's fix commit `5ca7a58`, swapped in temporarily then
restored — `git status --short -- .fgos/config.json` confirmed clean
against `HEAD` afterward):

```
✖ the "decide" CLI entry point (node src/runner/dispatch.mjs decide <capacityId>) prints {mechanism} JSON to stdout for a real invocation against this repo's own .fgos/config.json (36.864718ms)
  AssertionError [ERR_ASSERTION]: runner config (/home/vantt/projects/forgentX/.fgos/config.json#runner) "executors" key "judge" is not a tier — valid keys are light/standard/heavy.

✖ the "resolve" CLI entry point (node src/runner/dispatch.mjs resolve <capacityId>) prints {command,args,provider,model} JSON to stdout for a real invocation against this repo's own .fgos/config.json (37.344185ms)
  AssertionError [ERR_ASSERTION]: runner config (/home/vantt/projects/forgentX/.fgos/config.json#runner) "executors" key "judge" is not a tier — valid keys are light/standard/heavy.

✖ the "resolve" CLI entry point honors --model, overriding the computed default (tsk-2k1, D10) (38.818958ms)
  AssertionError [ERR_ASSERTION]: runner config (/home/vantt/projects/forgentX/.fgos/config.json#runner) "executors" key "judge" is not a tier — valid keys are light/standard/heavy.

✖ the "resolve" CLI entry point honors --tier, changing which configured model resolves (tsk-2k1, D10) (50.161839ms)
  AssertionError [ERR_ASSERTION]: runner config (/home/vantt/projects/forgentX/.fgos/config.json#runner) "executors" key "judge" is not a tier — valid keys are light/standard/heavy.

ℹ tests 139
ℹ pass 135
ℹ fail 4
```

This is the exact failure this item's own description warned about:
`tsk-4eu`'s validation (`src/runner/dispatch.mjs`, delivered, live on
`main`) now throws `RunnerConfigError` for `.fgos/config.json`'s
`executors.judge` key the moment anything resolves the runner config
against the real main-checkout file — no longer a silent fallback, a hard
failure.

Same test, same repo, post-fix (`.fgos/config.json` restored to `HEAD`,
i.e. commit `5ca7a58`):

```
ℹ tests 139
ℹ pass 139
ℹ fail 0
```

## Full item verify command (already run, both pre- and post-fix above)

```
node --test test/runner/dispatch.test.mjs
```

This is the item's own recorded `verify` command
(`fgos list --id tsk-5ge --json`'s `data.work.tsk-5ge.verify`). It
legitimately proves the fix even though `fgw/tsk-5ge`'s own branch commit
carries no code diff: `dispatch.mjs`'s CLI entry point
(`resolveMainCheckoutRoot`, `src/runner/dispatch.mjs:1104`) resolves
`.fgos/config.json` against the shared main-checkout root regardless of
which worktree the test file itself runs from — confirmed directly by
reading that line, and by the real runs above.
