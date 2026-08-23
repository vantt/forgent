# Iron Law evidence — tsk-3xd

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2: this
item's final diff, run through the same `classifyIronLaw` the `approve`
gate itself uses, came back `required: true`.

```json
{
  "required": true,
  "matchedFlags": [
    "migration",
    "schema",
    "mất dữ liệu"
  ],
  "matchedModules": []
}
```

These flags are keyword hits against the item's own `description` text
(which discusses `SCHEMA_VERSION`, precedent for schema-additive fields,
and quotes tsk-535's own "mất-dữ-liệu" framing) — not an actual migration
or real data-loss risk in the diff itself. The change is a pure additive
optional field (`action`), no `SCHEMA_VERSION` bump, no backfill, no
touched historical event. Recorded here plainly rather than silently
skipped, per D2's own mechanical-reuse rule (no separate early-prediction
heuristic).

## Test command

```
node --test --test-name-pattern="tsk-3xd D2" test/intake/plan.test.mjs
```

## Failing-test-first proof (before the fix)

With `normalizeChild`'s new `action`/D-ID-citation check temporarily
disabled (commented out) in `src/intake/plan.mjs`, the same command
above produced 2 real failures — the two tests that actually assert the
new requirement:

```
✖ judgeDecompose returns invalid when any child is missing action (tsk-3xd D2, mirrors the missing-verify rule) (30.084403ms)
✖ judgeDecompose returns invalid when a child action cites a D-ID that was never locked in the parent CONTEXT.md (tsk-3xd D2) (23.699832ms)
✔ judgeDecompose accepts a child action citing a real D-ID from the parent CONTEXT.md (tsk-3xd D2) (24.042952ms)
✔ judgeDecompose accepts any non-empty action when the parent CONTEXT.md has no "## Locked decisions" section at all (tsk-3xd D2 graceful degrade, mirrors findUncoveredLockedDecisions's own precedent) (22.081149ms)
ℹ tests 4
ℹ pass 2
ℹ fail 2
```

Real assertion diff from the disabled-check run (child citing a never-
locked `D9` is wrongly accepted as `decompose` instead of `invalid`):

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

  {
+   children: [
+     {
+       action: 'D9: a decision that was never locked.',
+       deps: [],
+       footprint: undefined,
+       kind: undefined,
+       refs: [],
+       risk: undefined,
+       title: 'Build parser',
+       verify: 'npm test -- parser'
+     }
+   ],
+   kind: 'decompose',
+   reason: 'Two independent surfaces, no shared state'
-   kind: 'invalid'
  }
```

## Passing proof (after the fix)

Restoring the real `normalizeChild` (as committed), same command:

```
✔ judgeDecompose returns invalid when any child is missing action (tsk-3xd D2, mirrors the missing-verify rule) (28.95405ms)
✔ judgeDecompose returns invalid when a child action cites a D-ID that was never locked in the parent CONTEXT.md (tsk-3xd D2) (24.213713ms)
✔ judgeDecompose accepts a child action citing a real D-ID from the parent CONTEXT.md (tsk-3xd D2) (22.671393ms)
✔ judgeDecompose accepts any non-empty action when the parent CONTEXT.md has no "## Locked decisions" section at all (tsk-3xd D2 graceful degrade, mirrors findUncoveredLockedDecisions's own precedent) (23.935376ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Broader verify

The item's own recorded verify, `node --test test/intake/plan.test.mjs`
(113 tests), and the full repo suite (`node --test 'test/**/*.test.mjs'`,
2701 tests) both pass, with one pre-existing, unrelated failure noted and
left untouched (see item decision log): `docs/architecture-manifest.json`
was already missing two `src/util/*.mjs` rows before this branch existed
(confirmed via `git log`, last touched at merge `71c0d4e`) — out of this
item's scope.
