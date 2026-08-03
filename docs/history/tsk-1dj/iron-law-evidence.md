# tsk-1dj — Iron Law evidence

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2/D3: this
item's final diff touches `bin/fgos.mjs` (a self-modifying-capable module per
`src/evolve/iron-law.mjs`'s `MODULE_RULES`), so `classifyIronLaw` returns
`required: true` and this evidence file is persisted before return.

## classifyIronLaw result

```json
{
  "required": true,
  "matchedFlags": ["schema"],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`matchedFlags: ["schema"]` comes from the item's own `description` text
(quoting the *source* repository's SQL schema files,
`scripts/schema/003/005-*.sql` in repository-harness — not anything in this
repo), matched case-insensitively against `HEAVY_KEYWORDS`. `matchedModules`
is `bin/fgos.mjs`, since this item adds a `case 'tool':` dispatch block
there.

## Test command

```
node --test test/state/tool-registry.test.mjs test/cli/fgos-tool.test.mjs test/state/replay.test.mjs test/setup/checks.test.mjs
```

(the full set of new/extended test files this item adds — `npm test`'s
whole-suite run is also green, see below, but this is the exact
failing-test-first pair: the same command, before and after the
implementation.)

## Before (red) — implementation reverted via a scoped `git stash`, test files left in place

Real command output, `test/state/tool-registry.test.mjs` did not even load
(the module it imports did not exist yet):

```
✖ tool register creates exactly one tool.register event and folds into view.tools, exit 0 (143.364642ms)
✔ tool register with a duplicate --name is rejected as validation, exit 4, no extra event written (208.423534ms)
✔ tool register with an out-of-domain --kind is rejected as validation, exit 4 (128.613055ms)
✔ tool register for kind mcp/skill without --scan is rejected as validation, exit 4 (128.239252ms)
✖ tool register for kind cli does not require --scan (124.967691ms)
✖ tool remove deletes the registration, exit 0, and a subsequent query no longer lists it (180.463701ms)
✔ tool remove on a name that was never registered is rejected as validation, exit 4 (105.957109ms)
✖ tool check on a present mcp tool writes "present" to the local status overlay, exit 0, and never appends an event (168.101077ms)
✖ tool check on a missing mcp tool (scan target absent) still exits 0 — absence is a fact, never a CLI error (158.837386ms)
✖ tool check --name only probes the named tool, leaving other registered tools' overlay entries untouched (198.198391ms)
✔ tool check --name on an unregistered name is rejected as validation, exit 4 (108.648726ms)
✖ tool check on kind http resolves present/missing via a real TCP probe (174.059576ms)
✖ tool query with no tools registered for a capability returns an empty provider set, not an error (116.530629ms)
✖ tool query --capability normalizes the same way register does, so different spellings still match (156.862243ms)
✖ tool query on a registered tool that was never checked on this machine reports status "unknown" — never "missing" (US-027) (167.921782ms)
✖ tool query --status present filters out a registered-but-not-present tool after a real check (209.462379ms)
✖ tool query returns multiple complementary providers for the same capability (deep-dive: gitnexus + c3 both serve impact-analysis) (205.529432ms)
✔ fgos tool with an unknown sub-verb is rejected as validation, exit 4 (112.905213ms)
✔ fgos tool with no sub-verb at all is rejected as validation, exit 4 (115.648812ms)
✖ DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus main-checkout-hook-wired and tool-registry-configured (2.523453ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    [ 'config-not-stale', 'main-checkout-hook-wired', 'node-version-and-git', 'shell-integration-sourced' ]
  - [ 'config-not-stale', 'main-checkout-hook-wired', 'node-version-and-git', 'shell-integration-sourced', 'tool-registry-configured' ]

test at test/setup/checks.test.mjs:39:1
✖ tool-registry-configured always passes — inactive is a clean skip, never a failure (0.556502ms)
  AssertionError [ERR_ASSERTION]: DOCTOR_CHECKS is missing "tool-registry-configured"

test at test/state/replay.test.mjs:742:1
✖ foldEvents folds tool.register into view.tools keyed by name (0.565707ms)
  TypeError: Cannot read properties of undefined (reading 'gitnexus')

test at test/state/replay.test.mjs:755:1
✖ foldEvents folds tool.remove by deleting the keyed entry (0.269076ms)
  TypeError: Cannot read properties of undefined (reading 'gitnexus')

test at test/state/replay.test.mjs:764:1
✖ foldEvents' tool.register is a full-record overwrite, never a merge with a prior registration under the same name (0.270848ms)
  TypeError: Cannot read properties of undefined (reading 'gitnexus')

test at test/state/tool-registry.test.mjs:1:1
✖ test/state/tool-registry.test.mjs (111.720218ms)
  'test failed'

ℹ tests 121
ℹ pass 103
ℹ fail 18
```

(121 not 142 — `tool-registry.test.mjs` failed to load as a whole module,
so `node --test` could not even enumerate its individual cases in this run;
the 103 passes are the validation-error-path tests that never touched the
missing code.)

## After (green) — implementation restored via `git stash apply` (same stash, not popped)

```
ℹ tests 142
ℹ pass 142
ℹ fail 0
```

Full `npm test` (state + cli + runner + e2e suite) also green: 1916/1916,
0 fail (one unrelated flake in `test/intake/discovery.test.mjs` — a live
judge-executor timing test untouched by this item's diff — reproduced as
flaky by re-running the full suite twice: failed once under load, passed in
isolation, and passed clean on the second full run).
