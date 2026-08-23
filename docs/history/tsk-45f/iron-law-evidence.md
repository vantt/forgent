# tsk-45f — Iron Law evidence

`classifyIronLaw` at `approve` time is expected to match `bin/fgos.mjs`
and/or `src/runner/dispatch.mjs` — this item's real diff touches
`src/runner/dispatch.mjs` directly (pieces 1-3).

Verify command: `npm test` (`node --test 'test/**/*.test.mjs'`).

## Real failing-before/passing-after cycle, caught by `npm test`

Piece 1 added a real, previously-missing validation: `capacities.<id>.capability`
must now name an entry already declared in `runner.capabilities` (matching
`for`'s own existing discipline). Two pre-existing test files wrote raw
fixture `.fgos/config.json` files declaring a `capability` value with no
matching catalog entry — this was always a latent config-shape bug in the
real product (a real project with the same shape would have silently
produced an invisible tool, per `docs/reference/forgentx-tool-registry-
configuration.md`'s own prior "not yet enforced" note), and the new
validation caught it immediately, for real, the moment the full suite ran.

**Before (red)** — `npm test`, run after piece 2's edits landed (piece 1's
validation was already in the tree; this is the first point the full suite,
not just `dispatch.test.mjs`, actually exercised it against every fixture
in the repo):

```
AssertionError [ERR_ASSERTION]: fgos: added missing default config keys to /tmp/fgos-tool-registry-full-dykWRH/.fgos/config.json#runner: executor, modelPolicies, timeoutMs, parallel
fgos: runner config (/tmp/fgos-tool-registry-full-dykWRH/.fgos/config.json#runner capacities.echo-tool) "capability" entry "test-capability" is not declared in "capabilities" — add it there first (D4/D14/D15).

4 !== 0
    at TestContext.<anonymous> (file:///.../test/setup/checks.test.mjs:768:10)
```

and, in the same full run, `test/cli/fgos-tool.test.mjs`:

```
✖ tool query --status present filters out a declared-but-not-present tool after a real check (609.548166ms)
  SyntaxError: Unexpected end of JSON input
      at JSON.parse (.../test/cli/fgos-tool.test.mjs:31:25)

✖ tool query returns multiple complementary providers for the same capability (deep-dive: gitnexus + c3 both serve impact-analysis) (510.201686ms)
  SyntaxError: Unexpected end of JSON input
```

(The `SyntaxError` is the CLI subprocess's own stdout coming back empty
because `fgos tool check`/`fgos tool query` itself threw the new
`RunnerConfigError` on config load — the test harness's `envelopeData`
helper then fails trying to parse empty stdout as JSON, a real cascading
failure from the same root cause.)

**Root cause, confirmed by reading the two fixtures directly**: both files'
own `declareCapacity(cwd, id, { capability: 'test-capability', ... })`
(`checks.test.mjs`) and `declareGitnexus`/`declareCapacity` (`fgos-tool.test.mjs`)
wrote a `capability` value with no corresponding `runner.capabilities` entry
— exactly the gap piece 1's own validation exists to catch.

**After (green)** — fixed both fixture helpers to also register the
capability name into `cfg.runner.capabilities` (the same thing a real,
correctly-configured capacity would already do):

```
node --test test/setup/checks.test.mjs   → tests 100, pass 100, fail 0
node --test test/cli/fgos-tool.test.mjs  → tests 15, pass 15, fail 0
```

## Full suite, before and after the complete diff

`npm test`, run at the end of implementation (after all 3 pieces + fixture
fixes, before `fgos return`):

```
ℹ tests 3462
ℹ suites 0
ℹ pass 3457
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

## Real, non-fixture MCP hand-back coverage

`test/runner/dispatch.test.mjs`'s new `decideCapacityCli`/CLI-entry-point
tests exercise the exact real-world shape this item's own `verify` field
names — a `kind:"tool"` capacity with an `mcp` invocation's `tools` map,
resolved by `--for impact-analysis`, real subprocess spawn of
`dispatch.mjs decide` (not an in-process function call), asserting
`{mechanism:"in-process", mcpTool:"mcp__gitnexus__impact", configured:true,
capacityId:"gitnexus"}` — all passing, all real.

The full end-to-end demonstration against this repo's own live
`.fgos/config.json` (rather than an isolated fixture) is deferred to merge
time: `gitnexus`'s real config entry does not yet declare `for`/`tools`
(piece 1's step (b), the deferred direct-main-checkout config migration,
per this item's own `plan.md`) — the code proven here is byte-identical to
what will run against the real config once that one migration commit
lands.
