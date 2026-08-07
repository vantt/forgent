# Iron Law evidence — `tsk-59x`

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2/D3:
`classifyIronLaw` (`src/evolve/iron-law.mjs`) against the item's final diff
(`changedFiles`, `src/runner/merge.mjs`) returned:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

`bin/fgos.mjs` is a self-modifying module, matched by module list alone.

## Test command

```
node --test test/state/cleanup-harness.test.mjs test/state/cleanup-pool.test.mjs
```

(the two test files this item added new cases to; the full item verify
command `node --test test/state/cleanup-harness.test.mjs && npm test &&
grep ... && ! grep ...` also passed in full — see
`docs/history/execution-fanout/CONTEXT-tsk-59x.md`/`plan-tsk-59x.md` for
the complete item record.)

## Before (red) — pre-implementation files (commit `0bd8178`)

`bin/fgos.mjs`, `src/setup/registrations.mjs`, `src/state/cleanup-
harness.mjs`, `src/state/cleanup-pool.mjs`, and `plugins/fgOS/skills/
cleanup-next/SKILL.md` were temporarily swapped to their pre-implementation
content (`git show 0bd8178:<path>`, the commit immediately before this
item's implementation commit), leaving the already-committed test files
(with this item's new tests) unchanged, then the command above was run:

```
ℹ tests 12
ℹ pass 10
ℹ fail 2
```

`test/state/cleanup-harness.test.mjs` failed to even load — a genuine red
state, not a soft assertion failure:

```
SyntaxError: The requested module '../../src/state/cleanup-harness.mjs'
does not provide an export named 'resolveTtlDaysForItem'
```

`test/state/cleanup-pool.test.mjs`'s own new leaf-aware test failed as
expected against code with no `leafTtlDays` threading:

```
✖ a leaf item (parent present in view) 1 day into cleanup is picked
  under leafTtlDays:0, even though root TTL is 7d
```

(The other two new `cleanup-pool.test.mjs` cases — root-excluded-under-
leafTtlDays and leafTtlDays-omitted-falls-back — pass unchanged under old
code too, since they assert behavior that was already correct before this
item; they are regression guards, not red-before tests.)

## After (green) — post-implementation files (commit `9d0d4cf`)

Files restored to the implementation commit (`git status` showed no diff
against HEAD after restoring), then the same command re-run:

```
ℹ tests 40
ℹ pass 40
ℹ fail 0
```

All 40 pass, including the 2 that were red above. The item's full verify
command (`node --test test/state/cleanup-harness.test.mjs && npm test &&
grep -q "leafTtlDays" plugins/fgOS/skills/cleanup-next/SKILL.md && !
grep -q "pickNextCleanupItem(view, rawEvents, { ttlDays })"
plugins/fgOS/skills/cleanup-next/SKILL.md`) also passed in full separately
(2735 pass / 5 skipped / 0 fail).
