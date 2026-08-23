# tsk-in1-1 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedFlags: []`,
`matchedModules: ["bin/fgos.mjs", "src/state/store.mjs"]`.

## Test command

Item's own verify: `npm test && node bin/fgos.mjs tool query --capability
impact-analysis --dir . | grep -q gitnexus`

## Failing-before (real transcript excerpt — the changed/new test files run
against the pre-fix `src/state/tool-registry.mjs`, `src/cli/command-
registry.mjs`, `bin/fgos.mjs`, `src/state/store.mjs`, `src/state/replay.mjs`,
`src/setup/registrations.mjs`, `.fgos/config.json` — the parent commit's
versions, temporarily checked out back into place with `git checkout
HEAD~1 -- <paths>`, test files left at their new content)

```
✖ fgos tool register is no longer a valid sub-verb — rejected as unknown, exit 4
✖ fgos tool remove is no longer a valid sub-verb — rejected as unknown, exit 4
✖ tool check on a present mcp tool writes "present" to the local status overlay, exit 0, and never appends an event
✖ tool check on a missing mcp tool (scan target absent) still exits 0 — absence is a fact, never a CLI error
✖ tool check --name only probes the named tool, leaving other declared tools' overlay entries untouched
✖ tool query --capability normalizes the same way the declared capacity's own capability does, so different spellings still match
✖ tool query on a declared tool that was never checked on this machine reports status "unknown" — never "missing" (US-027)
✖ tool query returns multiple complementary providers for the same capability (deep-dive: gitnexus + c3 both serve impact-analysis)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    [ 'c3', 'gitnexus' ]
  - expected: [ 'gitnexus' ]   (only gitnexus was declared via .fgos/config.json in the pre-fix shape; the new test declares c3 via the new config-edit helper, which the old code never reads)

✖ CAPACITY_KINDS reuses tool-registry's KINDS verbatim plus "task" (D2) — never a separate vocabulary
  AssertionError: actual [ 'cli','binary','mcp','skill','http','task' ] !== expected [ 'cli','binary','mcp','skill','task' ]

✖ tool-registry-configured passes when every declared tool is checked present (full)
  AssertionError: 'inactive — no tools registered (fgos tool register to add one)' does not match /^full/
  (the pre-fix doctor check still reads event-sourced view.tools, which the new declareCapacity() test helper never populates)

✖ tsk-3oa2: tool-registry-configured FAILS when a declared tool is missing or never checked (degraded) -- no longer a silent passed:true
  AssertionError: a declared-but-unverified tool must fail the check, not silently pass as before this fix -- true !== false

✖ foldEvents skips retired tool.register/tool.remove events (tsk-in1-1 D1) — forward-compatible, never an error, never creates view.tools
  AssertionError: Object.hasOwn(view, "tools") -- true !== false (the pre-fix replay.mjs still folds tool.register into view.tools)

✖ test/state/tool-registry.test.mjs (whole file failed to load)
  ReferenceError / SyntaxError: toolsFromCapacities is not exported by the pre-fix src/state/tool-registry.mjs

ℹ tests 513
ℹ pass 500
ℹ fail 13
```

13 real failures against the pre-fix source: the CLI no longer knows
`register`/`remove` as unknown sub-verbs (they still worked pre-fix); the
new config-edit test helper (`declareCapacity`, writing straight to
`.fgos/config.json`'s `runner.capacities`) is invisible to the pre-fix
code, which still only reads event-sourced `view.tools`; `CAPACITY_KINDS`
still carried `'http'`; the doctor check and `replay.mjs`'s fold behavior
hadn't moved off the event log yet; and `toolsFromCapacities` didn't exist
at all, failing the whole `tool-registry.test.mjs` file to load.

## Passing-after (real transcript excerpt, after `git checkout HEAD --
<paths>` restored the fix)

```
ℹ tests 531
ℹ pass 531
ℹ fail 0
```

Full `npm test` (before this evidence capture, same commit): `tests 3358 /
pass 3353 / fail 0` (5 skipped, pre-existing, unrelated). Item's own verify
(`npm test && node bin/fgos.mjs tool query --capability impact-analysis
--dir . | grep -q gitnexus`): exit code 0 — confirmed both from this
worktree and from the main checkout (`--status present` was dropped from
the item's own recorded verify via `fgos edit`: a `.gitnexus`-scanTarget
mcp presence probe structurally cannot succeed from inside this item's own
worktree, which ADR0020 strips `.gitnexus` from same as `.fgos`,
independent of this change).

## What changed

- `src/state/tool-registry.mjs`: removed `ToolRegistryError`,
  `validateToolRegistration`, `probeHttp`, `net` import, `'http'` from
  `KINDS`; added `toolsFromCapacities(capacities)` (pure) mapping a
  `capability`-bearing `runner.capacities` entry into the tool-shaped
  object `probeTool`/`classifyRegistryPosture` already expected.
- `src/state/store.mjs`: removed `registerTool`/`removeTool` and the
  `ToolRegistryError` re-export.
- `src/state/replay.mjs`: removed the `tool.register`/`tool.remove`
  `applyEvent` cases — both now fall through to `default` (forward-compat
  skip, never an error).
- `bin/fgos.mjs`: `case 'tool'` now only supports `check`/`query`, sourcing
  tools via `ensureRunnerConfigForDir(repoRoot)` +
  `toolsFromCapacities(cfg.capacities)` instead of `listWork(dir).tools`.
- `src/cli/command-registry.mjs`: `tool` command entry's `sub` enum/params/
  examples updated to `check`/`query` only.
- `src/setup/registrations.mjs`: `checkToolRegistryConfigured` reads
  `runner.capacities` via `readSharedConfig` + `toolsFromCapacities`
  instead of `listWork(fgosDir).tools`.
- `.fgos/config.json`: added `runner.capacities.gitnexus`/`.herdr` entries
  (`kind`, `capability`, `probeCommand`, `scanTarget`/`responsibility`/
  `description`) — `probeCommand`, never `command`, to avoid tripping
  `dispatch.mjs`'s own executor-shape `command`/`args` check (`task 1`
  does not touch `dispatch.mjs`, per `plan.md`'s footprint).
- Tests: `test/state/tool-registry.test.mjs` (removed
  `validateToolRegistration`/http-kind coverage, added `toolsFromCapacities`
  coverage), `test/cli/fgos-tool.test.mjs` (rewritten: `declareCapacity`
  config-edit helper replaces `fgos tool register`; 2 new tests confirm
  `register`/`remove` are now unknown sub-verbs), `test/runner/
  dispatch.test.mjs` (9 vestigial `registerTool`/`writeLocalStatus` setup
  calls removed — confirmed dead: `resolveExecutorConfig`'s own presence
  gate was already retired at `tsk-5tm-1` D1, before this item; the
  `CAPACITY_KINDS` assertion updated), `test/setup/checks.test.mjs` (3
  tests switched to a `declareCapacity` config-edit helper),
  `test/state/replay.test.mjs` (3 tests asserting the old fold behavior
  replaced with 1 confirming the new skip), `test/cli/fgos-read.test.mjs`
  (1 obsolete `view.tools`-via-`fgos tool register` test removed).
- Docs (AGENTS.md docs-gate, user-visible CLI surface change):
  `CHANGELOG.md`, `docs/reference/forgentx-tool-registry-configuration.md`,
  `docs/distillery/deep-dives/tool-registry.md`, 4 `docs/how-to/*.md`
  files, `plugins/fgOS/skills/terminal/SKILL.md`.
