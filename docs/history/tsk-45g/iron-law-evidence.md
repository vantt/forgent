# tsk-45g — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/setup/checks.test.mjs`

## Failing-before (real transcript excerpt, before this item's `bin/fgos.mjs` edit)

The regression test was written and committed (`docs(tsk-45g): lock
CONTEXT.md and add regression test...`, `9c4f3a4`) one commit before the
`bin/fgos.mjs` fix, and run against the still-unfixed `renderPretty`:

```
✔ fgos doctor --fix (CLI e2e) actually bootstraps gateBypass.level via the real fix (99.217244ms)
ℹ tests 51
ℹ suites 0
ℹ pass 50
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1175.879484

✖ failing tests:

test at test/setup/checks.test.mjs:304:1
✖ fgos doctor --fix --pretty (CLI e2e) renders a fix line green even when the fix found nothing to change (136.367175ms)
  AssertionError [ERR_ASSERTION]: expected a green mark on an already-correct fix line, got: [31m✗[0m fix: gate-bypass-configured (gateBypass.level already "off")
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-45g-O3htC3/test/setup/checks.test.mjs:316:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
```

## Passing-after (real transcript excerpt, after the fix)

```
ℹ tests 51
ℹ suites 0
ℹ pass 51
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1440.854717
```

`fgos return tsk-45g`'s own re-verify (full `node --test
test/setup/checks.test.mjs` run, independent of the transcript above)
confirms the same: `tests 51 / pass 51 / fail 0`.

## What changed

`bin/fgos.mjs`'s `renderPretty` (doctor branch, the `fixed` loop):
`formatCheck(f.changed, ...)` → `formatCheck(true, ...)`. A registered
fix's own contract (`{changed, message}`, no failing outcome — see
`docs/history/doctor-fix-pretty-status-line/CONTEXT.md` D1) means
`changed: false` is a success state ("already correct"), not a failure —
keying the fix line's color off it produced a red `✗` on a healthy no-op
fix (e.g. `gate-bypass-configured` when the level was already valid).
