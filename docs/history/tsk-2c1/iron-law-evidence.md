# Iron Law evidence — tsk-2c1

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-2c1`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test --test-name-pattern="carries|purpose|resolveCapacityIdForPurpose" test/runner/dispatch.test.mjs
```

(Full scoped verify: `node --test --test-skip-pattern="declares the
submit-assist-classify capacity" test/runner/dispatch.test.mjs
test/skills/fgos-mirror.test.mjs` — 181/181 pass on the post-fix tree. The
skip pattern excludes one pre-existing test that reads the shared main
checkout's live `.fgos/config.json` directly — a concurrent session already
removed `submit-assist-classify` from it mid-session, unrelated to this
item's own footprint.)

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-2c1 committed content
(`git show HEAD~1:src/runner/dispatch.mjs`), the test file run as-is:

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2c1-VWwPS5/test/runner/dispatch.test.mjs:28
  CAPACITY_CARRIES,
  ^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not provide an export named 'CAPACITY_CARRIES'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

✖ test/runner/dispatch.test.mjs (51.988268ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

The pre-tsk-2c1 module has none of `CAPACITY_CARRIES`,
`resolveCapacityIdForPurpose`, or `logCapacityDispatch` — the whole test
file fails to even load, the same class of failing-before evidence
`tsk-3ik-1`'s own iron-law-evidence.md records for an equivalent new-export
addition.

## Passing-after transcript

`src/runner/dispatch.mjs` restored to its committed (post-tsk-2c1) content,
same test selection:

```
✔ loadRunnerConfig accepts a "capacities.<id>" entry with a valid carries value (2.187734ms)
✔ loadRunnerConfig rejects a "capacities.<id>" entry whose carries is not one of CAPACITY_CARRIES (1.108198ms)
✔ resolveExecutorCommand throws when a capacity declares carries but the caller declares no contentCarries at all (fail closed, never silently allow) (0.2806ms)
✔ resolveExecutorCommand refuses a "carries: user-text" capacity handed repo-content — refused before spawn (D15 verify item 8) (0.255122ms)
✔ resolveExecutorCommand accepts a "carries: user-text" capacity handed user-text (exact match) (0.309664ms)
✔ resolveExecutorCommand accepts a "carries: repo-content" capacity handed EITHER content class — the wider permission covers both (0.417115ms)
✔ resolveExecutorCommand never triggers the carries gate for a capacity that declares no carries at all — byte-identical to every pre-D15 capacity (0.269416ms)
✔ resolveCapacityIdForPurpose finds the capacity whose own "for" matches the purpose, regardless of the capacity id's own name (0.223895ms)
✔ resolveCapacityIdForPurpose returns null when no capacity declares that purpose — a legitimate state, never thrown (0.129516ms)
✔ resolveCapacityIdForPurpose returns null against an empty/missing capacities block (0.109327ms)
✔ decideCapacityCli resolves "unavailable" when nothing is registered for the given purpose — the expected default state before any gather capacity exists (2.365795ms)
✔ decideCapacityCli resolves purpose-based (--for) to the same result a positional capacityId would, plus the resolved capacityId (1.08197ms)
✔ resolveCapacityCli throws when no capacity is registered for the given purpose — nothing left to resolve (0.781186ms)
✔ resolveCapacityCli resolves purpose-based (--for) to the same command a positional capacityId would, plus the resolved capacityId; carries repo-content clears the gate (14.737048ms)
✔ resolveCapacityCli propagates the carries refusal for a purpose-resolved capacity exactly like a name-resolved one (6.790704ms)
✔ the "decide" CLI entry point resolves --for <purpose> the same way as a positional capacityId (64.557495ms)
✔ the "resolve" CLI entry point honors --carries, threading it through end to end (84.660318ms)

ℹ tests 21
ℹ pass 21
ℹ fail 0
```

`git status --porcelain src/runner/dispatch.mjs` was empty after the
restore (byte-identical to the committed tree) before this passing run —
confirming the pass is against the real committed implementation, not a
leftover working-tree edit.
