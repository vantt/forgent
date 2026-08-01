# tsk-32n — Iron Law evidence

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2/D3: this
item's diff touches `src/runner/dispatch.mjs` (a self-modifying-capable
module per `src/evolve/iron-law.mjs`'s `MODULE_RULES`) and its own
description matches the `schema`/`third-party` keyword flags, so
`classifyIronLaw` returns `required: true` and this evidence file is
persisted before return.

## classifyIronLaw result

```json
{
  "required": true,
  "matchedFlags": ["schema", "third-party"],
  "matchedModules": []
}
```

`matchedFlags: ["schema", "third-party"]` comes from the item's own
`description` text (adds a schema field, governs routing to a third-party
CLI provider), matched against `HEAVY_KEYWORDS`. `matchedModules` is empty
because the keyword match alone already made `required: true` — the module
list is illustrative, not gating (per RUL34, `docs/specs/runner.md`).

## Test command

```
node --test test/runner/dispatch.test.mjs
```

(the exact test file this item modifies — `npm test`'s whole-suite run is
also green, see below, but this is the same command run before and after
the implementation.)

## Before (red) — implementation reverted via a scoped `git stash`, test file left in place

`src/runner/dispatch.mjs` was stashed (`git stash push -u -- src/runner/dispatch.mjs`),
leaving the new/modified tests in the working tree pointed at the
pre-implementation code. Real command output:

```
✖ loadRunnerConfig rejects a "capacities.<id>" entry whose allowCrossProvider is not a boolean (0.668681ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (RunnerConfigError).

✖ resolveExecutorCommand throws when a kind:"cli" capacity resolves to a non-Claude command with no allowCrossProvider (0.510635ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (RunnerConfigError).

✖ resolveExecutorCommand throws for a non-Claude "cli" capacity even when fgosDir is given and the D6 registration/presence check already passed (1.133596ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (RunnerConfigError).
```

```
ℹ tests 88
ℹ pass 85
ℹ fail 3
```

(exactly the 3 new tests whose assertion is `assert.throws(...)` on the D2/D3
governance check — every other new test, which asserts `doesNotThrow`/normal
resolution, still passed without the implementation, as expected: nothing
blocks a dispatch that was never going to be blocked in the first place.)

## After (green) — implementation restored via `git stash apply` (same stash, dropped only after confirming green)

```
node --test test/runner/dispatch.test.mjs
ℹ tests 88
ℹ pass 88
ℹ fail 0
```

Full `npm test` (state + cli + runner + e2e suite) also green: 2041/2046
passed, 5 skipped, 0 fail (unaffected — same 5 pre-existing skips as the
pre-implementation baseline).

## detect_changes() scope check (AGENTS.md gate)

GitNexus's index was stale at the start of this session (predated this
session's `fgw/tsk-64p` merge into `fgw/tsk-32n`) — re-ran `npx gitnexus
analyze` in this worktree before trusting the result; a first `detect_changes`
run against the stale index mis-attributed this diff to unrelated symbols
(`teeChunk`, `cliSpawnAdapter`), confirming the staleness was real, not
theoretical. After re-indexing, `detect_changes({scope: "all"})` against the
real uncommitted diff: `risk_level: high`, changed symbols
`CLAUDE_CLI_COMMANDS`/`validateCapacityShape`/`resolveExecutorConfig`
(`src/runner/dispatch.mjs`) plus the two new `docs/specs/runner.md` sections
this item's RUL63 entry touches — 12 affected processes, every one tracing
to `resolveExecutorConfig`/`validateCapacityShape`
(`JudgeDecompose`/`JudgeDiscovery`/`EnsureRunnerConfig`/`SpawnWorker`
chains — the same functions `impact()` flagged CRITICAL before this item's
edits began). No unrelated symbol or process appears in the result — the
diff stayed inside the scope `plan.md` described. (`AGENTS.md`/`CLAUDE.md`
also showed as touched by the re-index's own auto-updated symbol-count
stamp — reverted before commit, not part of this item's actual diff.)
