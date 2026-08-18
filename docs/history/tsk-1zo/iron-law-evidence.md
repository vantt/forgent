# Iron Law evidence — tsk-1zo

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on the real committed diff
(`changedFiles`, `src/runner/merge.mjs`, `trunk...fgw/tsk-1zo`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Files changed: `bin/fgos.mjs`, `src/intake/discovery.mjs`,
`test/cli/fgos-return.test.mjs`, plus the two new
`docs/history/tsk-1zo-return-verify-placeholder-guard/` docs. Required
because the change touches `bin/fgos.mjs`, the CLI entrypoint module.

## Test command

```
node --test test/cli/fgos-return.test.mjs
```

## Failing-before proof

`bin/fgos.mjs` and `src/intake/discovery.mjs` temporarily reverted to
their pre-fix committed state (`git show HEAD~1:<path>`), test file
(carrying the two new tests) left as-is:

```
test at test/cli/fgos-return.test.mjs:474:1
✖ return refuses a main-source claim whose verify is still a discovery-stage placeholder — clean validation, exit 4, item stays doing (tsk-1zo: previously shelled out to the placeholder text itself, "<word>: not found", exit 127) (435.955388ms)
  AssertionError [ERR_ASSERTION]: expected a clean validation refusal, got: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-HCBtB6/.fgos/config.json#runner; edit .fgos/config.json by hand to change.

  0 !== 4

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1zo-S3Jzpe/test/cli/fgos-return.test.mjs:482:10)
    ...
    actual: 0,
    expected: 4,
    operator: 'strictEqual',

test at test/cli/fgos-return.test.mjs:488:1
✖ return refuses a branch-source claim whose verify is still a discovery-stage placeholder — clean validation, exit 4, item stays doing (tsk-1zo) (440.404592ms)
  AssertionError [ERR_ASSERTION]: expected a clean validation refusal, got: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-62ypWh/.fgos/config.json#runner; edit .fgos/config.json by hand to change.

  0 !== 4
  ...
    actual: 0,
    expected: 4,
    operator: 'strictEqual',

ℹ tests 51
ℹ pass 49
ℹ fail 2
```

`result.status` came back `0` (not `4`) pre-fix: without the guard,
`return` still shells `runGoalCheck` out to the literal placeholder text,
gets a failed goal-check, and moves the item to `blocked` — a defined,
exit-0 outcome, not the clean validation refusal the fix adds.

## Passing-after proof

`bin/fgos.mjs`/`src/intake/discovery.mjs` restored to the real committed
fix (`facfb8e4`):

```
✔ return refuses a main-source claim whose verify is still a discovery-stage placeholder — clean validation, exit 4, item stays doing (tsk-1zo: previously shelled out to the placeholder text itself, "<word>: not found", exit 127) (428.769745ms)
✔ return refuses a branch-source claim whose verify is still a discovery-stage placeholder — clean validation, exit 4, item stays doing (tsk-1zo) (438.920791ms)

ℹ tests 51
ℹ pass 51
ℹ fail 0
```

Full whole-repo `npm test` (run separately, before this evidence capture):
3620 pass / 5 pre-existing skips / 0 fail.
