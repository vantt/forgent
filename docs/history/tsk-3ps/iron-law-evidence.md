# Iron Law evidence — tsk-3ps

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-3ps`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs"]}
```

Matched via the `src/runner/` prefix rule (`src/evolve/iron-law.mjs`), not
a heavy-risk keyword.

## Verify command

```
node --test test/runner/dispatch.test.mjs
```

Full run against the real committed state (`cc0a648e`): **299 passing, 0
failing**, including the new test added by this item.

## RED — pre-fix (`cli.mjs` reverted to its content at the parent commit,
`af445633`, the tip this item's implementation commit `cc0a648e` was built
on; the new test file stays at its real, final content throughout — only
`cli.mjs` was temporarily reverted)

```
$ git checkout af445633 -- src/runner/dispatch/cli.mjs
$ node --test --test-name-pattern="prompt-file" test/runner/dispatch.test.mjs

✖ the "execute" CLI entry point accepts --prompt-file, overrides --prompt when both given, and structured-errors on bad file path
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + ''
  - 'content-from-file'
      at TestContext.<anonymous> (test/runner/dispatch.test.mjs:3476:10)
  tests 1
  pass 0
  fail 1
```

The pre-fix `execute` case parsed only `--prompt`, so `--prompt-file` was
silently ignored and the spawned echo executor received an empty prompt
instead of the file's content — the real, pre-existing gap this item
closes.

## GREEN — post-fix (working tree restored to the real committed state,
`git status --short` clean before this run)

```
$ git checkout HEAD -- src/runner/dispatch/cli.mjs
$ git status --short
(clean)
$ node --test --test-name-pattern="prompt-file" test/runner/dispatch.test.mjs

✔ the "execute" CLI entry point accepts --prompt-file, overrides --prompt when both given, and structured-errors on bad file path
  tests 1
  pass 1
  fail 0
```

Full `node --test test/runner/dispatch.test.mjs` was also run clean
against the final committed state before `fgos return`: **299 passing, 0
failing** (up from 298 pre-fix — the one new test this item added).
