# Iron Law evidence — tsk-4bq

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-4bq`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/cli.mjs"
  ]
}
```

Matched via the `src/runner/` prefix rule (`src/evolve/iron-law.mjs`), not
a heavy-risk keyword.

## Verify command

```
npm test && grep -q -- "--cwd" src/runner/dispatch/cli.mjs && grep -q "fires out-of-process" .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "fires out-of-process" .claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md
```

## RED — pre-fix (`main` at commit `cd060ad1`, the trunk tip this item's
branch forked from)

```
$ git show cd060ad1:src/runner/dispatch/cli.mjs | grep -n -- "--cwd"; echo $?
1   # not found -- the execute/decide CLI subcommands accept no --cwd flag,
    # `executeExecutorCli`/`decideExecutorCli` always default to
    # process.cwd() (confirmed by direct read the same session this item
    # was investigated in)

$ git show cd060ad1:test/runner/dispatch.test.mjs | grep -n "respects --cwd flag"; echo $?
1   # not found -- neither of this item's two new test cases existed yet
```

## GREEN — post-fix (working tree at the real committed state on
`fgw/tsk-4bq`, `git status --short` clean before this run)

```
$ grep -n -- "--cwd" src/runner/dispatch/cli.mjs
596:      cwd: flagValue('--cwd') ?? flagValue('--dir'),
610:      cwd: flagValue('--cwd') ?? flagValue('--dir'),

$ grep -n "respects --cwd flag" test/runner/dispatch.test.mjs
4025:test('dispatch CLI execute subcommand respects --cwd flag', () => {
4047:test('dispatch CLI decide subcommand respects --cwd flag', () => {

$ grep -n "fires out-of-process" .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md .claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md
.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md:87:...it fires out-of-process directly via CLI subprocess execution...
.claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md:87:...it fires out-of-process directly via CLI subprocess execution...
```

Full `npm test` was also run clean against the final committed state,
independently (this session's own run, not the dispatched worker's own
self-report): **3659 passing, 0 failing, 5 skipped** (3664 total),
including both new `--cwd`-specific assertions
(`dispatch CLI execute subcommand respects --cwd flag`,
`dispatch CLI decide subcommand respects --cwd flag`) and the existing
skill-mirror consistency suite (`test/setup/skill-wrappers.test.mjs`,
`test/skills/fgos-mirror.test.mjs`) — confirming the `skill-wrappers.mjs`
generator fix (copying `references/` subdirectories, not just `SKILL.md`,
into `.claude/skills/`) did not break the existing wrapper-generation
contract for any other skill.
