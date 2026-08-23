# Iron Law evidence — tsk-3av

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-3av`):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/dispatch.mjs",
    "src/runner/dispatch/cli.mjs",
    "src/state/store.mjs"
  ]
}
```

## Verify command

```
npm test && grep -q "case 'fanout-batch'" src/runner/dispatch/cli.mjs && grep -q -- "--candidates" bin/fgos.mjs && grep -q "fanout-batch" .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "fanout-batch" .claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "fanout-batch" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && ! grep -q "JSON.parse(process.argv\[1\]).worktreePath" .agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md
```

## Context: out-of-process dispatch, driver found real defects, drove a fix

Mechanism resolved `out-of-process` (`.fgos/config.json`'s
`capabilities.fgos-coding-implement.prefer: agy`). The dispatched worker
(`agy`) exited status 1 reporting only `Error: timeout waiting for
response` (no `[DONE]`/`[BLOCKED]` token — a Layer 1 rule 4 violation) but
had, in fact, already committed real work (`439dc219`) before that
failure. Per the coding-worker-contract's own "never take the caller's
word for it," the driver read the real committed diff directly rather
than trusting either the crash or an absent status token, and found three
real defects the worker's own two new tests never exercised (both avoid
the actual out-of-process pick/execute/return code path). The driver
fixed all three directly (`e4dc2f89`) and added one real end-to-end test
that exercises the exact path the bugs lived in — this is that test's own
failing-before/passing-after transcript, the closest available
"failing-test-first" proof for a defect found by review rather than
written test-first from scratch.

## RED — the new end-to-end test, run against the worker's own commit
(`439dc219`) before the driver's fix

```
$ node --test --test-name-pattern="fanoutBatchExecutorCli: real end-to-end" test/runner/dispatch.test.mjs
✖ fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (...)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  1 !== 0
      at TestContext.<anonymous> (file:///.../test/runner/dispatch.test.mjs:4451:10)
    actual: 1,
    expected: 0,
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Root cause, found by direct trace of the real error captured in
`result.fired[0].error` before the fix:

```
Error: Cannot find module '/tmp/<fixture>/bin/fgos.mjs'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1517:15)
```

`fanoutBatchExecutorCli` resolved `bin/fgos.mjs`'s own path as
`path.join(root, 'bin', 'fgos.mjs')` — coupled to the caller-supplied
`root` instead of this module's own file location. Two further defects
confirmed by direct code read alongside it (both would have failed the
same way against a real repo root, just past the first one):
`--dir <fgosDir>` passed to `pick`/`return` instead of the repo root
(`dataDir()` in `bin/fgos.mjs` always derives `.fgos` from `--dir` itself,
doubling the suffix into a nonexistent `<root>/.fgos/.fgos`), and
`picked.worktreePath || picked.path` reading a shape that never exists —
every `fgos.mjs` response is wrapped in the `fgos.v1` envelope, so the
real path is `picked.data.worktree.path`.

## GREEN — post-fix (working tree at the real committed state on
`fgw/tsk-3av`, `git status --short` clean before this run)

```
$ node --test --test-name-pattern="fanoutBatchExecutorCli: real end-to-end" test/runner/dispatch.test.mjs
✔ fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (...) (335.74647ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full `npm test` was also run clean against the final committed state,
independently (this session's own run, not the dispatched worker's own
self-report): **3691 passing, 0 failing, 5 skipped** (3696 total),
including the skill-mirror consistency suite (`test/skills/fgos-mirror
.test.mjs`, 13/13) and the repo's own decision-citation-drift baseline
check (`test/scripts/check-decision-citation-drift.test.mjs`) — the
latter caught and forced a fix of the driver's own first attempt at the
Known-hazard note, which bare-cited "D5" inside skill prose (decision
0017: inline the content, never the id, in shippable skill prose).

The full item verify command (above) was also run standalone, all 6
POSITIVE/NEGATIVE checks plus `npm test` green.
