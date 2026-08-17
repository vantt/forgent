# Iron Law evidence — tsk-225

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-225'];
const filesChanged = changedFiles('/home/vantt/projects/forgentX', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
"
```

Result (post-commit, real diff): `{"required":true,"matchedFlags":[],
"matchedModules":["bin/fgos.mjs","src/runner/dispatch.mjs",
"src/runner/loop.mjs"]}` — `src/runner/dispatch.mjs`/`loop.mjs` match
`MODULE_RULES`'s `src/runner/` prefix rule.

## Failing-test-first proof

The representative case: implementation's own reality-check found a real,
consequential bug beyond the two already caught at the validating gate —
inside `resolveExecutorConfig`, the mechanical rename collapsed two
previously-distinct local variables (the raw catalog entry, and the
function's own already-existing final resolved dispatch shape) into the
same identifier `executor`, producing a real
`SyntaxError: Identifier 'executor' has already been declared` the first
time the full suite ran. Fixed by naming the raw entry `executorEntry`
throughout that function scope, keeping `executor` for the final resolved
shape — also fixing a second, silent correctness bug the same collision
would have caused: `allowCrossProvider` governance read from the WRONG
variable (the final resolved shape never carries that field for
`invocations[]`-shaped entries like `agy`; only the raw entry does).

**Red** (real fix temporarily reverted in-place — `executorEntry` renamed
back to `executor` throughout `resolveExecutorConfig`'s own body,
reproducing the exact bug this item's own implementation pass hit live):

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-225-lNtNqx/src/runner/dispatch.mjs:1221
  const executor = byExecutor ?? (cfg && cfg.executor);
        ^

SyntaxError: Identifier 'executor' has already been declared
    at compileSourceTextModule (node:internal/modules/esm/utils:318:16)
    ...
```

```
node --test test/runner/dispatch.test.mjs
✖ test/runner/dispatch.test.mjs (52.200877ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**Green** (fix restored — `git status --short src/runner/dispatch.mjs`
after restore: clean, no diff, byte-identical to the committed state):

```
node --test test/runner/dispatch.test.mjs
ℹ tests 263
ℹ pass 263
ℹ fail 0
```

## Full suite

`npm test`: 3477 pass / 0 fail / 5 skipped — unchanged from the baseline
`tsk-34n` left on `main` (3477/0/5), confirming this item's full rename
introduced zero regressions once all findings below were fixed.

## Additional real findings from implementation (see `plan.md`'s own
## "Implementation addendum" for full detail)

- `bin/fgos.mjs`, `scripts/dispatch-decide-hook.mjs`,
  `scripts/project-agents.mjs`, `scripts/check-decision-codes.baseline.json`
  — real callers/references outside `CONTEXT.md`'s own scout enumeration,
  found only once `npm test` exercised them (each produced its own real
  `SyntaxError`/`AssertionError` before being fixed, same discipline as
  the representative case above — not individually transcribed here to
  avoid repeating the same red/green shape four more times).
- Live `.fgos/config.json`'s rename target `runner.executors` collides
  (in name only, not in meaning) with an already-retired, historically
  inert field of the exact same name (`executors.<tier>`, retired
  `tsk-in1-2` D6). One test asserting that inert property no longer holds
  once D1 gives the name real, validated meaning — fixed to assert the
  new, correct behavior instead.
- ~10 historical path citations (to `docs/decisions/0026`'s own filename,
  or to `docs/history/*capacity*/` directories) were mechanically
  corrupted mid-citation by the same rename that correctly touched
  everything around them — confirmed each against the real path on disk
  and reverted (D2/D3: those specific paths were deliberately never
  renamed).
- The item's own `verify` command was corrected once these legitimate
  historical citations were confirmed real and intentional — an
  unconditional `grep -rqE "capacit" src test` would forever fail against
  8 lines that are supposed to keep saying "capacity"; the command now
  excludes exactly those known, enumerable citations.

## Live migration proof

Real `.fgos/config.json` migrated: `runner.capacities` → `runner.executors`
(committed to `main` directly, `7896f597`, alongside `tsk-34n`'s own
still-uncommitted D3 migration from earlier this session). `npm test`
against the migrated config: 3477 pass / 0 fail / 5 skipped, including the
`committedRunnerConfig()`-based tests that read the real committed
`.fgos/config.json` via `git show HEAD:.fgos/config.json` from the main
checkout.
