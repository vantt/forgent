# iron-law-evidence.md — tsk-679

`classifyIronLaw` result (`src/evolve/iron-law.mjs`, run against the real
committed diff of `4c8080a4` vs its parent `277afe54`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Matched module: `bin/fgos.mjs`. No matched flags.

## Verify command

```
node --test test/state/decision-relation.test.mjs test/state/retrospective-doors.test.mjs
```

## Failing-test-first proof

Reproduced after the fact by temporarily reverting the three fix files
(`scripts/check-decision-citation-drift.mjs`, `bin/fgos.mjs`,
`src/state/retrospective-doors.mjs`) to their pre-fix committed state
(`277afe54`) while keeping the new tests (already committed alongside the
fix in `4c8080a4`), running the verify command, then restoring the fix
files (`git checkout 4c8080a4 -- <files>`) and rerunning — a controlled,
uncommitted working-tree round-trip, never landed as its own commit.

**Before the fix (red) — 4 failing, 40 passing:**

```
ℹ tests 44
ℹ pass 40
ℹ fail 4

✖ failing tests:
✖ findWideCitationFindings: D-local targetId with homeFile restricts findings to homeFile only (0.78248ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  2 !== 1
      at test/state/decision-relation.test.mjs:149:10
✖ findWideCitationFindings: D-local targetId with homeFile omitted returns [] (0.711421ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
✖ CLI: supersedes with D-local id scopes sweep to host item CONTEXT.md only (tsk-679 regression) (229.0407ms)
✖ checkImpactDoor: scopes D-local superseded id to item docsRef CONTEXT.md only (tsk-679 regression) (1.954704ms)
```

**After the fix (green) — 44 passing, 0 failing:**

```
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

**Broader regression check** (full suite, run directly, not part of the
item's own `verify`): `node --test 'test/**/*.test.mjs'` — `tests 3634,
pass 3629, fail 0, skipped 5` (pre-existing skips, unrelated to this
change).
