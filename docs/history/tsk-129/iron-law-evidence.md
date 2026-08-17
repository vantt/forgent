# Iron Law evidence — tsk-129

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on this item's own branch
diff against trunk (`changedFiles`, `src/runner/merge.mjs`), run after the
real implementation commit (`c83564b5`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

Not a false positive: this item's own commit is the one that touches
`src/runner/dispatch.mjs` (wiring `onChunk` into the `execute` CLI
branch), so the match is real, not branch-ancestry noise.

Verify command (this item's own, `fgos list --id tsk-129 --json`):

```
node --test test/runner/dispatch.test.mjs
```

## Failing before (pre-implementation, real red state)

Test added first (`test/runner/dispatch.test.mjs`, "the \"execute\" CLI
entry point tees the spawned executor's own stdout/stderr chunks live to
this process's stderr..."), run against the unmodified CLI branch:

```
✖ the "execute" CLI entry point tees the spawned executor's own stdout/stderr chunks live to this process's stderr, and stdout still carries exactly one parseable JSON line (95.245395ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /out-chunk-1/. Input:

  'fgos: added missing default config keys to /tmp/fgos-dispatch-test-tQNuY4/.fgos/config.json#runner: parallel\n' +
    'fgos: dispatch capability=(none declared) executor=probe via=cli-spawn provider=/home/vantt/.nvm/versions/node/v24.18.0/bin/node model=sonnet tier=standard\n'

      expected: /out-chunk-1/,
      operator: 'match',
```

Confirms the real gap: the spawned executor's own `out-chunk-1`/
`out-chunk-2`/`err-chunk-1` writes never reached this process's `stderr` —
only the pre-existing "fgos: dispatch ..." start line did.

## Passing after (post-implementation)

`onChunk: (stream, chunk) => process.stderr.write(chunk)` wired into the
`execute` CLI branch's call to `executeExecutorCli`
(`src/runner/dispatch.mjs`, commit `c83564b5`):

```
$ node --test test/runner/dispatch.test.mjs
ℹ tests 264
ℹ suites 0
ℹ pass 264
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The new test passes and the full file's existing 263 tests stay green —
including every `executeExecutorCli`/`decideExecutorCli` test that calls
the function directly with `repoRoot` (never through the edited CLI
block), confirming the plan's own risk-map claim that those tests are
structurally unaffected.
